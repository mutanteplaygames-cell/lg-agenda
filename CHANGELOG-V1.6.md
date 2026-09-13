# LG Agenda v1.6

- Cadastro normal via Supabase Auth usando a Publishable Key.
- Remove a dependência da chave admin/secret para criar conta de cliente.
- Botão Entrar agora abre a tela real de login.
- /admin exige sessão autenticada e redireciona para /login quando necessário.
- Login real com e-mail/senha via Supabase Auth.
- Botão Sair no painel do estabelecimento.

- V1.6.1: corrige build do Next.js envolvendo useSearchParams de /login em Suspense.
