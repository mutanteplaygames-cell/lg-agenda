import { PLANS, PlanKey } from './config';
import { canonicalSiteUrl } from './site-url';

export async function createPreference(args:{plan:PlanKey; email:string; userId:string}){
  const token=process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const site=canonicalSiteUrl();
  if(!token) throw new Error('Mercado Pago não configurado.');
  const plan=PLANS[args.plan];
  const items:any[]=[{id:`plan-${args.plan}`,title:`LG Agenda - Plano ${plan.label}`,quantity:1,currency_id:'BRL',unit_price:plan.price}];
  const externalReference=`${args.userId}:${args.plan}:base:${Date.now()}`;
  const body={items,payer:{email:args.email},external_reference:externalReference,back_urls:{success:`${site}/payment/return?result=success`,pending:`${site}/payment/return?result=pending`,failure:`${site}/payment/return?result=failure`},auto_return:'approved',notification_url:`${site}/api/payments/webhook`,statement_descriptor:'LG AGENDA'};
  const r=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(`Mercado Pago: ${await r.text()}`);
  return r.json();
}
