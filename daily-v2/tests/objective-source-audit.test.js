import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditObjectiveSourceQuestions,runObjectiveSourceAudit} from '../scripts/qa-objective-scorer.mjs';

test('actual checked-in source objective modes are inventoried and never auto-certified',()=>{
 const r=runObjectiveSourceAudit();
 assert.ok(r.eligible>0);
 assert.equal(r.eligible,r.fullPreview+r.reviewRequired+r.errors);
 for(const mode of ['numeric','pair_map','category_map','unordered_required_groups'])
  assert.ok(r.byMode[mode]?.scanned>0,mode);
 assert.equal(r.autoCertified,0);
 assert.equal(r.releaseReady,false);
 assert.equal(r.learnerDataRead,false);
 assert.equal(r.sourceModified,false);
 assert.equal(r.errors,0,'real checked-in objective rubric cannot crash the preview scorer');
});
test('duplicate IDs are called out in compatibility audit rather than counted as safe',()=>{
 const t={subject:'biology',year:8,topicId:'audit-test',status:'enabled',questions:[
  {id:'duplicate',topicId:'audit-test',answer:{mode:'numeric',value:10,units:[]}},
  {id:'duplicate',topicId:'audit-test',answer:{mode:'numeric',value:10,units:[]}}
 ]};
 const r=auditObjectiveSourceQuestions([t]);
 assert.equal(r.eligible,2);
 assert.equal(r.fullPreview,1);
 assert.equal(r.errors,1);
 assert.equal(r.samples[0].questionId,'duplicate');
 assert.equal(r.autoCertified,0);
});
test('source answer group collisions are explicitly exposed as manual review blockers',()=>{
 const t={subject:'biology',year:8,topicId:'ambiguous',status:'enabled',questions:[
  {id:'collision',topicId:'ambiguous',answer:{mode:'unordered_required_groups',
   requiredGroups:[{alternatives:['same']},{alternatives:['same']}],totalMarks:2}}
 ]};
 const r=auditObjectiveSourceQuestions([t]);
 assert.equal(r.eligible,1);
 assert.equal(r.fullPreview,0);
 assert.equal(r.reviewRequired,1);
 assert.equal(r.autoCertified,0);
});
