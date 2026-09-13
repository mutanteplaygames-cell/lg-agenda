# V1.4 — Cadastro REST

- Cadastro de usuário não usa mais `createClient()` do Supabase.
- `/api/auth/signup` chama diretamente a Auth Admin REST API.
- Respostas incluem `source: signup-v1.4` para diagnóstico.
- Marcador `v1.4` aparece no modal de criação de conta para confirmar que o navegador recebeu o bundle novo.
- Recomenda-se `SUPABASE_URL` server-side além de `NEXT_PUBLIC_SUPABASE_URL`.
