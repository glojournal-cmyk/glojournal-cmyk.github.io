import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDailyVocabulary,vocabularyQuestion} from '../assets/daily-vocab-20261003.js';
import {year9DailyVocabulary,frenchHeadword} from '../assets/daily-vocab-y9-20261021.js';

const day='2026-10-21';
const frenchTaught=[
  ['un monument','a monument'],['un musée','a museum'],['un quartier','a district'],
  ['une gare','a station'],['un billet','a ticket'],['le métro','the metro'],
  ['une ligne','a route'],['visiter','to visit'],['découvrir','to discover'],
  ['voyager','to travel'],['arriver','to arrive'],['partir','to leave'],
  ['ouvert','open'],['fermé','closed'],['hier','yesterday']
].map(([french,english],i)=>({id:`fy9-qa-${i}`,french,english,
  year:9,spelling:true,topic:'Paris & travel'}));
const year8=(subject)=>Array.from({length:80},(_,i)=>{
  const target=(subject==='french'?'mot':'verbum')+i,english='meaning'+i,
  prefix=subject==='french'?'fr':'la',language=subject==='french'?'French':'Latin';
  const base={conceptId:`${prefix}-y8-concept-vocab-${i}`,topicId:`${prefix}-y8-test`,
    year:8,status:'enabled',formal:true,format:'typed_exact'};
  return [
    {...base,id:`${prefix}-y8-qa-${i}-l2e`,prompt:`Write the English meaning of this ${language} word.`,
      stimulus:{text:target,direction:`${language} → English`},answer:{accepted:[english]}},
    {...base,id:`${prefix}-y8-qa-${i}-e2l`,prompt:`Write the ${language} word for this English meaning.`,
      stimulus:{text:english,direction:`English → ${language}`},answer:{accepted:[target]}}
  ];
}).flat();
const run=(subject,opts={})=>selectDailyVocabulary({
  subject,items:year8(subject),year9Items:year9DailyVocabulary(subject,frenchTaught),
  day,seed:'qa-seed-1',size:30,...opts
});

