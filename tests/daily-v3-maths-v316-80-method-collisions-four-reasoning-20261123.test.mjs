import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML, mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';
const read=name=>JSON.parse(readFileSync(new URL('../qa-staging/'+name,import.meta.url),'utf8'));
const bank=read('math-v311-reviewed-200.json');
const family=read('math-v316-indices-standard-80-method-families-and-mastery-collisions-20261123.json');
const drafts=read('math-v316-indices009-037-standard029-021-four-distinct-reasoning-candidates-20261123.json');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const sci=s=>{
 const m=String(s).replace(/\s+/g,'').match(/^(-?\d+(?:\.\d+)?)\\times10\^(?:\{(-?\d+)\}|(-?\d+))$/);
 if(m)return Number(m[1])*10**Number(m[2]??m[3]);
 if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);
 throw Error('Unrecognised scientific/numeric option '+s);
};
const units=s=>[...s.matchAll(/(\d+(?:\.\d+)?)\\times\s*10\^(?:\{(-?\d+)\}|(-?\d+))/g)].map(m=>Number(m[1])*10**Number(m[2]??m[3]));
const candidate=(suffix)=>drafts.questions.find(q=>q.sourceId.endsWith(suffix));

test('80 actual Indices and Standard Form source questions grouped by stated operational method, all release-denied',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(q=>q.dailyEligible).length,0);
 assert.equal(family.kind,'V316_80_SOURCE_MANUAL_METHOD_FAMILY_PROVISIONAL_MASTERY_COLLISION_REGISTER_NO_CREDIT');
 assert.equal(family.sourceBankUntouched,true);
 assert.equal(family.totals.reviewedQuestions,80);
 assert.equal(family.totals.provisionalTechniqueFamilies,32);
 assert.equal(family.totals.indicesMethodFamilies,13);
 assert.equal(family.totals.standardMethodFamilies,19);
 assert.equal(family.totals.highlightedPotentialCrossTemplateCollisions,6);
 assert.equal(family.totals.independentlyCertifiedMasteryConcepts,0);
 assert.equal(family.totals.grade7PlusApprovals,0);
 assert.equal(family.totals.dailyEnabled,0);
 assert.equal(family.totals.masteryEnabled,0);
 const source=new Map(bank.questions.filter(q=>q.topicId==='math-y9-indices'||q.topicId==='math-y9-standard-form').map(q=>[q.sourceId,q]));
 const seen=new Set(),names=new Set();
 for(const g of family.families){
  assert.ok(!names.has(g.provisionalTechniqueId));names.add(g.provisionalTechniqueId);
  assert.equal(g.sourceIds.length,g.sourceCount);
  assert.ok(g.sourceCount>=1&&g.sourceCount<=4);
  assert.equal(g.finalPedagogicalConceptEquivalence,'UNVERIFIED');
  assert.equal(g.individualGrade7PlusCertified,false);
  assert.equal(g.taughtSubskillVerified,false);
  assert.equal(g.studentDailyEligible,false);
  assert.equal(g.masteryEligible,false);
  assert.equal(g.numericVariantsMustNotCreateIndependentMasteryPoints,true);
  assert.equal(g.sourceRevisions.length,g.sourceIds.length);
  for(const row of g.sourceRevisions){
   const sourceQ=source.get(row.sourceId);
   assert.ok(sourceQ&&!seen.has(row.sourceId));
   seen.add(row.sourceId);
   assert.ok(g.sourceIds.includes(row.sourceId));
   assert.equal(sourceQ.revisionId,row.sourceRevisionId);
   assert.equal(sourceQ.correctOptionId,row.correctOptionId);
   assert.equal(sourceQ.dailyEligible,false);
   assert.equal(sourceQ.topicId,g.topicId);
  }
 }
 assert.equal(seen.size,80);
 assert.equal(names.size,32);
 for(const c of family.potentialTechniqueCollisions){
  assert.ok(names.has(c.techniqueA)&&names.has(c.techniqueB)&&c.techniqueA!==c.techniqueB);
  assert.equal(c.independentlyVerifiedEquivalent,false);
  assert.equal(c.allowedToMintSeparateMasteryCredit,false);
  assert.ok(c.reviewQuestion.length>45);
 }
 assert.equal(family.potentialTechniqueCollisions.length,6);
});
test('four distinct stem-linked Maths drafts: six unique answers and 40 native formula renderings, never live scoring',()=>{
 assert.equal(drafts.totals.newDrafts,4);
 assert.equal(drafts.totals.options,24);
 assert.equal(drafts.totals.wrongRationales,20);
 assert.equal(drafts.totals.formalAcademicApproved,0);
 assert.equal(drafts.totals.dailyEnabled,0);
 assert.equal(drafts.totals.masteryEnabled,0);
 assert.deepEqual(drafts.questions.map(q=>q.sourceId.match(/(INDICES|STANDARD_FORM)-(\d+)$/).slice(1).join('-')),
 ['INDICES-009','INDICES-037','STANDARD_FORM-029','STANDARD_FORM-021']);
 let fields=0,wrong=0;const source=new Map(bank.questions.map(q=>[q.sourceId,q]));
 for(const q of drafts.questions){
  const orig=source.get(q.sourceId);assert.ok(orig);
  assert.equal(q.replacesOriginalRevisionId,orig.revisionId);
  assert.equal(q.topicId,orig.topicId);
  assert.notEqual(q.stem,orig.stem);
  assert.equal(orig.dailyEligible,false);
  assert.equal(q.academicQA,'pending');
  assert.equal(q.independentGrade7PlusCertification,false);
  assert.equal(q.teacherTaughtConfirmed,false);
  assert.equal(q.empiricalDistractorVerification,false);
  assert.equal(q.dailyEligible,false);
  assert.equal(q.masteryEligible,false);
  assert.equal(q.options.length,6);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId).latex);
  assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);fields++;
  for(const o of q.options){
   assert.match(mathsOptionHTML(o),/^<math xmlns=/);fields++;
   if(o.id!==q.correctOptionId){wrong++;assert.ok(o.errorPath?.length>36)}
  }
  assert.equal(q.workedSolutionSteps.length,3);
  for(const line of q.workedSolutionSteps){assert.match(mathsRichTextHTML(line),/<math xmlns=/);fields++}
 }
 assert.equal(fields,40);assert.equal(wrong,20);
});
test('re-derive four correct answers from constraints, without trusting stored key; 24 distinct options',()=>{
 const i009=candidate('INDICES-009'),i037=candidate('INDICES-037'),s029=candidate('STANDARD_FORM-029'),s021=candidate('STANDARD_FORM-021');
 assert.ok(i009&&i037&&s029&&s021);
 assert.ok(i009.stem.includes('\\frac{(xy^{-2})^2}{x^{-1}y}=2^{-1}'));
 const firstBounds=i009.stem.match(/from \$(\d+)\$ to \$(\d+)\$/);assert.ok(firstBounds);
 const [min,max]=firstBounds.slice(1).map(Number);
 const productExponent=Number(i009.stem.match(/xy=2\^(\d+)/)?.[1]);
 const targetExponent=Number(i009.stem.match(/\}=2\^\{-(\d+)\}/)?.[1]);
 assert.equal(productExponent,5);assert.equal(targetExponent,1);
 const solutions=[];
 for(let a=min;a<=max;a++)for(let b=min;b<=max;b++)if(a+b===productExponent&&3*a-5*b===-targetExponent)solutions.push({a,b,result:2**(2*a+b)});
 assert.deepEqual(solutions,[{a:3,b:2,result:256}]);
 assert.deepEqual(i009.options.filter(o=>near(sci(o.latex),solutions[0].result)).map(o=>o.id),['B']);
 assert.deepEqual(i009.options.map(o=>sci(o.latex)),[128,256,512,32,1024,64]);
 const m=i037.stem.match(/(\d+)\\le n\\le(\d+)/);assert.ok(m);
 const [lo,hi]=m.slice(1).map(Number);
 let cubes=0,squares=0;const cubesN=[];
 for(let n=lo;n<=hi;n++){
  const T=Math.sqrt(2**(2*n+6))*(16**(n-1))/(8**(n-2)),pow=2*n+5;
  assert.ok(near(T,2**pow));
  if(pow%3===0){cubes++;cubesN.push(n)}
  if(pow%2===0)squares++;
 }
 assert.deepEqual(cubesN,[2,5,8]);
 assert.deepEqual([cubes,squares],[3,0]);
 assert.deepEqual(i037.options.filter(o=>{
  const m=o.latex.match(/^\((\d+),(\d+)\)$/);assert.ok(m);
  return Number(m[1])===cubes&&Number(m[2])===squares;
 }).map(o=>o.id),['C']);
 const v=units(s029.stem);assert.deepEqual(v,[8e8,4e7,2e7,1.5e7,2e7]);
 const [starting,gain,loss,minPer,maxPer]=v,net=starting+gain-loss;
 const possible=[];for(let N=1;N<=100;N++)if(net%N===0&&net/N>=minPer&&net/N<=maxPer)possible.push(N);
 assert.deepEqual(possible,[41,50]);
 const maxN=Math.max(...possible);
 assert.equal(maxN,50);
 assert.deepEqual(s029.options.filter(o=>sci(o.latex)===maxN).map(o=>o.id),['C']);
 assert.deepEqual(s029.options.map(o=>sci(o.latex)),[54,41,50,52,55,40]);
 const readings=units(s021.stem);assert.deepEqual(readings,[6e5,4e5]);
 const bound=s021.stem.match(/with \$0\\le p\\le(\d+)\$/);assert.ok(bound);
 const pMax=Number(bound[1]);
 const low=Number(s021.stem.match(/between \*\*(\d+)%/)?.[1]);
 const high=Number(s021.stem.match(/and (\d+)% greater/)?.[1]);
 assert.equal(low,25);assert.equal(high,35);
 const accepted=[];for(let p=0;p<=pMax;p++){const corrected=readings[0]*(1-p/100),increase=(corrected/readings[1]-1)*100;
  if(increase>=low-1e-9&&increase<=high+1e-9)accepted.push(p)}
 assert.deepEqual(accepted,[10,11,12,13,14,15,16]);
 assert.deepEqual(s021.options.filter(o=>sci(o.latex)===accepted.length).map(o=>o.id),['B']);
 assert.deepEqual(s021.options.map(o=>sci(o.latex)),[6,7,8,10,16,17]);
});
test('fail-closed adversarial conceptual changes detect bad I037 upper bound and altered S029 particle amount',()=>{
 const upper=Array.from({length:8},(_,n)=>n);
 const cubeCount=upper.filter(n=>(2*n+5)%3===0).length;
 assert.equal(cubeCount,2);
 assert.notEqual(cubeCount,3);
 const mutatedNet=8e8+3e7-2e7,allowed=[];
 for(let N=1;N<=100;N++)if(mutatedNet%N===0&&mutatedNet/N>=1.5e7&&mutatedNet/N<=2e7)allowed.push(N);
 assert.equal(Math.max(...allowed),54);
 assert.notEqual(Math.max(...allowed),50);
 const pValues=[];for(let p=0;p<=20;p++){
  const increase=((6e5*(1-p/100))/4e5-1)*100;
  if(increase>=25&&increase<=32)pValues.push(p);
 }
 assert.deepEqual(pValues,[12,13,14,15,16]);
 assert.notEqual(pValues.length,7);
});
