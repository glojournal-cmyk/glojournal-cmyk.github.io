/* Staging-only WebKit smoke for actual browser IndexedDB and real V2
 * persistence helpers. Uses a disposable localhost origin, synthetic pupil
 * data and a separate v2 namespace; never accesses production/iPad storage.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webkit} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const contentType={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/daily-v2-browser-check'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8',
    'cache-control':'no-store'});
  res.end('<!DOCTYPE html><html><head><title>V2 isolated QA</title></head><body>V2 local storage test only</body></html>');
  return;
 }
 const file=resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
 try{
  const data=await readFile(file);
  res.writeHead(200,{'content-type':contentType[extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address();
const url='http://127.0.0.1:'+address.port+'/daily-v2-browser-check';
let browser;
try{
 browser=await webkit.launch({headless:true});
 for(const viewport of [{width:1024,height:768},{width:1366,height:1024}]){
  const context=await browser.newContext({viewport});
  try{
   const page=await context.newPage();
   await page.goto(url);
   const initial=await page.evaluate(async()=>{
    const {createIndexedDbDailyV2Repository}=await import('/daily-v2/src/indexeddb-repository.js');
    const {commitDailyV2Plan,commitDailyV2Answer}=await import('/daily-v2/src/storage.js');
    const {DAILY_V2_TASKS}=await import('/daily-v2/src/planner.js');
    localStorage.setItem('lux-scholar-garden-v1','QA-LEGACY-SCHOLAR-UNCHANGED');
    localStorage.setItem('lux-pet-companion-v1','QA-PET-WALLET-UNCHANGED');
    const repo=createIndexedDbDailyV2Repository({databaseName:'scholar-daily-v2-webkit-isolated'});
    const day='2026-10-31';
    const plan={version:2,day,status:'ready',target:163,
      tasks:DAILY_V2_TASKS.map(t=>({...t,
       questions:Array.from({length:t.target},(_,i)=>({
        questionId:t.id+'-q'+i,
        conceptId:t.kind==='vocab'?t.subject+'-word-'+i:null,
        marks:t.kind==='exam'?i+1:null
       }))
      }))};
    const first=await commitDailyV2Plan(repo,plan);
    const answer={eventId:'qa-vocab-answer-1',day,taskId:'latin-vocab',
      questionId:'latin-vocab-q0',conceptId:'latin-word-0',correct:true};
    const saved=await commitDailyV2Answer(repo,answer);
    const replay=await commitDailyV2Answer(repo,answer);
    const row=await repo.read(day);
    return {day,first:first.alreadyFrozen,saved:saved.creditDelta,replay:replay.creditDelta,
      revision:row.revision,attempts:row.ledger.attempts.length,
      roster:row.plan.tasks.reduce((n,t)=>n+t.questions.length,0)};
   });
   assert.equal(initial.first,false);
   assert.equal(initial.saved,1);
   assert.equal(initial.replay,0);
   assert.equal(initial.attempts,1);
   assert.equal(initial.roster,163);

   await page.reload();
   const persistent=await page.evaluate(async()=>{
    const {createIndexedDbDailyV2Repository}=await import('/daily-v2/src/indexeddb-repository.js');
    const repo=createIndexedDbDailyV2Repository({databaseName:'scholar-daily-v2-webkit-isolated'});
    const row=await repo.read('2026-10-31');
    return {revision:row.revision,attempts:row.ledger.attempts.length,
      scholar:localStorage.getItem('lux-scholar-garden-v1'),
      pet:localStorage.getItem('lux-pet-companion-v1')};
   });
   assert.equal(persistent.revision,initial.revision);
   assert.equal(persistent.attempts,1);
   assert.equal(persistent.scholar,'QA-LEGACY-SCHOLAR-UNCHANGED');
   assert.equal(persistent.pet,'QA-PET-WALLET-UNCHANGED');

   const secondPage=await context.newPage();
   await secondPage.goto(url);
   const contenders=async(page,writer)=>page.evaluate(async(writer)=>{
     const {createIndexedDbDailyV2Repository}=await import('/daily-v2/src/indexeddb-repository.js');
     const repo=createIndexedDbDailyV2Repository({databaseName:'scholar-daily-v2-webkit-isolated'});
     const row=await repo.read('2026-10-31');
     return repo.compareAndSwap('2026-10-31',row.revision,{
       ...row,revision:row.revision+1,qaWriter:writer
     });
   },writer);
   const outcomes=await Promise.all([contenders(page,'one'),contenders(secondPage,'two')]);
   assert.deepEqual(outcomes.slice().sort(),[false,true]);
   const after=await page.evaluate(async()=>{
     const {createIndexedDbDailyV2Repository}=await import('/daily-v2/src/indexeddb-repository.js');
     return createIndexedDbDailyV2Repository({databaseName:'scholar-daily-v2-webkit-isolated'}).read('2026-10-31');
   });
   assert.equal(after.revision,initial.revision+1);
   assert.equal(after.ledger.attempts.length,1);

   await context.setOffline(true);
   const offline=await page.evaluate(async()=>{
     const {createIndexedDbDailyV2Repository}=await import('/daily-v2/src/indexeddb-repository.js');
     const repo=createIndexedDbDailyV2Repository({databaseName:'scholar-daily-v2-webkit-isolated'});
     return repo.read('2026-10-31');
   });
   assert.equal(offline.revision,after.revision);
   assert.equal(offline.ledger.attempts.length,1);
   await context.setOffline(false);
   const invalid=await page.evaluate(async()=>{
    const {createIndexedDbDailyV2Repository}=await import('/daily-v2/src/indexeddb-repository.js');
    const repo=createIndexedDbDailyV2Repository({databaseName:'scholar-daily-v2-webkit-isolated'});
    try{await repo.read('2026-02-30');return false}catch{return true}
   });
   assert.equal(invalid,true);
   console.log('DAILY_V2_WEBKIT_IDB_PASS',JSON.stringify({viewport,
     checks:['163-question atomic freeze','one correct credited once','reopen and read-back',
       'concurrent CAS one winner','offline IndexedDB read','invalid calendar rejection',
       'legacy Scholar and Pet wallet unchanged']}));
  }finally{await context.close()}
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
