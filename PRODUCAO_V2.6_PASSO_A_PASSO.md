# Produção V2.6 — passo a passo

1. No Supabase, abra **SQL Editor**.
2. Execute **uma vez** o arquivo `supabase/migration-v2.6-agenda-release.sql`.
3. Substitua os arquivos do projeto pelos desta versão.
4. Faça commit e push:
   - `git add .`
   - `git commit -m "LG Agenda V2.6 agenda experience"`
   - `git push`
5. Aguarde o deploy da Vercel.
6. No painel de uma loja, entre em **Agenda → Liberar nova agenda** e libere pelo menos um mês.
7. Em **Equipe**, edite um profissional, envie uma foto e selecione categorias/serviços/dias.
8. Abra a página pública e teste os dois fluxos: **por profissional** e **agenda geral**.
9. Teste um telefone inválido e confirme que o agendamento é bloqueado.
