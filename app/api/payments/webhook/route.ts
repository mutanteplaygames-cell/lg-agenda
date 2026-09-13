import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANS, type PlanKey } from '@/lib/config';

export async function POST(req:Request){
  try{
    const token=process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const body=await req.json().catch(()=>({}));
    const url=new URL(req.url);
    const paymentId=body?.data?.id||url.searchParams.get('data.id')||url.searchParams.get('id');
    if(!paymentId||!token) return NextResponse.json({ok:true});
    const r=await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`,{headers:{Authorization:`Bearer ${token}`}});
    if(!r.ok) return NextResponse.json({ok:true});
    const payment=await r.json();
    if(payment.status!=='approved') return NextResponse.json({ok:true});
    const ref=String(payment.external_reference||'');
    const [userId,planKey,waFlag]=ref.split(':');
    const plan=PLANS[planKey as PlanKey];
    if(!userId||!plan) return NextResponse.json({ok:true});
    const db=supabaseAdmin();
    const paidUntil=new Date(); paidUntil.setMonth(paidUntil.getMonth()+plan.months);
    await db.from('purchase_entitlements').upsert({owner_id:userId,provider:'mercadopago',provider_payment_id:String(payment.id),plan:planKey,status:'active',whatsapp_addon:waFlag==='wa',paid_until:paidUntil.toISOString(),updated_at:new Date().toISOString()},{onConflict:'owner_id'});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({ok:true})}
}
