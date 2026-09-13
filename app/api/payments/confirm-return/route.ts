import { NextResponse } from 'next/server';
import { getRequestUser, isMasterEmail } from '@/lib/auth-server';
import { applyApprovedPayment, getMercadoPagoPayment, parseExternalReference, reconcileApprovedPaymentForUser } from '@/lib/payment-entitlement';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (isMasterEmail(user.email)) return NextResponse.json({ ok: true, destination: '/master', master: true });

    const body = await req.json().catch(() => ({}));
    const paymentId = String(body?.paymentId || '').trim();
    let applied = false;
    let paymentStatus: string | null = null;

    if (paymentId) {
      const payment = await getMercadoPagoPayment(paymentId);
      paymentStatus = String(payment?.status || '');
      const parsed = parseExternalReference(payment?.external_reference);
      if (parsed?.userId && parsed.userId !== user.id) {
        return NextResponse.json({ error: 'Este pagamento não pertence à conta autenticada.' }, { status: 403 });
      }
      const result = await applyApprovedPayment(payment);
      applied = !!result?.applied;
    }

    if (!applied) {
      const rec = await reconcileApprovedPaymentForUser(user.id, user.email);
      applied = !!rec?.found;
    }

    const db = supabaseAdmin();
    const [{ data: business }, { data: entitlement }] = await Promise.all([
      db.from('businesses').select('id').eq('owner_id', user.id).maybeSingle(),
      db.from('purchase_entitlements').select('status,paid_until').eq('owner_id', user.id).maybeSingle(),
    ]);

    const active = entitlement?.status === 'active' && (!entitlement?.paid_until || new Date(entitlement.paid_until).getTime() + 48 * 3600000 >= Date.now());
    return NextResponse.json({
      ok: true,
      applied,
      paymentStatus,
      active,
      destination: business ? '/admin' : active ? '/onboarding' : '/onboarding?payment=pending',
    });
  } catch (e: any) {
    console.error('payments-confirm-return', e);
    return NextResponse.json({ error: e?.message || 'Não foi possível confirmar o pagamento.' }, { status: 500 });
  }
}
