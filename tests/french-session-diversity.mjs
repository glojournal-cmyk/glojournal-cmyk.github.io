import fs from "node:fs";
import path from "node:path";

const bundlePath="assets/study._subject.practise-D_PWgUd7.js";
const source=fs.readFileSync(bundlePath,"utf8");
const start=source.indexOf("function FK(");
const end=source.indexOf("function E(){",start);
if(start<0||end<0) throw new Error("French diversity helpers not found in practice bundle");
const helpers=source.slice(start,end);
const {FK,FC,FL,FD}=new Function(helpers+";return {FK,FC,FL,FD};")();

const topic=JSON.parse(fs.readFileSync("content/topics/fr-y8-s24-numbers-and-age.json","utf8"));
const rows=topic.questions.map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
const ordered=FD(rows,10);
const selected=ordered.slice(0,10);
if(selected.length!==10) throw new Error("Expected 10 selected questions");

const concepts=selected.map(FC);
if(new Set(concepts).size!==concepts.length){
  throw new Error("French session repeats the same concept or reciprocal translation: "+JSON.stringify(selected.map(q=>({id:q.id,prompt:q.prompt,answer:q.answer?.accepted?.[0],concept:FC(q)}))));
}
const lanes=selected.map(FL);
const availableLanes=new Set(rows.map(FL)).size;
const requiredLaneCount=Math.min(4,availableLanes);
if(new Set(lanes).size<requiredLaneCount){
  throw new Error("French session is not varied enough: "+JSON.stringify(lanes));
}

const directPairIds=new Set(selected.map(q=>q.id));
const reciprocalPairs=[
  ["fr-y8-src-fr-24-1149-0","fr-y8-src-fr-24-1150-zero"],
  ["fr-y8-src-fr-24-1151-1","fr-y8-src-fr-24-1152-un"],
  ["fr-y8-src-fr-24-1153-2","fr-y8-src-fr-24-1154-deux"],
  ["fr-y8-src-fr-24-1155-3","fr-y8-src-fr-24-1156-trois"]
];
for(const [a,b] of reciprocalPairs){
  if(directPairIds.has(a)&&directPairIds.has(b)) throw new Error("Reciprocal pair appears in the same session: "+a+" / "+b);
}

console.log("FRENCH_SESSION_DIVERSITY",JSON.stringify({
  ids:selected.map(q=>q.id),
  lanes,
  concepts,
  distinctLanes:new Set(lanes).size
}));
