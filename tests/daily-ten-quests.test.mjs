import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../assets/index-BLVOhKhN.js", import.meta.url), "utf8");
function extract(start, end) {
  const begin=code.indexOf(start), finish=code.indexOf(end,begin);
  assert.ok(begin>=0&&finish>begin, "Expected active daily logic: "+start);
  return code.slice(begin,finish);
}
let day="2026-10-11";
const gate=new Function("todayKey",extract("const DAILY_VOCAB_TARGET = 30;","const YEAR8_ASSIGNED_SUBJECTS")+"\nreturn vocabGateState;")(()=>day);
const env={
 todayKey:()=>day, DAILY_SUBJECTS:["latin","french","biology","chemistry","physics"],
 YEAR8_MASTERY_SUBJECTS:["latin","french"],
 SUBJECT_LABELS:{latin:"Latin",french:"French",biology:"Biology",chemistry:"Chemistry",physics:"Physics"},
 FRENCH_DAILY_HREF:"/study/french", curriculumFocusAllowed:()=>true,topicMatchesYear:()=>true,
 adaptiveFocus:()=>({subject:"latin",topicId:"la-y8-basics",reason:"foundation"}),
 curriculumFrontier:()=>({subject:"latin",year:8,topicId:"la-y8-basics"}),
 getTopicCatalog:(subject)=>[{topicId:(subject==="latin"?"la":"fr")+"-y8-basics",title:"Basics",status:"enabled",enabled:25}],
 readCurriculumLearning:()=>({}), topicTitle:(_,id)=>id,focusHref:()=>"/study/latin/practise",
 topicAttemptsToday:(state,id)=>Number(state._topicAttempt?.[id]||0),
 focusAttemptsToday:state=>Number(state._focus||0),
 year8ReviewPlan:()=>({subject:"latin",topicId:"la-y8-basics",label:"Latin",topicLabel:"Basics",href:"/study/latin/practise?mode=standard"}),
 completedYear8ReviewEvidence:state=>state._finishedYear8?{subject:"latin",topicId:"la-y8-basics",label:"Latin",topicLabel:"Basics",href:"/study/latin/practise?mode=standard",ready:true}:null,
 vocabGateState:(state,subject)=>gate(state,subject),
 firstUnmastered:(pool,_,subject)=>pool.find(x=>x.subject===subject),
 year8AssignedPool:()=>[{subject:"latin",topicId:"la-y8-basics"},{subject:"french",topicId:"fr-y8-basics"}],
 year8TopicRank:()=>1,assignedCurriculumPick:(_state,seed)=>({subject:seed%2?"latin":"french",topicId:seed%2?"la-y8-basics":"fr-y8-basics",year:8,topicLabel:"Basics",position:1,total:10}),
 year8AssignedTitle:(mode)=>"Year 8 "+mode,year8AssignedHref:(pick,mode,task)=>"/study/"+pick.subject+"/practise?mode="+mode+"&task="+(task||"y8-practise"),
 normalizeTopicStat:row=>({attempted:row?.attempted||0,state:row?.state||"learning"}),
 mistakeReviewTask:()=>({id:"mistake-review",title:"Previous mistakes",target:1,progress:1,xp:0}),
 mistakeTopicAvailable:()=>true,localDayFromIso:()=>day,errorLabel:()=>"",
};
const build=new Function("env","with(env){"+extract("function buildAdaptiveDaily(","let normalizing")+"; return buildAdaptiveDaily;}")(env);
const byId=(items,id)=>items.find(t=>t.id===id);
const make=(options={})=>({today:day,year:8,daily:[],topicStats:{},skillStats:{},...options});
test("Daily plan contains exactly ten unique task IDs and stable targets",()=>{
 const items=build(make()), ids=items.map(t=>t.id);
 assert.equal(items.length,10);
 assert.equal(new Set(ids).size,10);
 assert.deepEqual(ids,["mistake-review","study-session","french-vocab","latin-vocab","adaptive-focus","year8-long-review","y8-practise","y8-mastery","tend-garden","play-game"]);
 assert.deepEqual(items.map(t=>t.target),[1,10,30,30,4,25,10,25,1,1]);
 assert.ok(items.every(t=>Number.isFinite(t.progress)&&t.progress>=0&&t.progress<=t.target));
});
test("French and Latin daily Vocab credit separately after thirty unique correct answers",()=>{
 const correct=Object.fromEntries(Array.from({length:30},(_,i)=>["f-"+i,true]));
 const data=make({dailyVocabByDay:{[day]:{french:{items:correct},latin:{items:{"latin-1":true}}}}});
 const result=build(data);
 assert.equal(byId(result,"french-vocab").progress,30);
 assert.equal(byId(result,"latin-vocab").progress,1);
});
test("Wrong answers and corrections do not falsely pass a Vocab task",()=>{
 const correct=Object.fromEntries(Array.from({length:29},(_,i)=>["f-"+i,true]));
 const data=make({dailyVocabByDay:{[day]:{french:{items:{...correct,"wrong-1":false}}}}});
 assert.equal(byId(build(data),"french-vocab").progress,29);
});
test("Study, focus, long review, practice and mastery clamp to assigned targets",()=>{
 const data=make({
  questionsToday:12,_focus:6,_finishedYear8:true,
  topicStats:{"la-y8-basics":{attempted:40},"fr-y8-basics":{attempted:40}},
  _topicAttempt:{"la-y8-basics":50,"fr-y8-basics":50}
 });
 const result=build(data);
 for(const id of ["study-session","adaptive-focus","year8-long-review","y8-practise","y8-mastery"])
  assert.equal(byId(result,id).progress,byId(result,id).target,id);
});
test("Garden and Play complete once on evidence and reset on a new day",()=>{
 const first=build(make({wateredOn:day,dailyGamePlayedByDay:{[day]:true}}));
 assert.equal(byId(first,"tend-garden").progress,1);
 assert.equal(byId(first,"play-game").progress,1);
 const yesterday=day;day="2026-10-12";
 try {
  const later=build(make({wateredOn:yesterday,dailyGamePlayedByDay:{[yesterday]:true}}));
  assert.equal(byId(later,"tend-garden").progress,0);
  assert.equal(byId(later,"play-game").progress,0);
 } finally {day=yesterday}
});
test("A previous day's completed tasks do not silently complete today's missions",()=>{
 const past=make({daily:[
  {id:"study-session",progress:10,target:10,planDate:"2026-10-10",focusSubject:"latin",focusTopic:"la-y8-basics"},
  {id:"tend-garden",progress:1,target:1,planDate:"2026-10-10"},
  {id:"play-game",progress:1,target:1,planDate:"2026-10-10"}
 ]});
 const now=build(past);
 assert.equal(byId(now,"study-session").progress,0);
 assert.equal(byId(now,"tend-garden").progress,0);
 assert.equal(byId(now,"play-game").progress,0);
});
const logs=new Function(extract("function compactDailyTasks(","function sealDailyLog(")+"return {compactDailyTasks,writeDailyLog};")();
test("Daily history persists ten items with correct done count",()=>{
 const tasks=build(make({wateredOn:day,dailyGamePlayedByDay:{[day]:true}}));
 const log=logs.writeDailyLog({},day,tasks);
 assert.equal(log[day].total,10);
 assert.equal(log[day].done,3); // mistake review clear, garden, game
 assert.equal(log[day].tasks.length,10);
 assert.ok(log[day].tasks.every(t=>typeof t.done==="boolean"));
});
