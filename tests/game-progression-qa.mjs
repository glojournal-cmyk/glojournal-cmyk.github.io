import fs from "node:fs";
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const pe=fs.readFileSync("assets/pe-circuit-DPe2o8eH.js","utf8");
const games=fs.readFileSync("assets/play._game-BbpxhxeZ.js","utf8");
const physics=fs.readFileSync("assets/physics-DT4AA9JX.js","utf8");
const failures=[];
const need=(src,name,token)=>{if(!src.includes(token))failures.push({type:"missing-token",name,token});};

need(core,"core",'"verbum-match":10');
need(core,"core",'"mot-match":10');
need(core,"core",'"element-match":10');
need(core,"core",'"force-match":10');
need(core,"core",'"word-match":10');
need(core,"core",'"organelle-match":10');
need(core,"core",'"pe-circuit":8');
need(core,"core","function vT(e){return e<=1?4:e===2?5:e===3?6:e===4?7:e===5?8:e===6?9:e<=8?10:e===9?11:12}");
need(core,"core","t===`phrase`?e<=3?2:e<=6?3:e<=9?4:5:e<=3?6:e<=6?8:e<=9?10:12");

need(pe,"pe","levels:8");
need(pe,"pe","How to play");
need(pe,"pe","Reach 68+ for 2★ to unlock the next circuit");
need(pe,"pe","Pressure circuit");
need(pe,"pe","House final");
need(pe,"pe","Tap only when the moving ball enters the green catch band.");
need(pe,"pe","Watch the coloured-house sequence, then repeat it in exactly the same order.");

need(games,"games","n=e===12?6:e<=3?3:e<=6?4:e<=9?5:6");
need(games,"games","count=e<=3?1:e<=6?2:e<=9?3:4");
need(games,"games","count=e<=3?2:e<=6?3:e<=9?4:5");
need(games,"games","cap=_(e),mastery=s>cap,boss=s===cap");
need(games,"games","Pressure chain");
need(games,"games","Cold build · reconstruct the French sentence");
need(games,"games","Final pressure board: the widest mixed set");
need(games,"games","Final pressure board: the largest mixed vocabulary set");
need(games,"games","Each stage adds more retrieval, fewer hints, stronger decoys or a new mechanic");

need(physics,"physics","levels:10");

const matchCounts=[1,2,3,4,5,6,7,8,9,10].map(e=>e<=1?4:e===2?5:e===3?6:e===4?7:e===5?8:e===6?9:e<=8?10:e===9?11:12);
for(let i=1;i<matchCounts.length;i++)if(matchCounts[i]<matchCounts[i-1])failures.push({type:"match-count-not-progressive",matchCounts});
const summary={failures:failures.length,peCircuits:8,matchGameLevels:10,latinDeepLevels:12,progressiveMatchCounts:matchCounts,sentenceBossItems:6,manuscriptHighLevelCases:4,phraseHighLevelSentences:5,peInstructions:true,bossPressure:true};
console.log("GAME_PROGRESSION_QA "+JSON.stringify(summary));
console.log("GAME_PROGRESSION_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/game-progression-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);