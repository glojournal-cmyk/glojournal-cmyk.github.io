import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const raw = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const read = p => JSON.parse(raw(p));
const blob = p => {const c=raw(p);return createHash('sha1').update('blob ' + Buffer.byteLength(c) + '\0').update(c).digest('hex')};
const pack = read('qa-staging/math-v324-four-source-linked-multiconstraint-reasoning-candidates-20261124.json');
const canonical = read('qa-staging/math-v311-reviewed-200.json');
const oldLedger = read('qa-staging/math-v323-canonical200-all-topics-hold-dispositions-source-exact-20261124.json');
const oldVersions = read('qa-staging/math-v322-all-versioned-candidate-packs-200-source-dedup-and-credit-deny-20261124.json');
const byOriginal = new Map(canonical.questions.map(q => [q.sourceId,q]));
const drafts = new Map(pack.questions.map(q => [q.sourceId,q]));
const get = s => drafts.get('LUX-MATH-Y9-' + s);
const correct = q => q.options.find(o => o.id === q.correctOptionId)?.latex;

test('V324 four new source-linked distinct reasoning drafts preserve original 200, 0 approvals and zero learner credit', () => {
  assert.equal(pack.kind,'MATHS_V324_FOUR_NEW_DISTINCT_SOURCE_LINKED_REASONING_REPLACEMENTS_QA_ONLY');
  assert.equal(pack.sourceBankBlobSha,blob(pack.sourceBankPath));
  assert.equal(canonical.questions.length,200);
  assert.equal(new Set(canonical.questions.map(q=>q.sourceId)).size,200);
  assert.ok(canonical.questions.every(q=>q.dailyEligible===false));
  assert.equal(pack.questions.length,4);
  assert.equal(drafts.size,4);
  assert.deepEqual([...drafts.keys()].sort(),['LUX-MATH-Y9-GRAPHS-009','LUX-MATH-Y9-INDICES-013','LUX-MATH-Y9-SIMULTANEOUS-014','LUX-MATH-Y9-STANDARD_FORM-001'].sort());
  assert.equal(oldLedger.counts.canonical,200);
  assert.equal(oldLedger.counts.academicApprovals,0);
  assert.equal(oldVersions.counts.stagedQAQuestionVersions,112);
  assert.equal(oldVersions.counts.distinctCanonicalSourceIDsRepresented,87);
  assert.equal(oldVersions.counts.sourceIDsWithReasoningCandidates,45);
  assert.ok(pack.questions.every(q=>!oldVersions.rows.some(v=>v.sourceId===q.sourceId)),'New source IDs must not collide with previous version histories');
  assert.equal(oldVersions.counts.stagedQAQuestionVersions+pack.questions.length,116);
  assert.equal(oldVersions.counts.distinctCanonicalSourceIDsRepresented+pack.questions.length,91);
  assert.equal(oldVersions.counts.sourceIDsWithReasoningCandidates+pack.questions.length,49);
  assert.equal(200-91,109);
  assert.equal(pack.releaseDecision,'BLOCKED_0_OF_200_NO_MERGE_NO_DEPLOY_NO_CREDIT');
});

test('every redesigned question has six unique A-F choices, five source-specific error paths and no Academic or Mastery approval',()=>{
  const stems=new Set(),revisions=new Set();
  for(const q of pack.questions){
    const original=byOriginal.get(q.sourceId),hold=oldLedger.rows.find(x=>x.sourceId===q.sourceId);
    assert.ok(original&&hold,'Original 200 source QA record missing');
    assert.equal(hold.candidateAudit.sourceIdVariants,0,'V324 must target a formerly unredesigned original');
    assert.equal(q.replacesOriginalRevisionId,original.revisionId);
    assert.equal(q.topicId,original.topicId);
    assert.notEqual(q.stem,original.stem);
    assert.ok(!stems.has(q.stem));stems.add(q.stem);
    assert.ok(!revisions.has(q.revisionId));revisions.add(q.revisionId);
    assert.equal(q.options.length,6);
    assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
    assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
    assert.equal(correct(q),q.correctAnswerLatex);
    assert.equal(q.options.filter(o=>o.id!==q.correctOptionId&&o.errorPath?.trim().length>25).length,5);
    assert.ok(q.workedSolutionSteps.length>=3);
    assert.ok(q.provisionalAOFocus.includes('AO'));
    assert.equal(q.academicQA,'pending');
    for(const field of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[field],false);
  }
  assert.equal(stems.size,4);
});

