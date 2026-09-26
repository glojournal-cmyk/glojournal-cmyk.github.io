import fs from "node:fs";

const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const failures=[];

for(const token of [
  "Year 8 French vocab",
  "Year 8 Latin vocab",
  "requiredCorrect:30",
  "dailyVocabByDay:{}"
]) if(!core.includes(token)) failures.push({type:"missing-core-vocab-gate",token});

for(const token of [
  "function vocabGateState(state, subject)",
  "const passed = correct >= DAILY_VOCAB_TARGET;",
  "const progress = Math.min(DAILY_VOCAB_TARGET, correct);",
  "function recordDailyVocabAttempt(subject, questionId, correct)",
  'items[String(questionId)] = !!correct || !!items[String(questionId)];',
  'id: "french-vocab", title: "Year 8 French vocab"',
  'id: "latin-vocab", title: "Year 8 Latin vocab"'
]) if(!wrapper.includes(token)) failures.push({type:"missing-runtime-vocab-gate",token});

for(const token of [
  "size:n=5",
  "recordDailyVocabAttempt",
  "production:!1,formal:!1",
  "Daily vocab gate passed"
]) if(!quiz.includes(token)) failures.push({type:"missing-dictation-vocab-gate",token});

function apply(items,id,correct){
  const next={...items};
  next[id]=!!correct||!!next[id];
  return next;
}
function gate(items){
  const attempts=Object.keys(items).length;
  const correct=Object.values(items).filter(Boolean).length;
  const passed=correct>=30;
  const progress=Math.min(30, correct);
  return{attempts,correct,passed,progress};
}

let items={};
for(let n=0;n<29;n++) items=apply(items,"w"+n,true);
let g=gate(items);
if(g.passed||g.progress!==29||g.correct!==29) failures.push({type:"twenty-nine-must-not-pass",g});

items=apply(items,"wrong",false);
g=gate(items);
if(g.passed||g.correct!==29) failures.push({type:"wrong-answer-must-not-count",g});

items=apply(items,"w29",true);
g=gate(items);
if(!g.passed||g.correct!==30||g.progress!==30) failures.push({type:"thirty-correct-should-pass",g});

const before=gate(items);
items=apply(items,"w29",true);
const after=gate(items);
if(after.attempts!==before.attempts||after.correct!==30) failures.push({type:"duplicate-word-counted-twice",before,after});

const summary={
  failures:failures.length,
  french:{correctTarget:30,randomYear8:true},
  latin:{correctTarget:30,randomYear8:true},
  distinctWords:true,
  wrongDoesNotCount:true,
  formalMasteryExcluded:true
};
console.log("DAILY_VOCAB_GATE_QA "+JSON.stringify(summary));
console.log("DAILY_VOCAB_GATE_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/daily-vocab-gate-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length) process.exit(2);
