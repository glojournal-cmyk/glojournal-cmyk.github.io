import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const review=read('qa/food-tests-15-typed-3-matching-content-adjudication-20261124.json');
const byId=new Map(bank.questions.map(q=>[q.id,q]));
test('all 15 typed questions, 88 explicit strings and 3 matching four-pair maps have science content verdicts but no release',()=>{
 assert.equal(bank.questions.length,143);
 assert.equal(review.typed.length,15);
 assert.equal(review.matching.length,3);
 assert.deepEqual(review.counts,{typedSourceQuestions:15,typedSourceStrings:88,typedScienceTargetsPass:15,typedAcceptedListContentPass:14,typedNeedsQualifiedAdjudication:1,acceptedNegativeStarchOverclaims:4,matchingSourceQuestions:3,matchingSciencePairMapsPass:3,matchingPairsChecked:12,independentQualifiedApproved:0});
 assert.equal(review.formalCreditEligible,false);
 assert.equal(review.independentQualifiedTeacherSignedOff,false);
 assert.equal(review.sourceEdited,false);
 let strings=0;
 for(const row of review.typed){
  const q=byId.get(row.sourceId);
  assert.ok(q,row.sourceId);
  assert.deepEqual(row.sourceAcceptedStrings,q.answer.accepted);
  assert.equal(row.prompt,q.prompt);
  assert.equal(row.scienceTargetVerdict,'AI_SCIENCE_CONTENT_PASS');
  assert.equal(row.independentQualifiedApproval,false);
  assert.equal(row.typedScorerUnseenFairnessApproved,false);
  assert.equal(canEarnFormalCredit(q),false);
  strings+=row.sourceAcceptedStrings.length;
 }
 assert.equal(strings,88);
 for(const row of review.matching){
  const q=byId.get(row.sourceId);
  assert.equal(q.format,'matching');
  assert.equal(row.sciencePairMappingVerdict,'AI_CONTENT_SCIENCE_PASS_4_OF_4_PAIRINGS');
  assert.equal(row.numberOfIndependentlyEarnedPairs,4);
  assert.deepEqual(row.pairs,q.answer.pairs);
  assert.equal(row.independentQualifiedApproval,false);
  assert.equal(row.pairwiseScoringReleaseApproved,false);
  assert.equal(canEarnFormalCredit(q),false);
 }
});
test('four over-absolute iodine-negative variants are explicitly flagged, without silently deleting pupil answers',()=>{
 const row=review.typed.find(x=>x.sourceId==='bio-y8-app-iodine-negative');
 assert.ok(row);
 assert.deepEqual(row.absoluteOverclaimStrings,[
  'no starch is present','starch is not present','starch is absent','no starch present'
 ]);
 assert.equal(row.acceptedListScientificFairnessVerdict,'REVISE_OVERABSOLUTE_NEGATIVE_WORDING');
 assert.equal(row.qaOnlyCautiousProposal.length,row.sourceAcceptedStrings.length-4);
 for(const text of row.qaOnlyCautiousProposal)assert.ok(row.sourceAcceptedStrings.includes(text));
 assert.equal(review.counts.typedAcceptedListContentPass,14);
 assert.equal(row.formalCreditEligible,false);
});
for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+': each original matching map can score independent 0,1,2,3,4 correct pairs',()=>{
  const src=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const a=src.indexOf('function B(e,t,n,r){'),b=src.indexOf('function ',a+30);
  assert.ok(a>0&&b>a&&b-a<12000);
  const score=new Function('L','I',src.slice(a,b)+'\nreturn B;')(
   q=>q.answer?.modelAnswer||'',q=>q.answer?.accepted||[]
  );
  for(const row of review.matching){
   const q=byId.get(row.sourceId),pairs=q.answer.pairs;
   assert.equal(pairs.length,4);
   for(let n=0;n<=4;n++){
    const response=Object.fromEntries(pairs.map((p,i)=>[
     p.left,i<n?p.right:pairs[(i+1)%4].right
    ]));
    const verdict=score(q,'responses','biology',{pairs:response});
    assert.equal(verdict.score,n,row.sourceId+' '+n);
    assert.equal(verdict.total,4,row.sourceId+' total');
    assert.equal(verdict.ok,n===4,row.sourceId+' full marks');
   }
  }
 });
}
