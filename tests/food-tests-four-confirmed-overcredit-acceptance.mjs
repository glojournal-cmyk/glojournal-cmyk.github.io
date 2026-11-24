// Food Tests QA-only acceptance for four independently confirmed false-credit errors.
// Run: node tests/food-tests-four-confirmed-overcredit-acceptance.mjs
// Imports the complete 455-case regression suite before checking new probes.
// Does not modify questions, progress data or approval status.
import './food-tests-remaining-37-acceptance.mjs';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const bank=JSON.parse(read('content/topics/bio-y8-food-tests.json'));
const byId=new Map(bank.questions.map(q=>[q.id,q]));
const tests=JSON.parse(read('qa/food-tests-four-confirmed-overcredit-probes.json'));
const heldout=JSON.parse(read('qa/food-tests-37-unseen-probes.json'));
const six=new Function(read('assets/food-tests-six-guarded-rubric-20261122.js').replace(/export /g,'')+'\nreturn scoreFoodTestsGuarded;')();
const ethanol=new Function(read('assets/food-tests-ethanol-rubric-20261122.js').replace('export ','')+'\nreturn scoreFoodTestsEthanolSafety;')();
const remaining=new Function(read('assets/food-tests-remaining-37-rubric-20261122.js').replace('export ','')+'\nreturn scoreFoodTestsRemaining37;')();
const files=['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js'];
function endOf(src,at){const start=src.indexOf('{',at);let depth=0;
 for(let i=start;i<src.length;i++){
  if(src[i]==='{')depth++;else if(src[i]==='}'&&--depth===0)return i+1;
 }
 throw new Error('Unclosed production scorer');
}
function scoreB(file){
 const src=read(file),fam=src.indexOf('const MARK_SYNONYM_FAMILIES');
 const r=src.indexOf('function R(points,response'),b=src.indexOf('function B(e,t,n,r)');
 if(fam<0||r<0||b<0||!src.includes('scoreFoodTestsRemaining37'))throw new Error('Missing production scorer '+file);
 const R=new Function(src.slice(fam,endOf(src,r))+'\nreturn R;')();
 return new Function('L','I','R','scoreFoodTestsGuarded','scoreFoodTestsEthanolSafety','scoreFoodTestsRemaining37',
  src.slice(src.indexOf('function reviewedMark('),b)+src.slice(b,endOf(src,b))+'\nreturn B;')(
 q=>q.answer.modelAnswer||'',()=>[],R,six,ethanol,remaining);
}
if(bank.questions.length!==143||tests.cases.length!==8||heldout.rows.length!==37||new Set(tests.cases.map(x=>x.questionId)).size!==4)
 throw new Error('Coverage or bank mismatch');
const reports=files.map(file=>{
 const B=scoreB(file);
 for(const test of tests.cases){
  const q=byId.get(test.questionId);
  if(!q||q.answer.markPoints.length!==2)throw new Error('Wrong target '+test.questionId);
  const result=B(q,test.answer,'biology',{});
  if(result.score!==test.expected||result.total!==2||result.ok!==false)
   throw new Error('False-credit safeguard failed '+file+': '+JSON.stringify({test,result}));
 }
 const allNeg=byId.get(tests.allNegative.questionId);
 const observedAmbiguous=B(allNeg,tests.allNegative.answer,'biology',{});
 if(observedAmbiguous.score!==1||observedAmbiguous.total!==2)
  throw new Error('All-negative 1/2 provisional partial-credit was changed');
 const records=heldout.rows.flatMap(row=>row.holdout.map(probe=>{
  const q=byId.get(row.questionId),res=B(q,probe.answer,'biology',{});
  const exp=row.questionId===tests.allNegative.questionId&&probe.kind==='false-conclusion-unseen'?1:probe.expected;
  return {id:q.id,kind:probe.kind,expected:exp,actual:res.score,match:res.score===exp};
 }));
 const byKind=Object.fromEntries(['full-paraphrase-unseen','false-conclusion-unseen'].map(kind=>{
  const sub=records.filter(x=>x.kind===kind);
  return [kind,{total:sub.length,matched:sub.filter(x=>x.match).length,mismatched:sub.filter(x=>!x.match).length}];
 }));
 const total=records.length,matched=records.filter(x=>x.match).length;
 if(total!==74||matched!==45||byKind['full-paraphrase-unseen'].matched!==8||
  byKind['false-conclusion-unseen'].matched!==37)
  throw new Error('Unexpected changes outside four confirmed failures: '+JSON.stringify({total,matched,byKind}));
 return {bundle:file,confirmedWrongCases:tests.cases.length,passed:tests.cases.length,
  heldOut:{total,matched,mismatched:total-matched,byKind},
  allNegativePartialCredit:'1/2',historical455:'imported suite passed before these checks'};
});
console.log(JSON.stringify({kind:'Food Tests four confirmed overcredit safeguards',approved:0,
 reports,remainingUnseenParaphraseUndermarks:29},null,2));
