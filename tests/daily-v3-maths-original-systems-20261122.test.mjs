import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectMathsV31Daily} from '../assets/math-study/daily-v31-selector.js';
import {verifyMathDailyAssignment} from '../assets/math-study/daily-v31-formal-submission.js';
import {VERIFIED_MATHS_SYSTEM_COLLISIONS,verifiedSourceSystemKeyForMathsId} from '../assets/math-study/math-v311-original-system-collisions.js';

const source = JSON.parse(readFileSync(new URL(
  '../qa-staging/math-v311-simultaneous-original-system-collisions-20261122.json',
  import.meta.url), 'utf8'));
const groups = source.questionPairGroups;

test('Source-grounded exact equations manifest: original system solutions and unique source IDs', () => {
  assert.equal(source.status, 'REVIEW_ONLY_NOT_APPROVED');
  assert.equal(groups.length, 4);
  assert.deepEqual(VERIFIED_MATHS_SYSTEM_COLLISIONS,groups.map(g=>({sameSystemKey:g.sameSystemKey,ids:g.ids})));
  assert.equal(verifiedSourceSystemKeyForMathsId('LUX-MATH-Y9-INDICES-005'),null);
  const allIDs = [];
  for (const group of groups) {
    assert.ok(group.ids.length >= 2);
    assert.ok(group.ids.every(x => /^LUX-MATH-Y9-SIMULTANEOUS-\d{3}$/.test(x)));
    allIDs.push(...group.ids);
    const m = group.sameSystemKey.match(/^(-?\d+)x([+-]\d+)y=(-?\d+)__(-?\d+)x([+-]\d+)y=(-?\d+)$/);
    assert.ok(m, 'This exact mathematical source signature is parseable');
    const nums=m.slice(1).map(Number),[x,y]=group.xy;
    assert.equal(nums[0]*x + nums[1]*y,nums[2]);
    assert.equal(nums[3]*x + nums[4]*y,nums[5]);
  }
  assert.equal(new Set(allIDs).size,9,'four groups comprise nine original source IDs');
});

const topics=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
  'math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
const topicBands=[['G8','G8-9'],['G8','G8-9'],['G7','G8'],['G7','G8'],['G7','G7']];
const fixture=topics.flatMap((topicId,t)=>topicBands[t].map((difficultyTarget,j)=>({
  id:'synthetic-review-only-'+t+'-'+j,subject:'maths',year:9,topicId,difficultyTarget,
  templateId:'synthetic-template-'+t+'-'+j,conceptFamilyId:'synthetic-concept-'+t+'-'+j,
  academicQA:'approved',taughtVerified:true,mathDailyEnabled:true,renderRequired:true,
  qaSourceStatus:'SYNTHETIC_TEST_ONLY',
  options:['A','B','C','D','E','F'].map(id=>({id,text:id}))
})));

test('Exact duplicate givens block same-day even when forged concept labels differ',()=>{
  const [a,b]=groups[0].ids;
  const two=fixture.map(q=>q.topicId==='math-y9-simultaneous-equations'?{
    ...q,id:q.id.endsWith('-0')?a:b,
    templateId:q.id.endsWith('-0')?'V3-SIM-G7-SOLVE-DERIVED':'V2-SIMULTANEOUS-3',
    // Deliberately *different* labels: the original-equations guard is independent.
    conceptFamilyId:'reviewer-mislabel-'+q.id
  }:q);
  assert.equal(new Set(two.map(q=>q.templateId)).size,10);
  assert.equal(new Set(two.map(q=>q.conceptFamilyId)).size,10);
  assert.equal(verifiedSourceSystemKeyForMathsId(a),verifiedSourceSystemKeyForMathsId(b),
    'actual PDF equations collide even when labels are wrong');
  const denied=selectMathsV31Daily({approvedQuestions:two,day:'2026-11-23'});
  assert.equal(denied.ready,false,'must block the original repeated system despite divergent concept metadata');
  assert.deepEqual(denied.questions,[]);
  // The two ORIGINAL source IDs are both blocked by grade triage even if they
  // carry forged review metadata. Use distinct synthetic IDs for positive supply.
  const repairedFixture=two.map(q=>q.id===a||q.id===b?{...q,id:'synthetic-repaired-'+q.id}:q);
  const allowed=selectMathsV31Daily({approvedQuestions:repairedFixture,day:'2026-11-23'});
  assert.equal(allowed.ready,true,allowed.issues.join(','));
  assert.equal(allowed.questions.length,10);
  assert.deepEqual(allowed.diagnostics.bandCounts,{'G7':4,'G8':4,'G8-9':2});
});

test('Previously used original equation system blocks another source ID on later days',()=>{
  const [a,b]=groups[1].ids;
  const two=fixture.map(q=>q.topicId==='math-y9-simultaneous-equations'&&q.id.endsWith('-0')?{
    ...q,id:b
  }:q);
  const history=[{date:'2026-11-22',questionIds:[a],templateIds:['old-different-template']}];
  const denied=selectMathsV31Daily({approvedQuestions:two,day:'2026-11-23',history});
  assert.equal(denied.ready,false,'the equivalent equation has already been tested');
  const fresh=two.map(q=>q.id===b?{...q,id:'synthetic-nonduplicated-system'}:q);
  const allowed=selectMathsV31Daily({approvedQuestions:fresh,day:'2026-11-23',history});
  assert.equal(allowed.ready,true,allowed.issues.join(','));
});

test('Formal grading boundary also rejects exact original equations even with different labels',()=>{
  const [a,b]=groups[0].ids;
  const approved=fixture.map(q=>{
    const sourceId=q.topicId==='math-y9-simultaneous-equations'?(q.id.endsWith('-0')?a:b):q.id;
    return {...q,id:sourceId,correctOptionId:'A',sourceRef:'synthetic',qaReviewer:'synthetic',
      mathsChecker:'synthetic',conceptFamilyEvidence:'synthetic',conceptFamilyReviewer:'synthetic',
      options:q.options.map(o=>({...o,latex:o.id,misconception:o.id==='A'?'':'synthetic mistake rationale'}))};
  });
  const task={id:'maths-daily',dailyV3:true,supplyBlocked:false,
    planDate:'2026-11-23',assignedYear:9,assignedSubject:'maths',
    approvedQuestionIds:approved.map(q=>q.id),
    approvedCorrectOptionByQuestion:Object.fromEntries(approved.map(q=>[q.id,q.correctOptionId])),
    approvedConceptByQuestion:Object.fromEntries(approved.map(q=>[q.id,q.conceptFamilyId]))};
  const check=verifyMathDailyAssignment(task,approved,'2026-11-23');
  assert.equal(check.valid,false);
  assert.ok(check.issues.some(issue=>issue.startsWith('repeated-original-equation-system:')),
    check.issues.join(','));
});

test('Original source remains fail-closed with missing reviewer approval despite correct semantic metadata',()=>{
  const notApproved=fixture.map(q=>({...q,academicQA:'pending',taughtVerified:false}));
  const res=selectMathsV31Daily({approvedQuestions:notApproved,day:'2026-11-23'});
  assert.equal(res.ready,false);
  assert.deepEqual(res.questions,[]);
});
