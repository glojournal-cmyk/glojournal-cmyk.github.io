import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditEightStemMaths} from '../assets/math-study/math-v313-eight-grade-demand-verifier.js';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const get=p=>JSON.parse(readFileSync(new URL('../qa-staging/'+p,import.meta.url),'utf8'));
const bank=get('math-v311-reviewed-200.json');
const pack=get('math-v313-eight-grade-demand-redesign-candidates-20261123.json');
const beforeFiles=[
 'math-v312-indices005-008-reasoning-replacement-candidates-20261123.json',
 'math-v312-rearranging001-004-inverse-model-reasoning-candidates-20261123.json',
 'math-v312-rearranging009-011-017-inverse-domain-reasoning-candidates-20261123.json',
 'math-v312-rearranging012-015-distinct-reasoning-candidates-20261123.json',
 'math-v312-rearranging019-022-composite-reciprocal-reasoning-candidates-20261123.json'
];
const olderCandidates=beforeFiles.flatMap(p=>getPack(p).questions);
function getPack(p){return get(p)}

test('8 redesigned AO2/AO3 candidates: independent stem answers, full six-choice structure, native offline rendering, zero credit',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(q=>q.dailyEligible).length,0);
 assert.equal(pack.questions.length,8);
 assert.equal(pack.totals.newDesigns,8);
 assert.equal(pack.totals.choices,48);
 assert.equal(pack.totals.wrongOptions,40);
 assert.equal(pack.totals.academicApprovals,0);
 assert.equal(pack.totals.dailyEnabled,0);
 assert.equal(pack.totals.masteryEnabled,0);
 assert.equal(pack.scope.schoolPdf,'SKIPPED_AS_INSTRUCTED');
 const before=new Map(olderCandidates.map(q=>[q.sourceId,q]));
 const source=new Map(bank.questions.map(q=>[q.sourceId,q]));
 assert.equal(source.size,200);
 let fragments=0,wrong=0;
 for(const q of pack.questions){
  const old=before.get(q.sourceId),base=source.get(q.sourceId);
  assert.ok(old&&base,'Missing previous candidate / canonical bank original: '+q.sourceId);
  assert.equal(q.supersedesCandidateRevisionId,old.revisionId);
  assert.equal(q.replacesOriginalRevisionId,base.revisionId);
  assert.equal(base.dailyEligible,false);
  assert.equal(q.dailyEligible,false);
  assert.equal(q.masteryEligible,false);
  assert.equal(q.academicQA,'pending');
  assert.ok(q.conceptOverlapReviewRequired.length>0,'Potential Mastery concept overlap is not allowed to be forgotten');
  assert.notEqual(q.stem,old.stem);
  assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);fragments++;
  for(const o of q.options){
   assert.match(mathsOptionHTML(o),/^<math xmlns=/);
   fragments++;
   if(o.id!==q.correctOptionId){wrong++;assert.ok(o.errorPath.length>25)}
  }
  assert.equal(q.workedSolutionSteps.length,3);
  for(const line of q.workedSolutionSteps){assert.ok(mathsRichTextHTML(line).length>0);fragments++}
 }
 assert.equal(fragments,80);
 assert.equal(wrong,40);
 const proof=auditEightStemMaths(pack.questions);
 assert.equal(proof.length,8);
 assert.equal(proof.map(x=>x.correctOptionId).join(''),'CCACDDDC');
 assert.equal(new Set(proof.map(x=>x.sourceId)).size,8);
});

test('adversarial source, key, scoring and A-F changes fail closed',()=>{
 const copy=()=>structuredClone(pack.questions);
 const bad=[];
 for(let i=0;i<8;i++){
  const qs=copy();
  qs[i].correctOptionId=qs[i].correctOptionId==='A'?'B':'A';
  bad.push(['wrong-key-'+i,qs]);
 }
 const mutations=[
  [0,'a+b\\le18','a+b\\le30'],
  [1,'4x+7','4x+8'],
  [2,'\\sqrt{x+1}','\\sqrt{x+2}'],
  [3,'kx+4','kx+5'],
  [4,'\\frac{6}','\\frac{7}'],
  [5,'(x-3)^2','(x-4)^2'],
  [6,'x^2-25','x^2-24'],
  [7,'3x+2','4x+2']
 ];
 for(const [i,from,to] of mutations){
  const qs=copy();
  assert.ok(qs[i].stem.includes(from),'Missing expected original source '+i);
  qs[i].stem=qs[i].stem.replace(from,to);
  bad.push(['changed-source-'+i,qs]);
 }
 for(const [i,key,value] of [[0,'dailyEligible',true],[1,'masteryEligible',true],[2,'academicQA','approved'],[3,'teacherTaughtConfirmed',true],[4,'independentGradeCalibrated',true]]){
  const qs=copy();qs[i][key]=value;bad.push(['forged-approval-'+key,qs]);
 }
 {const qs=copy();qs[5].options[0].latex=qs[5].correctAnswerLatex;bad.push(['duplicate-choice',qs])}
 {const qs=copy();qs[6].options.find(o=>o.id!==qs[6].correctOptionId).errorPath='';bad.push(['missing-wrong-route',qs])}
 for(const [label,qs]of bad)assert.throws(()=>auditEightStemMaths(qs),undefined,label);
 assert.equal(bad.length,23);
});
