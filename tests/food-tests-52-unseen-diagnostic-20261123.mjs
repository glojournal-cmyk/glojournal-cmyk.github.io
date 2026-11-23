// Held-out academic QA diagnostic, intentionally tests NEW answer formulations.
// Run: node tests/food-tests-37-unseen-diagnostic.mjs --write
// Add --strict to fail (nonzero) when any expected score differs.
// The normal diagnostic emits mismatches without changing the scoring engine.
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const bank=JSON.parse(read("content/topics/bio-y8-food-tests.json"));
const previous=JSON.parse(read("qa/food-tests-37-unseen-probes.json"));
const extra=JSON.parse(read("qa/food-tests-15-extra-unseen-20261123.json"));
const fixture={rows:[...previous.rows,...extra.rows]};
const byId=new Map(bank.questions.map(q=>[q.id,q]));
const six=new Function(read("assets/food-tests-six-guarded-rubric-20261122.js").replace(/export /g,"")+"\nreturn scoreFoodTestsGuarded;")();
const ethanol=new Function(read("assets/food-tests-ethanol-rubric-20261122.js").replace("export ","")+"\nreturn scoreFoodTestsEthanolSafety;")();
const remaining=new Function(read("assets/food-tests-remaining-37-rubric-20261122.js").replace("export ","")+"\nreturn scoreFoodTestsRemaining37;")();
function endOf(s,at){let st=s.indexOf("{",at),level=0;
 for(let i=st;i<s.length;i++){if(s[i]==="{")level++;else if(s[i]==="}"){level--;if(level===0)return i+1}}
 throw Error("Cannot extract function");}
function scorer(file){
 const s=read(file),i=s.indexOf("function B(e,t,n,r)"),r=s.indexOf("function R(points,response"),fam=s.indexOf("const MARK_SYNONYM_FAMILIES");
 if(i<0||r<0||fam<0||!s.includes("import {scoreFoodTestsRemaining37}"))throw Error("Missing actual QuizSession scorer: "+file);
 const R=new Function(s.slice(fam,endOf(s,r))+"\nreturn R;")();
 return new Function("L","I","R","scoreFoodTestsGuarded","scoreFoodTestsEthanolSafety","scoreFoodTestsRemaining37",
 s.slice(i,endOf(s,i))+"\nreturn B;")(
 q=>q.answer.modelAnswer||"",()=>[],R,six,ethanol,remaining);
}
const bundlePaths=["assets/quiz-session-y8fix-20260920.js","assets/quiz-session-rWAnuDVj.js"];
const originals=bank.questions.filter(q=>q.format==="mark_points");
if(originals.length!==52||originals.reduce((n,q)=>n+q.answer.markPoints.length,0)!==99||previous.rows.length!==37||extra.rows.length!==15||fixture.rows.length!==52||new Set(fixture.rows.map(x=>x.questionId)).size!==52||fixture.rows.some(r=>r.holdout.length!==2||!byId.has(r.questionId)||r.expectedMarks!==byId.get(r.questionId).answer.markPoints.length)||originals.some(q=>!fixture.rows.find(r=>r.questionId===q.id)))
 throw Error("52 original long-answer / 99 point coverage incomplete");
const perBundle=bundlePaths.map(bundle=>{
 const B=scorer(bundle),rows=fixture.rows.flatMap(item=>item.holdout.map(test=>{
  const q=byId.get(item.questionId),got=B(q,test.answer,"biology",{});
  return {questionId:q.id,rubricType:item.rubricType,kind:test.kind,answer:test.answer,expected:test.expected,
  actual:got.score,pointResults:got.pointResults,match:got.score===test.expected,
  academicAdjudication:test.academicAdjudication??null};
 }));
 return {bundle,rows};
});
if(JSON.stringify(perBundle[0].rows)!==JSON.stringify(perBundle[1].rows))
 throw Error("Two production scorer bundles disagree on hold-out cases");
const rows=perBundle[0].rows,mismatches=rows.filter(r=>!r.match);
const byKind=Object.fromEntries(["full-paraphrase-unseen","false-conclusion-unseen"].map(kind=>{
 const sub=rows.filter(x=>x.kind===kind);
 return [kind,{total:sub.length,matches:sub.filter(x=>x.match).length,mismatches:sub.filter(x=>!x.match).length}];
}));
const byRubric=Object.fromEntries(["bounded","structured","additional-15"].map(kind=>{
 const sub=rows.filter(x=>x.rubricType===kind);
 return [kind,{total:sub.length,matches:sub.filter(x=>x.match).length,mismatches:sub.filter(x=>!x.match).length}];
}));
if(rows.some(r=>!Number.isFinite(r.actual)||r.actual<0||r.actual>byId.get(r.questionId).answer.markPoints.length))throw Error("Scorer outside 0 to total-mark range");
const summary={questions:52,sourceMarkPoints:99,previousCovered:37,newlyCovered:15,newlyCoveredMarks:26,cases:rows.length,matches:rows.filter(x=>x.match).length,mismatches:mismatches.length,
 byKind,byRubric,overcreditCandidates:mismatches.filter(x=>x.kind==="false-conclusion-unseen").map(x=>x.questionId),
 underCreditCandidates:mismatches.filter(x=>x.kind==="full-paraphrase-unseen").map(x=>x.questionId),
 bundles:bundlePaths};
const output={kind:"Food Tests 52 long-answer / 99-point held-out Academic QA diagnostic",approved:0,independentAcademicReview:"pending",
 notes:["This is diagnostic evidence, not academic approval.","Provisional expected marks require independent review where ambiguous.","All 143 questions remain pending and main is unchanged."],
 summary,rows};
if(process.argv.includes("--write")){
 writeFileSync(path.join(root,"qa/food-tests-52-unseen-node-result-20261123.json"),JSON.stringify(output,null,2)+"\n");
}
console.log(JSON.stringify({kind:output.kind,summary,approved:0},null,2));
if(process.argv.includes("--strict")&&mismatches.length)process.exitCode=1;
