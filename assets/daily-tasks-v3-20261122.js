// Daily Tasks V3 contract and safety gates. No learner state is mutated here.
import {V3_ACADEMIC_WHITELIST} from './daily-v3-approved-content-20261122.js';
import {selectMathsV31Daily} from './math-study/daily-v31-selector.js';
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
  // Only an active, exact Year 9 signed ten-question assignment may count.
  // A blocked/stale/partially restored card must never credit tagged replay
  // answers, even if its old approvedQuestionIds survived a partial save.
  const none={attempts:0,correct:0,completed:false};
  const ids=task?.approvedQuestionIds,concepts=task?.approvedConceptByQuestion||{};
  if(!task||task.supplyBlocked===true||task.dailyV3!==true||
     task.planDate!==day||Number(task.assignedYear)!==9||
     !['y8-standard-b','due-review'].includes(task.id)||
     !task.assignedTopic||!task.assignedSubject||
     !Array.isArray(ids)||ids.length!==10||new Set(ids).size!==10||
     Object.keys(concepts).length!==10||
     new Set(ids.map(id=>concepts[id])).size!==10||
     ids.some(id=>typeof id!=='string'||!id||
       typeof concepts[id]!=='string'||!concepts[id]))return none;
  const allowed=new Set(ids);
  // Same-day cross-task reservation: an assessed question cannot be counted
  // in another Daily task, even when it appears under a different task ID.
  const elsewhere=new Set((state.formalAttemptLog||[]).filter(e=>
    e?.day===day&&e?.dailyTaskId&&e.dailyTaskId!==task?.id&&
    e.formal===true&&e.repair!==true&&!e.recoveryFor&&e.questionId)
    .map(e=>String(e.questionId).split('@')[0]));
  const attempts=new Map();
  for(const e of state.formalAttemptLog||[]){
    if(e?.day!==day||e?.dailyTaskId!==task?.id||
       e?.subject!==task.assignedSubject||Number(e?.year)!==Number(task.assignedYear)||
       e?.topicId!==task.assignedTopic||e.formal!==true||e.repair===true||
       e.recoveryFor||typeof e.correct!=='boolean'||!e.questionId)continue;
    const id=String(e.questionId).split('@')[0];
    if(elsewhere.has(id)||!allowed.has(id)||!Object.hasOwn(concepts,id))continue;
    const key=concepts[id];
    // Once the first formal concept answer is submitted, a wrong answer or
    // one exposing hints/scaffolding reserves that concept with zero credit.
    // Later retries cannot change it to correct within this dated assignment.
    if(!attempts.has(key))attempts.set(key,
      e.correct===true&&e.assisted!==true&&e.hintUsed!==true&&
      e.scaffolded!==true);
  }
  const correct=[...attempts.values()].filter(Boolean).length;
  return {attempts:attempts.size,correct:Math.min(Number(task.target)||10,correct),
    completed:correct>=Number(task.target)};
}

