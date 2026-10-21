'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const src=fs.readFileSync(path.join(root,'assets/play-hall-preview-20261020.js'),'utf8');const css=fs.readFileSync(path.join(root,'assets/play-hall-preview-20261020.css'),'utf8');
const html=fs.readFileSync(path.join(root,'play/index.html'),'utf8');
const ids=['verbum-match','sentence-mosaic','phrase-mosaic','mot-match','dictation-dash','word-match','organelle-match','element-match','force-match','pe-circuit','forma-forge','manuscript','case-locker','error-hunter','sixty-blitz','weekly-boss','runway-check'];
test('17 existing game routes are preserved and have real native pages',()=>{
 for(const id of ids){assert.ok(src.includes(`'${id}'`),`missing ${id}`);assert.ok(fs.existsSync(path.join(root,`play/${id}/index.html`)),`missing native game ${id}`)}
 const lines=[...src.matchAll(/\['([a-z0-9-]+)','[^']+','(language|science|puzzle|challenge)'\]/g)];
 assert.equal(lines.length,17);assert.equal(new Set(lines.map(m=>m[1])).size,17);
 const totals=Object.fromEntries(['language','science','puzzle','challenge'].map(k=>[k,lines.filter(x=>x[2]===k).length]));assert.deepEqual(totals,{language:6,science:4,puzzle:4,challenge:3});
});
test('Every category shows all existing game chips rather than truncated preview entries',()=>{
 assert.match(src,/games\.forEach\(\(\[id,name\]\)=>chips\.append\(action\(id,name\)\)\)/);
 assert.doesNotMatch(src,/games\.slice\(0,3\)/);
 assert.match(css,/height:min\(69vh,39rem\)/);
 assert.match(css,/height:67vh/);
 assert.match(html,/play-hall-live-boot-20261020\.js\?v=20261021-medical-store2/);
});

test('uses the same Home outfit state and actual earned points, never demo XP/rewards',()=>{
 assert.match(src,/state\.equippedOutfit\s*\|\|\s*'day'/);
 assert.match(src,/art\/home-rpg\/scholar-clean\.png/);
 assert.match(src,/wardrobeOutfits\.find\(item=>item\.id===outfit\)\?\.art/);
 assert.match(src,/20261021-medical-careers1&ux=20261013-corrections2/);
 assert.ok(src.includes('state?.games?.[id]?.points'));
 assert.match(src,/Number\(state\.xp\)/);
 assert.doesNotMatch(src,/Best Score 1,280|\+20 XP|\+30 XP|bestScore:\s*\d/);
});
test('Play has no displayed pet and does not mutate any player or game record',()=>{
 assert.doesNotMatch(src,/petArtUrl|lux-pet-companion-v1|pet-level|lux-play-hall-pet|readPet\(/);
 for(const exp of [/store\.setState\s*\(/,/localStorage\.setItem\s*\(/,/localStorage\.removeItem\s*\(/,/\.award\(/]) assert.doesNotMatch(src,exp);
 assert.match(src,/PREVIEW_PARAM/);
 assert.match(html,/play-hall-live-boot-20261020\.js/);
 assert.match(css,/\.lux-play-hall-card/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
});
test('Approved Play Hall is the live default in native and SPA routes; old Play remains reversible',()=>{
 const boot=fs.readFileSync(path.join(root,'assets/play-hall-live-boot-20261020.js'),'utf8');
 const shared=fs.readFileSync(path.join(root,'assessment-link.js'),'utf8');
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const fallback=fs.readFileSync(path.join(root,'404.html'),'utf8');
 const study=fs.readFileSync(path.join(root,'study/index.html'),'utf8');
 assert.match(src,/get\(PREVIEW_PARAM\)!=='0'/);
 assert.match(src,/get\(PREVIEW_PARAM\)==='0'/);
 for(const html of [home,fallback,study])assert.match(html,/play-hall-live-boot-20261020\.js/);
 assert.equal(home,fallback,'GitHub Pages SPA 404 shell must mirror main home shell');
 assert.match(shared,/play-hall-live-boot-20261020\.js/);
 assert.match(boot,/playHallPreview.*'0'/);
 assert.match(boot,/stopImmediatePropagation/);
 assert.match(boot,/location\.assign\('\/play\/'/);
 for(const code of [boot,src]) {
  assert.doesNotMatch(code,/localStorage\.setItem\s*\(/);
  assert.doesNotMatch(code,/store\.setState\s*\(/);
 }
});
