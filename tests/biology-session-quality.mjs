import fs from "node:fs";
import path from "node:path";

const practice=fs.readFileSync("assets/study._subject.practise-D_PWgUd7.js","utf8");
const hs=practice.indexOf("function FK("),he=practice.indexOf("function E(){",hs);
if(hs<0||he<0) throw new Error("diversity helper missing");
const {FC,FL,FD}=new Function(practice.slice(hs,he)+";return {FC,FL,FD};")();

const selectorTail=practice.slice(practice.lastIndexOf("let ranked=RQ(t,e,W)"));
const biologyEnabled=selectorTail.includes("e===\`biology\`?FD(ranked,W):ranked")||selectorTail.includes("||e===\`biology\`?FD(ranked,W):ranked");
const biomixEnabled=practice.includes("_adaptiveBucket:\`biology-mix\`});return FD(mixed,W).slice(0,W)}if(E===\`engmix\`)");

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^bio-y9-b\d+\.json$/.test(f)).sort((a,b)=>Number(a.match(/b(\d+)/)[1])-Number(b.match(/b(\d+)/)[1]));
const sessions=[],failures=[];
if(!biologyEnabled) failures.push({type:"runtime-not-using-diversifier"});
if(!biomixEnabled) failures.push({type:"biomix-not-using-diversifier"});

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const rows=(doc.questions||[]).filter(q=>q.status!=="disabled").map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
  for(const size of [5,10,15]){
    const legacy=rows.slice(0,Math.min(size,rows.length)), legacyKeys=legacy.map(FC);
    const runtime=FD(rows,size).slice(0,Math.min(size,rows.length)), keys=runtime.map(FC);
    const expected=Math.min(size,new Set(rows.map(FC)).size), actual=new Set(keys).size;
    if(actual<expected) failures.push({file,size,type:"runtime-concept-repeat",expected,actual,selected:runtime.map(q=>({id:q.id,key:FC(q)}))});
    for(let i=1;i<keys.length;i++) if(keys[i]===keys[i-1]&&new Set(rows.map(FC)).size>1) failures.push({file,size,type:"runtime-adjacent-repeat",index:i,key:keys[i]});
    sessions.push({file,size,legacyDistinct:new Set(legacyKeys).size,legacyRepeats:legacyKeys.length-new Set(legacyKeys).size,runtimeDistinct:actual,lanes:[...new Set(runtime.map(FL))]});
  }
}

const all=files.flatMap(file=>{
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  return (doc.questions||[]).filter(q=>q.status!=="disabled"&&q.formal!==false).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"biology-mix"}));
});
const num=q=>Number(String(q.topicId||"").match(/bio-y9-b(\d+)/)?.[1]||0);
const groups=[all.filter(q=>num(q)>=1&&num(q)<=7),all.filter(q=>num(q)>=8&&num(q)<=10),all.filter(q=>num(q)>=11&&num(q)<=16)];
let mixed=[];
for(const group of groups) mixed.push(...FD(group,5).slice(0,5));
mixed=mixed.map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"biology-mix"}));
const mix=FD(mixed,15).slice(0,15), mixKeys=mix.map(FC);
const mixActual=new Set(mixKeys).size;
if(mix.length!==15) failures.push({type:"biomix-wrong-length",actual:mix.length});
if(mixActual!==15) failures.push({type:"biomix-concept-repeat",actual:mixActual,selected:mix.map(q=>({id:q.id,key:FC(q)}))});
for(let i=1;i<mixKeys.length;i++) if(mixKeys[i]===mixKeys[i-1]) failures.push({type:"biomix-adjacent-repeat",index:i,key:mixKeys[i]});
const blockCounts=[
  mix.filter(q=>num(q)>=1&&num(q)<=7).length,
  mix.filter(q=>num(q)>=8&&num(q)<=10).length,
  mix.filter(q=>num(q)>=11&&num(q)<=16).length
];
if(blockCounts.some(n=>n!==5)) failures.push({type:"biomix-block-balance",blockCounts});
const mixFormats=new Set(mix.map(q=>q.format)).size;
if(mixFormats<3) failures.push({type:"biomix-low-format-diversity",mixFormats});

const repeats=sessions.filter(s=>s.legacyRepeats>0);
const summary={files:files.length,sessions:sessions.length,legacyRepeatSessions:repeats.length,runtimeFailures:failures.length,biomixDistinct:mixActual,biomixFormats:mixFormats,blockCounts,worstLegacy:repeats.sort((a,b)=>b.legacyRepeats-a.legacyRepeats).slice(0,20)};
console.log("BIOLOGY_SESSION_SUMMARY "+JSON.stringify(summary));
console.log("BIOLOGY_SESSION_FAILURES "+JSON.stringify(failures.slice(0,100)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/biology-session-quality.json",JSON.stringify({summary,failures,sessions,biomix:mix.map(q=>({id:q.id,topicId:q.topicId,concept:FC(q),lane:FL(q),format:q.format}))},null,2));
if(failures.length) process.exit(2);
