// No deploy and no pupil data: local checkout served to fresh Chromium iPad-size profiles.
// Chromium with a Safari UA is not Safari/WebKit or physical iPad PWA acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium} from 'playwright';

const root=process.cwd(),out='test-results/food-tests-chromium-full-session';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json','.css':'text/css; charset=utf-8','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp',
 '.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  let u=decodeURIComponent(new URL(req.url,'http://local').pathname);
  if(u.endsWith('/'))u+='index.html';
  let filename=path.resolve(root,'.'+u);
  if(!filename.startsWith(root+path.sep))throw Error('invalid route');
  if(fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
  res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream',
    'cache-control':'no-store'});
  res.end(fs.readFileSync(filename));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const route='/study/biology/practise?year=8&mode=standard&topic=bio-y8-food-tests';
const quick='/study/biology/practise?year=8&mode=quick&topic=bio-y8-food-tests';
const report={commit:process.env.GITHUB_SHA||null,
 environment:'fresh Chromium iPad Pro 11 viewport and Safari user-agent; NOT WebKit/physical iPad',
 route,checks:[],questions:[],errors:[]};
let browser,activePage;
const record=(name,ok,extra={})=>{report.checks.push({name,ok,...extra});assert.equal(ok,true,name)};
const newContext=async()=>{
 const ctx=await browser.newContext({viewport:{width:834,height:1194},hasTouch:true,
  deviceScaleFactor:2,userAgent:'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 return ctx;
};
async function openPractice(page,href){
 await page.goto(origin+href,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('[data-question-id]').last().waitFor({timeout:45000});
}
async function stateMetrics(page){
 return await page.evaluate(async()=>{
  const main=document.querySelector('script[type="module"][src*="index-BLVOhKhN.js"]');
  if(!main)throw Error('Cannot identify real app store entrypoint');
  const module=await import(main.src);
  const store=module.C;
  if(typeof store?.getState!=='function')throw Error('Cannot find live app store');
  const s=store.getState();
  return {xp:s.xp,masteryPoints:s.masteryPoints,questionsToday:s.questionsToday,
   xpToday:s.xpToday,daily:s.daily,formalAttemptLog:s.formalAttemptLog,
   topicStats:s.topicStats,subjectQuestions:s.subjectQuestions};
 });
}
async function getSavedCompletion(page){
 return page.evaluate(async()=>{
  const timeout=Promise.race([
   new Promise(resolve=>setTimeout(()=>resolve([]),3000)),
   new Promise(resolve=>{
    try{
     const req=indexedDB.open('lux-practice-drafts-v2',1);
     req.onerror=()=>resolve([]);
     req.onsuccess=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('drafts')){db.close();resolve([]);return;}
      const tx=db.transaction('drafts','readonly'),get=tx.objectStore('drafts').getAll();
      get.onsuccess=()=>{const rows=get.result||[];db.close();resolve(rows);};
      get.onerror=()=>{db.close();resolve([]);};
     };
    }catch{resolve([]);}
   })
  ]);
  const records=await timeout;
  const legacy=(()=>{try{return Object.values(JSON.parse(localStorage.getItem('lux-practice-drafts-v1')||'{}'))}catch{return []}})();
  return [...records,...legacy].filter(x=>x?.unmarkedCompleted===true).map(x=>({
    finished:x.unmarkedCompleted,ce:x.ce,questions:x.base?.length,
    answers:x.sessionLog?.length,formalAnswers:x.sessionLog?.filter(a=>a.formal===true).length
  }));
 });
}
async function answer(page){
 const q=page.locator('[data-question-id]').last();
 const id=await q.getAttribute('data-question-id');
 const format=await q.getAttribute('data-question-format');
 if(format==='mc_single'){
  await q.locator('div.mt-5.grid.gap-2 > button').first().click();
 }else if(format==='matching'){
  const box=q.locator('div.mt-5.space-y-3').filter({has:q.getByRole('button',{name:'Submit matches'})}).last();
  const cols=box.locator('div.grid > div');
  const left=cols.nth(0).locator('button'),right=cols.nth(1).locator('button');
  const n=await left.count();
  assert.ok(n>0&&n===await right.count(),'matching needs both source columns');
  for(let i=0;i<n;i++){await left.nth(i).click();await right.nth(i).click();}
  await box.getByRole('button',{name:'Submit matches'}).click();
 }else if(format==='sorting'){
  const groups=q.locator('div.mt-5.space-y-3 > div.flex.flex-col');
  assert.ok(await groups.count()>0,'sorting categories exist');
  for(const row of await groups.all())await row.locator('button').first().click();
  await q.getByRole('button',{name:'Submit',exact:true}).last().click();
 }else if(format==='word_tiles'){
  await q.locator('div.flex.flex-wrap.gap-2 > button').first().click();
  await q.getByRole('button',{name:'Submit',exact:true}).last().click();
 }else{
  const editor=q.locator('form textarea,form input').first();
  if(await editor.count()){
   await editor.fill('neutral practice response');
   await q.locator('form button[type=submit]').click();
  }else throw Error('Unsupported format in real ten-question flow: '+format+' / '+id);
 }
 await q.getByText('Unmarked practice answer. Not a formal mark.',{exact:true})
  .waitFor({timeout:10000});
 record('question-unmarked-'+id,true,{format});
 return {id,format};
}
async function finishSitting(page,total,{forceFail=false}={}){
 for(let i=1;i<=total;i++){
  const q=page.locator('[data-question-id]').last();
  await q.getByText(new RegExp('Question\\s+'+i+'\\s*/\\s*'+total)).waitFor({timeout:15000});
  const result=await answer(page);
  report.questions.push(result);
  if(forceFail&&i===total){
   await page.evaluate(()=>{
    const original=globalThis.LuxPracticeDrafts.save.bind(globalThis.LuxPracticeDrafts);
    globalThis.LuxPracticeDrafts.save=(key,data)=>
     data?.unmarkedCompleted===true?Promise.resolve(false):original(key,data);
   });
  }
  await q.getByRole('button',{name:i===total?/finish/i:/next question/i}).last().click();
  if(i<total)await q.getByText(new RegExp('Question\\s+'+(i+1)+'\\s*/\\s*'+total))
   .waitFor({timeout:15000});
 }
}
try{
 browser=await chromium.launch({headless:true});
 const context=await newContext();
 const page=await context.newPage();
 activePage=page;
 page.on('pageerror',e=>report.errors.push(e.message));
 await openPractice(page,route);
 const baseline=await stateMetrics(page);
 await finishSitting(page,10);
 await page.getByText('Practice saved. Not a formal mark.',{exact:true}).first()
  .waitFor({timeout:15000});
 record('ten-questions-completed-with-no-formal-mark',true);
 const rows=await getSavedCompletion(page);
 record('persisted-ten-unmarked-in-real-browser-storage',
  rows.some(x=>x.questions===10&&x.answers===10&&x.ce===false&&x.formalAnswers===0),
  {records:rows});
 const after=await stateMetrics(page);
 record('xp-mp-daily-formal-attempts-and-topic-stats-unchanged',
  JSON.stringify(after)===JSON.stringify(baseline));
 await page.screenshot({path:out+'/completed-ten.png',fullPage:true});
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.getByText('Practice saved. Not a formal mark.',{exact:true}).first()
  .waitFor({timeout:20000});
 record('reload-preserves-unmarked-completion',true);
 record('reload-keeps-ten-question-draft',
  (await getSavedCompletion(page)).some(x=>x.questions===10&&x.answers===10&&x.ce===false));
 record('reload-does-not-award-credit',
  JSON.stringify(await stateMetrics(page))===JSON.stringify(baseline));
 await context.close();

 const failureContext=await newContext();
 const failPage=await failureContext.newPage();
 activePage=failPage;
 await openPractice(failPage,quick);
 await finishSitting(failPage,5,{forceFail:true});
 const warning=failPage.getByRole('alert').filter({hasText:'Save failed. Your answers are still on this page. Retry Finish'});
 await warning.waitFor({state:'visible',timeout:12000});
 record('failed-completion-shows-inline-retry-warning',true);
 record('failed-completion-leaves-last-question',await failPage.locator('[data-question-id]').count()>0);
 record('failed-completion-does-not-mark-saved',!((await getSavedCompletion(failPage)).some(x=>x.finished)));
 await failPage.screenshot({path:out+'/failed-save-warning.png',fullPage:true});
 await failureContext.close();
 console.log('FOOD_TESTS_CHROMIUM_10Q '+JSON.stringify(report));
 fs.writeFileSync(out+'/evidence.json',JSON.stringify(report,null,2));
}catch(e){
 report.failure=String(e?.stack||e);
 if(activePage&&!activePage.isClosed()){
  try{
   report.debug=await activePage.evaluate(()=>({
    url:location.href,ready:document.documentElement.dataset.luxReady||null,
    visibility:document.visibilityState,bodyClass:document.body.className,
    questions:[...document.querySelectorAll('[data-question-id]')].map(q=>{
     const rect=q.getBoundingClientRect(),p=q.querySelector('.tabular-nums');
     const a=[],nodes=[p,q,q.parentElement,q.parentElement?.parentElement,q.parentElement?.parentElement?.parentElement];
     for(const n of nodes)if(n)a.push({tag:n.tagName,id:n.id,class:n.className,
      display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,
      opacity:getComputedStyle(n).opacity,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height});
     return {id:q.getAttribute('data-question-id'),format:q.getAttribute('data-question-format'),
      visible:rect.width>0&&rect.height>0,text:p?.textContent,ancestorStyles:a};
    }),
    bodyText:(document.body.innerText||'').slice(-1700),
    alerts:[...document.querySelectorAll('[role=alert]')].map(n=>n.textContent)
   }));
   await activePage.screenshot({path:out+'/failure-debug.png',fullPage:true,timeout:8000});
  }catch(debugError){report.debugError=String(debugError);}
 }
 console.error('FOOD_TESTS_CHROMIUM_10Q_FAILURE '+JSON.stringify(report));
 fs.writeFileSync(out+'/evidence.json',JSON.stringify(report,null,2));
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
