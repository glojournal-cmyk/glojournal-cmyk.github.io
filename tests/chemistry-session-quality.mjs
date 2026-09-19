import fs from "node:fs";
import path from "node:path";

const practice=fs.readFileSync("assets/study._subject.practise-D_PWgUd7.js","utf8");
const hs=practice.indexOf("function FK("),he=practice.indexOf("function E(){",hs);
if(hs<0||he<0)throw new Error("diversity helper missing");
const {FC,FL,FD}=new Function(practice.slice(hs,he)+";return {FC,FL,FD};")();

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^chem-.*\.json$/.test(f)).sort();
const sessions=[],failures=[];
for(const file of files){
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 const rows=(doc.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
 for(const size of [5,10,15]){
   const legacy=rows.slice(0,Math.min(size,rows.length)), legacyKeys=legacy.map(FC);
   const diverse=FD(rows,size).slice(0,Math.min(size,rows.length)), keys=diverse.map(FC);
   const expected=Math.min(size,new Set(rows.map(FC)).size), actual=new Set(keys).size;
   if(actual<expected) failures.push({file,size,type:"diversifier-repeat",expected,actual,selected:diverse.map(q=>({id:q.id,key:FC(q)}))});
   for(let i=1;i<keys.length;i++) if(keys[i]===keys[i-1]) failures.push({file,size,type:"adjacent-repeat",index:i,key:keys[i]});
   sessions.push({file,size,legacyDistinct:new Set(legacyKeys).size,legacyRepeats:legacyKeys.length-new Set(legacyKeys).size,diverseDistinct:actual,lanes:[...new Set(diverse.map(FL))]});
 }
}
const repeats=sessions.filter(s=>s.legacyRepeats>0);
const summary={files:files.length,sessions:sessions.length,legacyRepeatSessions:repeats.length,diversifierFailures:failures.length,worst:repeats.sort((a,b)=>b.legacyRepeats-a.legacyRepeats).slice(0,20)};
console.log("CHEMISTRY_SESSION_SUMMARY "+JSON.stringify(summary));
console.log("CHEMISTRY_SESSION_FAILURES "+JSON.stringify(failures.slice(0,100)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/chemistry-session-quality.json",JSON.stringify({summary,failures,sessions},null,2));
if(failures.length) process.exit(2);
