import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';
import {MAX_PET_LEVEL,ADVANCED_FORMS} from '../pet/pet-evolution-config-20261012.js';
// The legacy antler-bean ID is intentionally retained for player saves.
const id='antler-bean',folder='pet/art-baphomet-assassin-20261019';
const hashes=["905e96bd7229ce51c1977ce37d21e06c4d526c9f28eba6df62d9ecee1ab13e5a","26b4e988b3d0bbfb76093e77e7725417de4326b38c5779c8c058d2c9f5f8b3be","f48e410c6b5cd022c1507443efb6d3e7f09a5c6a2cf27dfaaf3edf1048f87be3","9bee11f81757a8731b86908540cfda19e99d70c2e1604d590d26add593ab3ca8","4afddc11aabbfe3e190d877170975bb68d8bdb795481a9608464b81b99eeb741","0c434a408475cc2155a35d224201797de15e8b57b8667b842bc507048050234c","79543978ab3422f540fc139b74771f0852a13451ef8d052778cbfd71f35b2754","c11ba0731cb305666f5db54a5eaf666ad43e7b2480dd28a91e762d927bee3266","a04761d51bf0eaee7ec711181ead84ed70c7b75748c94eaca93a61915af4c299","e0dfe1d6ec20c49083ef1c445d9b2be541795592ee49f3b5c24778be3a67c4e4"];
assert.equal(MAX_PET_LEVEL,10);
assert.deepEqual(ADVANCED_FORMS[id],['Crimson Cutthroat','Silent Fang','Nightshade Assassin','Eclipse Huntress','Baphomet Assassin Queen']);
const digestSet=new Set();
for(let lv=1;lv<=10;lv++){
 const url=petArtUrl(id,lv);
 assert.ok(url.includes('/'+folder+'/level-'+lv+'.png'),'Wrong Baphomet route at '+lv);
 const img=fs.readFileSync(folder+'/level-'+lv+'.png');
 assert.ok(img.length>50000,'Baphomet sprite too small');
 assert.equal(img.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG magic');
 assert.equal(img.readUInt32BE(16),1122);
 assert.equal(img.readUInt32BE(20),1402);
 assert.equal(img[25],6,'Original transparent RGBA file required');
 const digest=crypto.createHash('sha256').update(img).digest('hex');
 assert.equal(digest,hashes[lv-1],'Original approved character image must remain unchanged at '+lv);
 digestSet.add(digest);
}
assert.equal(digestSet.size,10,'Every Baphomet level must have distinct artwork');
assert.equal(petArtUrl(id,11),petArtUrl(id,10),'Level capped at 10');
const pet=fs.readFileSync('pet/pet.js','utf8');
assert.match(pet,/id:"antler-bean",name:"Baphomet"/);
for(const name of ['Imp Kidling','Wicked Scout','Night Prowler','Horned Stalker','Shadow Initiate']) assert.ok(pet.includes('"'+name+'"'));
assert.match(pet,/pet\.species === "antler-bean" && pet\.name === "Antler Bean"/);
const home=fs.readFileSync('pet/home-pet.js','utf8');
assert.match(home,/"antler-bean": "Baphomet"/);
const shell=fs.readFileSync('index.html','utf8'),fallback=fs.readFileSync('404.html','utf8');
assert.equal(shell,fallback,'Home and recovery shells must match');
assert.match(shell,/home-pet\.js\?v=20261019-[a-z0-9-]+/);
assert.match(fs.readFileSync('pet/index.html','utf8'),/pet\.js\?v=20261019-baphomet1/);
assert.ok(fs.readFileSync('assessment-link.js','utf8').startsWith('if(!/^\\/(pet|assessment)(\\/|$)/.test(location.pathname)'));
console.log('PASS: Baphomet female assassin LV1–10 exact approved RGBA sprites, labels and legacy save ID');
