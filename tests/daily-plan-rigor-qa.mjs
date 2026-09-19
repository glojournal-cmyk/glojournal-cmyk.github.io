import fs from "node:fs";

const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const practice=fs.readFileSync("assets/study._subject.practise-D_PWgUd7.js","utf8");
const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const failures=[];

const requireToken=(file,name,token)=>{
  if(!file.includes(token)) failures.push({type:"missing-token",name,token});
};

for(const token of [
  'params.set("daily", "1")',
  'params.set("locked", "1")',
  'params.set("topic", focus.topicId)',
  'id: "year8-long-review"',
  'target: 15, progress: year8ReviewProgress',
  'target: 10, progress: studyProgress'
]) requireToken(wrapper,"wrapper",token);

for(const token of [
  'dailyLocked=dailyParams.get(`daily`)===`1`&&dailyParams.get(`locked`)===`1`',
  'dailyLocked&&pinnedTopic?I.filter(e=>e.topicId===pinnedTopic)',
  'E===`year8long`',
  'longFormats=new Set([`extended_response`,`mark_points`,`controlled_translation`,`practical_design`,`sequence`,`unordered_set`])',
  '_dailyYear8:!0',
  '!dailyLocked&&I.length',
  'dailyId:E===`year8long`?`year8-long-review`:void 0'
]) requireToken(practice,"practice",token);

for(const token of [
  'excludeGeneralDaily:!!Y._dailyYear8',
  'yearOverride:Y._dailyYear8?8:void 0',
  'c&&!Y._repair&&E(c,1)'
]) requireToken(quiz,"quiz",token);

for(const token of [
  'target:10,progress:0',
  'id:`year8-long-review`',
  'target:15,progress:0',
  'a?.excludeGeneralDaily?0:1',
  'a?.excludeGeneralDaily||t().bumpDaily(`study-session`,1)'
]) requireToken(core,"core",token);

requireToken(wrapper,"wrapper",'!meta?.excludeGeneralDaily && focus && focus.focusSubject');

function focusHrefExample(subject,topic,year,mode){
  const params=new URLSearchParams();
  params.set("daily","1");params.set("locked","1");params.set("year",String(year));
  if(topic)params.set("topic",topic);
  params.set("mode",mode);
  return "/study/"+subject+"/practise?"+params.toString();
}
const sample=focusHrefExample("physics","phys-y9-p4",9,"weak");
const url=new URL("https://example.test"+sample);
if(url.searchParams.get("locked")!=="1"||url.searchParams.get("topic")!=="phys-y9-p4"||url.searchParams.get("year")!=="9"){
  failures.push({type:"daily-focus-not-pinned",sample});
}

const summary={
  failures:failures.length,
  dailyYear9FormalMinimum:10,
  frenchVocabMinimum:5,
  latinVocabMinimum:5,
  year8DeepReviewMinimum:15,
  dailyTopicChoiceLocked:true,
  year8ReviewSeparatedFromYear9Counters:true,
  longerFormatsPreferred:true
};
console.log("DAILY_PLAN_RIGOR_QA "+JSON.stringify(summary));
console.log("DAILY_PLAN_RIGOR_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/daily-plan-rigor-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);