test('Year 7–8 pool rejects sentences, grammar and MC scaffolds',()=>{
  const good=year8('french')[0];
  assert.equal(vocabularyQuestion(good,'french'),true);
  assert.equal(vocabularyQuestion({...good,id:'sentence',stimulus:{text:'je suis malade'}},'french'),false);
  assert.equal(vocabularyQuestion({...good,id:'english-sentence',stimulus:{text:'I am called'},
    prompt:'Translate into French',answer:{accepted:['je m’appelle']}},'french'),false);
  assert.equal(vocabularyQuestion({...good,id:'mc',format:'mc_single'},'french'),false);
  assert.equal(vocabularyQuestion({...good,id:'grammar',conceptId:'fr-y8-concept-grammar'},'french'),false);
});
test('French Year 9 pool accepts headwords and rejects full sentences',()=>{
  assert.ok(frenchHeadword('un musée'));
  assert.equal(frenchHeadword('je suis allée'),false);
  assert.equal(frenchHeadword('Combien coûte le billet ?'),false);
  assert.ok(year9DailyVocabulary('french',frenchTaught).length>=20);
});
for(const subject of ['latin','french']){
  test(`${subject}: 27 Year 7–8 + 3 Year 9, 30 distinct word concepts`,()=>{
    const q=run(subject);
    assert.equal(q.length,30);
    assert.equal(q.filter(x=>x._dailyYear9).length,3);
    assert.equal(q.filter(x=>!x._dailyYear9).length,27);
    assert.equal(new Set(q.map(x=>x.conceptId)).size,30);
    assert.ok(q.every(x=>x._dailyVocab===subject&&x.formal!==false));
  });
  test(`${subject}: new sessions are random, same seed is repeatable`,()=>{
    const a=run(subject),again=run(subject),b=run(subject,{seed:'qa-seed-2'});
    assert.deepEqual(a.map(q=>q.id),again.map(q=>q.id));
    assert.notDeepEqual(a.map(q=>q.id),b.map(q=>q.id));
  });
  test(`${subject}: ten due wrong words take review priority`,()=>{
    const first=run(subject).filter(q=>!q._dailyYear9).slice(0,10);
    const reviews=Object.fromEntries(first.map(q=>[q.id,{wrong:true,due:day,last:'2026-10-19'}]));
    const res=run(subject,{reviews});
    assert.equal(res.filter(q=>q._dailyBucket==='vocabulary-error-review').length,10);
    assert.ok(first.every(q=>res.some(x=>x.conceptId===q.conceptId)));
  });
  test(`${subject}: learned words not repeated while unused candidates exist`,()=>{
    const first=run(subject),credited=Object.fromEntries(first.map(q=>[q.id,true]));
    const second=run(subject,{seed:'qa-seed-3',ledger:{[day]:{[subject]:{items:credited}}}});
    assert.equal(second.length,30);
    assert.ok(second.every(q=>!first.some(prev=>prev.conceptId===q.conceptId)));
  });
  test(`${subject}: successful words wait for every other Year 7–8 word, even after the due date`,()=>{
    const items=year8(subject);
    const marked=Object.fromEntries(items.filter(q=>q.id.endsWith('-l2e')).slice(0,35).map(q=>[q.id,1]));
    const firstCorrect=items.find(q=>q.id.endsWith('-l2e'));
    const res=run(subject,{seenCorrect:marked,
      reviews:{[firstCorrect.id]:{wrong:false,last:'2026-10-18',due:day}}});
    assert.equal(res.filter(q=>!q._dailyYear9).length,27);
    assert.ok(res.filter(q=>!q._dailyYear9).every(q=>
      !items.slice(0,70).some(old=>old.conceptId===q.conceptId)),
      'Previously correct word cannot return in the opposite translation direction');
  });
  test(`${subject}: last unseen words lead, then cycle 2 starts within the 30-word set`,()=>{
    const items=year8(subject);
    const completed=Object.fromEntries(items.filter(q=>q.id.endsWith('-l2e')).slice(0,75).map(q=>[q.id,1]));
    const res=run(subject,{seenCorrect:completed}).filter(q=>!q._dailyYear9);
    assert.equal(res.length,27);
    assert.ok(res.slice(0,5).every(q=>!Object.keys(completed).some(id=>
      items.find(i=>i.id===id).conceptId===q.conceptId)));
    if(subject==='latin'){
      // The new school booklet extends the pool by ~95 Year 7–8 terms;
      // unfinished textbook words must win before second-cycle repetitions.
      assert.ok(res.every(q=>!items.some(i=>completed[i.id]&&i.conceptId===q.conceptId)),
        'Do not repeat 75 already-correct Latin words while booklet words remain');
    }else{
      assert.ok(res.slice(5).every(q=>items.some(i=>completed[i.id]&&i.conceptId===q.conceptId)));
    }
  });
  test(`${subject}: Year 9 cycles independently from Year 7–8`,()=>{
    const bank=year9DailyVocabulary(subject,frenchTaught);
    const concepts=[...new Set(bank.map(q=>q.conceptId))];
    const marked=Object.fromEntries(bank.filter(q=>concepts.slice(0,4).includes(q.conceptId)&&
      q.id.endsWith('-to-english')).map(q=>[q.id,1]));
    const res=run(subject,{seenCorrect:marked}).filter(q=>q._dailyYear9);
    assert.equal(res.length,3);
    assert.ok(res.every(q=>!concepts.slice(0,4).includes(q.conceptId)));
  });
  test(`${subject}: exhausted history still offers 30 distinct words with 3 Y9`,()=>{
    const all=[...year8(subject),...year9DailyVocabulary(subject,frenchTaught)];
    const credited=Object.fromEntries(all.map(q=>[q.id,true]));
    const res=run(subject,{ledger:{[day]:{[subject]:{items:credited}}}});
    assert.equal(res.length,30);
    assert.equal(res.filter(q=>q._dailyYear9).length,3);
    assert.equal(new Set(res.map(q=>q.conceptId)).size,30);
  });
}
