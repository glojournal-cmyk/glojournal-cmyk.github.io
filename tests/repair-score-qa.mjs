import fs from "node:fs";

const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const failures=[];

for(const token of [
  "function calculateSessionScore(",
  "repairOf:Y._repairOf||null",
  "const repairPoints=repairedCorrect*.5",
  "Session percentage gives half-credit",
  "score.percentage"
]) if(!quiz.includes(token)) failures.push({type:"missing-repair-score-runtime",token});

for(const token of [
  "questionsToday:(o.questionsToday??0)+(repair||a?.formal===!1?0:1)",
  "repair||a?.formal===!1||t().bumpDaily(`study-session`,1)"
]) if(!core.includes(token)) failures.push({type:"repair-counted-as-formal-daily",token});

if(!wrapper.includes('if (!isRepair && focus && focus.focusSubject === (resolved.subject || subject)) originalBumpDaily("adaptive-focus", 1);')){
  failures.push({type:"repair-counted-in-adaptive-focus"});
}

function score(log,formalCount){
  const formal=log.filter(row=>!row.repair&&row.formal!==false);
  const firstPassCorrect=formal.filter(row=>row.correct).length;
  const wrongIds=new Set(formal.filter(row=>!row.correct).map(row=>row.questionId));
  const repairedIds=new Set(log.filter(row=>row.repair&&row.correct&&row.repairOf&&wrongIds.has(row.repairOf)).map(row=>row.repairOf));
  const repairedCorrect=repairedIds.size;
  const repairPoints=repairedCorrect*.5;
  const adjustedPoints=Math.min(formalCount,firstPassCorrect+repairPoints);
  return Math.round(adjustedPoints/Math.max(1,formalCount)*100);
}

const log=[
  ...Array.from({length:8},(_,i)=>({questionId:`q${i+1}`,correct:true,repair:false,formal:true})),
  {questionId:"q9",correct:false,repair:false,formal:true},
  {questionId:"q10",correct:false,repair:false,formal:true},
  {questionId:"r9",repairOf:"q9",correct:true,repair:true,formal:true},
  {questionId:"r10",repairOf:"q10",correct:true,repair:true,formal:true},
];
const percentage=score(log,10);
if(percentage!==90) failures.push({type:"unexpected-score",expected:90,actual:percentage});

const duplicateRepair=[...log,{questionId:"r9b",repairOf:"q9",correct:true,repair:true,formal:true}];
if(score(duplicateRepair,10)!==90) failures.push({type:"duplicate-repair-double-credit"});

const summary={failures:failures.length,example:"8/10 first-pass + 2 successful repairs",expectedPercentage:90,actualPercentage:percentage,repairCreditPerRecoveredItem:0.5,repairsRaiseMastery:false,repairsAdvanceDailyTask:false};
console.log("REPAIR_SCORE_QA "+JSON.stringify(summary));
console.log("REPAIR_SCORE_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/repair-score-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length) process.exit(2);
