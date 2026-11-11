import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {dailyVocabTotal} from '../assets/daily-vocab-total-20261020.js';

const day='2026-11-11';
const source=readFileSync('assets/index-BLVOhKhN.js','utf8');
const start=source.indexOf('function recordDailyVocabAttempt(');
const end=source.indexOf('function patchedRecordSpelling(',start);
assert.ok(start>=0&&end>start,'production recorder is accessible for direct regression');

function harness(search,pathname='/study/french/practise') {
  const state={today:day,daily:[
    {id:'french-vocab',planDate:day,progress:0,target:30},
    {id:'latin-vocab',planDate:day,progress:0,target:30}
  ],dailyLog:{},dailyVocabByDay:{},recoveryVocabByDay:{},
    formalAttemptLog:[],seenCorrect:{},recoveryAwarded:{}};
  const bump=[],awards=[],receipts=[];
  const box=vm.createContext({URLSearchParams,Date,
    window:{location:{search,pathname}},todayKey:()=>day,dailyVocabTotal,
    store:{getState:()=>state,setState:patch=>Object.assign(state,patch)},
    scheduleNormalizeState:()=>{},originalBumpDaily:(...a)=>bump.push(a),
    findRecoveryVocabSource:(s,date,subject)=>{
      const tasks=s.dailyLog?.[date]?.tasks||[];
      return {tasks,task:tasks.find(t=>t.id===subject+'-vocab')};
    },
    saveRecoveryReceipt:receipt=>receipts.push(receipt),
    originalAward:(...a)=>awards.push(a)
  });
  vm.runInContext(source.slice(start,end),box);
  const mark=(subject,id,correct,concept,verified=false)=>
    box.recordDailyVocabAttempt(subject,id,correct,structuredClone(state),concept,verified);
  return {state,bump,awards,receipts,mark,
    score:subject=>dailyVocabTotal(state,subject,day).progress};
}

test('free Dictation must not add even one Daily Vocab credit',()=>{
  const h=harness('?mode=dictation');
  h.mark('french','dictation-1',true,'bonjour');
  h.mark('latin','dictation-2',true,'servus');
  assert.equal(h.score('french'),0);
  assert.equal(h.score('latin'),0);
  assert.equal(h.bump.length,0);
  assert.deepEqual(h.state.dailyVocabByDay,{});
});

test('legacy vocabulary card review does not write formal Daily evidence',()=>{
  const h=harness('','/session/french-vocab');
  h.mark('french','review-1',true,'bonjour');
  assert.equal(h.score('french'),0);
  assert.equal(h.bump.length,0);
});

test('a valid locked French Daily answer still earns credit, but a repeated concept does not',()=>{
  const h=harness('?daily=1&locked=1&mode=y8vocab&task=french-vocab');
  h.mark('french','q1',true,'bonjour');
  assert.equal(h.score('french'),1);
  h.mark('french','q2',true,'bonjour');
  assert.equal(h.score('french'),1);
  h.mark('french','q3',false,'maison');
  assert.equal(h.score('french'),1);
  h.mark('french','q3',true,'maison');
  assert.equal(h.score('french'),2);
  assert.equal(h.score('latin'),0);
});

test('a French marker cannot accidentally credit a Latin locked Daily route',()=>{
  const h=harness('?daily=1&locked=1&mode=y8vocab&task=latin-vocab');
  h.mark('french','f1',true,'bonjour');
  assert.equal(h.score('french'),0);
  h.mark('latin','l1',true,'servus');
  assert.equal(h.score('latin'),1);
});

test('formal Practice identity survives SPA URL reset after quiz starts',()=>{
  const h=harness('?mode=standard');
  h.mark('french','f1',true,'bonjour',true);
  assert.equal(h.score('french'),1);
  assert.equal(h.bump.length,1);
});

test('dated Recovery still credits only the missed day and awards once',()=>{
  const h=harness('?recover=2026-11-10&task=french-vocab');
  h.state.dailyLog['2026-11-10']={tasks:[{
    id:'french-vocab',planDate:'2026-11-10',target:30,progress:29,done:false
  }]};
  h.mark('french','recovery-q1',true,'bonjour');
  assert.equal(h.score('french'),0);
  assert.equal(h.state.recoveryVocabByDay['2026-11-10'].french.completed,true);
  assert.equal(h.state.dailyLog['2026-11-10'].tasks[0].progress,30);
  assert.equal(h.state.daily[0].progress,0);
  assert.equal(h.receipts.length,1);
  assert.equal(h.awards.length,1);
  h.mark('french','recovery-q1',true,'bonjour');
  assert.equal(h.awards.length,1,'Recovery reward is never paid twice');
});
