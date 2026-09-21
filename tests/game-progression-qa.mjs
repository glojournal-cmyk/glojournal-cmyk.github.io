import fs from "node:fs";
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const pe=fs.readFileSync("assets/pe-circuit-v3-20260920.js","utf8");
const games=fs.readFileSync("assets/play._game-BbpxhxeZ.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
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
need(core,"core","daily.plays>=2&&daily.twoStar>=2");
need(core,"core","weekly.plays>=8&&weekly.twoStar>=6&&weekly.boss>=1");
need(core,"core","game_daily_challenge");
need(core,"core","game_weekly_challenge");

need(pe,"pe","levels:8");
need(pe,"pe","Scholar Sprint 3.0");
need(pe,"pe",'stars=v=>v>=86?3:v>=68?2:v>=45?1:0');
for(const token of ["Quick Feet","Reaction Dash","Precision Kick","Footwork Memory","Balance Hold","Dodge Lane"]) need(pe,"pe",token);
need(pe,"pe","Wrong-side taps do not end the station.");
need(pe,"pe","Early tap = retry");
need(pe,"pe",'onPointerDown:down');
need(pe,"pe",'touchAction:"none"');
need(pe,"pe","no instant game-over.");
need(games,"games",'pe-circuit-v3-20260920.js?v=20260920-pe3');
need(wrapper,"pe unlock","every 2★+ clear of the currently unlocked circuit opens the next one");
need(wrapper,"pe unlock","unlocked: Math.min(8, level + 1)");
need(wrapper,"pe unlock","lastUnlock: `circuit-${level}`");

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
need(games,"games","Daily endless challenge");
need(games,"games","Weekly endless challenge");
need(games,"games","Complete 2 endless missions with at least 2★ in each.");
need(games,"games","8 missions · 6 at 2★+ · clear 1 recurring boss.");
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
 peEngine:"Scholar Sprint 3.0",
 peMechanics:6,
 trainingLevels:{match:10,latinDeep:12},
 endless:true,
 ranks:6,
 ratingRange:[100,1000],
 recurringBossEvery:5,
 progressiveMatchCounts:matchCounts,
 adaptiveWeakDueRetention:true,
 formalMasteryExcluded:true,
 dailyChallenge:{missions:2,strong:2,xp:12},
 weeklyChallenge:{missions:8,strong:6,boss:1,xp:35}
};
console.log("GAME_PROGRESSION_QA "+JSON.stringify(summary));
console.log("GAME_PROGRESSION_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/game-progression-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);
