import { supabaseAdmin } from './supabase-admin';
import { PLANS, type PlanKey } from './config';

const MP_API = 'https://api.mercadopago.com';

function mpToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado.');
  return token;
}

export async function getMercadoPagoPayment(paymentId: string) {
  const r = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`Mercado Pago payment ${paymentId}: HTTP ${r.status}`);
  return r.json();
}

export async function searchRecentMercadoPagoPayments(limit = 100) {
  const wanted = Math.max(1, Math.min(limit, 100));
  const all: any[] = [];
  for (let offset = 0; offset < wanted; offset += 50) {
    const pageSize = Math.min(50, wanted - offset);
    const u = new URL(`${MP_API}/v1/payments/search`);
    u.searchParams.set('sort', 'date_created');
    u.searchParams.set('criteria', 'desc');
    u.searchParams.set('status', 'approved');
    u.searchParams.set('limit', String(pageSize));
    u.searchParams.set('offset', String(offset));
    const r = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${mpToken()}` },
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`Mercado Pago search: HTTP ${r.status} - ${await r.text()}`);
    const j = await r.json();
    const rows = Array.isArray(j?.results) ? j.results : [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

export function parseExternalReference(ref: unknown) {
  const [userId, planKey, waFlag] = String(ref || '').split(':');
  const plan = PLANS[planKey as PlanKey];
  if (!userId || !plan) return null;
  return { userId, planKey: planKey as PlanKey, whatsapp: waFlag === 'wa', plan };
}

export async function applyApprovedPayment(payment: any) {
  if (!payment || String(payment.status) !== 'approved') return { applied: false, reason: 'not_approved' };
  const parsed = parseExternalReference(payment.external_reference);
  if (!parsed) return { applied: false, reason: 'invalid_external_reference' };

  const db = supabaseAdmin();
  const now = new Date();
  const paymentRef = String(payment.id);
  const { data: oldEnt, error: oldEntError } = await db
    .from('purchase_entitlements')
    .select('paid_until,provider_payment_id,started_at,created_at')
    .eq('owner_id', parsed.userId)
    .maybeSingle();
  if (oldEntError) throw oldEntError;

  if (oldEnt?.provider_payment_id && String(oldEnt.provider_payment_id) === paymentRef) {
    return { applied: true, duplicate: true, userId: parsed.userId };
  }

  const base = oldEnt?.paid_until && new Date(oldEnt.paid_until).getTime() > now.getTime()
    ? new Date(oldEnt.paid_until)
    : new Date(now);
  const paidUntil = new Date(base);
  paidUntil.setMonth(paidUntil.getMonth() + parsed.plan.months);
  const startedAt = oldEnt?.started_at || oldEnt?.created_at || payment.date_approved || now.toISOString();

  const { error: entError } = await db.from('purchase_entitlements').upsert({
    owner_id: parsed.userId,
    provider: 'mercadopago',
    provider_payment_id: paymentRef,
    plan: parsed.planKey,
    status: 'active',
    whatsapp_addon: false,
    paid_until: paidUntil.toISOString(),
    started_at: startedAt,
    updated_at: now.toISOString(),
  }, { onConflict: 'owner_id' });
  if (entError) throw entError;

  const { data: business, error: businessError } = await db
    .from('businesses')
    .select('id')
    .eq('owner_id', parsed.userId)
    .maybeSingle();
  if (businessError) throw businessError;

  if (business) {
    const { data: oldSub, error: oldSubError } = await db
      .from('subscriptions')
      .select('started_at')
      .eq('business_id', business.id)
      .maybeSingle();
    if (oldSubError) throw oldSubError;
    const { error: subError } = await db.from('subscriptions').upsert({
      business_id: business.id,
      provider: 'mercadopago',
      provider_payment_id: paymentRef,
      plan: parsed.planKey,
      status: 'active',
      whatsapp_addon: false,
      started_at: oldSub?.started_at || startedAt,
      paid_until: paidUntil.toISOString(),
      grace_until: new Date(paidUntil.getTime() + 48 * 3600000).toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'business_id' });
    if (subError) throw subError;
    const { error: bizUpdateError } = await db.from('businesses').update({
      subscription_status: 'active',
      access_status: 'active',
      blocked_at: null,
      blocked_reason: null,
    }).eq('id', business.id);
    if (bizUpdateError) throw bizUpdateError;
  }

  return { applied: true, duplicate: false, userId: parsed.userId, paymentId: paymentRef };
}

export async function reconcileApprovedPaymentForUser(userId: string, email?: string | null) {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from('purchase_entitlements')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();
  if (existing?.status === 'active') return { found: true, entitlement: existing, source: 'database' };

  const payments = await searchRecentMercadoPagoPayments(100);
  const emailNorm = String(email || '').trim().toLowerCase();
  const candidates = payments.filter((p: any) => {
    if (String(p?.status) !== 'approved') return false;
    const parsed = parseExternalReference(p?.external_reference);
    if (parsed?.userId === userId) return true;
    const payerEmail = String(p?.payer?.email || '').trim().toLowerCase();
    return !!emailNorm && !!payerEmail && payerEmail === emailNorm && !!parsed;
  });

  for (const payment of candidates) {
    const parsed = parseExternalReference(payment.external_reference);
    // Segurança: só aceitamos referência que aponte para este usuário.
    if (!parsed || parsed.userId !== userId) continue;
    await applyApprovedPayment(payment);
    const { data: entitlement } = await db
      .from('purchase_entitlements')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();
    if (entitlement?.status === 'active') return { found: true, entitlement, source: 'mercadopago' };
  }
  return { found: false, entitlement: null, source: 'none' };
}
