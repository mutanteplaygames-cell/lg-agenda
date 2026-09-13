'use client';
import { createClient } from '@supabase/supabase-js';

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('Configuração pública do Supabase ausente. Confira .env.local e reinicie o Next.js.');
  }
  return createClient(url, key);
}
