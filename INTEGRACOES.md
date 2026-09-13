# LG Agenda — integrações para produção

## 1. Pagamentos — Asaas
Recomendação atual para a primeira versão: Asaas.

Motivos:
- API oficial para assinaturas;
- ciclos MONTHLY, QUARTERLY, SEMIANNUALLY e YEARLY;
- cobrança via PIX e cartão;
- Pix Automático disponível para recorrência após autorização;
- webhooks para ativar/suspender plano automaticamente.

Fluxo de produção:
1. Usuário escolhe plano no LG Agenda.
2. Criamos/consultamos o cliente no Asaas.
3. Criamos cobrança/assinatura.
4. Asaas envia webhook de pagamento confirmado.
5. LG Agenda grava `subscription_status=active` + `paid_until`.
6. Em atraso/cancelamento, novo agendamento público é suspenso, mantendo os dados.

Nunca colocar a `ASAAS_API_KEY` no navegador. Tudo passa por Route Handlers/backend.

## 2. WhatsApp oficial
Usar WhatsApp Business Platform / Cloud API da Meta.

O cliente final deve dar consentimento claro para receber mensagens no WhatsApp. Mensagens iniciadas pela empresa fora da janela de atendimento exigem template aprovado.

Templates planejados:
- confirmação logo após o agendamento;
- lembrete 6 horas antes;
- botões: Confirmar / Reagendar.

Ação Reagendar abre um link assinado do LG Agenda. Só substituir o horário antigo depois que o novo for confirmado.

O adicional de R$29,90 não deve ser divulgado como mensagens ilimitadas até conhecermos o custo médio real. Use franquia/uso justo.

## 3. Publicação
Stack sugerido:
- Vercel: Next.js/front+backend;
- Supabase: PostgreSQL/Auth/Storage;
- domínio próprio apontado para Vercel.

Antes de colocar clientes reais:
- criar Supabase e aplicar RLS por `business_id`;
- trocar localStorage por banco;
- criar autenticação real;
- configurar webhook do Asaas;
- configurar domínio HTTPS;
- políticas de privacidade e termos;
- backups.
