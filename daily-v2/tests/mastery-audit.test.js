import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyV2MasteryReviewQueue} from '../src/mastery-audit.js';
const q=(id,difficulty,format,opts={})=>({
 id,topicId:'lat-set',status:'enabled',difficulty,format,prompt:'TRANSLATE',
 stimulus:{text:id},answer:{accepted:['response for '+id]},...opts
});
const topic=(subject,questions)=>({topicId:subject+'-topic',year:8,subject,status:'enabled',questions});
test('difficulty 4 source items remain review candidates not certified Mastery',()=>{
 const r=buildDailyV2MasteryReviewQueue([topic('latin',[q('a',4,'controlled_translation')])]);
 assert.equal(r.certifiedMasteryQuestions,0);
 assert.equal(r.candidates.length,1);
 assert.equal(r.candidates[0].certifiedMastery,false);
 assert.equal(r.summaries[0].cannotMeetChallengeQuotaBySourceHints,true);
});
test('highly repeated basic Biology mark-point questions cannot fill the challenge quota',()=>{
 const r=buildDailyV2MasteryReviewQueue([topic('biology',Array.from({length:39},(_,i)=>
   q('bio'+i,i%2+1,i%3?'mark_points':'mc_single')))]);
 assert.equal(r.scannedQuestions,39);
 assert.equal(r.summaries[0].sourceHighCandidates,0);
 assert.equal(r.summaries[0].cannotMeetChallengeQuotaBySourceHints,true);
});
test('six genuinely different high-order formats receive source candidates but still need review',()=>{
 const r=buildDailyV2MasteryReviewQueue([topic('physics',
  Array.from({length:6},(_,i)=>q('phys'+i,3,'calculation')))]);
 assert.equal(r.summaries[0].sourceHighCandidates,6);
 assert.equal(r.summaries[0].cannotMeetChallengeQuotaBySourceHints,false);
 assert.equal(r.certifiedMasteryQuestions,0);
});
test('difficulty 4 multiple-choice triggers a QA warning rather than auto-challenge',()=>{
 const r=buildDailyV2MasteryReviewQueue([topic('latin',[q('mc1',4,'mc_single')])]);
 assert.equal(r.candidates.length,0);
 assert.ok(r.issues.some(i=>i.code==='HIGH_DIFFICULTY_TAG_ON_SIMPLE_FORMAT_REVIEW'));
});
test('identical instructions with different Latin stimulus are not duplicates',()=>{
 const r=buildDailyV2MasteryReviewQueue([topic('latin',[q('one',4,'controlled_translation'),
  q('two',4,'controlled_translation')])]);
 assert.equal(r.summaries[0].uniqueCompleteQuestions,2);
 assert.equal(r.issues.filter(i=>i.code==='DUPLICATE_FULL_QUESTION').length,0);
});
test('actually duplicated full stimulus and answer trigger source review',()=>{
 const repeated=q('first',4,'controlled_translation');
 const second={...repeated,id:'second'};
 const r=buildDailyV2MasteryReviewQueue([topic('latin',[repeated,second])]);
 assert.ok(r.issues.some(i=>i.code==='DUPLICATE_FULL_QUESTION'));
});
test('duplicate question IDs across topics cannot silently inflate candidate supply',()=>{
 const r=buildDailyV2MasteryReviewQueue([topic('latin',[q('same',4,'controlled_translation')]),
 topic('french',[q('same',4,'controlled_translation')])]);
 assert.ok(r.issues.some(i=>i.code==='DUPLICATE_OR_MISSING_ID'));
});
test('disabled and preview questions are excluded from totals',()=>{
 const r=buildDailyV2MasteryReviewQueue([topic('latin',[
  q('one',4,'controlled_translation'),
  q('disabled',4,'controlled_translation',{status:'disabled'}),
  q('preview',4,'controlled_translation',{preview:true})
 ])]);
 assert.equal(r.scannedQuestions,1);
});
test('legacy supplied topic and questions remain unchanged',()=>{
 const topics=[topic('chemistry',[q('a',4,'calculation')])];
 const before=JSON.stringify(topics);
 buildDailyV2MasteryReviewQueue(topics);
 assert.equal(JSON.stringify(topics),before);
});
