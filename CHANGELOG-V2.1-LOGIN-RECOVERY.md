# LG Agenda V2.1 — Login e recuperação de senha

- Corrige o fluxo de login para não mandar silenciosamente o usuário à home quando não existe estabelecimento.
- Usuários autenticados sem estabelecimento são enviados ao onboarding, que mostra o status do pagamento.
- Erros do endpoint de estado agora aparecem no login em vez de parecer que o login falhou.
- Adiciona botão **Esqueci minha senha**.
- Adiciona `/forgot-password` para envio de e-mail de recuperação pelo Supabase.
- Adiciona `/reset-password` para definição segura de nova senha.
- Senhas existentes nunca são exibidas ou recuperadas em texto puro; o fluxo correto é redefinição.

## Supabase obrigatório
Em Authentication > URL Configuration, mantenha o Site URL como:

https://lg-agenda.vercel.app

E adicione em Redirect URLs:

https://lg-agenda.vercel.app/reset-password
