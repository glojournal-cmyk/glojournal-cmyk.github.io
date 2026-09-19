import fs from "node:fs";
import path from "node:path";

const practice=fs.readFileSync("assets/study._subject.practise-D_PWgUd7.js","utf8");
const hs=practice.indexOf("function FK("),he=practice.indexOf("function E(){",hs);
if(hs<0||he<0) throw new Error("diversity helper missing");
const {FC,FL,FD}=new Function(practice.slice(hs,he)+";return {FC,FL,FD};")();

const selectorTail=practice.slice(practice.lastIndexOf("let ranked=RQ(t,e,W)"));
const chemistryEnabled=selectorTail.includes('e===`chemistry`')&&selectorTail.includes('FD(ranked,W)');
const chemmixEnabled=practice.includes('return FD(mixed,W).slice(0,W)}if(E===`biomix`)');

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^chem-.*\.json$/.test(f)).sort();
const sessions=[],failures=[];
if(!chemistryEnabled) failures.push({type:"runtime-not-using-diversifier"});
if(!chemmixEnabled) failures.push({type:"chemmix-not-using-diversifier"});

for(const file of files){
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 const rows=(doc.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
 for(const size of [5,10,15]){
   const legacy=rows.slice(0,Math.min(size,rows.length)), legacyKeys=legacy.map(FC);
   const runtime=FD(rows,size).slice(0,Math.min(size,rows.length)), keys=runtime.map(FC);
   const expected=Math.min(size,new Set(rows.map(FC)).size), actual=new Set(keys).size;
   if(actual<expected) failures.push({file,size,type:"runtime-concept-repeat",expected,actual,selected:runtime.map(q=>({id:q.id,key:FC(q)}))});
   for(let i=1;i<keys.length;i++) if(keys[i]===keys[i-1]&&new Set(rows.map(FC)).size>1) failures.push({file,size,type:"runtime-adjacent-repeat",index:i,key:keys[i]});
   sessions.push({file,size,legacyDistinct:new Set(legacyKeys).size,legacyRepeats:legacyKeys.length-new Set(legacyKeys).size,runtimeDistinct:actual,lanes:[...new Set(runtime.map(FL))]});
 }
}

// Simulate Year 9 Chemistry Mix 15 across the three curriculum blocks.
const y9=files.filter(f=>/^chem-y9-c\d+\.json$/.test(f)).flatMap(file=>{
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 return (doc.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"chemistry-mix"}));
});
const num=q=>Number(String(q.topicId||"").match(/chem-y9-c(\d+)/)?.[1]||0);
const groups=[y9.filter(q=>num(q)>=1&&num(q)<=7),y9.filter(q=>num(q)>=8&&num(q)<=14),y9.filter(q=>num(q)>=15&&num(q)<=17)];
let mixed=[];
for(const group of groups) mixed.push(...FD(group,5).slice(0,5));
mixed=mixed.map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"chemistry-mix"}));
const mix=FD(mixed,15).slice(0,15), mixKeys=mix.map(FC);
const mixExpected=Math.min(15,new Set(mixed.map(FC)).size), mixActual=new Set(mixKeys).size;
if(mixActual<mixExpected) failures.push({type:"chemmix-concept-repeat",mixExpected,mixActual,selected:mix.map(q=>({id:q.id,key:FC(q)}))});
for(let i=1;i<mixKeys.length;i++) if(mixKeys[i]===mixKeys[i-1]) failures.push({type:"chemmix-adjacent-repeat",index:i,key:mixKeys[i]});

const repeats=sessions.filter(s=>s.legacyRepeats>0);
const summary={
 files:files.length,sessions:sessions.length,legacyRepeatSessions:repeats.length,
 runtimeFailures:failures.length,chemmixDistinct:mixActual,
 worstLegacy:repeats.sort((a,b)=>b.legacyRepeats-a.legacyRepeats).slice(0,20)
};
console.log("CHEMISTRY_SESSION_SUMMARY "+JSON.stringify(summary));
console.log("CHEMISTRY_SESSION_FAILURES "+JSON.stringify(failures.slice(0,100)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/chemistry-session-quality.json",JSON.stringify({summary,failures,sessions,chemmix:mix.map(q=>({id:q.id,concept:FC(q),lane:FL(q)}))},null,2));
if(failures.length) process.exit(2);
