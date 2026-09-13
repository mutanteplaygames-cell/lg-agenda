'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { uniqueSlug } from '@/lib/slug';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');

  async function accountState() {
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { location.replace('/login?next=/onboarding'); return null; }
    const r = await fetch('/api/account/state', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  }

  useEffect(() => { (async () => {
    const state = await accountState();
    if (!state) return setChecking(false);
    if (state.business) { location.replace('/admin'); return; }
    if (!state.hasPaidEntitlement) setMessage('Estamos aguardando a confirmação do pagamento. Se acabou de pagar, aguarde alguns segundos e atualize a página.');
    setChecking(false);
  })(); }, []);

  async function save() {
    if (!name.trim() || whatsapp.replace(/\D/g, '').length < 10) return alert('Informe o nome e o WhatsApp do responsável.');
    setBusy(true);
    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return location.href = '/login?next=/onboarding'; }
    const state = await accountState();
    if (!state?.hasPaidEntitlement) { setBusy(false); return setMessage('Pagamento ainda não confirmado. Aguarde alguns segundos e tente novamente.'); }
    const slug = uniqueSlug(name);
    const { data: biz, error } = await supabase.from('businesses').insert({ owner_id: user.id, name: name.trim(), slug, whatsapp: whatsapp.replace(/\D/g, ''), owner_whatsapp: whatsapp.replace(/\D/g, ''), address: '', bio: '', tolerance_minutes: 0, min_notice_minutes: 60, booking_window_days: 30, primary_color: '#198754', subscription_status: 'pending_verification', access_status: 'active' }).select('id').single();
    if (error) { setBusy(false); return alert(error.message); }
    const act = await fetch('/api/onboarding/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, businessId: biz.id }) });
    const j = await act.json(); setBusy(false);
    if (!act.ok) return alert(j.error || 'Pagamento ainda não confirmado.');
    location.href = '/admin';
  }

  if (checking) return <main className="authPage"><section className="authCard"><b>LG Agenda</b><p>Verificando seu pagamento...</p></section></main>;
  return <main className="authPage"><section className="authCard"><span className="eyebrowM">ÚLTIMO PASSO</span><h1>Configure seu estabelecimento</h1><p>Se você fechar esta página, ao entrar novamente voltará automaticamente para esta etapa até concluir a configuração.</p>{message && <div className="infoCallout">{message}</div>}<label>Nome do estabelecimento<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Lopes Barbearia" /></label><label>WhatsApp do responsável<input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11999999999" /></label><button className="checkoutPrimary" disabled={!name || busy} onClick={save}>{busy ? 'Salvando...' : 'Criar meu estabelecimento →'}</button></section></main>;
}
