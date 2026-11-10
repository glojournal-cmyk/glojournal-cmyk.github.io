import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {dailyVocabTotal} from '../assets/daily-vocab-total-20261020.js';

test('French and Latin correct Daily words count after 23/30 saved, without false repeats or wrong credit',()=>{
 const day='2026-11-10';
 const task=s=>({id:s+'-vocab',planDate:day,target:30,progress:23,done:false});
 const state={today:day,daily:[task('french'),task('latin')],dailyLog:{},
   formalAttemptLog:[],dailyVocabByDay:{},seenCorrect:{}};
 const store={getState:()=>state,setState:patch=>Object.assign(state,patch)};
 const source=readFileSync('assets/index-BLVOhKhN.js','utf8');
 const start=source.indexOf('function recordDailyVocabAttempt(');
 const end=source.indexOf('function patchedRecordSpelling(',start);
 assert.ok(start>0&&end>start,'real runtime recorder is present');
 const box=vm.createContext({store,URLSearchParams,window:{location:{search:'?daily=1&locked=1&mode=y8vocab'}},
   todayKey:()=>day,dailyVocabTotal,originalBumpDaily:()=>{},scheduleNormalizeState:()=>{}});
 vm.runInContext(source.slice(start,end),box);
 const mark=(subject,id,correct,concept)=>{
   const before=structuredClone(state);
   box.recordDailyVocabAttempt(subject,id,correct,before,concept);
 };
 mark('french','f01',true,'bonjour');
 assert.equal(dailyVocabTotal(state,'french',day).progress,24);
 mark('french','f02',true,'maison');
 assert.equal(dailyVocabTotal(state,'french',day).progress,25);
 mark('french','f03',true,'maison');
 assert.equal(dailyVocabTotal(state,'french',day).progress,25,'reverse variant of an already credited concept is not a new word');
 mark('french','f04',false,'demain');
 assert.equal(dailyVocabTotal(state,'french',day).progress,25,'wrong answer cannot earn a point');
 mark('french','f04',true,'demain');
 assert.equal(dailyVocabTotal(state,'french',day).progress,26);
 mark('latin','l01',true,'servus');
 assert.equal(dailyVocabTotal(state,'latin',day).progress,24);
 assert.equal(dailyVocabTotal(state,'french',day).progress,26,'subjects are isolated');
});

test('the loaded Year 8 Practice scorer passes exact vocab concept evidence to the store',()=>{
 const src=readFileSync('assets/quiz-session-y8fix-20260920.js','utf8');
 assert.match(src,/vocabConcept:Y\._vocabConcept\|\|Y\.conceptId\|\|null/);
 assert.match(src,/dailyVocab:Y\._dailyVocab\|\|null/);
 const legacy=readFileSync('assets/session._kind-WQJEPsST.js','utf8');
 assert.doesNotMatch(legacy,/a&&d\(a,8\)/,'an 8-question legacy vocab session must not award eight unverified marks');
});
