# LG Agenda V2 Final

Principais ajustes desta versão:

- Fluxo pós-pagamento persistente: conta paga sem estabelecimento volta ao onboarding após login.
- Todos os links internos usam o domínio atual/origem do site; Mercado Pago usa NEXT_PUBLIC_SITE_URL.
- Admin Geral oculto para clientes e protegido por MASTER_EMAILS + validação server-side.
- Estabelecimentos novos sem funcionários, categorias, serviços ou dados de demonstração.
- Datas e horários no padrão pt-BR / America/Sao_Paulo.
- Plano real no painel: ativação, vencimento, dias restantes e tolerância de 48h.
- Bloqueio manual pelo Master e bloqueio efetivo após fim da tolerância.
- Link público também é bloqueado quando o acesso está bloqueado/expirado.
- Renovação e upgrade pelo painel do cliente usando Mercado Pago.
- Master pode alterar plano, bloquear/desbloquear e abrir WhatsApp de renovação.
- WhatsApp do responsável capturado no onboarding.
- Chat de suporte real via Supabase entre estabelecimento e Admin Geral.
- Ranking e métricas usam dados reais do banco.
- Agendamento público usa dados reais do Supabase e antecedência mínima de 1 hora.
- Lembrete manual usa data DD/MM/AAAA e horário local correto.

## Antes do deploy

1. Rode `supabase/migration-v2-final.sql` no SQL Editor do projeto Supabase existente.
2. Confirme na Vercel:
   - NEXT_PUBLIC_SITE_URL=https://lg-agenda.vercel.app
   - SUPABASE_URL e NEXT_PUBLIC_SUPABASE_URL com a URL correta do projeto
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - MERCADO_PAGO_ACCESS_TOKEN de produção
   - MASTER_EMAILS com o(s) e-mail(s) autorizado(s) ao Admin Geral
3. Faça commit/push e espere o deploy ficar Ready.
4. Teste em uma conta nova antes de iniciar tráfego pago.

## Hardening antes de produção
- `/api/payments/create` agora exige sessão Supabase válida no servidor; não confia mais em `userId`/e-mail enviados pelo navegador.
- Webhook do Mercado Pago ficou idempotente: notificações repetidas do mesmo `payment_id` não somam meses novamente.
- Webhook só libera plano após consultar o pagamento diretamente na API do Mercado Pago e confirmar `status=approved`.
- URL oficial consolidada em `https://lg-agenda.vercel.app`.
