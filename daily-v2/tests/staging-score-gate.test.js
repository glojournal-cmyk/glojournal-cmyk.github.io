import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DAILY_V2_TASKS} from '../src/planner.js';
import {fingerprintDailyV2Source} from '../src/bank-adapter.js';
import {commitDailyV2Plan,createMemoryDailyV2Repository} from '../src/storage.js';
import {previewFrozenDailyV2ObjectiveSubmission as stage} from '../src/staging-score-gate.js';

const day='2026-10-30';
const source=JSON.parse(readFileSync(new URL('../../content/topics/bio-y8-ber.json',import.meta.url),'utf8'));
const question=source.questions.find(q=>q.id==='bio-y8-app-ber-55');
function plan({signed=true}={}){
 const p={version:2,status:'ready',day,target:163,tasks:DAILY_V2_TASKS.map(t=>({
  ...t,questions:Array.from({length:t.target},(_,i)=>({
   questionId:t.id+'-frozen-'+i,
   conceptId:t.kind==='vocab'?t.id+'-concept-'+i:null,
   marks:t.kind==='exam'?i+1:null
  }))
 }))};
 p.tasks.find(t=>t.id==='science-standard').questions[0]={
  questionId:question.id,subject:source.subject,year:source.year,
  topicId:source.topicId,marks:null,conceptId:null,
  ...(signed?{sourceFingerprint:fingerprintDailyV2Source(source,question)}:{})
 };
 return p;
}
const submission=changes=>({day,taskId:'science-standard',questionId:question.id,
 topic:source,question,response:'7128 kJ/day',...changes});
async function frozen(opts={}){
 const repo=createMemoryDailyV2Repository();
 await commitDailyV2Plan(repo,plan(opts));
 return repo;
}
test('frozen real numeric answer previews full credit without writing an attempt or reward',async()=>{
 const repo=await frozen(),before=repo.readOnlySnapshot(day);
 const result=await stage(repo,submission());
 assert.equal(result.verifiedFrozenAssignment,true);
 assert.equal(result.marksPossible,2);
 assert.equal(result.marksEarned,2);
 assert.equal(result.correct,true);
 assert.equal(result.releaseGrade,false);
 assert.equal(result.ledgerEligible,false);
 assert.equal(result.persisted,false);
 assert.equal(result.creditDelta,0);
 assert.equal(result.examMarkDelta,0);
 assert.equal(result.newVerifiedCredit,false);
 assert.equal(result.awardXP,false);
 assert.equal(result.awardMP,false);
 assert.deepEqual(repo.readOnlySnapshot(day),before);
});
test('wrong numeric answer is left for review and never credited',async()=>{
 const repo=await frozen(),before=repo.readOnlySnapshot(day);
 const result=await stage(repo,submission({response:'6000 kJ/day'}));
 assert.equal(result.status,'staging-review-required');
 assert.equal(result.marksEarned,null);
 assert.equal(result.creditDelta,0);
 assert.deepEqual(repo.readOnlySnapshot(day),before);
});
test('no storage writer is necessary or called by staging scoring',async()=>{
 const repo=await frozen(),original=repo.readOnlySnapshot(day);
 const readOnly={async read(d){assert.equal(d,day);return original;},
  async compareAndSwap(){throw Error('UNAUTHORIZED_LEDGER_WRITE');}};
 const result=await stage(readOnly,submission());
 assert.equal(result.persisted,false);
 assert.equal(original.ledger.attempts.length,0);
});
test('student submission for a question absent from the frozen roster is rejected',async()=>{
 const repo=await frozen();
 await assert.rejects(stage(repo,submission({questionId:'wrong'})),/QUESTION_NOT_IN_FROZEN_ROSTER/);
 assert.equal(repo.readOnlySnapshot(day).ledger.attempts.length,0);
});
test('submission for the wrong Daily task or calendar day is rejected',async()=>{
 const repo=await frozen();
 await assert.rejects(stage(repo,submission({taskId:'latin-vocab'})),/QUESTION_NOT_IN_FROZEN_ROSTER/);
 await assert.rejects(stage(repo,submission({day:'2026-10-29'})),/NO_VALID_FROZEN_DAILY_PLAN/);
});
test('a changed correct numeric value cannot use yesterday source fingerprint',async()=>{
 const repo=await frozen();
 const edited={...question,answer:{...question.answer,value:9999}};
 await assert.rejects(stage(repo,submission({question:edited,response:'9999 kJ/day'})),
  /SOURCE_CHANGED_SINCE_FROZEN_PLAN/);
});
test('source prompt changes trigger a new fingerprint before any score is shown',async()=>{
 const repo=await frozen();
 const edited={...question,prompt:question.prompt+' Altered.'};
 await assert.rejects(stage(repo,submission({question:edited})),
  /SOURCE_CHANGED_SINCE_FROZEN_PLAN/);
});
test('source topic, year and subject cannot be substituted for a frozen assignment',async()=>{
 const repo=await frozen();
 await assert.rejects(stage(repo,submission({topic:{...source,subject:'chemistry'}})),
  /FROZEN_QUESTION_IDENTITY_MISMATCH/);
 await assert.rejects(stage(repo,submission({topic:{...source,year:9}})),
  /FROZEN_QUESTION_IDENTITY_MISMATCH/);
 await assert.rejects(stage(repo,submission({topic:{...source,topicId:'foreign-topic'}})),
  /FROZEN_QUESTION_IDENTITY_MISMATCH/);
});
test('unsigned legacy or QA plans never silently become source-backed scoring authority',async()=>{
 const repo=await frozen({signed:false});
 await assert.rejects(stage(repo,submission()),
  /SOURCE_FINGERPRINT_MISSING_FROM_FROZEN_ROSTER/);
 assert.equal(repo.readOnlySnapshot(day).ledger.attempts.length,0);
});
test('source reviewer flags and disabled questions fail closed in staging scorer',async()=>{
 const repo=await frozen();
 await assert.rejects(stage(repo,submission({question:{...question,status:'disabled'}})),
  /QUESTION_SOURCE_NOT_ACTIVE/);
});
test('staging scoring cannot run before an authoritative frozen plan is saved',async()=>{
 const repo=createMemoryDailyV2Repository();
 await assert.rejects(stage(repo,submission()),/NO_VALID_FROZEN_DAILY_PLAN/);
});
test('plan cannot freeze malformed source fingerprints',async()=>{
 const repo=createMemoryDailyV2Repository(),p=plan();
 p.tasks.find(t=>t.id==='science-standard').questions[0].sourceFingerprint='trusted-me';
 await assert.rejects(commitDailyV2Plan(repo,p),/INVALID_SOURCE_FINGERPRINT/);
 assert.equal(repo.readOnlySnapshot(day),null);
});
