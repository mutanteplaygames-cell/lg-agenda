import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  if (!await requireMaster(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { businessId, action, email, temporaryPassword } = await req.json();
  if (!businessId) return NextResponse.json({ error: 'businessId obrigatório.' }, { status: 400 });
  const db = supabaseAdmin();
  const { data: business } = await db.from('businesses').select('id,owner_id,name').eq('id', businessId).maybeSingle();
  if (!business?.owner_id) return NextResponse.json({ error: 'Usuário do estabelecimento não encontrado.' }, { status: 404 });

  if (action === 'set_email') {
    const clean = String(email || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    const { error } = await db.auth.admin.updateUserById(business.owner_id, { email: clean, email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'temporary_password') {
    const pass = String(temporaryPassword || '');
    if (pass.length < 8) return NextResponse.json({ error: 'A senha temporária precisa ter pelo menos 8 caracteres.' }, { status: 400 });
    const { data: current, error: getErr } = await db.auth.admin.getUserById(business.owner_id);
    if (getErr || !current.user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    const metadata = { ...(current.user.user_metadata || {}), must_change_password: true };
    const { error } = await db.auth.admin.updateUserById(business.owner_id, { password: pass, user_metadata: metadata });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'send_recovery') {
    const { data: current } = await db.auth.admin.getUserById(business.owner_id);
    const target = current.user?.email;
    if (!target) return NextResponse.json({ error: 'Usuário sem e-mail.' }, { status: 400 });
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://lg-agenda.vercel.app';
    const { error } = await db.auth.resetPasswordForEmail(target, { redirectTo: `${site}/reset-password` });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
