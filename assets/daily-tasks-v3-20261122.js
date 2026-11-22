// Daily Tasks V3 contract and safety gates. No learner state is mutated here.
import {V3_ACADEMIC_WHITELIST} from './daily-v3-approved-content-20261122.js';
// Academic QA manifests start EMPTY. Absence of verification blocks supply;
// it must never be interpreted as permission to select arbitrary catalog items.
export const V3_START_DATE = '2026-11-23';
export const V3_TASK_SPEC = Object.freeze([
  ['french-vocab',30],['latin-vocab',30],['languages-standard',10],
  ['y8-standard-a',10],['y8-standard-b',10],
  ['y8-mastery-a',20],['y8-mastery-b',20],['maths-daily',10],
  ['due-review',10],['year9-light',15]
]);
export const V3_TARGET = V3_TASK_SPEC.reduce((sum,[,n])=>sum+n,0);
// Whitelist approves ONLY the 40 explicit question IDs, never the rest of a bank.
export const V3_APPROVED = Object.freeze({
  languageGrammar:{latin:V3_ACADEMIC_WHITELIST.latin,french:V3_ACADEMIC_WHITELIST.french},
  year9Standard:V3_ACADEMIC_WHITELIST.y9,
  year9Due:[],
  year9Vocabulary:{latin:[],french:[]},
  maths:[] // separately supplied; never fabricate filler
});

