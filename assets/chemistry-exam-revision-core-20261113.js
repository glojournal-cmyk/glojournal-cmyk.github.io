// Standalone school-assessment question selection and end-of-paper marking.
// Does not import or mutate Scholar's Daily, Mastery, XP, MP or progress stores.
export const CATEGORIES = Object.freeze([
  {id:'history',title:'C1.5 · History of the Atom',short:'History of the Atom',count:22},
  {id:'atomic',title:'C1.6 · Atomic Structure',short:'Atomic Structure',count:28},
  {id:'formula',title:'Chemical Formulae',short:'Chemical Formulae',count:32},
  {id:'balance',title:'Balancing Equations',short:'Balancing Equations',count:52}
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
  if(!Array.isArray(documents)||documents.length!==4)throw Error('Three topic banks and the extended revision bank are required.');
  const all=documents.flatMap(doc=>Array.isArray(doc?.questions)?doc.questions:[]);
  const omissions=documents[3]?.assessmentExclusions;
  if(!Array.isArray(omissions)||omissions.length!==16||new Set(omissions).size!==16)
    throw Error('The assessed C1.6 scope exclusion manifest is missing or invalid.');
  const excluded=new Set(omissions);
  // Keep excluded historical questions readable for previous saved results.
  // Do not silently redefine the meaning of a previously answered question ID.
  const questions=all.filter(q=>categoryOf(q)).map(q=>({...q,examEligible:!excluded.has(q.id)}));
  if(questions.filter(q=>excluded.has(q.id)).length!==excluded.size||
    questions.some(q=>!q.examEligible&&categoryOf(q)!=='atomic'))
    throw Error('The exam exclusion list refers to missing or unexpected questions.');
  const ids=new Set();
  const counts={history:0,atomic:0,formula:0,balance:0};
  for(const q of questions){
    const kind=categoryOf(q);
    if(ids.has(q.id)||!q.answer?.accepted?.length||!q.prompt||!q.feedback?.steps?.length||!Number.isInteger(q.marks??1)||((q.marks??1)<1)||((q.marks??1)>6)||
       (q.format==='rubric_response'&&(!Array.isArray(q.markScheme)||q.markScheme.length!==q.marks)))
      throw Error('An exam question is incomplete or duplicated: '+q.id);
    ids.add(q.id);if(q.examEligible)counts[kind]++;
  }
  for(const category of CATEGORIES)
    if(counts[category.id]!==expectedCounts[category.id])
      throw Error('Exam question supply for '+category.short+' is incomplete ('+counts[category.id]+'/'+category.count+').');
  return questions;
}
export const isExamEligible=question=>!!question&&categoryOf(question)!==null&&question.examEligible!==false;
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
// An assessment-style paper must include both short answers and constructed
// explanation/calculation responses, rather than repeating only one-mark drills.
function pickBalancedFormats(pool,total,previousIds,rng){
  const rubrics=pool.filter(q=>q.format==='rubric_response');
  const objective=pool.filter(q=>q.format!=='rubric_response');
  const wantRubric=Math.min(rubrics.length,Math.ceil(total/2));
  const first=pickFrom(rubrics,wantRubric,previousIds,rng);
  const second=pickFrom(objective,total-first.length,previousIds,rng);
  const picked=[...first,...second];
  const already=new Set(picked.map(q=>q.id));
  if(picked.length<total)picked.push(...pickFrom(pool.filter(q=>!already.has(q.id)),total-picked.length,previousIds,rng));
  return shuffled(picked,rng);
}
export function selectPaper(bank,{scope='mixed',length=20,previousIds=[],rng=Math.random}={}){
  if(!Array.isArray(bank)||!bank.length)throw Error('Exam questions have not loaded.');
  if(!['mixed',...CATEGORIES.map(x=>x.id)].includes(scope))throw Error('Unknown revision scope.');
  const eligible=bank.filter(isExamEligible);
  const requested=Math.max(1,Math.floor(Number(length)||20));
  if(scope!=='mixed'){
    const pool=eligible.filter(q=>categoryOf(q)===scope);
    return pickBalancedFormats(pool,Math.min(requested,pool.length),previousIds,rng);
  }
  const count=Math.min(requested,eligible.length);
  if(count<4)throw Error('A mixed paper needs at least four questions.');
  const categoryOrder=shuffled(CATEGORIES,rng);
  const allocations=Object.fromEntries(CATEGORIES.map(x=>[x.id,0]));
  for(let i=0;i<count;i++)allocations[categoryOrder[i%CATEGORIES.length].id]++;
  const selected=[];
  for(const c of CATEGORIES)
    selected.push(...pickBalancedFormats(eligible.filter(q=>categoryOf(q)===c.id),allocations[c.id],previousIds,rng));
  return shuffled(selected,rng);
}
export const marksOf=question=>question?.marks??1;
export const isRubric=question=>question?.format==='rubric_response';
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
    // A complete balanced equation must use one coefficient per chemical species.
    // Writing the same species twice (Na + Na) must not bypass coefficient marking.
    if(output.has(m[2]))return null;
    output.set(m[2],coefficient);
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
  if(isRubric(question))return null; // No automatic credit for explanatory multi-mark answers.
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
  if(!ids.length||ids.length>bank.length||new Set(ids).size!==ids.length)
    throw Error('Invalid exam question selection.');
  const byCategory=Object.fromEntries(CATEGORIES.map(x=>[x.id,{correct:0,total:0,awarded:0,max:0,pending:0}]));
  const rows=ids.map(id=>{
    const question=questionsById.get(id);
    if(!question)throw Error('A saved exam question is missing. Try reloading the question bank.');
    const response=String(session.answers?.[id]??'');
    const category=categoryOf(question),marks=marksOf(question);
    const unanswered=!response.trim();
    const pending=isRubric(question)&&!unanswered&&(session.reviewMarks?.[id]===undefined||session.reviewMarks?.[id]===null);
    const awarded=unanswered?0:pending?null:isRubric(question)?Number(session.reviewMarks[id]):(isCorrect(question,response)?1:0);
    if(awarded!==null&&(!Number.isInteger(awarded)||awarded<0||awarded>marks))
      throw Error('Invalid reviewed mark for '+id);
    const correct=awarded===null?null:awarded===marks;
    const stats=byCategory[category];stats.total++;stats.max+=marks;
    if(pending)stats.pending+=marks;else{stats.awarded+=awarded;if(correct)stats.correct++;}
    return {id,category,correct,response,question,marks,awarded,pending};
  });
  const awarded=rows.reduce((n,r)=>n+(r.awarded??0),0);
  const totalMarks=rows.reduce((n,r)=>n+r.marks,0);
  const pendingMarks=rows.reduce((n,r)=>n+(r.pending?r.marks:0),0);
  const pendingQuestions=rows.filter(r=>r.pending).length;
  const correct=rows.filter(r=>r.correct===true).length;
  return {rows,correct,total:rows.length,awarded,totalMarks,pendingMarks,pendingQuestions,
    percentage:pendingQuestions===0?Math.round(awarded/totalMarks*100):null,byCategory};
}
export function validateStoredState(value,bank){
  if(!value||value.version!==1||!Array.isArray(value.history)||value.history.length>30)throw Error('Invalid exam revision backup.');
  const ids=new Set(bank.map(q=>q.id));
  const verifySession=s=>{
    if(!s||!Array.isArray(s.questionIds)||!s.questionIds.length||s.questionIds.length>bank.length||
       new Set(s.questionIds).size!==s.questionIds.length||s.questionIds.some(id=>!ids.has(id))||
       !s.answers||typeof s.answers!=='object'||Array.isArray(s.answers))throw Error('Invalid saved question list.');
    for(const [id,answer] of Object.entries(s.answers))
      if(!ids.has(id)||!s.questionIds.includes(id)||typeof answer!=='string'||answer.length>2000)
        throw Error('Invalid saved exam answer.');
    if(s.reviewMarks!==undefined){
      if(!s.reviewMarks||typeof s.reviewMarks!=='object'||Array.isArray(s.reviewMarks))
        throw Error('Invalid review marks.');
      for(const [id,mark] of Object.entries(s.reviewMarks)){
        const q=bank.find(x=>x.id===id);
        if(!s.questionIds.includes(id)||!q||!isRubric(q)||!Number.isInteger(mark)||mark<0||mark>marksOf(q))
          throw Error('Invalid saved rubric mark.');
      }
    }
    if(!Number.isInteger(s.index)||s.index<0||s.index>=s.questionIds.length)throw Error('Invalid saved question position.');
  };
  if(value.active)verifySession(value.active);
  if(value.latest)verifySession(value.latest);
  for(const s of value.history)verifySession(s);
  return value;
}
