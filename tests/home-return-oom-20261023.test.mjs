import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const CANON='index-BLVOhKhN.js?v=20261023-share-permission1&ux=20261013-corrections2&uxfix=20261022-priority-ux1';
test('DailyNext + Study experience use the exact Home app module, never a duplicate student store',()=>{
 for(const name of ['assets/journey-navigation-ui-20261004.js','assets/study-experience-20260927.js']){
  const s=read(name);
  assert.ok(s.includes(CANON),name+' has stale app import');
  assert.doesNotMatch(s,/index-BLVOhKhN\.js\?v=20261018-mastery2/);
 }
});
test('Task result screen presents a direct, user-activated Home link',()=>{
 const s=read('assets/session-reflection-20261004.js');
 assert.match(s,/Return to Home/);
 assert.match(s,/window\.location\.assign\('\/'\)/);
});
test('Both practice bundles and Home route use the same freshly updated result module',()=>{
 const expected='journey-navigation-ui-20261004.js?v=20261023-home-return-stable1';
 for(const name of ['assets/routes-BEd1a0JC.core.js','assets/quiz-session-rWAnuDVj.js','assets/quiz-session-y8fix-20260920.js']){
  const s=read(name);
  assert.ok(s.includes(expected),name+' still uses a cached result module');
 }
 const result='session-reflection-20261004.js?v=20261023-home-return-stable1';
 for(const name of ['assets/quiz-session-rWAnuDVj.js','assets/quiz-session-y8fix-20260920.js']){
  assert.ok(read(name).includes(result),name+' still uses cached result screen');
 }
});
test('Home observes one animation frame, not a microtask for every mutation',()=>{
 const s=read('assets/routes-BEd1a0JC.js');
 assert.match(s,/requestAnimationFrame\(\(\) =>/);
 assert.match(s,/let cachedHref=null, cachedHrefAt=0/);
 assert.match(s,/store\.subscribe\(\(\)=>\{cachedHref=null;schedulePatch\(\)\}\)/);
 assert.doesNotMatch(s,/queueMicrotask\(\(\) => \{\s*queued = false;\s*patchHome\(\)/);
});
test('Historic Recovery never replays every older answer on live Practice marking',()=>{
 const s=read('assets/quest-recovery-20261011.js');
 assert.match(s,/function scheduleRecordProtection\(\)\{[\s\S]*?if\(location\.pathname!=="\/"&&location\.pathname!=="\/index\.html"\)return;/);
});
