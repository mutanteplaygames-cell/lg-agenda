import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/auth-server';

export const runtime='nodejs';

export async function POST(req:Request){
 try{
  const user=await getRequestUser(req);
  if(!user)return NextResponse.json({error:'Não autorizado.'},{status:401});
  const form=await req.formData();
  const file=form.get('file');
  const businessId=String(form.get('businessId')||'');
  const professionalId=String(form.get('professionalId')||'novo');
  if(!(file instanceof File)||!businessId)return NextResponse.json({error:'Arquivo inválido.'},{status:400});
  if(!file.type.startsWith('image/'))return NextResponse.json({error:'Envie uma imagem.'},{status:400});
  if(file.size>3*1024*1024)return NextResponse.json({error:'A foto deve ter no máximo 3 MB.'},{status:400});
  const db=supabaseAdmin();
  const {data:biz}=await db.from('businesses').select('id').eq('id',businessId).eq('owner_id',user.id).maybeSingle();
  if(!biz)return NextResponse.json({error:'Estabelecimento inválido.'},{status:403});
  const bucket='professional-photos';
  const {data:buckets}=await db.storage.listBuckets();
  if(!(buckets||[]).some((b:any)=>b.name===bucket))await db.storage.createBucket(bucket,{public:true,fileSizeLimit:3*1024*1024,allowedMimeTypes:['image/jpeg','image/png','image/webp','image/gif']});
  const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';
  const path=`${businessId}/${professionalId}-${Date.now()}.${ext}`;
  const bytes=new Uint8Array(await file.arrayBuffer());
  const {error}=await db.storage.from(bucket).upload(path,bytes,{contentType:file.type,upsert:false});
  if(error)throw error;
  const {data}=db.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({url:data.publicUrl});
 }catch(e:any){return NextResponse.json({error:e.message||'Falha ao enviar foto.'},{status:500})}
}
