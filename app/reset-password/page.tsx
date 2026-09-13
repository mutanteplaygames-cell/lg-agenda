'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

function ResetContent(){
  const params=useSearchParams();
  const [ready,setReady]=useState(false);
  const [pass,setPass]=useState('');
  const [pass2,setPass2]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('Validando link de recuperação...');

  useEffect(()=>{(async()=>{
    const sb=supabaseBrowser();
    try{
      const code=params.get('code');
      if(code){
        const {error}=await sb.auth.exchangeCodeForSession(code);
        if(error) throw error;
      }
      const {data:{session}}=await sb.auth.getSession();
      if(session){setReady(true);setMsg('');return;}
      // Links no fluxo implícito são processados pelo cliente a partir do hash da URL.
      const {data:{subscription}}=sb.auth.onAuthStateChange((event,session)=>{
        if((event==='PASSWORD_RECOVERY'||event==='SIGNED_IN')&&session){setReady(true);setMsg('');}
      });
      setTimeout(async()=>{
        const {data:{session:s}}=await sb.auth.getSession();
        if(s){setReady(true);setMsg('');}
        else setMsg('Este link é inválido ou expirou. Solicite um novo link de recuperação.');
        subscription.unsubscribe();
      },1200);
    }catch(e:any){setMsg(e?.message||'Link inválido ou expirado.');}
  })()},[params]);

  async function save(){
    if(pass.length<6)return setMsg('A nova senha precisa ter pelo menos 6 caracteres.');
    if(pass!==pass2)return setMsg('As senhas não coincidem.');
    setBusy(true);setMsg('');
    try{
      const sb=supabaseBrowser();
      const {error}=await sb.auth.updateUser({password:pass,data:{must_change_password:false}});
      if(error)throw error;
      await sb.auth.signOut();
      location.replace('/login?reset=1');
    }catch(e:any){setMsg(e?.message||'Não foi possível alterar a senha.');}
    finally{setBusy(false)}
  }

  return <main className="authPage"><section className="authCard">
    <Link href="/" className="authLogo">LG Agenda</Link>
    <span className="eyebrowM">NOVA SENHA</span>
    <h1>Crie uma nova senha</h1>
    {!ready?<><p>{msg}</p><p><Link href="/forgot-password">Solicitar outro link</Link></p></>:<>
      <p>Escolha uma nova senha para sua conta.</p>
      <label>Nova senha<input type="password" autoComplete="new-password" value={pass} onChange={e=>setPass(e.target.value)} /></label>
      <label>Confirmar nova senha<input type="password" autoComplete="new-password" value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')save()}} /></label>
      {msg&&<div className="infoCallout">{msg}</div>}
      <button className="checkoutPrimary" onClick={save} disabled={busy}>{busy?'Salvando...':'Alterar senha →'}</button>
    </>}
  </section></main>
}

function Fallback(){return <main className="authPage"><section className="authCard"><b>LG Agenda</b><p>Carregando...</p></section></main>}
export default function ResetPasswordPage(){return <Suspense fallback={<Fallback/>}><ResetContent/></Suspense>}
