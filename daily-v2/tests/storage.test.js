import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commitDailyV2Plan,commitDailyV2Answer,createMemoryDailyV2Repository} from '../src/storage.js';
import {DAILY_V2_TASKS} from '../src/planner.js';

const day='2026-10-26';
function plan(){
 let cursor=0;
 return {version:2,day,status:'ready',target:163,tasks:DAILY_V2_TASKS.map(t=>({
  ...t,questions:Array.from({length:t.target},(_,i)=>({
   questionId:t.id+'-q'+i,conceptId:t.kind==='vocab'?t.subject+'-word'+i:null,marks:t.kind==='exam'?i+1:null
  }))
 }))};
}
const answer=(overrides={})=>({
 eventId:'answer-1',day,taskId:'latin-vocab',
 questionId:'latin-vocab-q0',conceptId:'latin-word0',correct:true,...overrides
});
test('frozen plan commits atomically and round-trips through repository',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 const r=await commitDailyV2Plan(repo,p);
 assert.equal(r.alreadyFrozen,false);
 assert.deepEqual(repo.readOnlySnapshot(day).plan,p);
});
test('repeated save of the same plan remains frozen',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 await commitDailyV2Plan(repo,p);
 const r=await commitDailyV2Plan(repo,p);
 assert.equal(r.alreadyFrozen,true);
 assert.equal(repo.readOnlySnapshot(day).revision,1);
});
test('different assignment cannot overwrite same-day frozen plan',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 await commitDailyV2Plan(repo,p);
 const other=plan();other.tasks[0].questions[0].questionId='different';
 await assert.rejects(()=>commitDailyV2Plan(repo,other),/FROZEN_PLAN_CONFLICT/);
});
test('blocked plan cannot be frozen',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();p.status='blocked';
 await assert.rejects(()=>commitDailyV2Plan(repo,p),/fully verified/);
 assert.equal(repo.readOnlySnapshot(day),null);
});
test('confirmed correct answer returns readback receipt and progress',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 const r=await commitDailyV2Answer(repo,answer());
 assert.equal(r.verified,true);assert.equal(r.progress.verifiedProgress,1);
 assert.equal(repo.readOnlySnapshot(day).ledger.attempts.length,1);
});
test('replayed answer never counts again',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 await commitDailyV2Answer(repo,answer());
 const r=await commitDailyV2Answer(repo,answer());
 assert.equal(r.alreadyRecorded,true);assert.equal(r.progress.verifiedProgress,1);
 assert.equal(repo.readOnlySnapshot(day).ledger.attempts.length,1);
});
test('answer cannot be accepted before its frozen plan exists',async()=>{
 const repo=createMemoryDailyV2Repository();
 await assert.rejects(()=>commitDailyV2Answer(repo,answer()),/NO_FROZEN_DAILY_PLAN/);
});
test('unassigned question never earns credit',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 await assert.rejects(()=>commitDailyV2Answer(repo,answer({questionId:'other-q'})),/not assigned/);
});
test('vocab concept spoofing is rejected',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 await assert.rejects(()=>commitDailyV2Answer(repo,answer({conceptId:'another-word'})),/concept/);
});
test('conflicting reuse of event ID is rejected',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 await commitDailyV2Answer(repo,answer());
 await assert.rejects(()=>commitDailyV2Answer(repo,answer({correct:false})),/conflicting replay/);
});
test('simulated storage failure returns error and no false stored plan',async()=>{
 const repo=createMemoryDailyV2Repository({failWrites:1});
 await assert.rejects(()=>commitDailyV2Plan(repo,plan()),/SIMULATED_STORAGE_FAILURE/);
 assert.equal(repo.readOnlySnapshot(day),null);
});
test('two concurrent answers do not overwrite each other',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 const [a,b]=await Promise.all([
  commitDailyV2Answer(repo,answer({eventId:'sim-a'})),
  commitDailyV2Answer(repo,answer({eventId:'sim-b',questionId:'latin-vocab-q1',conceptId:'latin-word1'}))
 ]);
 assert.equal(a.verified,true);assert.equal(b.verified,true);
 assert.equal(repo.readOnlySnapshot(day).ledger.attempts.length,2);
 assert.equal(a.progress.verifiedProgress===2||b.progress.verifiedProgress===2,true);
});
test('GCSE one marked answer counts as completed question, preserves marks',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 const r=await commitDailyV2Answer(repo,answer({taskId:'gcse-exam-skills',
  questionId:'gcse-exam-skills-q2',conceptId:null,correct:false,marksEarned:1,marksPossible:3}));
 assert.equal(r.progress.verifiedProgress,1);
 assert.deepEqual(r.progress.examMarks,{earned:1,possible:3});
});
test('legacy 28/30 remains protected and traceable new credit progresses',async()=>{
 const repo=createMemoryDailyV2Repository();
 await commitDailyV2Plan(repo,plan(),{legacyBaselines:{'latin-vocab':{
  count:28,knownKeys:Array.from({length:28},(_,i)=>'historical-'+i)}}});
 const r=await commitDailyV2Answer(repo,answer());
 assert.equal(r.progress.verifiedProgress,29);
});
test('opaque legacy 28/30 cannot be silently double-counted',async()=>{
 const repo=createMemoryDailyV2Repository();
 await commitDailyV2Plan(repo,plan(),{legacyBaselines:{'latin-vocab':{count:28,knownKeys:[]}}});
 const r=await commitDailyV2Answer(repo,answer());
 assert.equal(r.progress.verifiedProgress,28);
 assert.equal(r.progress.pendingUnreconciledCredits,1);
});
test('lying plan adapter is caught by post-write readback verification',async()=>{
 const repo={async read(){return null;},async compareAndSwap(){return true;}};
 await assert.rejects(()=>commitDailyV2Plan(repo,plan()),/PLAN_SAVE_NOT_VERIFIED/);
});
test('lying answer adapter is caught, no success receipt is issued',async()=>{
 const live=createMemoryDailyV2Repository();await commitDailyV2Plan(live,plan());
 const repo={async read(k){return live.read(k);},async compareAndSwap(){return true;}};
 await assert.rejects(()=>commitDailyV2Answer(repo,answer()),/ANSWER_SAVE_NOT_VERIFIED/);
});

