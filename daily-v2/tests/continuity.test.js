import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planDailyV2,DAILY_V2_TASKS} from '../src/planner.js';
import {createDailyV2ContinuityPlan} from '../src/continuity.js';
import {commitDailyV2Plan,commitDailyV2Answer,createMemoryDailyV2Repository} from '../src/storage.js';

const day='2026-10-26';
function latinOnly(){
 const questionBank=[];
 for(let i=0;i<25;i++)questionBank.push({
  id:'latin8-'+i,subject:'latin',year:8,topicId:'lat-vocab8',status:'enabled',
  roles:['latin-vocab'],prompt:'Word '+i,conceptId:'latin-concept8-'+i
 });
 for(let i=0;i<5;i++)questionBank.push({
  id:'latin9-'+i,subject:'latin',year:9,topicId:'lat-vocab9',status:'enabled',
  roles:['latin-vocab'],prompt:'New word '+i,conceptId:'latin-concept9-'+i
 });
 return {day,questionBank,taughtTopicIds:['lat-vocab9'],priorAttempts:[]};
}
function blockedFixture(){
 return planDailyV2(latinOnly());
}
test('strict public plan stays blocked with no public tasks',()=>{
 const plan=blockedFixture();
 assert.equal(plan.status,'blocked');
 assert.deepEqual(plan.tasks,[]);
 assert.equal(plan.eligibleTasks.length,1);
 assert.equal(plan.availability.length,10);
 assert.equal(plan.availability.find(x=>x.taskId==='latin-vocab').state,'available');
 assert.equal(plan.availability.find(x=>x.taskId==='mastery-a').state,'unavailable');
});
test('explicit continuity planner publishes only ready complete tasks, no fake daily completion',()=>{
 const plan=createDailyV2ContinuityPlan(blockedFixture());
 assert.equal(plan.status,'partial');
 assert.equal(plan.target,163);
 assert.equal(plan.availableTarget,30);
 assert.equal(plan.tasks.length,1);
 assert.equal(plan.unavailable.length,9);
 assert.equal(plan.dailyComplete,false);
 assert.ok(plan.unavailable.every(x=>x.reasonCodes.length));
});
test('partial day cannot be persisted without explicit staging approval',async()=>{
 const repo=createMemoryDailyV2Repository();
 await assert.rejects(()=>commitDailyV2Plan(repo,createDailyV2ContinuityPlan(blockedFixture())),
   /PARTIAL_REQUIRES_EXPLICIT_STAGING_OPT_IN/);
 assert.equal(repo.readOnlySnapshot(day),null);
});
test('explicitly approved partial plan freezes and reopens with identical assignments',async()=>{
 const repo=createMemoryDailyV2Repository(),plan=createDailyV2ContinuityPlan(blockedFixture());
 const receipt=await commitDailyV2Plan(repo,plan,{allowPartial:true});
 assert.equal(receipt.plan.status,'partial');
 const reopened=await commitDailyV2Plan(repo,plan,{allowPartial:true});
 assert.equal(reopened.alreadyFrozen,true);
 assert.deepEqual(reopened.plan,plan);
 assert.strictEqual(planDailyV2({day,existingPlan:reopened.plan}),reopened.plan);
});
test('partial plan can safely record verified answer only in assigned task',async()=>{
 const repo=createMemoryDailyV2Repository(),plan=createDailyV2ContinuityPlan(blockedFixture());
 await commitDailyV2Plan(repo,plan,{allowPartial:true});
 const q=plan.tasks[0].questions[0];
 const e={eventId:'vocab-1',day,taskId:'latin-vocab',questionId:q.questionId,conceptId:q.conceptId,correct:true};
 const saved=await commitDailyV2Answer(repo,e);
 assert.equal(saved.verified,true);
 assert.equal(saved.progress.verifiedProgress,1);
 const duplicate=await commitDailyV2Answer(repo,e);
 assert.equal(duplicate.alreadyRecorded,true);
 assert.equal(duplicate.progress.verifiedProgress,1);
 assert.equal(repo.readOnlySnapshot(day).plan.dailyComplete,false);
});
test('blocked task cannot receive a synthetic completion credit',async()=>{
 const repo=createMemoryDailyV2Repository(),plan=createDailyV2ContinuityPlan(blockedFixture());
 await commitDailyV2Plan(repo,plan,{allowPartial:true});
 await assert.rejects(()=>commitDailyV2Answer(repo,{eventId:'cheat',day,taskId:'mastery-b',questionId:'nonexistent',correct:true}),
   /answer task not present/);
 assert.equal(repo.readOnlySnapshot(day).ledger.attempts.length,0);
});
test('one missing Year 9 vocab concept disables that task rather than silently giving 29/30',()=>{
 const f=latinOnly();f.questionBank.pop();
 const plan=planDailyV2(f);
 assert.equal(plan.status,'blocked');
 assert.equal(plan.eligibleTasks.length,0);
 assert.throws(()=>createDailyV2ContinuityPlan(plan),/1\.\.9 ready tasks/);
});
test('duplicate global question IDs invalidate any partial continuity route',()=>{
 const f=latinOnly();f.questionBank.push({...f.questionBank[0]});
 const plan=planDailyV2(f);
 assert.equal(plan.preflight.globallyUnsafe,true);
 assert.equal(plan.eligibleTasks.length,0);
 assert.throws(()=>createDailyV2ContinuityPlan(plan),/requires a safe/);
});
test('tampering availableTarget cannot claim 163/163 through storage',async()=>{
 const plan=createDailyV2ContinuityPlan(blockedFixture());
 plan.availableTarget=163;
 await assert.rejects(()=>commitDailyV2Plan(createMemoryDailyV2Repository(),plan,{allowPartial:true}),
   /partial plan may not fake/);
});
test('removing explicit blocked task evidence fails before any write',async()=>{
 const plan=createDailyV2ContinuityPlan(blockedFixture());
 plan.unavailable.pop();
 const repo=createMemoryDailyV2Repository();
 await assert.rejects(()=>commitDailyV2Plan(repo,plan,{allowPartial:true}),
  /partial plan missing explicit blocked task list/);
 assert.equal(repo.readOnlySnapshot(day),null);
});
test('cannot silently turn partial plan into full ten-task completion state',async()=>{
 const plan=createDailyV2ContinuityPlan(blockedFixture());
 plan.dailyComplete=true;
 await assert.rejects(()=>commitDailyV2Plan(createMemoryDailyV2Repository(),plan,{allowPartial:true}),
  /partial plan must preserve/);
});
test('an ordinary blocked plan with no complete tasks cannot be passed as continuity plan',()=>{
 const plan=planDailyV2({day,questionBank:[]});
 assert.throws(()=>createDailyV2ContinuityPlan(plan),/1\.\.9 ready tasks/);
});
