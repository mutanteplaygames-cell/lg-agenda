import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANS, type PlanKey } from '@/lib/config';

export async function PATCH(req: Request) {
  if (!await requireMaster(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { businessId, action, plan, paidUntil } = await req.json();
  if (!businessId) return NextResponse.json({ error: 'businessId obrigatório.' }, { status: 400 });
  const db = supabaseAdmin();
  if (action === 'block') {
    await db.from('businesses').update({ access_status: 'blocked', blocked_at: new Date().toISOString() }).eq('id', businessId);
  } else if (action === 'unblock') {
    await db.from('businesses').update({ access_status: 'active', blocked_at: null, blocked_reason: null }).eq('id', businessId);
  } else if (action === 'set_plan') {
    const key = plan as PlanKey;
    if (!PLANS[key]) return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    const end = paidUntil ? new Date(paidUntil) : new Date(Date.now());
    if (!paidUntil) end.setMonth(end.getMonth() + PLANS[key].months);
    await db.from('subscriptions').upsert({ business_id: businessId, plan: key, status: 'active', started_at: new Date().toISOString(), paid_until: end.toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'business_id' });
    await db.from('businesses').update({ subscription_status: 'active', access_status: 'active', blocked_at: null }).eq('id', businessId);
  }
  return NextResponse.json({ ok: true });
}
