// Regression test: node qa/recovery-consistency.test.mjs
// A mistaken Recovery code change must not lose credited work on a reload.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const load=async name=>{
 const raw=await readFile(new URL("../assets/"+name,import.meta.url));
 return import("data:text/javascript;base64,"+raw.toString("base64"));
};
const ledger=await load("recovery-task-ledger-20261017.js");
const integrity=await load("daily-record-integrity-20261018.js");
const journal=await load("durable-study-evidence-20261018.js");
const main=await readFile(new URL("../assets/index-BLVOhKhN.js",import.meta.url),"utf8");
const start=main.indexOf("  const recoveryVocab = { ...(state.recoveryVocabByDay || {}) };");
const end=main.indexOf("  const retroAwards = [];",start);
assert.ok(start>=0&&end>start,"core Recovery projector exists");
const projector=new Function("state","YEAR8_RECOVERY_TASKS","eligibleYear8Evidence",
 "recoveryAnswerEventKey","const patch={};"+main.slice(start,end)+
 ";return patch.recoveryTaskByDay||state.recoveryTaskByDay||{};");
const replay=state=>projector(state,["y8-practise","y8-mastery","year8-long-review"],
 ledger.matchesAssignedPracticeEvidence,(e)=>String(e.questionId)+"@"+(e.attemptId||e.at));
const date="2026-10-16",next="2026-10-17",topic="chem-y8-working-scientifically";
const original={id:"y8-practise",target:10,progress:0,done:false,
 assignedSubject:"chemistry",assignedTopic:topic};
const finished={date:next,done:1,total:1,complete:true,
 tasks:[{id:"study-session",target:10,progress:10,done:true}]};
const events=Array.from({length:10},(_,i)=>({
 at:"2026-10-18T08:40:"+String(i).padStart(2,"0")+"Z",
 attemptId:"answer-"+i,day:"2026-10-18",recoveryFor:date,
 dailyTaskId:"y8-practise",questionId:"chem-q"+i,
 subject:"chemistry",topicId:topic,correct:true,formal:true,
 repair:false,year:8
}));
const state={dailyLog:{
 [date]:{date,done:0,total:1,complete:false,tasks:[original]},
 [next]:finished},formalAttemptLog:events,recoveryTaskByDay:{}};
const proofs=replay(state);
assert.equal(Object.keys(proofs[date]["y8-practise"].items).length,10);
const row=ledger.reconcileRecoveredTaskHistory({...state,recoveryTaskByDay:proofs},state.dailyLog);
assert.equal(row[date].tasks[0].progress,10);
assert.equal(row[date].tasks[0].done,true);
assert.deepEqual(row[next],finished,"next day's finished record is untouched");
const wrong=replay({...state,recoveryTaskByDay:{},formalAttemptLog:
 events.map(e=>({...e,topicId:"wrong-topic"}))});
assert.equal(Object.keys(wrong[date]["y8-practise"].items).length,10,
 "a finished session tagged for this task still counts when the topic string differs");
const untagged=replay({...state,recoveryTaskByDay:{},formalAttemptLog:
 events.map(e=>({...e,topicId:"wrong-topic",dailyTaskId:null}))});
assert.equal(untagged[date]?.["y8-practise"],undefined,
 "untagged wrong-topic answers still do not invent Foundation credit");
const merged=journal.mergeMarkedEvidence([],events);
assert.equal(merged.length,10);
assert.equal(journal.mergeMarkedEvidence(merged,events),merged,
 "same events cannot be counted again on reopen");
const preserved=integrity.mergeDailyHistory({
 [date]:{...state.dailyLog[date]}},{[date]:row[date]});
assert.equal(preserved[date].done,1,"out-of-date logs cannot erase saved credit");
const proof=(needed,count)=>({completed:true,totalNeeded:needed,originalCount:0,
 items:Object.fromEntries(Array.from({length:count},(_,i)=>["q"+i,true]))});
const orphan={dailyLog:{[date]:{date,done:1,total:1,complete:true,tasks:[
 {id:"french-vocab",progress:30,target:30,done:true}]}},recoveryTaskByDay:{
 [date]:{"mistake-review":proof(1,10),"study-session":proof(10,10),
 "adaptive-focus":proof(4,10),"tend-garden":proof(1,1),"play-game":proof(1,1)}}};
