import { supabaseAdmin } from './supabase-admin';

export async function getRequestUser(req: Request) {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const db = supabaseAdmin();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function masterEmails() {
  return String(process.env.MASTER_EMAILS || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);
}

export function isMasterEmail(email?: string | null) {
  return !!email && masterEmails().includes(email.toLowerCase());
}

export async function requireMaster(req: Request) {
  const user = await getRequestUser(req);
  if (!user || !isMasterEmail(user.email)) return null;
  return user;
}