export function languageEvidence(state,day,taskId='languages-standard'){
  const result={latin:{attempts:0,correct:0},french:{attempts:0,correct:0}};
  // Never infer language assignment from a question's self-reported
  // dailyTaskId. Blocked or missing 5+5 Academic QA supply MUST stay 0/10
  // even if a restored/browser replay journal contains matching labels.
  const assigned=(Array.isArray(state?.daily)?state.daily:[]).find(t=>
    t?.id===taskId&&t?.planDate===day);
  const parts=assigned?.languageSplit;
  const pinnedIds=new Set(),pinnedConcepts=new Set();
  const approved=taskId==='languages-standard'&&assigned?.dailyV3===true&&
    assigned?.supplyBlocked!==true&&Number(assigned?.target)===10&&
    ['latin','french'].every(subject=>{
      const part=parts?.[subject],ids=part?.approvedQuestionIds,
        concepts=part?.approvedConceptByQuestion;
      if(part?.subject!==subject||Number(part?.year)!==8||
         !part?.topicId||Number(part?.target)!==5||
         !Array.isArray(ids)||ids.length!==5||new Set(ids).size!==5||
         !concepts||Object.keys(concepts).length!==5)return false;
      for(const id of ids){
        const concept=concepts[id];
        if(typeof id!=='string'||!id||
           typeof concept!=='string'||!concept||
           pinnedIds.has(id)||pinnedConcepts.has(concept))return false;
        pinnedIds.add(id);pinnedConcepts.add(concept);
      }
      return true;
    });
  if(!approved)return {...result,progress:0,completed:false};
  const elsewhere=new Set((state.formalAttemptLog||[]).filter(e=>
    e?.day===day&&e?.dailyTaskId&&e.dailyTaskId!==taskId&&
    e.formal!==false&&e.repair!==true&&!e.recoveryFor&&e.questionId)
    .map(e=>String(e.questionId).split('@')[0]));
  for(const subject of ['latin','french']){
    const journal=(state.formalAttemptLog||[]).filter(e=>
      e?.day===day&&e.dailyTaskId===taskId&&e.subject===subject&&Number(e.year)===8&&
      e.formal===true&&e.repair!==true&&e.recoveryFor==null&&
      e.questionId&&typeof e.correct==='boolean');
    const unique=new Map();
    const split=parts[subject],concepts=split.approvedConceptByQuestion;
    for(const e of journal){
      const id=String(e.questionId).split('@')[0];
      // No unsigned, unassigned or wrong-topic answer can mint a Daily
      // concept; reverse translation is still reserved under ONE concept.
      if(elsewhere.has(id)||!Object.hasOwn(concepts,id)||
         e.topicId!==split.topicId)continue;
      const concept=concepts[id];
      // Keep the FIRST formal submission for this concept, including an
      // assisted/hint/scaffolded attempt as a non-credit reservation. Correct
      // retries cannot overwrite the initial question exposure.
      if(!unique.has(concept))unique.set(concept,
        e.correct===true&&e.assisted!==true&&e.hintUsed!==true&&
        e.scaffolded!==true);
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
  if(!String(q?.conceptFamilyId||'').trim()||
     !String(q?.conceptFamilyEvidence||'').trim()||
     !String(q?.conceptFamilyReviewer||'').trim())
    issues.push('semantic-concept-family-signoff-required');
  if(!Array.isArray(q?.options)||q.options.length!==6)issues.push('six-options-required');
  const options=Array.isArray(q?.options)?q.options:[];
  if(new Set(options.map(x=>canonical(x?.text))).size!==6||options.some(x=>!canonical(x?.text)))issues.push('duplicate-or-empty-options');
  if(!options.some(x=>x?.id===q?.correctOptionId)||options.filter(x=>x?.id===q?.correctOptionId).length!==1)issues.push('unique-correct-id-required');
  if(new Set(options.map(x=>x?.id)).size!==6)issues.push('duplicate-option-ids');
  if(!['A','B','C','D','E','F'].every(id=>options.some(x=>x?.id===id)))issues.push('option-IDs-must-be-A-F');
  if(options.some(x=>!String(x?.misconception||'').trim()&&x?.id!==q?.correctOptionId))issues.push('distractor-rationale-required');
  if(!Array.isArray(q?.workedSolution)||q.workedSolution.length<2||q.workedSolution.some(x=>!String(x).trim()))issues.push('worked-solution-required');
  if(!String(q?.sourceRef||'').trim()||!String(q?.qaReviewer||'').trim())issues.push('qa-provenance-required');
  return {valid:issues.length===0,issues};
}
export function mathsEvidence(attempts=[],day,task=null){
  // Production V3 always supplies the immutable 10-question assignment.
  // Two-argument mode is retained only for legacy isolated validator tests.
  const accepted=task?new Set(task.approvedQuestionIds||[]):null;
  const correctIds=task?.approvedCorrectOptionByQuestion||{};
  if(task&&(!validDate(day)||task.supplyBlocked===true||task.planDate!==day||
     accepted.size!==10||Object.keys(correctIds).length!==10||
     Number(task.assignedYear)!==9))
    return {submitted:0,correct:0,attemptFinished:false,completed:false,targetMet:false};
  const seen=new Map();
  for(const a of attempts){
    if(a?.day!==day||!a.questionId||!validDate(day))continue;
    const id=String(a.questionId).split('@')[0];
    if(task){
      if(!accepted.has(id)||!Object.hasOwn(correctIds,id)||
         a.dailyTaskId!=='maths-daily'||a.subject!=='maths'||
         Number(a.year)!==9||a.formal!==true)continue;
      if(seen.has(id))continue;
      // Reserve the FIRST formal submitted ID even if the answer payload was
      // malformed or assisted. It can never be replaced by a later correct
      // submission, hint reset or an untrusted bare correct:true assertion.
      const firstValid=typeof a.correct==='boolean'&&
        Boolean(a.submittedAt||a.at)&&
        ['A','B','C','D','E','F'].includes(a.selectedOptionId)&&
        a.correct===(a.selectedOptionId===correctIds[id])&&
        a.repair!==true&&a.hintUsed!==true&&
        a.scaffolded!==true&&a.assisted!==true&&!a.recoveryFor;
      seen.set(id,firstValid?a:null);
    }else if(typeof a.correct==='boolean'&&(a.submittedAt||a.at)&&!seen.has(id)){
      seen.set(id,a); // legacy two-argument isolated QA only
    }
  }
  const graded=[...seen.values()].filter(Boolean);
  const submitted=Math.min(10,graded.length);
  const correct=graded.filter(a=>a.correct).length;
  const targetMet=submitted===10&&correct>=9;
  // 10 submitted but fewer than nine correct is a *completed attempt*, NOT
  // Daily clearance, Mastery, XP or MP. Never reward an unpassed Maths check.
  return {submitted,correct,attemptFinished:submitted===10,
    completed:targetMet,targetMet};
}
const blocked=(id,title,target,year,reason,day)=>({
  id,title,target,progress:0,done:false,supplyBlocked:true,
  detail:reason,href:'/study',xp:0,planDate:day,assignedYear:year,
  dailyV3:true,planVersion:3
});
const tagged=(task,day)=>({...task,planDate:day,dailyV3:true,planVersion:3});
const isStarted=t=>Number(t?.progress)>0||t?.done===true||
  (Array.isArray(t?.verifiedCorrectIds)&&t.verifiedCorrectIds.length>0);
export function buildDailyV3(state,legacy=[],manifest=V3_APPROVED,{mathAttempts=null}={}){
  if(mathAttempts===null)mathAttempts=(state.formalAttemptLog||[]).filter(e=>e?.dailyTaskId==='maths-daily');
  const day=dayOf(state.today);
  if(!validDate(day)||day<V3_START_DATE)return legacy;
  const dated=(state.daily||[]).filter(t=>t?.planDate===day);
  // Never overwrite an already-started V2 date. Historical ledgers remain
  // wholly owned by the existing planner/recovery implementation.
  if(dated.length&&!dated.every(t=>t.dailyV3===true)&&
     (dated.some(isStarted)||(state.formalAttemptLog||[]).some(e=>
       e.day===day&&e.dailyTaskId)))return legacy;
  if(dated.length===10&&dated.every(t=>t.dailyV3===true)){
    const languages=languageEvidence(state,day);
    const assignedMath=dated.find(t=>t.id==='maths-daily');
    const maths=mathsEvidence(mathAttempts,day,assignedMath||{supplyBlocked:true});
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
  const reserved=new Set(['y8-standard-a','y8-mastery-a','y8-mastery-b','due-review','year9-light']
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
  const mathBank=(manifest.maths||[]).filter(q=>validateMathQuestion(q).valid);
  // The saved receipt is the ONLY source of former question/template reservations.
  // The selector never mutates student state, and there is no fresh fallback.
  const mathsHistory=Object.entries(state.dailyLog||{}).flatMap(([historyDate,row])=>{
    const task=(row?.tasks||[]).find(t=>t.id==='maths-daily');
    return task?.approvedQuestionIds?.length?[{
      date:historyDate,questionIds:task.approvedQuestionIds,
      templateIds:Object.values(task.approvedTemplateByQuestion||task.approvedConceptByQuestion||{}),
      conceptFamilyIds:Object.values(task.approvedConceptByQuestion||{})
    }]:[];
  });
  const mathSelection=selectMathsV31Daily({
    approvedQuestions:mathBank,day,history:mathsHistory
  });
  const selectedMath=mathSelection.questions;
  // Runtime must have proven real WebKit maths rendering, marking and storage.
  // An uploaded JSON mathematical PASS alone never opens a scoring session.
  const mathReady=manifest.mathsRuntimeReady===true&&mathSelection.ready&&
    selectedMath.every(q=>validateMathQuestion(q).valid);
  const mathsAssignment=mathReady?tagged({
    id:'maths-daily',title:'Maths Daily · GCSE Higher',target:10,
    progress:0,done:false,
    detail:'10 independently approved MC questions; target 9/10 does not replace written working.',
    href:'/study/maths/daily/',xp:15,assignedSubject:'maths',assignedYear:9,
    approvedQuestionIds:selectedMath.map(q=>q.id),
    approvedConceptByQuestion:Object.fromEntries(selectedMath.map(q=>[q.id,q.conceptFamilyId])),
    approvedTemplateByQuestion:Object.fromEntries(selectedMath.map(q=>[q.id,q.templateId])),
    approvedCorrectOptionByQuestion:Object.fromEntries(selectedMath.map(q=>[q.id,q.correctOptionId])),
  },day):null;
  const maths=mathsEvidence(mathAttempts,day,mathsAssignment||{supplyBlocked:true});
  const mathsTask=mathsAssignment?
    {...mathsAssignment,progress:maths.submitted,done:maths.completed,mathsEvidence:maths}:
    blocked('maths-daily','Maths Daily · GCSE Higher',10,9,
      'Maths V3.1 awaiting individual taught/grade/distractor QA and a verified iPad quiz renderer. No practice or credit until approved.',day);
  // Year 9 Due requires question-level saved due evidence and QA approval.
  // Year 8 Mastery Day 2/7 recall always remains the priority.
  const originalDue=passthrough('due-review');
  const pendingYear8Recall=originalDue.masteryCheck===true;
  const dueCandidates=(manifest.year9Due||[]).filter(e=>
    approveTopic(e,9,e.subject)&&!reserved.has(e.topicId)).map(entry=>{
      // A concept is due only when an EXACT approved member question has a
      // saved due date. Do not select g.ids[0] when only a different
      // alternate ID is due; do not re-use the same concept or question twice.
      const usedConcepts=new Set(),usedIds=new Set(),dueGroups=[];
      for(const g of entry.concepts){
        if(!g?.conceptId||!Array.isArray(g.ids)||usedConcepts.has(g.conceptId))continue;
        const questionId=g.ids.find(id=>id&&!usedIds.has(id)&&
          state.reviews?.[id]?.due&&dayOf(state.reviews[id].due)<=day);
        if(!questionId)continue;
        usedConcepts.add(g.conceptId);usedIds.add(questionId);
        dueGroups.push({conceptId:g.conceptId,questionId});
      }
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
    approvedQuestionIds:year9Due.dueGroups.slice(0,10).map(g=>g.questionId),
    approvedConceptByQuestion:Object.fromEntries(year9Due.dueGroups.slice(0,10)
      .map(g=>[g.questionId,g.conceptId])),
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
