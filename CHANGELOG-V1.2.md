# LG Agenda V1.2 — correção de ambiente/cadastro

- Cadastro agora passa por `/api/auth/signup` no servidor.
- O navegador não instancia mais o Supabase para criar a conta.
- Mensagens de erro indicam exatamente qual variável do `.env.local` está ausente.
- `/api/integrations/status` mostra apenas booleanos de configuração, nunca chaves.
- Compatibilidade com Publishable Key nova do Supabase mantida via `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Teste rápido
1. Crie `.env.local` na raiz, ao lado de `package.json`.
2. Preencha URL, Publishable Key e nova Secret Key.
3. Pare o servidor (`Ctrl+C`) e rode `npm run dev`.
4. Abra `http://localhost:3000/api/integrations/status`.
5. `supabase.url`, `supabase.publishableKey` e `supabase.secretKey` devem estar `true`.
6. Crie uma conta pela home e confira em Supabase > Authentication > Users.
