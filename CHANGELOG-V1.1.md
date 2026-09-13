# LG Agenda V1.1

Correção do fluxo de cadastro:

- A conta Supabase é criada ao concluir a etapa **1 Conta**, antes do pagamento.
- O usuário deve aparecer imediatamente em **Supabase > Authentication > Users**.
- A etapa 2 usa o `userId` já criado para montar o pagamento.
- O plano continua bloqueado até a confirmação do pagamento pelo backend/webhook.

## Teste rápido

1. Reinicie `npm run dev`.
2. Abra a home e escolha um plano.
3. Preencha e-mail/senha e clique em **Criar conta e continuar**.
4. Antes de pagar, abra Supabase > Authentication > Users.
5. O e-mail deve estar listado.
