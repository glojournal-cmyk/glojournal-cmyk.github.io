import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareLatest30DayExport} from "../assets/latest-30-day-export-20261023.js";
const day="2026-10-23";
const ids=["latin-vocab","french-vocab","latin-standard","y8-standard-a",
"y8-standard-b","y8-mastery-a","y8-mastery-b","weakness-review",
"due-review","year9-light"];
const needed=[30,30,10,10,10,15,15,10,10,15];
const work=(date,id,i,correct=true)=>({
 attemptId:date+"|"+id+"|"+i,at:date+"T15:"+String(i%60).padStart(2,"0")+":00Z",
 day:date,subject:id==="french-vocab"?"french":"latin",
 topicId:"saved-"+id,dailyTaskId:id,
 dailyVocab:id==="latin-vocab"?"latin":id==="french-vocab"?"french":null,
 questionId:id+"-"+i,correct,formal:true,repair:false
});
const evidence=date=>ids.flatMap((id,k)=>Array.from({length:needed[k]},(_,i)=>work(date,id,i)));
const task=(id,i)=>({id,target:needed[i],progress:i<8?needed[i]:i===8?5:0,
 done:i<8,title:id,planDate:day});
const live=()=>({
 today:day,xp:7058,bodyXp:104,
 daily:ids.map(task),
 dailyLog:{"2026-10-21":{date:"2026-10-21",
  tasks:ids.map((id,i)=>({id,target:needed[i],progress:0,done:false,
   title:id,planDate:"2026-10-21"})),done:0,total:10,complete:false}},
 dailyCompleteAwarded:{},dailyVocabByDay:{},
 formalAttemptLog:[work(day,"french-vocab",0)],games:{owl:{points:15}}
});
const base=state=>JSON.stringify({app:"lux-scholar-garden",version:10,
 exportedAt:"2000-01-01T00:00:00.000Z",state,
 mathsDrafts:{topic5:{work:"y=3x+1"}}});
const storage=state=>({getItem:key=>key==="lux-scholar-garden-v1"?
 JSON.stringify({state}):null});
test("Every manual export includes all 30 days, including explicitly absent days",async()=>{
 const state=live();
 const raw=await prepareLatest30DayExport(()=>state,()=>base(state),
  {readJournal:async()=>[],storage:null});
 const b=JSON.parse(raw);
 assert.equal(b.recent30Days.days.length,30);
 assert.equal(b.recent30Days.from,"2026-09-24");
 assert.equal(b.recent30Days.through,day);
 assert.equal(b.recent30Days.days.at(-1).done,8);
 assert.equal(b.recent30Days.days.at(-1).total,10);
 assert.equal(b.recent30Days.days.at(-2).status,"no-saved-record");
 assert.deepEqual(b.mathsDrafts,{topic5:{work:"y=3x+1"}});
 assert.equal(b.state.xp,7058);
 assert.equal(b.state.daily.length,10);
 assert.notEqual(b.exportedAt,"2000-01-01T00:00:00.000Z");
});
test("IndexedDB answers and older persisted dated log are recovered alongside live progress",async()=>{
 const state=live();
 const onDisk={today:day,xp:5500,
  daily:ids.map((id,i)=>({...task(id,i),progress:0,done:false})),
  dailyLog:{"2026-10-22":{date:"2026-10-22",tasks:ids.map((id,i)=>
  ({id,target:needed[i],progress:0,done:false,planDate:"2026-10-22"})),
    done:0,total:10,complete:false}},
  formalAttemptLog:[work("2026-10-20","latin-standard",0)]};
 const journal=[...evidence("2026-10-21"),...evidence("2026-10-22")];
 const original=JSON.stringify(state);
 const file=JSON.parse(await prepareLatest30DayExport(()=>state,()=>base(state),
  {readJournal:async()=>journal,storage:storage(onDisk)}));
 assert.equal(file.state.xp,7058);
 assert.equal(file.state.daily[8].progress,5);
 assert.equal(file.recent30Days.days.find(x=>x.date==="2026-10-21").done,10);
 assert.equal(file.recent30Days.days.find(x=>x.date==="2026-10-22").done,10);
 assert.equal(file.state.dailyLog["2026-10-22"].complete,true);
 assert.ok(file.state.formalAttemptLog.length>=journal.length);
 assert.equal(JSON.stringify(state),original,"Preparing a backup must never mutate iPad progress");
});
test("Missing Daily Log with marked attempts remains unverified, not falsely completed",async()=>{
 const state=live(),journal=[work("2026-10-19","latin-standard",0)];
 const file=JSON.parse(await prepareLatest30DayExport(()=>state,()=>base(state),
  {readJournal:async()=>journal,storage:null}));
 const row=file.recent30Days.days.find(x=>x.date==="2026-10-19");
 assert.equal(row.done,null);
 assert.equal(row.total,null);
 assert.equal(row.markedAttempts,1);
 assert.equal(row.status,"answers-without-task-record");
 assert.equal(file.state.dailyLog["2026-10-19"],undefined);
});
test("Today's downloaded record always uses most recent ten-task UI state",async()=>{
 const state=live(),stale={...live(),xp:4000,daily:ids.map((id,i)=>
  ({...task(id,i),progress:0,done:false}))};
 stale.dailyLog={...stale.dailyLog,[day]:{date:day,tasks:[
  {id:"old-six",target:5,progress:5,done:true}],done:1,total:1,complete:true}};
 const file=JSON.parse(await prepareLatest30DayExport(()=>state,()=>base(state),
  {readJournal:async()=>[],storage:storage(stale)}));
 assert.equal(file.state.dailyLog[day].tasks.length,10);
 assert.equal(file.state.dailyLog[day].done,8);
 assert.equal(file.recent30Days.days.at(-1).done,8);
 assert.equal(file.state.daily.every((item,i)=>item.id===ids[i]),true);
});
test("Changes while collecting iPad data cause recapture, never stale download",async()=>{
 const first=live(),second={...live(),xp:7999,
  daily:live().daily.map(t=>t.id==="due-review"?
    {...t,progress:10,done:true}:t)};
 let count=0;
 const getState=()=>++count===1?first:second;
 const exported=JSON.parse(await prepareLatest30DayExport(getState,()=>base(second),
  {readJournal:async()=>[],storage:null}));
 assert.equal(exported.state.xp,7999);
 assert.equal(exported.recent30Days.days.at(-1).done,9);
});
test("Old six-task export fails clearly rather than producing partial 30-day file",async()=>{
 const state={...live(),daily:live().daily.slice(0,6)};
 await assert.rejects(prepareLatest30DayExport(()=>state,()=>base(state),
  {readJournal:async()=>[],storage:null}),/ten Daily Tasks/);
});
test("Source hooks for Scholar and Settings both call canonical verified exporter",()=>{
 const scholar=readFileSync("assets/scholar-iJ2ilQWG.js","utf8");
 const settings=readFileSync("assets/daily-progress-save.js","utf8");
 assert.match(scholar,/await prepareLatest30DayExport/);
 assert.match(scholar,/s\.getState\(\)\.exportProgress\(\)/);
 assert.match(settings,/const data=await prepareLatest30DayExport/);
 assert.match(settings,/const dataText=await prepareLatest30DayExport/);
 assert.match(scholar,/stamp\.toISOString\(\)\.slice\(11,19\)/);
});
