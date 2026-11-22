// Pure Maths Daily submission boundary. NEVER writes XP/MP, storage or ledger.
import {verifiedSourceSystemKeyForMathsId} from './math-v311-original-system-collisions.js';
// The caller must persist a returned formal answer using the existing durable
// study-evidence API. This module alone cannot award a Daily completion.
const TOPICS=new Set(['math-y9-indices','math-y9-standard-form','math-y9-changing-subject','math-y9-straight-line-graphs','math-y9-simultaneous-equations']);
const BANDS=Object.freeze({'G7':4,'G8':4,'G8-9':2});
const CHOICES=['A','B','C','D','E','F'];
const text=x=>typeof x==='string'&&x.trim().length>0;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
// Validate a real instant against the school's Europe/London task date.
// UTC ISO dates can differ from the local task day around BST midnight;
// startsWith(day) wrongly rejects those answers and accepts fake timestamps.
const submittedOnSchoolDay=(stamp,day)=>{
 if(!text(stamp)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(stamp))return false;
 const instant=Date.parse(stamp);
 if(!Number.isFinite(instant))return false;
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
 return [parts.year,parts.month,parts.day].join('-')===day;
};
export function verifyMathDailyAssignment(task,questions,day){
 const issues=[];
 if(!date(day)||task?.planDate!==day||task?.id!=='maths-daily'||
    task?.dailyV3!==true||task?.supplyBlocked===true||
    Number(task?.assignedYear)!==9||task?.assignedSubject!=='maths')
   issues.push('inactive-or-unapproved-dated-assignment');
 const allowed=Array.isArray(task?.approvedQuestionIds)?task.approvedQuestionIds:[];
 const answers=task?.approvedCorrectOptionByQuestion||{};
 const pinnedFamilies=task?.approvedConceptByQuestion||{};
 if(!Array.isArray(allowed)||allowed.length!==10||new Set(allowed).size!==10||
    Object.keys(answers).length!==10||!allowed.every(id=>CHOICES.includes(answers[id]))||
    Object.keys(pinnedFamilies).length!==10||
    !allowed.every(id=>text(pinnedFamilies[id])))
   issues.push('missing-pinned-ten-ID-key-map');
 const bank=new Map();
 for(const q of Array.isArray(questions)?questions:[]){
  if(!text(q?.id)||bank.has(q.id)){issues.push('duplicate-or-empty-bank-id');continue}
  bank.set(q.id,q);
 }
 const selected=allowed.map(id=>bank.get(id));
 if(selected.some(q=>!q))issues.push('pinned-question-missing-from-approved-bank');
 const topics={},bands={},concepts=new Set(),families=new Set(),originalSystems=new Set();
 for(const q of selected){
  if(!q)continue;
  topics[q.topicId]=(topics[q.topicId]||0)+1;
  bands[q.difficultyTarget]=(bands[q.difficultyTarget]||0)+1;
  if(!TOPICS.has(q.topicId)||q.subject!=='maths'||Number(q.year)!==9||
     q.academicQA!=='approved'||q.taughtVerified!==true||
     q.mathDailyEnabled!==true||q.renderRequired!==true)
    issues.push('question-not-independently-approved:'+q.id);
  if(!text(q.templateId)||concepts.has(q.templateId))
    issues.push('duplicate-template-concept:'+q.id);
  concepts.add(q.templateId);
  if(!text(q.conceptFamilyId)||families.has(q.conceptFamilyId)||
     pinnedFamilies[q.id]!==q.conceptFamilyId)
    issues.push('missing-or-duplicate-reviewed-semantic-concept:'+q.id);
  families.add(q.conceptFamilyId);
  // Independent original-PDF evidence overrides mistakenly distinct reviewed
  // concept labels for mathematically identical simultaneous systems.
  const system=verifiedSourceSystemKeyForMathsId(q.id);
  if(system){
    if(originalSystems.has(system))issues.push('repeated-original-equation-system:'+q.id);
    originalSystems.add(system);
  }
  if(!Array.isArray(q.options)||q.options.length!==6||
     !CHOICES.every(c=>q.options.filter(o=>o?.id===c&&text(o?.latex||o?.text)).length===1))
    issues.push('unrenderable-or-incomplete-six-options:'+q.id);
  if(answers[q.id]!==q.correctOptionId)
    issues.push('pinned-marking-key-mismatch:'+q.id);
  if(!text(q.sourceRef)||!text(q.qaReviewer)||!text(q.mathsChecker)||
     !text(q.conceptFamilyEvidence)||!text(q.conceptFamilyReviewer)||
     !q.options?.filter(o=>o.id!==q.correctOptionId).every(o=>text(o.misconception)))
    issues.push('pedagogical-signoff-or-distractor-rationale-missing:'+q.id);
 }
 if(Object.keys(topics).length!==5||Object.values(topics).some(n=>n!==2))
    issues.push('incorrect-five-topic-two-each-mix');
 for(const [band,n] of Object.entries(BANDS))if(bands[band]!==n)
    issues.push('incorrect-4-4-2-grade-mix:'+band);
 return {valid:issues.length===0,issues,questions:selected};
}
export function makeVerifiedMathsSubmission({day,task,approvedQuestions,questionId,selectedOptionId,
  priorAttempts=[],submittedAt,assisted=false,hintUsed=false,scaffolded=false,recoveryFor=null}={}){
 const check=verifyMathDailyAssignment(task,approvedQuestions,day);
 if(!check.valid)return {accepted:false,reasons:check.issues};
 if(!CHOICES.includes(selectedOptionId))return {accepted:false,reasons:['invalid-A-F-choice']};
 if(!submittedOnSchoolDay(submittedAt,day))
   return {accepted:false,reasons:['missing-or-wrong-day-submission-time']};
 if(assisted||hintUsed||scaffolded||recoveryFor)
   return {accepted:false,reasons:['assisted-or-recovery-answer-not-daily-credit']};
 if(!task.approvedQuestionIds.includes(questionId))
   return {accepted:false,reasons:['unassigned-question-id']};
 // A repeat cannot convert a previously wrong answer into a credited correct
 // attempt or count twice; prior formal attempts are checked for this dated task.
 if((priorAttempts||[]).some(a=>a?.day===day&&a?.dailyTaskId==='maths-daily'&&
   String(a.questionId||'').split('@')[0]===questionId&&a?.formal!==false))
    return {accepted:false,reasons:['already-submitted-first-attempt']};
 const question=check.questions.find(q=>q.id===questionId);
 return {accepted:true,formalAttempt:{
   questionId,subject:'maths',year:9,topicId:question.topicId,
   dailyTaskId:'maths-daily',day,submittedAt,at:submittedAt,
   selectedOptionId,correct:selectedOptionId===question.correctOptionId,
   formal:true,repair:false,assisted:false,hintUsed:false,
   scaffolded:false,recoveryFor:null,
   templateId:question.templateId,conceptFamilyId:question.conceptFamilyId
 }};
}
