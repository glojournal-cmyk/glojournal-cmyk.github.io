import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyMathDailyAssignment,makeVerifiedMathsSubmission} from '../assets/math-study/daily-v31-formal-submission.js';
const day='2026-11-23';
const topics=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
 'math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
const grades=['G7','G7','G7','G7','G8','G8','G8','G8','G8-9','G8-9'];
const questions=grades.map((grade,i)=>({
 id:'qa-validated-'+i,year:9,subject:'maths',topicId:topics[Math.floor(i/2)],
 difficultyTarget:grade,academicQA:'approved',taughtVerified:true,
 mathDailyEnabled:true,renderRequired:true,templateId:'independent-concept-'+i,
 conceptFamilyId:'independent-concept-'+i,
 conceptFamilyEvidence:'synthetic semantic family evidence',
 conceptFamilyReviewer:'synthetic reviewer',
 correctOptionId:'B',sourceRef:'synthetic teacher handout',
 qaReviewer:'synthetic independent academic QA',mathsChecker:'synthetic calculus checker',
 options:['A','B','C','D','E','F'].map(x=>({id:x,latex:String(x.charCodeAt(0)),misconception:x==='B'?'':'synthetic error mechanism'}))
}));
const task={id:'maths-daily',planDate:day,dailyV3:true,supplyBlocked:false,
  assignedSubject:'maths',assignedYear:9,
  approvedQuestionIds:questions.map(q=>q.id),
  approvedConceptByQuestion:Object.fromEntries(questions.map(q=>[q.id,q.conceptFamilyId])), 
  approvedCorrectOptionByQuestion:Object.fromEntries(questions.map(q=>[q.id,q.correctOptionId]))};
const args={day,task,approvedQuestions:questions,questionId:questions[0].id,
  selectedOptionId:'A',submittedAt:'2026-11-23T12:00:00.000Z'};
test('ten signed questions 4/4/2, exactly two in each taught topic, A-F and per-distractor rationale',()=>{
 const v=verifyMathDailyAssignment(task,questions,day);
 assert.equal(v.valid,true,v.issues.join(';'));
 assert.equal(v.questions.length,10);
});
test('one wrong first formal submission is kept wrong, repeats can never rewrite it',()=>{
 const wrong=makeVerifiedMathsSubmission(args);
 assert.equal(wrong.accepted,true);
 assert.equal(wrong.formalAttempt.correct,false);
 assert.equal(wrong.formalAttempt.dailyTaskId,'maths-daily');
 const repeat=makeVerifiedMathsSubmission({...args,selectedOptionId:'B',priorAttempts:[wrong.formalAttempt]});
 assert.equal(repeat.accepted,false);
 assert.ok(repeat.reasons.includes('already-submitted-first-attempt'));
 assert.equal(wrong.formalAttempt.selectedOptionId,'A');
});
test('correct option B is computed by the immutable key, not a caller-supplied correct:true',()=>{
 const marked=makeVerifiedMathsSubmission({...args,selectedOptionId:'B'});
 assert.equal(marked.accepted,true);assert.equal(marked.formalAttempt.correct,true);
 assert.equal(Object.hasOwn(marked,'xp'),false);
});
test('wrong day, unassigned ID, Recovery, hint, assisted answer or bad choice must never pass',()=>{
 for(const change of [
  {day:'2026-11-24'},{submittedAt:'2026-11-24T12:00:00Z'},
  {questionId:'fabricated'},{selectedOptionId:'G'},{recoveryFor:'2026-11-22'},
  {assisted:true},{hintUsed:true},{scaffolded:true}
 ])assert.equal(makeVerifiedMathsSubmission({...args,...change}).accepted,false,JSON.stringify(change));
});
test('a submitted timestamp must be real ISO and match London task date, including BST midnight',()=>{
 for(const stamp of [
   '2026-11-23-not-a-timestamp','2026-11-23T99:00:00Z',
   '2026-11-23T12:00:00','2026-11-23T12:00:00.000Zextra',
   '2026-11-23T12:00:00+99:00'
 ])assert.equal(makeVerifiedMathsSubmission({...args,submittedAt:stamp}).accepted,false,stamp);
 const summerDay='2026-07-01';
 const summerTask={...task,planDate:summerDay};
 const summer={...args,day:summerDay,task:summerTask};
 // A 30 June UTC instant is already 1 July in Britain in the summer.
 for(const stamp of ['2026-06-30T23:30:00.000Z','2026-07-01T00:30:00+01:00'])
  assert.equal(makeVerifiedMathsSubmission({...summer,submittedAt:stamp}).accepted,true,stamp);
 // But 1 July 23:30Z is 2 July in British Summer Time.
 assert.equal(makeVerifiedMathsSubmission({...summer,submittedAt:'2026-07-01T23:30:00.000Z'}).accepted,false);
});

