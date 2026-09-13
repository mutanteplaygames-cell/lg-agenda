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
      return NextResponse.json({ error: 'Informe e-mail e senha.', source: 'signup-v1.6' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.', source: 'signup-v1.6' }, { status: 400 });
    }

    const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
    const publishable = String(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      ''
    ).trim();
    const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');

    if (!url) {
      return NextResponse.json({ error: 'URL pública do Supabase ausente no servidor.', source: 'signup-v1.6' }, { status: 500 });
    }
    if (!publishable) {
      return NextResponse.json({ error: 'Publishable key do Supabase ausente no servidor.', source: 'signup-v1.6' }, { status: 500 });
    }

    // O cadastro normal deve usar a chave pública/publishable, não a chave admin.
    // A conta nasce antes do pagamento, mas o acesso comercial continua bloqueado
    // até o webhook confirmar o plano.
    const supabase = createClient(url, publishable, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: siteUrl ? { emailRedirectTo: `${siteUrl}/login?confirmed=1` } : undefined,
    });

    if (error) {
      const raw = String(error.message || 'Falha ao criar usuário.');
      const low = raw.toLowerCase();
      const message = low.includes('already') || low.includes('registered') || low.includes('exists')
        ? 'Este e-mail já possui uma conta. Clique em Entrar para acessar.'
        : raw;
      return NextResponse.json(
        { error: message, source: 'signup-v1.6', status: error.status || 400 },
        { status: error.status && error.status >= 400 && error.status < 600 ? error.status : 400 },
      );
    }

    const userId = data?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'O Supabase não retornou o ID da conta.', source: 'signup-v1.6' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      userId,
      requiresEmailConfirmation: !data.session,
      source: 'signup-v1.6',
    });
  } catch (e: any) {
    console.error('signup-v1.6 unexpected error:', e);
    return NextResponse.json(
      { error: e?.message || 'Erro inesperado ao criar conta.', source: 'signup-v1.6' },
      { status: 500 },
    );
  }
}
