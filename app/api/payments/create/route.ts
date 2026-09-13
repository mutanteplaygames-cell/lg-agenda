import { NextResponse } from 'next/server';
import { createPreference } from '@/lib/mercadopago';
import { PLANS, type PlanKey } from '@/lib/config';

export async function POST(req:Request){
  try{
    const {plan,whatsapp,email,userId}=await req.json();
    if(!PLANS[plan as PlanKey]||!email||!userId) return NextResponse.json({error:'Dados inválidos.'},{status:400});
    const pref=await createPreference({plan,whatsapp:!!whatsapp,email,userId});
    return NextResponse.json({id:pref.id,url:pref.init_point,sandboxUrl:pref.sandbox_init_point});
  }catch(e:any){return NextResponse.json({error:e.message||'Erro ao criar pagamento.'},{status:500})}
}
