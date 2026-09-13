# Produção V2.8 — passo a passo

1. No Supabase, abra SQL Editor.
2. Execute `supabase/migration-v2.8-performance-observations.sql` uma vez.
3. Substitua os arquivos do projeto pela V2.8.
4. Rode:
   git add .
   git commit -m "LG Agenda V2.8 performance e observacoes"
   git push
5. Aguarde o deploy da Vercel.
6. Teste:
   - Desempenho com filtros de data;
   - Agenda filtrando por status;
   - Enviar lembrete WhatsApp;
   - Agendamento público com observação;
   - Conferir observação no painel.
