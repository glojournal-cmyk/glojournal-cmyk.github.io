// 143-row preview never becomes a released bank solely from successful tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const draft=read('qa/food-tests-48-duplicate-replacements-draft-20261123.json');
const preview=read('qa/food-tests-143-revised-preview-20261123.json');
const revised=preview.questions;
const replacements=new Map(draft.questions.map(x=>[x.sourceId,x]));
test('preview covers same 143 original question IDs, with 48 replacements and zero allowed credit',()=>{
 assert.equal(bank.questions.length,143);
 assert.equal(revised.length,143);
 assert.equal(new Set(revised.map(q=>q.id)).size,143);
 assert.deepEqual(revised.map(q=>q.id),bank.questions.map(q=>q.id));
 assert.equal(preview.exactSourceIdCount,143);
 assert.equal(preview.sourceItemsReplacedInPreviewOnly,48);
 assert.equal(preview.academicApproved,0);
 assert.equal(preview.formalCreditEligible,false);
 assert.equal(preview.formalScoring,'BLOCKED');
 for(const item of revised){
  assert.equal(item.topicId,'bio-y8-food-tests');
  assert.equal(item.status,'qa-pending');
  assert.equal(item.preview,true);
  assert.equal(item.ordinary,false);
  assert.equal(item.academicApproved,false);
  assert.equal(item.formalCreditEligible,false);
 }
});
test('48 candidate changes are draft-only; 95 other items preserve content unchanged',()=>{
 let changed=0,unchanged=0;
 for(let i=0;i<143;i++){
  const old=bank.questions[i],next=revised[i],draft=replacements.get(old.id);
  if(draft){
   changed++;
   assert.equal(next.prompt,draft.prompt,old.id);
   assert.deepEqual(next.options,draft.options,old.id);
   assert.deepEqual(next.answer,draft.answer,old.id);
   assert.ok(next.conceptId.includes('practical-replacement-'));
   assert.equal(next.reviewDraft.distractorReview,'pending');
   assert.equal(next.reviewDraft.teacherReview,'pending');
   assert.equal(next.reviewDraft.release,'not-authorised');
  }else{
   unchanged++;
   for(const field of ['conceptId','format','prompt','difficulty','options','answer','stimulus','feedback','task'])
    assert.deepEqual(next[field],old[field],old.id+' / '+field);
  }
 }
 assert.equal(changed,48);
 assert.equal(unchanged,95);
});
test('preview replacements have exactly one syntactically keyed choice and 0 approved answers',()=>{
 const draftQuestions=revised.filter(x=>x.reviewDraft);
 assert.equal(draftQuestions.length,48);
 for(const q of draftQuestions){
  assert.equal(q.options.length,4,q.id);
  assert.equal(q.answer.accepted.length,1);
  assert.equal(q.options.filter(x=>x===q.answer.accepted[0]).length,1);
  assert.equal(new Set(q.options.map(x=>x.toLowerCase().trim())).size,4,q.id);
  assert.equal(q.answer.totalMarks,1);
  assert.equal(q.academicApproved,false);
 }
});


test('48 replacement previews cannot inherit unrelated legacy indicator Daily groups',()=>{
 const replacementsInPreview=revised.filter(q=>q.reviewDraft);
 assert.equal(replacementsInPreview.length,48);
 assert.equal(preview.replacementDiagnosticClassification.legacyIndicatorTagsRemoved,48);
 assert.equal(preview.replacementDiagnosticClassification.requiresNewDailyConceptGroupMappingBeforeRelease,true);
 const allowed=new Set(['observation-and-inference','evidence-limits','control-validity','observation-quality','detection-limits','fair-comparison','repeatability','sample-traceability','cross-contamination','lab-safety','nutritional-inference']);
 for(const q of replacementsInPreview){
  assert.equal(q.dailyConceptGroup,null,q.id);
  assert.ok(q.reviewDraft.displacedLegacyDailyConceptGroup.startsWith('bio-y8-food-tests-indicators-'),q.id);
  assert.equal(q.reviewDraft.dailyConceptMappingStatus,'PENDING_NEW_SKILL_GROUP_REVIEW',q.id);
  assert.ok(allowed.has(q.reviewDraft.proposedDiagnosticSkill),q.id);
  assert.equal(q.academicApproved,false,q.id);
  assert.equal(q.formalCreditEligible,false,q.id);
 }
 const lipid=replacementsInPreview.find(q=>q.id==='bio-y8-food-tests-case-20261025-4-14');
 assert.match(lipid.reviewDraft.displacedLegacyDailyConceptGroup,/reducing-sugar$/);
 assert.equal(lipid.reviewDraft.proposedDiagnosticSkill,'fair-comparison');
 const ethanolSafety=replacementsInPreview.find(q=>q.id==='bio-y8-food-tests-case-20261025-4-1');
 assert.equal(ethanolSafety.reviewDraft.proposedDiagnosticSkill,'lab-safety');
});
