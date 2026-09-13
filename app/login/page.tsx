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

  useEffect(() => {
    if (params.get('confirmed') === '1') setMsg('E-mail confirmado. Agora você já pode entrar.');
    if (params.get('reset') === '1') setMsg('Senha alterada com sucesso. Entre com a nova senha.');
  }, [params]);

  async function go() {
    if (!email || !password) return setMsg('Informe e-mail e senha.');
    setBusy(true);
    setMsg('');
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.session) throw new Error('Não foi possível iniciar sua sessão.');

      // Verifica o destino sem mandar o usuário silenciosamente para a home em caso de erro.
      const r = await fetch('/api/account/state', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: 'no-store',
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || 'Login realizado, mas não foi possível verificar sua conta. Tente novamente em alguns segundos.');
      }
      const state = await r.json();
      if (state?.mustChangePassword) return location.replace('/reset-password?force=1');
      const requested = params.get('next');

      if (requested === '/master') {
        if (state?.isMaster) return location.replace('/master');
        return location.replace('/admin');
      }

      if (state?.business) {
        return location.replace(requested && requested.startsWith('/') ? requested : '/admin');
      }

      // Se ainda não existe estabelecimento, nunca jogamos o usuário de volta para a home.
      // O onboarding informa se o pagamento ainda está pendente e preserva a sessão.
      return location.replace('/onboarding');
    } catch (e: any) {
      setMsg(e?.message || 'Não foi possível entrar. Confira seus dados.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authCard">
        <Link href="/" className="authLogo">LG Agenda</Link>
        <span className="eyebrowM">ACESSO DO ESTABELECIMENTO</span>
        <h1>Entrar</h1>
        <p>Use o e-mail e a senha cadastrados na contratação.</p>
        <label>
          E-mail
          <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go(); }} />
        </label>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:'-6px',marginBottom:'12px',flexWrap:'wrap'}}>
          <a href="https://wa.me/5511993193262?text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20para%20acessar%20minha%20conta%20no%20LG%20Agenda.%20Nome%20do%20estabelecimento%3A%20%20E-mail%20utilizado%20no%20cadastro%3A%20%20Motivo%3A%20" target="_blank" rel="noreferrer" style={{fontSize:13,fontWeight:800,color:'#0e9f6e',textDecoration:'none'}}>Falar com o suporte</a>
          <Link href="/forgot-password" style={{fontSize:13,fontWeight:800,color:'#0e9f6e',textDecoration:'none'}}>Esqueci minha senha</Link>
        </div>
        {msg && <div className="infoCallout">{msg}</div>}
        <button className="checkoutPrimary" onClick={go} disabled={busy}>{busy ? 'Entrando...' : 'Entrar →'}</button>
        <p>Ainda não assina? <Link href="/#planos">Escolher plano</Link></p>
      </section>
    </main>
  );
}

function LoginFallback() {
  return <main className="authPage"><section className="authCard"><b>LG Agenda</b><p>Carregando acesso...</p></section></main>;
}

export default function LoginPage() {
  return <Suspense fallback={<LoginFallback />}><LoginContent /></Suspense>;
}
