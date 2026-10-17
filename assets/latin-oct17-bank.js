export function normal(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' -]/g,' ').replace(/\s+/g,' ').trim()}
export function modelMatch(q,value){
 const a=normal(value);if(!a)return false;
 return q.answer.accepted.some(v=>{
  const b=normal(v);if(a===b)return true;
  return q.answer.allowLatinWordOrder&&a.split(' ').sort().join(' ')===b.split(' ').sort().join(' ');
 });
}
export function selectQuestions(bank,topic,size,previous=[],random=Math.random){
 const eligible=bank.questions.filter(q=>topic==='all'?!q.optional:q.topicId===topic);
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const groups=shuffle([...new Set(eligible.map(q=>q.topicId))]).map(t=>shuffle(eligible.filter(q=>q.topicId===t&&!previous.includes(q.id))).concat(shuffle(eligible.filter(q=>q.topicId===t&&previous.includes(q.id)))));
 const selected=[];while(selected.length<Math.min(size,eligible.length)){let found=false;for(const g of groups){if(g.length&&selected.length<size){selected.push(g.shift());found=true}}if(!found)break}
 return selected;
}