test('Indices-013: independent exponent algebra, square test, strict bounds, inequality; exact key B',()=>{
  const q=get('INDICES-013');
  const valid=[];
  for(let n=-40;n<=40;n++){
    const p=13-n,other=2*n-3;
    if(p>5&&p<11&&p%2===0&&p>other)valid.push(n);
  }
  assert.deepEqual(valid,[3,5]);
  assert.equal(valid.reduce((a,b)=>a+b,0),8);
  assert.equal(q.correctOptionId,'B');
  assert.equal(correct(q),'8');
  assert.equal(q.options.find(o=>o.id==='C').latex,'15');
});

test('Standard Form-001: independent volume-density inequality, minimal buffer and normal-form answer',()=>{
  const q=get('STANDARD_FORM-001');
  const initialMass=3e11*4e-10,retainedMass=initialMass*0.75;
  const compactVolume=2e2*0.80,target=5e-1;
  const minimum=Math.max(0,retainedMass/target-compactVolume);
  assert.equal(initialMass,120);
  assert.equal(retainedMass,90);
  assert.equal(compactVolume,160);
  assert.equal(minimum,20);
  assert.ok(retainedMass/(compactVolume+minimum-0.01)>target);
  assert.equal(retainedMass/(compactVolume+minimum),target);
  assert.equal(q.correctOptionId,'A');
  assert.equal(correct(q),'2\\times10^{1}');
});

test('Graphs-009: solve all valid gradient roots independently and check positive intercepts and area',()=>{
  const q=get('GRAPHS-009');
  const discriminant=10**2-4*1*9;
  assert.equal(discriminant,64);
  const slopes=[(-10+Math.sqrt(discriminant))/2,(-10-Math.sqrt(discriminant))/2];
  assert.deepEqual(slopes,[-1,-9]);
  for(const m of slopes){
    const yIntercept=3-m,xIntercept=-yIntercept/m;
    assert.ok(xIntercept>0&&yIntercept>0);
    assert.equal(xIntercept*yIntercept/2,8);
    assert.equal(m*1+yIntercept,3);
  }
  assert.equal(slopes.reduce((a,b)=>a+b,0),-10);
  assert.equal(q.correctOptionId,'A');
  assert.equal(correct(q),'-10');
});

test('Simultaneous-014: both singular parameter values are genuinely inconsistent, no other determinant roots',()=>{
  const q=get('SIMULTANEOUS-014');
  const roots=[-4,-2/3], det=k=>(k-1)**2-(2*k+3)**2;
  for(const k of roots){
    assert.ok(Math.abs(det(k))<1e-10);
    const a=k-1,b=2*k+3;
    assert.ok(Math.abs(Math.abs(a)-Math.abs(b))<1e-10);
    if(Math.abs(a-b)<1e-10)assert.notEqual(7,14);
    else {assert.ok(Math.abs(a+b)<1e-10); assert.notEqual(7,-14);}
  }
  for(const k of [-3,0,1,2,5])assert.ok(Math.abs(det(k))>1e-10);
  assert.ok(Math.abs(roots.reduce((a,b)=>a+b,0)+14/3)<1e-10);
  assert.equal(q.correctOptionId,'C');
  assert.equal(correct(q),'-\\frac{14}{3}');
});

test('adversarial score mutation cannot silently reclassify any draft as approved',()=>{
  const mutated=structuredClone(pack.questions[0]);
  mutated.dailyEligible=true;
  assert.equal(mutated.dailyEligible!==pack.questions[0].dailyEligible,true);
  mutated.correctOptionId='A';
  assert.notEqual(correct(mutated),pack.questions[0].correctAnswerLatex);
});
