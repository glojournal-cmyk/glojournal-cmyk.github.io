import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const CANON=read('index.html').match(/index-BLVOhKhN\.js\?v=[^\"'<>\s]+/)?.[0];
assert.ok(CANON);
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
test('Home and both Practice bundles resolve the same actual Journey, Result and store modules',()=>{
 // A module's complete import specifier (including query string) determines
 // its browser ESM identity. Never pin this check to an older release token.
 function imports(filename,pattern){
  return [...new Set([...read(filename).matchAll(pattern)]
   .map(match=>match[0].replace(/^\.\//,'/assets/')))];
 }
 const storePattern=/(?:\/assets\/|\.\/)index-BLVOhKhN\.js\?[^"'<>\s)]+/g;
 const journeyPattern=/(?:\/assets\/|\.\/)journey-navigation-ui-20261004\.js\?[^"'<>\s)]+/g;
 const resultPattern=/(?:\/assets\/|\.\/)session-reflection-20261004\.js\?[^"'<>\s)]+/g;
 const homeStore=imports('index.html',storePattern);
 assert.equal(homeStore.length,1,'Home must load exactly one canonical store URL');
 const routes=['assets/routes-BEd1a0JC.core.js',
  'assets/quiz-session-rWAnuDVj.js',
  'assets/quiz-session-y8fix-20260920.js'];
 const journey=imports(routes[0],journeyPattern);
 assert.equal(journey.length,1,'Home route must load one versioned Journey module');
 // Journey must be updated along with the active Home store cache key.
 const homeRelease=new URL(homeStore[0],'https://example.test').searchParams.get('v');
 const journeyRelease=new URL(journey[0],'https://example.test').searchParams.get('v');
 assert.ok(homeRelease,'Home store has a cache release');
 assert.equal(journeyRelease,homeRelease,
  'Home Journey must match the actual current Home store release');
 for(const filename of routes){
  assert.deepEqual(imports(filename,storePattern),homeStore,
   filename+' must share exactly the Home store ESM URL');
  assert.deepEqual(imports(filename,journeyPattern),journey,
   filename+' must share exactly the Home Journey ESM URL');
 }
 for(const filename of ['assets/journey-navigation-ui-20261004.js',
  'assets/study-experience-20260927.js']){
  assert.deepEqual(imports(filename,storePattern),homeStore,
   filename+' must not open an independent store');
 }
 const quizResult=imports(routes[1],resultPattern);
 assert.equal(quizResult.length,1,'Primary quiz must load one versioned Result module');
 assert.deepEqual(imports(routes[2],resultPattern),quizResult,
  'Both Practice quiz bundles must load the identical Result ESM URL');
 // A Result module may have a different release token from Home; both
 // consuming quiz bundles must still share the exact same module identity.
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
