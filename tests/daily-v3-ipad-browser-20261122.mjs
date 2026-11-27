import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const root=process.cwd(), out='test-results/daily-v3-ipad';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 try{
  let relative=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(relative.endsWith('/'))relative+='index.html';
  const target=path.resolve(root,'.'+relative);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const file=fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
  const data=fs.readFileSync(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const day='2026-11-27',report=[];
async function run(kind,browserType){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1024,height:1366},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,timezoneId:'Europe/London'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.setDefaultTimeout(18000);
 try{
   await page.clock.install({time:new Date(day+'T12:00:00.000Z')});
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxStore?.getState&&
     Array.isArray(window.__luxStore.getState().daily)&&
     window.__luxStore.getState().daily.some(t=>t.id==='languages-standard'),null,{timeout:25000});
   await page.waitForFunction(day=>window.__luxStore?.getState()?.dailyLog?.[day]?.total===11,day);
   const start=await page.evaluate(()=>({today:window.__luxStore.getState().today,
     tasks:window.__luxStore.getState().daily.map(t=>({id:t.id,target:t.target,progress:t.progress,
       assignedYear:t.assignedYear,assignedTopic:t.assignedTopic,assignedSubject:t.assignedSubject,
       href:t.href,supplyBlocked:t.supplyBlocked,languageSplit:t.languageSplit,approvedQuestionIds:t.approvedQuestionIds})),
     xp:window.__luxStore.getState().xp,mp:window.__luxStore.getState().mp,
     historic:JSON.stringify(window.__luxStore.getState().dailyLog||{}),
     recovery:JSON.stringify(window.__luxStore.getState().recoveryTaskByDay||{})}));
   assert.equal(start.today,day,kind+' mocked local calendar');
   assert.equal(start.tasks.length,11,kind+' eleven slots');
   assert.equal(start.tasks.reduce((n,t)=>n+t.target,0),175,kind+' normal target');
   assert.ok(start.tasks.some(t=>t.id==='weakness-review'));
   const std=start.tasks.find(t=>t.id==='y8-standard-b'),lang=start.tasks.find(t=>t.id==='languages-standard');
   assert.equal(std.assignedYear,9,kind+' Standard B must use Year9');
   assert.equal(std.supplyBlocked,undefined,kind+' reviewed Y9 supply should be ready');
   assert.equal(lang.supplyBlocked,undefined,kind+' reviewed Latin/French supply should be ready');
   assert.equal(lang.languageSplit.latin.approvedQuestionIds.length,5);
   assert.equal(lang.languageSplit.french.approvedQuestionIds.length,5);
   const received=[];
   for(const subject of ['latin','french']){
     const route=new URL('/study/'+subject+'/practise',base);
     for(const [k,v] of Object.entries({daily:'1',locked:'1',year:'8',mode:'standard',
       task:'languages-standard',topic:lang.languageSplit[subject].topicId}))route.searchParams.set(k,v);
     await page.goto(route.href,{waitUntil:'domcontentloaded'});
     await page.waitForSelector('[data-question-id]',{timeout:25000});
     const visible=await page.locator('[data-question-id]').first().getAttribute('data-question-id');
     assert.ok(lang.languageSplit[subject].approvedQuestionIds.includes(visible),
       kind+' wrong/unapproved '+subject+' question: '+visible);
     received.push({subject,questionId:visible});
     await page.reload({waitUntil:'domcontentloaded'});
     await page.waitForSelector('[data-question-id]',{timeout:25000});
     const resumed=await page.locator('[data-question-id]').first().getAttribute('data-question-id');
     assert.equal(resumed,visible,kind+' '+subject+' unfinished question must resume, not change on reload');
   }
   await page.goto(base+std.href,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-question-id]',{timeout:25000});
   const year9QuestionId=await page.locator('[data-question-id]').first().getAttribute('data-question-id');
   assert.ok(std.approvedQuestionIds.includes(year9QuestionId),kind+' StandardB unapproved question '+year9QuestionId);
   received.push({subject:'year9-standard-b',questionId:year9QuestionId});
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxStore?.getState()?.daily?.length===11,null,{timeout:25000});
   const saved=await page.evaluate(()=>({xp:window.__luxStore.getState().xp,
      mp:window.__luxStore.getState().mp,history:JSON.stringify(window.__luxStore.getState().dailyLog||{}),
      recovery:JSON.stringify(window.__luxStore.getState().recoveryTaskByDay||{}),
      tasks:window.__luxStore.getState().daily.map(t=>({id:t.id,assignedTopic:t.assignedTopic,assignedYear:t.assignedYear}))}));
   assert.equal(saved.xp,start.xp,'Opening unsubmitted questions must not award XP');
   assert.equal(saved.mp,start.mp,'Opening unsubmitted questions must not award MP');
   assert.deepEqual(JSON.parse(saved.history),JSON.parse(start.historic),'No historical Daily mutation merely from opening');
   assert.equal(saved.recovery,start.recovery,'No Recovery mutation merely from opening');
   assert.equal(saved.tasks.find(t=>t.id==='y8-standard-b').assignedTopic,std.assignedTopic);
   const status={kind,passed:true,day,received,appOpened:true,
     manuscript:'40 reviewed IDs; 2 Language subjects and StandardB tested on real app',
     errors:errors.slice(0,10)};
   report.push(status);
   await page.screenshot({path:out+'/'+kind+'-daily-plan.png',fullPage:true});
   console.log('V3_IPAD_BROWSER '+JSON.stringify(status));
 }catch(e){
   const failure={kind,passed:false,reason:String(e),errors:errors.slice(0,12),
     url:page.url(),text:(await page.locator('body').innerText().catch(()=>''))?.slice(0,1600)};
   report.push(failure);
   try{await page.screenshot({path:out+'/'+kind+'-failure.png',fullPage:true})}catch{}
   console.error('V3_IPAD_BROWSER_FAIL '+JSON.stringify(failure));
   throw e;
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,engine] of [['chromium-ipad',chromium],['webkit-ipad',webkit]])await run(name,engine);
}finally{
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
 await new Promise(resolve=>server.close(resolve));
}
