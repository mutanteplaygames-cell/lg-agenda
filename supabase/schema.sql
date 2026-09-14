create extension if not exists pgcrypto;

create table if not exists businesses(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  business_type text not null default 'other',
  whatsapp text,
  address text,
  bio text,
  logo_url text,
  cover_url text,
  primary_color text default '#198754',
  theme_mode text default 'light',
  tolerance_minutes int default 10,
  min_notice_minutes int default 60,
  booking_window_days int default 30,
  subscription_status text default 'inactive',
  created_at timestamptz default now()
);

create table if not exists categories(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists professionals(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  role text not null default 'Profissional',
  photo_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists professional_categories(
  business_id uuid not null references businesses(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key(professional_id,category_id)
);

create table if not exists services(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  price_cents int not null check(price_cents >= 0),
  duration_minutes int not null check(duration_minutes > 0),
  buffer_minutes int default 0 check(buffer_minutes >= 0),
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists professional_services(
  business_id uuid not null references businesses(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key(professional_id,service_id)
);

create table if not exists weekly_schedules(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  weekday int not null check(weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  lunch_start time,
  lunch_end time
);

create table if not exists schedule_blocks(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists customers(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz default now(),
  unique(business_id,phone)
);

create table if not exists appointments(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  professional_id uuid not null references professionals(id),
  service_id uuid not null references services(id),
  customer_id uuid not null references customers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_override_minutes int,
  status text default 'scheduled',
  price_cents int not null,
  notes text,
  reminder_opt_in boolean default false,
  reminder_at timestamptz,
  reminder_status text default 'disabled',
  reminder_sent_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists appointments_professional_time on appointments(professional_id, starts_at, ends_at);
create index if not exists appointments_business_time on appointments(business_id, starts_at);

create table if not exists subscriptions(
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade unique,
  provider text,
  provider_payment_id text,
  provider_subscription_id text,
  plan text,
  status text,
  whatsapp_addon boolean default false,
  whatsapp_limit int default 500,
  whatsapp_sent_current_period int default 0,
  paid_until timestamptz,
  updated_at timestamptz default now()
);

create table if not exists support_threads(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists support_messages(
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references support_threads(id) on delete cascade,
  sender text not null check(sender in ('business','master')),
  body text not null,
  created_at timestamptz default now()
);

alter table businesses enable row level security;
alter table categories enable row level security;
alter table professionals enable row level security;
alter table professional_categories enable row level security;
alter table services enable row level security;
alter table professional_services enable row level security;
alter table weekly_schedules enable row level security;
alter table schedule_blocks enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table subscriptions enable row level security;
alter table support_threads enable row level security;
alter table support_messages enable row level security;

create or replace function owns_business(bid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from businesses b where b.id=bid and b.owner_id=auth.uid());
$$;

-- owner policies: cada usuário só enxerga e altera o próprio tenant
create policy "owner businesses select" on businesses for select using(owner_id=auth.uid());
create policy "owner businesses insert" on businesses for insert with check(owner_id=auth.uid());
create policy "owner businesses update" on businesses for update using(owner_id=auth.uid()) with check(owner_id=auth.uid());

create policy "owner categories all" on categories for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner professionals all" on professionals for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner professional categories all" on professional_categories for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner services all" on services for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner professional services all" on professional_services for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner schedules all" on weekly_schedules for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner blocks all" on schedule_blocks for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner customers all" on customers for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner appointments all" on appointments for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner subscriptions select" on subscriptions for select using(owns_business(business_id));
create policy "owner support threads all" on support_threads for all using(owns_business(business_id)) with check(owns_business(business_id));
create policy "owner support messages select" on support_messages for select using(exists(select 1 from support_threads t where t.id=thread_id and owns_business(t.business_id)));
create policy "owner support messages insert" on support_messages for insert with check(sender='business' and exists(select 1 from support_threads t where t.id=thread_id and owns_business(t.business_id)));

create table if not exists purchase_entitlements(
  owner_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null,
  provider_payment_id text not null,
  plan text not null,
  status text not null default 'active',
  whatsapp_addon boolean default false,
  paid_until timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table purchase_entitlements enable row level security;
create policy "owner entitlement select" on purchase_entitlements for select using(owner_id=auth.uid());

-- LG Agenda V2 final: assinatura, bloqueio e onboarding
alter table businesses add column if not exists owner_whatsapp text;
alter table businesses add column if not exists access_status text default 'active';
alter table businesses add column if not exists blocked_at timestamptz;
alter table businesses add column if not exists blocked_reason text;
alter table businesses add column if not exists onboarding_completed_at timestamptz;
alter table subscriptions add column if not exists started_at timestamptz default now();
alter table subscriptions add column if not exists grace_until timestamptz;
alter table purchase_entitlements add column if not exists started_at timestamptz default now();

-- novos estabelecimentos não recebem dados demo; o sistema cria apenas o tenant.
alter table businesses alter column tolerance_minutes set default 0;
alter table businesses alter column min_notice_minutes set default 60;
alter table businesses alter column booking_window_days set default 30;

-- V2.6: meses de agenda liberados manualmente pelo estabelecimento
create table if not exists released_agenda_months(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  month_start date not null,
  created_at timestamptz default now(),
  unique(business_id, month_start)
);
alter table released_agenda_months enable row level security;
do $$ begin
  create policy "owner released agenda months all" on released_agenda_months
  for all using(owns_business(business_id)) with check(owns_business(business_id));
exception when duplicate_object then null; end $$;
create index if not exists released_agenda_months_business_month on released_agenda_months(business_id, month_start);
