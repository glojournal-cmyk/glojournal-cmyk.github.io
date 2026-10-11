import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../assets/phase7-companion-cheer-20261011.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/phase7-companion-cheer-20261011.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('Phase 7 mounts only on the home page and waits for app hydration',()=>{
 assert.match(js,/location\.pathname!=="\/"/);
 assert.match(js,/!root\.__luxAppReady/);
 assert.match(js,/state\.daily\.length!==10/);
 assert.match(html,/phase7-companion-cheer-20261011\.js/);
 assert.match(html,/phase7-companion-cheer-20261011\.css/);
});
test('Phase 7 skips initial state and only celebrates newly completed quests',()=>{
 assert.match(js,/if\(!prior\|\|prior\.day!==now\.day\)\{prior=now;return\}/);
 assert.match(js,/filter\(id=>!prior\.done\.has\(id\)\)/);
 assert.match(js,/if\(gained\.length\)celebrate\(gained\.length\)/);
});
test('Visual feedback preserves marks, data, artwork and reduced-motion preferences',()=>{
 assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem|importProgress|award\(|bumpDaily\(|setState\(/);
 assert.match(js,/img\.scholar-idle/);
 assert.match(js,/prefers-reduced-motion: reduce/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(js,/note\.remove\(\)/);
});

test('Phase 7B voice encouragement is opt-in, throttled, and does not alter marks',()=>{
 const voice=readFileSync(new URL('../assets/phase7-voice-cheers-20261011.js',import.meta.url),'utf8');
 assert.match(voice,/Well done!/);
 assert.match(voice,/Superb!/);
 assert.match(voice,/Great job!/);
 assert.match(voice,/Excellent!/);
 assert.match(voice,/enabled=false/);
 assert.match(voice,/12000/);
 assert.match(voice,/speechSynthesis/);
 assert.match(voice,/lux:phase7-mission-complete/);
 assert.match(voice,/aria-pressed/);
 assert.doesNotMatch(voice,/setState\(|importProgress\(|awardXP\(/);
 assert.match(html,/phase7-voice-cheers-20261011\.js/);
});
