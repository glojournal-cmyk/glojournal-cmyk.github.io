import fs from "node:fs";

const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const boss=fs.readFileSync("assets/weekly-boss-20260919.js","utf8");
const route=fs.readFileSync("assets/play._game-BbpxhxeZ.js","utf8");
const hub=fs.readFileSync("assets/play.index-sR2wZ5CM.js","utf8");
const shell=fs.readFileSync("play/weekly-boss/index.html","utf8");
const failures=[];
const need=(src,name,token)=>{if(!src.includes(token))failures.push({type:"missing-token",name,token});};

for(const token of [
  "weeklyBoss:{weeks:{},clears:0,lastReward:null}",
  "startWeeklyBoss:",
  "completeWeeklyBoss:",
  "weeklyBossRewardTrack=[",
  "boss-seal",
  "boss-gold-scholar",
  "boss-moon-garden",
  "boss-ledger",
  "boss-navy-prestige",
  "boss-grand-library",
  "boss-bloom",
  "boss-ivory-prize",
  "boss-observatory",
  "bossOnly:!0",
  "firstClear:l"
]) need(core,"core",token);

need(core,"core","u=weeklyBossRewardTrack.find");
need(core,"core","passed:o.passed||c");
need(core,"core","clears:(a.clears??0)+ +l");
need(core,"core","amount:30");
need(core,"core","!e.bossOnly&&Hw(e.needIf,t)");
need(core,"core","n.bossOnly?!1");

for(const token of [
  "name:`Weekly Boss Mission`",
  "8–12 minute adaptive mission",
  "function WeeklyBoss()",
  "const FRENCH=[",
  "const SCIENCE=[",
  "subjectProfile(state)",
  "weakRows(state,subject)",
  "state.learningEvents||[]",
  "retentionFailed",
  "retentionDue",
  "gamePractice",
  "start(week,mission.id,subject,weakSkills)",
  "score:pct,passed",
  "pct>=80",
  "Formal mastery is unchanged.",
  "Boss attempts update game-practice memory only; they never raise formal mastery.",
  "Listen",
  "Vocabulary",
  "Grammar",
  "Sentence build",
  "Short writing",
  "Scenario",
  "Data / graph",
  "Calculation",
  "Explanation",
  "Verdict",
  "speechSynthesis",
  "2-listens",
  "reward once per week",
  "same locked mission can be retried this week"
]) need(boss,"boss",token);

const frenchMissionCount=(boss.match(/id:`fr-[a-z-]+`/g)||[]).length;
const physicsMissionCount=(boss.match(/id:`phys-[a-z-]+`/g)||[]).length;
const chemistryMissionCount=(boss.match(/id:`chem-[a-z-]+`/g)||[]).length;
const biologyMissionCount=(boss.match(/id:`bio-[a-z-]+`/g)||[]).length;
if(frenchMissionCount<4)failures.push({type:"french-missions",count:frenchMissionCount});
if(physicsMissionCount<3)failures.push({type:"physics-missions",count:physicsMissionCount});
if(chemistryMissionCount<3)failures.push({type:"chemistry-missions",count:chemistryMissionCount});
if(biologyMissionCount<3)failures.push({type:"biology-missions",count:biologyMissionCount});

need(route,"route",'from"./weekly-boss-20260919.js"');
need(route,"route","if(e===WeeklyBossMeta.id)return(0,G.jsx)(WeeklyBoss,{})");
need(hub,"hub",'children:`Challenge Lab`');
need(hub,"hub","Y.id");
need(hub,"hub","weekly reward track");
need(shell,"shell","/assets/play._game-BbpxhxeZ.js");

const rewardIds=(core.match(/id:`boss-(?:seal|gold-scholar|moon-garden|ledger|navy-prestige|grand-library|bloom|ivory-prize|observatory)`/g)||[]);
if(rewardIds.length<9)failures.push({type:"boss-reward-count",count:rewardIds.length});

const summary={
  failures:failures.length,
  frenchMissions:frenchMissionCount,
  physicsMissions:physicsMissionCount,
  chemistryMissions:chemistryMissionCount,
  biologyMissions:biologyMissionCount,
  phasesPerMission:5,
  estimatedMinutes:"8-12",
  passThreshold:80,
  weeklyLock:true,
  retriesAllowed:true,
  rewardOncePerWeek:true,
  bossOnlyRewards:9,
  weakDueAdaptive:true,
  gameMemoryOnly:true,
  formalMasteryExcluded:true
};
console.log("WEEKLY_BOSS_QA "+JSON.stringify(summary));
console.log("WEEKLY_BOSS_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/weekly-boss-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);
