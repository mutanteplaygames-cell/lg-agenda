import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.', source: 'signup-v1.4' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.', source: 'signup-v1.4' }, { status: 400 });
    }

    const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const url = rawUrl.trim().replace(/\/$/, '');

    if (!url) {
      return NextResponse.json({ error: 'SUPABASE_URL ausente no servidor.', source: 'signup-v1.4' }, { status: 500 });
    }
    if (!secret) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ausente no servidor.', source: 'signup-v1.4' }, { status: 500 });
    }

    // Usa a Auth Admin REST API diretamente. Isso evita qualquer dependência do
    // createClient() no fluxo de cadastro e elimina o erro "supabaseUrl is required".
    const endpoint = `${url}/auth/v1/admin/users`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': secret,
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
      cache: 'no-store',
    });

    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const rawMessage = String(payload?.msg || payload?.message || payload?.error_description || payload?.error || 'Falha ao criar usuário.');
      const low = rawMessage.toLowerCase();
      const message = low.includes('already') || low.includes('registered') || low.includes('exists')
        ? 'Este e-mail já possui uma conta. Use outro e-mail para o teste ou faça login.'
        : rawMessage;
      return NextResponse.json({ error: message, source: 'signup-v1.4', status: response.status }, { status: response.status >= 400 && response.status < 600 ? response.status : 400 });
    }

    const userId = payload?.id || payload?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'O Supabase criou a resposta, mas não retornou o ID do usuário.', source: 'signup-v1.4' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId, source: 'signup-v1.4' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado ao criar conta.', source: 'signup-v1.4' }, { status: 500 });
  }
}
