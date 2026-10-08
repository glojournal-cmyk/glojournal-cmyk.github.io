import assert from "node:assert/strict";
import fs from "node:fs";
import {buildAdaptiveRuntime} from "./adaptive-runtime-test-utils.mjs";
function extract(src,name) {
 const start=src.indexOf("function "+name+"("),end=src.indexOf("\n}",start);
 assert.ok(start>=0&&end>start,name);return src.slice(start,end+2);
}
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const guard=fs.readFileSync("assets/progression-guard-20260927.js","utf8");
const experience=fs.readFileSync("assets/study-experience-20260927.js","utf8");
const normalize=new Function("topicState",extract(wrapper,"normalizeTopicStat")+";return normalizeTopicStat;")(()=> "mastered");
const topic="la-y8-stage-1-vocabulary";
let day="2026-10-02";
const writerStart=wrapper.indexOf("  const current = normalizeTopicStat(before.topicStats?.[resolved.topicId]");
const writerEnd=wrapper.indexOf("  const reviews = { ...(after.reviews || {}) };",writerStart);
const write=new Function("before","after","resolved","meta","correct","questionId","production","normalizeTopicStat","topicState","diagnoseError","todayKey",
 wrapper.slice(writerStart,writerEnd)+";return nextTopic;");
let stat={};
for(const nextDay of ["2026-10-02","2026-10-03"]) {
 day=nextDay;
 for(let i=0;i<30;i++) stat=write({topicStats:{[topic]:stat}},{reviews:{}},{topicId:topic,subject:"latin"},{},true,nextDay+"-"+i,true,normalize,()=> "mastered",()=>null,()=>day);
}
assert.equal(stat.recentOutcomes.length,20);
assert.equal(new Set(stat.recentOutcomes.map(r=>r.date)).size,1,"Reproduce the rolling-window loss");
assert.deepEqual(stat.correctDays,["2026-10-02","2026-10-03"],"Success on both days must survive 30 answers per day");
const helpers=experience.slice(experience.indexOf("function summary("),experience.indexOf("function frontier("));
const mature=new Function(helpers+";return mature;")();
assert.equal(mature({topicStats:{[topic]:stat}},"latin",topic),true);
assert.equal(mature({topicStats:{[topic]:{...stat,correctDays:["2026-10-03"]}}},"latin",topic),false,"One-day streak must not unlock a topic");
assert.equal(mature({topicStats:{[topic]:{...stat,correct:30}}},"latin",topic),false,"Accuracy gate remains enforced");
assert.equal(new Function(extract(experience,"summary")+";return summary;")()(stat).days,2,"Recommendation agrees with Daily guard");
const repaired=write({topicStats:{[topic]:stat}},{reviews:{}},{topicId:topic,subject:"latin"},{repair:true},true,"repair",true,normalize,()=> "mastered",()=>null,()=>"2026-10-04");
assert.deepEqual(repaired.correctDays,stat.correctDays,"Repairs must not create spaced evidence");
const wrong=write({topicStats:{[topic]:stat}},{reviews:{}},{topicId:topic,subject:"latin"},{},false,"wrong",true,normalize,()=> "mastered",()=>null,()=>"2026-10-04");
assert.deepEqual(wrong.correctDays,stat.correctDays,"Wrong answers must not create successful days");
assert.deepEqual(normalize({recentOutcomes:[{date:"2026-10-01",correct:true},{date:"2026-10-02",correct:false}]}).correctDays,["2026-10-01"],"Migrate only evidenced successes");
const runtime=buildAdaptiveRuntime();
const bank=Array.from({length:80},(_,i)=>({id:"q-"+i,topicId:topic,conceptId:"concept-"+i,skills:["skill-"+i],format:"typed_exact",prompt:"Word "+i,answer:{accepted:["answer-"+i]},difficulty:2}));
const a=runtime.rankAdaptiveQuestions(bank,"latin",10).slice(0,10);
runtime.setState({seenTotal:{outside:1}});
const b=runtime.rankAdaptiveQuestions(bank,"latin",10).slice(0,10);
assert.notDeepEqual(a.map(q=>q.id),b.map(q=>q.id),"Equally suitable questions rotate between sessions");
assert.deepEqual(b.map(q=>q.id),runtime.rankAdaptiveQuestions(bank,"latin",10).slice(0,10).map(q=>q.id),"Same state reload stays stable");
runtime.setState({seenTotal:{"q-0":1},seenCorrect:{"q-0":1},reviews:{"q-0":{stage:1,due:"2026-09-21"}}});
assert.ok(!runtime.rankAdaptiveQuestions(bank,"latin",10).slice(0,10).some(q=>q.id==="q-0"),"Correct not-yet-due answer must not take a mistake slot");
runtime.setState({seenTotal:{"q-0":1},reviews:{"q-0":{wrong:true,stage:1,due:"2026-09-18"}}});
assert.ok(runtime.rankAdaptiveQuestions(bank,"latin",10).slice(0,10).some(q=>q.id==="q-0"),"Genuinely due review remains eligible");
console.log("DAILY_REPEAT_QA passed: two-day progression after 60 answers, strict evidence, repair exclusion, stable rotating sessions and due reviews.");
