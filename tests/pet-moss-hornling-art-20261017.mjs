import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';

const root='pet/art-moss-hornling-20261017';
const digests=new Set();
for(let level=1;level<=10;level++){
 const path=petArtUrl('moss-hornling',level);
 if(level<=4){
   assert.match(path,/\/pet\/art-hd-20261009\/level-[1-4]\/moss-hornling\.webp/);
   continue;
 }
 assert.ok(path.includes(`${root}/level-${level}.png`), 'Wrong Moss art level '+level);
 const file=`${root}/level-${level}.png`;
 const buf=fs.readFileSync(file);
 assert.ok(buf.length>50000,'Tiny or missing sprite for LV'+level);
 assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20),type=buf[25];
 assert.ok(w>=1000&&h>=1000,'Low resolution sprite '+level);
 assert.ok(type===4||type===6,'Non-alpha sprite '+level);
 digests.add(crypto.createHash('sha256').update(buf).digest('hex'));
 console.log('Moss Hornling',level, w+'x'+h, buf.length);
}
assert.equal(digests.size,6,'LV5–10 should use six distinct images');
assert.equal(petArtUrl('moss-hornling',11),petArtUrl('moss-hornling',10),'Keep max level capped at 10');
assert.match(petArtUrl('moon-puff',10),/art-moon-puff-20261013/,'Keep Moon Puff intact');
assert.match(petArtUrl('antler-bean',10),/art-antler-bean-individual-20261017/,'Antler Bean has own updated art');
const petJS=fs.readFileSync('pet/pet.js','utf8');
assert.match(petJS,/identity\.forms\.slice\(0,MAX_PET_LEVEL\)/,'No duplicate LV11–15 cards');
console.log('Moss Hornling LV5–10 sprite QA passed');
