# LG Agenda V1 — Production Candidate

SaaS multiestabelecimento para agenda, equipe, serviços, clientes, desempenho e suporte.

## Rodar localmente

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Páginas

- `/` — landing + planos + criação/pagamento
- `/login` — login do estabelecimento
- `/onboarding` — criação do estabelecimento após pagamento
- `/admin` — painel do estabelecimento
- `/agenda/[slug]` — agenda pública
- `/master` — admin geral

Leia `PRODUCAO_PASSO_A_PASSO.md` antes de publicar.

## V2.6 Agenda Experience
Antes do deploy da V2.6, execute `supabase/migration-v2.6-agenda-release.sql` no SQL Editor do Supabase. Depois siga `PRODUCAO_V2.6_PASSO_A_PASSO.md`.
