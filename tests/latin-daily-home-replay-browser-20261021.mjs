// Verify REAL Home + WebKit reload using a synthetic, isolated learner record.
// Never reads, changes, or clears an actual learner's browser data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try {
  let urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(urlPath.endsWith('/'))urlPath+='index.html';
  const location=path.resolve(root,'.'+urlPath);
  if(!location.startsWith(root+path.sep))throw Error('Outside root');
  const data=fs.readFileSync(location);
  res.writeHead(200,{'Content-Type':mime[path.extname(location)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(data);
 } catch {res.writeHead(404);res.end('Not found')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
try {
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try {
   const context=await browser.newContext({viewport:{width:1194,height:834},isMobile:engine===webkit,hasTouch:engine===webkit});
   const page=await context.newPage();
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxStore?.persist?.hasHydrated?.()&&
      window.__luxStore.getState().daily?.some(t=>t.id==='latin-standard'),null,{timeout:40000});
   const before=await page.evaluate(()=>{
    const store=window.__luxStore;
    const current=store.getState(),day=current.today;
    const latin=current.daily.find(t=>t.id==='latin-standard');
    const topic='la-y8-prepositions';
    const task={...latin,planDate:day,assignedSubject:'latin',assignedTopic:topic,
      assignedYear:8,title:'Latin · Preposition dictionary entries',progress:0,
      href:'/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=latin-standard&topic='+topic};
    const marked=Array.from({length:10},(_,i)=>({
      day,at:new Date(Date.now()-60000+i*500).toISOString(),
      attemptId:'latin-prepositions-qa-'+i,questionId:topic+'-qa-'+i,
      correct:i%2===0,subject:'latin',topicId:topic,
      formal:true,repair:false,dailyTaskId:null
    }));
    const daily=current.daily.map(t=>t.id==='latin-standard'?task:t);
    const old=current.dailyLog?.[day]||{date:day,tasks:[],done:0,total:0};
    const tasks=(old.tasks||daily).map(t=>t.id==='latin-standard'?{...task,done:false}:t);
    store.setState({daily,formalAttemptLog:[...(current.formalAttemptLog||[]),...marked],
      dailyLog:{...current.dailyLog,[day]:{...old,tasks}}});
    return {day,xp:current.xp,mastery:current.masteryPoints};
   });
   await page.waitForFunction(()=>window.__luxStore.getState().daily?.find(t=>t.id==='latin-standard')?.progress===10,null,{timeout:15000});
   let after=await page.evaluate(()=>{
      const s=window.__luxStore.getState();
      return {xp:s.xp,mastery:s.masteryPoints,progress:s.daily.find(t=>t.id==='latin-standard').progress};
   });
   assert.equal(after.progress,10);
   assert.equal(after.xp,before.xp);
   assert.equal(after.mastery,before.mastery);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxStore?.persist?.hasHydrated?.()&&
     window.__luxStore.getState().daily?.find(t=>t.id==='latin-standard')?.progress===10,null,{timeout:40000});
   after=await page.evaluate(()=>({
     progress:window.__luxStore.getState().daily.find(t=>t.id==='latin-standard').progress,
     xp:window.__luxStore.getState().xp
   }));
   assert.equal(after.progress,10,'Reloaded front page must retain Latin 10/10');
   assert.equal(after.xp,before.xp,'Reconciliation cannot award extra XP');
   // Assert the learner-visible Home card too, not only its Zustand state.
   const visibleAfterReload=await page.evaluate(()=>{
     const title=window.__luxStore.getState().daily.find(t=>t.id==='latin-standard').title;
     const text=document.body.innerText;
     return {title,card:text.slice(text.indexOf(title),text.indexOf(title)+900)};
   });
   assert.ok(visibleAfterReload.card.startsWith(visibleAfterReload.title),
      'Actual Home task title must be visible to the learner');
   assert.match(visibleAfterReload.card,/10\s*\/\s*10|Completed|Complete/,
      'Actual Home task card must show completed Latin credit');
   console.log('LATIN_DAILY_HOME_REPLAY_PASS',engine.name(),after.progress);
   await context.close();
  } finally {await browser.close()}
 }
} finally {server.close()}