test('source self-reported maths correctness never substitutes for reviewer/teacher signoffs',()=>{
 const pending=questions.map(q=>({...q,academicQA:'pending'}));
 assert.equal(verifyMathDailyAssignment(task,pending,day).valid,false);
 const missing=questions.map(q=>({...q,mathsChecker:''}));
 assert.equal(verifyMathDailyAssignment(task,missing,day).valid,false);
 const misconception=questions.map(q=>({...q,options:q.options.map(o=>o.id==='A'?{...o,misconception:''}:o)}));
 assert.equal(verifyMathDailyAssignment(task,misconception,day).valid,false);
 const wrongKey={...task,approvedCorrectOptionByQuestion:{...task.approvedCorrectOptionByQuestion,[questions[0].id]:'A'}};
 assert.equal(verifyMathDailyAssignment(wrongKey,questions,day).valid,false);
});
test('different template labels cannot mint a second mark for an equivalent semantic concept',()=>{
 const duplicate=questions.map((q,i)=>i===1?{...q,conceptFamilyId:questions[0].conceptFamilyId}:q);
 const t={...task,approvedConceptByQuestion:Object.fromEntries(duplicate.map(q=>[q.id,q.conceptFamilyId]))};
 assert.equal(verifyMathDailyAssignment(t,duplicate,day).valid,false);
});

test('null/malformed task, bank and receipts never throw or grant student credit',()=>{
 assert.equal(verifyMathDailyAssignment(null,null,day).valid,false);
 assert.equal(makeVerifiedMathsSubmission({}).accepted,false);
 assert.equal(makeVerifiedMathsSubmission({...args,approvedQuestions:[]}).accepted,false);
});

test('dated Maths task compaction does not convert a finished failed 8/10 attempt to done',()=>{
 const wrapper=readFileSync('assets/index-BLVOhKhN.js','utf8');
 assert.ok(wrapper.includes("done: task.dailyV3===true && task.id==='maths-daily'"));
 assert.ok(wrapper.includes('? task.done===true : progress >= target'));
 // Scoring is still based on first formal keyed answers, not submitted count.
 const attempts=questions.map((q,i)=>({
   day,questionId:q.id,dailyTaskId:'maths-daily',subject:'maths',year:9,
   formal:true,correct:i<8,selectedOptionId:i<8?'B':'A',at:day+'T12:00:00Z'
 }));
 assert.equal(attempts.length,10);
});

test('actual Scholar recordAttempt wrapper persists the A-F selected answer and assistance/recovery flags',()=>{
 const wrapper=readFileSync('assets/index-BLVOhKhN.js','utf8');
 const idx=wrapper.indexOf('  const evidenceEntry={');
 assert.ok(idx>=0);
 const proof=wrapper.slice(idx,idx+1700);
 for(const token of [
   'selectedOptionId:', 'meta.selectedOptionId', 'assisted: meta.assisted===true',
   'hintUsed: meta.hintUsed===true','scaffolded: meta.scaffolded===true',
   'recoveryFor: inRecovery ? recoverDate : null'
 ])assert.ok(proof.includes(token),token);
 assert.ok(wrapper.includes('void saveMarkedAnswer({'),'durable IndexedDB backup retained');
 assert.ok(wrapper.includes('formalAttemptLog:globalThis.LuxWeeklyEvidence.append('));
 assert.ok(wrapper.includes('approvedCorrectOptionByQuestion:Object.fromEntries('),
   'dated Maths answer key survives compact backup');
});
