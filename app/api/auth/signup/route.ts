import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.', source: 'signup-v1.5' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.', source: 'signup-v1.5' }, { status: 400 });
    }

    const url = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
    const secret = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!url) {
      return NextResponse.json({ error: 'SUPABASE_URL ausente no servidor.', source: 'signup-v1.5' }, { status: 500 });
    }
    if (!secret) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ausente no servidor.', source: 'signup-v1.5' }, { status: 500 });
    }

    // Admin client somente no servidor. O SDK lida corretamente com as novas
    // sb_secret_* keys do Supabase sem enviá-las como Bearer JWT inválido.
    const supabaseAdmin = createClient(url, secret, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const rawMessage = String(error.message || 'Falha ao criar usuário.');
      const low = rawMessage.toLowerCase();
      const message = low.includes('already') || low.includes('registered') || low.includes('exists')
        ? 'Este e-mail já possui uma conta. Use outro e-mail para o teste ou faça login.'
        : rawMessage;
      return NextResponse.json(
        { error: message, source: 'signup-v1.5', status: error.status || 400 },
        { status: error.status && error.status >= 400 && error.status < 600 ? error.status : 400 },
      );
    }

    const userId = data?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Usuário criado sem ID retornado pelo Supabase.', source: 'signup-v1.5' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId, source: 'signup-v1.5' });
  } catch (e: any) {
    console.error('signup-v1.5 unexpected error:', e);
    return NextResponse.json({ error: e?.message || 'Erro inesperado ao criar conta.', source: 'signup-v1.5' }, { status: 500 });
  }
}
