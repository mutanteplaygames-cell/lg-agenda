'use client';
import {useMemo,useState} from 'react';

type Row={id:string;name:string;plan:string;status:string;appointments:number;revenue:number;mrr:number;support:number;createdAt:string};
const today=new Date('2026-09-12T12:44:00-03:00');
const demo:Row[]=[
 {id:'biz_lopes',name:'Lopes Barbearia',plan:'Mensal',status:'Ativo',appointments:184,revenue:7810,mrr:49.90,support:0,createdAt:'2026-09-01'},
 {id:'biz_prime',name:'Studio Prime',plan:'Anual',status:'Ativo',appointments:312,revenue:13980,mrr:44.16,support:1,createdAt:'2026-08-15'},
 {id:'biz_central',name:'Barbearia Central',plan:'Trimestral',status:'Ativo',appointments:97,revenue:4620,mrr:46.63,support:0,createdAt:'2026-09-07'},
 {id:'biz_vinao',name:'Barbearia Vinão',plan:'Mensal',status:'Ativo',appointments:221,revenue:10540,mrr:49.90,support:2,createdAt:'2026-09-10'},
 {id:'biz_royal',name:'Royal Barber',plan:'Semestral',status:'Ativo',appointments:148,revenue:6890,mrr:44.98,support:0,createdAt:'2026-07-19'}
];

function scaleFor(period:string){
 if(period==='today') return .045;
 if(period==='7d') return .24;
 if(period==='30d') return 1;
 if(period==='month') return .52;
 return 1;
}

