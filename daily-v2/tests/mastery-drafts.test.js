import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditDailyV2MasteryDrafts,MASTERY_DRAFT_FILES} from '../src/mastery-draft-validator.js';
import {adaptCertifiedDailyV2Bank} from '../src/bank-adapter.js';
import {planDailyV2} from '../src/planner.js';

function readDrafts(){
 return MASTERY_DRAFT_FILES.map(file=>
  JSON.parse(readFileSync(new URL('../content/mastery/'+file,import.meta.url),'utf8')));
}
test('all five real authored question packs have exact 4/10/6 balance and 100 original IDs',()=>{
 const r=auditDailyV2MasteryDrafts(readDrafts());
 assert.equal(r.readyForIndependentReview,true,JSON.stringify(r.errors));
 assert.equal(r.questionCount,100);
 assert.equal(r.topics.length,5);
 for(const t of r.topics)assert.deepEqual(t.bandCounts,{foundation:4,application:10,challenge:6});
});
test('drafts have nonempty independently marked rubrics and no MC challenge substitution',()=>{
 const topics=readDrafts();
 for(const topic of topics)for(const q of topic.questions){
  assert.equal(q.answer.mode,'rubric_review');
  assert.equal(q.answer.totalMarks,q.answer.markPoints.length);
  assert.equal(q.answer.requiresSemanticAssessment,true);
  assert.notEqual(q.format,'mc_single');
  if(q.depthBand==='challenge')assert.ok(q.answer.markPoints.length>=3);
 }
});
test('uncertified new bank is invisible to live Daily adapter until independent review',()=>{
 const result=adaptCertifiedDailyV2Bank({topics:readDrafts()});
 assert.equal(result.summary.scanned,100);
 assert.equal(result.summary.certified,0);
 assert.equal(result.summary.unclassified,100);
});
test('question references and identifiers do not collide between subject drafts',()=>{
 const topics=readDrafts();
 const ids=topics.flatMap(t=>t.questions.map(q=>q.id));
 assert.equal(new Set(ids).size,100);
 for(const t of topics)for(const q of t.questions)
  assert.equal(q.topicId,t.topicId);
});
test('draft QA flags changed mark totals before an item can be independently reviewed',()=>{
 const topics=readDrafts();
 topics[0].questions[0].answer.totalMarks=999;
 const result=auditDailyV2MasteryDrafts(topics);
 assert.equal(result.readyForIndependentReview,false);
 assert.ok(result.errors.some(e=>e.code==='MISSING_OR_INVALID_SEMANTIC_MARK_SCHEME'));
});
test('draft QA rejects MC-only Challenge entries',()=>{
 const topics=readDrafts();
 topics[0].questions[19].format='mc_single';
 const result=auditDailyV2MasteryDrafts(topics);
 assert.equal(result.readyForIndependentReview,false);
 assert.ok(result.errors.some(e=>e.code==='INVALID_HIGH_LEVEL_QUESTION_FORMAT'));
});
test('draft QA rejects pretending independently reviewed content without a real review',()=>{
 const topics=readDrafts();
 topics[0].curriculumReview='approved';
 const result=auditDailyV2MasteryDrafts(topics);
 assert.equal(result.readyForIndependentReview,false);
 assert.ok(result.errors.some(e=>e.code==='UNVERIFIED_DRAFT_MUST_NOT_APPEAR_CERTIFIED'));
});
test('actual draft topics can populate TWO Mastery candidates while the other eight daily tasks remain blocked',()=>{
 const topics=readDrafts();
 const day='2026-10-26';
 const result=planDailyV2({day,questionBank:topics.flatMap(t=>t.questions)});
 assert.equal(result.status,'blocked');
 const mastery=result.eligibleTasks.filter(t=>t.kind==='mastery');
 assert.equal(mastery.length,2);
 assert.notEqual(mastery[0].topicId,mastery[1].topicId);
 assert.equal(mastery[0].questionIds.length,20);
 assert.equal(mastery[1].questionIds.length,20);
 assert.equal(result.tasks.length,0);
});
test('100 new items alone cannot keep two fresh 20-question Masteries available on day 3',()=>{
 const topics=readDrafts(),questionBank=topics.flatMap(t=>t.questions);
 let history=[],completedDays=0;
 for(let i=0;i<3;i++){
  const day='2026-10-'+String(26+i);
  const result=planDailyV2({day,questionBank,priorAttempts:history});
  const mastery=result.eligibleTasks.filter(t=>t.kind==='mastery');
  if(i<2)assert.equal(mastery.length,2);
  else assert.equal(mastery.length,1);
  if(i<2){
   completedDays++;
   for(const t of mastery)for(const q of t.questions)
    history.push({day,taskId:t.id,questionId:q.questionId,conceptId:q.conceptId,
     persisted:true,correct:true,eventId:'sim-'+day+'-'+q.questionId});
  }
 }
 assert.equal(completedDays,2);
 assert.equal(history.length,80);
});
test('source spot checks match selected model calculations and grammar',()=>{
 const map=Object.fromEntries(readDrafts().flatMap(t=>t.questions.map(q=>[q.id,q])));
 assert.match(map['chem-y8-v2ma-20'].answer.modelAnswer,/102/);
 assert.match(map['phys-y8-v2ma-15'].answer.modelAnswer,/42 m/);
 assert.match(map['phys-y8-v2ma-17'].answer.modelAnswer,/56 m/);
 assert.match(map['fr-y8-v2ma-20'].answer.modelAnswer,/ne me suis pas lev/);
 assert.match(map['la-y8-v2ma-19'].answer.modelAnswer,/servus videt/);
});
