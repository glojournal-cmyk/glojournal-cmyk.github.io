import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../assets/home-rpg-live-20261019.js',import.meta.url),'utf8');
const start=code.indexOf('  const todayStatus =');
const end=code.indexOf('  function nativePanel(',start);
assert.ok(start>0 && end>start,'record helpers must be present in the actual RPG UI');
const scope=vm.createContext({
  number:v=>Math.max(0,Number(v)||0),
  dayBefore:n=>['2026-10-19','2026-10-18','2026-10-17'][n]||''
});
vm.runInContext(code.slice(start,end)+'\n globalThis.q={todayStatus,recoveryCount};',scope);
const {todayStatus,recoveryCount}=scope.q;

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
