import { NextResponse } from 'next/server';
import { getRequestUser, isMasterEmail } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANS, type PlanKey } from '@/lib/config';
import { reconcileApprovedPaymentForUser } from '@/lib/payment-entitlement';

const DAY = 86400000;
const GRACE = 48 * 3600000;

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = supabaseAdmin();
  const isMaster = isMasterEmail(user.email);
  let [{ data: business }, { data: entitlement }] = await Promise.all([
    db.from('businesses').select('*').eq('owner_id', user.id).maybeSingle(),
    db.from('purchase_entitlements').select('*').eq('owner_id', user.id).maybeSingle(),
  ]);

  // Fallback de conciliação: se o webhook não persistiu o pagamento, consultamos o
  // Mercado Pago no próximo login/retorno e recuperamos automaticamente a compra.
  // Master não depende de assinatura.
  if (!isMaster && entitlement?.status !== 'active') {
    try {
      const rec = await reconcileApprovedPaymentForUser(user.id, user.email);
      if (rec?.found) {
        const refreshed = await db.from('purchase_entitlements').select('*').eq('owner_id', user.id).maybeSingle();
        entitlement = refreshed.data;
      }
    } catch (e) {
      console.error('account-state-reconcile', e);
    }
  }
  let subscription: any = null;
  if (business) {
    const r = await db.from('subscriptions').select('*').eq('business_id', business.id).maybeSingle();
    subscription = r.data;
  }
  const source = subscription || entitlement;
  const paidUntil = source?.paid_until ? new Date(source.paid_until) : null;
  const now = Date.now();
  const manualBlocked = business?.access_status === 'blocked';
  let accessStatus = 'unpaid';
  if (manualBlocked) accessStatus = 'blocked';
  else if (paidUntil && paidUntil.getTime() >= now) accessStatus = 'active';
  else if (paidUntil && paidUntil.getTime() + GRACE >= now) accessStatus = 'grace_period';
  else if (paidUntil) accessStatus = 'expired';
  const daysRemaining = paidUntil ? Math.max(0, Math.ceil((paidUntil.getTime() - now) / DAY)) : 0;
  const hoursGraceRemaining = paidUntil && accessStatus === 'grace_period'
    ? Math.max(0, Math.ceil((paidUntil.getTime() + GRACE - now) / 3600000)) : 0;
  const planKey = (source?.plan || '') as PlanKey;
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    mustChangePassword: user.user_metadata?.must_change_password === true,
    isMaster,
    business,
    subscription,
    entitlement,
    needsOnboarding: !business && entitlement?.status === 'active',
    hasPaidEntitlement: entitlement?.status === 'active',
    accessStatus,
    plan: source?.plan || null,
    planLabel: PLANS[planKey]?.label || source?.plan || null,
    startedAt: subscription?.started_at || entitlement?.created_at || null,
    paidUntil: source?.paid_until || null,
    daysRemaining,
    hoursGraceRemaining,
    whatsappAddon: !!source?.whatsapp_addon,
  });
}