export default function Master(){
 const [period,setPeriod]=useState('today');
 const [sort,setSort]=useState<'revenue'|'appointments'|'support'|'name'>('revenue');
 const [from,setFrom]=useState('2026-09-01');
 const [to,setTo]=useState('2026-09-12');
 const [search,setSearch]=useState('');
 const [selected,setSelected]=useState<string|null>(null);
 const [reply,setReply]=useState('');
 const factor=period==='custom'?Math.max(.03,Math.min(1,((new Date(to).getTime()-new Date(from).getTime())/86400000+1)/30)):scaleFor(period);
 const rows=useMemo(()=>demo.map(x=>({...x,appointments:Math.max(0,Math.round(x.appointments*factor)),revenue:Math.round(x.revenue*factor),support:period==='today'?x.support:Math.max(x.support,Math.round(x.support/factor||0))})).filter(x=>x.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='revenue'?b.revenue-a.revenue:sort==='appointments'?b.appointments-a.appointments:sort==='support'?b.support-a.support:a.name.localeCompare(b.name)),[factor,search,sort,period]);
 const totalAppointments=rows.reduce((t,x)=>t+x.appointments,0);
 const totalRevenue=rows.reduce((t,x)=>t+x.revenue,0);
 const totalMRR=demo.reduce((t,x)=>t+x.mrr,0);
 const openSupport=demo.reduce((t,x)=>t+x.support,0);
 const selectedRow=demo.find(x=>x.id===selected);
 return <main className="masterPage">
  <header className="masterTop"><div><span className="eyebrow">LG AGENDA • ADMIN GERAL</span><h1>Central de operação</h1><p>Estabelecimentos, receita, ranking e suporte em um só lugar.</p></div><a href="/admin" className="ghostBtn">← Painel estabelecimento</a></header>

  <section className="masterFilters panel">
   <div className="quickPeriods">
    {([['today','Hoje'],['7d','7 dias'],['30d','30 dias'],['month','Este mês'],['custom','Personalizado']] as const).map(([k,l])=><button key={k} className={period===k?'active':''} onClick={()=>setPeriod(k)}>{l}</button>)}
   </div>
   {period==='custom'&&<div className="customRange"><label>De<input type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label><label>Até<input type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label></div>}
   <div className="masterFilterRight"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar estabelecimento..."/><select value={sort} onChange={e=>setSort(e.target.value as any)}><option value="revenue">Rankear: faturamento</option><option value="appointments">Rankear: agendamentos</option><option value="support">Rankear: suporte aberto</option><option value="name">Ordenar: nome</option></select></div>
  </section>

  <section className="masterMetrics"><article><span>Estabelecimentos ativos</span><b>{demo.length}</b><small>operações ativas</small></article><article><span>MRR estimado</span><b>R$ {totalMRR.toFixed(2).replace('.',',')}</b><small>receita recorrente mensal</small></article><article><span>Agendamentos no período</span><b>{totalAppointments}</b><small>filtro selecionado</small></article><article><span>Faturamento movimentado</span><b>R$ {totalRevenue.toLocaleString('pt-BR')}</b><small>serviços concluídos/previstos</small></article><article><span>Suporte aberto</span><b>{openSupport}</b><small>conversas aguardando</small></article></section>

  <div className="masterGrid">
   <section className="panel"><div className="panelTitle"><div><span className="sectionIcon">▦</span><div><h2>Ranking de estabelecimentos</h2><p>Os dados respeitam o filtro de período acima.</p></div></div></div><div className="masterTable"><div className="masterRow head"><span># / Estabelecimento</span><span>Plano</span><span>Status</span><span>Agendamentos</span><span>Faturamento</span><span>MRR</span></div>{rows.map((x,i)=><button className="masterRow masterRowButton" key={x.id} onClick={()=>setSelected(x.id)}><b><i className={`rankBadge ${i<3?'podium':''}`}>{i+1}</i>{x.name}</b><span>{x.plan}</span><em>{x.status}</em><span>{x.appointments}</span><strong>R$ {x.revenue.toLocaleString('pt-BR')}</strong><span>R$ {x.mrr.toFixed(2).replace('.',',')}</span></button>)}</div></section>

   <section className="panel masterSupport"><div className="panelTitle"><div><span className="sectionIcon">◉</span><div><h2>Suporte</h2><p>Selecione um estabelecimento para atender.</p></div></div></div>{selectedRow?<><div className="supportSelected"><b>{selectedRow.name}</b><span>{selectedRow.support} chamado(s) aberto(s)</span><small>ID interno: {selectedRow.id}</small></div><div className="masterChat"><div className="supportTicket"><small>{selectedRow.name} • 10 min atrás</small><b>Preciso de ajuda com a agenda de um profissional.</b></div></div><div className="masterComposer"><textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Digite sua resposta..."/><button className="saveBtn" onClick={()=>{if(reply.trim()){alert('Resposta registrada na demo. Com o backend, ela chegará ao painel do estabelecimento.');setReply('')}}}>Enviar resposta</button></div></>:<div className="emptyState"><b>Nenhum estabelecimento selecionado</b><p>Clique em uma linha do ranking para abrir o suporte.</p></div>}</section>
  </div>

  <section className="masterLeaders">
   <article className="panel"><span className="eyebrow">TOP FATURAMENTO</span><h3>{[...rows].sort((a,b)=>b.revenue-a.revenue)[0]?.name||'—'}</h3><b>R$ {[...rows].sort((a,b)=>b.revenue-a.revenue)[0]?.revenue.toLocaleString('pt-BR')||'0'}</b></article>
   <article className="panel"><span className="eyebrow">TOP AGENDAMENTOS</span><h3>{[...rows].sort((a,b)=>b.appointments-a.appointments)[0]?.name||'—'}</h3><b>{[...rows].sort((a,b)=>b.appointments-a.appointments)[0]?.appointments||0} reservas</b></article>
   <article className="panel"><span className="eyebrow">MAIS SUPORTE</span><h3>{[...demo].sort((a,b)=>b.support-a.support)[0]?.name||'—'}</h3><b>{[...demo].sort((a,b)=>b.support-a.support)[0]?.support||0} chamado(s)</b></article>
  </section>
 </main>
}
