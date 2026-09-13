import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  if (!await requireMaster(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { threadId, body } = await req.json();
  if (!threadId || !String(body || '').trim()) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  const db = supabaseAdmin();
  const { data, error } = await db.from('support_messages').insert({ thread_id: threadId, sender: 'master', body: String(body).trim() }).select('*').single();
  if (error) throw error;
  await db.from('support_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);
  return NextResponse.json({ ok: true, message: data });
}
