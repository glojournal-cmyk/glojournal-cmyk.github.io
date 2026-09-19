import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=process.cwd();
const dir=path.join(root,"content","school-update-20260919");
const parts=Array.from({length:12},(_,i)=>path.join(dir,`runtime-${String(i).padStart(2,"0")}.txt`));
const failures=[];
for(const p of parts)if(!fs.existsSync(p))failures.push({type:"missing-bundle-part",file:path.relative(root,p)});

let raw=null,topics=[];
if(!failures.length){
  try{
    const b64=parts.map(p=>fs.readFileSync(p,"utf8").trim()).join("");
    raw=JSON.parse(zlib.gunzipSync(Buffer.from(b64,"base64")).toString("utf8"));
    topics=Array.isArray(raw?.t)?raw.t:[];
  }catch(error){failures.push({type:"bundle-decode",error:String(error)});}
}

const topicIds=new Set(),questionIds=new Set();
let questions=0;
const bySubject={};
for(const t of topics){
  if(!t?.id||topicIds.has(t.id))failures.push({type:"topic-id",id:t?.id});
  else topicIds.add(t.id);
  const qs=Array.isArray(t?.q)?t.q:[];
  questions+=qs.length;
  const subject=String(t?.s||"");
  bySubject[subject]??={topics:0,questions:0};
  bySubject[subject].topics++;
  bySubject[subject].questions+=qs.length;
  if(!t?.n||typeof t.n!=="object")failures.push({type:"missing-note",topicId:t?.id});
  for(const q of qs){
    if(!q?.i||questionIds.has(q.i))failures.push({type:"question-id",id:q?.i,topicId:t?.id});
    else questionIds.add(q.i);
    if(!String(q?.p||"").trim())failures.push({type:"empty-prompt",id:q?.i});
    if(q?.a===undefined||q?.a===null||(typeof q.a==="string"&&!q.a.trim()))failures.push({type:"empty-answer",id:q?.i});
  }
}

const expected={topics:28,questions:1157,french:{topics:17,questions:743},latin:{topics:11,questions:414}};
if(topics.length!==expected.topics)failures.push({type:"topic-count",actual:topics.length,expected:expected.topics});
if(questions!==expected.questions)failures.push({type:"question-count",actual:questions,expected:expected.questions});
for(const subject of ["french","latin"]){
  const actual=bySubject[subject]||{topics:0,questions:0};
  if(actual.topics!==expected[subject].topics||actual.questions!==expected[subject].questions)
    failures.push({type:"subject-count",subject,actual,expected:expected[subject]});
}

const core=fs.readFileSync(path.join(root,"assets","index-BLVOhKhN.core.js"),"utf8");
const wrapper=fs.readFileSync(path.join(root,"assets","index-BLVOhKhN.js"),"utf8");
for(const marker of [
  "loadSchoolY9Bundle_20260919",
  "/content/school-update-20260919/runtime-",
  'bC.version="2.4.0+school-20260919"',
  'sourceId:"school-update-20260919"'
])if(!core.includes(marker))failures.push({type:"loader-marker-missing",marker});
if(!wrapper.includes("index-BLVOhKhN.core.js?v=20260919-studyfix1"))failures.push({type:"cache-bust-missing"});

const summary={parts:parts.length,topics:topics.length,questions,bySubject,topicIds:topicIds.size,questionIds:questionIds.size,failures:failures.length};
console.log("YEAR9_SCHOOL_UPDATE_QA "+JSON.stringify(summary));
console.log("YEAR9_SCHOOL_UPDATE_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/year9-school-update-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);
