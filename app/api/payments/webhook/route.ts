import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANS, type PlanKey } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const paymentId = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
    if (!paymentId || !token) return NextResponse.json({ ok: true });

    // A notificação é sempre validada consultando o pagamento diretamente no Mercado Pago.
    // Isso impede que um payload recebido no webhook, sozinho, libere uma assinatura.
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!r.ok) return NextResponse.json({ ok: true });
    const payment = await r.json();
    if (payment.status !== 'approved') return NextResponse.json({ ok: true });

    const [userId, planKey, waFlag] = String(payment.external_reference || '').split(':');
    const plan = PLANS[planKey as PlanKey];
    if (!userId || !plan) return NextResponse.json({ ok: true });

    const db = supabaseAdmin();
    const now = new Date();
    const paymentRef = String(payment.id);
    const { data: oldEnt } = await db
      .from('purchase_entitlements')
      .select('paid_until,provider_payment_id,started_at,created_at')
      .eq('owner_id', userId)
      .maybeSingle();

    // Mercado Pago pode reenviar o mesmo webhook várias vezes. Não podemos somar meses novamente.
    if (oldEnt?.provider_payment_id && String(oldEnt.provider_payment_id) === paymentRef) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const base = oldEnt?.paid_until && new Date(oldEnt.paid_until).getTime() > now.getTime()
      ? new Date(oldEnt.paid_until)
      : new Date(now);
    const paidUntil = new Date(base);
    paidUntil.setMonth(paidUntil.getMonth() + plan.months);
    const startedAt = oldEnt?.started_at || oldEnt?.created_at || now.toISOString();

    const { error: entError } = await db.from('purchase_entitlements').upsert({
      owner_id: userId,
      provider: 'mercadopago',
      provider_payment_id: paymentRef,
      plan: planKey,
      status: 'active',
      whatsapp_addon: waFlag === 'wa',
      paid_until: paidUntil.toISOString(),
      started_at: startedAt,
      updated_at: now.toISOString(),
    }, { onConflict: 'owner_id' });
    if (entError) throw entError;

    const { data: business } = await db.from('businesses').select('id').eq('owner_id', userId).maybeSingle();
    if (business) {
      const { data: oldSub } = await db.from('subscriptions').select('started_at').eq('business_id', business.id).maybeSingle();
      const { error: subError } = await db.from('subscriptions').upsert({
        business_id: business.id,
        provider: 'mercadopago',
        provider_payment_id: paymentRef,
        plan: planKey,
        status: 'active',
        whatsapp_addon: waFlag === 'wa',
        started_at: oldSub?.started_at || startedAt,
        paid_until: paidUntil.toISOString(),
        grace_until: new Date(paidUntil.getTime() + 48 * 3600000).toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'business_id' });
      if (subError) throw subError;
      await db.from('businesses').update({
        subscription_status: 'active',
        access_status: 'active',
        blocked_at: null,
        blocked_reason: null,
      }).eq('id', business.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('payment-webhook', e);
    // O Mercado Pago pode tentar novamente em falhas transitórias. Retornar 500 aqui é intencional.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
