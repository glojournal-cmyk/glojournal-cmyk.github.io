import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';
import {MAX_PET_LEVEL,ADVANCED_FORMS} from '../pet/pet-evolution-config-20261012.js';
const root='pet/art-moonveil-owl-20261017';
const expected={
  5:'113e8f44c81cfbf64b560d8901dba6c6055984bd380fbaf3e5f512d5fcb75aa5',
  6:'78f69c8bfb73d8ce4b6de5d8a40d567ff50cef86322b044e4e239d68f2987c34',
  7:'b37262e45d669f6884ba197707445f7ca27f05b1e5c9104ed651558528a40e90',
  8:'f496ce8b2ce5cdf1e6f510dec92cb685c92e6cd99f1e0ab01b273637f2e03fa8',
  9:'4b40565341293aa04aa23e1cf95fc0c76694eca4beeca2774297861d960c27bf',
  10:'52422f35da7a3a41597d5fd0573a8f69f966f3fcdf5d5580db3ce7a939929603'
};
assert.equal(MAX_PET_LEVEL,10);
assert.deepEqual(ADVANCED_FORMS['snow-owl'],['Starlit guardian beast','Lunar scholarling','Moonwing knight','Nocturne spirit maiden','Eternal nocturne queen']);
for(let lv=1;lv<=10;lv++){
 const src=petArtUrl('snow-owl',lv);
 if(lv<=4){assert.match(src,/\/pet\/art-hd-20261009\/level-[1-4]\/snow-owl\.webp/);continue}
 assert.ok(src.includes(`${root}/level-${lv}.png`),'Wrong Moonveil Owl sprite '+lv);
 const png=fs.readFileSync(`${root}/level-${lv}.png`);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=png.readUInt32BE(16),h=png.readUInt32BE(20),color=png[25];
 assert.equal(w,1086); assert.equal(h,1448);
 assert.equal(color,6,'Requires an RGBA image with a transparent background');
 assert.equal(crypto.createHash('sha256').update(png).digest('hex'),expected[lv],`Incorrect LV${lv} final-approved file`);
 console.log('Moonveil Owl LV'+lv+': verified exact illustrated transparent sprite '+w+'x'+h);
}
assert.equal(petArtUrl('snow-owl',11),petArtUrl('snow-owl',10));
assert.match(petArtUrl('moon-puff',10),/art-moon-puff-20261013/);
assert.match(petArtUrl('moss-hornling',10),/art-moss-hornling-20261017/);
assert.match(petArtUrl('antler-bean',10),/art-baphomet-assassin-20261019/);
const pet=fs.readFileSync('pet/pet.js','utf8');
assert.match(pet,/name:"Moonveil Owl"/);
assert.match(pet,/identity\.forms\.slice\(0,MAX_PET_LEVEL\)/);
assert.match(pet,/Moonlit companion/);
const home=fs.readFileSync('index.html','utf8');
const recovery=fs.readFileSync('404.html','utf8');
assert.equal(home,recovery);
assert.match(home,/home-pet\.js\?v=20261019-[a-z0-9-]+/);
console.log('Moonveil Owl six individual sprites and original levels verified');
