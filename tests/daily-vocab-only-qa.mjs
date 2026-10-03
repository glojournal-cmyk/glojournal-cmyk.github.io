import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectDailyVocabulary, vocabularyQuestion} from '../assets/daily-vocab-20261003.js';
for (const subject of ['french','latin']) {
  const prefix=subject==='french'?'fr':'la';
  const items=Array.from({length:100},(_,i)=>[0,1].map(direction=>({id:`${prefix}-${i}-${direction}`,
    conceptId:`${prefix}-y8-concept-vocab-${i}`,topicId:`${prefix}-y8-topic-${i%3}`,format:'typed_exact',
    status:'enabled',prompt:'Retrieve the taught word',answer:{accepted:[`word ${i}`]}}))).flat();
  items.push({...items[0],id:'grammar',conceptId:`${prefix}-y8-concept-grammar`,prompt:'Explain a grammar rule'});
  const args={subject,items,day:'2026-10-03'};
  const first=selectDailyVocabulary(args);
  assert.equal(first.length,30);assert.equal(new Set(first.map(q=>q.conceptId)).size,30);
  assert.ok(first.every(q=>vocabularyQuestion(q,subject)));
  assert.deepEqual(selectDailyVocabulary(args),first,'Reload keeps the same unanswered set');
  const credited=Object.fromEntries(first.map(q=>[q.id,true]));
  const next=selectDailyVocabulary({...args,day:'2026-10-04',ledger:{'2026-10-03':{[subject]:{items:credited}}}});
  assert.equal(next.length,30);assert.ok(next.every(q=>!first.some(old=>old.conceptId===q.conceptId)),
    'Yesterday correct words stay out when alternatives exist');
  const sameDay=selectDailyVocabulary({...args,ledger:{'2026-10-03':{[subject]:{items:credited}}}});
  assert.ok(sameDay.every(q=>!first.some(old=>old.conceptId===q.conceptId)), 'Both directions share one daily word');
  const due=selectDailyVocabulary({...args,day:'2026-10-05',ledger:{'2026-10-03':{[subject]:{items:credited}}},
    reviews:Object.fromEntries(first.map(q=>[q.id,{due:'2026-10-05'}]))});
  assert.equal(due.filter(q=>q._dailyBucket==='vocabulary-spaced-due').length,6);
  const collisionA=selectDailyVocabulary({...args,day:'2026-10-12'}).map(q=>q.conceptId);
  const collisionB=selectDailyVocabulary({...args,day:'2026-10-21'}).map(q=>q.conceptId);
  assert.notDeepEqual(collisionA,collisionB,'Dates with the same digit sum rotate differently');
  const tiny=selectDailyVocabulary({...args,items:items.slice(0,20)});
  assert.equal(tiny.length,10);assert.equal(new Set(tiny.map(q=>q.conceptId)).size,10);
}
// Audit the actual banks when running in the repository/CI.
if (fs.existsSync('content/topics')) {
  for (const subject of ['french','latin']) {
    const prefix=subject==='french'?'fr':'la';
    const items=fs.readdirSync('content/topics').filter(p=>p.startsWith(`${prefix}-y8-`)&&p.endsWith('.json'))
      .flatMap(p=>JSON.parse(fs.readFileSync(`content/topics/${p}`)).questions||[]);
    const set=selectDailyVocabulary({subject,items,day:'2026-10-03'});
    assert.equal(set.length,30);assert.equal(new Set(set.map(q=>q.conceptId)).size,30);
    assert.ok(set.every(q=>vocabularyQuestion(q,subject)));
    console.log('VOCABULARY_BANK_QA '+JSON.stringify({subject,words:new Set(items.filter(q=>vocabularyQuestion(q,subject)).map(q=>q.conceptId)).size,selected:set.length}));
  }
}
console.log('DAILY_VOCAB_ONLY_QA passed: vocabulary-only, distinct words, rotation, refill and spaced review.');
