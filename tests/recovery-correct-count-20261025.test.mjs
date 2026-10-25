import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordRecoveryAnswer,recoveryCorrectCount,reconcileRecoveredTaskHistory} from '../assets/recovery-task-ledger-20261017.js';
import {saveRecoveryReceipt,applyRecoveryReceipts,commitRecoverySession} from '../assets/recovery-receipt-20261018.js';
const date='2026-10-24',today='2026-10-25';
const task=(progress=0)=>({id:'year9-light',title:'Biology Daily',target:15,progress,
 done:false,assignedSubject:'biology',assignedYear:9,assignedTopic:'bio-y9-cell-structure',
 href:'/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task=year9-light&topic=bio-y9-cell-structure'});
const fixture=(progress=0)=>({today,daily:[{id:'year9-light',progress:0,target:15}],dailyLog:{
 [date]:{date,tasks:[task(progress)],done:0,total:1,complete:false},
 [today]:{date:today,tasks:[{id:'today-study',target:10,progress:7,done:false}],done:0,total:1}
}});
const credit=(s,q,correct=true)=>recordRecoveryAnswer(s,{today,date,taskId:'year9-light',questionId:q,correct});
function memory(){
 const m=new Map();
 globalThis.localStorage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
 return m;
}
test('Biology 15-question Recovery credits 10 distinct correct answers as 10/15, not 1/15 or 15/15',()=>{
 let state=fixture();
 const prior=JSON.stringify(state.dailyLog[today]);
 for(let i=0;i<10;i++){const out=credit(state,'biology-'+i);assert.equal(out.accepted,true);state=out.state;}
 assert.equal(state.dailyLog[date].tasks[0].progress,10);
 assert.equal(state.dailyLog[date].tasks[0].done,false);
 assert.equal(state.dailyLog[date].done,0);
 assert.equal(JSON.stringify(state.dailyLog[today]),prior);
 for(let i=10;i<15;i++)state=credit(state,'biology-'+i).state;
 assert.equal(state.dailyLog[date].tasks[0].progress,15);
 assert.equal(state.dailyLog[date].tasks[0].done,true);
 assert.equal(state.dailyLog[date].done,1);
});
test('Wrong, duplicate and repair attempts do not inflate marked correct Recovery progress',()=>{
 let state=fixture();
 state=credit(state,'first',false).state;
 assert.equal(state.dailyLog[date].tasks[0].progress,0);
 state=credit(state,'first',true).state;
 state=credit(state,'first@attempt-2',true).state;
 state=credit(state,'second',false).state;
 assert.equal(state.dailyLog[date].tasks[0].progress,1);
 assert.equal(recoveryCorrectCount(state.recoveryTaskByDay[date]['year9-light'].items),1);
});
test('Five previously credited plus ten correct Recovery answers completes exactly 15',()=>{
 let state=fixture(5);
 for(let i=0;i<10;i++)state=credit(state,'q'+i).state;
 assert.equal(state.dailyLog[date].tasks[0].progress,15);
 assert.equal(state.dailyLog[date].tasks[0].done,true);
});
test('Only verified correct-answer receipts replay credit on iPad; legacy wrong-unknown receipts do not',()=>{
 const mem=memory();
 try {
   assert.equal(saveRecoveryReceipt({date,taskId:'year9-light',questionIds:['wrong','unknown']}),true);
   assert.equal(applyRecoveryReceipts(fixture().dailyLog)[date].tasks[0].progress,0);
   const answers=Array.from({length:10},(_,i)=>({questionId:'correct-'+i,correct:true,formal:true,repair:false}));
   answers.push({questionId:'wrong',correct:false,formal:true,repair:false});
   answers.push({questionId:'repair',correct:true,formal:true,repair:true});
   assert.equal(commitRecoverySession({date,taskId:'year9-light',subject:'biology',answers,baseline:5}),true);
   const saved=JSON.parse(mem.get('lux-recovery-receipts-v1'))[date+':year9-light'];
   assert.equal(saved.correctQuestionIds.length,10);
   assert.equal(saved.questionIds.includes('wrong'),true,'legacy proof kept only for audit');
   assert.equal(saved.correctQuestionIds.includes('wrong'),false);
   assert.equal(applyRecoveryReceipts(fixture().dailyLog)[date].tasks[0].progress,15);
   assert.equal(applyRecoveryReceipts(fixture().dailyLog)[date].tasks[0].done,true);
 }finally{delete globalThis.localStorage;}
});
test('Incomplete 10/15 proof reconciles the historical 30-day date without rewriting today',()=>{
 const s=fixture();s.recoveryTaskByDay={[date]:{'year9-light':{originalCount:0,totalNeeded:15,completed:false,
   items:Object.fromEntries(Array.from({length:10},(_,i)=>['id'+i,true]))}}};
 const log=reconcileRecoveredTaskHistory(s,s.dailyLog);
 assert.equal(log[date].tasks[0].progress,10);
 assert.equal(log[date].tasks[0].done,false);
 assert.deepEqual(log[today],s.dailyLog[today]);
});
test('Active Practice and completion bridge are not capped at Standard 10 or full-session threshold',()=>{
 const practice=readFileSync(new URL('../assets/study._subject.practise-D_PWgUd7.js',import.meta.url),'utf8');
 const quest=readFileSync(new URL('../assets/quest-recovery-20261011.js',import.meta.url),'utf8');
 const runtime=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
 assert.match(practice,/dailyLocked&&dailyParams\.has\('recover'\)&&E!==`y8vocab`&&assignment\?\.target/);
 assert.match(practice,/lockedRemainingRef\.current\.remaining/);
 assert.match(quest,/for\(const questionId of unique\)/);
 assert.doesNotMatch(quest,/if\(unique\.size<Number\(target\.target\)\)/);
 assert.match(runtime,/if\(creditedExplicit&&correct===true\)saveRecoveryReceipt/);
});
