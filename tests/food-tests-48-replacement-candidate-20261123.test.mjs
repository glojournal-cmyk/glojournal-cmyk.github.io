// Source-based structural QA of 48 proposed replacements. Not teacher sign-off.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const draft=read('qa/food-tests-48-duplicate-replacements-draft-20261123.json');
const source=read('content/topics/bio-y8-food-tests.json');
const baseline=source.questions;
const cases=baseline.filter(q=>/bio-y8-food-tests-case-20261025-[1-4]-\d+$/.test(q.id));
const repeats=cases.filter(q=>/bio-y8-food-tests-case-20261025-[2-4]-\d+$/.test(q.id));
const replacements=draft.questions;
test('exactly 48 original duplicate IDs mapped one-for-one and original 143 IDs held',()=>{
 assert.equal(baseline.length,143);
 assert.equal(cases.length,64);
 assert.equal(repeats.length,48);
 assert.equal(replacements.length,48);
 assert.deepEqual(replacements.map(x=>x.sourceId),repeats.map(x=>x.id));
 assert.equal(new Set(replacements.map(x=>x.sourceId)).size,48);
 for(let i=0;i<48;i++){
  assert.equal(replacements[i].originalSourcePrompt,repeats[i].prompt);
  assert.equal(replacements[i].originalSourceAnswer,repeats[i].answer.accepted[0]);
  assert.equal(replacements[i].topicId,'bio-y8-food-tests');
 }
});
test('each replacement has a unique real pupil-facing stem and a single unambiguous string answer slot',()=>{
 assert.equal(new Set(replacements.map(x=>x.prompt.toLowerCase().replace(/\s+/g,' ').trim())).size,48);
 const distribution=[0,0,0,0];
 for(const row of replacements){
  assert.equal(row.format,'mc_single');
  assert.match(row.prompt,/\?/);
  assert.ok(row.scienceRationale?.length>25,row.sourceId);
  assert.equal(row.answer.mode,'choice');
  assert.equal(row.answer.totalMarks,1);
  assert.equal(row.options.length,4,row.sourceId);
  assert.equal(row.answer.accepted.length,1);
  assert.equal(row.options.filter(x=>x===row.answer.accepted[0]).length,1,row.sourceId);
  assert.equal(new Set(row.options.map(x=>x.toLowerCase().replace(/\s+/g,' ').trim())).size,4,row.sourceId);
  assert.equal(row.options[row.correctIndex],row.answer.accepted[0]);
  assert.equal(row.academicReview,'pending');
  assert.equal(row.distractorReview,'pending');
  assert.equal(row.approved,false);
  assert.equal(row.formalCreditEligible,false);
  assert.equal(row.curriculumReview,'TGS taught scope pending');
  distribution[row.correctIndex]++;
 }
 assert.deepEqual(distribution,[12,12,12,12]);
 assert.deepEqual(draft.keyPositions,{A:12,B:12,C:12,D:12});
});
test('replacement draft does not silently change original source/old scores or claim a release approval',()=>{
 assert.equal(draft.status,'academic-review-required');
 assert.equal(draft.approved,0);
 assert.equal(draft.formalCreditEligible,false);
 assert.equal(draft.sourceOriginalsPreserved,true);
 assert.ok(draft.not.includes('formal-credit approval'));
 const first=cases.filter(q=>/bio-y8-food-tests-case-20261025-1-\d+$/.test(q.id));
 assert.equal(first.length,16);
 const expectations=first.map(q=>q.answer.accepted[0]);
 assert.equal(new Set(expectations).size,16);
 const questionScope=source.questions.filter(x=>x.topicId==='bio-y8-food-tests');
 assert.equal(questionScope.length,143);
});

