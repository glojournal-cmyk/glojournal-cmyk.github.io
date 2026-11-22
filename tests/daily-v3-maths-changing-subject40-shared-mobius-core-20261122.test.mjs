import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=n=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+n+'-20261122.json',import.meta.url),'utf8'));
const p=load('changing-subject40-shared-mobius-28-source-core');
const original=load('changing-subject40-independent-inverse-check');
const close=(a,b,label='')=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' vs '+b);
function normalize(f,p){
 if(['simple-rational','shifted-rational-original','shifted-rational-secondary'].includes(f)){
  const [s,a,b,c,d]=p;return [s*c+a,s*d+b,c,d];
 }
 if(f==='shifted-reciprocal'){const [s,a,b,c]=p;return [s*b,s*c+a,b,c]}
 if(f==='reciprocal-of-y'){const [s,a,b,c]=p;return [b,c,s*b,s*c+a]}
 if(f==='factor-fraction'){const [s,a,b,c,d]=p;return [s*c+a,s*d+a*b,c,d]}
 if(f==='nested-denominator'){const [s,a,b,c,d]=p;return [s*b+a,s*(b*d+c)+a*d,b,b*d+c]}
 return null;
}
function forwardOriginal(f,p,x){
 if(['simple-rational','shifted-rational-original','shifted-rational-secondary'].includes(f)){
  const [s,a,b,c,d]=p;return s+(a*x+b)/(c*x+d);
 }
 if(f==='shifted-reciprocal'){const [s,a,b,c]=p;return s+a/(b*x+c)}
 if(f==='reciprocal-of-y'){const [s,a,b,c]=p;return 1/(s+a/(b*x+c))}
 if(f==='factor-fraction'){const [s,a,b,c,d]=p;return s+a*(x+b)/(c*x+d)}
 if(f==='nested-denominator'){const [s,a,b,c,d]=p;return s+a/(b+c/(x+d))}
 throw Error('not Möbius '+f);
}
test('All 28 original fractional-linear items independently reduce to Möbius inverses; seven source template IDs alone do not prove independent Mastery concepts',()=>{
 assert.equal(p.counts.originalQuestions,40);
 assert.equal(p.counts.sourceItemsAlgebraicallyMOBIUS,28);
 assert.equal(p.counts.sourceItemsPrincipalRoot,12);
 assert.equal(p.counts.independentMasteryDistinctnessCertification,0);
 assert.equal(p.counts.externalAQAChallengeCertification,0);
 assert.equal(p.sharedCoreOriginals.length,28);
 assert.equal(new Set(p.sharedCoreOriginals.map(q=>q.sourceTemplate)).size,7);
 const by=new Map(original.questions.map(q=>[q.sourceId,q]));
 let checks=0;
 for(const row of p.sharedCoreOriginals){
  const q=by.get(row.originalId);assert.ok(q);
  const [A,B,C,D]=normalize(q.verifiedStructuralFamily,q.sourceParameters);
  assert.deepEqual([A,B,C,D],Object.values(row.normalizedRationalCoefficients));
  const det=A*D-B*C;
  assert.notEqual(det,0);
  close(det,row.nonzeroDeterminant,row.originalId+' determinant');
  assert.equal(row.independentMasteryConceptDistinctnessConfirmed,false);
  assert.equal(row.independentGcseGrade7PlusConfirmed,false);
  assert.equal(row.studentCreditAllowed,false);
  for(const x of [-11,-5,-3,-1,0,1,3,9,17]){
   if(Math.abs(C*x+D)<=1e-8)continue;
   const a=forwardOriginal(q.verifiedStructuralFamily,q.sourceParameters,x);
   if(!Number.isFinite(a))continue;
   close((A*x+B)/(C*x+D),a,row.originalId+' x='+x);
   checks++;
  }
 }
 assert.ok(checks>=210,'independent Möbius forward equation comparisons: '+checks);
});
test('Other 12 original equations require principal-square-root domain reasoning, not mistaken Möbius grouping',()=>{
 assert.equal(p.rootBranchOriginals.length,12);
 const names=Object.fromEntries(p.rootBranchOriginals.reduce((m,q)=>
  m.set(q.structure,(m.get(q.structure)||0)+1),new Map()));
 assert.deepEqual(names,{AFFINE_PRINCIPAL_SQUARE_ROOT:4,PRINCIPAL_ROOT_OF_RECIPROCAL:4,PRINCIPAL_ROOT_OF_MOBIUS:4});
 for(const r of p.rootBranchOriginals)assert.equal(r.approved,false);
});
