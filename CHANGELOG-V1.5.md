# V1.5

- Corrige cadastro em produção com as novas chaves `sb_secret_*` do Supabase.
- Remove o uso manual de `Authorization: Bearer <sb_secret_...>` no Auth Admin REST.
- Usa `supabase.auth.admin.createUser()` no servidor, conforme recomendação atual do Supabase.
- Mantém a secret key exclusivamente no backend.
