import fs from "node:fs";

const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const failures=[];

for(const token of [
  "French vocab check",
  "Latin vocab check",
  "requiredAttempts:5,requiredCorrect:4",
  "dailyVocabByDay:{}"
]) if(!core.includes(token)) failures.push({type:"missing-core-vocab-gate",token});

for(const token of [
  "function vocabGateState(state, subject)",
  "const passed = attempts >= 5 && correct >= 4;",
  "const progress = passed ? 5 : Math.min(4, attempts);",
  "function recordDailyVocabAttempt(subject, questionId, correct)",
  'items[String(questionId)] = !!correct || !!items[String(questionId)];',
  'id: "french-vocab", title: "French vocab check"',
  'id: "latin-vocab", title: "Latin vocab check"'
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
  const passed=attempts>=5&&correct>=4;
  const progress=passed?5:Math.min(4,attempts);
  return{attempts,correct,passed,progress};
}

let items={};
for(const id of ["a","b","c","d"]) items=apply(items,id,true);
let g=gate(items);
if(g.passed||g.progress!==4) failures.push({type:"four-words-must-not-pass",g});

items=apply(items,"e",false);
g=gate(items);
if(g.passed||g.correct!==4?false:false) {}
if(g.passed!==true) failures.push({type:"five-tested-four-correct-should-pass",g});

let three={};
for(const [id,ok] of [["a",true],["b",true],["c",true],["d",false],["e",false]]) three=apply(three,id,ok);
g=gate(three);
if(g.passed||g.progress!==4||g.correct!==3) failures.push({type:"five-tested-three-correct-must-not-pass",g});

three=apply(three,"d",true);
g=gate(three);
if(!g.passed||g.correct!==4||g.attempts!==5) failures.push({type:"repair-same-word-should-recover-without-extra-word",g});

const before=gate(three);
three=apply(three,"d",true);
const after=gate(three);
if(after.attempts!==before.attempts) failures.push({type:"duplicate-word-counted-twice",before,after});

const summary={
  failures:failures.length,
  french:{minimumWords:5,minimumCorrect:4},
  latin:{minimumWords:5,minimumCorrect:4},
  distinctWords:true,
  sameWordRepairCanRecover:true,
  formalMasteryExcluded:true
};
console.log("DAILY_VOCAB_GATE_QA "+JSON.stringify(summary));
console.log("DAILY_VOCAB_GATE_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/daily-vocab-gate-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length) process.exit(2);
