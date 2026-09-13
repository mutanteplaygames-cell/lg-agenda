import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const {slug}=await params; const db=supabaseAdmin();
    const {data:business,error}=await db.from('businesses').select('id,name,slug,logo_url,cover_url,primary_color,address,bio,tolerance_minutes,min_notice_minutes,booking_window_days,subscription_status').eq('slug',slug).eq('subscription_status','active').single();
    if(error||!business)return NextResponse.json({error:'Agenda indisponível.'},{status:404});
    const [cats,services,pros,schedules,links,blocks]=await Promise.all([
      db.from('categories').select('*').eq('business_id',business.id).eq('active',true),
      db.from('services').select('*').eq('business_id',business.id).eq('active',true),
      db.from('professionals').select('*').eq('business_id',business.id).eq('active',true),
      db.from('weekly_schedules').select('*').eq('business_id',business.id),
      db.from('professional_categories').select('*').eq('business_id',business.id),
      db.from('schedule_blocks').select('*').eq('business_id',business.id)
    ]);
    return NextResponse.json({business,categories:cats.data||[],services:services.data||[],professionals:pros.data||[],schedules:schedules.data||[],professionalCategories:links.data||[],blocks:blocks.data||[]});
  }catch(e:any){return NextResponse.json({error:e.message},{status:500})}
}
