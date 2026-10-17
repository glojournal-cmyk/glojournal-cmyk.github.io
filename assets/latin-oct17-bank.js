export function normal(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' -]/g,' ').replace(/\s+/g,' ').trim()}
export function modelMatch(q,value){
 const canon=v=>{const n=normal(v);return q.type==='vocabulary'?n.replace(/^(?:a|an|the|to) /,''):n};
 const a=canon(value);if(!a)return false;
 return q.answer.accepted.some(v=>{
  const b=canon(v);if(a===b)return true;
  if(!q.answer.allowLatinWordOrder)return false;
  // Preserve preposition phrases and clause membership before allowing free word order.
  for(const phrase of ['cum troianis','in agros'])if(b.includes(phrase)&&!a.includes(phrase))return false;
  if(b==='cum multa pecunia'&&a.split(' ').indexOf('cum')>a.split(' ').indexOf('pecunia'))return false;
  const clauses=s=>s.split(/\b(sed|et)\b/).map(part=>part.trim().split(' ').sort().join(' ')).join('|');
  return clauses(a)===clauses(b);
 });
}
export function selectQuestions(bank,topic,size,previous=[],random=Math.random){
 const eligible=bank.questions.filter(q=>topic==='all'?!q.optional:q.topicId===topic);
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const groups=shuffle([...new Set(eligible.map(q=>q.topicId))]).map(t=>shuffle(eligible.filter(q=>q.topicId===t&&!previous.includes(q.id))).concat(shuffle(eligible.filter(q=>q.topicId===t&&previous.includes(q.id)))));
 const selected=[];while(selected.length<Math.min(size,eligible.length)){let found=false;for(const g of groups){if(g.length&&selected.length<size){selected.push(g.shift());found=true}}if(!found)break}
 return selected;
}
