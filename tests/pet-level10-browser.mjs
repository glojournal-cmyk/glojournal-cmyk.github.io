import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {MAX_PET_LEVEL,EVOLUTION_COSTS,clampPetLevel} from '../pet/pet-evolution-config-20261012.js';
import {evolutionGoal,firstGoal} from '../assets/companion-goals-state-20261004.js';
assert.equal(MAX_PET_LEVEL,10);
assert.deepEqual(EVOLUTION_COSTS.slice(0,4),[50,90,140,200]);
assert.equal(clampPetLevel(9.9),9);
assert.equal(clampPetLevel(99),10);
assert.equal(evolutionGoal({petLevels:{inkling:5},masteryPoints:279},'inkling',6).ready,false);
assert.equal(evolutionGoal({petLevels:{inkling:5}},'inkling',10).cost,2660);
assert.equal(firstGoal({species:'inkling',petLevels:{inkling:10}}),null);
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{try{let name=new URL(req.url,'http://localhost').pathname;if(name.endsWith('/'))name+='index.html';let file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
try{for(const launcher of [chromium,webkit]){const browser=await launcher.launch();try{
 const page=await browser.newPage({viewport:{width:834,height:1112},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/pet/');
 const seed=async(level,mp)=>{await page.evaluate(({level,mp})=>{localStorage.setItem('lux-pet-companion-v1',JSON.stringify({species:'moss-hornling',masteryPoints:mp,petLevels:{'moss-hornling':level,inkling:4}}))},{level,mp});await page.reload();await page.waitForSelector('#stageLabel')};
 await seed(5,279);assert.equal(await page.locator('#evolvePet').isDisabled(),true);assert.match(await page.locator('#stageLabel').textContent(),/Stage 5/);
 await seed(5,280);await page.goto(base+'/');await page.locator('#companion-goal-reveal[open] [data-skip]').waitFor({timeout:15000});assert.match(await page.locator('#companion-goal-reveal').textContent(),/Evolution still requires a separate choice/);await page.locator('#companion-goal-reveal[open] [data-skip]').click({timeout:15000}).catch(async err=>{console.error(launcher.name()+' reveal diagnostics',JSON.stringify(await page.evaluate(()=>({path:location.href,dialog:document.querySelector('#companion-goal-reveal')?.outerHTML?.slice(0,1800),goal:document.querySelector('#chosen-reward-goal')?.outerHTML?.slice(0,600),seen:localStorage.getItem('lux-companion-experience-v1')}))));throw err});await page.locator('#chosen-reward-goal [data-choose]').click();assert.equal(await page.locator('.cx-goal-option').count(),5);await page.locator('.cx-goal-option').last().click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-companion-experience-v1')).goal.level),10);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-pet-companion-v1')).masteryPoints),280);await page.goto(base+'/pet/');await page.locator('#evolvePet').click();assert.match(await page.locator('#confirmCopy').textContent(),/Level 5 → Level 6 costs 280 MP/);await page.locator('#cancelEvolution').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-pet-companion-v1')).petLevels['moss-hornling']),5);
 await page.locator('#evolvePet').click();await page.locator('#confirmEvolutionButton').click();
 let pet=await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-pet-companion-v1')));assert.equal(pet.petLevels['moss-hornling'],6);assert.equal(pet.petLevels.inkling,4);assert.equal(pet.masteryPoints,0);assert.equal(pet.mpTransactions.length,1);assert.equal(pet.mpTransactions[0].amount,-280);
 await page.reload();assert.match(await page.locator('#stageLabel').textContent(),/Stage 6/);assert.match(await page.locator('#petImage').evaluate(e=>e.style.backgroundImage),/level-6/);assert.equal(await page.locator('.pet-form').count(),10);
 // Regression: the full Moon Puff line stops at 10; LV11–15 must not appear.
 await page.evaluate(()=>{const key='lux-pet-companion-v1';const data=JSON.parse(localStorage.getItem(key));data.species='moon-puff';data.petLevels['moon-puff']=5;localStorage.setItem(key,JSON.stringify(data))});
 await page.reload();await page.locator('.pet-form').first().waitFor();
 assert.equal(await page.locator('.pet-form').count(),10,'Moon Puff must have exactly 10 forms');
 const labels=await page.locator('.pet-form-level').allTextContents();
 assert.deepEqual(labels,Array.from({length:10},(_,i)=>'Level '+(i+1)+(i===4?' · Current':'')));
 assert.equal(await page.locator('.pet-form').filter({hasText:'Level 11'}).count(),0);
 const moonArt=await page.locator('.pet-form-art').evaluateAll(nodes=>nodes.slice(4).map(el=>el.style.backgroundImage));
 assert.equal(moonArt.length,6);assert.equal(new Set(moonArt).size,6);
 for(let level=5;level<=10;level++)assert.ok(moonArt[level-5].includes('/art-moon-puff-20261013/level-'+level+'.png'),'Missing Moon Puff art '+level);
 await seed(6,0);
 // Antler Bean must expose exactly LV1–10 and six unique transparent sprite URLs.
 await page.evaluate(()=>{const key='lux-pet-companion-v1';const p=JSON.parse(localStorage.getItem(key));p.species='antler-bean';p.petLevels['antler-bean']=5;localStorage.setItem(key,JSON.stringify(p))});
 await page.reload();await page.locator('.pet-form').first().waitFor();
 assert.equal(await page.locator('.pet-form').count(),10,'Antler Bean LV11–15 regression');
 const antlerArt=await page.locator('.pet-form-art').evaluateAll(xs=>xs.slice(4).map(x=>x.style.backgroundImage));
 assert.equal(new Set(antlerArt).size,6,'Antler Bean images duplicated');
 for(let level=5;level<=10;level++)assert.ok(antlerArt[level-5].includes('/art-antler-bean-individual-20261017/level-'+level+'.png'),'Antler Bean art missing: '+level);
 // Moonveil Owl: the selected secret pet displays exactly ten stage cards, including six newly approved images.
 await page.evaluate(()=>{const key='lux-pet-companion-v1';const p=JSON.parse(localStorage.getItem(key));p.species='snow-owl';p.petLevels['snow-owl']=5;p.unlockedSecrets={...(p.unlockedSecrets||{}),'snow-owl':true};localStorage.setItem(key,JSON.stringify(p))});
 await page.reload();await page.locator('.pet-form').first().waitFor();
 assert.equal(await page.locator('.pet-form').count(),10,'Moonveil Owl should only have LV1–10');
 const owlArt=await page.locator('.pet-form-art').evaluateAll(xs=>xs.slice(4).map(x=>x.style.backgroundImage));
 assert.equal(new Set(owlArt).size,6,'Moonveil Owl stages must be visually distinct');
 for(let level=5;level<=10;level++)assert.ok(owlArt[level-5].includes('/art-moonveil-owl-20261017/level-'+level+'.png'),'Missing LV'+level+' new Moonveil artwork');
 // Test Inkling's complete ten-stage artwork without unlocking or altering real user records.
 await page.evaluate(()=>{const k='lux-pet-companion-v1';const p=JSON.parse(localStorage.getItem(k));p.species='inkling';p.petLevels.inkling=3;localStorage.setItem(k,JSON.stringify(p))});
 await page.reload();await page.locator('#petFormGrid .pet-form').first().waitFor();
 assert.match(await page.locator('#petTitle').textContent(),/Inkling/);
 assert.equal(await page.locator('#petFormGrid .pet-form').count(),10,'Inkling form count incorrect');
 const inklingArt=await page.locator('#petFormGrid .pet-form-art').evaluateAll(xs=>xs.map(x=>x.style.backgroundImage));
 assert.equal(new Set(inklingArt).size,10,'Inkling images duplicated');
 for(let level=1;level<=10;level++)assert.ok(inklingArt[level-1].includes('/art-inkling-all10-20261018/level-'+level+'.png'),'Inkling LV'+level+' gallery missing');
 // Nocturne Spider gallery: isolated temporary unlock, never touching actual player data.
 await page.evaluate(()=>{const k='lux-pet-companion-v1';const p=JSON.parse(localStorage.getItem(k));p.species='night-spider';p.petLevels['night-spider']=5;p.unlockedSecrets={...(p.unlockedSecrets||{}),'night-spider':true};localStorage.setItem(k,JSON.stringify(p))});
 await page.reload();await page.locator('#petFormGrid .pet-form').first().waitFor();
 assert.match(await page.locator('#petTitle').textContent(),/Nocturne Spider/);
 assert.equal(await page.locator('#petFormGrid .pet-form').count(),10,'Nocturne Spider LV11-15 regression');
 const nightArt=await page.locator('#petFormGrid .pet-form-art').evaluateAll(xs=>xs.slice(4).map(x=>x.style.backgroundImage));
 assert.equal(nightArt.length,6);assert.equal(new Set(nightArt).size,6);
 for(let level=5;level<=10;level++)assert.ok(nightArt[level-5].includes('/art-nocturne-spider-20261018/level-'+level+'.png'),'Wrong LV'+level+' spider sprite');
 await seed(9,850);await page.locator('#evolvePet').click();await page.locator('#confirmEvolutionButton').click();assert.match(await page.locator('#stageLabel').textContent(),/Stage 10/);assert.equal(await page.locator('#evolvePet').isVisible(),false);
 await page.getByRole('button',{name:/Pat/}).first().click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-pet-companion-v1')).petLevels['moss-hornling']),10);
 await page.goto(base+'/');await page.waitForSelector('#mastery-pet-home[data-stage="10"]');assert.match(await page.locator('#mastery-pet-home').textContent(),/Eternal Guardian/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const count=await page.evaluate(async()=>{const {petArtUrl}=await import('/pet/pet-art-hd-20261009.js');const ids=['moss-hornling','antler-bean','inkling','pebble-wisp','moon-puff','mothling','bloom-snail','velvet-batling','sprig-dragon','star-toadlet','snow-owl','night-spider'];for(const id of ids){if(id==='moon-puff'){if(!petArtUrl(id,5).includes('/art-moon-puff-20261013/level-5.png'))throw Error('Moon Puff LV5 art missing')}else if(id==='moss-hornling'){if(!petArtUrl(id,5).includes('/art-moss-hornling-20261017/level-5.png'))throw Error('Moss Hornling LV5 art missing')}else if(id==='antler-bean'){if(!petArtUrl(id,5).includes('/art-antler-bean-individual-20261017/level-5.png'))throw Error('Antler Bean LV5 art missing')}else if(id==='inkling'){if(!petArtUrl(id,5).includes('/art-inkling-all10-20261018/level-5.png'))throw Error('Inkling LV5 art missing')}else if(id==='snow-owl'){if(!petArtUrl(id,5).includes('/art-moonveil-owl-20261017/level-5.png'))throw Error('Moonveil Owl LV5 art missing')}else if(id==='night-spider'){if(!petArtUrl(id,5).includes('/art-nocturne-spider-20261018/level-5.png'))throw Error('Nocturne Spider LV5 art missing')}else if(!petArtUrl(id,5).includes('/art-hd-20261009/level-5/'))throw Error('Existing art changed');for(let level=6;level<=10;level++){const im=new Image();im.src=petArtUrl(id,level);await im.decode();if(id==='inkling'){if(im.naturalWidth!==1086||im.naturalHeight!==1448)throw Error('Inkling '+level+' sprite wrong dimensions')}else if(id==='night-spider'){if(im.naturalWidth!==1122||im.naturalHeight!==1402)throw Error('Nocturne Spider '+level+' sprite wrong dimensions')}else if(id==='snow-owl'){if(im.naturalWidth!==1086||im.naturalHeight!==1448)throw Error('Moonveil Owl '+level+' should be original full-body PNG')}else if(id==='antler-bean'){if(im.naturalWidth<600||im.naturalHeight<1000)throw Error(id+' LV'+level+' full-body watercolor art invalid')}else if(id==='moon-puff'||id==='moss-hornling'){if(im.naturalWidth<1000||im.naturalHeight<1000)throw Error(id+' LV'+level+' full-body art invalid')}else if(im.naturalWidth<(id==='pebble-wisp'?1000:1024)||im.naturalWidth!==im.naturalHeight)throw Error(id+' invalid art')}}return ids.length*5});assert.equal(count,60);assert.deepEqual(errors,[]);console.log(launcher.name()+': evolution 5→6 and 9→10, spending, cancel, care, reload, Home and all 60 new forms passed');
 }finally{await browser.close()}}}finally{server.close()}
