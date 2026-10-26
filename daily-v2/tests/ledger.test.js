import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeDailyV2Ledger,projectSavedDailyV2Attempt,summarizeDailyV2Task} from '../src/ledger.js';

const day='2026-10-26';
const a=(overrides={})=>({eventId:'e1',day,taskId:'french-vocab',questionId:'f1',conceptId:'bonjour',correct:true,...overrides});
const progress=(ledger,kind='vocab',target=30,id='french-vocab')=>summarizeDailyV2Task(ledger,{id,kind,target});

test('saved event is replay-idempotent',()=>{
 let l=makeDailyV2Ledger(day);l=projectSavedDailyV2Attempt(l,a());
 assert.strictEqual(projectSavedDailyV2Attempt(l,a()),l);
 assert.equal(l.attempts.length,1);
});
test('conflicting event ID does not overwrite saved answer',()=>{
 const l=projectSavedDailyV2Attempt(makeDailyV2Ledger(day),a());
 assert.throws(()=>projectSavedDailyV2Attempt(l,a({correct:false})),/conflicting replay/);
});
test('events from another day are rejected',()=>{
 assert.throws(()=>projectSavedDailyV2Attempt(makeDailyV2Ledger(day),a({day:'2026-10-25'})),/date/);
});
test('multiple question directions of the same vocab concept count once',()=>{
 let l=makeDailyV2Ledger(day);
 l=projectSavedDailyV2Attempt(l,a());
 l=projectSavedDailyV2Attempt(l,a({eventId:'e2',questionId:'f2'}));
 assert.equal(progress(l).verifiedProgress,1);
});
test('incorrect answer gives no credit, later successful answer gives one',()=>{
 let l=makeDailyV2Ledger(day);
 l=projectSavedDailyV2Attempt(l,a({correct:false}));
 assert.equal(progress(l).verifiedProgress,0);
 l=projectSavedDailyV2Attempt(l,a({eventId:'e2',correct:true}));
 assert.equal(progress(l).verifiedProgress,1);
});
test('task credit does not leak into another task',()=>{
 const l=projectSavedDailyV2Attempt(makeDailyV2Ledger(day),a());
 assert.equal(progress(l,'ordinary',20,'mastery-a').verifiedProgress,0);
});
test('opaque legacy baseline is preserved pending identity reconciliation',()=>{
 let l=makeDailyV2Ledger(day,{'french-vocab':{count:28,knownKeys:[]}});
 l=projectSavedDailyV2Attempt(l,a());
 const s=progress(l);
 assert.equal(s.verifiedProgress,28);
 assert.equal(s.pendingUnreconciledCredits,1);
 assert.equal(s.requiresLegacyReconciliation,true);
});
test('traceable legacy baseline can progress from 28 to 30',()=>{
 let l=makeDailyV2Ledger(day,{'french-vocab':{count:28,knownKeys:Array.from({length:28},(_,i)=>'old-'+i)}});
 l=projectSavedDailyV2Attempt(l,a());
 l=projectSavedDailyV2Attempt(l,a({eventId:'e2',questionId:'f2',conceptId:'salut'}));
 assert.equal(progress(l).verifiedProgress,30);
 assert.equal(progress(l).complete,true);
});
test('existing known legacy concept is not credited twice',()=>{
 let l=makeDailyV2Ledger(day,{'french-vocab':{count:1,knownKeys:['bonjour']}});
 l=projectSavedDailyV2Attempt(l,a());
 assert.equal(progress(l).verifiedProgress,1);
});
test('exam completion and awarded marks are separate',()=>{
 let l=makeDailyV2Ledger(day);
 l=projectSavedDailyV2Attempt(l,a({taskId:'gcse-exam-skills',questionId:'g1',conceptId:null,correct:false,marksEarned:1,marksPossible:3}));
 const s=progress(l,'exam',3,'gcse-exam-skills');
 assert.equal(s.verifiedProgress,1);
 assert.deepEqual(s.examMarks,{earned:1,possible:3});
});
test('unmarked exam attempt is not counted as completed',()=>{
 let l=makeDailyV2Ledger(day);
 l=projectSavedDailyV2Attempt(l,a({taskId:'gcse-exam-skills',questionId:'g1',conceptId:null,correct:false}));
 assert.equal(progress(l,'exam',3,'gcse-exam-skills').verifiedProgress,0);
});
test('invalid marks never enter ledger',()=>{
 assert.throws(()=>projectSavedDailyV2Attempt(makeDailyV2Ledger(day),a({marksEarned:4,marksPossible:3})),/marks invalid/);
});
