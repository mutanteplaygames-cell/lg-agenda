-- LG Agenda V2.11 - Multi-segmento
-- Execute uma vez no Supabase SQL Editor.

alter table public.businesses
  add column if not exists business_type text not null default 'other';

alter table public.professionals
  alter column role set default 'Profissional';

-- Mantém clientes existentes funcionando normalmente.
update public.businesses
set business_type = 'other'
where business_type is null or trim(business_type) = '';
