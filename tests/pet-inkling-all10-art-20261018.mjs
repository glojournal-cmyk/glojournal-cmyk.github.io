import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';
import {MAX_PET_LEVEL} from '../pet/pet-evolution-config-20261012.js';
const root='pet/art-inkling-all10-20261018';
const expected=["180cbc35bc241ba967f438dfe0376bb54c6b803958bc2183684353bd2db4b543","4ea3cb399fdafe6852e2281ed86ad7d453908ac8d1980f787007eeedf58b948c","480f3b42a70d10ebd2e773c96598e8fa4dc669e95a5c30d460b58314b5201dff","db006f98c6d80d0fb88a56c8b8fc03909368d118c152ee86b4f84f7604b98e14","e091edd504df8e159a6b47f1bd83dd3c620430f0a05eb9e07896079a3b29fd77","538083bad551095410fbf640e2bbf2b9dad595164bc1f76a2f0dbd3eed21d04b","2a36ddd186f410579410f97cde63748768e24bab0cdb10413fd93fb3d7cc3e35","06779ea77b161fcc2722d54fe49feb12de7e6773dc1a2433e592809680688cf4","ef3cafe3a0937ae944e342f7629bf90bb342f90033d7c5f725f51d385de4f21c","9978ac842a6743f1a6b8342477ced31a638fdfaa9498dc9759502c3b245e5cf3"];
assert.equal(MAX_PET_LEVEL,10);
for(let level=1;level<=10;level++){
 const url=petArtUrl('inkling',level);
 assert.ok(url.includes(`${root}/level-${level}.png`),'Wrong image route at LV'+level);
 const b=fs.readFileSync(`${root}/level-${level}.png`);
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(b.readUInt32BE(16),1086);
 assert.equal(b.readUInt32BE(20),1448);
 assert.equal(b[25],6,'Approved transparent PNG expected');
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),expected[level-1],'Approved image swapped at '+level);
 console.log('Inkling LV'+level+' approved full-body image verified');
}
assert.equal(new Set(expected).size,10,'All stages must be separate');
assert.equal(petArtUrl('inkling',11),petArtUrl('inkling',10));
assert.match(petArtUrl('night-spider',10),/art-nocturne-spider-20261018/);
assert.match(petArtUrl('snow-owl',10),/art-moonveil-owl-20261017/);
assert.match(petArtUrl('moss-hornling',10),/art-moss-hornling-20261017/);
assert.match(petArtUrl('antler-bean',10),/art-antler-bean-individual-20261017/);
assert.match(petArtUrl('moon-puff',10),/art-moon-puff-20261013/);
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('404.html','utf8'));
assert.match(fs.readFileSync('index.html','utf8'),/home-pet\.js\?v=20261018-keep-recover1-starling1/);
console.log('Inkling LV1-10 art regression QA passed');
