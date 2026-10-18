// Safe one-shot install of approved Starling Fox evolution sprites, replacing Mothling.
// The species ID and all localStorage keys are deliberately left untouched.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const manifestPath='starling-fox-download-request.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
assert.equal(manifest.length,10);
assert.deepEqual(manifest.map(a=>a.level),[1,2,3,4,5,6,7,8,9,10]);
const out='pet/art-starling-fox-20261018';
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'starling-fox-'));
const saved=new Set();
try{
  for(const {level,url,sha256} of manifest){
    assert.ok(/^https:\/\/at\.adobe\.com\/[A-Za-z0-9]+$/.test(url),'Untrusted remote source for level '+level);
    assert.match(sha256,/^[0-9a-f]{64}$/);
    const file=path.join(scratch,'level-'+level+'.png');
    execFileSync('curl',['--fail','--location','--retry','3','--silent','--show-error','--max-time','240',url,'--output',file],{stdio:'inherit'});
    const buffer=fs.readFileSync(file);
    assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),sha256,'Wrong approved image LV'+level);
    assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const metadata=await sharp(buffer).metadata();
    assert.equal(metadata.width,1254,'Source width LV'+level);
    assert.equal(metadata.height,1254,'Source height LV'+level);
    assert.ok(metadata.hasAlpha,'Approved transparent PNG required LV'+level);
    assert.ok(!saved.has(sha256),'Duplicated sprite LV'+level);saved.add(sha256);
  }
  fs.mkdirSync(out,{recursive:true});
  for(let level=1;level<=10;level++){
    await sharp(path.join(scratch,'level-'+level+'.png'))
     .resize(930,930,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}})
     .extend({top:47,bottom:47,left:47,right:47,background:{r:0,g:0,b:0,alpha:0}})
     .png({compressionLevel:9}).toFile(path.join(out,'level-'+level+'.png'));
    const dest=fs.readFileSync(path.join(out,'level-'+level+'.png'));
    assert.equal(dest.readUInt32BE(16),1024);
    assert.equal(dest.readUInt32BE(20),1024);
    assert.equal(dest[25],6,'RGBA required');
  }
}finally{fs.rmSync(scratch,{recursive:true,force:true})}
function patch(filename,oldText,newText){
  const original=fs.readFileSync(filename,'utf8');
  assert.ok(original.includes(oldText),'Expected patch point missing: '+filename+' / '+oldText.slice(0,95));
  fs.writeFileSync(filename,original.replaceAll(oldText,newText),'utf8');
}
patch('pet/pet-art-hd-20261009.js',
 "  // Keep bloom-snail as the persistent storage identity to preserve player XP, levels, and history.",
 "  // Preserve the mothling storage ID while replacing only its visual and public-facing identity.\n"+
 "  if(safe==='mothling') return '/pet/art-starling-fox-20261018/level-'+stage+'.png?v=20261018-starling1';\n"+
 "  // Keep bloom-snail as the persistent storage identity to preserve player XP, levels, and history.");
patch('pet/pet.js',
 '{id:"mothling",name:"Mothling",tag:"Gentle wings for curious places."}',
 '{id:"mothling",name:"Starling Fox",tag:"A little star grows into a fearless celestial archer."}');
patch('pet/pet.js',
 '"mothling": {nature:"Soft-spoken, fearless around new ideas",habit:"Follows questions like lanterns through the dark.",forms:["Little lantern moth","Unfolding wings","Four-wing explorer","Silk-wing guardian","Lunar emperor moth"]}',
 '"mothling": {nature:"Curious, spirited, observant and courageously playful",habit:"Follows each bright idea like a trail of stars.",forms:["Curious Pup","Brighter Steps","Growing Radiance","Starlit Companion","Celestial Guardian"]}');
patch('pet/pet.js',
 '"mothling":{close:"Mothling follows a bright idea",due:"Mothling circles back to an old lesson",steady:"Mothling keeps the learning light",waiting:"Mothling waits for the first glow"}',
 '"mothling":{close:"Starling Fox senses a new discovery",due:"Starling Fox brings back an important review",steady:"Starling Fox celebrates your growing skills",waiting:"Starling Fox is ready for its first adventure"}');
patch('pet/home-pet.js','"mothling": "Mothling"','"mothling": "Starling Fox"');
patch('pet/home-personality-20261010.js',
 '"mothling":["Delicate wings flutter in greeting.","The mothling circles a golden star.","A quiet flutter says hello."]',
 '"mothling":["A crimson tail catches a glimmer of starlight.","Starling Fox twitches its pointed ears.","A golden arrow of light twinkles near your companion."]');
patch('pet/pet-evolution-config-20261012.js',
 "mothling:['Moon-silk keeper','Radiant wing guardian','Celestial silk monarch','Mythic lunar moth','Eternal lantern sovereign']",
 "mothling:['Guardian Form','Spirit Walker','Half-Human Form','Celestial Archer','Starfall Archer']");
patch('pet/pet.js','pet-art-hd-20261009.js?v=20261018-starlight1','pet-art-hd-20261009.js?v=20261018-starling1');
patch('pet/home-pet.js','pet-art-hd-20261009.js?v=20261018-starlight2','pet-art-hd-20261009.js?v=20261018-starling1');
patch('pet/home-pet.js','home-personality-20261010.js?v=20261018-starlight2','home-personality-20261010.js?v=20261018-starling1');
patch('assets/companion-art-20261004.js','pet-art-hd-20261009.js?v=20261018-starlight1','pet-art-hd-20261009.js?v=20261018-starling1');
patch('pet/index.html','pet.js?v=20261018-starlight2','pet.js?v=20261018-starling1');
for(const filename of ['index.html','404.html']){
 patch(filename,'home-pet.js?v=20261018-keep-recover1-starlight2','home-pet.js?v=20261018-keep-recover1-starling1');
}
patch('tests/pet-moon-puff-art-20261013.mjs','20261018-starlight2','20261018-starling1');
for(const filename of ['tests/pet-moonveil-owl-art-20261017.mjs','tests/pet-inkling-all10-art-20261018.mjs'])
 patch(filename,'20261018-keep-recover1-starlight2','20261018-keep-recover1-starling1');
patch('tests/pet-level10-browser.mjs',
 "else if(id==='bloom-snail'){if(!petArtUrl(id,5).includes('/art-starlight-kitten-20261018/level-5.png'))",
 "else if(id==='mothling'){if(!petArtUrl(id,5).includes('/art-starling-fox-20261018/level-5.png'))throw Error('Starling Fox LV5 art missing')}else if(id==='bloom-snail'){if(!petArtUrl(id,5).includes('/art-starlight-kitten-20261018/level-5.png'))");
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('404.html','utf8'),'Do not diverge home and offline fallback.');
const router=fs.readFileSync('pet/pet-art-hd-20261009.js','utf8');
assert.ok(router.includes("if(safe==='mothling')"));
assert.ok(fs.readFileSync('pet/pet.js','utf8').includes('const PET_KEY = "lux-pet-companion-v1"'));
console.log('Starling Fox imported, 10 PNG validated, name and routes updated, player storage identity preserved.');
