# LG Agenda V2.6 — Agenda Experience

- Serviço passou a exibir **Duração máxima (min)**.
- Aba Agenda recebeu botão **Atualizar** sem necessidade de F5.
- WhatsApp do cliente exige DDD + celular com 9 dígitos, com máscara no formulário e validação também no servidor.
- Profissional agora aceita foto; upload seguro para Supabase Storage.
- Profissional pode ser vinculado a serviços específicos além de categorias.
- Fluxo público reformulado: dados do cliente → categoria → serviço → agenda por profissional ou agenda geral → mês → data → horário.
- Agenda geral encontra profissionais compatíveis e escolhe aleatoriamente um disponível no horário escolhido.
- Cards de profissional com foto circular, hover e visual moderno.
- Novo controle de **meses liberados**: o estabelecimento escolhe quais meses ficam visíveis para agendamento público.
- API pública e criação do agendamento validam o mês liberado e a escala do profissional.

## Banco de dados
Execute uma vez no Supabase SQL Editor:
`supabase/migration-v2.6-agenda-release.sql`
