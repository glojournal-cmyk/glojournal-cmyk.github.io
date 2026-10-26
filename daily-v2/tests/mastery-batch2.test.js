import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditDailyV2MasteryDrafts} from '../src/mastery-draft-validator.js';
import {adaptCertifiedDailyV2Bank} from '../src/bank-adapter.js';
import {planDailyV2} from '../src/planner.js';
const batch1=['latin-y8-adjective-agreement.json','french-y8-negatives-tenses-writing.json',
 'biology-y8-digestion-absorption.json','chemistry-y8-formulae-equations.json',
 'physics-y8-speed-time.json'];
const batch2=['latin-y8-verb-tenses.json','french-y8-reflexive-routines.json',
 'biology-y8-photosynthesis.json','chemistry-y8-acids-neutralisation.json',
 'physics-y8-series-parallel.json'];
function load(names){return names.map(name=>JSON.parse(readFileSync(new URL('../content/mastery/'+name,import.meta.url),'utf8')))}
function normalized(topics){return topics.flatMap(t=>t.questions.map(q=>({...q,subject:t.subject,year:t.year})));}
test('Batch 2 adds precisely 100 drafted questions, five novel topics at 4/10/6 each',()=>{
 const audit=auditDailyV2MasteryDrafts(load(batch2));
 assert.equal(audit.readyForIndependentReview,true,JSON.stringify(audit.errors));
 assert.equal(audit.questionCount,100);
 for(const t of audit.topics)assert.deepEqual(t.bandCounts,{foundation:4,application:10,challenge:6});
});
test('Both batches contain 200 unique IDs, ten distinct topics and no identical complete prompt/stimulus',()=>{
 const combined=load([...batch1,...batch2]),q=normalized(combined);
 assert.equal(q.length,200);
 assert.equal(new Set(combined.map(t=>t.topicId)).size,10);
 assert.equal(new Set(q.map(t=>t.id)).size,200);
 const keys=q.map(x=>JSON.stringify([x.prompt,x.stimulus?.text]));
 assert.equal(new Set(keys).size,200);
});
test('No question is a multiple-choice high difficulty substitute and every new challenge has full rubric',()=>{
 const qs=normalized(load(batch2));
 assert.equal(qs.filter(q=>q.depthBand==='challenge').length,30);
 for(const q of qs){
  assert.notEqual(q.format,'mc_single');
  assert.equal(q.answer.mode,'rubric_review');
  assert.equal(q.answer.requiresSemanticAssessment,true);
  assert.equal(q.answer.totalMarks,q.answer.markPoints.length);
  if(q.depthBand==='challenge')assert.ok(q.answer.markPoints.length>=3);
 }
});
test('None of 200 unsigned question drafts passes independent source fingerprint review gate',()=>{
 const adapted=adaptCertifiedDailyV2Bank({topics:load([...batch1,...batch2])});
 assert.equal(adapted.summary.scanned,200);
 assert.equal(adapted.summary.certified,0);
 assert.equal(adapted.summary.unclassified,200);
 assert.equal(adapted.summary.byRole.mastery,0);
});
test('Unapproved drafts alone provide five 40-question Mastery allocation dry runs, not thirty days',()=>{
 const questionBank=normalized(load([...batch1,...batch2]));
 const used=[];
 for(let i=0;i<6;i++){
  const day='2026-10-'+String(26+i).padStart(2,'0');
  const p=planDailyV2({day,questionBank,priorAttempts:used});
  const slots=p.eligibleTasks.filter(t=>t.kind==='mastery');
  if(i<5)assert.equal(slots.length,2,'Day '+(i+1)+' must provide two complete Mastery tasks');
  else assert.equal(slots.length,0,'Day 6 has no new untouched 20-question topic');
  for(const t of slots)for(const q of t.questions)
   used.push({day,questionId:q.questionId,taskId:t.id,correct:true,persisted:true,
    eventId:'study-'+day+'-'+q.questionId});
 }
 assert.equal(used.length,200);
});
test('Batch 2 requires exact new challenging questions for each target topic',()=>{
 const topics=load(batch2);
 for(const topic of topics){
  const challenge=topic.questions.filter(q=>q.depthBand==='challenge');
  const application=topic.questions.filter(q=>q.depthBand==='application');
  assert.equal(challenge.length,6);
  assert.equal(application.length,10);
  assert.ok(new Set(challenge.map(q=>q.stimulus.text)).size>=5);
 }
});
test('Errors in draft mark schemes fail structural QA before curriculum review',()=>{
 const topics=load(batch2);
 topics[4].questions[19].answer.markPoints.pop();
 const audit=auditDailyV2MasteryDrafts(topics);
 assert.equal(audit.readyForIndependentReview,false);
 assert.ok(audit.errors.some(e=>e.code==='MISSING_OR_INVALID_SEMANTIC_MARK_SCHEME'));
});
test('Physics series/parallel and Chemistry neutralisation answer spot checks',()=>{
 const q=Object.fromEntries(normalized(load(batch2)).map(x=>[x.id,x]));
 assert.match(q['phys-y8-v2mb-15'].answer.modelAnswer,/0\.8 A.*0\.4 A/);
 assert.match(q['phys-y8-v2mb-16'].answer.modelAnswer,/3 V/);
 assert.match(q['chem-y8-v2mb-16'].answer.modelAnswer,/not supported/i);
 assert.match(q['chem-y8-v2mb-17'].answer.modelAnswer,/dissolved salt/i);
});
test('Latin verb aspects and French reflexive auxiliary positions have model guidance',()=>{
 const q=Object.fromEntries(normalized(load(batch2)).map(x=>[x.id,x]));
 assert.match(q['la-y8-v2mb-18'].stimulus.text,/intraverunt/);
 assert.match(q['la-y8-v2mb-20'].answer.modelAnswer,/master entered/);
 assert.match(q['fr-y8-v2mb-19'].answer.modelAnswer,/ne me lève pas/);
 assert.match(q['fr-y8-v2mb-20'].answer.modelAnswer,/s'est couchée/);
});
test('New batch is structurally ready for independent review but NOT for release',()=>{
 const p=auditDailyV2MasteryDrafts(load(batch2));
 assert.equal(p.readyForIndependentReview,true);
 assert.equal(p.eligibleForLiveDaily,false);
 assert.equal(p.topics.every(x=>x.certifiedQuestions===0),true);
});
