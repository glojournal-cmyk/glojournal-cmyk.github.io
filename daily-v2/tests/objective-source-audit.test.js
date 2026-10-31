import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditObjectiveSourceQuestions,runObjectiveSourceAudit} from '../scripts/qa-objective-scorer.mjs';

test('actual checked-in source objective modes are inventoried and never auto-certified',()=>{
 const r=runObjectiveSourceAudit();
 assert.ok(r.eligible>0);
 assert.equal(r.eligible,r.fullPreview+r.reviewRequired+r.errors);
 assert.equal(r.negativeChecks,r.eligible);
 assert.equal(r.negativeFalseFull,0,
  'deliberately incorrect real answers must never earn full credit');
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

test('overlapping different-answer Biology groups are explicitly held for reviewer judgement',()=>{
 const r=runObjectiveSourceAudit();
 const ids=['bio-y8-app-alcohol-foetus','bio-y8-app-gut-bacteria-two',
  'bio-y8-app-low-fat','bio-y8-app-glucose-uses-four'];
 for(const id of ids)assert.ok(r.samples.some(x=>x.questionId===id&&
  x.status==='review-required'),
  'semantic independence must not be automatically credited: '+id);
 assert.equal(r.autoCertified,0);
});
test('two-mark-per-pair real science rubrics have distinct enzyme/product and reagent/result preview fields',()=>{
 const r=runObjectiveSourceAudit();
 for(const id of ['bio-y8-app-enzyme-pathways','bio-y8-app-food-test-match'])
  assert.ok(!r.samples.some(x=>x.questionId===id),
   'two-scored-field source must be represented by separate answer fields: '+id);
 assert.equal(r.autoCertified,0);
});

test('source audit tests displayed numeric modelAnswer, not regenerated numeric answer.value',()=>{
 const topic={topicId:'qa-numeric-inconsistency',subject:'physics',year:8,status:'enabled',
  questions:[{
   id:'numeric-wrong-displayed-answer',topicId:'qa-numeric-inconsistency',
   prompt:'Calculate 540 g / 200 cm3',
   answer:{mode:'numeric',value:2.7,units:['g/cm3'],
    totalMarks:1,tolerance:0.001,modelAnswer:'3 g/cm3'}
  },{
   id:'numeric-unit-missing',topicId:'qa-numeric-inconsistency',
   prompt:'Resistance 3+8+11',
   answer:{mode:'numeric',value:22,units:['Ω'],
    totalMarks:1,tolerance:0,modelAnswer:'22'}
  }]};
 const r=auditObjectiveSourceQuestions([topic]);
 assert.equal(r.eligible,2);
 assert.equal(r.fullPreview,0);
 assert.equal(r.reviewRequired,2);
 assert.equal(r.errors,0);
 assert.equal(r.autoCertified,0);
});
