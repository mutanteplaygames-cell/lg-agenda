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
    if (params.get('confirmed') === '1') {
      setMsg('E-mail confirmado. Agora você já pode entrar.');
    }
  }, [params]);

  async function go() {
    if (!email || !password) return setMsg('Informe e-mail e senha.');
    setBusy(true);
    setMsg('');

    try {
      const { error } = await supabaseBrowser().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      const next = params.get('next');
      window.location.href = next && next.startsWith('/') ? next : '/admin';
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
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') go();
            }}
          />
        </label>

        {msg && <div className="infoCallout">{msg}</div>}

        <button className="checkoutPrimary" onClick={go} disabled={busy}>
          {busy ? 'Entrando...' : 'Entrar →'}
        </button>

        <p>Ainda não assina? <Link href="/#planos">Escolher plano</Link></p>
      </section>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="authPage">
      <section className="authCard">
        <Link href="/" className="authLogo">LG Agenda</Link>
        <span className="eyebrowM">ACESSO DO ESTABELECIMENTO</span>
        <h1>Entrar</h1>
        <p>Carregando acesso...</p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
