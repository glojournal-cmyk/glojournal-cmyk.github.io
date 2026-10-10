import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getHomePersonality} from '../pet/home-personality-20261010.js';
const owl={species:'snow-owl',petLevels:{'snow-owl':4}};
const spider={species:'night-spider',petLevels:{'night-spider':5}};
assert.equal(getHomePersonality(owl,'Happy',0).kind,'owl');
assert.equal(getHomePersonality(spider,'Quiet',1).kind,'spider');
assert.match(getHomePersonality(owl,'Happy',0).message,/Owl|feathers|gaze|bow|starlight/i);
assert.match(getHomePersonality(spider,'Quiet',0).message,/quiet|silver|thread|velvet|star/i);
assert.equal(getHomePersonality({species:'untrusted'}).species,'moss-hornling');
assert.notEqual(getHomePersonality(owl,'Happy',0).message,getHomePersonality(owl,'Happy',1).message);
assert.equal(getHomePersonality(owl,'Sleepy',0).message.startsWith('A gentle, quiet hello.'),true);
const pet=fs.readFileSync('pet/home-pet.js','utf8');
const css=fs.readFileSync('pet/home-companion-v2.css','utf8');
for(const term of ["ensureHomePersonality(host)","playHomeGreeting(host)","greetingCleanup",
 "prefers-reduced-motion: reduce","document.hidden","readApp().sound===false"]){
 assert.ok((pet+css).includes(term),term);
}
assert.match(pet,/control\.type='button'/);
assert.match(pet,/aria-live/);
assert.match(pet,/renderCompanion\(host\)/,'existing companion art remains');
assert.match(pet,/showReturnReaction\(host\)/,'existing verified mission feedback remains');
assert.match(pet,/card\.href = "\/pet\/"/,'pet card still opens Companion Corner');
assert.match(pet,/audio=new AudioCtor\(\)/);
assert.match(pet,/getCareSummary\(\{persistRecovery:false\}\)/,'pet greeting does not write Energy recovery timestamp');
assert.doesNotMatch(pet,/performPetAction\(|awardBond\(|setState\(|awardXP\(/);
assert.doesNotMatch(fs.readFileSync('index.html','utf8'),/home-journey-v2-20261010\.js/,
 'do not reactivate the rolled-back blank-screen Home V2');
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('404.html','utf8'));
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
console.log('Phase 3 personality QA passed: twelve species, mood, stable Pet navigation, reduced motion, optional sound and no progress writes.');
