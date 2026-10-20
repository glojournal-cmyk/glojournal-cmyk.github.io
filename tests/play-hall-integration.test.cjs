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
test('uses the same Home outfit state and actual earned points, never demo XP/rewards',()=>{
 assert.match(src,/state\.equippedOutfit\s*\|\|\s*'day'/);
 assert.match(src,/art\/home-rpg\/scholar-clean\.png/);
 assert.match(src,/art\/doll\/\$\{outfit\}\.png/);
 assert.ok(src.includes('state?.games?.[id]?.points'));
 assert.match(src,/Number\(state\.xp\)/);
 assert.doesNotMatch(src,/Best Score 1,280|\+20 XP|\+30 XP|bestScore:\s*\d/);
});
test('Play has no displayed pet and does not mutate any player or game record',()=>{
 assert.doesNotMatch(src,/petArtUrl|lux-pet-companion-v1|pet-level|lux-play-hall-pet|readPet\(/);
 for(const exp of [/store\.setState\s*\(/,/localStorage\.setItem\s*\(/,/localStorage\.removeItem\s*\(/,/\.award\(/]) assert.doesNotMatch(src,exp);
 assert.match(src,/\?playHallPreview=1|PREVIEW_PARAM/);
 assert.match(html,/play-hall-preview-20261020\.js/);
 assert.match(css,/\.lux-play-hall-card/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
});