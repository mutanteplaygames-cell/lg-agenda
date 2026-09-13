# LG Agenda V2.3 — Conciliação de pagamento

- Corrige acesso do Master: MASTER_EMAILS entra direto no /master sem exigir pagamento ou estabelecimento.
- Webhook de pagamento centralizado e mais robusto.
- Adiciona conciliação automática no login: se o entitlement não existir, o backend consulta pagamentos recentes aprovados do Mercado Pago e recupera a compra pelo external_reference do usuário.
- Adiciona POST /api/payments/reconcile para reconciliação autenticada manual.
- Mantém idempotência para não somar o mesmo pagamento duas vezes.
- Não requer nova migração SQL.
