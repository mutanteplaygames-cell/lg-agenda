# LG Agenda V2.7 — Operação e Gestão

- Ranking por profissional com foto e medalhas para Top 3.
- Três visões de ranking: faturamento, clientes atendidos e serviços concluídos.
- Foto/logo do estabelecimento restaurada na aba Estabelecimento.
- Cards de escolha de agenda pública redesenhados e corrigidos para manter o estilo mesmo quando não selecionados.
- Agenda do administrador com filtros Hoje, Amanhã e Todos, além de categoria, serviço e profissional.
- Cores visuais por status: concluído verde, agendado/confirmado amarelo e falta vermelho.
- Falta com botão de WhatsApp e mensagem pronta para tentativa de remarcação.
- Inclusão de agendamento manual pelo administrador.
- Preço histórico preservado: cada agendamento grava o valor vigente no momento da marcação; alterações futuras no serviço não reescrevem faturamento passado.
- Folgas por profissional usando bloqueios de agenda, com múltiplas datas e remoção individual.
- Upload de logo/foto do estabelecimento em Storage.

Não há nova migração SQL obrigatória nesta versão. Ela usa estruturas que já existem no schema atual (`logo_url`, `schedule_blocks` e `price_cents` em appointments).
