import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsOriginalGradeDemandDecision,ORIGINAL_MATHS_G7PLUS_REVIEW_CANDIDATES} from '../assets/math-study/math-v311-grade-demand-gate.js';
import {selectMathsV31Daily} from '../assets/math-study/daily-v31-selector.js';
import {verifyMathDailyAssignment} from '../assets/math-study/daily-v31-formal-submission.js';
import {stageMathsV31Question} from '../assets/daily-maths-v31-intake-gate-20261122.js';
import {validateMathQuestion} from '../assets/daily-tasks-v3-20261122.js';

const register=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-200-item-grade-demand-triage-20261122.json',import.meta.url),'utf8'));
const gradeEvidence={gradeDemandQA:'VERIFIED_G7_PLUS',independentGradeCalibrated:true,
 gradeDemandBenchmark:'Synthetic independent AQA specimen comparison – test only',
 gradeDemandReviewer:'synthetic external academic reviewer'};
const original=id=>register.rows.find(q=>q.id===id);
test('200 original IDs reconciled; no false official grading or student approval',()=>{
 assert.equal(register.status,'PROVISIONAL_GRADE_DEMAND_TRIAGE_NOT_APPROVED');
 assert.equal(register.rows.length,200);
 assert.equal(register.formalApprovalCount,0);
 assert.equal(register.allIneligible,true);
 assert.equal(register.source200Modified,false);
 assert.equal(register.studentDataChanged,false);
 assert.deepEqual(register.counts,{
 REWRITE_CONTEXT_OR_DUPLICATE:17,
 RETAIN_FOR_EXTERNAL_BENCHMARK:24,
 QUARANTINE_TAUGHT_SCOPE:80,
 UPGRADE_STEM_FOR_G7PLUS:79});
 assert.equal(new Set(register.rows.map(q=>q.id)).size,200);
 assert.deepEqual(register.rows.map(q=>q.sourceIndex),Array.from({length:200},(_,i)=>i+1));
 assert.deepEqual([...new Set(register.rows.map(q=>q.topic))].length,5);
 for(const t of new Set(register.rows.map(q=>q.topic)))assert.equal(register.rows.filter(q=>q.topic===t).length,40);
 assert.deepEqual(Object.fromEntries(['G7','G8','G8-9'].map(g=>[g,register.rows.filter(q=>q.originalProvisionalGrade===g).length])),
 {G7:80,G8:80,'G8-9':40});
 assert.equal(register.rows.filter(q=>q.exactTermOrSkillCheck==='SPRING_PERPENDICULAR_BISECTOR_QUARANTINE').length,12);
 assert.ok(register.rows.every(q=>q.independentG7PlusCertified===false&&q.eligibleForMathsDaily===false&&
 q.eligibleForXPMPMasteryRecovery===false&&q.teacherExactTaughtVerified===false));
});

test('exact 24 candidates only; all 176 source rejects are immutable and cannot be self-approved',()=>{
 const reviewed=register.rows.filter(q=>q.triageAction==='RETAIN_FOR_EXTERNAL_BENCHMARK').map(q=>q.id);
 assert.deepEqual(ORIGINAL_MATHS_G7PLUS_REVIEW_CANDIDATES,reviewed);
 for(const q of register.rows){
  const unsigned=mathsOriginalGradeDemandDecision({id:q.id});
  assert.equal(unsigned.ok,false,'no original IDs approved '+q.id);
  const forged=mathsOriginalGradeDemandDecision({id:q.id,...gradeEvidence});
  assert.equal(forged.ok,q.triageAction==='RETAIN_FOR_EXTERNAL_BENCHMARK',q.id);
  if(q.triageAction!=='RETAIN_FOR_EXTERNAL_BENCHMARK')
   assert.equal(forged.reason,'original-grade-triage-rewrite-or-taught-hold');
 }
 assert.equal(mathsOriginalGradeDemandDecision({id:'LUX-MATH-Y9-SIMULTANEOUS-999',...gradeEvidence}).ok,false);
 assert.equal(mathsOriginalGradeDemandDecision({id:'test-only-unique-id'}).ok,true);
});

test('review candidate still needs independent grade decision AND evidence before gate accepts',()=>{
 const id='LUX-MATH-Y9-GRAPHS-028';
 assert.equal(original(id).triageAction,'RETAIN_FOR_EXTERNAL_BENCHMARK');
 for(const field of Object.keys(gradeEvidence)){
  const a={id,...gradeEvidence};delete a[field];
  assert.equal(mathsOriginalGradeDemandDecision(a).ok,false,'missing '+field);
 }
 assert.equal(mathsOriginalGradeDemandDecision({id,...gradeEvidence}).ok,true);
 assert.equal(mathsOriginalGradeDemandDecision({id,gradeDemandQA:'approved',...gradeEvidence,gradeDemandQA:'pending'}).ok,false);
});

