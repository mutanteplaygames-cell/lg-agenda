import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
export async function POST(req: Request) {
  try {
    const { userId, businessId } = await req.json();
    if (!userId || !businessId) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    const db = supabaseAdmin();
    const [{ data: biz }, { data: ent }] = await Promise.all([
      db.from('businesses').select('id,owner_id').eq('id', businessId).single(),
      db.from('purchase_entitlements').select('*').eq('owner_id', userId).eq('status', 'active').single(),
    ]);
    if (!biz || biz.owner_id !== userId || !ent) return NextResponse.json({ error: 'Pagamento ainda não confirmado. Aguarde alguns segundos e tente novamente.' }, { status: 409 });
    const startedAt = ent.started_at || ent.created_at || new Date().toISOString();
    await db.from('businesses').update({ subscription_status: 'active', access_status: 'active', onboarding_completed_at: new Date().toISOString() }).eq('id', businessId);
    await db.from('subscriptions').upsert({ business_id: businessId, provider: ent.provider, provider_payment_id: ent.provider_payment_id, plan: ent.plan, status: 'active', whatsapp_addon: ent.whatsapp_addon, started_at: startedAt, paid_until: ent.paid_until, grace_until: new Date(new Date(ent.paid_until).getTime() + 48 * 3600000).toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'business_id' });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message || 'Falha ao ativar.' }, { status: 500 }); }
}
