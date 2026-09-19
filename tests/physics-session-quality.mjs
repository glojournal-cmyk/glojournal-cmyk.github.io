import fs from "node:fs";
import path from "node:path";

const practice=fs.readFileSync("assets/study._subject.practise-D_PWgUd7.js","utf8");
const hs=practice.indexOf("function FK("), he=practice.indexOf("function E(){",hs);
if(hs<0||he<0)throw new Error("diversity helper missing");
const {FC,FL,FD}=new Function(practice.slice(hs,he)+";return {FC,FL,FD};")();

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^phys-.*\.json$/.test(f)).sort();
const failures=[],sessions=[];
for(const file of files){
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 const rows=(doc.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
 for(const size of [5,10,15]){
   const actual=rows.slice(0,Math.min(size,rows.length));
   const actualKeys=actual.map(FC);
   const actualRepeat=actualKeys.length-new Set(actualKeys).size;
   const diverse=FD(rows,size).slice(0,Math.min(size,rows.length));
   const diverseKeys=diverse.map(FC);
   const avoidable=Math.min(size,new Set(rows.map(FC)).size);
   if(new Set(diverseKeys).size<avoidable) failures.push({file,size,type:"diversifier-repeat",selected:diverse.map(q=>({id:q.id,key:FC(q)}))});
   for(let i=1;i<diverseKeys.length;i++) if(diverseKeys[i]===diverseKeys[i-1]) failures.push({file,size,type:"adjacent-repeat",index:i,key:diverseKeys[i]});
   sessions.push({file,size,actualDistinct:new Set(actualKeys).size,actualRepeat,diverseDistinct:new Set(diverseKeys).size,lanes:[...new Set(diverse.map(FL))]});
 }
}
const actualRepeatSessions=sessions.filter(s=>s.actualRepeat>0);
const summary={files:files.length,sessions:sessions.length,actualRepeatSessions:actualRepeatSessions.length,failures:failures.length,worst:actualRepeatSessions.sort((a,b)=>b.actualRepeat-a.actualRepeat).slice(0,20)};
console.log("PHYSICS_SESSION_SUMMARY "+JSON.stringify(summary));
console.log("PHYSICS_SESSION_FAILURES "+JSON.stringify(failures.slice(0,100)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/physics-session-quality.json",JSON.stringify({summary,failures,sessions},null,2));
if(failures.length)process.exit(2);