const topics=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
 'math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
const bandPairs=[['G7','G8'],['G7','G8'],['G7','G8'],['G7','G8'],['G8-9','G8-9']];
const baseline=topics.flatMap((topicId,t)=>bandPairs[t].map((difficultyTarget,i)=>({
 id:'grade-gate-synthetic-'+t+'-'+i,subject:'maths',year:9,topicId,difficultyTarget,
 templateId:'grade-gate-template-'+t+'-'+i,conceptFamilyId:'grade-gate-family-'+t+'-'+i,
 academicQA:'approved',taughtVerified:true,mathDailyEnabled:true,renderRequired:true,
 correctOptionId:'A',sourceRef:'synthetic',qaReviewer:'synthetic',mathsChecker:'synthetic',
 conceptFamilyEvidence:'synthetic evidence',conceptFamilyReviewer:'synthetic reviewer',
 options:['A','B','C','D','E','F'].map(id=>({id,text:id,latex:id,misconception:id==='A'?'':'synthetic wrong operation'}))
})));
const task=(qs,day='2026-11-23')=>({id:'maths-daily',planDate:day,dailyV3:true,supplyBlocked:false,
 assignedSubject:'maths',assignedYear:9,approvedQuestionIds:qs.map(q=>q.id),
 approvedCorrectOptionByQuestion:Object.fromEntries(qs.map(q=>[q.id,q.correctOptionId])),
 approvedConceptByQuestion:Object.fromEntries(qs.map(q=>[q.id,q.conceptFamilyId]))});
test('real selector and formal grader fail closed when a forbidden original looks fully approved',()=>{
 const ready=selectMathsV31Daily({approvedQuestions:baseline,day:'2026-11-23'});
 assert.equal(ready.ready,true,ready.issues?.join(','));
 const bad=baseline.map((q,i)=>i===0?{...q,id:'LUX-MATH-Y9-INDICES-001',...gradeEvidence}:q);
 const denied=selectMathsV31Daily({approvedQuestions:bad,day:'2026-11-23'});
 assert.equal(denied.ready,false);
 assert.deepEqual(denied.questions,[]);
 const formal=verifyMathDailyAssignment(task(bad),bad,'2026-11-23');
 assert.equal(formal.valid,false);
 assert.ok(formal.issues.some(x=>x.startsWith('original-grade-triage-rewrite-or-taught-hold:')),
 formal.issues.join(','));
});

test('signed-looking graph candidate with no independent grade evidence still cannot enter Daily',()=>{
 const candidate=baseline.map((q,i)=>i===6?{...q,id:'LUX-MATH-Y9-GRAPHS-028'}:q);
 assert.equal(selectMathsV31Daily({approvedQuestions:candidate,day:'2026-11-23'}).ready,false);
 const formal=verifyMathDailyAssignment(task(candidate),candidate,'2026-11-23');
 assert.ok(formal.issues.some(x=>x.startsWith('independent-g7plus-review-required:')));
 const onlyGradeMock=candidate.map(q=>q.id==='LUX-MATH-Y9-GRAPHS-028'?{...q,...gradeEvidence}:q);
 assert.equal(selectMathsV31Daily({approvedQuestions:onlyGradeMock,day:'2026-11-23'}).ready,true);
 // Even in the synthetic fixture, these fields do NOT assert real question-level TGS or exam certification.
});

test('original intake and generic planner also enforce source grade demand',()=>{
 const q={id:'LUX-MATH-Y9-SIMULTANEOUS-013',subject:'maths',year:9,
 topicId:'math-y9-simultaneous-equations',topic:'simultaneous-equations',
 grade:'7',difficultyTarget:'G7',templateId:'V2-SIMULTANEOUS-4',
 stem:'Find k for no solution',options:['A','B','C','D','E','F'].map(id=>({
 id,latex:id,text:id,misconception:id==='C'?'':'mock error'})),
 correctOptionId:'C',correctAnswerLatex:'4',workedSolutionSteps:['method 1','method 2'],
 qa:{mathSecondPassVerified:true,oneCorrectChoiceSecondPass:true,sixMathematicallyDistinctChoicesSecondPass:true}};
 const staged=stageMathsV31Question(q);
 assert.equal(staged.eligible,false);
 assert.ok(staged.issues.includes('original-grade-triage-rewrite-or-taught-hold'));
 const v=validateMathQuestion({...q,academicQA:'approved',taughtVerified:true,
  conceptFamilyId:'review-family',conceptFamilyEvidence:'signed',conceptFamilyReviewer:'reviewer',
  ...gradeEvidence});
 assert.equal(v.valid,false);
 assert.ok(v.issues.includes('original-grade-triage-rewrite-or-taught-hold'));
});
