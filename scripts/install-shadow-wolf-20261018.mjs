// Guarded, all-or-nothing installer: Velvet Batling -> Shadow Wolf (female archer LV10).
// NEVER change the internal species ID or player storage keys.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const manifestPath='shadow-wolf-download-request.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
assert.equal(manifest.length,10,'Require all ten sprites');
assert.deepEqual(manifest.map(v=>v.level),Array.from({length:10},(_,i)=>i+1));
const folder='pet/art-shadow-wolf-20261018';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shadow-wolf-'));
const payload=[];
try {
 for(const {level,url,sha256} of manifest){
  assert.match(url,/^https:\/\/at\.adobe\.com\/[A-Za-z0-9]+$/,'Unexpected source URL');
  assert.match(sha256,/^[0-9a-f]{64}$/);
  const p=path.join(tmp,'level-'+level+'.png');
  execFileSync('curl',['--fail','--location','--retry','3','--silent','--show-error','--max-time','180',url,'--output',p],{stdio:'inherit'});
  const buf=fs.readFileSync(p);
  const digest=crypto.createHash('sha256').update(buf).digest('hex');
  assert.equal(digest,sha256,'Source integrity mismatch: LV'+level);
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Expected PNG: LV'+level);
  assert.equal(buf.readUInt32BE(16),1254,'Image width LV'+level);
  assert.equal(buf.readUInt32BE(20),1254,'Image height LV'+level);
  assert.equal(buf[25],6,'Full RGBA transparency required LV'+level);
  assert.ok(buf.length>200000,'Unexpectedly small image at level '+level);
  payload.push(buf);
 }
 assert.equal(new Set(payload.map(v=>crypto.createHash('sha256').update(v).digest('hex'))).size,10,'Duplicate level');
 fs.mkdirSync(folder,{recursive:true});
 for(let i=0;i<10;i++) fs.writeFileSync(path.join(folder,'level-'+(i+1)+'.png'),payload[i]);
}finally {fs.rmSync(tmp,{recursive:true,force:true})}

function patch(file,oldText,newText){
 const original=fs.readFileSync(file,'utf8');
 assert.ok(original.includes(oldText),'Expected code missing: '+file+' / '+oldText.slice(0,70));
 fs.writeFileSync(file,original.replaceAll(oldText,newText),'utf8');
}
patch('pet/pet-art-hd-20261009.js',
 "  // Keep bloom-snail as the persistent storage identity to preserve player XP, levels, and history.",
 "  // The velvet-batling species ID remains unchanged for saved MP, unlocks and selection.\n"+
 "  if(safe==='velvet-batling') return '/pet/art-shadow-wolf-20261018/level-'+stage+'.png?v=20261018-shadow-wolf1';\n"+
 "  // Keep bloom-snail as the persistent storage identity to preserve player XP, levels, and history.");
patch('pet/pet.js',
 '{id:"velvet-batling",name:"Velvet Batling",tag:"Dark corners, warmer company."}',
 '{id:"velvet-batling",name:"Shadow Wolf",tag:"From a little moonlit wolf to a fearless night archer."}');
patch('pet/pet.js',
 '"velvet-batling": {nature:"Witty, alert and fond of mysteries",habit:"Listens for the answer everyone else missed.",forms:["Little velvet bat","Scallop-wing glider","Echo explorer","Night-wing guardian","Crescent sentinel"]}',
 '"velvet-batling": {nature:"Brave, loyal and quietly determined",habit:"Studies by moonlight and follows each new discovery.",forms:["Moonlit Pup","Growing Guardian","Star-touched Wolf","Night Sentinel","Lunar Guardian"]}');
patch('pet/pet.js',
 '"velvet-batling":{close:"Velvet Batling hears mastery approaching",due:"Velvet Batling echoes a reminder",steady:"Velvet Batling approves from the shadows",waiting:"Velvet Batling is listening for the first answer"}',
 '"velvet-batling":{close:"Shadow Wolf senses mastery approaching",due:"Shadow Wolf brings a moonlit reminder",steady:"Shadow Wolf celebrates steady progress",waiting:"Shadow Wolf is ready for the first quest"}');
patch('pet/home-pet.js','"velvet-batling": "Velvet Batling"','"velvet-batling": "Shadow Wolf"');
patch('pet/home-personality-20261010.js',
 '"velvet-batling":["Velvet wings make a graceful little bow.","A playful dusk-dance begins.","The batling watches over the next quest."]',
 '"velvet-batling":["Shadow Wolf watches over the scholar’s garden.","A crescent of gold shines in soft fur.","Your moonlit companion wags its starry tail."]');
patch('pet/pet-evolution-config-20261012.js',
 "'velvet-batling':['Moon-crowned sentinel','Radiant dusk guardian','Celestial night keeper','Mythic crescent sovereign','Eternal twilight guardian']",
 "'velvet-batling':['Moonlight Sentinel','Celestial Wolf','Wolf Spirit Archer','Lunar Huntress','Moonshadow Archer']");
patch('pet/pet.js','pet-art-hd-20261009.js?v=20261018-starling1','pet-art-hd-20261009.js?v=20261018-shadow1');
patch('pet/home-pet.js','pet-art-hd-20261009.js?v=20261018-starling1','pet-art-hd-20261009.js?v=20261018-shadow1');
patch('pet/home-pet.js','home-personality-20261010.js?v=20261018-starling1','home-personality-20261010.js?v=20261018-shadow1');
patch('assets/companion-art-20261004.js','pet-art-hd-20261009.js?v=20261018-starling1','pet-art-hd-20261009.js?v=20261018-shadow1');
patch('pet/index.html','pet.js?v=20261018-starling1','pet.js?v=20261018-shadow1');
for(const file of ['index.html','404.html'])
 patch(file,'home-pet.js?v=20261018-keep-recover1-starling1','home-pet.js?v=20261018-keep-recover1-shadow1');
patch('tests/pet-moon-puff-art-20261013.mjs','20261018-starling1','20261018-shadow1');
for(const file of ['tests/pet-moonveil-owl-art-20261017.mjs','tests/pet-inkling-all10-art-20261018.mjs'])
 patch(file,'20261018-keep-recover1-starling1','20261018-keep-recover1-shadow1');
patch('tests/pet-level10-browser.mjs',
 "else if(id==='mothling'){if(!petArtUrl(id,5).includes('/art-starling-fox-20261018/level-5.png'))",
 "else if(id==='velvet-batling'){if(!petArtUrl(id,5).includes('/art-shadow-wolf-20261018/level-5.png'))throw Error('Shadow Wolf LV5 art missing')}else if(id==='mothling'){if(!petArtUrl(id,5).includes('/art-starling-fox-20261018/level-5.png'))");
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('404.html','utf8'),'Home fallback must remain consistent');
assert.match(fs.readFileSync('pet/pet.js','utf8'),/PET_KEY = "lux-pet-companion-v1"/);
assert.ok(fs.readFileSync('pet/pet-art-hd-20261009.js','utf8').includes("if(safe==='velvet-batling')"));
console.log('Installed 10 distinct Shadow Wolf sprites, original velvet-batling ID and saved progress keys preserved.');