test('forged full-length plan with incorrect task target is rejected',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 p.tasks[0].target=29;p.tasks[0].questions.pop();
 await assert.rejects(()=>commitDailyV2Plan(repo,p),/invalid task identity, kind or target/);
});
test('two different assignments claiming same task ID are rejected',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 p.tasks[1].id=p.tasks[0].id;
 await assert.rejects(()=>commitDailyV2Plan(repo,p),/invalid task identity, kind or target/);
});
test('plan with nominal 163 target but repeated question ID is rejected',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 p.tasks[1].questions[0].questionId=p.tasks[0].questions[0].questionId;
 await assert.rejects(()=>commitDailyV2Plan(repo,p),/duplicated locked question/);
});

test('GCSE mark award cannot claim a different maximum than assigned question',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 await assert.rejects(()=>commitDailyV2Answer(repo,answer({taskId:'gcse-exam-skills',
   questionId:'gcse-exam-skills-q0',conceptId:null,correct:false,marksEarned:1,marksPossible:5})),/EXAM_MARKS_MISMATCH/);
});
test('GCSE partial marks must not be recorded as full correctness',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 await assert.rejects(()=>commitDailyV2Answer(repo,answer({taskId:'gcse-exam-skills',
   questionId:'gcse-exam-skills-q2',conceptId:null,correct:true,marksEarned:1,marksPossible:3})),/EXAM_CORRECTNESS_INCONSISTENT/);
});
test('ordinary answers cannot spoof exam marks',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 await assert.rejects(()=>commitDailyV2Answer(repo,answer({marksEarned:1,marksPossible:1})),/non-exam answer/);
});
test('GCSE frozen plan needs exact 1,2,3 maximum marks',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 p.tasks.find(t=>t.kind==='exam').questions[1].marks=1;
 await assert.rejects(()=>commitDailyV2Plan(repo,p),/GCSE 1\/2\/3 marks quota missing/);
});


test('distinct Vocab question IDs sharing one concept cannot freeze an impossible 30/30 task',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 const vocab=p.tasks.find(t=>t.id==='french-vocab');
 assert.notEqual(vocab.questions[0].questionId,vocab.questions[1].questionId);
 vocab.questions[1].conceptId=vocab.questions[0].conceptId;
 await assert.rejects(()=>commitDailyV2Plan(repo,p),/VOCAB_CONCEPT_ROSTER_INVALID/);
 assert.equal(repo.readOnlySnapshot(day),null,'failed Vocab roster must never be saved');
});
test('missing or noncanonical Vocab concept IDs cannot be persisted as creditable assignments',async()=>{
 for(const invalid of [null,'','  ',' word-with-spaces ']){
  const repo=createMemoryDailyV2Repository(),p=plan();
  p.tasks.find(t=>t.id==='latin-vocab').questions[0].conceptId=invalid;
  await assert.rejects(()=>commitDailyV2Plan(repo,p),/VOCAB_CONCEPT_ROSTER_INVALID/);
  assert.equal(repo.readOnlySnapshot(day),null);
 }
});
test('independent identical-looking concepts in different language tasks are allowed',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 p.tasks.find(t=>t.id==='french-vocab').questions[0].conceptId=
    p.tasks.find(t=>t.id==='latin-vocab').questions[0].conceptId;
 const receipt=await commitDailyV2Plan(repo,p);
 assert.equal(receipt.revision,1,'concept identity scope is each subject task, not globally across languages');
});

test('persisted GCSE resubmission improves awarded marks without a second completed question',async()=>{
 const repo=createMemoryDailyV2Repository();await commitDailyV2Plan(repo,plan());
 const common={taskId:'gcse-exam-skills',questionId:'gcse-exam-skills-q2',
  conceptId:null,marksPossible:3};
 const first=await commitDailyV2Answer(repo,answer({...common,eventId:'exam-1',correct:false,marksEarned:1}));
 assert.equal(first.progress.verifiedProgress,1);
 assert.deepEqual(first.progress.examMarks,{earned:1,possible:3});
 const retry=await commitDailyV2Answer(repo,answer({...common,eventId:'exam-2',correct:true,marksEarned:3}));
 assert.equal(retry.verified,true);
 assert.equal(retry.progress.verifiedProgress,1);
 assert.deepEqual(retry.progress.examMarks,{earned:3,possible:3});
 assert.equal(repo.readOnlySnapshot(day).ledger.attempts.length,2);
 const replay=await commitDailyV2Answer(repo,answer({...common,eventId:'exam-2',correct:true,marksEarned:3}));
 assert.equal(replay.alreadyRecorded,true);
 assert.deepEqual(replay.progress.examMarks,{earned:3,possible:3});
});
