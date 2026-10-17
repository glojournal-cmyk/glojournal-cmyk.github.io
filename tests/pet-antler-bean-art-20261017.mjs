import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';
const folder='pet/art-antler-bean-individual-20261017';
const digests=new Set();
for(let level=1;level<=10;level++){
  const art=petArtUrl('antler-bean',level);
  if(level<=4){assert.match(art,/\/pet\/art-hd-20261009\/level-[1-4]\/antler-bean\.webp/);continue}
  assert.ok(art.includes(`${folder}/level-${level}.png`),'Wrong level route '+level);
  const img=fs.readFileSync(`${folder}/level-${level}.png`);
  assert.ok(img.length>50000,'Antler Bean LV'+level+' missing or undersized');
  assert.equal(img.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const w=img.readUInt32BE(16),h=img.readUInt32BE(20),type=img[25];
  assert.ok(w>=1000&&h>=1300,'Insufficient image resolution '+level);
  assert.ok(type===6||type===4,'Transparent alpha channel missing '+level);
  digests.add(crypto.createHash('sha256').update(img).digest('hex'));
  console.log('Antler Bean Level '+level+': '+w+'x'+h+', '+img.length+' bytes');
}
assert.equal(digests.size,6,'Antler Bean LV5–10 must be six distinct sprites');
// Each hand-illustrated stage must resolve to the new individual image set.
for(let level=5;level<=10;level++){
 assert.match(petArtUrl('antler-bean',level),/art-antler-bean-individual-20261017/);
 assert.doesNotMatch(petArtUrl('antler-bean',level),/art-antler-bean-v3-20261017\/level/);
}
assert.equal(petArtUrl('antler-bean',11),petArtUrl('antler-bean',10));
assert.match(petArtUrl('moss-hornling',10),/art-moss-hornling-20261017/);
assert.match(petArtUrl('moon-puff',10),/art-moon-puff-20261013/);
const gallery=fs.readFileSync('pet/pet.js','utf8');
assert.match(gallery,/identity\.forms\.slice\(0,MAX_PET_LEVEL\)/);
const formData=fs.readFileSync('pet/pet-evolution-config-20261012.js','utf8');
for(const label of ['Ancient amber stag','Little autumn faun','Golden antler knight','Autumn spirit maiden','Eternal antler sovereign']){
  assert.ok(formData.includes(label),'Missing new Antler Bean evolution stage name: '+label);
}
const pageLoader=fs.readFileSync('assessment-link.js','utf8');
assert.ok(pageLoader.startsWith('if(!/^\\/(pet|assessment)(\\/|$)/.test(location.pathname))'),'Pet standalone guard lost');
console.log('Antler Bean alpha image and gallery compatibility QA passed');
