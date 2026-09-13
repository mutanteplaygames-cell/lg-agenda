export function slugify(input:string){
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48) || 'estabelecimento';
}
export function uniqueSlug(base:string){
  return `${slugify(base)}-${Math.random().toString(36).slice(2,7)}`;
}
