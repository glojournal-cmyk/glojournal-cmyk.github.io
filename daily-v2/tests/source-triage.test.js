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
 assert.equal(r.reasonCounts.MISSING_MARKING_CONTENT,2);
 assert.equal(r.samples.MISSING_MARKING_CONTENT[0].questionId,'no-answer');
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

test('real-style mark_points source is a manual rubric review, not a missing answer',()=>{
 const science=q('bio-point',{format:'mark_points',answer:{
  mode:'mark_points',markPoints:['The water evaporates','The mass decreases'],
  modelAnswer:'The water evaporates so its mass decreases.'
 }});
 const r=triageDailyV2Sources([make('biology',[science])]);
 assert.equal(r.readyForHumanReview,1);
 assert.equal(r.needsSourceRepair,0);
 assert.equal(r.requiresManualMarkPointReview,1);
 assert.equal(r.bySubjectYear['biology-y8'].manualMarkPointReview,1);
});
test('incomplete or empty mark_points evidence still requires a source fix',()=>{
 const r=triageDailyV2Sources([make('physics',[
  q('bad-rubric',{answer:{mode:'mark_points',markPoints:[' ','']}}),
  q('missing-rubric',{answer:{mode:'mark_points',modelAnswer:'A plausible model with no marking points'}})
 ])]);
 assert.equal(r.readyForHumanReview,0);
 assert.equal(r.needsSourceRepair,2);
 assert.equal(r.requiresManualMarkPointReview,0);
 assert.equal(r.reasonCounts.MISSING_MARKING_CONTENT,2);
});
test('actual source contains mark-point candidates that are counted, not treated as missing',()=>{
 const report=buildRealSourceCapacityReport(),t=report.sourceTriage;
 assert.ok(t.requiresManualMarkPointReview>0);
 assert.ok(t.requiresManualMarkPointReview<=t.readyForHumanReview);
 assert.ok(Array.isArray(t.markPointReviewSamples));
 assert.equal(t.readyForHumanReview+t.needsSourceRepair,t.supportedSubjectRecords);
});

test('real-style pairing tasks are reviewed as structured answers, not wrongly marked missing',()=>{
 const pairs=q('match',{format:'matching',answer:{mode:'pair_map',pairs:[
  {left:'protein',right:'growth and repair'},
  {left:'lipid',right:'insulation and storage'}
 ]}});
 const r=triageDailyV2Sources([make('biology',[pairs])]);
 assert.equal(r.readyForHumanReview,1);
 assert.equal(r.needsSourceRepair,0);
 assert.equal(r.requiresStructuredAnswerReview,1);
 assert.equal(r.structuredReviewSamples[0].mode,'pair_map');
});
test('unordered required groups with alternate accepted terms are valid review candidates',()=>{
 const grouped=q('seven-nutrients',{format:'unordered_set',answer:{
  mode:'unordered_required_groups',requiredGroups:[
   {alternatives:['lipid','fat']},{alternatives:['protein']}
  ],totalMarks:2
 }});
 const r=triageDailyV2Sources([make('biology',[grouped])]);
 assert.equal(r.readyForHumanReview,1);
 assert.equal(r.requiresStructuredAnswerReview,1);
 assert.equal(r.needsSourceRepair,0);
});
test('invalid or empty matching and unordered mark content remains a source repair issue',()=>{
 const r=triageDailyV2Sources([make('biology',[
  q('empty-pairs',{answer:{mode:'pair_map',pairs:[]}}),
  q('broken-pair',{answer:{mode:'pair_map',pairs:[{left:'carbohydrate',right:''}]}}),
  q('broken-group',{answer:{mode:'unordered_required_groups',requiredGroups:[{alternatives:['']}]}})
 ])]);
 assert.equal(r.readyForHumanReview,0);
 assert.equal(r.needsSourceRepair,3);
 assert.equal(r.reasonCounts.MISSING_MARKING_CONTENT,3);
});
test('all structured review requirements are subsets of actual source records',()=>{
 const r=buildRealSourceCapacityReport().sourceTriage;
 assert.ok(r.requiresManualMarkPointReview+r.requiresStructuredAnswerReview<=r.readyForHumanReview);
 assert.equal(r.readyForHumanReview+r.needsSourceRepair,r.supportedSubjectRecords);
});
