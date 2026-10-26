import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {practiceSessionYear} from '../assets/practice-session-year-20261026.js';
import {dailyCorrectQuestionIds,fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';
import {selectUnfinishedDailyQuestions} from '../assets/daily-unfinished-retry-20261025.js';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {saveCompletedDailyReceipt,reconcileCompletedDailyReceipts} from '../assets/daily-completed-session-receipts-20261024.js';

// Minimal anonymous reproduction of the 26 October iPad export: global Year 8,
// locked Year 9 Biology, 12 verified slots, six saved IDs and old Year 8 events.
const day='2026-10-26',topicId='bio-y9-b1',taskId='year9-light';
const bank=JSON.parse(readFileSync(new URL('../content/topics/bio-y9-b1.json',import.meta.url))).questions;
const ids=[
 'bio-y9-b1-nucleus-14d84707fa-mc-definition',
 'bio-y9-b1-nucleus-14d84707fa-mc-term',
 'bio-y9-b1-eukaryotic-cell-57fcf093ee-typed',
 'bio-y9-b1-cell-membrane-fae9fbdf9d-mc-term',
 'bio-y9-b1-chloroplast-2c5a2a3188-mc-definition',
 'bio-y9-b1-mitochondrion-bd24164e26-mc-term'];
const href='/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task='+taskId+'&topic='+topicId;
const task=()=>({id:taskId,planDate:day,assignedSubject:'biology',assignedYear:9,
 assignedTopic:topicId,href,target:15,progress:12,verifiedCorrectSlots:12,
 verifiedCorrectIds:[...ids],verifiedCorrectAssignment:[day,taskId,'biology',topicId,9,'standard',15].join('|')});
const state=()=>({today:day,year:8,xp:7902,seenCorrect:{},daily:[task(),{id:'untouched',target:30,progress:30}],
 formalAttemptLog:ids.slice(1).map(questionId=>({day,questionId,subject:'biology',year:8,
 topicId,dailyTaskId:taskId,mode:'standard',correct:true,formal:true,repair:false})),
 dailyLog:{[day]:{tasks:[task(),{id:'untouched',target:30,progress:30}],done:1,total:2}}});
const options={day,taskId,subject:'biology',year:9,topicId,mode:'standard'};
const source=questions=>({...options,questions,answers:questions.map(q=>({questionId:q.id,correct:true,formal:true,repair:false}))});
const choose=s=>{
 const correctIds=dailyCorrectQuestionIds(s,options);
 const selected=fillDailyLockedQuestions([],bank,{locked:true,mode:'standard',size:3,topicId,subject:'biology',correctIds},r=>r,(r,m,n)=>r.slice(0,n));
 return selectUnfinishedDailyQuestions(selected,bank,{...options,state:s,remaining:3});
};

test('explicit Year 9 overrides the persisted Year 8 selector; explicit Year 8 and free practice still work',()=>{
 assert.equal(practiceSessionYear('?year=9',8),9);
 assert.equal(practiceSessionYear('?year=8',9),8);
 assert.equal(practiceSessionYear('',8),8);
 assert.equal(practiceSessionYear('?year=invalid',9),9);
});
test('old Year 8 receipt fails exact Year 9 assignment validation',()=>{
 const result=reconcileDailySession(state(),{...source(choose(state())),year:8});
 assert.equal(result.changed,false);assert.equal(result.reason,'wrong-assignment');
});
test('six saved correct IDs never reappear despite a wrong-year or missing journal',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.deepEqual([...dailyCorrectQuestionIds(s,options)].sort(),[...ids].sort());
 const selected=choose(s);assert.equal(selected.length,3);
 assert.equal(selected.some(q=>ids.includes(q.id)),false);
 assert.equal(new Set(selected.map(q=>q.id)).size,3);
 assert.equal(JSON.stringify(s),before);
 const wrong={...options,day:'2026-10-25'};
 assert.equal(dailyCorrectQuestionIds(s,wrong).size,0);
 assert.equal(dailyCorrectQuestionIds({...s,daily:[{...task(),assignedTopic:'other'}]},options).size,0);
});
test('three fresh correct answers advance 12/15 to 15/15; repeat replay cannot add XP or touch other tasks',()=>{
 const s=state(),before=JSON.stringify(s),selected=choose(s);
 const result=reconcileDailySession(s,source(selected));
 assert.equal(result.progress,15);assert.equal(result.daily[0].done,true);
 assert.equal(result.dailyLog[day].tasks[0].progress,15);
 assert.equal(result.daily[0].target,15);
 assert.deepEqual(result.daily[1],s.daily[1]);assert.equal(s.xp,7902);
 assert.equal(JSON.stringify(s),before);
 const next={...s,daily:result.daily,dailyLog:result.dailyLog};
 assert.equal(reconcileDailySession(next,source(selected)).progress,15);
});
test('replaying already credited answers cannot fabricate the missing three',()=>{
 const s=state(),selected=bank.filter(q=>ids.includes(q.id)).slice(0,3);
 assert.equal(reconcileDailySession(s,source(selected)).progress,12);
});
test('Safari fallback receipt restores the completed Biology target after a reload',async()=>{
 const original=globalThis.localStorage,data=new Map();
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};
 try{
  const s=state();assert.equal(await saveCompletedDailyReceipt(s,source(choose(s))),true);
  const receipts=JSON.parse(data.get('lux-daily-completed-sessions-safe-v1'));
  const result=reconcileCompletedDailyReceipts(s,receipts);
  assert.equal(result.daily[0].progress,15);
  assert.equal(result.dailyLog[day].tasks[0].done,true);
  assert.deepEqual(result.daily[1],s.daily[1]);
 }finally{globalThis.localStorage=original;}
});
