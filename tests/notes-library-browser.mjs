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
   ...(name==='ipad-webkit'?{isMobile:true,hasTouch:true}: {})});
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
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('1 of 88 PDFs ready'));
 assert.equal(await page.locator('.note-row').count(),88,'One horizontal button per note');
 assert.equal(await page.locator('.note-row:enabled').count(),1,'Only uploaded note is clickable');
 assert.equal(await page.locator('.note-row:disabled').count(),87);
 assert.equal(await page.locator('.year-group').count(),2,'Year 9 + Summer groups');
 assert.equal(await page.locator('.year-group[data-period="year9"] .note-row').count(),12);
 assert.equal(await page.locator('.year-group[data-period="summer"] .note-row').count(),76);
 assert.equal(await page.locator('.year-group[data-period="year9"] .subject-group[data-subject="french"] .note-row').count(),3);
 assert.equal(await page.locator('.year-group[data-period="summer"] .subject-group[data-subject="biology"] .note-row').count(),18);
 assert.equal(await page.locator('.note-list .note-row').count(),88);
 const pre=await page.evaluate(async()=>{
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const nav=document.querySelector('nav.nav').getBoundingClientRect();
   const group=document.querySelector('.note-list').getBoundingClientRect();
   const button=document.querySelector('.note-row').getBoundingClientRect();
   const title=document.querySelector('.row-main').getBoundingClientRect();
   const action=document.querySelector('.row-action').getBoundingClientRect();
   return {
     overflow:document.documentElement.scrollWidth-window.innerWidth,
     navHeight:nav.height,
     visible:nav.bottom <= window.innerHeight+3 && nav.top >= -3 &&
       nav.left >= -3 && nav.right <= window.innerWidth+3,
     fullWidthRatio:button.width/group.width,
     actionRightOfTitle:action.left>title.left,
     buttonHeight:button.height
   };
 });
 assert.ok(pre.overflow<=3,name+' horizontal page overflow '+pre.overflow);
 assert.ok(pre.navHeight<=78,name+' oversized bottom bar '+pre.navHeight);
 assert.ok(pre.visible,name+' nav shifted off viewport '+JSON.stringify(pre));
 assert.ok(pre.fullWidthRatio>.97,name+' notes are not full-width horizontal rows '+JSON.stringify(pre));
 assert.ok(pre.actionRightOfTitle,name+' button label not horizontally laid out');
 assert.ok(pre.buttonHeight>=55,name+' notes row too short for touch');
 await page.screenshot({path:'test-results/notes-library-'+name+'.png',fullPage:false});
 await page.locator('[data-period="year9"]').click();
 assert.equal(await page.locator('.year-group').count(),1);
 assert.equal(await page.locator('.note-row').count(),12);
 await page.locator('#subject').selectOption('french');
 assert.equal(await page.locator('.note-row').count(),3);
 await page.locator('#search').fill('Future Tense');
 assert.equal(await page.locator('.note-row').count(),1);
 await page.locator('.note-row:enabled').click();
 assert.equal(await page.locator('#viewer').isVisible(),true);
 assert.equal(new URL(await page.locator('#openTab').getAttribute('href')).searchParams.get('key'),key);
 await page.locator('#closeReader').click();
 assert.equal(await page.locator('#viewer').isVisible(),false);
 await page.locator('#search').fill('');
 await page.locator('#subject').selectOption('biology');
 assert.equal(await page.locator('.note-row').count(),1,'Year 9 Biology subject filtered');
 await page.locator('[data-period="summer"]').click();
 assert.equal(await page.locator('.note-row').count(),18,'Summer Biology subject filtered');
 await page.locator('#subject').selectOption('all');
 assert.equal(await page.locator('.note-row').count(),76);
 console.log('NOTES_BROWSER_OK '+name+' 88 rows, 2 year groups, grouped subjects, one button each, PDF reader, filters and fixed nav checked');
 await browser.close();
}
