-- LG Agenda V2 FINAL - rode UMA VEZ no SQL Editor do Supabase existente.
-- Não apaga dados.

alter table public.businesses add column if not exists owner_whatsapp text;
alter table public.businesses add column if not exists access_status text default 'active';
alter table public.businesses add column if not exists blocked_at timestamptz;
alter table public.businesses add column if not exists blocked_reason text;
alter table public.businesses add column if not exists onboarding_completed_at timestamptz;

alter table public.subscriptions add column if not exists started_at timestamptz default now();
alter table public.subscriptions add column if not exists grace_until timestamptz;
alter table public.purchase_entitlements add column if not exists started_at timestamptz default now();

alter table public.businesses alter column tolerance_minutes set default 0;
alter table public.businesses alter column min_notice_minutes set default 60;
alter table public.businesses alter column booking_window_days set default 30;

-- Compatibilidade para registros já existentes.
update public.businesses set access_status='active' where access_status is null;
update public.subscriptions set started_at=coalesce(started_at,updated_at,now()) where started_at is null;
update public.subscriptions set grace_until=paid_until + interval '48 hours' where paid_until is not null and grace_until is null;
