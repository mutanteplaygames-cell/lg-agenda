import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth-server';
import { reconcileApprovedPaymentForUser } from '@/lib/payment-entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const result = await reconcileApprovedPaymentForUser(user.id, user.email);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('payment-reconcile', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Falha ao conciliar pagamento.' }, { status: 500 });
  }
}
