# LG Agenda V2 Final — publicação

## 1. Antes do Git/Vercel: rode a migração no Supabase
No Supabase > SQL Editor, execute **somente** o arquivo:

`supabase/migration-v2-final.sql`

Ele adiciona os campos novos sem recriar as tabelas existentes.

## 2. Variáveis na Vercel
Confirme em Production:

- `NEXT_PUBLIC_SITE_URL=https://lg-agenda.vercel.app`
- `SUPABASE_URL=<Project URL exata do Supabase>`
- `NEXT_PUBLIC_SUPABASE_URL=<mesma Project URL>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<sb_publishable_...>`
- `SUPABASE_SERVICE_ROLE_KEY=<sb_secret_...>`
- `MERCADO_PAGO_ACCESS_TOKEN=<Access Token DE PRODUÇÃO>`
- `CRON_SECRET=<senha longa aleatória>`
- `MASTER_EMAILS=<seu e-mail de administrador>`

WhatsApp automático é opcional nesta etapa:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_TEMPLATE_REMINDER`

## 3. Mercado Pago
Webhook de produção:

`https://lg-agenda.vercel.app/api/payments/webhook`

Evento: Pagamentos.

O backend consulta o pagamento na API do Mercado Pago e só libera a assinatura quando o status real é `approved`. Webhooks repetidos do mesmo pagamento são ignorados para não duplicar meses.

## 4. Subir para o GitHub
Substitua os arquivos do projeto local por esta V2 e rode:

```bash
git add .
git commit -m "LG Agenda V2 final"
git push
```

Espere o deployment da Vercel ficar Ready.

## 5. Checklist obrigatório antes de tráfego pago
1. Criar conta nova e chegar ao Checkout Pro.
2. Confirmar que pagamento aprovado leva ao onboarding.
3. Fechar a aba no onboarding, entrar de novo e confirmar que volta ao onboarding até criar o estabelecimento.
4. Criar estabelecimento e confirmar que começa sem profissionais, categorias e serviços demo.
5. Criar categoria, serviço e profissional do zero.
6. Fazer um agendamento público e verificar mínimo de 1h de antecedência.
7. Conferir datas em DD/MM/AAAA e horários de Brasília.
8. Testar lembrete manual via WhatsApp.
9. Enviar mensagem no suporte pelo cliente e responder em `/master`.
10. Confirmar que uma conta comum NÃO abre `/master`.
11. Conferir plano, ativação, vencimento e dias restantes.
12. Testar renovação/upgrade.
13. No master, testar bloquear/desbloquear um estabelecimento de teste.
14. Confirmar que expirado + 48h deixa de acessar painel e link público.

## Observação de lançamento
Antes de investir forte em tráfego, faça ao menos uma compra real controlada de ponta a ponta e depois estorne/cancele conforme sua operação permitir. Isso valida credencial de produção, retorno e webhook real.
