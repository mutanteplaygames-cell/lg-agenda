# LG Agenda — colocar em produção

Esta versão já contém a estrutura de produção para Supabase, Mercado Pago Checkout Pro e WhatsApp Cloud API. O painel visual ainda mantém o modo demonstrativo/local em algumas telas; use o banco real como próxima migração dos componentes administrativos. O fluxo de pagamento, isolamento multi-tenant, schema, webhook e motor de lembretes já estão preparados.

## Modelo de cobrança implementado

Para oferecer PIX e cartão com o mínimo de atrito, o V1 usa **Mercado Pago Checkout Pro** e cobra o período escolhido adiantado:

- Mensal: R$ 49,90
- Trimestral: R$ 139,90
- Semestral: R$ 269,90
- Anual: R$ 529,90
- WhatsApp Automático: + R$ 59,90 por mês contratado

Exemplo: Plano trimestral + WhatsApp = R$ 139,90 + (3 × R$ 59,90) no checkout. Assim PIX e cartão funcionam no mesmo fluxo. Quando quisermos renovação automática por cartão, migramos/expandimos para a API de Assinaturas do Mercado Pago.

## 1 — Supabase

1. Crie um projeto no Supabase.
2. Abra SQL Editor e execute todo o arquivo `supabase/schema.sql`.
3. Em Project Settings / API, copie:
   - Project URL
   - anon/public key
   - service_role key (NUNCA exponha no navegador)
4. Em Authentication, para o primeiro teste, você pode desabilitar confirmação obrigatória de e-mail. Em produção, reative e ajuste o fluxo de confirmação.
5. Coloque as três chaves no `.env.local` conforme `.env.example`.

### Isolamento de 1.000+ estabelecimentos

O nome do estabelecimento NÃO é chave. Cada empresa recebe um UUID `businesses.id` e um `slug` único. Todas as tabelas operacionais carregam `business_id`. As políticas RLS usam o usuário autenticado + `owner_id`, impedindo que uma empresa leia ou altere os dados de outra mesmo que ambas se chamem “Barbearia Central”.

## 2 — Mercado Pago

1. Acesse Mercado Pago Developers / Suas integrações e crie uma aplicação para o LG Agenda.
2. Pegue o Access Token de teste primeiro.
3. Defina `MERCADO_PAGO_ACCESS_TOKEN` no `.env.local`.
4. O backend usa `POST /checkout/preferences` e recebe o `init_point` para redirecionar ao Checkout Pro.
5. O checkout do Mercado Pago pode exibir PIX e cartão conforme a configuração da sua conta.
6. No painel do Mercado Pago, configure notificações/webhooks apontando para:
   `https://SEU-DOMINIO.com/api/payments/webhook`
7. Faça pagamento de teste antes de trocar para credenciais de produção.

O webhook consulta o pagamento diretamente no Mercado Pago antes de conceder acesso. Quando aprovado, cria um `purchase_entitlement`; após o cliente criar a barbearia, esse direito é vinculado ao `business_id` e ativa o plano.

## 3 — WhatsApp Cloud API

A arquitetura usa um único número comercial LG Agenda como remetente para todos os estabelecimentos.

1. Crie/configure um Meta Business e WhatsApp Business Account.
2. Adicione o número “LG Agenda”.
3. No painel da Meta, obtenha:
   - Phone Number ID
   - Access Token permanente/adequado à produção
4. Crie um template Utility em português, por exemplo `lg_agenda_reminder_4h`.
5. O corpo deve ter variáveis nesta ordem:
   - nome do cliente
   - nome do estabelecimento
   - serviço
   - horário
   - profissional
6. Configure as variáveis no `.env.local`.
7. O endpoint `POST /api/reminders/run` procura lembretes pendentes e envia apenas quando:
   - o cliente marcou opt-in;
   - o estabelecimento possui o adicional WhatsApp ativo;
   - o lembrete está previsto para aproximadamente 4 horas antes.

Para agendar a execução, configure um scheduler externo/cron para chamar esse endpoint a cada 5–10 minutos com o header:
`x-cron-secret: VALOR_DO_CRON_SECRET`

O plano foi preparado para 500 lembretes/mês por estabelecimento. Antes de bloquear/exceder, acrescente a contagem no endpoint e a política comercial definida.

## 4 — Deploy na Vercel

1. Crie um repositório GitHub e envie esta pasta.
2. Na Vercel, importe o repositório.
3. Em Environment Variables, copie TODAS as chaves de `.env.example`.
4. Defina `NEXT_PUBLIC_SITE_URL` com a URL final HTTPS.
5. Faça Deploy.
6. Depois do primeiro deploy, volte ao Mercado Pago e coloque o domínio real no webhook.
7. Faça um novo pagamento teste.

## 5 — Domínio

Você pode começar com o domínio da Vercel. Quando comprar o domínio da marca, adicione-o em Vercel > Project > Domains e ajuste o DNS solicitado. Depois altere `NEXT_PUBLIC_SITE_URL`.

## 6 — Teste obrigatório antes de anunciar

Teste esta sequência inteira com outro navegador/celular:

Landing > escolher plano > criar conta > Mercado Pago > pagamento aprovado > configurar estabelecimento > criar categoria > criar serviço > criar profissional > gerar página pública > cliente agendar > confirmar conflito de horários > testar antecedência mínima de 1h > editar duração individual > excluir profissional > suporte > dashboard master.

Depois teste WhatsApp com um número seu antes de liberar para clientes.

## 7 — O que ainda recomendo finalizar antes do primeiro cliente pagante

- trocar definitivamente as telas administrativas que ainda usam `localStorage` pelas tabelas Supabase;
- autenticar/proteger `/master` por e-mail de administrador;
- criar Termos de Uso e Política de Privacidade/LGPD;
- registrar logs de webhook e idempotência de pagamentos;
- adicionar rate limit/CAPTCHA no cadastro público;
- implementar contador real das 500 mensagens de WhatsApp;
- backups e rotina de exportação de dados.
