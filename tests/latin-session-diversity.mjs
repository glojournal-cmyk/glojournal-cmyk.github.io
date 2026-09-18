import fs from "node:fs";
import path from "node:path";

const bundle="assets/study._subject.practise-D_PWgUd7.js";
const src=fs.readFileSync(bundle,"utf8");
const start=src.indexOf("function FK("), end=src.indexOf("function E(){",start);
if(start<0||end<0) throw new Error("Diversity helpers missing");
const {FC,FL,FD}=new Function(src.slice(start,end)+";return {FC,FL,FD};")();

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^la-.*\.json$/.test(f)).sort();
const failures=[], sample=[];
for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const rows=(doc.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
  if(!rows.length) continue;
  const target=Math.min(10,rows.length), chosen=FD(rows,target).slice(0,target);
  const keys=chosen.map(FC), lanes=chosen.map(FL), uniqueAvailable=new Set(rows.map(FC)).size;
  const expectedUnique=Math.min(target,uniqueAvailable), actualUnique=new Set(keys).size;
  if(actualUnique<expectedUnique) failures.push({file,type:"concept-repeat",expectedUnique,actualUnique,chosen:chosen.map(q=>({id:q.id,key:FC(q)}))});
  const availableLanes=new Set(rows.map(FL)).size, expectedLanes=Math.min(target,availableLanes,3), actualLanes=new Set(lanes).size;
  if(actualLanes<expectedLanes) failures.push({file,type:"low-variety",availableLanes,expectedLanes,actualLanes,lanes});
  for(let i=1;i<keys.length;i++) if(keys[i]===keys[i-1]&&uniqueAvailable>1){failures.push({file,type:"adjacent-repeat",index:i,key:keys[i]});break;}
  sample.push({file,target,actualUnique,actualLanes});
}
if(failures.length){console.error("LATIN_SESSION_DIVERSITY_FAILURES "+JSON.stringify(failures.slice(0,100)));process.exit(2);}
console.log("LATIN_SESSION_DIVERSITY_ALL_TOPICS "+JSON.stringify({files:files.length,checked:sample.length,sample:sample.slice(0,12)}));
