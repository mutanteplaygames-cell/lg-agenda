import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  if (!await requireMaster(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const db = supabaseAdmin();
  const [businesses, subscriptions, appointments, threads] = await Promise.all([
    db.from('businesses').select('*').order('created_at', { ascending: false }),
    db.from('subscriptions').select('*'),
    db.from('appointments').select('id,business_id,starts_at,status,price_cents,created_at').gte('starts_at', new Date(Date.now() - 400 * 86400000).toISOString()),
    db.from('support_threads').select('*').order('updated_at', { ascending: false }),
  ]);
  const threadIds = (threads.data || []).map((x: any) => x.id);
  let messages: any[] = [];
  if (threadIds.length) {
    const r = await db.from('support_messages').select('*').in('thread_id', threadIds).order('created_at');
    messages = r.data || [];
  }
  const businessRows = businesses.data || [];
  const ownerEntries = await Promise.all(businessRows.map(async (b: any) => {
    if (!b.owner_id) return [b.id, null];
    const u = await db.auth.admin.getUserById(b.owner_id);
    return [b.id, u.data?.user?.email || null];
  }));
  const ownerEmails = Object.fromEntries(ownerEntries);
  const businessesWithOwner = businessRows.map((b: any) => ({ ...b, owner_email: ownerEmails[b.id] || null }));
  return NextResponse.json({ businesses: businessesWithOwner, subscriptions: subscriptions.data || [], appointments: appointments.data || [], threads: threads.data || [], messages });
}
