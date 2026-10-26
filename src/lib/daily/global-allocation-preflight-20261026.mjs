// Pure allocation prototype. No runtime import or student-data changes.
// Candidate lists must be PRE-FILTERED for taught, mode, due date, already-correct,
// mark-scheme quality and other learner-specific rules.
const clean = x => String(x??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
export function allocateGlobalQuestions(tasks=[]){
 const candidates=tasks.flatMap((task,i)=>(task.candidates||[]).filter(q=>q?.id).map(q=>({q,i})));
 const par=candidates.map((_,i)=>i);
 const root=i=>par[i]===i?i:(par[i]=root(par[i]));
 const union=(a,b)=>{a=root(a);b=root(b);if(a!==b)par[b]=a;};
 const seen=new Map();
 candidates.forEach(({q},i)=>{
  const keys=['id:'+q.id];
  const family=q.questionFamily||q.familyId;
  if(family)keys.push('family:'+family);
  const question=clean(q.prompt||q.question);
  const rawStim=typeof q.stimulus==='string'?q.stimulus:q.stimulus?.text||q.stimulus?.masked||'';
  if(question)keys.push('fingerprint:'+question+'|'+clean(rawStim)+'|'+clean(q.format));
  for(const k of keys){const earlier=seen.get(k);if(earlier!==undefined)union(i,earlier);else seen.set(k,i);}
 });
 const options=tasks.map(()=>new Map());
 candidates.forEach(({q,i},ix)=>{const k=root(ix);if(!options[i].has(k))options[i].set(k,q);});
 const slots=[];
 tasks.forEach((t,i)=>{const count=Math.max(0,Math.floor(Number(t.target)||0));for(let j=0;j<count;j++)slots.push({i,j,possibilities:[...options[i].keys()]});});
 slots.sort((a,b)=>a.possibilities.length-b.possibilities.length||a.i-b.i||a.j-b.j);
 const matched=new Map();
 function augment(slot,visited){
  for(const k of slot.possibilities){
   if(visited.has(k))continue;visited.add(k);
   const prior=matched.get(k);
   if(!prior||augment(prior,visited)){matched.set(k,slot);return true;}
  }
  return false;
 }
 for(const slot of slots)augment(slot,new Set());
 const rows=tasks.map(t=>({id:t.id,requested:Math.max(0,Math.floor(Number(t.target)||0)),items:[],deficit:0}));
 for(const[k,slot]of matched)rows[slot.i].items.push(options[slot.i].get(k));
 for(const row of rows){row.deficit=Math.max(0,row.requested-row.items.length);row.assigned=row.items.length;}
 const shortfall=rows.reduce((n,r)=>n+r.deficit,0);
 return {status:shortfall?'PARTIAL_READY':'FULL_READY',requested:rows.reduce((n,r)=>n+r.requested,0),assigned:matched.size,shortfall,rows};
}
