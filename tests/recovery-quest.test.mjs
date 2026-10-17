// Regression tests for the production Recovery handler; no live student data.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const js=readFileSync(new URL("../assets/index-BLVOhKhN.js",import.meta.url),"utf8");
const start=js.indexOf("function findRecoveryVocabSource(");
const end=js.indexOf("function patchedRecordSpelling(",start);
assert.ok(start>=0&&end>start,"Recovery handler must be present in deployed module");
const factory=new Function("store","todayKey","originalAward","normalizeState","originalBumpDaily",
 "window","URLSearchParams",js.slice(start,end)+";return recordDailyVocabAttempt");

function fixture({today="2026-10-11",recover="2026-10-10",days={"2026-10-10":{french:20,latin:9}}}={}){
 const state={today,daily:[{id:"french-vocab",target:30,progress:3},{id:"latin-vocab",target:30,progress:4}],
  dailyLog:{},recoveryVocabByDay:{},recoveryAwarded:{},dailyVocabByDay:{}};
 for(const [date,subjects] of Object.entries(days))
  state.dailyLog[date]={date,done:0,total:10,complete:false,
   tasks:Object.entries(subjects).map(([subject,progress])=>({id:subject+"-vocab",target:30,progress,done:progress>=30}))};
 let xp=0,bump=0;
 const store={getState:()=>state,setState:changes=>Object.assign(state,changes)};
 const search=recover===null?"?daily=1&locked=1&mode=y8vocab&task=french-vocab":"?recover="+recover;
 const env={location:{search}};
 const fn=factory(store,()=>state.today,(_,o)=>{xp+=o.amount||0},()=>{},()=>{bump++},env,URLSearchParams);
 return {state,answer:(subject,id,correct=true)=>fn(subject,id,correct),
  xp:()=>xp,bumped:()=>bump,selectRecovery:date=>env.location.search="?recover="+date};
}

test("20 of 30 requires 15 distinct correct answers",()=>{
 const f=fixture();for(let i=0;i<14;i++)f.answer("french","q"+i);
 assert.equal(f.xp(),0);f.answer("french","q14");f.answer("french","q14");
 assert.equal(f.xp(),15);assert.equal(f.state.dailyLog["2026-10-10"].tasks[0].recovered,true);
 assert.equal(f.state.daily[0].progress,3);assert.equal(f.bumped(),0);
});
test("empty missed Vocab needs 35 correct answers",()=>{
 const f=fixture({days:{"2026-10-10":{french:0}}});
 for(let i=0;i<34;i++)f.answer("french","q"+i);
 assert.equal(f.xp(),0);f.answer("french","q34");assert.equal(f.xp(),15);
});
test("incorrect response never counts, but a subsequent correct one does",()=>{
 const f=fixture({days:{"2026-10-10":{french:29}}});
 f.answer("french","q0",false);
 for(let i=1;i<=5;i++)f.answer("french","q"+i);
 assert.equal(f.xp(),0);
 f.answer("french","q0");assert.equal(f.xp(),15);
});
test("end of second recovery day remains eligible",()=>{
 const f=fixture({recover:"2026-10-09",days:{"2026-10-09":{latin:27}}});
 for(let i=0;i<8;i++)f.answer("latin","q"+i);
 assert.equal(f.xp(),15);
});
test("third day and future date cannot be recovered",()=>{
 for(const [recover,days] of [
  ["2026-10-08",{"2026-10-08":{french:20}}],
  ["2026-10-12",{"2026-10-12":{french:20}}]]){
  const f=fixture({recover,days});for(let i=0;i<35;i++)f.answer("french","q"+i);
  assert.equal(f.xp(),0);
 }
});
test("French and Latin recovery use independent ledgers and do not credit today",()=>{
 const f=fixture();
 for(let i=0;i<15;i++)f.answer("french","f"+i);
 for(let i=0;i<26;i++)f.answer("latin","l"+i);
 assert.equal(f.xp(),30);assert.equal(f.state.daily[0].progress,3);assert.equal(f.state.daily[1].progress,4);
});
test("replayed answers and restored state do not award recovery twice",()=>{
 const f=fixture();for(let i=0;i<15;i++)f.answer("french","q"+i);
 const snapshot=JSON.parse(JSON.stringify(f.state));
 Object.assign(f.state,snapshot);
 f.answer("french","extra");f.answer("french","q0");
 assert.equal(f.xp(),15);assert.equal(f.state.recoveryAwarded["2026-10-10:french"],true);
});
test("ordinary daily Vocab remains on today's ledger",()=>{
 const f=fixture({recover:null});f.answer("french","daily1");
 assert.equal(f.state.dailyVocabByDay["2026-10-11"].french.items.daily1,true);
 assert.equal(f.state.daily[0].progress,3);
});

test("10 Oct and 11 Oct French recovery credit independently without blocking each other",()=>{
 const f=fixture({today:"2026-10-12",recover:"2026-10-11",days:{"2026-10-10":{french:29},"2026-10-11":{french:29}}});
 for(let i=0;i<6;i++)f.answer("french","same"+i);
 assert.equal(f.state.dailyLog["2026-10-11"].tasks[0].done,true);
 assert.equal(f.state.dailyLog["2026-10-10"].tasks[0].done,false);
 f.selectRecovery("2026-10-10");for(let i=0;i<6;i++)f.answer("french","same"+i);
 assert.equal(f.state.dailyLog["2026-10-10"].tasks[0].done,true);assert.equal(f.xp(),30);assert.equal(f.state.daily[0].progress,3);
 f.selectRecovery("2026-10-11");f.answer("french","extra");assert.equal(f.xp(),30);
});


test("unopened days offer French and Latin, require 35 each and retain ten-task history",()=>{
 const f=fixture({days:{}}),today=JSON.stringify(f.state.daily);
 for(let i=0;i<34;i++)f.answer('french','f'+i);
 assert.equal(f.xp(),0);assert.equal(f.state.dailyLog['2026-10-10'],undefined);
 f.answer('french','f34');
 let row=f.state.dailyLog['2026-10-10'];
 assert.equal(row.total,10);assert.equal(row.done,1);assert.equal(row.complete,false);
 for(let i=0;i<35;i++)f.answer('latin','l'+i);
 row=f.state.dailyLog['2026-10-10'];
 assert.equal(row.done,2);assert.equal(row.total,10);assert.equal(row.complete,false);
 assert.equal(f.xp(),30);assert.equal(JSON.stringify(f.state.daily),today);
 f.answer('french','extra');assert.equal(f.xp(),30);
});
test("unopened second day is recoverable but expired and malformed dates are rejected",()=>{
 const f=fixture({recover:'2026-10-09',days:{}});
 for(let i=0;i<35;i++)f.answer('latin','q'+i);
 assert.equal(f.xp(),15);assert.equal(f.state.dailyLog['2026-10-09'].done,1);
 for(const date of ['2026-10-08','2026-10-12','2026-02-30','2026-10-11']) {
  const g=fixture({recover:date,days:{}});for(let i=0;i<35;i++)g.answer('french','q'+i);
  assert.equal(g.xp(),0);assert.deepEqual(g.state.dailyLog,{});
 }
});