const dayOf=x=>String(x||'').slice(0,10);
const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x);
const canonical=x=>String(x??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const approveTopic=(entry,year,subject)=>entry?.academicQA==='approved'&&
  entry?.taughtVerified===true&&Number(entry.year)===year&&
  entry.subject===subject&&Array.isArray(entry.concepts);
export function distinctApprovedConcepts(entry,state={},excluded=new Set()){
  if(!approveTopic(entry,Number(entry?.year),entry?.subject))return [];
  const correct=state.seenCorrect||{};
  const usedQuestionIds=new Set(Object.keys(correct).filter(id=>Number(correct[id])>0));
  const answered=(state.formalAttemptLog||[]).filter(e=>e?.correct===true&&
    e?.formal!==false&&e?.repair!==true&&e?.questionId).map(e=>String(e.questionId).split('@')[0]);
  for(const id of answered)usedQuestionIds.add(id);
  const groups=new Map();
  for(const group of entry.concepts){
    if(!group?.conceptId||!Array.isArray(group.ids)||!group.ids.length)continue;
    if(excluded.has(group.conceptId))continue;
    if(group.ids.some(id=>usedQuestionIds.has(id)))continue;
    if(!groups.has(group.conceptId))groups.set(group.conceptId,group);
  }
  return [...groups.values()];
}
export function chooseApprovedTopic(entries,state,year,subject,count,reserved=new Set()){
  return (entries||[]).filter(e=>approveTopic(e,year,subject)&&!reserved.has(e.topicId))
    .map(e=>({entry:e,available:distinctApprovedConcepts(e,state).length}))
    .filter(e=>e.available>=count)
    .sort((a,b)=>b.available-a.available||a.entry.topicId.localeCompare(b.entry.topicId))[0]?.entry||null;
}
// A composite or Y9 Daily cannot earn credit from generic button presses.
// All counted answers must be dated, assigned, formal, unassisted and match
// the EXACT approved question-to-concept mapping.
export function v3ScopedQuestionEvidence(state,task,day){
  const allowed=new Set(task?.approvedQuestionIds||[]);
  const concepts=task?.approvedConceptByQuestion||{};
  // Same-day cross-task reservation: an assessed question cannot be counted
  // in another Daily task, even when it appears under a different task ID.
  const elsewhere=new Set((state.formalAttemptLog||[]).filter(e=>
    e?.day===day&&e?.dailyTaskId&&e.dailyTaskId!==task?.id&&
    e.formal!==false&&e.repair!==true&&!e.recoveryFor&&e.questionId)
    .map(e=>String(e.questionId).split('@')[0]));
  const attempts=new Map();
  for(const e of state.formalAttemptLog||[]){
    if(e?.day!==day||e?.dailyTaskId!==task?.id||
       e?.subject!==task.assignedSubject||Number(e?.year)!==Number(task.assignedYear)||
       e?.topicId!==task.assignedTopic||e.formal===false||e.repair===true||
       e.recoveryFor||e.assisted===true||e.hintUsed===true||e.scaffolded===true||
       typeof e.correct!=='boolean'||!e.questionId)continue;
    const id=String(e.questionId).split('@')[0];
    if(elsewhere.has(id)||!allowed.has(id)||!Object.hasOwn(concepts,id))continue;
    const key=concepts[id];
    const previous=attempts.get(key);
    attempts.set(key,previous===true||e.correct===true);
  }
  const correct=[...attempts.values()].filter(Boolean).length;
  return {attempts:attempts.size,correct:Math.min(Number(task.target)||10,correct),
    completed:correct>=Number(task.target)};
}

export function languageEvidence(state,day,taskId='languages-standard'){
  const result={latin:{attempts:0,correct:0},french:{attempts:0,correct:0}};
  const elsewhere=new Set((state.formalAttemptLog||[]).filter(e=>
    e?.day===day&&e?.dailyTaskId&&e.dailyTaskId!==taskId&&
    e.formal!==false&&e.repair!==true&&!e.recoveryFor&&e.questionId)
    .map(e=>String(e.questionId).split('@')[0]));
  for(const subject of ['latin','french']){
    const journal=(state.formalAttemptLog||[]).filter(e=>
      e?.day===day&&e.dailyTaskId===taskId&&e.subject===subject&&Number(e.year)===8&&
      e.formal!==false&&e.repair!==true&&e.recoveryFor==null&&
      e.assisted!==true&&e.hintUsed!==true&&e.scaffolded!==true&&
      e.questionId&&typeof e.correct==='boolean');
    const unique=new Map();
    const split=(state.daily||[]).find(t=>t.id===taskId&&t.planDate===day)?.languageSplit?.[subject];
    const concepts=split?.approvedConceptByQuestion||{};
    for(const e of journal){
      const id=String(e.questionId).split('@')[0];
      // An opposite translation or alternate form is the SAME concept.
      const concept=concepts[id]||id;
      if(elsewhere.has(id)||split&&(!Object.hasOwn(concepts,id)||e.topicId!==split.topicId))continue; // no cross-task or unapproved credit
      unique.set(concept,Boolean(e.correct)||unique.get(concept)===true);
    }
    result[subject]={attempts:unique.size,correct:Math.min(5,[...unique.values()].filter(Boolean).length)};
  }
  return {...result,progress:result.latin.correct+result.french.correct,
    completed:result.latin.correct>=5&&result.french.correct>=5};
}
export function validateMathQuestion(q){
  const issues=[];
  if(!q?.id||typeof q.id!=='string')issues.push('missing-id');
  if(!['indices','standard-form','changing-subject','straight-line-graphs','simultaneous-equations'].includes(q?.topic))issues.push('topic-unverified');
  if(!['7','8','8-9'].includes(String(q?.grade)))issues.push('invalid-grade');
  if(q?.academicQA!=='approved'||q?.taughtVerified!==true)issues.push('not-academic-qa-approved');
  if(!Array.isArray(q?.options)||q.options.length!==6)issues.push('six-options-required');
  const options=Array.isArray(q?.options)?q.options:[];
  if(new Set(options.map(x=>canonical(x?.text))).size!==6||options.some(x=>!canonical(x?.text)))issues.push('duplicate-or-empty-options');
  if(!options.some(x=>x?.id===q?.correctOptionId)||options.filter(x=>x?.id===q?.correctOptionId).length!==1)issues.push('unique-correct-id-required');
  if(new Set(options.map(x=>x?.id)).size!==6)issues.push('duplicate-option-ids');
  if(options.some(x=>!String(x?.misconception||'').trim()&&x?.id!==q?.correctOptionId))issues.push('distractor-rationale-required');
  if(!Array.isArray(q?.workedSolution)||q.workedSolution.length<2||q.workedSolution.some(x=>!String(x).trim()))issues.push('worked-solution-required');
  if(!String(q?.sourceRef||'').trim()||!String(q?.qaReviewer||'').trim())issues.push('qa-provenance-required');
  return {valid:issues.length===0,issues};
}
export function mathsEvidence(attempts=[],day){
  const seen=new Map();
  for(const a of attempts){
    if(a?.day!==day||!a.questionId||!validDate(day)||typeof a.correct!=='boolean'||!a.submittedAt)continue;
    if(!seen.has(a.questionId))seen.set(a.questionId,a);
  }
  return {submitted:Math.min(10,seen.size),correct:[...seen.values()].filter(a=>a.correct).length,
    completed:seen.size>=10,targetMet:seen.size>=10&&[...seen.values()].filter(a=>a.correct).length>=9};
}
const blocked=(id,title,target,year,reason,day)=>({
  id,title,target,progress:0,done:false,supplyBlocked:true,
  detail:reason,href:'/study',xp:0,planDate:day,assignedYear:year,
  dailyV3:true,planVersion:3
});
const tagged=(task,day)=>({...task,planDate:day,dailyV3:true,planVersion:3});
const isStarted=t=>Number(t?.progress)>0||t?.done===true||
  (Array.isArray(t?.verifiedCorrectIds)&&t.verifiedCorrectIds.length>0);
export function buildDailyV3(state,legacy=[],manifest=V3_APPROVED,{mathAttempts=[]}={}){
  const day=dayOf(state.today);
  if(!validDate(day)||day<V3_START_DATE)return legacy;
  const dated=(state.daily||[]).filter(t=>t?.planDate===day);
  // Never overwrite an already-started V2 date. Historical ledgers remain
  // wholly owned by the existing planner/recovery implementation.
  if(dated.length&&!dated.every(t=>t.dailyV3===true)&&
     (dated.some(isStarted)||(state.formalAttemptLog||[]).some(e=>
       e.day===day&&e.dailyTaskId)))return legacy;
  if(dated.length===10&&dated.every(t=>t.dailyV3===true)){
    const languages=languageEvidence(state,day),maths=mathsEvidence(mathAttempts,day);
    return dated.map(t=>t.id==='languages-standard'?
      {...t,progress:languages.progress,done:languages.completed,
        languageEvidence:languages}:t.id==='maths-daily'?
      {...t,progress:maths.submitted,done:maths.completed,mathsEvidence:maths}:
      (t.id==='y8-standard-b'&&Number(t.assignedYear)===9)||
      (t.id==='due-review'&&Number(t.assignedYear)===9)
      ? {...t,progress:v3ScopedQuestionEvidence(state,t,day).correct,
          done:v3ScopedQuestionEvidence(state,t,day).completed}
      :t);
  }
  const old=new Map(legacy.map(t=>[t.id,t]));
  const passthrough=id=>old.get(id)?tagged(old.get(id),day):
    blocked(id,'Supply unavailable · '+id,V3_TASK_SPEC.find(e=>e[0]===id)?.[1]||10,8,'Existing planner source unavailable.',day);
  const reserved=new Set(['y8-standard-a','y8-mastery-a','y8-mastery-b','year9-light']
    .map(id=>old.get(id)?.assignedTopic).filter(Boolean));
  const stdB=(manifest.year9Standard||[]).flatMap(e=>
    chooseApprovedTopic([e],state,9,e.subject,10,reserved)?[e]:[])
    .sort((a,b)=>a.topicId.localeCompare(b.topicId))[0];
  if(stdB)reserved.add(stdB.topicId);
  const languagePicks={};
  for(const s of ['latin','french']){
    languagePicks[s]=chooseApprovedTopic(manifest.languageGrammar?.[s],state,8,s,5,reserved);
    if(languagePicks[s])reserved.add(languagePicks[s].topicId);
  }
  const languageReady=languagePicks.latin&&languagePicks.french;
  const language=languageReady?tagged({
    id:'languages-standard',title:'Languages Standard · Latin 5 + French 5',
    detail:'Grammar and application; each language is credited independently.',
    target:10,progress:0,done:false,xp:15,
    languageSplit:Object.fromEntries(['latin','french'].map(s=>[s,{
      subject:s,topicId:languagePicks[s].topicId,year:8,target:5,
      approvedQuestionIds:distinctApprovedConcepts(languagePicks[s],state).slice(0,5).map(g=>g.ids[0]),
      approvedConceptByQuestion:Object.fromEntries(distinctApprovedConcepts(languagePicks[s],state).slice(0,5).map(g=>[g.ids[0],g.conceptId]))
    }])),
    href:'/study/languages/standard/?latin='+encodeURIComponent(languagePicks.latin.topicId)+
      '&french='+encodeURIComponent(languagePicks.french.topicId)
  },day):blocked('languages-standard','Languages Standard · Latin 5 + French 5',10,8,
    'Academic QA: two taught, approved five-concept grammar pools are required. No automatic credit.',day);
  const standardB=stdB?tagged({
    id:'y8-standard-b',title:'Standard B · Year 9 · '+(stdB.title||stdB.topicId),
    detail:'Ten distinct Academic-QA-approved Year 9 concepts.',
    href:'/study/'+stdB.subject+'/practise?daily=1&locked=1&year=9&mode=standard&task=y8-standard-b&topic='+encodeURIComponent(stdB.topicId),
    target:10,progress:0,xp:15,assignedSubject:stdB.subject,
    assignedTopic:stdB.topicId,assignedLabel:stdB.title||stdB.topicId,assignedYear:9,
    approvedQuestionIds:distinctApprovedConcepts(stdB,state).slice(0,10).map(g=>g.ids[0]),
    approvedConceptByQuestion:Object.fromEntries(distinctApprovedConcepts(stdB,state).slice(0,10).map(g=>[g.ids[0],g.conceptId]))
  },day):blocked('y8-standard-b','Standard B · Year 9',10,9,
    'Year 9 question supply: fewer than ten independently approved taught concepts. No Year 8 substitution.',day);
  const maths=mathsEvidence(mathAttempts,day);
  const mathBank=(manifest.maths||[]).filter(q=>validateMathQuestion(q).valid);
  const bands={'7':4,'8':4,'8-9':2};
  const mathReady=Object.entries(bands).every(([grade,n])=>mathBank.filter(q=>String(q.grade)===grade).length>=n);
  const mathsTask=mathReady?tagged({id:'maths-daily',title:'Maths Daily · GCSE Higher',target:10,progress:maths.submitted,
    done:maths.completed,mathsEvidence:maths,detail:'10 MC questions, six choices each. Target 9/10; written methods require separate assessment.',
    href:'/study/maths/daily/',xp:15,assignedSubject:'maths',assignedYear:9},day):
    blocked('maths-daily','Maths Daily · GCSE Higher',10,9,
      'Awaiting separately supplied and independently Academic-QA-approved GCSE Higher Maths bank. Never use filler.',day);
  // Year 9 Due requires question-level saved due evidence and QA approval.
  // Year 8 Mastery Day 2/7 recall always remains the priority.
  const originalDue=passthrough('due-review');
  const pendingYear8Recall=originalDue.masteryCheck===true;
  const dueCandidates=(manifest.year9Due||[]).filter(e=>
    approveTopic(e,9,e.subject)&&!reserved.has(e.topicId)).map(entry=>{
      const dueGroups=entry.concepts.filter(g=>g?.conceptId&&Array.isArray(g.ids)&&
        g.ids.some(id=>state.reviews?.[id]?.due&&
          dayOf(state.reviews[id].due)<=day));
      return {entry,dueGroups};
    }).filter(x=>x.dueGroups.length>=10)
    .sort((a,b)=>b.dueGroups.length-a.dueGroups.length||
      a.entry.topicId.localeCompare(b.entry.topicId));
  const year9Due=!pendingYear8Recall?dueCandidates[0]:null;
  const due=year9Due?tagged({
    id:'due-review',title:'Due Review · Year 9 · '+(year9Due.entry.title||year9Due.entry.topicId),
    detail:'Ten distinct Year 9 concepts backed by actual saved due dates; not consolidation.',
    target:10,progress:0,xp:15,assignedSubject:year9Due.entry.subject,
    assignedYear:9,assignedTopic:year9Due.entry.topicId,
    assignedLabel:year9Due.entry.title||year9Due.entry.topicId,
    approvedQuestionIds:year9Due.dueGroups.slice(0,10).map(g=>g.ids[0]),
    href:'/study/'+year9Due.entry.subject+'/practise?daily=1&locked=1&year=9&mode=due&task=due-review&topic='+encodeURIComponent(year9Due.entry.topicId)
  },day):(pendingYear8Recall&&Number(originalDue.target)===5&&Number(originalDue.progress)===0
    ? {...originalDue,target:10,detail:'Year 8 Day 2/7 recall within a 10-question Due Review; five additional unassisted consolidation questions required. Existing recall evidence is assessed separately.'}
    : originalDue);
  const plan=[passthrough('french-vocab'),passthrough('latin-vocab'),language,
    passthrough('y8-standard-a'),standardB,
    passthrough('y8-mastery-a'),passthrough('y8-mastery-b'),mathsTask,due,
    passthrough('year9-light')];
  // Distinct cards, fixed normal quotas, never copied completion credit.
  if(plan.length!==10||new Set(plan.map(t=>t.id)).size!==10||
    plan.reduce((n,t)=>n+t.target,0)!==V3_TARGET)throw Error('Daily V3 specification mismatch');
  return plan;
}
