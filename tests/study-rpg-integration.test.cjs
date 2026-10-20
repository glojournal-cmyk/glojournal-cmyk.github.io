const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'../assets/study-rpg-integrated-20261019.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../assets/study-rpg-integrated-20261019.css'),'utf8');
test('identical source of truth to Home for equipped outfit and active Pet',()=>{
 assert.match(js,/state\.equippedOutfit\s*\|\|\s*'day'/);
 assert.match(js,/localStorage\.getItem\('lux-pet-companion-v1'\)/);
 assert.match(js,/petArtUrl\(petId, stage\)/);
 assert.match(js,/petState\.petLevels\?\.\[petId\]/);
 assert.match(js,/wardrobeOutfits\.find\(item => item\.id === outfit\)\?\.art/);
});
test('real same-site native learning routes and status without fake totals',()=>{
 for(const s of ['latin','french','biology','chemistry','physics','english']) assert.ok(js.includes(`'${s}'`));
 assert.match(js,/original\('learn'\)/);
 assert.match(js,/original\('practise'\)/);
 assert.match(js,/original\('progress'\)/);
 assert.doesNotMatch(js,/https:\/\/glojournal-cmyk\.github\.io|window\.open|target\s*=\s*['_"]_blank/);
 assert.doesNotMatch(js,/totals\s*=|total:\s*40/);
});
test('read-only no saved state mutation and keeps both year options',()=>{
 for(const pattern of [/store\.setState\(/,/localStorage\.setItem\(/,/localStorage\.removeItem\(/,/\.award\(/,/\.daily\.push\(/]) assert.doesNotMatch(js,pattern);
 assert.match(js,/\[8, 9\]/);
 assert.match(js,/HTMLSelectElement\.prototype/);
 assert.match(js,/lux-study-rpg-active/);
});
test('iPad layout with safe-area and no blank background if ZIP assets not deployed',()=>{
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/\/art\/stages\/classroom\.jpg/);
 assert.match(css,/body>\.paper-wash\{visibility:hidden/);
});

test('production route bridge loads real Study without preview query and has safe legacy fallback',()=>{
 const boot=fs.readFileSync(path.join(__dirname,'../assets/study-rpg-live-boot-20261020.js'),'utf8');
 const home=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const study=fs.readFileSync(path.join(__dirname,'../study/index.html'),'utf8');
 const native=fs.readFileSync(path.join(__dirname,'../assets/study-navigation-v2-20261010.js'),'utf8');
 for(const shell of [home,study]) assert.match(shell,/study-rpg-live-boot-20261020\.js/);
 assert.match(boot,/studyRpgPreview/);
 assert.match(boot,/=== '0'/,'safe native Study fallback');
 assert.match(boot,/pushState/);
 assert.match(boot,/study-rpg-integrated-20261019\.js/);
 assert.doesNotMatch(native,/studyRpgPreview.*=== '1'/);
 for(const file of [boot,native]) assert.doesNotMatch(file,/localStorage\.setItem\s*\(/);
});
