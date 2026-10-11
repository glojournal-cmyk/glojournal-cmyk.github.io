import assert from 'node:assert/strict';
import fs from 'node:fs';
const home=fs.readFileSync('index.html','utf8');
const fallback=fs.readFileSync('404.html','utf8');
assert.equal(home,fallback,'root and fallback app must always match');
assert.match(home,/lux-emergency-boot-guard/);
assert.match(home,/Retry safely/);
assert.match(home,/data-lux-load-error/);
for(const name of ['phase7-companion-cheer-20261011.js','phase7-voice-cheers-20261011.js','phase2-quest-map-20261010.js','weekly-constellation-20261010.js']){
 const active=new RegExp('<script[^>]+src="[^"]*'+name.replaceAll('.','\\.')+'[^>]*><\\/script>');
 assert.doesNotMatch(home,active,'optional observer must remain disabled until verified: '+name);
}
assert.match(home,/<script[^>]+src="\/assets\/phase7-pet-personality-20261011\.js\?v=20261011-p4-safe1"/);
const pet=fs.readFileSync('assets/phase7-pet-personality-20261011.js','utf8');
assert.doesNotMatch(pet,/MutationObserver|queueMicrotask/,'Pet hello must use bounded event-driven mounting');
assert.match(pet,/attempts\+\+>=12/);
assert.match(home,/<script[^>]+src="\/assets\/phase7-mission-growth-20261011\.js\?v=20261011-p4-ribbon-safe1"/);
const ribbon=fs.readFileSync('assets/phase7-mission-growth-20261011.js','utf8');
assert.doesNotMatch(ribbon,/MutationObserver|queueMicrotask/,'Mission ribbon must avoid observer loops');
assert.match(ribbon,/attempts\+\+>=12/);
const guard=home.split('id="lux-emergency-boot-guard"')[1]?.split('</script>')[0]||'';
assert.ok(guard.length>100,'independent inline rescue must exist');
assert.doesNotMatch(guard,/localStorage\.setItem|localStorage\.removeItem|localStorage\.clear|indexedDB\.deleteDatabase/);
const preflight=fs.readFileSync('assets/progress-preflight-20261007.js','utf8');
assert.match(preflight,/Never overwrite, trim or delete an unreadable Scholar record on launch/);
assert.doesNotMatch(preflight,/localStorage\.clear\(/);
const voice=fs.readFileSync('assets/phase7-voice-cheers-20261011.js','utf8');
assert.match(voice,/if\(button\.textContent!==label\)button\.textContent=label/);
console.log('RECOVERY_PHASE_2_QA',JSON.stringify({safeMode:true,appAndFallbackIdentical:true,savedDataUntouched:true,optionalObserversDisabled:4,missionRibbonSafelyEnabled:true,petHelloSafelyEnabled:true,voiceLoopGuarded:true}));
