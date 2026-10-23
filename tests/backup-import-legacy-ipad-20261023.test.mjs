import test from 'node:test';
import assert from 'node:assert/strict';
import {assessImport,latestStudyEvidence,mergeImportProgress}
  from '../assets/backup-import-safety-20261023.js';
import {mergeDailyHistory} from '../assets/daily-record-integrity-20261018.js';

const day='2026-10-22';
const task=(id,target,progress)=>({id,target,progress,done:progress>=target});
const dated=(date,done)=>({date,done,total:10,complete:done===10,
  tasks:[task('latin-vocab',30,done===10?30:5)]});
const legacy=()=>({
 app:'lux-scholar-garden',version:10,exportedAt:'2026-10-23T10:59:46.800Z',
 state:{today:'2026-10-23',xp:7792,latinXp:3835,frenchXp:2753,
   daily:Array.from({length:6},(_,i)=>task('legacy-'+i,30,0)),
   studyDays:['2026-10-19','2026-10-20'],
   dailyCompleteAwarded:{'2026-10-19':true},
   seenTotal:{alpha:3},seenCorrect:{alpha:2},
   reviews:{alpha:{last:'2026-10-20',streak:2}}
 }});
const liveRecent=()=>({
 today:'2026-10-23',xp:7832,latinXp:3900,frenchXp:2800,
 daily:Array.from({length:10},(_,i)=>task('current-'+i,30,0)),
 studyDays:['2026-10-21','2026-10-22'],
 dailyLog:{[day]:dated(day,10)},dailyCompleteAwarded:{[day]:true},
 dailyVocabByDay:{[day]:{latin:{items:{item1:true}}}},
 formalAttemptLog:[{day,at:'2026-10-22T21:03:00Z',questionId:'item1',correct:true}],
 seenTotal:{alpha:7,beta:1},seenCorrect:{alpha:6,beta:1}
});
test('legacy iPad JSON is parseable but correctly labelled partial',()=>{
 const file=legacy(),report=assessImport(file,{xp:0,daily:[]});
 assert.equal(report.legacy,true);
 assert.equal(report.savedDay,'2026-10-20');
 assert.equal(report.currentHasProgress,false);
 assert.equal(report.canReplace,true);
});
test('newer iPad full-day 22 October receipt survives an older import',()=>{
 const current=liveRecent();
 const original=JSON.stringify(current);
 const incoming=legacy();
 const {backup,report,merged}=mergeImportProgress(incoming,current,mergeDailyHistory);
 assert.equal(merged,true);
 assert.equal(report.newerOnDevice,true);
 assert.equal(backup.state.xp,7832);
 assert.equal(backup.state.dailyCompleteAwarded[day],true);
 assert.equal(backup.state.dailyLog[day].complete,true);
 assert.equal(backup.state.dailyVocabByDay[day].latin.items.item1,true);
 assert.equal(backup.state.formalAttemptLog.length,1);
 assert.equal(backup.state.daily.length,10);
 assert.equal(backup.state.seenTotal.alpha,7);
 assert.equal(backup.state.seenCorrect.alpha,6);
 assert.equal(JSON.stringify(current),original);
 assert.equal(incoming.state.dailyLog,undefined);
});
test('import from original iPad to computer with an 18 October record keeps both',()=>{
 const computer={
  today:'2026-10-23',xp:6000,studyDays:['2026-10-18'],
  daily:Array.from({length:10},(_,i)=>task('computer-'+i,10,0)),
  dailyLog:{'2026-10-18':dated('2026-10-18',10)},
  dailyCompleteAwarded:{'2026-10-18':true},
  formalAttemptLog:[{day:'2026-10-18',questionId:'q1',correct:true}]
 };
 const {backup}=mergeImportProgress(legacy(),computer,mergeDailyHistory);
 assert.equal(backup.state.xp,7792);
 assert.equal(backup.state.dailyCompleteAwarded['2026-10-18'],true);
 assert.equal(backup.state.dailyCompleteAwarded['2026-10-19'],true);
 assert.equal(backup.state.dailyLog['2026-10-18'].complete,true);
 assert.ok(backup.state.studyDays.includes('2026-10-20'));
});
test('blank browser can accept a legacy backup without protecting starter data',()=>{
 const input=legacy();
 const {backup,merged}=mergeImportProgress(input,{xp:0,studyDays:[],daily:[]},mergeDailyHistory);
 assert.equal(merged,false);
 assert.equal(backup,input);
});
test('a login or export date alone is not academic completion evidence',()=>{
 assert.equal(latestStudyEvidence({today:'2026-10-23',loginDays:['2026-10-23'],
 daily:Array.from({length:10},(_,i)=>task('t'+i,10,0))}),'');
});
test('merging the same daily answer twice does not double it',()=>{
 const current={...liveRecent(),dailyLog:{},dailyCompleteAwarded:{}};
 const incoming={...legacy(),state:{...legacy().state,
  formalAttemptLog:[{day,at:'2026-10-22T21:03:00Z',questionId:'item1',correct:true}]}};
 const out=mergeImportProgress(incoming,current,mergeDailyHistory);
 assert.equal(out.backup.state.formalAttemptLog.length,1);
});
test('correct vocabulary evidence never turns false during an import',()=>{
 const current={...liveRecent(),dailyVocabByDay:{[day]:{french:{items:{bonjour:true}}}}};
 const incoming={...legacy(),state:{...legacy().state,dailyVocabByDay:{
  [day]:{french:{items:{bonjour:false,aller:true}}}
 }}};
 const out=mergeImportProgress(incoming,current,mergeDailyHistory);
 assert.equal(out.backup.state.dailyVocabByDay[day].french.items.bonjour,true);
 assert.equal(out.backup.state.dailyVocabByDay[day].french.items.aller,true);
});
