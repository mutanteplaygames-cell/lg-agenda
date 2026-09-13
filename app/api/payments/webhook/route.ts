import { NextResponse } from 'next/server';
import { applyApprovedPayment, getMercadoPagoPayment } from '@/lib/payment-entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const paymentId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get('data.id') ||
      url.searchParams.get('id');

    // Alguns eventos que não são de pagamento podem chegar na mesma URL.
    // Respondemos 200 para não gerar retries inúteis.
    if (!paymentId) return NextResponse.json({ ok: true, ignored: 'missing_payment_id' });

    const payment = await getMercadoPagoPayment(String(paymentId));
    const result = await applyApprovedPayment(payment);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('payment-webhook', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Falha no webhook' }, { status: 500 });
  }
}
