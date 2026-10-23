import assert from 'node:assert/strict';
import test from 'node:test';
import {LATIN_BOOKLET_RECORDS,LATIN_BOOKLET_GROUPS,latinBookletKey}
 from '../assets/latin-vocabulary-booklet-20261023.js';
import {year9DailyVocabulary} from '../assets/daily-vocab-y9-20261021.js';
import {selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';

const expected={'1':40,'2':45,'3':45,'4':45,'5':50,'6':40,Numbers:12};
test('all 277 source records exactly by booklet chapter',()=>{
 assert.equal(LATIN_BOOKLET_RECORDS.length,277);
 for(const [chapter,count] of Object.entries(expected))
   assert.equal(LATIN_BOOKLET_RECORDS.filter(r=>String(r.chapter)===chapter).length,count,chapter);
 for(const row of LATIN_BOOKLET_RECORDS) {
   assert.ok(row.latin&&row.english&&row.headword);
   assert.ok(row.index>=1);
 }
});
test('numquam and num are distinct original Latin headwords',()=>{
 const negatives=LATIN_BOOKLET_RECORDS.filter(r=>['num...?','numquam'].includes(r.latin));
 assert.equal(negatives.length,2);
 assert.equal(negatives.find(r=>r.latin==='numquam').headword,'numquam');
 assert.equal(negatives.find(r=>r.latin==='num...?').headword,'num');
 assert.ok(LATIN_BOOKLET_GROUPS.some(g=>g.headword==='numquam'&&g.accepted.includes('never')));
 assert.ok(LATIN_BOOKLET_GROUPS.some(g=>g.headword==='num'&&g.accepted.includes('surely not')));
});
test('all Chapter 3–6 dictionary entries and full English meanings mapped to Year 9 questions',()=>{
 const questions=year9DailyVocabulary('latin');
 const sourceGroups=LATIN_BOOKLET_GROUPS.filter(g=>g.chapters.some(c=>Number(c)>=3));
 const byTerm=new Map(questions.filter(q=>q._bookletCanonical&&q.id.endsWith('-to-english'))
   .map(q=>[latinBookletKey(q._vocabTerm),q]));
 assert.equal(questions.filter(q=>q._bookletCanonical).length,2*sourceGroups.length);
 for(const group of sourceGroups) {
   const q=byTerm.get(latinBookletKey(group.headword));
   assert.ok(q,'Missing Year 9 word '+group.headword);
   for(const entry of group.entries)assert.ok(q.feedback.short.includes(entry),
     'Missing dictionary entry '+entry);
   for(const english of group.english)assert.ok(q.feedback.short.includes(english),
     'Missing textbook translation '+group.headword+': '+english);
   assert.ok(q.answer.accepted.length>0);
 }
 const debeo=byTerm.get('debeo');
 for(const answer of ['owe','ought','should','must'])
   assert.ok(debeo.answer.accepted.includes(answer),'debeo accepted synonym '+answer);
 for(const word of ['que','ne','qui','quis','quod','ubi'])
   assert.ok(byTerm.has(word),'Missing special Year 9 headword '+word);
 for(const [word,synonym] of [
  ['ne','open question'],['nonne','surely'],['num','surely not'],
  ['quis','what'],['que','and']]){
   assert.ok(byTerm.get(word).answer.accepted.includes(synonym),
     'Natural English answer must count: '+word+' → '+synonym);
 }
});
test('Chapter 1–2 plus Numbers enter Year 7–8; new Year 9 remains exactly three per 30',()=>{
 const sourceGroups=LATIN_BOOKLET_GROUPS.filter(g=>g.chapters.some(c=>c===1||c===2||c==='Numbers'));
 const y9=year9DailyVocabulary('latin');
 const visitedOld=new Set(),visitedNew=new Set();
 const seenCorrect={},ledger={};
 const first=selectDailyVocabulary({subject:'latin',items:[],year9Items:y9,day:'2026-10-23'});
 assert.equal(first.length,30);
 assert.equal(first.filter(x=>x._dailyYear9).length,3);
 assert.equal(first.filter(x=>!x._dailyYear9).length,27);
 assert.equal(first.filter(x=>!x._dailyYear9&&x._bookletCanonical).length,27);
 for(let i=0;i<110;i++){
  const day=new Date(Date.UTC(2026,9,23+i)).toISOString().slice(0,10);
  const qs=selectDailyVocabulary({subject:'latin',items:[],year9Items:y9,
    ledger,seenCorrect,day,seed:day});
  assert.equal(qs.length,30,'Daily 30 questions round '+i);
  assert.equal(qs.filter(x=>x._dailyYear9).length,3,'Daily exactly 3 Year 9 round '+i);
  assert.equal(qs.filter(x=>!x._dailyYear9).length,27,'Daily 27 older words round '+i);
  assert.equal(new Set(qs.map(q=>q.conceptId)).size,30,'Daily unique concepts '+i);
  assert.ok(qs.every(x=>x._bookletCanonical||x._dailyYear9),
    'Old daily questions should use textbook for this isolated test');
  ledger[day]={latin:{items:Object.fromEntries(qs.map(q=>[q.id,true]))}};
  for(const q of qs){
   const key=latinBookletKey(q._vocabTerm);
   (q._dailyYear9?visitedNew:visitedOld).add(key);
   seenCorrect[q.id]=(seenCorrect[q.id]||0)+1;
  }
 }
 for(const group of sourceGroups)
   assert.ok(visitedOld.has(latinBookletKey(group.headword)),
     'Old/Numbers book word never selected '+group.headword);
 for(const group of LATIN_BOOKLET_GROUPS.filter(g=>g.chapters.some(c=>Number(c)>=3))){
   // The selector legitimately suppresses words already covered as Year 7–8.
   const k=latinBookletKey(group.headword);
   assert.ok(visitedNew.has(k)||visitedOld.has(k),'Year 9 book word never selected '+k);
 }
 for(const word of ['quattuor','septem','mille'])
   assert.ok(visitedOld.has(word),'Numbers not in rotation: '+word);
});
test('question IDs for already learned Year 9 words remain stable',()=>{
 const y9=year9DailyVocabulary('latin');
 for(const id of ['daily-latin-y9-advenio-to-english',
   'daily-latin-y9-debeo-from-english',
   'daily-latin-y9-ubi-to-english']){
  assert.ok(y9.some(q=>q.id===id),'Saved progress ID changed: '+id);
 }
});
