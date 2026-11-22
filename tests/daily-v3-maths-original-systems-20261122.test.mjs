import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectMathsV31Daily} from '../assets/math-study/daily-v31-selector.js';

const source = JSON.parse(readFileSync(new URL(
  '../qa-staging/math-v311-simultaneous-original-system-collisions-20261122.json',
  import.meta.url), 'utf8'));
const groups = source.questionPairGroups;

test('Source-grounded exact equations manifest: original system solutions and unique source IDs', () => {
  assert.equal(source.status, 'REVIEW_ONLY_NOT_APPROVED');
  assert.equal(groups.length, 4);
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

test('Original Q161 and Q169 are different source IDs but identical equation givens: fail closed same day',()=>{
  const [a,b]=groups[0].ids;
  const two=fixture.map(q=>{
    if(q.topicId!=='math-y9-simultaneous-equations')return q;
    return {...q,id:q.id.endsWith('-0')?a:b,
      templateId:q.id.endsWith('-0')?'V3-SIM-G7-SOLVE-DERIVED':'V2-SIMULTANEOUS-3',
      conceptFamilyId:groups[0].sameSystemKey};
  });
  assert.equal(two.filter(q=>q.topicId==='math-y9-simultaneous-equations').length,2);
  assert.equal(new Set(two.map(q=>q.templateId)).size,10);
  const denied=selectMathsV31Daily({approvedQuestions:two,day:'2026-11-23'});
  assert.equal(denied.ready,false,'must not count the reused source equations as two unique new concepts');
  assert.equal(denied.questions.length,0);
  // A truly separate, independently reviewed concept label restores enough supply in
  // the synthetic fixture. This is NOT teacher approval for either original source question.
  const separatelyReviewed=two.map(q=>q.id===b?{...q,conceptFamilyId:'independent-different-system-fixture'}:q);
  const allowed=selectMathsV31Daily({approvedQuestions:separatelyReviewed,day:'2026-11-23'});
  assert.equal(allowed.ready,true,allowed.issues.join(','));
  assert.equal(allowed.questions.length,10);
  assert.equal(allowed.diagnostics.previousDayConceptFamilyRepeats,0);
  assert.deepEqual(allowed.diagnostics.bandCounts,{'G7':4,'G8':4,'G8-9':2});
  assert.ok(Object.values(allowed.diagnostics.topics).every(n=>n===2));
});

test('Original source remains fail-closed with missing reviewer approval despite correct semantic metadata',()=>{
  const notApproved=fixture.map(q=>({...q,academicQA:'pending',taughtVerified:false}));
  const res=selectMathsV31Daily({approvedQuestions:notApproved,day:'2026-11-23'});
  assert.equal(res.ready,false);
  assert.deepEqual(res.questions,[]);
});
