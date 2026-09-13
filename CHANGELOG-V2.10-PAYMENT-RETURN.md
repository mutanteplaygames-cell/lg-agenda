# LG Agenda V2.10 — Retorno de pagamento e links públicos

- Corrige URLs antigas de deployments Vercel: qualquer preview `*.vercel.app` do projeto é substituído pelo domínio oficial `https://lg-agenda.vercel.app`.
- Checkout Mercado Pago retorna para `/payment/return`, que tenta confirmar/concilia o pagamento antes de continuar.
- Se a sessão tiver sido perdida durante o checkout, o usuário é enviado ao login e depois continua no onboarding.
- O botão “voltar para a loja” do Mercado Pago passa a usar o domínio oficial configurado/canônico.
- Mantido `auto_return: approved` para retorno automático quando o Mercado Pago disponibilizar esse comportamento.
- Página pública e criação de agendamento agora aceitam `purchase_entitlements` como fallback quando a linha de `subscriptions` ainda não foi criada, evitando agenda pública bloqueada após um pagamento válido.
- Link público do painel não herda mais deployment preview antigo; em domínio customizado futuro, usa o próprio domínio atual.
