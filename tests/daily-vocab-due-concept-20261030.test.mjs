import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';

// Independently check the LIVE main's vocab rotation rather than brittle
// literal function-signature snippets. All IDs here are synthetic test data;
// the test never touches student storage or real learned-vocabulary records.
const start='2026-10-30',due='2026-11-01';
function question(subject,i){
 const prefix=subject==='french'?'fr':'la';
 return {
  id:prefix+'-synthetic-vocab-'+i,
  conceptId:prefix+'-y8-concept-vocab-'+i,
  topicId:prefix+'-y8-qa',
  year:8,status:'enabled',formal:true,format:'typed_exact',
  prompt:'Translate into English',
  stimulus:{text:'word'+i+'test'+subject,direction:(subject==='french'?'French':'Latin')+' → English'},
  answer:{accepted:['meaning '+i]}
 };
}
for(const subject of ['french','latin']){
 test(subject+': incorrect Daily vocab cannot reappear before its 48-hour review day',()=>{
  const items=Array.from({length:48},(_,i)=>question(subject,i));
  const failed=items[10];
  const ledger={[start]:{[subject]:{items:{[failed.id]:false}}}};
  const opts={subject,items,day:start,seed:'qa-static-seed',size:30,
   ledger,year9Items:[],legacyVocabulary:[],reviews:{},spellingDue:{},seenCorrect:{}};
  const early=selectDailyVocabulary(opts);
  assert.equal(early.length,30);
  assert.ok(!early.some(q=>q.id===failed.id),
   'a word answered incorrectly today must wait for its future due date');
  const afterDue=selectDailyVocabulary({...opts,day:due});
  assert.ok(afterDue.some(q=>q.id===failed.id),
   'the missed word must become eligible at the two-day spaced review date');
  assert.equal(new Set(early.map(q=>q._vocabConcept)).size,early.length,
   'one word concept must not be credited twice under different directions');
  assert.ok(early.every(q=>q._dailyYear8&&!q._dailyYear9),
   'unreviewed Year 9 words must not leak into Year 8 vocab');
 });
}
