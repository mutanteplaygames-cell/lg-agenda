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

create index if not exists released_agenda_months_business_month
on released_agenda_months(business_id, month_start);
