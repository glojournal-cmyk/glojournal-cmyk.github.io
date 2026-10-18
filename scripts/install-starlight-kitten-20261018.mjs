// One-shot, guarded importer for the approved Starlight Kitten LV1-LV10 sprites.
// Triggered only after the user uploads starlight-kitten-app-upload.zip to the repo root.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const zip='starlight-kitten-app-upload.zip';
assert.ok(fs.existsSync(zip), 'The approved 10-image upload ZIP is missing');
const names=execFileSync('unzip',['-Z1',zip],{encoding:'utf8'}).trim().split(/\r?\n/).sort();
const expected=Array.from({length:10},(_,i)=>'level-'+(i+1)+'.png').sort();
assert.deepEqual(names,expected,'ZIP must contain exactly level-1.png to level-10.png');
const files=[];
for(let level=1;level<=10;level++){
  const buffer=execFileSync('unzip',['-p',zip,'level-'+level+'.png'],{maxBuffer:8*1024*1024});
  assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Not a PNG at level '+level);
  assert.equal(buffer.readUInt32BE(16),1024,'Unexpected width at level '+level);
  assert.equal(buffer.readUInt32BE(20),1024,'Unexpected height at level '+level);
  assert.equal(buffer[25],6,'RGBA transparency is required at level '+level);
  assert.ok(buffer.length>150000,'Image too small at level '+level);
  files.push(buffer);
}
function change(filename,before,after){
  const text=fs.readFileSync(filename,'utf8');
  assert.ok(text.includes(before),'Expected safe patch location absent: '+filename+' / '+before.slice(0,80));
  fs.writeFileSync(filename,text.replaceAll(before,after),'utf8');
}
const folder='pet/art-starlight-kitten-20261018';
fs.mkdirSync(folder,{recursive:true});
for(let i=1;i<=10;i++) fs.writeFileSync(path.join(folder,'level-'+i+'.png'),files[i-1]);
change('pet/pet-art-hd-20261009.js',
  "  // Inkling: all ten stages are individually approved full-body transparent sprites.",
  "  // Keep bloom-snail as the persistent storage identity to preserve player XP, levels, and history.\n"+
  "  if(safe==='bloom-snail') return '/pet/art-starlight-kitten-20261018/level-'+stage+'.png?v=20261018-starlight-kitten1';\n"+
  "  // Inkling: all ten stages are individually approved full-body transparent sprites.");
change('pet/pet.js','name:"Bloom Snail"','name:"Starlight Kitten"');
change('pet/pet.js','Carry beauty wherever you go.','Little wonders grow into starlight.');
change('pet/home-pet.js','"bloom-snail": "Bloom Snail"','"bloom-snail": "Starlight Kitten"');
change('pet/pet-evolution-config-20261012.js',
 "'bloom-snail':['Blossom palace keeper','Radiant garden guardian','Celestial greenhouse keeper','Mythic bloom sovereign','Eternal garden keeper']",
 "'bloom-snail':['Celestial Lynx','Star Guardian','Spirit Walker','Moonborne Guardian','Astral Sovereign']");
for(const p of ['pet/pet.js','pet/home-pet.js','pet/index.html','assets/companion-art-20261004.js']){
  change(p,'20261018-inkling-all10a','20261018-starlight1');
}
for(const p of ['index.html','404.html','tests/pet-inkling-all10-art-20261018.mjs']){
  change(p,'20261018-keep-recover1-inkling10a','20261018-keep-recover1-starlight1');
}
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('404.html','utf8'),
  'Home and fallback must remain identical');
const router=fs.readFileSync('pet/pet-art-hd-20261009.js','utf8');
assert.ok(router.includes('if(safe===\'bloom-snail\')'),'Existing saved pet ID must not be deleted');
console.log('Prepared '+files.length+' Starlight Kitten sprites, updated visible names/art route without touching storage keys or player data.');
