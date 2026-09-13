import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
const GRACE=48*3600000;
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
 try{
  const {slug}=await params;const db=supabaseAdmin();
  const {data:business,error}=await db.from('businesses').select('id,name,slug,logo_url,cover_url,primary_color,address,bio,tolerance_minutes,min_notice_minutes,booking_window_days,subscription_status,access_status').eq('slug',slug).single();
  if(error||!business)return NextResponse.json({error:'Agenda não encontrada.'},{status:404});
  const {data:sub}=await db.from('subscriptions').select('status,paid_until').eq('business_id',business.id).maybeSingle();
  const paid=sub?.paid_until?new Date(sub.paid_until).getTime():0;const now=Date.now();const allowed=business.access_status!=='blocked'&&business.subscription_status==='active'&&!!paid&&now<=paid+GRACE;
  if(!allowed)return NextResponse.json({error:'Agenda temporariamente indisponível. Entre em contato com o estabelecimento.'},{status:403});
  const [cats,services,pros,schedules,links,serviceLinks,blocks,appointments,released]=await Promise.all([
   db.from('categories').select('*').eq('business_id',business.id).eq('active',true),
   db.from('services').select('*').eq('business_id',business.id).eq('active',true),
   db.from('professionals').select('*').eq('business_id',business.id).eq('active',true),
   db.from('weekly_schedules').select('*').eq('business_id',business.id),
   db.from('professional_categories').select('*').eq('business_id',business.id),
   db.from('professional_services').select('*').eq('business_id',business.id),
   db.from('schedule_blocks').select('*').eq('business_id',business.id).gte('ends_at',new Date().toISOString()),
   db.from('appointments').select('id,professional_id,starts_at,ends_at,status').eq('business_id',business.id).gte('ends_at',new Date().toISOString()).not('status','in','("cancelled","no_show")'),
   db.from('released_agenda_months').select('month_start').eq('business_id',business.id).order('month_start',{ascending:true})
  ]);
  return NextResponse.json({business,categories:cats.data||[],services:services.data||[],professionals:pros.data||[],schedules:schedules.data||[],professionalCategories:links.data||[],professionalServices:serviceLinks.data||[],blocks:blocks.data||[],appointments:appointments.data||[],releasedMonths:(released.data||[]).map((x:any)=>x.month_start)});
 }catch(e:any){return NextResponse.json({error:e.message||'Falha ao abrir agenda.'},{status:500})}
}
