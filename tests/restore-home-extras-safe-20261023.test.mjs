import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const loader=file('assets/home-extras-restorer-20261023.js');
const expected=[
 '/pet/home-pet.js','/assets/garden-life-20261007.js','/lux-theme.js',
 '/assets/home-continue-20261010.js','/assets/quest-recovery-20261011.js',
 '/assets/study-rpg-live-boot-20261020.js','/assets/play-hall-live-boot-20261020.js',
 '/assets/scholar-image-recovery-20261020.js','/assets/scholar-play-chrome-20261021.js'
];
const canon='index-BLVOhKhN.js?v=20261024-correct-credit1&ux=20261013-corrections2&uxfix=20261022-priority-ux1';
test('all nine previously paused features have a staged restoration path',()=>{
 const loaded=[...loader.matchAll(/src:'([^']+)'/g)].map(x=>x[1].split('?')[0]);
 assert.equal(new Set(loaded).size,9);
 assert.deepEqual([...loaded].sort(),[...expected].sort());
 assert.match(loader,/window\.addEventListener\('lux:app-ready',routeCheck\)/);
 assert.match(loader,/await load\(feature\)/);
});
test('Lite switch disables optional features without clearing learner records',()=>{
 assert.match(loader,/get\('gloriaLite'\)==='1'/);
 assert.match(loader,/if\(isLite\(\)\)return/);
 assert.doesNotMatch(loader,/localStorage\.|indexedDB|resetAll|clearStorage|removeItem\(/);
 for(const page of ['index.html','404.html']){
  assert.equal(file(page).split('id="lux-home-extras-restorer"').length-1,1);
 }
});
test('restoring Pet, Study and Play cannot import stale duplicate app stores',()=>{
 for(const path of ['assets/progression-guard-20260927.js','assets/study-rpg-integrated-20261019.js',
   'assets/play-hall-preview-20261020.js','assets/quest-recovery-20261011.js',
   'assets/home-rpg-live-20261019.js']){
  const str=file(path);
  const references=[...str.matchAll(/index-BLVOhKhN\.js\?[^"'\s)]+/g)].map(m=>m[0]);
  assert.ok(references.length,path+' must use the shared store');
  assert.ok(references.every(v=>v===canon),path+' includes a stale App build');
 }
});
test('restored garden and Home pet reuse hydrated store rather than parsing giant JSON per redraw',()=>{
 for(const path of ['pet/home-pet.js','assets/garden-life-20261007.js']){
  assert.match(file(path),/__luxStore\?\.getState\?\.\(\)/);
 }
 const garden=file('assets/garden-life-20261007.js');
 assert.doesNotMatch(garden,/setInterval\(paint,\s*2000\)/);
 assert.match(garden,/root\.localStorage\.getItem\(LIFE_KEY\)!==next/);
});
test('Recovery avoids legacy overlay and extra history reparsing on RPG Home',()=>{
 const recovery=file('assets/quest-recovery-20261011.js');
 assert.match(recovery,/if\(rpgHome&&!document\.documentElement\.classList\.contains\("lux-rpg-recovery-open"\)\)return/);
 assert.match(recovery,/if\(relevant\)\{scheduleRecordProtection\(\);schedule\(\);\}/);
});
