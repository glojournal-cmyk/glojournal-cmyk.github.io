import fs from 'node:fs';
import assert from 'node:assert/strict';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';
import {MAX_PET_LEVEL, ADVANCED_FORMS} from '../pet/pet-evolution-config-20261012.js';

const species='star-toadlet',dir='pet/art-bookish-duck-healer-20261019';
assert.equal(MAX_PET_LEVEL,10);
assert.deepEqual(ADVANCED_FORMS[species],['Healer Disciple','Graceful Medic','Refined Priestess','Divine Supporter','Archon Healer']);
for(let i=1;i<=10;i++){
 assert.ok(petArtUrl(species,i).includes(dir+'/level-'+i+'.png'), 'wrong image at Level '+i);
 const b=fs.readFileSync(dir+'/level-'+i+'.png');
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');
 assert.equal(b.readUInt32BE(16),1122,'width');
 assert.equal(b.readUInt32BE(20),1402,'height');
 assert.equal(b[25],6,'RGBA alpha');
}
assert.equal(petArtUrl(species,11),petArtUrl(species,10));
const pet=fs.readFileSync('pet/pet.js','utf8');
for(const name of ['Little Healer','Curious Apprentice','Potion Helper','Winged Junior Healer','Duckling Adept']) assert.ok(pet.includes('"'+name+'"'),name);
assert.match(pet,/id:"star-toadlet",name:"Bookish Duck Healer"/);
assert.match(pet,/pet\.species === "star-toadlet" && pet\.name === "Star Toadlet"/);
const home=fs.readFileSync('pet/home-pet.js','utf8');
assert.match(home,/"star-toadlet": "Bookish Duck Healer"/);
const personality=fs.readFileSync('pet/home-personality-20261010.js','utf8');
assert.match(personality,/A tiny healer opens her favourite spellbook/);
for(const p of ['index.html','404.html','pet/index.html']) assert.match(fs.readFileSync(p,'utf8'),/home-pet\.js\?v=20261019-[a-z0-9-]+/);
assert.match(fs.readFileSync('pet/index.html','utf8'),/pet\.js\?v=20261019-baphomet1/);
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('404.html','utf8'));
console.log('PASS duck healer 10-stage frog slot replacement; state identifiers retained');
