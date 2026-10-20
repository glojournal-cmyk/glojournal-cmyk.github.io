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
   assert.equal(await page.locator('.assessment-rpg-cast img').count(),1,'Show the outfit-synced standing Scholar in the scene');
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
   assert.deepEqual(errors,[],'No uncaught JavaScript errors');
   report.push({engine:browserType.name(),width:viewport.width,subjects:groups.length,questionType:choiceCount?'multiple-choice':'written',saved:true});
   await context.close();
  }
 }finally{await browser.close();}
}
console.log('ASSESSMENT_IPAD_QA '+JSON.stringify(report));
}finally{server.close();}
