import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const BASE=process.env.QA_BASE_URL||'http://127.0.0.1:8777';
const key='year9/french/French_Future_Tense_Image_Notes(1).pdf';
await mkdir('test-results',{recursive:true});
for(const [name,engine,viewport] of [
 ['chromium',chromium,{width:1280,height:800}],
 ['ipad-webkit',webkit,{width:820,height:1180}]
]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport,deviceScaleFactor:1,
   ...(name==='ipad-webkit'?{isMobile:true,hasTouch:true}:{})});
 const page=await context.newPage();
 await page.route('https://gloria-notes-public.glo-journal.workers.dev/catalog',async route=>{
   await route.fulfill({status:200,contentType:'application/json',
     headers:{'Access-Control-Allow-Origin':'*'},
     body:JSON.stringify({files:[{key,size:33207787}]})});
 });
 await page.route('**/pdf?*',async route=>await route.fulfill({
   status:200,contentType:'application/pdf',body:'%PDF-1.4\n%%EOF\n',
   headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto(BASE+'/notes/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('1 / 88 Notes available'));
 assert.equal(await page.locator('#yearSelect').inputValue(),'year9');
 assert.equal(await page.locator('#subjectScreen').isVisible(),true);
 assert.equal(await page.locator('#detailScreen').isVisible(),false);
 assert.equal(await page.locator('.subject-card').count(),7,'Year 9 has 7 Study-style cards');
 assert.equal(await page.locator('.subject-card[data-subject="latin"]').count(),1);
 assert.equal(await page.locator('.subject-card[data-subject="maths"] .subject-button:disabled').count(),1,'No fabricated Maths Notes');
 assert.equal(await page.locator('.subject-card[data-subject="physics"] .subject-button:disabled').count(),1);
 assert.equal(await page.locator('.subject-card[data-subject="french"] .subject-button:enabled').count(),1);
 assert.equal(await page.locator('.bottom-nav a').count(),7);
 const geometry=await page.evaluate(async()=>{
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const nav=document.querySelector('.bottom-nav').getBoundingClientRect();
   const cards=[...document.querySelectorAll('.subject-card')].map(e=>e.getBoundingClientRect());
   return {
     overflow:document.documentElement.scrollWidth-window.innerWidth,
     navHeight:nav.height,navVisible:nav.bottom<=window.innerHeight+3&&nav.top>=-3&&nav.left>=-3&&nav.right<=window.innerWidth+3,
     artLoaded:[...document.querySelectorAll('.subject-art')].every(i=>i.complete && i.naturalWidth>0),
     cardsValid:cards.every(c=>c.width>100&&c.height>110)
   };
 });
 assert.ok(geometry.overflow<=3,name+' horizontal overflow '+JSON.stringify(geometry));
 assert.ok(geometry.navHeight<=85&&geometry.navVisible,name+' bottom bar geometry '+JSON.stringify(geometry));
 assert.ok(geometry.artLoaded,name+' some subject image failed to load '+JSON.stringify(geometry));
 assert.ok(geometry.cardsValid,name+' card size too small '+JSON.stringify(geometry));
 await page.screenshot({path:'test-results/notes-library-'+name+'.png',fullPage:false});
 await page.locator('.subject-card[data-subject="french"] .subject-button').click();
 await page.waitForURL(/#year9\/french/);
 assert.equal(await page.locator('#subjectScreen').isVisible(),false);
 assert.equal(await page.locator('#detailScreen').isVisible(),true);
 assert.equal(await page.locator('#detailTitle').textContent(),'French Notes');
 assert.equal(await page.locator('.note-row').count(),3);
 assert.equal(await page.locator('.note-row:enabled').count(),1);
 const sizes=await page.evaluate(()=>{
   const list=document.querySelector('#noteList').getBoundingClientRect();
   const note=document.querySelector('.note-row').getBoundingClientRect();
   return {fullWidthRatio:note.width/list.width,h:note.height};
 });
 assert.ok(sizes.fullWidthRatio>=.97&&sizes.h>=58,name+' horizontal note button mismatch');
 await page.locator('#noteSearch').fill('Future Tense');
 assert.equal(await page.locator('.note-row').count(),1);
 await page.locator('.note-row:enabled').click();
 assert.equal(await page.locator('#viewer').isVisible(),true);
 assert.equal(new URL(await page.locator('#openTab').getAttribute('href')).searchParams.get('key'),key);
 await page.locator('#closeReader').click();
 assert.equal(await page.locator('#viewer').isVisible(),false);
 await page.locator('#backSubjects').click();
 await page.waitForURL(/#year9$/);
 assert.equal(await page.locator('.subject-card').count(),7);
 await page.locator('#yearSelect').selectOption('summer');
 await page.waitForURL(/#summer$/);
 assert.equal(await page.locator('#subjectScreen').isVisible(),true);
 assert.equal(await page.locator('.subject-card').count(),7,'6 curriculum subjects plus mixed summer notes');
 await page.locator('.subject-card[data-subject="biology"] .subject-button').click();
 await page.waitForURL(/#summer\/biology$/);
 assert.equal(await page.locator('#detailTitle').textContent(),'Biology Notes');
 assert.equal(await page.locator('.note-row').count(),18);
 await page.goto(BASE+'/notes/#year9/french',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#detailTitle')?.textContent==='French Notes');
 assert.equal(await page.locator('.note-row').count(),3,'deep link to subject works');
 console.log('NOTES_STUDY_SUBJECT_PAGES_OK '+name+' 7 visual cards Year9, 7 Summer, drilldown rows, cloud reader, hash route, iPad navigation checked');
 await browser.close();
}
