// QA branch, Node-only acceptance for six high-risk Food Tests marking rules.
// Run from repo root: node tests/food-tests-six-guarded-acceptance.mjs
// Read-only; prints diagnostics, does not change app data or approve questions.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const bank=JSON.parse(read('content/topics/bio-y8-food-tests.json'));
const fixture=JSON.parse(read('qa/food-tests-six-guarded-probes.json'));
const baseline=JSON.parse(read('qa/food-tests-51-markpoints-node-result.json'));
const src=read('assets/food-tests-six-guarded-rubric-20261122.js');
const guard=new Function(src.replace(/export /g,'')+'\nreturn scoreFoodTestsGuarded;')();
const expectedIds=new Set(fixture.rows.map(r=>r.id));
if(expectedIds.size!==6||fixture.rows.length!==49||baseline.summary.questions!==51||baseline.summary.cases!==196)
 throw Error('Missing/stale test evidence');
const questions=new Map(bank.questions.map(q=>[q.id,q]));
function endOf(s,at){const st=s.indexOf('{',at);let depth=0;
 for(let j=st;j<s.length;j++){if(s[j]==='{')depth++;else if(s[j]==='}'){depth--;if(depth===0)return j+1;}}
 throw Error('Unclosed function');
}
function makeEntryPoint(bundlePath){
 const s=read(bundlePath),at=s.indexOf('function B(e,t,n,r)'),rAt=s.indexOf('function R(points,response'),families=s.indexOf('const MARK_SYNONYM_FAMILIES');
 if(at<0||rAt<0||families<0||!s.includes("import {scoreFoodTestsGuarded} from './food-tests-six-guarded-rubric-20261122.js'"))
  throw Error('Missing production scorer dispatch in '+bundlePath);
 const R=new Function(s.slice(families,endOf(s,rAt))+'\nreturn R;')();
 const B=new Function('L','I','R','scoreFoodTestsGuarded','scoreFoodTestsEthanolSafety',
  s.slice(at,endOf(s,at))+'\nreturn B;')(
   q=>q.answer.modelAnswer||'',()=>[],R,guard,
   ()=>{throw Error('Unexpected ethanol dispatch in non-ethanol test')});
 return {B,R,bundlePath};
}
const bundlePaths=['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js'];
const bundles=bundlePaths.map(makeEntryPoint);
const outputs=bundles.map(({B,R,bundlePath})=>{
 let curatedPassed=0;
 for(const c of fixture.rows){
  const q=questions.get(c.id);if(!q)throw Error('Unknown QA fixture question: '+c.id);
  const got=B(q,c.answer,'biology',{});
  if(got.score!==c.expected||got.total!==q.answer.markPoints.length||
    got.ok!==(c.expected===got.total))throw Error('Guarded rule mismatch '+bundlePath+': '+JSON.stringify({c,got}));
  curatedPassed++;
 }
 const records=[],byType={model:{passed:0,failed:0},paraphrase:{passed:0,failed:0},counterexample:{passed:0,failed:0},single:{passed:0,failed:0}};
 let unaffectedChanged=0,oldPass=0,newPass=0,overCreditStillPresent=0;
 for(const fixture51 of JSON.parse(read('qa/food-tests-51-markpoints-probes.json')).rows){
  const q=questions.get(fixture51.questionId),n=q.answer.markPoints.length;
  const probes=[['model',q.answer.modelAnswer||q.answer.markPoints.join('; '),n],
    ['paraphrase',fixture51.paraphraseFull,n],['counterexample',fixture51.contradiction,0]];
  if(n>1)probes.push(['single',q.answer.markPoints[0],1]);
  for(const [kind,response,expected] of probes){
   const originalMarks=q.answer.markPoints.map((point,index)=>
    R([point],response,[q.answer.markPointAlternatives?.[index]||[]])===1);
   const original=originalMarks.filter(Boolean).length;
   const got=B(q,response,'biology',{});
   if(original===expected)oldPass++;
   if(got.score===expected){newPass++;byType[kind].passed++}else byType[kind].failed++;
   if(!expectedIds.has(q.id)&&JSON.stringify([got.score,got.total,got.pointResults])!==JSON.stringify([original,n,originalMarks]))unaffectedChanged++;
   if(expectedIds.has(q.id)&&kind==='counterexample'&&got.score>0)overCreditStillPresent++;
   if(got.score!==expected)records.push({id:q.id,kind,expected,actual:got.score,pointResults:got.pointResults});
  }
 }
 const summary={bundlePath,curatedPassed,curatedTotal:fixture.rows.length,
  original51Pass:oldPass,postFix51Pass:newPass,postFix51Total:196,
  remainingMismatches:196-newPass,remainingTypes:byType,unaffectedChanged,overCreditStillPresent};
 if(oldPass!==148||newPass!==159||unaffectedChanged!==0||overCreditStillPresent!==0||records.length!==37)
  throw Error('Unexpected baseline, repair or regression: '+JSON.stringify({summary,records}));
 return summary;
});
console.log(JSON.stringify({kind:'Food Tests 6 guarded rule acceptance',approved:0,bundles:outputs},null,2));
