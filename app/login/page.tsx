'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const params = useSearchParams();

  useEffect(() => { if (params.get('confirmed') === '1') setMsg('E-mail confirmado. Agora você já pode entrar.'); }, [params]);

  async function go() {
    if (!email || !password) return setMsg('Informe e-mail e senha.');
    setBusy(true); setMsg('');
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      if (!data.session) throw new Error('Não foi possível iniciar sua sessão.');
      const r = await fetch('/api/account/state', { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' });
      const state = r.ok ? await r.json() : null;
      const requested = params.get('next');
      if (state?.isMaster && requested === '/master') return location.replace('/master');
      if (!state?.business && state?.hasPaidEntitlement) return location.replace('/onboarding');
      if (!state?.business && !state?.hasPaidEntitlement) return location.replace('/#planos');
      location.replace(requested && requested.startsWith('/') ? requested : '/admin');
    } catch (e: any) { setMsg(e?.message || 'Não foi possível entrar. Confira seus dados.'); }
    finally { setBusy(false); }
  }

  return <main className="authPage"><section className="authCard"><Link href="/" className="authLogo">LG Agenda</Link><span className="eyebrowM">ACESSO DO ESTABELECIMENTO</span><h1>Entrar</h1><p>Use o e-mail e a senha cadastrados na contratação.</p><label>E-mail<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go(); }} /></label>{msg && <div className="infoCallout">{msg}</div>}<button className="checkoutPrimary" onClick={go} disabled={busy}>{busy ? 'Entrando...' : 'Entrar →'}</button><p>Ainda não assina? <Link href="/#planos">Escolher plano</Link></p></section></main>;
}
function LoginFallback() { return <main className="authPage"><section className="authCard"><b>LG Agenda</b><p>Carregando acesso...</p></section></main>; }
export default function LoginPage() { return <Suspense fallback={<LoginFallback />}><LoginContent /></Suspense>; }
