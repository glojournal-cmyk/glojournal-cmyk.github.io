import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {dailyHistorySummary,CORE_DAILY_TASK_IDS} from '../assets/daily-history-display-20261030.js';

const code=fs.readFileSync(new URL('../assets/home-rpg-live-20261019.js',import.meta.url),'utf8');
const start=code.indexOf('  const todayStatus =');
const end=code.indexOf('  function nativePanel(',start);
assert.ok(start>0 && end>start,'record helpers must be present in the actual RPG UI');
const scope=vm.createContext({
  dailyHistorySummary,
  number:v=>Math.max(0,Number(v)||0),
  dayBefore:n=>['2026-10-19','2026-10-18','2026-10-17'][n]||''
});
vm.runInContext(code.slice(start,end)+'\n globalThis.q={todayStatus,recoveryCount};',scope);
const {todayStatus,recoveryCount}=scope.q;
// The modern iPad fixture is 29 October, while the older recovery fixtures
// above intentionally exercise the 17/18 October legacy plan.
const modernScope=vm.createContext({
  dailyHistorySummary,
  number:v=>Math.max(0,Number(v)||0),
  dayBefore:n=>['2026-10-30','2026-10-29','2026-10-28'][n]||''
});
vm.runInContext(code.slice(start,end)+'\n globalThis.q={todayStatus,recoveryCount};',modernScope);
const {todayStatus:modernTodayStatus,recoveryCount:modernRecoveryCount}=modernScope.q;

// Minimal anonymised fixture based on the user's 18 Oct backup:
// 16 Oct 7/10, 17 Oct 10/10, 18 Oct 9/10.
// The original private backup and identifiers are not committed.
const tasks=(done,total=10)=>Array.from({length:total},(_,i)=>({
  id:'task-'+i,target:10,progress:i<done?10:0,done:i<done
}));
const history={
 '2026-10-16':{date:'2026-10-16',done:7,total:10,complete:false,tasks:tasks(7)},
 '2026-10-17':{date:'2026-10-17',done:10,total:10,complete:true,tasks:tasks(10)},
 '2026-10-18':{date:'2026-10-18',done:9,total:10,complete:false,tasks:tasks(9)}
};
const state={dailyLog:history,formalAttemptLog:[{day:'2026-10-16',recoveryFor:'2026-10-16'}]};

test('older 7/10 incomplete day remains partial, not converted to complete',()=>{
  assert.equal(todayStatus(state,'2026-10-16'),'partial');
  assert.equal(state.dailyLog['2026-10-16'].done,7);
});
test('historical 10/10 stays done and a 9/10 day stays partial',()=>{
  assert.equal(todayStatus(state,'2026-10-17'),'done');
  assert.equal(todayStatus(state,'2026-10-18'),'partial');
  assert.equal(todayStatus(state,'2026-10-19'),'');
});
test('Recovery badge is informational; original 48h engine remains authoritative',()=>{
  assert.equal(recoveryCount(state),1);
  assert.match(code,/nativePanel\('recovery'\)/);
  assert.match(code,/getElementById\('lux-recovery-quests'\)/);
  assert.doesNotMatch(code,/\b(?:localStorage|sessionStorage)\.setItem\s*\(/);
});
test('historical fixture never changes as a side effect of UI reads',()=>{
  const original=JSON.stringify(state);
  for(const d of Object.keys(history))todayStatus(state,d);
  recoveryCount(state);
  assert.equal(JSON.stringify(state),original);
});

test('14 saved entries do not show a Recovery badge when all ten current tasks are done',()=>{
  const date='2026-10-29';
  const tasks=[
    ...CORE_DAILY_TASK_IDS.map(id=>({id,target:10,progress:10,done:true})),
    ...['study-session','year8-long-review','tend-garden','play-game'].map((id,i)=>({
      id,target:10,progress:i<2?10:0,done:i<2
    }))
  ];
  const record={date,tasks,total:14,done:12,complete:false};
  const mixed={dailyLog:{[date]:record},formalAttemptLog:[]};
  const before=JSON.stringify(mixed);
  // The UI must not treat two uncompleted old slots as new Daily obligations.
  // Native Recovery retains original evidence and remains separately authoritative.
  assert.equal(modernRecoveryCount(mixed),0);
  assert.equal(modernTodayStatus(mixed,date),'done');
  assert.equal(JSON.stringify(mixed),before);
});
test('14 saved entries still show Recovery when one of ten canonical tasks is genuinely unfinished',()=>{
  const date='2026-10-29';
  const tasks=[
    ...CORE_DAILY_TASK_IDS.map((id,i)=>({id,target:10,progress:i===9?0:10,done:i!==9})),
    ...['study-session','year8-long-review','tend-garden','play-game'].map(id=>({
      id,target:1,progress:1,done:true
    }))
  ];
  const mixed={dailyLog:{[date]:{date,tasks,total:14,done:13}},formalAttemptLog:[]};
  assert.equal(modernRecoveryCount(mixed),1);
  assert.equal(modernTodayStatus(mixed,date),'partial');
});

test('iPad Home and 404 load the new Recovery badge fix through uncached modules',()=>{
  const from=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const index=from('index.html'),fallback=from('404.html');
  const extras=from('assets/home-extras-restorer-20261023.js');
  const homeContinue=from('assets/home-continue-20261010.js');
  assert.equal(fallback,index,'deep link and Home use the same shell');
  assert.match(index,/home-extras-restorer-20261023\.js[^"']*history=20261030-ten-core2/);
  assert.match(extras,/home-continue-20261010\.js[^"']*history=20261030-ten-core2/);
  assert.match(homeContinue,/home-rpg-live-20261019\.js[^"']*history=20261030-ten-core2/);
  assert.ok(code.includes('dailyHistorySummary(row,date)'));
  assert.ok(code.includes('summary.canonicalOnly'));
});
