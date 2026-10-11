import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const text=readFileSync(new URL("../assets/mistake-review-plan-20261003.js",import.meta.url),"utf8")
  .replace(/^import .*?;\s*$/gm,"").replace(/^export /gm,"");
const task=new Function("globalThis",text+";return mistakeReviewTask;")({
 LuxPracticeBridge:{readAssessment:()=>({}),dueReviews:()=>[]}
});
const day="2026-10-11";
const available=(subject,topic)=>["la-y8-stage3","chem-y9-atoms"].includes(topic);
const reviews={
 "fr-retired":{subject:"french",topicId:"fr-y8-retired",wrong:true,lastWrong:"2026-10-08"},
 "la-live":{subject:"latin",topicId:"la-y8-stage3",wrong:true,lastWrong:"2026-10-09"},
 "ch-live":{topicId:"chem-y9-atoms",wrong:true,lastWrong:"2026-10-10"}
};
const assessment={dailyReviewCredits:{}};
const state=(extra={})=>({today:day,reviews,daily:[],...extra});
test("French retired: switch to Latin mistake",()=>{
 const result=task(state(),assessment,available);
 assert.equal(result.reviewSubject,"latin");
 assert.deepEqual(result.reviewQuestionIds,["la-live"]);
});
test("If Latin is unavailable, recover a Chemistry mistake without a subject field",()=>{
 const result=task(state({reviewUnavailableByDay:{[day]:["la-live"]}}),assessment,available);
 assert.equal(result.reviewSubject,"chemistry");
 assert.deepEqual(result.reviewQuestionIds,["ch-live"]);
});
test("Retired same-day French assignment is replaced by another subject",()=>{
 const old={id:"mistake-review",planDate:day,reviewSubject:"french",reviewYear:8,
 reviewTopicIds:["fr-y8-retired"],reviewQuestionIds:["fr-retired"],progress:0,target:1};
 assert.equal(task(state({daily:[old]}),assessment,available).reviewSubject,"latin");
});
test("Earlier excused stale question must not hide other subjects",()=>{
 const old={id:"mistake-review",planDate:day,reviewUnavailable:true,
 reviewQuestionIds:[],progress:1,target:1,xp:0};
 assert.equal(task(state({daily:[old]}),assessment,available).reviewSubject,"latin");
});
test("No genuine due question is marked clear without XP",()=>{
 const result=task(state(),assessment,()=>false);
 assert.equal(result.progress,result.target);
 assert.equal(result.xp,0);
});