const six=ledger.reconcileRecoveredTaskHistory(orphan,orphan.dailyLog)[date];
assert.equal(six.done,6);assert.equal(six.total,10);
assert.equal(six.tasks.find(t=>t.id==="y8-practise").progress,0,
 "never invent Foundation answers");
globalThis.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}};
const receipts=await load("recovery-receipt-20261018.js");
assert.equal(receipts.saveRecoveryReceipt({date,taskId:"y8-practise",questionIds:events.map(e=>e.questionId)}),true);
const applied=receipts.applyRecoveryReceipts({
 [date]:{date,done:0,total:1,complete:false,tasks:[original]},
 [next]:finished});
assert.equal(applied[date].tasks[0].done,true);
assert.equal(applied[date].tasks[0].progress,10);
assert.deepEqual(applied[next],finished,"a receipt cannot alter the next day");
const words=Array.from({length:20},(_,i)=>"fr-word-"+i);
assert.equal(receipts.saveRecoveryReceipt({date,taskId:"french-vocab",subject:"french",questionIds:words,baseline:10}),true);
const vocab=receipts.applyRecoveryReceipts({
 [date]:{date,done:0,total:2,complete:false,tasks:[
  original,{id:"french-vocab",target:30,progress:10,done:false}]},
 [next]:finished});
assert.equal(vocab[date].tasks.find(t=>t.id==="french-vocab").progress,30);
assert.equal(vocab[date].tasks.find(t=>t.id==="french-vocab").done,true);
assert.equal(vocab[date].tasks[0].done,true,"practice credit stays");
assert.deepEqual(vocab[next],finished);
const partial=receipts.applyRecoveryReceipts({
 [date]:{date,done:0,total:1,complete:false,tasks:[{id:"latin-vocab",target:30,progress:5,done:false}]}});
assert.equal(receipts.saveRecoveryReceipt({date,taskId:"latin-vocab",questionIds:Array.from({length:10},(_,i)=>"la"+i),baseline:5}),true);
const latin=receipts.applyRecoveryReceipts({
 [date]:{date,done:0,total:1,complete:false,tasks:[{id:"latin-vocab",target:30,progress:5,done:false}]}});
assert.equal(latin[date].tasks[0].progress,15);
assert.equal(latin[date].tasks[0].done,false,"ten new correct words do not finish a thirty-word task");
assert.equal(partial[date].tasks[0].progress,5,"a vocab receipt is not applied before it exists");
assert.equal(receipts.saveRecoveryReceipt({date,taskId:"tend-garden",questionIds:["watered"]}),true);
assert.equal(receipts.saveRecoveryReceipt({date,taskId:"play-game",questionIds:["played"]}),true);
const acts=receipts.applyRecoveryReceipts({
 [date]:{date,done:0,total:2,complete:false,tasks:[
  {id:"tend-garden",target:1,progress:0,done:false},
  {id:"play-game",target:1,progress:0,done:false}]},
 [next]:finished});
assert.equal(acts[date].tasks.every(t=>t.done),true);
assert.deepEqual(acts[next],finished);
let quota=true;
globalThis.localStorage={
 _m:new Map([["lux-practice-drafts-v1","draft"]]),
 getItem(k){return this._m.has(k)?this._m.get(k):null},
 setItem(k,v){if(quota&&k==="lux-recovery-receipts-v1"){const e=Error("quota");e.name="QuotaExceededError";throw e}this._m.set(k,String(v))},
 removeItem(k){if(k==="lux-practice-drafts-v1")quota=false;this._m.delete(k)}
};
const squeezed=await load("recovery-receipt-20261018.js");
assert.equal(squeezed.saveRecoveryReceipt({date:"2026-10-15",taskId:"tend-garden",questionIds:["watered"]}),true);
assert.equal(quota,false,"a full iPad drops practice drafts, not the learning record, so the receipt can land");
console.log("Recovery QA passed: 16th credited, 17th preserved, explicit task tag survives topic mismatch, receipt replays, vocab water and game survive a full iPad, no wrong topic, replay idempotent, orphan repaired.");
