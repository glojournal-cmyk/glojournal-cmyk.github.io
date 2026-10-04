import {mistakeReviewTask} from "../assets/mistake-review-plan-20261003.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import {selectDailyVocabulary} from "../assets/daily-vocab-20261003.js";

const wrapper = fs.readFileSync("assets/index-BLVOhKhN.js", "utf8");
const practice = fs.readFileSync("assets/study._subject.practise-y8fix-20260920.js", "utf8");
function source(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0);
  const end = text.indexOf("\n}", start);
  assert.ok(end > start);
  return text.slice(start, end + 2);
}
const day = "2026-09-30";
const topic = "la-y8-stage-1-vocabulary";
const pick = {subject:"latin",topicId:topic,topicLabel:"Stage 1",label:"Latin"};
const mocks = {
  mistakeReviewTask,
  assignedCurriculumPick:()=>pick,curriculumFocusAllowed:()=>true,curriculumFrontier:()=>pick,readCurriculumLearning:()=>({}),getTopicCatalog:()=>[],
  DAILY_SUBJECTS:["latin","french"], YEAR8_MASTERY_SUBJECTS:["latin","french"],
  SUBJECT_LABELS:{latin:"Latin",french:"French"}, FRENCH_DAILY_HREF:"/session/french-vocab",
  topicMatchesYear:()=>true, adaptiveFocus:()=>({subject:"latin",topicId:topic}),
  topicTitle:()=> "Stage 1", focusAttemptsToday:()=>0,
  year8ReviewPlan:()=>({...pick,ready:true,href:"/study/latin/practise?mode=year8long"}),
  completedYear8ReviewEvidence:()=>null, vocabGateState:()=>({correct:0,progress:0,attempts:0}),
  topicAttemptsToday:()=>0, year8AssignedPool:()=>[pick], todayKey:()=>day,
  pickYear8Assigned:()=>pick, firstUnmastered:()=>pick, year8TopicRank:()=>0,
  year8AssignedTitle:()=>"Stage 1", year8AssignedHref:()=>"/study/latin/practise",
  focusHref:()=>"/study/latin/practise", localDayFromIso:s=>s.slice(0,10),
};
const builder = new Function(...Object.keys(mocks),
  source(wrapper,"buildAdaptiveDaily")+";return buildAdaptiveDaily;")(...Object.values(mocks));
const state = {
  today:day,year:8,questionsToday:0,topicStats:{[topic]:{attempted:30}},
  dailyTopicAttemptsByDay:{[day]:{[topic]:35}},
  daily:[
    {id:"study-session",planDate:day,focusSubject:"latin",focusTopic:topic,progress:10},
    {id:"adaptive-focus",planDate:day,progress:4},
    {id:"y8-mastery",planDate:day,assignedSubject:"latin",assignedTopic:topic,
      href:"/study/latin/practise",progress:25,masteryStartAttempts:10},
    {id:"year8-long-review",planDate:day,reviewSubject:"latin",reviewTopic:topic,
      href:"/study/latin/practise?mode=year8long",progress:25,reviewStartAttempts:10},
  ],
};
for (const restored of [state,JSON.parse(JSON.stringify(state))]) {
  const tasks=builder(restored);
  for(const [id,value] of [["study-session",10],["adaptive-focus",4],["y8-mastery",25],["year8-long-review",25]])
    assert.equal(tasks.find(t=>t.id===id)?.progress,value,id+" must retain completion");
  assert.ok(tasks.find(t=>t.id==="year8-long-review").href.includes("task=year8-long-review"));
}
const start=practice.indexOf("function buildDaily30("),end=practice.indexOf("function qp(",start);
assert.ok(start>=0&&end>start);
const mixMocks={selectDailyVocabulary,c:[],f:[],
  daily30Topics:(_subject,topics)=>topics,daily30Mature:()=>false,l:()=>day,
  daily30Confirm:()=>({}),GQS:()=>[],daily30Shuffle:rows=>rows,FD:rows=>rows,
};
const buildMix=new Function(...Object.keys(mixMocks),
  practice.slice(start,end)+";return buildDaily30;")(...Object.values(mixMocks));
for(const subject of ["latin","french"]) {
  const tid=subject==="latin"?topic:"fr-y8-s01-basics";
  const items=Array.from({length:45},(_,i)=>({
    id:subject+"-"+i,topicId:tid,conceptId:(subject==="latin"?"la":"fr")+"-y8-concept-vocab-"+i,format:"typed_exact",prompt:"Translate a word",formal:true,answer:{accepted:["word "+i]},
  }));
  const credited=Object.fromEntries(items.slice(0,10).map(q=>[q.id,true]));
  credited[items[10].id]=false;
  const ledger={[day]:{[subject]:{items:credited}}};
  const mixed=buildMix(subject,items,[{topicId:tid}],{},{},{},day,"",ledger);
  assert.equal(mixed.length,30,subject+" still receives a full refill");
  assert.ok(mixed.every(q=>!credited[q.id]),"Credited answers must not be asked again");
  assert.equal(buildMix(subject,[items[10]],[{topicId:tid}],{},{},{},day,"",ledger).length,0,"A missed answer waits for its spaced-review date");
  const retryDay=new Date(Date.parse(day+"T12:00:00Z")+2*86400000).toISOString().slice(0,10);
  assert.ok(buildMix(subject,[items[10]],[{topicId:tid}],{},{},{},retryDay,"",ledger).some(q=>q.id===items[10].id),"The mistake becomes eligible after two days");
  assert.equal(new Set(mixed.map(q=>q.id)).size,30);
}
assert.ok(practice.includes("dailyId:dailyLocked&&[`y8-practise`,`y8-mastery`,`year8-long-review`]"));

const incomplete={...state,daily:state.daily.map(t=>t.id==="year8-long-review"?{...t,reviewTopic:null,progress:0}:t)};
assert.equal(builder(incomplete).find(t=>t.id==="year8-long-review").reviewTopic,topic,"Plan created before catalogue loading must gain its topic");
const resolveAssignment=new Function(source(practice,"resolveDailyAssignment")+";return resolveDailyAssignment;")();
const params={get:key=>({daily:"1",locked:"1",year:"8",task:"y8-mastery"}[key]||null)};
const daily=[
 {id:"y8-mastery",assignedSubject:"french",assignedTopic:"fr-y8-s01-quick-rules"},
 {id:"year8-long-review",reviewSubject:"latin",reviewTopic:topic}
];
assert.equal(resolveAssignment("latin",params,daily).id,"year8-long-review","Legacy Latin link must credit the Latin review, not the French mastery");
assert.equal(resolveAssignment("french",params,daily).id,"y8-mastery","Correctly assigned mastery keeps its task");
console.log("DAILY_COUNTING_REGRESSION_QA passed: completion survives reload; French and Latin refill exclude credited answers.");
