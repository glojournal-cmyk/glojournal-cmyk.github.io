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


test('Benedict final-colour comparison fixes an alternative endpoint-method ambiguity',()=>{
 const q=replacements.find(x=>x.sourceId==='bio-y8-food-tests-case-20261025-3-4');
 assert.match(q.prompt,/final colour after five minutes/i);
 assert.match(q.prompt,/30 seconds.*five minutes/i);
 assert.match(q.answer.accepted[0],/same heating duration/i);
 assert.match(q.options[3],/first changes colour/i);
 assert.match(q.scienceRationale,/fixed period/i);
 assert.equal(q.correctIndex,2);
 assert.equal(q.approved,false);
 assert.equal(q.formalCreditEligible,false);
});

test('ethanol test wording distinguishes a specified two-stage method from universal no-flame safety',()=>{
 const byId=s=>replacements.find(x=>x.sourceId==='bio-y8-food-tests-case-20261025-'+s);
 for(const s of ['2-7','3-13','4-14']){
  assert.match(byId(s).prompt,/two-stage ethanol/i,s);
  assert.equal(byId(s).approved,false,s);
 }
 const safety=byId('4-2');
 assert.match(safety.answer.accepted[0],/Do not heat ethanol/i);
 assert.match(safety.answer.accepted[0],/instructed ethanol-and-water emulsion method/i);
 assert.match(safety.scienceRationale,/protocol must follow the method taught/i);
 assert.doesNotMatch(safety.answer.accepted[0],/then add the clear extract to water/i);
 assert.equal(safety.correctIndex,0);
 assert.equal(safety.formalCreditEligible,false);
});

test('26 cross-pool scientific skill overlap cases cannot claim separate Daily Mastery evidence',()=>{
 const reg=read('qa/food-tests-48-vs-99-skill-overlap-20261124.json');
 const structured=read('qa/food-tests-structured-99-point-review-candidate-20261122.json');
 const preview=read('qa/food-tests-143-revised-preview-20261123.json');
 const points=structured.items.flatMap(x=>x.parts);
 const lookup=new Map(replacements.map(x=>[x.sourceId,x]));
 const previewById=new Map(preview.questions.map(x=>[x.id,x]));
 assert.equal(reg.scope.replacementMCQs,48);
 assert.equal(reg.scope.structuredPoints,99);
 assert.equal(reg.scope.provisionallyOverlappingReplacementQuestions,26);
 assert.equal(reg.scope.distinctStructuredPointIndicesFlagged,45);
 assert.equal(reg.scope.notYetClassifiedReplacements,22);
 assert.equal(reg.overlapRows.length,26);
 assert.equal(reg.remainingReplacementIDs.length,22);
 assert.equal(reg.allowedToModifyDailySelector,false);
 assert.equal(reg.scope.approved,0);
 assert.equal(reg.releases,'BLOCKED');
 assert.equal(new Set(reg.overlapRows.map(x=>x.replacementId)).size,26);
 assert.equal(new Set(reg.overlapRows.flatMap(x=>x.sourcePointIndices)).size,45);
 for(const row of reg.overlapRows){
  const original=lookup.get(row.replacementId);
  const pv=previewById.get(row.replacementId);
  assert.ok(original,row.replacementId);
  assert.ok(pv,row.replacementId);
  assert.equal(row.replacementPrompt,original.prompt);
  assert.equal(row.dailyConceptGroup,null);
  assert.equal(pv.dailyConceptGroup,null);
  assert.equal(row.previewMappingStatus,'PENDING_NEW_SKILL_GROUP_REVIEW');
  assert.equal(pv.reviewDraft.dailyConceptMappingStatus,'PENDING_NEW_SKILL_GROUP_REVIEW');
  assert.equal(row.formalCreditEligible,false);
  assert.equal(row.qualifiedIndependentSignoff,false);
  assert.equal(original.approved,false);
  assert.equal(original.formalCreditEligible,false);
  assert.deepEqual(row.sourcePointIds,row.sourcePointIndices.map(n=>points[n-1].pointId));
  assert.deepEqual(row.sourcePointConcepts,row.sourcePointIndices.map(n=>points[n-1].concept));
  assert.ok(row.sourcePointIndices.every(n=>points[n-1].approved===false));
 }
 for(const id of reg.remainingReplacementIDs)assert.ok(lookup.has(id));
 assert.equal(draft.approved,0);
 assert.equal(structured.approved,0);
});


test('all 64 original four-test result rows agree with four reagent signals, but remain academically held',()=>{
 const positive=['starch','reducing sugar','protein','lipid'];
 const seen=new Map();
 for(const q of cases){
  const signals=[
   /iodine blue-black/.test(q.prompt),
   /heated Benedict's green \/ yellow \/ orange \/ brick-red/.test(q.prompt),
   /Biuret lilac \/ purple/.test(q.prompt),
   /ethanol emulsion test cloudy white emulsion/.test(q.prompt)
  ];
  const expected=positive.filter((_,i)=>signals[i]).join(', ')||'none of these four nutrients';
  assert.equal(q.answer.accepted[0],expected,q.id);
  const pattern=signals.map(Number).join('');
  seen.set(pattern,(seen.get(pattern)||0)+1);
 }
 assert.equal(seen.size,16);
 assert.ok([...seen.values()].every(n=>n===4));
 assert.equal(draft.approved,0);
 assert.equal(draft.formalCreditEligible,false);
});


test('ethanol-storage safety scenario no longer duplicates the 99-point open-flame action',()=>{
 const q=replacements.find(x=>x.sourceId==='bio-y8-food-tests-case-20261025-4-1');
 const structured=read('qa/food-tests-structured-99-point-review-candidate-20261122.json').items.flatMap(x=>x.parts);
 const flame=structured.find(x=>x.pointId==='bio-y8-food-tests-application-20261025-safe-bunsen::p2');
 assert.ok(flame);
 assert.match(flame.stem,/lit Bunsen burner/i);
 assert.match(q.prompt,/uncapped beside a warm water bath/i);
 assert.match(q.prompt,/flame has been extinguished/i);
 assert.match(q.answer.accepted[0],/Cap the ethanol promptly/i);
 assert.doesNotMatch(q.answer.accepted[0],/extinguish the Bunsen burner/i);
 assert.equal(q.correctIndex,1);
 assert.equal(q.approved,false);
 assert.equal(q.formalCreditEligible,false);
});
