// QA only, read-only: Node integration test for 37 Food Tests under-credit fixes.
// node tests/food-tests-remaining-37-acceptance.mjs
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(base,p),"utf8");
const bank=JSON.parse(read("content/topics/bio-y8-food-tests.json")).questions;
const fixt=JSON.parse(read("qa/food-tests-51-markpoints-probes.json")).rows;
const six=JSON.parse(read("qa/food-tests-six-guarded-probes.json")).rows;
const targets=JSON.parse(read("qa/food-tests-51-markpoints-triage.json")).rows.filter(x=>x.undercredit&&!x.overcredit);
const idMap=new Map(bank.map(q=>[q.id,q]));
const module37=new Function(read("assets/food-tests-remaining-37-rubric-20261122.js").replace("export ","")+"\nreturn scoreFoodTestsRemaining37;")();
const module6=new Function(read("assets/food-tests-six-guarded-rubric-20261122.js").replace(/export /g,"")+"\nreturn scoreFoodTestsGuarded;")();
const ethanol=new Function(read("assets/food-tests-ethanol-rubric-20261122.js").replace("export ","")+"\nreturn scoreFoodTestsEthanolSafety;")();
const et=read("tests/food-tests-round1-batch-acceptance.mjs"),ts=et.indexOf("const cases=["),te=et.indexOf("];",ts);
const ethanolCases=new Function(et.slice(ts,te+2)+"return cases;")();
if(bank.length!==143||fixt.length!==51||six.length!==49||targets.length!==37||targets.filter(x=>x.classification.includes("structured")).length!==17||ethanolCases.length!==62)
 throw Error("Fixture counts or target register incorrect");
function endOf(s,at){let st=s.indexOf("{",at),n=0;for(let i=st;i<s.length;i++){if(s[i]==="{")n++;else if(s[i]==="}"){n--;if(n===0)return i+1}}throw Error("missing function end");}
function entrypoint(file){
 const src=read(file),a=src.indexOf("function B(e,t,n,r)"),f=src.indexOf("const MARK_SYNONYM_FAMILIES"),r=src.indexOf("function R(points,response");
 if(a<0||f<0||r<0||!src.includes("import {scoreFoodTestsRemaining37} from './food-tests-remaining-37-rubric-20261122.js'"))
  throw Error("Not using the actual patched QuizSession: "+file);
 const R=new Function(src.slice(f,endOf(src,r))+"\nreturn R;")();
 const B=new Function("L","I","R","scoreFoodTestsGuarded","scoreFoodTestsEthanolSafety","scoreFoodTestsRemaining37",
 src.slice(src.indexOf('function reviewedMark('),a)+src.slice(a,endOf(src,a))+"\nreturn B;")(q=>q.answer.modelAnswer||"",()=>[],R,module6,ethanol,module37);
 return {B,R};
}
const reports=[];
for(const file of ["assets/quiz-session-y8fix-20260920.js","assets/quiz-session-rWAnuDVj.js"]){
 const {B,R}=entrypoint(file),counts={model:0,paraphrase:0,contradiction:0,partial:0,six:0,ethanol:0,adversarial:0};
 const assert=(q,input,want,type)=>{const got=B(q,input,"biology",{});if(got.score!==want||got.total!==q.answer.markPoints.length)
  throw Error(file+" "+q.id+" "+type+" expected "+want+" got "+got.score);return got;};
 for(const f of fixt){
  const q=idMap.get(f.questionId),n=q.answer.markPoints.length;
  assert(q,q.answer.modelAnswer||q.answer.markPoints.join("; "),n,"model");counts.model++;
  assert(q,f.paraphraseFull,n,"paraphrase");counts.paraphrase++;
  assert(q,f.contradiction,0,"contradiction");counts.contradiction++;
  if(n>1){assert(q,q.answer.markPoints[0],1,"partial");counts.partial++;}
  const target=targets.some(t=>t.questionId===q.id);
  if(target){
   for(const [answer,zero] of [[f.paraphraseFull+". "+f.contradiction,false],[f.contradiction+". "+f.paraphraseFull,false],["This claim is wrong: "+f.paraphraseFull,true],["Not "+f.paraphraseFull,true]]){
    const score=B(q,answer,"biology",{}).score;
    if(zero?score!==0:score===n)throw Error(file+" "+q.id+" adversarial unexpected "+score);
    counts.adversarial++;
   }
  }else{
   for(const answer of [q.answer.modelAnswer||q.answer.markPoints.join("; "),f.paraphraseFull,f.contradiction]){
    const existing=module6(q.id,answer);
    const before=existing?.pointResults??q.answer.markPoints.map((point,index)=>R([point],answer,[q.answer.markPointAlternatives?.[index]||[]])===1);
    if(JSON.stringify(B(q,answer,"biology",{}).pointResults)!==JSON.stringify(before))
     throw Error("Untouched item changed: "+q.id);
   }
  }
 }
 for(const test of six){assert(idMap.get(test.id),test.answer,test.expected,"six");counts.six++;}
 for(const [answer,want] of ethanolCases){assert(idMap.get("bio-y8-app-ethanol-safety"),answer,want,"ethanol");counts.ethanol++;}
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 if(total!==455)throw Error("Expected 455 cases, found "+total);
 reports.push({file,total,passed:total,counts});
}
console.log(JSON.stringify({kind:"Food Tests remaining 37 Node integration acceptance",approved:0,reports},null,2));
