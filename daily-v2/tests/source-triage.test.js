import {test} from 'node:test';
import assert from 'node:assert/strict';
import {triageDailyV2Sources} from '../src/source-triage.js';
import {buildRealSourceCapacityReport} from '../scripts/qa-real-capacity.mjs';

const make=(subject='latin',questions=[])=>({
 subject,year:8,topicId:'topic-a',status:'enabled',questions
});
const q=(id,opts={})=>({id,topicId:'topic-a',prompt:'Translate the source sentence',
 answer:{accepted:['good answer']},status:'enabled',...opts});
test('all active source questions are counted without pretending they were curriculum certified',()=>{
 const r=triageDailyV2Sources([make('latin',[q('a'),q('b')])]);
 assert.equal(r.inspectedRecords,2);
 assert.equal(r.supportedSubjectRecords,2);
 assert.equal(r.readyForHumanReview,2);
 assert.equal(r.needsSourceRepair,0);
 assert.equal(r.curriculumCertified,0);
});
test('disabled, preview, repair and non-formal questions cannot inflate review capacity',()=>{
 const r=triageDailyV2Sources([make('latin',[
  q('enabled'),q('disabled',{status:'disabled'}),q('preview',{preview:true}),
  q('repair',{_repair:true}),q('informal',{formal:false})
 ])]);
 assert.equal(r.inspectedRecords,1);
 assert.equal(r.readyForHumanReview,1);
});
test('missing prompt or missing marking answer must be repaired before review',()=>{
 const r=triageDailyV2Sources([make('french',[
  q('no-prompt',{prompt:' '}),q('no-answer',{answer:{accepted:[]}}),
  q('blank-answer',{answer:{accepted:[' ','']}})
 ])]);
 assert.equal(r.needsSourceRepair,3);
 assert.equal(r.readyForHumanReview,0);
 assert.equal(r.reasonCounts.MISSING_PROMPT,1);
 assert.equal(r.reasonCounts.MISSING_ACCEPTED_ANSWER,2);
 assert.equal(r.samples.MISSING_ACCEPTED_ANSWER[0].questionId,'no-answer');
});
test('both occurrences of a duplicate question ID are held from review',()=>{
 const r=triageDailyV2Sources([make('latin',[q('dup')]),make('french',[q('dup')])]);
 assert.equal(r.reasonCounts.DUPLICATE_QUESTION_ID,2);
 assert.equal(r.readyForHumanReview,0);
 assert.equal(r.needsSourceRepair,2);
});
test('wrong source topic IDs are explicitly flagged without auto-moving content',()=>{
 const r=triageDailyV2Sources([make('biology',[q('wrong',{topicId:'other-topic'})])]);
 assert.equal(r.reasonCounts.QUESTION_TOPIC_MISMATCH,1);
 assert.equal(r.readyForHumanReview,0);
});
test('English questions remain outside V2, not counted as repairable Latin/French/Science supply',()=>{
 const r=triageDailyV2Sources([make('english',[q('english-1')]),make('physics',[q('physics-1')])]);
 assert.equal(r.unsupportedSubjectRecords,1);
 assert.equal(r.supportedSubjectRecords,1);
 assert.equal(r.readyForHumanReview,1);
 assert.equal(r.needsSourceRepair,0);
});
test('real GitHub source triage reconciles per-subject and overall structural counts',()=>{
 const report=buildRealSourceCapacityReport(),t=report.sourceTriage;
 assert.equal(t.inspectedRecords,report.sourceEligible);
 assert.equal(t.supportedSubjectRecords+t.unsupportedSubjectRecords,t.inspectedRecords);
 assert.equal(t.readyForHumanReview+t.needsSourceRepair,t.supportedSubjectRecords);
 assert.equal(t.curriculumCertified,0);
 assert.ok(t.readyForHumanReview>=0);
 assert.ok(t.bySubjectYear['latin-y8'].records>0);
 assert.ok(t.bySubjectYear['french-y8'].records>0);
 assert.equal(report.bank.certified,0,'structural review hints do not grant curriculum certification');
});
