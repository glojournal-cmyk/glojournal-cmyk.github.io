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
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('7 / 94 Notes available'));
 assert.equal(await page.locator('#yearSelect').inputValue(),'year9');
 assert.equal(await page.locator('#subjectScreen').isVisible(),true);
 assert.equal(await page.locator('#detailScreen').isVisible(),false);
 assert.equal(await page.locator('.subject-card').count(),7,'Year 9 has 7 Study-style cards');
 assert.equal(await page.locator('.subject-card[data-subject="latin"]').count(),1);
 assert.equal(await page.locator('.subject-card[data-subject="maths"]:disabled').count(),1,'No fabricated Maths Notes');
 assert.equal(await page.locator('.subject-card[data-subject="physics"]:disabled').count(),1);
 assert.equal(await page.locator('.subject-card[data-subject="french"]:enabled').count(),1);
 assert.equal(await page.locator('.bottom-nav a').count(),7);
 for(const slug of ['latin','french','english','maths','biology','chemistry','physics']){
   assert.equal(await page.locator('.subject-card[data-subject="'+slug+'"] img').getAttribute('src'),
     '/notes/images/option-e/'+slug+'.svg','Option E picture should be reused for '+slug);
 }
 const rowGeometry=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.subject-card')].map(e=>e.getBoundingClientRect());
   const first=cards[0],second=cards[1],third=cards[2];
   const art=document.querySelector('.subject-art').getBoundingClientRect();
   const body=document.querySelector('.subject-body').getBoundingClientRect();
   return {sameRow:Math.abs(first.top-second.top)<3,
     secondOnRight:second.left>first.right-3,
     thirdOnNextRow:third.top>first.bottom-3,
     wide: first.width / first.height>2.3,
     imageOnRight:art.left>=body.right-3};
 });
 assert.ok(rowGeometry.sameRow&&rowGeometry.secondOnRight&&rowGeometry.thirdOnNextRow&&
   rowGeometry.wide&&rowGeometry.imageOnRight,
   name+' Design C must have two rectangular cards per row, with E picture at right: '+JSON.stringify(rowGeometry));
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
 await page.locator('.subject-card[data-subject="french"]').click();
 await page.waitForURL(/#year9\/french/);
 await page.locator('#detailScreen').waitFor({state:'visible'});
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
 await page.locator('#subjectScreen').waitFor({state:'visible'});
 await page.locator('.subject-card[data-subject="latin"]').click();
 await page.waitForURL(/#year9\/latin/);
 await page.locator('#detailScreen').waitFor({state:'visible'});
 assert.equal(await page.locator('.note-row').count(),12,'six original Latin notes plus six vocabulary chapters');
 for(let chapter=1;chapter<=6;chapter++){
   const row=page.locator('.note-row',{hasText:'Latin Vocabulary — Chapter '+chapter});
   assert.equal(await row.count(),1,'Chapter '+chapter+' has exactly one note row');
   assert.equal(await row.isEnabled(),true,'Chapter '+chapter+' should be directly available');
 }
 await page.locator('.note-row',{hasText:'Latin Vocabulary — Chapter 6'}).click();
 assert.equal(await page.locator('#viewer').isVisible(),true);
 assert.equal(await page.locator('#openTab').getAttribute('href'),'/notes/pdf/year9/latin/Year9_Latin_Vocabulary_Chapter_6.pdf');
 await page.locator('#closeReader').click();
 await page.locator('#backSubjects').click();
 await page.waitForURL(/#year9$/);
 await page.locator('#subjectScreen').waitFor({state:'visible'});
 assert.equal(await page.locator('.subject-card').count(),7);
 await page.locator('#yearSelect').selectOption('summer');
 await page.waitForURL(/#summer$/);
 await page.locator('#subjectScreen').waitFor({state:'visible'});
 assert.equal(await page.locator('#subjectScreen').isVisible(),true);
 assert.equal(await page.locator('.subject-card').count(),7,'6 curriculum subjects plus mixed summer notes');
 await page.locator('.subject-card[data-subject="biology"]').click();
 await page.waitForURL(/#summer\/biology$/);
 await page.locator('#detailScreen').waitFor({state:'visible'});
 assert.equal(await page.locator('#detailTitle').textContent(),'Biology Notes');
 assert.equal(await page.locator('.note-row').count(),18);
 await page.goto(BASE+'/notes/#year9/french',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#detailTitle')?.textContent==='French Notes');
 assert.equal(await page.locator('.note-row').count(),3,'deep link to subject works');
 console.log('NOTES_DESIGN_C_OPTION_E_AND_LATIN_CHAPTERS_OK '+name+' 7 visual cards Year9, 7 Summer, drilldown rows, cloud reader, hash route, iPad navigation checked');
 await browser.close();
}
