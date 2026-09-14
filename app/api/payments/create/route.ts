import { NextResponse } from 'next/server';
import { createPreference } from '@/lib/mercadopago';
import { PLANS, type PlanKey } from '@/lib/config';
import { getRequestUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Sessão inválida. Entre novamente.' }, { status: 401 });

    const { plan } = await req.json();
    if (!PLANS[plan as PlanKey]) return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    if (!user.email) return NextResponse.json({ error: 'Sua conta não possui e-mail válido.' }, { status: 400 });

    const pref = await createPreference({
      plan: plan as PlanKey,
      email: user.email,
      userId: user.id,
    });
    return NextResponse.json({ id: pref.id, url: pref.init_point, sandboxUrl: pref.sandbox_init_point });
  } catch (e: any) {
    console.error('payments-create', e);
    return NextResponse.json({ error: e?.message || 'Erro ao criar pagamento.' }, { status: 500 });
  }
}
