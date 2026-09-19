import fs from "node:fs";
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const games=fs.readFileSync("assets/play._game-BbpxhxeZ.js","utf8");
const banks=fs.readFileSync("assets/banks-rpZI6Qpy.js","utf8");
const failures=[];
const need=(src,name,token)=>{if(!src.includes(token))failures.push({type:"missing-token",name,token});};

need(core,"core",'id:`case-locker`,name:`Case Detective`');
need(core,"core",'"case-locker":`latin`');
need(core,"core",'"case-locker":12');
need(core,"core",'`sentence-mosaic`,`case-locker`,`verbum-match`');

need(games,"games",'const caseDetectiveCases=[');
need(games,"games",'function CaseDetective({level:e})');
need(games,"games",'if(e===`case-locker`)return(0,G.jsx)(CaseDetective,{level:m})');
need(games,"games",'[`identify`,`evidence`,`role`,`repair`]');
need(games,"games",'[`identify`,`evidence`,`repair`,`role`]');
need(games,"games",'Repair check');
need(games,"games",'practice?.(`case-locker`,concept,ok,{repair:!0');
need(games,"games",'endless?endlessSize(game,cap,6,12)');
need(games,"games",'mission.boss?2:mission.tier>=5?2:3');
need(games,"games",'Rating changes the number of case files and distractor pressure.');
need(games,"games",'if(n===`case-locker`)return /case|dative|ablative');
need(games,"games",'if(n===`case-locker`)return /^latin:(case|cases|preposition');
need(games,"games",'"case-locker":[`Spot the case`');
need(games,"games",'Phase 1 · Identify');
need(games,"games",'Phase 4 · Repair');

for(const token of [
  'servus epistulam fratri dat',
  'mater filiae aquam dat',
  'ad hortum ambulat',
  'in villam currit',
  'in horto sedet',
  'cum amico ambulat',
  'ex urbe venit',
  'sine amico manet',
  'pro amico pugnat',
  'per viam ambulat'
]) need(games,"case-bank",token);

for(const caseName of ["nominative","accusative","dative","genitive","ablative","vocative"]){
  if(!games.includes(`caseName:\`${caseName}\``)) failures.push({type:"missing-case",caseName});
}
const itemCount=(games.match(/\{id:\`cd\d+\`/g)||[]).length;
if(itemCount<20) failures.push({type:"case-bank-too-small",itemCount});

need(banks,"banks",'e===`manuscript`||e===`case-locker`');

const summary={
 failures:failures.length,
 caseFiles:itemCount,
 cases:6,
 mechanics:["identify","role","evidence","repair"],
 trainingLevels:12,
 endless:true,
 adaptiveWeakDue:true,
 delayedRepair:true,
 recurringBoss:true,
 formalMasteryExcluded:true
};
console.log("CASE_DETECTIVE_QA "+JSON.stringify(summary));
console.log("CASE_DETECTIVE_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/case-detective-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);
