import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryDailyV2Repository} from '../src/storage.js';
import {createStagingFixture,STAGING_DAY,STAGING_EXPECTED} from '../staging/qa-fixture.js';
import {qaDatabaseName,openQaSession,readQaSession,nextQaQuestion,commitQaAttempt} from '../staging/qa-controller.js';
const repo=()=>createMemoryDailyV2Repository();
test('synthetic complete scenario creates a frozen 10-task/163-question plan',async()=>{
 const r=repo(),s=await openQaSession(r,{scenario:'ready'});
 assert.equal(s.plan.status,'ready');
 assert.equal(s.summary.fullDayTarget,163);
 assert.equal(s.summary.unavailableTasks,0);
 assert.equal(s.plan.tasks.length,10);
 assert.equal(s.plan.tasks.reduce((n,t)=>n+t.questions.length,0),163);
});
test('synthetic one-missing-GCSE scenario preserves 9 whole tasks, never full-day completion',async()=>{
 const r=repo(),s=await openQaSession(r,{scenario:'missing-gcse'});
 assert.equal(s.plan.status,'partial');
 assert.equal(s.summary.availableTarget,160);
 assert.equal(s.summary.fullDayTarget,163);
 assert.equal(s.summary.unavailableTasks,1);
 assert.equal(s.plan.tasks.length,9);
 assert.equal(s.summary.fullDayRewardEligible,false);
 assert.equal(s.summary.tasks.find(t=>t.taskId==='gcse-exam-skills').state,'unavailable');
});
test('QA database namespaces cannot point at legacy student storage',()=>{
 assert.equal(qaDatabaseName('ready'),'scholar-daily-v2-staging-ui-ready');
 assert.notEqual(qaDatabaseName('missing-gcse'),qaDatabaseName('ready'));
 assert.throws(()=>qaDatabaseName('production'),/Invalid QA scenario/);
});
test('correct QA answer counts exactly once and survives fresh controller state',async()=>{
 const r=repo();let s=await openQaSession(r);
 const q=nextQaQuestion(s.plan,s.ledger,'french-vocab');
 const args={day:STAGING_DAY,eventId:'first-1',taskId:'french-vocab',questionId:q.questionId,answerText:STAGING_EXPECTED};
 let save=await commitQaAttempt(r,args);
 assert.equal(save.verified,true);assert.equal(save.progress.verifiedProgress,1);
 save=await commitQaAttempt(r,args);
 assert.equal(save.alreadyRecorded,true);
 s=await readQaSession(r);
 assert.equal(s.summary.tasks.find(t=>t.taskId==='french-vocab').verifiedProgress,1);
 assert.notEqual(nextQaQuestion(s.plan,s.ledger,'french-vocab').questionId,q.questionId);
});
test('incorrect QA answer is saved as an attempt but does not credit',async()=>{
 const r=repo();let s=await openQaSession(r);
 const q=nextQaQuestion(s.plan,s.ledger,'latin-vocab');
 await commitQaAttempt(r,{eventId:'wrong',taskId:'latin-vocab',questionId:q.questionId,answerText:'WRONG'});
 s=await readQaSession(r);
 assert.equal(s.summary.tasks.find(t=>t.taskId==='latin-vocab').verifiedProgress,0);
 assert.equal(nextQaQuestion(s.plan,s.ledger,'latin-vocab').questionId,q.questionId);
 await commitQaAttempt(r,{eventId:'right',taskId:'latin-vocab',questionId:q.questionId,answerText:'qa_ok'});
 s=await readQaSession(r);
 assert.equal(s.summary.tasks.find(t=>t.taskId==='latin-vocab').verifiedProgress,1);
});
test('simulated failed persistence emits no receipt and score remains unchanged',async()=>{
 const r=repo();const s=await openQaSession(r);
 const q=nextQaQuestion(s.plan,s.ledger,'french-vocab');
 const fake={read:day=>r.read(day),async compareAndSwap(){throw Error('Simulated capacity failure')}};
 const args={eventId:'retry-qa-1',taskId:'french-vocab',questionId:q.questionId,answerText:STAGING_EXPECTED};
 await assert.rejects(()=>commitQaAttempt(fake,args),/Simulated capacity failure/);
 assert.equal((await readQaSession(r)).summary.totalVerified,0);
 const retry=await commitQaAttempt(r,args);
 assert.equal(retry.progress.verifiedProgress,1);
 assert.equal((await readQaSession(r)).summary.totalVerified,1);
});
test('partly marked GCSE question is one question completed with separate marks',async()=>{
 const r=repo();let s=await openQaSession(r);
 const task=s.plan.tasks.find(t=>t.kind==='exam');
 for(const q of task.questions){
  await commitQaAttempt(r,{eventId:'exam-'+q.questionId,taskId:task.id,
   questionId:q.questionId,marksEarned:q.marks===3?2:q.marks});
 }
 s=await readQaSession(r);
 const row=s.summary.tasks.find(t=>t.taskId==='gcse-exam-skills');
 assert.equal(row.verifiedProgress,3);
 assert.deepEqual(row.examMarks,{earned:5,possible:6});
 assert.equal(nextQaQuestion(s.plan,s.ledger,task.id),null);
});
test('unavailable exam cannot be answered or added to full-day credit',async()=>{
 const r=repo();const s=await openQaSession(r,{scenario:'missing-gcse'});
 assert.equal(nextQaQuestion(s.plan,s.ledger,'gcse-exam-skills'),null);
 await assert.rejects(()=>commitQaAttempt(r,{
  eventId:'forged-exam',taskId:'gcse-exam-skills',questionId:'qa-gcse-3',marksEarned:3
 }),/not assigned/);
 assert.equal((await readQaSession(r)).summary.totalVerified,0);
});
test('QA full-day 163 evidence completes without awarding any actual XP',async()=>{
 const r=repo();let s=await openQaSession(r);
 for(const task of s.plan.tasks){
  for(const q of task.questions)await commitQaAttempt(r,{
   eventId:'all-'+q.questionId,taskId:task.id,questionId:q.questionId,
   ...(task.kind==='exam'?{marksEarned:q.marks}:{answerText:STAGING_EXPECTED})
  });
 }
 s=await readQaSession(r);
 assert.equal(s.summary.totalVerified,163);
 assert.equal(s.summary.completedTasks,10);
 assert.equal(s.summary.fullDayComplete,true);
 assert.equal(s.plan.tasks.length,10);
 assert.equal(r.readOnlySnapshot(STAGING_DAY).xp,undefined);
});
test('one-missing-GCSE day with all 160 answered never claims 163 complete',async()=>{
 const r=repo();let s=await openQaSession(r,{scenario:'missing-gcse'});
 for(const t of s.plan.tasks)for(const q of t.questions){
  await commitQaAttempt(r,{eventId:'partial-'+q.questionId,taskId:t.id,
   questionId:q.questionId,answerText:STAGING_EXPECTED});
 }
 s=await readQaSession(r);
 assert.equal(s.summary.totalVerified,160);
 assert.equal(s.summary.completedTasks,9);
 assert.equal(s.summary.fullDayComplete,false);
 assert.equal(s.summary.fullDayRewardEligible,false);
});
test('old student data is not an input to the synthetic QA fixture',()=>{
 const f=createStagingFixture({scenario:'ready'});
 assert.equal(f.questionBank.length>=163,true);
 assert.equal(f.priorAttempts.every(x=>x.eventId.startsWith('qa-history')),true);
 assert.equal(f.questionBank.every(q=>q.id.startsWith('qa-')),true);
});
