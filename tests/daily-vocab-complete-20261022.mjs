import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {selectDailyVocabulary,vocabularyQuestion} from '../assets/daily-vocab-20261003.js';
import {year9DailyVocabulary} from '../assets/daily-vocab-y9-20261021.js';

const core=fs.readFileSync('assets/index-BLVOhKhN.core.js','utf8');
const practice=fs.readFileSync('assets/study._subject.practise-D_PWgUd7.js','utf8');
const practiceFallback=fs.readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
function bank(name){
  const start=core.indexOf(name+'=[')+name.length+1;assert.ok(start>0,name+' bank missing');
  let depth=0,quote=null,escape=false;
  for(let i=start;i<core.length;i++){
    const c=core[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;}
    else if(['"',"'",'`'].includes(c))quote=c;
    else if(c==='[')depth++;
    else if(c===']'&&--depth===0)return vm.runInNewContext(core.slice(start,i+1));
  }
  throw Error(name+' malformed');
}
const vocabulary={latin:bank('XS'),french:bank('WS')};
const catalog=JSON.parse(fs.readFileSync('content/catalog.json','utf8'));
const practiceFrFile=fs.readFileSync('assets/french-y9-practice-vocab.js','utf8');
const frStart=practiceFrFile.indexOf('=[')+1,frEnd=practiceFrFile.lastIndexOf(']')+1;
const frenchYear9=JSON.parse(practiceFrFile.slice(frStart,frEnd));
const normalize=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase()
  .replace(/\\([^)]*\\)/g,'').replace(/[^a-z0-9' ]/g,'').replace(/\\s+/g,' ').trim();
function foreign(q,subject){
  if(q._vocabTerm)return String(q._vocabTerm);
  const dir=String(q.stimulus?.direction||'').toLowerCase();
  const prompt=String(q.prompt||'').toLowerCase();
  const writing=/english\\s*(?:→|->|to)\\s*(?:latin|french)|english clue\\s*→\\s*latin form/.test(dir)||
    /translate into (?:latin|french)|write the (?:latin|french) (?:word|entry)|write the (?:exact )?latin form/.test(prompt);
  return String(writing?q.answer.accepted[0]:q.stimulus?.text||q.answer.accepted[0]);
}
function word(q,subject){return normalize(foreign(q,subject));}

for(const subject of ['latin','french']){
  const prefix=subject==='latin'?'la':'fr';
  const items=catalog.topics.filter(t=>t.subject===subject&&t.year===8)
    .flatMap(t=>JSON.parse(fs.readFileSync('content/topics/'+t.topicId+'.json','utf8')).questions||[]);
  const year9Items=year9DailyVocabulary(subject,frenchYear9);
  assert.ok(year9Items.length>=240,subject+' Year 9 corpus unexpectedly small');
  assert.ok(items.filter(q=>vocabularyQuestion(q,subject)).length>300,subject+' Year 8 vocab coverage too small');
  const state={seenCorrect:{},ledger:{}};
  const visitedYear8=new Set(),visitedYear9=new Set(),sampleNew=[];
  const stages=subject==='latin'?95:165;
  for(let i=0;i<stages;i++){
    const day=new Date(Date.UTC(2026,9,22+i)).toISOString().slice(0,10);
    const qs=selectDailyVocabulary({subject,items,year9Items,
      legacyVocabulary:vocabulary[subject],day,seed:day,seenCorrect:state.seenCorrect,ledger:state.ledger});
    assert.equal(qs.length,30,subject+' selected 30 words on round '+i);
    assert.equal(qs.filter(q=>q._dailyYear9).length,3,subject+' exactly 3 Year 9 words');
    assert.equal(qs.filter(q=>!q._dailyYear9).length,27,subject+' exactly 27 Year 7–8 words');
    const keys=qs.map(q=>word(q,subject));
    assert.equal(new Set(keys).size,30,subject+' no duplicated lexical items in one session');
    assert.ok(qs.every(q=>!/[!?;\\n]|[.]$/.test(foreign(q,subject))),
      subject+' sentences accidentally selected');
    state.ledger[day]={[subject]:{items:Object.fromEntries(qs.map(q=>[q.id,true]))}};
    for(const q of qs){
      (q._dailyYear9?visitedYear9:visitedYear8).add(word(q,subject));
      state.seenCorrect[q.id]=(state.seenCorrect[q.id]||0)+1;
      if(q._dailyYear9&&sampleNew.length<3)sampleNew.push(q._vocabTerm);
    }
  }
  assert.ok(visitedYear8.size>=90,subject+' Year 7–8 rotation failed');
  assert.ok(visitedYear9.size>=80,subject+' Year 9 rotation failed');
  console.log('DAILY_VOCAB_FULL_BANK',JSON.stringify({subject,legacyRows:vocabulary[subject].length,
    enabledVocabularyQuestions:items.filter(q=>vocabularyQuestion(q,subject)).length,
    year9LexicalItems:year9Items.length/2,visitedYear8:visitedYear8.size,
    visitedYear9:visitedYear9.size,days:stages,firstNewWords:sampleNew}));
}
for(const [label,source] of [['current',practice],['iPad fallback',practiceFallback]]){
  for(const phrase of ['year9Items:year9DailyVocabulary(subject,FY9)','seenCorrect:s.getState()?.seenCorrect',
    '20261022-complete-vocab1'])assert.ok(source.includes(phrase),label+' missing '+phrase);
}
console.log('DAILY_VOCAB_COMPLETE passed: both routes, 27+3 rotation, scoring identities, no duplicate words');
