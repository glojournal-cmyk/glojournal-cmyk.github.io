// Standalone school-assessment question selection and end-of-paper marking.
// Does not import or mutate Scholar's Daily, Mastery, XP, MP or progress stores.
export const CATEGORIES = Object.freeze([
  {id:'history',title:'C1.5 · History of the Atom',short:'History of the Atom',count:8},
  {id:'atomic',title:'C1.6 · Atomic Structure',short:'Atomic Structure',count:10},
  {id:'formula',title:'Chemical Formulae',short:'Chemical Formulae',count:14},
  {id:'balance',title:'Balancing Equations',short:'Balancing Equations',count:30}
]);
export const STORE_KEY='lux-chemistry-exam-revision-20261116-v1';
const expectedCounts=Object.fromEntries(CATEGORIES.map(x=>[x.id,x.count]));

export function categoryOf(question){
  const id=String(question?.id||'');
  if(!id.includes('nov16-2026-')||question.status!=='enabled'||question.year!==9)return null;
  if(id.includes('-history-'))return 'history';
  if(id.includes('-calc-'))return 'atomic';
  if(id.includes('-formula-'))return 'formula';
  if(id.includes('-balance-'))return 'balance';
  return null;
}
export function buildBank(documents){
  if(!Array.isArray(documents)||documents.length!==3)throw Error('Three Chemistry topic banks are required.');
  const all=documents.flatMap(doc=>Array.isArray(doc?.questions)?doc.questions:[]);
  const questions=all.filter(q=>categoryOf(q));
  const ids=new Set();
  const counts={history:0,atomic:0,formula:0,balance:0};
  for(const q of questions){
    const kind=categoryOf(q);
    if(ids.has(q.id)||!q.answer?.accepted?.length||!q.prompt||!q.feedback?.steps?.length)
      throw Error('An exam question is incomplete or duplicated: '+q.id);
    ids.add(q.id);counts[kind]++;
  }
  for(const category of CATEGORIES)
    if(counts[category.id]!==expectedCounts[category.id])
      throw Error('Exam question supply for '+category.short+' is incomplete ('+counts[category.id]+'/'+category.count+').');
  return questions;
}
function shuffled(values,rng=Math.random){
  const list=values.slice();
  for(let i=list.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));
    [list[i],list[j]]=[list[j],list[i]];
  }
  return list;
}
function pickFrom(pool,total,previousIds,rng){
  const avoid=new Set(previousIds||[]);
  const ordered=[...shuffled(pool.filter(q=>!avoid.has(q.id)),rng),...shuffled(pool.filter(q=>avoid.has(q.id)),rng)];
  return ordered.slice(0,Math.min(ordered.length,total));
}
export function selectPaper(bank,{scope='mixed',length=20,previousIds=[],rng=Math.random}={}){
  if(!Array.isArray(bank)||!bank.length)throw Error('Exam questions have not loaded.');
  if(!['mixed',...CATEGORIES.map(x=>x.id)].includes(scope))throw Error('Unknown revision scope.');
  const requested=Math.max(1,Math.floor(Number(length)||20));
  if(scope!=='mixed')return pickFrom(bank.filter(q=>categoryOf(q)===scope),requested,previousIds,rng);
  // Every mixed paper represents all four school-assessment domains.
  const count=Math.min(requested,bank.length);
  if(count<4)throw Error('A mixed paper needs at least four questions.');
  const categoryOrder=shuffled(CATEGORIES,rng);
  const allocations=Object.fromEntries(CATEGORIES.map(x=>[x.id,0]));
  for(let i=0;i<count;i++)allocations[categoryOrder[i%CATEGORIES.length].id]++;
  const selected=[];
  for(const c of CATEGORIES)selected.push(...pickFrom(bank.filter(q=>categoryOf(q)===c.id),allocations[c.id],previousIds,rng));
  return shuffled(selected,rng);
}
export function normalizeChem(value){
  return String(value??'').normalize('NFKC').replace(/−|–|—/g,'-')
    .replace(/→|⇒|⟶|=/g,'->').replace(/\s+/g,'').trim();
}
function equationSide(side){
  const output=new Map();
  if(!side)return null;
  for(const token of side.split('+')){
    const m=/^(\d*)([A-Z][A-Za-z0-9()]*)$/.exec(token);
    if(!m)return null;
    const coefficient=Number(m[1]||1);
    if(!Number.isSafeInteger(coefficient)||coefficient<1)return null;
    output.set(m[2],(output.get(m[2])||0)+coefficient);
  }
  return [...output.entries()].sort(([a],[b])=>a.localeCompare(b));
}
function equationKey(value){
  const sides=normalizeChem(value).split('->');
  if(sides.length!==2)return null;
  const left=equationSide(sides[0]),right=equationSide(sides[1]);
  return left&&right?JSON.stringify([left,right]):null;
}
export function isCorrect(question,response){
  if(!question)return false;
  const kind=categoryOf(question),answer=String(response??'').trim();
  if(!kind||!answer)return false;
  const accepted=question.answer?.accepted||[];
  if(kind==='history')return accepted.includes(answer);
  if(kind==='balance'){
    const actual=equationKey(answer);
    return !!actual&&accepted.some(x=>equationKey(x)===actual);
  }
  const actual=normalizeChem(answer);
  return accepted.some(x=>normalizeChem(x)===actual);
}
export function scorePaper(bank,session){
  if(!session||!Array.isArray(session.questionIds))throw Error('Invalid exam session.');
  const questionsById=new Map(bank.map(q=>[q.id,q]));
  const ids=session.questionIds;
  if(!ids.length||ids.length>62||new Set(ids).size!==ids.length)throw Error('Invalid exam question selection.');
  const byCategory=Object.fromEntries(CATEGORIES.map(x=>[x.id,{correct:0,total:0}]));
  const rows=ids.map(id=>{
    const question=questionsById.get(id);
    if(!question)throw Error('A saved exam question is missing. Try reloading the question bank.');
    const response=String(session.answers?.[id]??'');
    const correct=isCorrect(question,response);
    const category=categoryOf(question);
    byCategory[category].total++;
    if(correct)byCategory[category].correct++;
    return {id,category,correct,response,question};
  });
  const correct=rows.filter(x=>x.correct).length;
  return {rows,correct,total:rows.length,percentage:Math.round(correct/rows.length*100),byCategory};
}
export function validateStoredState(value,bank){
  if(!value||value.version!==1||!Array.isArray(value.history)||value.history.length>30)throw Error('Invalid exam revision backup.');
  const ids=new Set(bank.map(q=>q.id));
  const verifySession=s=>{
    if(!s||!Array.isArray(s.questionIds)||!s.questionIds.length||s.questionIds.length>62||
       new Set(s.questionIds).size!==s.questionIds.length||s.questionIds.some(id=>!ids.has(id))||
       !s.answers||typeof s.answers!=='object'||Array.isArray(s.answers))throw Error('Invalid saved question list.');
    for(const [id,answer] of Object.entries(s.answers))
      if(!ids.has(id)||!s.questionIds.includes(id)||typeof answer!=='string'||answer.length>2000)
        throw Error('Invalid saved exam answer.');
    if(!Number.isInteger(s.index)||s.index<0||s.index>=s.questionIds.length)throw Error('Invalid saved question position.');
  };
  if(value.active)verifySession(value.active);
  if(value.latest)verifySession(value.latest);
  for(const s of value.history)verifySession(s);
  return value;
}
