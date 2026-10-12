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
 assert.match(js,/if\(gained\.length\)\{celebrate\(gained\.length\)/);
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
 assert.match(readFileSync(new URL('../assessment-link.js',import.meta.url),'utf8'),/phase7-voice-cheers-20261011\.js\?v=20261012-phase3/);
 assert.doesNotMatch(voice,/MutationObserver|setInterval/);
 assert.doesNotMatch(voice,/setState\(|importProgress\(|awardXP\(/);
 assert.match(voice,/if\(button\.textContent!==label\)button\.textContent=label/);
 assert.doesNotMatch(html,/<script[^>]+src="\/assets\/phase7-voice-cheers-20261011\.js/,'legacy direct script stays disabled; voice loads through shared navigation'
);
});

test('Phase 7B adds companion encouragement only to verified completed missions',()=>{
 const js=readFileSync(new URL('../assets/phase7-mission-growth-20261011.js',import.meta.url),'utf8');
 assert.match(js,/\.lux-mission-v2\.is-complete/);
 assert.match(js,/is-unverified/);
 assert.match(js,/lux-phase7-growth/);
 assert.match(js,/Companion Corner/);
 assert.match(js,/card\.querySelector\("\.lux-phase7-growth"\)/);
 assert.doesNotMatch(js,/localStorage\.setItem|setState\(|awardXP|importProgress|\.progress\s*=/);
 assert.doesNotMatch(html,/<script[^>]+src="\/assets\/phase7-mission-growth-20261011\.js/,'extra mission ribbon remains paused; existing Mission Complete owns rewards');
});

test('Pet level and weekly boss celebrations are presentation-only and gated by verified evidence',()=>{
 const source=readFileSync(new URL('../assets/phase7-boss-pet-celebration-20261011.js',import.meta.url),'utf8');
 const pet=readFileSync(new URL('../pet/index.html',import.meta.url),'utf8');
 const boss=readFileSync(new URL('../play/weekly-boss/index.html',import.meta.url),'utf8');
 assert.match(source,/Boss cleared/);
 assert.match(source,/newest\?\.kind!=="evolution"/);
 assert.match(source,/after\.mpTransactions\.length<=\(before\.mpTransactions\|\|\[\]\)\.length/);
 assert.doesNotMatch(source,/setItem\(|setState\(|awardXP|savePet\(/);
 assert.match(pet,/phase7-boss-pet-celebration-20261011\.js/);
 assert.match(boss,/phase7-boss-pet-celebration-20261011\.js/);
});

test('Phase 7D pet personality interaction uses current art and leaves progress untouched',()=>{
 const js=readFileSync(new URL('../assets/phase7-pet-personality-20261011.js',import.meta.url),'utf8');
 assert.match(js,/mastery-pet-home/);
 assert.match(js,/lux-phase7-pet-hello/);
 assert.match(js,/prefers-reduced-motion: reduce/);
 assert.match(js,/snow-owl/);
 assert.match(js,/night-spider/);
 assert.match(js,/role","status"/);
 assert.doesNotMatch(js,/localStorage\.setItem|savePet\(|setState\(|awardXP/);
 assert.doesNotMatch(html,/<script[^>]+src="\/assets\/phase7-pet-personality-20261011\.js/,'existing home personality owns greeting');
});
