import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const get=p=>JSON.parse(readFileSync(new URL('../qa-staging/'+p,import.meta.url),'utf8'));
const old=get('math-v311-reviewed-200.json');
const q315=get('math-v315-indices017-025-standard009-025-distinct-reasoning-candidates-20261123.json');
const q316=get('math-v316-indices009-037-standard029-021-four-distinct-reasoning-candidates-20261123.json');
const techniques=get('math-v316-indices-standard-80-method-families-and-mastery-collisions-20261123.json');
const review=get('math-v317-eight-candidate-grade-demand-and-six-concept-overlap-evidence-20261123.json');
const source=new Map(old.questions.map(q=>[q.sourceId,q]));
const drafts=new Map([...q315.questions,...q316.questions].map(q=>[q.sourceId,q]));
const families=new Map(techniques.families.map(f=>[f.provisionalTechniqueId,f]));

test('eight actual QA-only Maths drafts are individually challenged for AO and Grade7 uncertainty without awarding any grade or credit',()=>{
 assert.equal(old.questions.length,200);
 assert.equal(old.questions.filter(q=>q.dailyEligible===true).length,0);
 assert.equal(review.kind,'V317_EIGHT_HIGHER_MATHS_CANDIDATE_AO_GRADE_DEMAND_AND_SIX_CONCEPT_COLLISION_GATE');
 assert.equal(review.canonicalUnmodified,true);
 assert.equal(review.releaseDecision,'BLOCKED_0_OF_200_APPROVED');
 assert.equal(review.liveAppChanged,false);
 assert.equal(review.learnerScoreWrites,false);
 assert.equal(review.counts.candidateItems,8);
 assert.equal(review.counts.choiceStatements,48);
 assert.equal(review.counts.provisionalHigherPriority,2);
 assert.equal(review.counts.provisionalIntermediatePriority,3);
 assert.equal(review.counts.provisionalLowerPriority,3);
 assert.equal(review.counts.independentlyGrade7PlusCertified,0);
 assert.equal(review.counts.masteryCreditsApproved,0);
 assert.equal(review.counts.dailyEligible,0);
 assert.equal(review.counts.masteryEligible,0);
 assert.equal(review.schoolYear9PDF,'SKIPPED_PER_PARENT_INSTRUCTION');
 assert.ok(review.externalAOReference.includes('aqa.org.uk/subjects/mathematics'));
 const all=new Set();
 let rend=0;
 for(const row of review.candidateGradeDemandScreens){
  const q=drafts.get(row.sourceId),canonical=source.get(row.sourceId);
  assert.ok(q&&canonical&&!all.has(row.sourceId),'Missing/duplicate academic question screen: '+row.sourceId);
  all.add(row.sourceId);
  assert.equal(row.candidateRevisionId,q.revisionId);
  assert.equal(row.originalRevisionId,canonical.revisionId);
  assert.equal(row.originalSourceStem,canonical.stem);
  assert.equal(row.candidateStem,q.stem);
  assert.equal(row.correctOptionId,q.correctOptionId);
  assert.equal(row.candidateCorrectAnswer,q.correctAnswerLatex);
  assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId).latex);
  assert.equal(q.options.length,6);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.ok(q.options.filter(o=>o.id!==q.correctOptionId&&o.errorPath?.length>=20).length===5);
  assert.equal(q.dailyEligible,false);
  assert.equal(q.masteryEligible,false);
  assert.equal(canonical.dailyEligible,false);
  assert.equal(row.independentTeacherCurricularApproval,false);
  assert.equal(row.grade7PlusCertification,'NOT_ESTABLISHED');
  assert.equal(row.grade7PlusApproved,false);
  assert.equal(row.observedPupilWrongAnswerFrequencyAvailable,false);
  assert.equal(row.MCQCanShowWrittenReasoning,false);
  assert.equal(row.academicDecision,'HOLD');
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.ok(row.reasoningDecisionsToTest.length>=4);
  assert.ok(row.reasoningDecisionsToTest.every(x=>x.length>15));
  assert.ok(row.reasonGrade7PlusNotEstablished.length>100);
  assert.ok(row.requiredNextEvidence.length>35);
  assert.ok(row.potentialMethodOverlap.length>0);
  assert.ok(mathsRichTextHTML(q.stem).includes('<math xmlns='));rend++;
  for(const o of q.options){assert.ok(mathsOptionHTML(o).includes('<math xmlns='));rend++}
  assert.equal(q.workedSolutionSteps.length,3);
  for(const s of q.workedSolutionSteps){assert.ok(mathsRichTextHTML(s).includes('<math xmlns='));rend++}
 }
 assert.equal(all.size,8);
 assert.equal(rend,80);
});
test('six source-concrete method collision distinctions are not falsely declared equivalent or awarded new Mastery targets',()=>{
 assert.equal(techniques.totals.provisionalTechniqueFamilies,32);
 assert.equal(review.counts.provisionalCollisionPairs,6);
 assert.equal(review.counts.closeCorePairs,4);
 assert.equal(review.counts.distinctExtraStepPairs,2);
 assert.equal(review.sourceCollisionDecisions.length,6);
 const actualSourceIDs=new Set();
 for(const c of review.sourceCollisionDecisions){
  const a=families.get(c.familyA),b=families.get(c.familyB);
  assert.ok(a&&b&&a!==b);
  assert.ok(a.sourceIds.includes(c.exactSourceIds[0]));
  assert.ok(b.sourceIds.includes(c.exactSourceIds[1]));
  assert.ok(source.has(c.exactSourceIds[0]));
  assert.ok(source.has(c.exactSourceIds[1]));
  assert.equal(source.get(c.exactSourceIds[0]).dailyEligible,false);
  assert.equal(source.get(c.exactSourceIds[1]).dailyEligible,false);
  assert.ok(c.sourceMathematicalRationale.length>90);
  assert.ok(c.provisionalNonCreditTreatment.length>40);
  assert.ok(c.remainingEvidence.length>50);
  assert.equal(c.confirmedPsychometricEquivalence,false);
  assert.equal(c.separateMasteryCreditApproved,false);
  assert.ok(!actualSourceIDs.has(c.familyA+'/'+c.familyB));
  actualSourceIDs.add(c.familyA+'/'+c.familyB);
 }
 const relevant={
  'I-MATCH-EXPONENTS/I-MATCH-NEGATIVE':['x^{2}y^{3}', 'x^{2}y^{-3}'],
  'I-ROOT-POWER/I-ROOT-QUADRATIC':['\\sqrt{2^{2n+6}}','\\sqrt{2^{2n+6}}'],
  'S-WASTE-CONTAINERS/S-ARITHMETIC-FRACTION':['discarded','Evaluate'],
  'S-DENSITY-REMOVAL/S-FILTERED-DENSITY':['density','density'],
  'S-DENSITY-MIX/S-MIX-FILTER-DENSITY':['batch B','Powder B'],
  'S-PACK-FORWARD/S-PACK-RESERVE':['10\\%','15\\%']
 };
 for(const [pair,markers] of Object.entries(relevant)){
  const c=review.sourceCollisionDecisions.find(x=>x.familyA+'/'+x.familyB===pair);
  assert.ok(c,'Known exact source collision omitted '+pair);
  assert.ok(source.get(c.exactSourceIds[0]).stem.includes(markers[0]),'Original first source changed '+pair);
  assert.ok(source.get(c.exactSourceIds[1]).stem.includes(markers[1]),'Original second source changed '+pair);
 }
 assert.equal(actualSourceIDs.size,6);
});
test('deliberate source and approval mutation cannot silently match evidence screen',()=>{
 const q=structuredClone(q316.questions[0]),original=review.candidateGradeDemandScreens.find(x=>x.sourceId===q.sourceId);
 q.stem=q.stem.replace('xy=2^5','xy=2^6');
 assert.notEqual(original.candidateStem,q.stem);
 assert.equal(original.correctOptionId,'B');
 assert.equal(original.grade7PlusApproved,false);
 const tampered=structuredClone(review);
 tampered.candidateGradeDemandScreens[0].grade7PlusApproved=true;
 assert.ok(tampered.candidateGradeDemandScreens.some(x=>x.grade7PlusApproved!==false));
 const changed=structuredClone(review);
 changed.sourceCollisionDecisions[0].separateMasteryCreditApproved=true;
 assert.ok(changed.sourceCollisionDecisions.some(x=>x.separateMasteryCreditApproved!==false));
});
