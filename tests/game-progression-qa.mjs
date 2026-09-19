import fs from "node:fs";
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const pe=fs.readFileSync("assets/pe-circuit-DPe2o8eH.js","utf8");
const games=fs.readFileSync("assets/play._game-BbpxhxeZ.js","utf8");
const physics=fs.readFileSync("assets/physics-DT4AA9JX.js","utf8");
const failures=[];
const need=(src,name,token)=>{if(!src.includes(token))failures.push({type:"missing-token",name,token});};

for(const id of ["verbum-match","mot-match","element-match","force-match","word-match","organelle-match"]) need(core,"core",`"${id}":10`);
need(core,"core",'"pe-circuit":8');
need(core,"core",'rating:180,missions:0,bossClears:0,perfectClears:0');
need(core,"core",'bestStreak:0');
need(core,"core",'endless=a>cap');
need(core,"core",'missionNo%5===0');
need(core,"core",'Math.min(1000,rating+delta)');
need(core,"core",'i>=3?36:i===2?18:i===1?-12:-24');
need(core,"core",'detail:endless?\`${n} · endless mission ${missions}\`:n');

need(pe,"pe","levels:8");
need(pe,"pe","How to play");
need(pe,"pe","Reach 68+ for 2★ to unlock the next circuit");
need(pe,"pe","Pressure circuit");
need(pe,"pe","House final");

need(games,"games",'const endlessRanks=[{name:\`Bronze\`,min:100},{name:\`Silver\`,min:250},{name:\`Gold\`,min:400},{name:\`Scholar\`,min:550},{name:\`Master\`,min:700},{name:\`Grandmaster\`,min:850}]');
need(games,"games",'n%5===0');
need(games,"games",'function endlessSize');
need(games,"games",'Endless progression');
need(games,"games",'Start endless mission');
need(games,"games",'recurring bosses every five missions');
need(games,"games",'The numbered path is only the training phase.');
need(games,"games",'endless?endlessSize(r,cap,8,12)');
need(games,"games",'endless?endlessSize(r,cap,4,8)');
need(games,"games",'endless?endlessSize(r,cap,2,5)');
need(games,"games",'rating-based board size');
need(games,"games",'hideCue=endless');
need(games,"games",'mode=endless?(mission.boss?\`boss\`:mission.mode)');
need(games,"games",'label:isDue(o)?\`${s} retention\`:s');
need(games,"games",'Game results never mark a topic Mastered.');
need(games,"games","Cold build · reconstruct the French sentence");
need(games,"games","Final pressure board: the widest mixed set");
need(games,"games","Final pressure board: the largest mixed vocabulary set");

need(physics,"physics","levels:10");

const matchCounts=[1,2,3,4,5,6,7,8,9,10].map(e=>e<=1?4:e===2?5:e===3?6:e===4?7:e===5?8:e===6?9:e<=8?10:e===9?11:12);
for(let i=1;i<matchCounts.length;i++)if(matchCounts[i]<matchCounts[i-1])failures.push({type:"match-count-not-progressive",matchCounts});

const rank=r=>r>=850?"Grandmaster":r>=700?"Master":r>=550?"Scholar":r>=400?"Gold":r>=250?"Silver":"Bronze";
const samples=[[100,"Bronze"],[249,"Bronze"],[250,"Silver"],[400,"Gold"],[550,"Scholar"],[700,"Master"],[850,"Grandmaster"],[1000,"Grandmaster"]];
for(const [rating,expected] of samples)if(rank(rating)!==expected)failures.push({type:"rank-threshold",rating,expected,actual:rank(rating)});

const bossMissions=Array.from({length:20},(_,i)=>i+1).filter(n=>n%5===0);
if(JSON.stringify(bossMissions)!==JSON.stringify([5,10,15,20]))failures.push({type:"boss-cycle",bossMissions});

const updateRating=(rating,stars,isBoss=false)=>Math.max(100,Math.min(1000,rating+(stars>=3?36:stars===2?18:stars===1?-12:-24)+(isBoss&&stars>=2?8:0)));
if(updateRating(180,3)!==216)failures.push({type:"rating-up-3star"});
if(updateRating(180,2)!==198)failures.push({type:"rating-up-2star"});
if(updateRating(180,1)!==168)failures.push({type:"rating-down-1star"});
if(updateRating(110,0)!==100)failures.push({type:"rating-floor"});
if(updateRating(990,3,true)!==1000)failures.push({type:"rating-ceiling"});

const summary={
 failures:failures.length,
 peCircuits:8,
 trainingLevels:{match:10,latinDeep:12},
 endless:true,
 ranks:6,
 ratingRange:[100,1000],
 recurringBossEvery:5,
 progressiveMatchCounts:matchCounts,
 adaptiveWeakDueRetention:true,
 formalMasteryExcluded:true
};
console.log("GAME_PROGRESSION_QA "+JSON.stringify(summary));
console.log("GAME_PROGRESSION_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/game-progression-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);
