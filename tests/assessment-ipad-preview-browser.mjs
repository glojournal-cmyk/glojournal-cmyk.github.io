import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const root=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.pdf':'application/pdf'};
const server=createServer((req,res)=>{
  try{
    let url=new URL(req.url,'http://localhost');
    let name=decodeURIComponent(url.pathname);
    if(name.endsWith('/'))name+='index.html';
    let file=path.resolve(root,'.'+name);
    if(!file.startsWith(root+path.sep))throw Error('Bad path');
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
    fs.createReadStream(file).pipe(res);
  }catch{res.writeHead(404);res.end('Not Found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
fs.mkdirSync('test-results',{recursive:true});
const report=[];
try{
for(const browserType of [chromium,webkit]){
 const browser=await browserType.launch({headless:true});
 try{
  for(const viewport of [{width:1024,height:768},{width:834,height:1112},{width:390,height:844}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block',timezoneId:'Europe/London'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/assessment/',{waitUntil:'domcontentloaded'});
   await page.locator('#subject-bar button[data-subject="Biology"]').waitFor({timeout:30000});
   assert.ok(await page.locator('#subject-bar button[data-subject="Biology"].on').count()===1,'Upcoming Biology is the new default only for fresh sessions');
   await page.locator('#paper-list [data-paper="biology-nov2"]').waitFor();
   await page.locator('.assessment-rpg-scene-brand').waitFor();
   assert.equal(await page.locator('.assessment-rpg-cast').count(),0,'Assessment pages must not create a Scholar avatar');
   assert.equal(await page.locator('.lux-shell-nav a').count(),7,'Keep shared bottom nav');
   const rows=page.locator('#paper-list .assessment-paper-row');
   assert.equal(await rows.count(),4,'Biology retains all four real existing assessment papers');
   const bounds=await rows.evaluateAll(list=>list.map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,scroll:el.scrollWidth})));
   for(let j=1;j<bounds.length;j++){
     assert.ok(bounds[j].y>bounds[j-1].y+Math.min(bounds[j-1].h,32),'Each assessment must be on a new full-width line');
     assert.ok(Math.abs(bounds[j].x-bounds[0].x)<2,'All assessment rows share one left edge');
     assert.ok(Math.abs(bounds[j].w-bounds[0].w)<2,'All assessment rows are the same full width');
   }
   assert.ok(bounds.every(b=>b.scroll<=b.w+3),'No horizontal overflow of title, metadata or buttons');
   assert.ok(bounds.every(b=>b.h<=82),'Keep each assessment row to two lines');
   const rowInfo=await rows.evaluateAll(list=>list.map(el=>{
     const info=el.querySelector('.assessment-paper-info');
     const visible=[...info.children].filter(x=>getComputedStyle(x).display!=='none');
     return {visible:visible.length,heading:!!info.querySelector('h3'),meta:!!info.querySelector('p')};
   }));
   assert.ok(rowInfo.every(r=>r.visible===2&&r.heading&&r.meta),'Only title and brief metadata must be displayed per paper');
   if(viewport.width===1024){
     const navTop=await page.locator('.lux-shell-nav').evaluate(el=>el.getBoundingClientRect().top);
     const last= bounds[bounds.length-1];
     assert.ok(last.y+last.h < navTop-6, 'All four Biology papers must fit above the bottom iPad navigation');
   }
   const groups=await page.locator('#subject-bar button[data-subject]').allTextContents();
   assert.deepEqual(groups,['Latin','Chemistry','English','French','Biology','Physics'],'Keep all six assessment subjects');
   const isApplied=await page.evaluate(()=>[...document.styleSheets].some(s=>s.href?.includes('assessment-ipad-preview-20261020.css')));
   assert.equal(isApplied,true,'iPad preview style loaded');
   await page.locator('#subject-bar [data-subject="Latin"]').click();
   assert.ok(await page.locator('#paper-list [data-paper="latin-verbs"]').count()===1,'Latin papers remain accessible');
   await page.locator('#subject-bar [data-subject="Biology"]').click();
   assert.ok((await page.locator('#paper-list').innerText()).includes('2 November'),'Biology school date is correct');
   assert.equal(await page.locator('#paper-list .assessment-paper-row').count(),4,'Every Biology assessment remains a compact single row');
   assert.ok(!(await page.locator('#paper-list').innerText()).includes('16 November'),'Outdated 16 November school date should not appear');
   if(viewport.width===1024)await page.screenshot({path:'test-results/assessment-'+browserType.name()+'-1024-home.png'});
   await page.locator('.tabs button[data-tab="tracker"]').click();
   await page.locator('#tracker-list .entry').first().waitFor();
   assert.ok(await page.locator('#tracker-list .entry').count()>0,'School Tracker must show school assessment entries');
   assert.ok(await page.locator('#track-form').count()===1,'Tracker add/result form remains');
   const trackerItems=page.locator('#tracker-list .assessment-tracker-item');
   assert.ok(await trackerItems.count()>=3,'Known school assessments preserved');
   const trackerRow=trackerItems.first();
   assert.equal(await trackerRow.getAttribute('open'),null,'Tracker details must be closed by default');
   assert.equal(await trackerRow.locator('summary .assessment-tracker-heading > span').count(),1,'Each row has one brief date/status line');
   const trackerRows=await trackerItems.evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height));
   assert.ok(trackerRows.every(h=>h<=73),'Each collapsed tracker assessment uses at most two lines');
   assert.equal(await page.locator('#tracker-list [data-tracker-paper]:visible').count(),0,
     'Paper links and notes must not clutter the collapsed list');
   if(viewport.width===1024)await page.screenshot({path:'test-results/assessment-'+browserType.name()+'-1024-tracker.png'});
   await trackerRow.locator('summary').first().click();
   assert.equal(await trackerRow.getAttribute('open'),'','Details opens on tap');
   assert.ok(await trackerRow.locator('[data-tracker-paper]').isVisible(),'Existing practice paper action is preserved');
   const resource=trackerRow.locator('.assessment-tracker-resources');
   if(await resource.count()){
     await resource.locator('summary').click();
     assert.ok(await resource.locator('a:visible').count()>0,'Existing Notes and Practice links can still be reached');
   }
   if(viewport.width===1024)await page.screenshot({path:'test-results/assessment-'+browserType.name()+'-1024-tracker-details.png'});
   await trackerRow.locator('summary').first().click();
   assert.equal(await trackerRow.getAttribute('open'),null,'Details collapses again');
   await page.locator('.tabs button[data-tab="papers"]').click();
   await page.locator('#paper-list [data-paper="biology-nov2"]').click();
   await page.locator('#exam .question').waitFor({timeout:30000});
   assert.equal(await page.locator('.assessment-rpg-cast').isVisible(),false,'Hide the standing avatar while answering a timed paper');
   const q=page.locator('#exam .question');
   const font=await q.evaluate(e=>({weight:getComputedStyle(e).fontWeight,size:parseFloat(getComputedStyle(e).fontSize)}));
   assert.ok(Number(font.weight)>=700,'Questions should be bold');
   assert.ok(font.size>=21,'Questions should be larger on iPad');
   const choiceCount=await page.locator('#exam #choices .choice').count(),answerCount=await page.locator('#exam textarea.answer').count();
   assert.ok(choiceCount>0||answerCount===1,'Both multiple-choice and typed answers are supported');
   assert.ok((await page.locator('#exam .exam-actions #next').count())===1,'Next/submit available');
   assert.ok((await page.locator('#exam #clock').count())===1,'Timer available');
   if(viewport.width===1024)await page.screenshot({path:'test-results/assessment-'+browserType.name()+'-1024-question.png'});
   if(choiceCount>0){
    await page.locator('#exam #choices button').first().click();
   }else{
    await page.locator('#exam #response').fill('Example learner answer');
   }
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-assessment-v1')||'{}')?.drafts?.['biology-nov2']?.answers?.[0]);
   assert.ok(saved,'Draft answers must remain saved in the existing key');
   await page.locator('#exam #exit').click();
   await page.locator('#subject-bar [data-subject="Biology"]').click();
   assert.ok(await page.locator('#paper-list [data-paper="biology-nov2"]').count()===1,'Exit does not lose Biology paper');
   await page.locator('#paper-list [data-paper="biology-nov2"]').click();
   await page.locator('#exam .question').waitFor({timeout:30000});
   const retained=await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-assessment-v1')||'{}')?.drafts?.['biology-nov2']?.answers?.[0]);
   assert.equal(retained,saved,'Resume must preserve typed/MC answers');
   await page.locator('#exam #exit').click();
   // Populate Results only inside this disposable Playwright browser context.
   // This is fictional demonstration data; never modify any user's records.
   await page.evaluate(() => {
     const key='lux-assessment-v1';
     const state=JSON.parse(localStorage.getItem(key)||'{}');
     state.results=[
       ...(state.results||[]),
       {date:'15/10/2026',paper:'Biology · Cell structure (sample)',paperId:'qa-sample-biology',
        correct:18,marks:18,total:20,score:90,questions:[],answers:{}},
       {date:'12/10/2026',paper:'Latin · Verbs (sample)',paperId:'qa-sample-latin',
        correct:14,marks:14,total:20,score:70,questions:[],answers:{}}
     ];
     localStorage.setItem(key,JSON.stringify(state));
   });
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.tabs button[data-tab="history"]').click();
   await page.locator('#history-list .entry').first().waitFor();
   assert.equal(await page.locator('#history-list .entry').count(),2,'Preview Results demonstrates two test records');
   const hint=await page.evaluate(()=>{
     const p=document.createElement('p');
     p.className='assessment-qa-demo';
     p.textContent='QA PREVIEW · SAMPLE RESULTS ONLY — NOT REAL LEARNER DATA';
     document.querySelector('#history h2').after(p);
     return p.textContent;
   });
   assert.ok(hint.includes('SAMPLE RESULTS'));
   if(viewport.width===1024)await page.screenshot({path:'test-results/assessment-'+browserType.name()+'-1024-results.png'});
   assert.deepEqual(errors,[],'No uncaught JavaScript errors');
   report.push({engine:browserType.name(),width:viewport.width,subjects:groups.length,questionType:choiceCount?'multiple-choice':'written',saved:true});
   await context.close();
  }
 }finally{await browser.close();}
}
console.log('ASSESSMENT_IPAD_QA '+JSON.stringify(report));
}finally{server.close();}
