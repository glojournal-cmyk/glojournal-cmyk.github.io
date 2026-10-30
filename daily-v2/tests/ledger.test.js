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

test('opaque legacy French 28/30 safely advances with two NEW concepts outside a proven old roster',()=>{
 const assigned=Array.from({length:30},(_,i)=>'old-concept-'+i);
 let l=makeDailyV2Ledger(day,{'french-vocab':{
  count:28,knownKeys:[],potentialLegacyKeys:assigned,
  potentialKeysVerified:true,potentialKeysSource:'archived-2026-10-26-french-frozen-roster'
 }});
 l=projectSavedDailyV2Attempt(l,a({eventId:'post-1',questionId:'new-q1',conceptId:'new-concept-a'}));
 l=projectSavedDailyV2Attempt(l,a({eventId:'post-2',questionId:'new-q2',conceptId:'new-concept-b'}));
 const s=progress(l);
 assert.equal(s.verifiedProgress,30);
 assert.equal(s.trustedLegacyExclusionUniverse,true);
 assert.equal(s.pendingUnreconciledCredits,0);
 assert.equal(s.requiresLegacyReconciliation,true);
});
test('re-answering a possibly credited old vocab concept cannot increase opaque baseline',()=>{
 const assigned=Array.from({length:30},(_,i)=>'old-concept-'+i);
 let l=makeDailyV2Ledger(day,{'french-vocab':{
  count:28,knownKeys:[],potentialLegacyKeys:assigned,
  potentialKeysVerified:true,potentialKeysSource:'archived-frozen-manifest'
 }});
 l=projectSavedDailyV2Attempt(l,a({eventId:'old-retry',conceptId:'old-concept-1'}));
 const s=progress(l);
 assert.equal(s.verifiedProgress,28);
 assert.equal(s.pendingUnreconciledCredits,1);
});
test('unverified historical potential-key list is never sufficient evidence to advance',()=>{
 let l=makeDailyV2Ledger(day,{'french-vocab':{
  count:28,knownKeys:[],potentialLegacyKeys:Array.from({length:30},(_,i)=>'old-'+i),
  potentialKeysVerified:false,potentialKeysSource:'untrusted'
 }});
 l=projectSavedDailyV2Attempt(l,a({eventId:'new-1',conceptId:'not-in-old-list'}));
 assert.equal(progress(l).verifiedProgress,28);
});
test('incomplete claimed legacy roster cannot be marked trusted',()=>{
 assert.throws(()=>makeDailyV2Ledger(day,{'french-vocab':{
  count:28,knownKeys:[],potentialLegacyKeys:['old-one'],
  potentialKeysVerified:true,potentialKeysSource:'incomplete-roster'
 }}),/verified potential legacy keys/);
});

test('GCSE 1/3 then verified 3/3 retry improves marks but not question count',()=>{
 let l=makeDailyV2Ledger(day);
 const exam={taskId:'gcse-exam-skills',questionId:'gcse-3',conceptId:null,marksPossible:3};
 l=projectSavedDailyV2Attempt(l,a({...exam,eventId:'partial',correct:false,marksEarned:1}));
 l=projectSavedDailyV2Attempt(l,a({...exam,eventId:'retry',correct:true,marksEarned:3}));
 const s=progress(l,'exam',3,'gcse-exam-skills');
 assert.equal(s.verifiedProgress,1);
 assert.deepEqual(s.examMarks,{earned:3,possible:3});
 assert.equal(l.attempts.length,2,'preserve both saved answer events');
});
test('GCSE retry summary is independent of event order and never adds marks twice',()=>{
 const exam={taskId:'gcse-exam-skills',questionId:'gcse-3',conceptId:null,marksPossible:3};
 const events=[
  a({...exam,eventId:'partial',correct:false,marksEarned:1}),
  a({...exam,eventId:'retry',correct:true,marksEarned:3}),
  a({...exam,eventId:'later-wrong',correct:false,marksEarned:0})
 ];
 for(const order of [events,[...events].reverse()]){
  let l=makeDailyV2Ledger(day);
  for(const e of order)l=projectSavedDailyV2Attempt(l,e);
  const s=progress(l,'exam',3,'gcse-exam-skills');
  assert.equal(s.verifiedProgress,1);
  assert.deepEqual(s.examMarks,{earned:3,possible:3});
 }
});
test('GCSE multi-question total uses best marks on each distinct original',()=>{
 let l=makeDailyV2Ledger(day);
 for(const [id,q,earned,possible] of [
  ['a','g1',0,1],['b','g2',1,2],['c','g2',2,2],['d','g3',1,3]
 ])l=projectSavedDailyV2Attempt(l,a({eventId:id,taskId:'gcse-exam-skills',
  questionId:q,conceptId:null,correct:earned===possible,marksEarned:earned,marksPossible:possible}));
 const s=progress(l,'exam',3,'gcse-exam-skills');
 assert.equal(s.verifiedProgress,3);
 assert.deepEqual(s.examMarks,{earned:3,possible:6});
});
test('conflicting possible marks in persisted GCSE history are not silently aggregated',()=>{
 let l=makeDailyV2Ledger(day);
 l=projectSavedDailyV2Attempt(l,a({eventId:'a',taskId:'gcse-exam-skills',questionId:'g1',
  conceptId:null,correct:false,marksEarned:1,marksPossible:2}));
 l=projectSavedDailyV2Attempt(l,a({eventId:'b',taskId:'gcse-exam-skills',questionId:'g1',
  conceptId:null,correct:true,marksEarned:3,marksPossible:3}));
 assert.throws(()=>progress(l,'exam',3,'gcse-exam-skills'),/conflicting exam maximum marks/);
});

test('legacy baselines cannot claim fewer credits than the number of known distinct identities',()=>{
 assert.throws(()=>makeDailyV2Ledger(day,{'latin-vocab':{
  count:1,knownKeys:['word-a','word-b']
 }}),/more known identities than credited items/);
});
