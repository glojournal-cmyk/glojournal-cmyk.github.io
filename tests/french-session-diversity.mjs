import fs from "node:fs";
import path from "node:path";

const bundlePath="assets/study._subject.practise-D_PWgUd7.js";
const source=fs.readFileSync(bundlePath,"utf8");
const start=source.indexOf("function FK(");
const end=source.indexOf("function E(){",start);
if(start<0||end<0) throw new Error("French diversity helpers not found in practice bundle");
const helpers=source.slice(start,end);
const {FK,FC,FL,FD}=new Function(helpers+";return {FK,FC,FL,FD};")();

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^fr-.*\.json$/.test(f)).sort();
const failures=[];
const summaries=[];

for(const file of files){
  const topic=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const rows=(topic.questions||[]).map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"}));
  if(!rows.length) continue;
  const target=Math.min(10,rows.length);
  const selected=FD(rows,target).slice(0,target);
  const concepts=selected.map(FC);
  const uniqueAvailable=new Set(rows.map(FC)).size;
  const expectedUnique=Math.min(target,uniqueAvailable);
  const actualUnique=new Set(concepts).size;
  if(actualUnique<expectedUnique){
    failures.push({file,type:"concept-repeat",target,expectedUnique,actualUnique,selected:selected.map(q=>({id:q.id,concept:FC(q)}))});
  }
  const lanes=selected.map(FL);
  const availableLanes=new Set(rows.map(FL)).size;
  const expectedLanes=Math.min(target,availableLanes,3);
  const actualLanes=new Set(lanes).size;
  if(actualLanes<expectedLanes){
    failures.push({file,type:"low-variety",target,availableLanes,expectedLanes,actualLanes,lanes});
  }
  for(let i=1;i<concepts.length;i++){
    if(concepts[i]===concepts[i-1] && uniqueAvailable>1){
      failures.push({file,type:"adjacent-repeat",index:i,concept:concepts[i]});
      break;
    }
  }
  summaries.push({file,target,actualUnique,actualLanes});
}

const numbers=JSON.parse(fs.readFileSync(path.join(root,"fr-y8-s24-numbers-and-age.json"),"utf8"));
const nr=FD(numbers.questions.map((q,i)=>({...q,_adaptiveRank:i,_adaptiveBucket:"new"})),10).slice(0,10);
const ids=new Set(nr.map(q=>q.id));
for(const [a,b] of [
  ["fr-y8-src-fr-24-1149-0","fr-y8-src-fr-24-1150-zero"],
  ["fr-y8-src-fr-24-1151-1","fr-y8-src-fr-24-1152-un"],
  ["fr-y8-src-fr-24-1153-2","fr-y8-src-fr-24-1154-deux"],
  ["fr-y8-src-fr-24-1155-3","fr-y8-src-fr-24-1156-trois"]
]){
  if(ids.has(a)&&ids.has(b)) failures.push({file:"fr-y8-s24-numbers-and-age.json",type:"reciprocal-pair",ids:[a,b]});
}

if(failures.length){
  console.error("FRENCH_SESSION_DIVERSITY_FAILURES "+JSON.stringify(failures.slice(0,100)));
  process.exit(2);
}
console.log("FRENCH_SESSION_DIVERSITY_ALL_TOPICS "+JSON.stringify({files:files.length,checked:summaries.length,sample:summaries.slice(0,10)}));
