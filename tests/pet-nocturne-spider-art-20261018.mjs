import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';
import {MAX_PET_LEVEL,ADVANCED_FORMS} from '../pet/pet-evolution-config-20261012.js';
const dir='pet/art-nocturne-spider-20261018';
const hashes={"5":"2f2975642a570ca0667c47f4781a11093e6d7ae7da139885903ba562413749d5","6":"423871f2c2f8ea923f8379f5f88996fb809d0ec737291630f9e8bf76e9e2c8c5","7":"7c894c8157a3f853168dff184230ee6a98d3a5b5bee957f1eb816b13457db751","8":"b5c31661781f732f107fa47a7f0abc495bb3e6340206d2412a88e9dfabe16e78","9":"fe2fc4caa3ae3c812d31a9c9d98f7d8cdf4d94cc6a4c9eba61914894b2758129","10":"99ffbeb4ce1737779d1046d9668bb680a61ad4a7d1a130217eee8791c7d1b45d"};
assert.equal(MAX_PET_LEVEL,10);
assert.deepEqual(ADVANCED_FORMS['night-spider'],['Violet sentinel','Archive seeker','Lore weaver','Nocturne maiden','Eternal nocturne']);
for(let lv=1;lv<=10;lv++){
 const url=petArtUrl('night-spider',lv);
 if(lv<=4){assert.match(url,/\/pet\/art-hd-20261009\/level-[1-4]\/night-spider\.webp/);continue}
 assert.ok(url.includes(`${dir}/level-${lv}.png`));
 const data=fs.readFileSync(`${dir}/level-${lv}.png`);
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(data.readUInt32BE(16),1122);
 assert.equal(data.readUInt32BE(20),1402);
 assert.equal(data[25],6);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),hashes[lv],'Wrong character LV'+lv);
 console.log('Nocturne Spider LV'+lv+' verified');
}
assert.equal(petArtUrl('night-spider',11),petArtUrl('night-spider',10));
assert.match(petArtUrl('snow-owl',10),/art-moonveil-owl-20261017/);
assert.match(petArtUrl('moon-puff',10),/art-moon-puff-20261013/);
assert.match(petArtUrl('moss-hornling',10),/art-moss-hornling-20261017/);
assert.match(petArtUrl('antler-bean',10),/art-antler-bean-individual-20261017/);
const app=fs.readFileSync('pet/pet.js','utf8');
assert.match(app,/forms:\["Velvet spiderling","Night runner","Obsidian hunter","Web guardian","Umbral bloom"\]/);
assert.match(app,/identity\.forms\.slice\(0,MAX_PET_LEVEL\)/);
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('404.html','utf8'));
console.log('Nocturne Spider approved art and level progression QA passed');
