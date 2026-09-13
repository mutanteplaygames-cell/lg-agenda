-- LG Agenda V2.8 — observações de agendamento
alter table public.appointments add column if not exists notes text;

comment on column public.appointments.notes is 'Observação opcional informada pelo cliente ou pelo estabelecimento para este atendimento.';
