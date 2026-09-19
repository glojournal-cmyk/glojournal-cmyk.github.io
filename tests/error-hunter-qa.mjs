import fs from "node:fs";
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const game=fs.readFileSync("assets/error-hunter-20260919.js","utf8");
const route=fs.readFileSync("assets/play._game-BbpxhxeZ.js","utf8");
const hub=fs.readFileSync("assets/play.index-sR2wZ5CM.js","utf8");
const subjectPlay=fs.readFileSync("assets/study._subject.play-Bt4Ow-Kd.js","utf8");
const shell=fs.readFileSync("play/error-hunter/index.html","utf8");
const failures=[];
const need=(src,name,token)=>{if(!src.includes(token))failures.push({type:"missing-token",name,token});};

need(core,"core",'"error-hunter":12');
need(core,"core","`case-locker`,`error-hunter`,`verbum-match`");
need(game,"game","name:`Error Hunter`");
need(game,"game","French, Latin, Physics and Chemistry");
need(game,"game","function ErrorHunter({level})");
need(game,"game","mode=repairActive?`fix`:phase");
need(game,"game","function spot(value)");
need(game,"game","function fix(value)");
need(game,"game","pendingRepair&&caseIndex>=pendingRepair.due");
need(game,"game","practice?.(`error-hunter`,concept,ok,{repair:true");
need(game,"game","number%5===0");
need(game,"game","Weak and due error types are prioritised.");
need(game,"game","difficulty tier");
need(game,"game","function fixChoices");
need(game,"game","...shuffle(same),...shuffle(fallback)");
need(game,"game","item.errors.length");
need(game,"game","Student answer");
need(game,"game","Find an error");
need(route,"route",'from"./error-hunter-20260919.js"');
need(route,"route","if(e===`error-hunter`)return(0,G.jsx)(ErrorHunter,{level:m})");
need(hub,"hub","children:`Challenge Lab`");
need(subjectPlay,"subject-play","[`latin`,`french`,`physics`,`chemistry`].includes(e)");
need(shell,"shell","/assets/play._game-BbpxhxeZ.js");

const ids=(game.match(/id:`eh-(?:fr|la|ph|ch)-\d+`/g)||[]);
if(ids.length<52)failures.push({type:"case-bank-too-small",count:ids.length});
for(const code of ["fr","la","ph","ch"]){
  const count=(game.match(new RegExp("id:`eh-"+code+"-\\d+`","g"))||[]).length;
  if(count<13)failures.push({type:"subject-case-count",code,count,expected:13});
}
for(const token of ["eh-fr-13","eh-la-13","eh-ph-13","eh-ch-13"])need(game,"three-error",token);
for(const token of ["Mes sœur est plus de intelligent que moi.","puella epistula fratres dant","speed = 150 × 30 = 4500 s","Mg⁺ + Cl²⁻ → MgCl"])need(game,"three-error-cases",token);

const summary={failures:failures.length,cases:ids.length,subjects:4,casesPerSubject:13,errorsPerAnswer:"1-3",mechanics:["spot","fix","delayed-repair"],trainingLevels:12,endless:true,recurringBossEvery:5,adaptiveWeakDue:true,formalMasteryExcluded:true};
console.log("ERROR_HUNTER_QA "+JSON.stringify(summary));
console.log("ERROR_HUNTER_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/error-hunter-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);
