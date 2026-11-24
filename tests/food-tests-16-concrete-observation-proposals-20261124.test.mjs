import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const review=read('qa/food-tests-16-retained-case-concrete-observations-20261124.json');
const preview=read('qa/food-tests-143-revised-preview-20261123.json');
const optionReview=read('qa/food-tests-25-source-mcq-content-adjudication-20261124.json');
const candidate=read('qa/food-tests-143-consolidated-held-candidate-20261124.json');
const optionById=new Map(optionReview.retainedResultExamples.map(x=>[x.sourceId,x]));
const candidateById=new Map(candidate.groups.map(x=>[x.sourceId,x]));
const originals=bank.questions.filter(x=>/^bio-y8-food-tests-case-20261025-1-\d+$/.test(x.id));
const byId=new Map(originals.map(x=>[x.id,x]));
const byPreview=new Map(preview.questions.map(x=>[x.id,x]));
test('all 16 retained Food Tests indicator cases have concrete colour QA proposals, with old source/marks untouched',()=>{
 assert.equal(bank.questions.length,143);
 assert.equal(review.status,'QA_DRAFT_CORRECTED_SINGLE_OBSERVATION_AND_COMPLETE_SET_UNAPPROVED');
 assert.equal(review.approved,0);
 assert.equal(review.cannotBeImportOrCredit,true);
 assert.equal(review.sourceEdited,false);
 assert.equal(review.livePreviewEdited,false);
 assert.equal(review.retainedExampleCases,16);
 assert.equal(review.items.length,16);
 assert.equal(originals.length,16);
 assert.equal(review.changedStems,16);
 assert.equal(review.observationChanges,12);
 assert.equal(review.questionDemandClarifications,16);
 assert.equal(review.positiveBenedictObservationSamples,8);
 assert.equal(review.positiveBiuretObservationSamples,8);
 let changed=0,positiveB=0,positiveBi=0;
 for(const row of review.items){
  const source=byId.get(row.sourceId),prior=byPreview.get(row.sourceId);
  assert.ok(source,row.sourceId);
  assert.ok(prior,row.sourceId);
  assert.equal(row.sourcePrompt,source.prompt);
  assert.equal(prior.prompt,source.prompt,'QA proposal must not sneak into unapproved 143-preview');
  assert.deepEqual(row.sourceAnswer,source.answer.accepted);
  assert.deepEqual(row.originalChoices,source.options);
  assert.equal(row.keySlot,source.options.indexOf(source.answer.accepted[0]));
  assert.ok(row.keySlot>=0&&row.keySlot<4);
  assert.equal(row.proposedPrompt.includes(' / '),false,row.sourceId);
  assert.equal(row.promptsEdited,row.proposedPrompt!==row.sourcePrompt);
  assert.equal(row.questionDemand,'COMPLETE_DETECTED_SET');
  assert.match(row.proposedPrompt,/complete list of nutrient groups detected by these four tests/);
  assert.equal(row.originalObservationAlreadyConcrete,!row.sourcePrompt.includes(' / '));
  assert.equal(row.academicReview,'AI_CONTENT_QA_PENDING_FULL_OPTION_AUDIT');
  const audit=optionById.get(row.sourceId), held=candidateById.get(row.sourceId);
  assert.ok(audit&&held,row.sourceId);
  assert.equal(audit.revisedStem,row.proposedPrompt);
  assert.equal(audit.revisedSingleCorrectOption,'PASS');
  assert.equal(audit.independentQualifiedApproval,false);
  assert.equal(held.question.prompt,row.proposedPrompt);
  assert.deepEqual(held.question.options,row.originalChoices);
  assert.equal(held.formalCreditEligible,false);
  assert.equal(held.question.formalCreditEligible,false);
  assert.equal(row.scientificSoleKeyApproval,false);
  assert.equal(row.tgsTaughtProtocolApproval,false);
  assert.equal(row.formalCreditEligible,false);
  assert.equal(canEarnFormalCredit(row.sourceId),false);
  if(row.promptsEdited)changed++;
  if(row.sourcePrompt.includes('green / yellow / orange / brick-red')){
   positiveB++;
   assert.match(row.proposedPrompt,/Benedict's (green|yellow|orange|brick-red) precipitate/);
  }
  if(row.sourcePrompt.includes('lilac / purple')){
   positiveBi++;
   assert.match(row.proposedPrompt,/Biuret (lilac|purple)/);
  }
  const positives={
   starch:row.proposedPrompt.includes('iodine blue-black'),
   sugar:!/heated Benedict's remains blue/.test(row.proposedPrompt),
   protein:!/Biuret remains blue/.test(row.proposedPrompt),
   lipid:row.proposedPrompt.includes('cloudy white emulsion')
  };
  const expected=['starch','reducing sugar','protein','lipid'].filter((x,i)=>[positives.starch,positives.sugar,positives.protein,positives.lipid][i]);
  const observed=source.answer.accepted[0]==='none of these four nutrients'?[]:source.answer.accepted[0].split(', ');
  assert.deepEqual(expected,observed,'proposed concrete observations changed nutrient conclusion '+row.sourceId);
  const nutrients=['starch','reducing sugar','protein','lipid'];
  const mask=choice=>{if(choice==='none of these four nutrients')return 0; const parts=choice.split(', ');assert.equal(new Set(parts).size,parts.length);assert.ok(parts.every(p=>nutrients.includes(p)));return parts.reduce((m,p)=>m|(1<<nutrients.indexOf(p)),0);};
  const target=expected.reduce((m,p)=>m|(1<<nutrients.indexOf(p)),0);
  const options=row.originalChoices.map(mask);
  assert.equal(new Set(options).size,4,'unique nutrient sets '+row.sourceId);
  assert.deepEqual(options.map((m,i)=>m===target?i:-1).filter(i=>i>=0),[row.keySlot],row.sourceId);
  assert.equal(audit.options.length,4);
  for(let i=0;i<4;i++){
   assert.equal(audit.options[i].text,row.originalChoices[i]);
   assert.equal(audit.options[i].role,i===row.keySlot?'PROPOSED_KEY':'NOT_COMPLETE_DETECTED_SET');
   assert.ok(audit.options[i].reason.length>10);
   assert.equal(audit.options[i].independentQualifiedSignoff,false);
  }
 }
 assert.equal(changed,16);
 assert.equal(positiveB,8);
 assert.equal(positiveBi,8);
});
