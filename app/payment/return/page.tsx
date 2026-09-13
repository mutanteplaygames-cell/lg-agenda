'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

function ReturnContent() {
  const params = useSearchParams();
  const [msg, setMsg] = useState('Confirmando seu pagamento…');
  const [failed, setFailed] = useState(false);

  useEffect(() => { (async () => {
    const result = params.get('result') || params.get('status') || params.get('collection_status') || '';
    const paymentId = params.get('payment_id') || params.get('collection_id') || '';
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      const next = result === 'failure' ? '/' : '/onboarding';
      location.replace(`/login?next=${encodeURIComponent(next)}&payment_return=1`);
      return;
    }

    if (result === 'failure') {
      setFailed(true);
      setMsg('O pagamento não foi aprovado. Você pode tentar novamente sem perder sua conta.');
      return;
    }

    try {
      const r = await fetch('/api/payments/confirm-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ paymentId }),
        cache: 'no-store',
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Falha ao confirmar pagamento.');
      if (j?.active || j?.master || j?.destination === '/admin') {
        setMsg('Pagamento confirmado! Abrindo sua conta…');
        setTimeout(() => location.replace(j.destination || '/onboarding'), 500);
        return;
      }
      setMsg('Seu pagamento ainda está sendo processado. Vamos continuar verificando automaticamente.');
      setTimeout(() => location.replace('/onboarding?payment=pending'), 1200);
    } catch (e: any) {
      setFailed(true);
      setMsg(e?.message || 'Não foi possível confirmar o pagamento agora.');
    }
  })(); }, [params]);

  return <main className="authPage"><section className="authCard"><Link href="/" className="authLogo">LG Agenda</Link><span className="eyebrowM">PAGAMENTO</span><h1>{failed?'Precisamos concluir uma etapa':'Só mais um instante'}</h1><p>{msg}</p>{failed&&<><Link className="checkoutPrimary" href="/login?next=/onboarding">Entrar e continuar →</Link><p style={{marginTop:12}}>Se o pagamento foi aprovado, o LG Agenda faz a conciliação automática quando você entrar.</p></>}</section></main>;
}

export default function PaymentReturnPage(){
  return <Suspense fallback={<main className="authPage"><section className="authCard"><b>LG Agenda</b><p>Confirmando pagamento…</p></section></main>}><ReturnContent/></Suspense>;
}
