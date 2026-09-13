import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = supabaseAdmin();
  const { data: business } = await db.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
  if (!business) return NextResponse.json({ thread: null, messages: [] });
  let { data: thread } = await db.from('support_threads').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!thread) return NextResponse.json({ thread: null, messages: [] });
  const { data: messages } = await db.from('support_messages').select('*').eq('thread_id', thread.id).order('created_at');
  return NextResponse.json({ thread, messages: messages || [] });
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { body } = await req.json();
  if (!String(body || '').trim()) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 });
  const db = supabaseAdmin();
  const { data: business } = await db.from('businesses').select('id').eq('owner_id', user.id).single();
  if (!business) return NextResponse.json({ error: 'Estabelecimento não encontrado.' }, { status: 404 });
  let { data: thread } = await db.from('support_threads').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!thread) {
    const created = await db.from('support_threads').insert({ business_id: business.id, status: 'open' }).select('*').single();
    if (created.error) throw created.error;
    thread = created.data;
  }
  const { data: message, error } = await db.from('support_messages').insert({ thread_id: thread.id, sender: 'business', body: String(body).trim() }).select('*').single();
  if (error) throw error;
  await db.from('support_threads').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', thread.id);
  return NextResponse.json({ ok: true, thread, message });
}
