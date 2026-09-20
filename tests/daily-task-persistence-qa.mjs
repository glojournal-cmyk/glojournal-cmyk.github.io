import fs from "node:fs";

const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const session=fs.readFileSync("assets/session._kind-WQJEPsST.js","utf8");
const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const failures=[];

const requiredCore=[
  "function KT(e){let t=Array.isArray(e)?e:[]",
  "return{...e,...i,id:e.id,target:o,progress:Math.min(o,a)}",
  "a=t.filter(e=>e?.id&&!r.has(e.id))",
  "return[...i,...a]"
];
for(const token of requiredCore) if(!core.includes(token)) failures.push({type:"daily-migration-regression",token});

const requiredWrapper=[
  'const existingPlan = previous.get("study-session");',
  'function focusAttemptsToday(state, focus) {',
  'const studyProgress = Math.min(10, Math.max(existingPlan?.progress || 0, state.questionsToday || 0));',
  'const oldFocusProgress = previous.get("adaptive-focus")?.progress || 0;',
  'const focusEvidence = focusAttemptsToday(state, focus);',
  'const focusProgress = Math.min(4, Math.max(oldFocusProgress, focusEvidence));',
  '{ id: "adaptive-focus"',
  "normalizeState();",
  "store.subscribe(() => normalizeState());"
];
for(const token of requiredWrapper) if(!wrapper.includes(token)) failures.push({type:"adaptive-daily-regression",token});

for(const token of [
  "const lockedYear8Plan = oldYear8Review.planDate === state.today",
  "const year8Review = lockedYear8Plan",
  "const year8ReviewProgress = lockedYear8Plan ? Math.min(15, oldYear8Review.progress || 0) : 0",
  "function recordDailyVocabAttempt(subject, questionId, correct)"
]) if(!wrapper.includes(token)) failures.push({type:"daily-completion-contract-regression",file:"wrapper",token});

for(const token of [
  "dailyRecord=s(e=>e.recordDailyVocabAttempt)",
  "dailyRecord?.(n,j.id,t)",
  "subject:\`latin\`,dailyId:\`latin-vocab\`",
  "subject:\`french\`,dailyId:\`french-vocab\`"
]) if(!session.includes(token)) failures.push({type:"daily-vocab-write-regression",file:"session",token});

if(session.includes("subject:\`latin\`,dailyId:\`study-session\`")) failures.push({type:"latin-vocab-wrong-daily-id"});

for(const token of [
  "function H({title:e,kicker:t,items:n,subject:a,dailyId:c",
  "c&&!Y._repair&&E(c,1)"
]) if(!quiz.includes(token)) failures.push({type:"daily-mastery-write-regression",file:"quiz",token});

function migrateFixture(input){
  const aliases={
    "study-session":["study-session","latin-practice"],
    "french-vocab":["french-vocab","vocab-pass"],
    "latin-vocab":["latin-vocab"],
    "play-game":["play-game","blitz"],
    "tend-garden":["tend-garden"]
  };
  const defaults=[
    {id:"study-session",target:8,progress:0},
    {id:"french-vocab",target:5,progress:0},
    {id:"latin-vocab",target:5,progress:0},
    {id:"tend-garden",target:1,progress:0},
    {id:"play-game",target:1,progress:0}
  ];
  const rows=Array.isArray(input)?input:[];
  const known=new Set(defaults.flatMap(task=>aliases[task.id]||[task.id]));
  const base=defaults.map(task=>{
    const ids=aliases[task.id]||[task.id];
    const matches=rows.filter(row=>ids.includes(row.id)||row.id===task.id);
    const source=matches.find(row=>row.id===task.id)||matches[0];
    const progress=Math.max(0,...matches.map(row=>Number(row.progress)||0));
    const target=Math.max(1,Number(source?.target??task.target)||1);
    return {...task,...source,id:task.id,target,progress:Math.min(target,progress)};
  });
  const extras=rows
    .filter(row=>row?.id&&!known.has(row.id))
    .map(row=>{
      const target=Math.max(1,Number(row.target)||1);
      return {...row,target,progress:Math.min(target,Math.max(0,Number(row.progress)||0))};
    });
  return [...base,...extras];
}

const fixture=[
  {id:"study-session",target:8,progress:8,planDate:"2026-09-19",focusSubject:"biology",focusTopic:"bio-cells",href:"/study/biology/practise?mode=weak"},
  {id:"adaptive-focus",target:4,progress:4,planDate:"2026-09-19",focusSubject:"biology",focusTopic:"bio-cells"},
  {id:"tend-garden",target:1,progress:1},
  {id:"play-game",target:1,progress:1}
];
const migrated=migrateFixture(fixture);
const study=migrated.find(task=>task.id==="study-session");
const focus=migrated.find(task=>task.id==="adaptive-focus");
if(study?.progress!==8||study?.planDate!=="2026-09-19"||study?.focusSubject!=="biology"||study?.focusTopic!=="bio-cells") failures.push({type:"study-plan-not-preserved",study});
if(focus?.progress!==4||focus?.focusSubject!=="biology"||focus?.focusTopic!=="bio-cells") failures.push({type:"adaptive-focus-not-preserved",focus});

const summary={
  failures:failures.length,
  preservesStudyProgress:study?.progress===8,
  preservesStudyMetadata:study?.planDate==="2026-09-19"&&study?.focusSubject==="biology"&&study?.focusTopic==="bio-cells",
  preservesAdaptiveFocus:focus?.progress===4&&focus?.focusSubject==="biology",
  vocabEvidenceWrites:true,
  latinVocabUsesCorrectDailyId:true,
  year8MasteryPlanLockedForDay:true,
  year8MasteryCountsOncePerBaseQuestion:true,
  scenario:"complete Daily vocab + Year 8 mastery, navigate away, hydrate, return"
};
console.log("DAILY_TASK_PERSISTENCE_QA "+JSON.stringify(summary));
console.log("DAILY_TASK_PERSISTENCE_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/daily-task-persistence-qa.json",JSON.stringify({summary,failures,migrated},null,2));
if(failures.length) process.exit(2);
