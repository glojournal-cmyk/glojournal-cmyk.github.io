import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const review=read('qa/food-tests-16-retained-case-concrete-observations-20261124.json');
const preview=read('qa/food-tests-143-revised-preview-20261123.json');
const originals=bank.questions.filter(x=>/^bio-y8-food-tests-case-20261025-1-\d+$/.test(x.id));
const byId=new Map(originals.map(x=>[x.id,x]));
const byPreview=new Map(preview.questions.map(x=>[x.id,x]));
test('all 16 retained Food Tests indicator cases have concrete colour QA proposals, with old source/marks untouched',()=>{
 assert.equal(bank.questions.length,143);
 assert.equal(review.status,'NO_IMPORT_INDEPENDENT_REVIEW_PENDING');
 assert.equal(review.approved,0);
 assert.equal(review.cannotBeImportOrCredit,true);
 assert.equal(review.sourceEdited,false);
 assert.equal(review.livePreviewEdited,false);
 assert.equal(review.retainedExampleCases,16);
 assert.equal(review.items.length,16);
 assert.equal(originals.length,16);
 assert.equal(review.changedStems,12);
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
  assert.equal(row.academicReview,'PENDING');
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
 }
 assert.equal(changed,12);
 assert.equal(positiveB,8);
 assert.equal(positiveBi,8);
});
