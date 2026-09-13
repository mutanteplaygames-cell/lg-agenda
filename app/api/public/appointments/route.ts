import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
const GRACE=48*3600000;

function localParts(d:Date){
 const f=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,weekday:'short'});
 const p:any={};for(const x of f.formatToParts(d))if(x.type!=='literal')p[x.type]=x.value;
 const weekdayMap:any={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
 return {year:p.year,month:p.month,day:p.day,hour:p.hour,minute:p.minute,weekday:weekdayMap[p.weekday]};
}
function hhmm(v?:string|null){return String(v||'').slice(0,5)}

export async function POST(req:Request){
 try{
  const {businessId,professionalId,serviceId,name,phone,startsAt,reminderOptIn}=await req.json();const db=supabaseAdmin();
  const cleanPhone=String(phone||'').replace(/\D/g,'');
  if(!businessId||!serviceId||!name||!cleanPhone||!startsAt)return NextResponse.json({error:'Dados incompletos.'},{status:400});
  if(!/^\d{2}9\d{8}$/.test(cleanPhone))return NextResponse.json({error:'WhatsApp inválido. Informe DDD + celular com 9 dígitos.'},{status:400});
  const [{data:biz},{data:svc},{data:sub}]=await Promise.all([
   db.from('businesses').select('subscription_status,access_status,tolerance_minutes,min_notice_minutes').eq('id',businessId).single(),
   db.from('services').select('id,category_id,price_cents,duration_minutes,buffer_minutes,active').eq('id',serviceId).eq('business_id',businessId).single(),
   db.from('subscriptions').select('paid_until,status').eq('business_id',businessId).maybeSingle()
  ]);
  const paid=sub?.paid_until?new Date(sub.paid_until).getTime():0;
  if(!biz||biz.access_status==='blocked'||biz.subscription_status!=='active'||!paid||Date.now()>paid+GRACE||!svc||svc.active===false)return NextResponse.json({error:'Agenda indisponível.'},{status:403});
  const start=new Date(startsAt);if(Number.isNaN(start.getTime()))return NextResponse.json({error:'Data inválida.'},{status:400});
  if(start.getTime()<Date.now()+Math.max(60,biz.min_notice_minutes||60)*60000)return NextResponse.json({error:'Escolha um horário com pelo menos 1 hora de antecedência.'},{status:409});
  const lp=localParts(start);const monthStart=`${lp.year}-${lp.month}-01`;
  const {data:released}=await db.from('released_agenda_months').select('id').eq('business_id',businessId).eq('month_start',monthStart).maybeSingle();
  if(!released)return NextResponse.json({error:'Este mês ainda não foi liberado pelo estabelecimento.'},{status:409});

  const {data:explicit}=await db.from('professional_services').select('professional_id').eq('business_id',businessId).eq('service_id',serviceId);
  let candidateIds=(explicit||[]).map((x:any)=>x.professional_id);
  if(!candidateIds.length){const {data:fallback}=await db.from('professional_categories').select('professional_id').eq('business_id',businessId).eq('category_id',svc.category_id);candidateIds=(fallback||[]).map((x:any)=>x.professional_id)}
  if(professionalId){if(!candidateIds.includes(professionalId))return NextResponse.json({error:'Este profissional não atende esse serviço.'},{status:409});candidateIds=[professionalId]}
  if(!candidateIds.length)return NextResponse.json({error:'Nenhum profissional atende esse serviço.'},{status:409});
  const {data:activePros}=await db.from('professionals').select('id').eq('business_id',businessId).eq('active',true).in('id',candidateIds);
  candidateIds=(activePros||[]).map((x:any)=>x.id);
  const end=new Date(start.getTime()+svc.duration_minutes*60000);const blockEnd=new Date(end.getTime()+(svc.buffer_minutes||0)*60000);
  const selected:string[]=[];
  for(const pid of candidateIds){
   const {data:sch}=await db.from('weekly_schedules').select('*').eq('business_id',businessId).eq('professional_id',pid).eq('weekday',lp.weekday).maybeSingle();
   if(!sch)continue;
   const startHM=`${lp.hour}:${lp.minute}`;const endLocal=new Date(start.getTime()+svc.duration_minutes*60000);const ep=localParts(endLocal);const endHM=`${ep.hour}:${ep.minute}`;
   if(startHM<hhmm(sch.start_time)||endHM>hhmm(sch.end_time))continue;
   if(sch.lunch_start&&sch.lunch_end&&startHM<hhmm(sch.lunch_end)&&endHM>hhmm(sch.lunch_start))continue;
   const [{data:conflicts},{data:manualBlocks}]=await Promise.all([
    db.from('appointments').select('id').eq('business_id',businessId).eq('professional_id',pid).not('status','in','("cancelled","no_show")').lt('starts_at',blockEnd.toISOString()).gt('ends_at',start.toISOString()).limit(1),
    db.from('schedule_blocks').select('id').eq('business_id',businessId).eq('professional_id',pid).lt('starts_at',blockEnd.toISOString()).gt('ends_at',start.toISOString()).limit(1)
   ]);
   if(!conflicts?.length&&!manualBlocks?.length)selected.push(pid);
  }
  if(!selected.length)return NextResponse.json({error:'Este horário acabou de ser ocupado. Escolha outro.'},{status:409});
  const chosen=professionalId?professionalId:selected[Math.floor(Math.random()*selected.length)];
  let {data:customer}=await db.from('customers').select('id').eq('business_id',businessId).eq('phone',cleanPhone).maybeSingle();
  if(!customer){const created=await db.from('customers').insert({business_id:businessId,name,phone:cleanPhone}).select('id').single();if(created.error)throw created.error;customer=created.data}else await db.from('customers').update({name}).eq('id',customer.id);
  const reminderAt=new Date(start.getTime()-4*3600000);
  const {data:appt,error}=await db.from('appointments').insert({business_id:businessId,professional_id:chosen,service_id:serviceId,customer_id:customer!.id,starts_at:start.toISOString(),ends_at:end.toISOString(),status:'scheduled',price_cents:svc.price_cents,reminder_opt_in:!!reminderOptIn,reminder_at:reminderOptIn?reminderAt.toISOString():null,reminder_status:reminderOptIn?'pending':'disabled'}).select('id,professional_id').single();
  if(error)throw error;return NextResponse.json({ok:true,id:appt.id,professionalId:appt.professional_id});
 }catch(e:any){return NextResponse.json({error:e.message||'Erro ao agendar.'},{status:500})}
}
