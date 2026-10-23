import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rebuildDatedDailyRecords} from "../assets/daily-dated-answer-reconcile-20261023.js";
const IDS=["latin-vocab","french-vocab","latin-standard","y8-standard-a",
"y8-standard-b","y8-mastery-a","y8-mastery-b","weakness-review",
"due-review","year9-light"];
const targets=[30,30,10,10,10,15,15,10,10,15];
function form(day,task,index,correct=true,extra={}){
 return {at:day+"T10:00:"+String(index%60).padStart(2,"0")+".000Z",
  attemptId:day+":"+task+":"+index,day,questionId:task+"-"+index,
  dailyTaskId:task,correct,subject:task.includes("french")?"french":"latin",
  topicId:"original-"+task,formal:true,repair:false,...extra};
}
function evidence(day){
 return IDS.flatMap((id,i)=>Array.from({length:targets[i]},(_,j)=>
    form(day,id,j,true)));
}
function legacy21(){
 return IDS.map((id,i)=>({id,title:id,target:targets[i],
   progress:id==="latin-vocab"?30:0,
   done:id==="latin-vocab",planDate:"2026-10-21",
   assignedYear:8,href:"/study"}));
}
const base=()=>({
 today:"2026-10-23",xp:7792,
 daily:[{id:"latin-vocab",target:30,progress:0}],
 dailyLog:{"2026-10-20":{date:"2026-10-20",
    tasks:[{id:"french-vocab",target:30,progress:13,done:false}],
    done:9,total:10,complete:false},
  "2026-10-21":{date:"2026-10-21",tasks:legacy21(),done:1,
    total:10,complete:false}},
 formalAttemptLog:[...evidence("2026-10-21"),...evidence("2026-10-22")]
});
test("21/22 can be rebuilt from all ten truly tagged sets, without XP changes",()=>{
 const input=base(),patch=rebuildDatedDailyRecords(input);
 assert.ok(patch);
 assert.equal(patch.dailyLog["2026-10-21"].done,10);
 assert.equal(patch.dailyLog["2026-10-22"].done,10);
 assert.equal(patch.dailyLog["2026-10-22"].complete,true);
 assert.equal(patch.dailyLog["2026-10-22"].tasks.length,10);
 assert.equal(patch.dailyLog["2026-10-20"].tasks[0].progress,13);
 assert.equal(Object.keys(patch).join(","),"dailyLog");
 assert.equal(input.dailyLog["2026-10-21"].done,1);
 assert.equal(input.daily[0].progress,0);
});
test("replaying twice is idempotent",()=>{
 const input=base(),first=rebuildDatedDailyRecords(input);
 assert.equal(rebuildDatedDailyRecords({...input,...first}),null);
});
test("vocab needs 30 DISTINCT correct question IDs, not repeated clicks",()=>{
 const input=base();
 const a=input.formalAttemptLog.filter(e=>e.day==="2026-10-22"&&
  e.dailyTaskId!=="french-vocab");
 a.push(...Array.from({length:42},(_,i)=>form("2026-10-22",
  "french-vocab",i%20,true,{attemptId:"repeat:"+i})));
 input.formalAttemptLog=input.formalAttemptLog.filter(e=>e.day!=="2026-10-22").concat(a);
 const patch=rebuildDatedDailyRecords(input);
 const row=patch.dailyLog["2026-10-22"];
 assert.equal(row.done,9);
 assert.equal(row.tasks.find(t=>t.id==="french-vocab").progress,20);
});
test("ignore Recovery work, nonformal answers, and taskless answers",()=>{
 const input=base();input.formalAttemptLog=input.formalAttemptLog.filter(e=>
  e.day!=="2026-10-22"||e.dailyTaskId!=="latin-standard");
 input.formalAttemptLog.push(...Array.from({length:30},(_,i)=>
  form("2026-10-22","latin-standard",i,true,{recoveryFor:"2026-10-21"})));
 const patch=rebuildDatedDailyRecords(input);
 assert.equal(patch.dailyLog["2026-10-22"].tasks.find(t=>t.id==="latin-standard").progress,0);
 assert.equal(patch.dailyLog["2026-10-22"].done,9);
});
test("missing dated plan requires evidence from all ten task categories",()=>{
 const input=base();input.formalAttemptLog=input.formalAttemptLog.filter(e=>
  e.day!=="2026-10-22"||e.dailyTaskId!=="year9-light");
 const patch=rebuildDatedDailyRecords(input);
 assert.equal(patch.dailyLog["2026-10-22"],undefined);
});
test("current-day state is never changed by historical recovery",()=>{
 const input=base();input.today="2026-10-22";
 const patch=rebuildDatedDailyRecords(input);
 assert.equal(patch.dailyLog["2026-10-22"],undefined);
});
test("historical repair is mounted once without importing a second app",()=>{
 const index=readFileSync("index.html","utf8");
 const boot=readFileSync("assets/daily-dated-answer-reconcile-boot-20261023.js","utf8");
 assert.match(index,/daily-dated-answer-reconcile-boot-20261023\.js\?v=20261023-dated-receipts1/);
 assert.match(boot,/globalThis\.__luxStore/);
 assert.doesNotMatch(boot,/index-BLVOhKhN\.js/);
});
