import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
export async function POST(req:Request){
 try{
  const {businessId,professionalId,serviceId,name,phone,startsAt,reminderOptIn}=await req.json(); const db=supabaseAdmin();
  if(!businessId||!professionalId||!serviceId||!name||!phone||!startsAt)return NextResponse.json({error:'Dados incompletos.'},{status:400});
  const [{data:biz},{data:svc}]=await Promise.all([db.from('businesses').select('subscription_status,tolerance_minutes,min_notice_minutes').eq('id',businessId).single(),db.from('services').select('price_cents,duration_minutes,buffer_minutes').eq('id',serviceId).eq('business_id',businessId).single()]);
  if(!biz||biz.subscription_status!=='active'||!svc)return NextResponse.json({error:'Agenda indisponível.'},{status:400});
  const start=new Date(startsAt); if(start.getTime()<Date.now()+(biz.min_notice_minutes||60)*60000)return NextResponse.json({error:'Horário muito próximo.'},{status:409});
  const end=new Date(start.getTime()+svc.duration_minutes*60000); const blockEnd=new Date(end.getTime()+(svc.buffer_minutes||0)*60000);
  const {data:conflicts}=await db.from('appointments').select('id').eq('business_id',businessId).eq('professional_id',professionalId).not('status','in','("cancelled","no_show")').lt('starts_at',blockEnd.toISOString()).gt('ends_at',start.toISOString()).limit(1);
  if(conflicts?.length)return NextResponse.json({error:'Este horário acabou de ser ocupado. Escolha outro.'},{status:409});
  let {data:customer}=await db.from('customers').select('id').eq('business_id',businessId).eq('phone',phone).maybeSingle();
  if(!customer){const created=await db.from('customers').insert({business_id:businessId,name,phone}).select('id').single();customer=created.data;}
  const reminderAt=new Date(start.getTime()-4*3600000);
  const {data:appt,error}=await db.from('appointments').insert({business_id:businessId,professional_id:professionalId,service_id:serviceId,customer_id:customer!.id,starts_at:start.toISOString(),ends_at:end.toISOString(),status:'scheduled',price_cents:svc.price_cents,reminder_opt_in:!!reminderOptIn,reminder_at:reminderOptIn?reminderAt.toISOString():null,reminder_status:reminderOptIn?'pending':'disabled'}).select('id').single();
  if(error)throw error; return NextResponse.json({ok:true,id:appt.id});
 }catch(e:any){return NextResponse.json({error:e.message||'Erro ao agendar.'},{status:500})}
}
