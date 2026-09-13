# LG Agenda V2.3 — teste rápido

1. Substitua os arquivos pela V2.3 e faça git add/commit/push.
2. Não há SQL novo nesta versão.
3. Aguarde o deploy da Vercel terminar.
4. Teste primeiro a conta Master: ao entrar deve ir direto para /master.
5. Depois teste a conta que já pagou. No primeiro login a API /api/account/state tentará recuperar automaticamente um pagamento aprovado recente do Mercado Pago pelo external_reference da conta.
6. Após esse login, confira no Supabase > purchase_entitlements. Deve surgir uma linha ativa para o usuário pago.
7. Se o cliente ainda não tiver estabelecimento, ele vai para /onboarding. Depois de criar, subscriptions será preenchida.
8. Não faça outro pagamento antes desse teste.
