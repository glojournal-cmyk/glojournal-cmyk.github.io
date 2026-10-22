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
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('1 PDF'));
 assert.equal(await page.locator('.note').count(),87);
 assert.equal(await page.locator('.note .open:enabled').count(),1);
 const pre=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-window.innerWidth,
   navHeight:document.querySelector('nav.nav')?.getBoundingClientRect().height,
   navTop:document.querySelector('nav.nav')?.getBoundingClientRect().top,
   navBottom:document.querySelector('nav.nav')?.getBoundingClientRect().bottom,
   innerHeight:window.innerHeight,
   viewport:window.visualViewport?{
     height:window.visualViewport.height,offsetTop:window.visualViewport.offsetTop,
     pageTop:window.visualViewport.pageTop
   }:null,
   docHeight:document.documentElement.clientHeight,
   visible:document.querySelector('nav.nav')?.getBoundingClientRect().bottom <= window.innerHeight+3
 }));
 console.log('NOTES_VIEWPORT_METRICS '+name+' '+JSON.stringify(pre));
 await page.screenshot({path:'test-results/notes-library-'+name+'.png',fullPage:false});
 assert.ok(pre.overflow<=3, name+' page horizontal overflow '+pre.overflow);
 assert.ok(pre.navHeight<=78, name+' oversized nav '+pre.navHeight);
 // Visual viewport is authoritative for mobile WebKit, not window.innerHeight.
 const visualBottom=pre.viewport ? pre.viewport.offsetTop+pre.viewport.height : pre.innerHeight;
 assert.ok(pre.navBottom<=Math.max(visualBottom,pre.docHeight)+3,
   name+' navigation shifted outside viewport '+JSON.stringify(pre));
 await page.locator('[data-period="year9"]').click();
 assert.equal(await page.locator('.note').count(),20);
 await page.locator('#subject').selectOption('french');
 assert.equal(await page.locator('.note').count(),5);
 await page.locator('#search').fill('Future Tense');
 assert.equal(await page.locator('.note').count(),1);
 await page.locator('.note .open').click();
 assert.equal(await page.locator('#viewer').isVisible(),true);
 assert.equal(new URL(await page.locator('#openTab').getAttribute('href')).searchParams.get('key'),key);
 await page.locator('#closeReader').click();
 assert.equal(await page.locator('#viewer').isVisible(),false);
 await page.locator('.note .fav').click();
 await page.locator('[data-period="favourites"]').click();
 assert.equal(await page.locator('.note').count(),1);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('1 PDF'));
 await page.locator('[data-period="favourites"]').click();
 assert.equal(await page.locator('.note').count(),1);
 console.log('NOTES_BROWSER_OK '+name+' 87 catalogued, 1 available, 20 Year9, 5 French, search/reader/favourites and nav checked');
 await browser.close();
}
