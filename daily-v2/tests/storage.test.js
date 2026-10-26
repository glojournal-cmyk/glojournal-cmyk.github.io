import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commitDailyV2Plan,commitDailyV2Answer,createMemoryDailyV2Repository} from '../src/storage.js';
import {DAILY_V2_TASKS} from '../src/planner.js';

const day='2026-10-26';
function plan(){
 let cursor=0;
 return {version:2,day,status:'ready',target:163,tasks:DAILY_V2_TASKS.map(t=>({
  ...t,questions:Array.from({length:t.target},(_,i)=>({
   questionId:t.id+'-q'+i,conceptId:t.kind==='vocab'?t.subject+'-word'+i:null
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
  questionId:'gcse-exam-skills-q0',conceptId:null,correct:false,marksEarned:1,marksPossible:3}));
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