test('45 revised distractor sets and four ambiguous stems are documented; no scientific approval implied',()=>{
 assert.equal(draft.rewrittenDistractorSets.length,45);
 assert.equal(new Set(draft.rewrittenDistractorSets).size,45);
 assert.deepEqual(draft.qaOnlyAmbiguityRemediations,[
  'bio-y8-food-tests-case-20261025-3-1',
  'bio-y8-food-tests-case-20261025-4-13',
  'bio-y8-food-tests-case-20261025-4-15',
  'bio-y8-food-tests-case-20261025-4-16'
 ]);
 const map=new Map(replacements.map(q=>[q.sourceId,q]));
 assert.match(map.get('bio-y8-food-tests-case-20261025-3-1').prompt,/samples taken from two different bread types/i);
 assert.doesNotMatch(map.get('bio-y8-food-tests-case-20261025-4-15').prompt,/tastes sweet/i);
 assert.match(map.get('bio-y8-food-tests-case-20261025-4-16').prompt,/which claim goes beyond/i);
 for(const q of replacements){
  assert.equal(q.approved,false);
  assert.equal(q.formalCreditEligible,false);
 }
});


test('lipid emulsion dilution item is distinct from the pre-water-cloudiness item',()=>{
 const prior=replacements.find(q=>q.sourceId==='bio-y8-food-tests-case-20261025-2-7');
 const dilution=replacements.find(q=>q.sourceId==='bio-y8-food-tests-case-20261025-4-14');
 assert.match(prior.prompt,/cloudy before|already cloudy/i);
 assert.match(dilution.prompt,/2 mL of water and the other to 10 mL/i);
 assert.match(dilution.options[dilution.correctIndex],/equal measured volumes of extract and water/i);
 assert.doesNotMatch(dilution.prompt,/cloudy before water|cloudy before it is added/i);
 assert.equal(dilution.answer.accepted[0],dilution.options[0]);
 assert.ok(dilution.scienceRationale.includes('qualitative'));
 assert.equal(dilution.approved,false);
 assert.equal(dilution.formalCreditEligible,false);
});


test('equal-glucose extracts fair-temperature comparison contains no hidden concentration contradiction',()=>{
 const q=replacements.find(x=>x.sourceId==='bio-y8-food-tests-case-20261025-3-3');
 assert.match(q.prompt,/same glucose solution/i);
 assert.match(q.prompt,/equal Benedict's reagent/i);
 assert.ok(q.options.every(x=>!/lower-concentration extract/.test(x)));
 assert.equal(q.correctIndex,3);
 assert.match(q.answer.accepted[0],/same controlled bath temperature/i);
 assert.equal(q.approved,false);
 assert.equal(q.formalCreditEligible,false);
});


test('two cross-bank duplicate candidates now demand different practical reasoning than the 99-point pool',()=>{
 const c=new Map(replacements.map(q=>[q.sourceId,q]));
 const berry=c.get('bio-y8-food-tests-case-20261025-3-7');
 const repeats=c.get('bio-y8-food-tests-case-20261025-4-11');
 assert.match(berry.prompt,/already purple before Biuret/i);
 assert.match(berry.answer.accepted[0],/pigment may mask a Biuret colour change/i);
 assert.doesNotMatch(berry.prompt,/suitable negative control/i);
 assert.match(repeats.prompt,/Two tubes turn orange, but one remains blue/i);
 assert.match(repeats.answer.accepted[0],/Record all results.*repeat with fresh portions/i);
 assert.doesNotMatch(repeats.prompt,/brick-red/i);
 for(const q of [berry,repeats]){
  assert.equal(q.correctIndex,3);
  assert.equal(q.options[q.correctIndex],q.answer.accepted[0]);
  assert.equal(q.approved,false);
  assert.equal(q.formalCreditEligible,false);
  assert.equal(q.distractorReview,'pending');
 }
 assert.deepEqual(draft.crossPoolDuplicateReview.resolvedCandidates,[berry.sourceId,repeats.sourceId]);
 assert.equal(draft.crossPoolDuplicateReview.academicApprovals,0);
});
