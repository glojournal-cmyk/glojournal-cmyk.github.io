import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';

const make=(prefix,i,year=8,direction='French → English')=>{
  const term='mot'+(year===9?'neuf':'ancien')+i;
  return {
    id:prefix+'-'+i+'-'+direction.slice(0,1),conceptId:'fr-y'+year+'-concept-vocab-'+term,
    topicId:'fr-y'+year+'-taught-test',year,status:'enabled',formal:true,preview:false,
    format:'typed_exact',_vocabTerm:term,
    prompt:'VOCAB — Give the English meaning.',
    stimulus:{text:term,direction},
    answer:{accepted:['meaning'+i],mode:'exact_or_equivalent'}
  };
};
const older=Array.from({length:50},(_,i)=>make('old',i));
const newer=Array.from({length:15},(_,i)=>make('new',i,9));
const select=day=>selectDailyVocabulary({
  subject:'french',items:older,year9Items:newer,day,seed:'v3-french-test',
  ledger:{},seenCorrect:{},size:30,topicLearning:{}
});
test('historical pre-V3 vocabulary retains original 27+3 rule',()=>{
  const q=select('2026-11-22');
  assert.equal(q.length,30);
  assert.equal(q.filter(x=>x._dailyYear9).length,3);
});
test('V3 never assumes an internally stored Year 9 word has been taught',()=>{
  const q=select('2026-11-23');
  assert.equal(q.length,20);
  assert.equal(q.filter(x=>x._dailyYear9).length,0);
  assert.equal(q.filter(x=>x._dailyYear8).length,20);
  assert.equal(new Set(q.map(x=>x._vocabConcept)).size,20);
});
test('alternate translation direction cannot double-credit the same word concept',()=>{
  const alt={...make('reverse',0,8,'English → French'),
    id:'reverse-0',stimulus:{text:'meaning0',direction:'English → French'},
    answer:{accepted:['motancien0'],mode:'exact_or_equivalent'}};
  const q=selectDailyVocabulary({
    subject:'french',items:[...older,alt],year9Items:newer,day:'2026-11-23',
    ledger:{},seenCorrect:{},size:30,seed:'reverse-test',topicLearning:{}
  });
  assert.equal(new Set(q.map(x=>x._vocabConcept)).size,q.length);
});

test('V3 20+10 requires explicitly approved Year 9 headwords; no substitution on short supply',()=>{
 const approved=newer.map(q=>({academicQA:'approved',taughtVerified:true,topicId:q.topicId,term:q._vocabTerm}));
 const run=words=>selectDailyVocabulary({subject:'french',items:older,year9Items:newer,
   day:'2026-11-23',seed:'v3-split',ledger:{},size:30,
   approvedYear9Vocabulary:{french:words}});
 const full=run(approved);
 assert.equal(full.length,30);
 assert.equal(full.filter(q=>q._dailyYear8).length,20);
 assert.equal(full.filter(q=>q._dailyYear9).length,10);
 const short=run(approved.slice(0,4));
 assert.equal(short.length,24);
 assert.equal(short.filter(q=>q._dailyYear8).length,20);
 assert.equal(short.filter(q=>q._dailyYear9).length,4);
 const items=Object.fromEntries(full.filter(q=>q._dailyYear8).map(q=>[q.id,true]));
 const resumed=selectDailyVocabulary({subject:'french',items:older,year9Items:newer,
   day:'2026-11-23',seed:'resume',ledger:{'2026-11-23':{french:{items}}},size:30,
   approvedYear9Vocabulary:{french:approved}});
 assert.equal(resumed.filter(q=>q._dailyYear8).length,0);
 assert.equal(resumed.filter(q=>q._dailyYear9).length,10);
});

import {year9DailyVocabulary} from '../assets/daily-vocab-y9-20261021.js';
import {approvedDailyWords} from '../assets/daily-v3-approved-words.js';
import fs from 'node:fs';

for(const subject of ['latin','french']){
 test(subject+' selects 20 older and 10 reviewed Year 9 words from the shipped topic banks',()=>{
  const folder='content/topics/';
  const prefix=subject==='latin'?'la-y8-':'fr-y8-';
  const items=fs.readdirSync(folder).filter(f=>f.startsWith(prefix)&&f.endsWith('.json'))
    .flatMap(f=>JSON.parse(fs.readFileSync(folder+f)).questions||[]);
  const year9Items=year9DailyVocabulary(subject);
  const entries=approvedDailyWords[subject];
  for(const entry of entries){
   const pair=year9Items.filter(q=>q.topicId===entry.topicId&&q._vocabTerm===entry.term);
   assert.equal(pair.length,2,entry.term);
   if(entry.english)assert.ok(entry.english.includes(pair[0].answer.accepted[0]),entry.term);
  }
  const set=selectDailyVocabulary({subject,day:'2026-11-27',items,year9Items,size:30});
  assert.equal(set.length,30);
  assert.equal(set.filter(q=>q._dailyYear9).length,10);
  assert.equal(new Set(set.map(q=>q._vocabConcept)).size,30);
  for(const q of set.filter(q=>q._dailyYear9))assert.ok(entries.some(e=>e.term===q._vocabTerm&&e.topicId===q.topicId));
 });
}
