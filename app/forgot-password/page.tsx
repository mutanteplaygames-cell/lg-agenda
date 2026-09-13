'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');

  async function send() {
    if (!email.trim()) return setMsg('Informe seu e-mail.');
    setBusy(true);
    setMsg('');
    try {
      const sb = supabaseBrowser();
      const origin = window.location.origin;
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setMsg(e?.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authPage"><section className="authCard">
    <Link href="/" className="authLogo">LG Agenda</Link>
    <span className="eyebrowM">RECUPERAÇÃO DE ACESSO</span>
    <h1>Esqueci minha senha</h1>
    {!sent ? <>
      <p>Digite o e-mail da sua conta. Enviaremos um link seguro para você criar uma nova senha.</p>
      <label>E-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} /></label>
      {msg && <div className="infoCallout">{msg}</div>}
      <button className="checkoutPrimary" onClick={send} disabled={busy}>{busy?'Enviando...':'Enviar link de recuperação →'}</button>
    </> : <div className="infoCallout" style={{marginBottom:18}}>Se esse e-mail estiver cadastrado, o link de recuperação foi enviado. Confira também a caixa de spam.</div>}
    <p><Link href="/login">← Voltar para o login</Link></p>
  </section></main>;
}
