import fs from "node:fs";
import path from "node:path";

const practice=fs.readFileSync("assets/study._subject.practise-D_PWgUd7.js","utf8");
const hs=practice.indexOf("function FK("), he=practice.indexOf("function E(){",hs);
if(hs<0||he<0) throw new Error("diversity helper missing");
const {FC,FL,FD}=new Function(practice.slice(hs,he)+";return {FC,FL,FD};")();

const physicsEnabled=practice.includes('e===`french`||e===`latin`||e===`physics`?FD(ranked,W):ranked');
const physmixEnabled=practice.includes('return FD(mixed,W).slice(0,W)}if(E===`chemmix`)');
const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^phys-.*\.json$/.test(f)).sort();
const failures=[],sessions=[];

if(!physicsEnabled) failures.push({type:"runtime-not-using-diversifier"});
if(!physmixEnabled) failures.push({type:"physmix-not-using-diversifier"});

for(const file of files){
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 const rows=(doc.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
 for(const size of [5,10,15]){
   const legacy=rows.slice(0,Math.min(size,rows.length));
   const legacyKeys=legacy.map(FC);
   const runtime=FD(rows,size).slice(0,Math.min(size,rows.length));
   const keys=runtime.map(FC), uniqueAvailable=new Set(rows.map(FC)).size;
   const expectedUnique=Math.min(size,uniqueAvailable), actualUnique=new Set(keys).size;
   if(actualUnique<expectedUnique) failures.push({file,size,type:"runtime-concept-repeat",expectedUnique,actualUnique,selected:runtime.map(q=>({id:q.id,key:FC(q)}))});
   for(let i=1;i<keys.length;i++) if(keys[i]===keys[i-1]&&uniqueAvailable>1) failures.push({file,size,type:"runtime-adjacent-repeat",index:i,key:keys[i]});
   sessions.push({
     file,size,
     legacyDistinct:new Set(legacyKeys).size,
     legacyRepeats:legacyKeys.length-new Set(legacyKeys).size,
     runtimeDistinct:actualUnique,
     runtimeLanes:[...new Set(runtime.map(FL))]
   });
 }
}

// Simulate the Year 9 Physics Mix 15 pool after its term-group balancing.
const y9=files.filter(f=>/^phys-y9-p\d+\.json$/.test(f)).flatMap(file=>{
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 return (doc.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"physics-mix"}));
});
const num=q=>Number(String(q.topicId||"").match(/phys-y9-p(\d+)/)?.[1]||0);
const groups=[y9.filter(q=>num(q)>=1&&num(q)<=8),y9.filter(q=>num(q)>=9&&num(q)<=15),y9.filter(q=>num(q)>=16&&num(q)<=18)];
let mixed=[];
for(const group of groups){
 const picked=FD(group,5).slice(0,5);
 mixed.push(...picked);
}
mixed=mixed.map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"physics-mix"}));
const mix=FD(mixed,15).slice(0,15), mixKeys=mix.map(FC);
if(new Set(mixKeys).size<Math.min(15,new Set(mixed.map(FC)).size)) failures.push({type:"physmix-concept-repeat",selected:mix.map(q=>({id:q.id,key:FC(q)}))});
for(let i=1;i<mixKeys.length;i++) if(mixKeys[i]===mixKeys[i-1]) failures.push({type:"physmix-adjacent-repeat",index:i,key:mixKeys[i]});

const legacyRepeatSessions=sessions.filter(s=>s.legacyRepeats>0);
const summary={
 files:files.length,sessions:sessions.length,
 legacyRepeatSessions:legacyRepeatSessions.length,
 runtimeFailures:failures.length,
 physmixDistinct:new Set(mixKeys).size,
 worstLegacy:legacyRepeatSessions.sort((a,b)=>b.legacyRepeats-a.legacyRepeats).slice(0,12)
};
console.log("PHYSICS_SESSION_SUMMARY "+JSON.stringify(summary));
console.log("PHYSICS_SESSION_FAILURES "+JSON.stringify(failures.slice(0,100)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/physics-session-quality.json",JSON.stringify({summary,failures,sessions,physmix:mix.map(q=>({id:q.id,concept:FC(q),lane:FL(q)}))},null,2));
if(failures.length) process.exit(2);
