import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function sendWhatsApp(to:string,params:string[]){
 const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID; const token=process.env.WHATSAPP_ACCESS_TOKEN; const template=process.env.WHATSAPP_TEMPLATE_REMINDER||'lg_agenda_reminder_4h';
 if(!phoneId||!token) throw new Error('WhatsApp não configurado.');
 const components=[{type:'body',parameters:params.map(text=>({type:'text',text}))}];
 const r=await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:to.replace(/\D/g,''),type:'template',template:{name:template,language:{code:'pt_BR'},components}})});
 if(!r.ok) throw new Error(await r.text()); return r.json();
}

export async function POST(req:Request){
 const secret=req.headers.get('x-cron-secret'); if(!process.env.CRON_SECRET||secret!==process.env.CRON_SECRET)return NextResponse.json({error:'unauthorized'},{status:401});
 const db=supabaseAdmin(); const now=new Date(); const until=new Date(now.getTime()+10*60000);
 const {data:rows}=await db.from('appointments').select('id,starts_at,customers(name,phone),professionals(name),services(name),businesses(name),subscriptions(whatsapp_addon,status)').eq('reminder_status','pending').lte('reminder_at',until.toISOString()).gte('reminder_at',new Date(now.getTime()-15*60000).toISOString()).limit(100);
 let sent=0,failed=0;
 for(const a of rows||[]){try{const sub=Array.isArray((a as any).subscriptions)?(a as any).subscriptions[0]:(a as any).subscriptions;if(!sub?.whatsapp_addon||sub.status!=='active')continue;const dt=new Date((a as any).starts_at);const time=dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});await sendWhatsApp((a as any).customers.phone,[(a as any).customers.name,(a as any).businesses.name,(a as any).services.name,time,(a as any).professionals.name]);await db.from('appointments').update({reminder_status:'sent',reminder_sent_at:new Date().toISOString()}).eq('id',(a as any).id);sent++;}catch{failed++;}}
 return NextResponse.json({ok:true,sent,failed});
}
