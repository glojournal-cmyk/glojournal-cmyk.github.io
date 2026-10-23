import test from 'node:test';
import assert from 'node:assert/strict';
import {assertFullProgressBackup} from '../assets/full-progress-backup-guard-20261023.js';
const ten=Array.from({length:10},(_,i)=>({id:'quest-'+i,progress:10,target:10}));
function state(){
 return {today:'2026-10-23',daily:ten,formalAttemptLog:[],
 dailyLog:{'2026-10-22':{tasks:[{id:'latin-vocab',progress:30,target:30,done:true}]}},
 dailyCompleteAwarded:{'2026-10-22':true},dailyVocabByDay:{}};
}
const wrap=s=>({app:'lux-scholar-garden',state:s});
test('complete 10-task and dated-evidence backup passes without mutation',()=>{
 const live=state(); const exported=wrap(structuredClone(live));
 const before=JSON.stringify(exported);
 assert.equal(assertFullProgressBackup(exported,live),true);
 assert.equal(JSON.stringify(exported),before);
});
test('rejects legacy 6-task export even when dated today',()=>{
 const old={...state(),daily:ten.slice(0,6)};
 assert.throws(()=>assertFullProgressBackup(wrap(old)),/10 current Daily Tasks/);
});
test('rejects legacy core-only export without dailyLog',()=>{
 const old=state();delete old.dailyLog;
 assert.throws(()=>assertFullProgressBackup(wrap(old)),/dailyLog/);
});
test('rejects missing answer journal',()=>{
 const old=state();delete old.formalAttemptLog;
 assert.throws(()=>assertFullProgressBackup(wrap(old)),/marked-answer history/);
});
test('never loses saved dated 10\/10 receipts',()=>{
 const old=state();delete old.dailyCompleteAwarded['2026-10-22'];
 assert.throws(()=>assertFullProgressBackup(wrap(old),state()),/2026-10-22/);
});
test('never downgrades saved 30\/30 task progress',()=>{
 const old=state();old.dailyLog['2026-10-22'].tasks[0].progress=0;
 assert.throws(()=>assertFullProgressBackup(wrap(old),state()),/lost completed question progress/);
});
test('rejects stale export with mismatched calendar day',()=>{
 const old=state();old.today='2026-10-20';
 assert.throws(()=>assertFullProgressBackup(wrap(old),state()),/Backup day/);
});
test('no synthetic data ever added during validation',()=>{
 const old=state();delete old.dailyCompleteAwarded['2026-10-22'];
 const before=JSON.stringify(old);
 assert.throws(()=>assertFullProgressBackup(wrap(old),state()));
 assert.equal(JSON.stringify(old),before);
});
