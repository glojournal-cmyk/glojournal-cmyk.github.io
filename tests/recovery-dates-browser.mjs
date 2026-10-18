import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
 ".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",
 ".webp":"image/webp",".woff2":"font/woff2",".ico":"image/x-icon"};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost");
  let name=decodeURIComponent(url.pathname);
  if(name.endsWith("/"))name+="index.html";
  const target=path.resolve(root,"."+name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  const stat=fs.statSync(target);
  const resolved=stat.isDirectory()?path.join(target,"index.html"):target;
  const data=fs.readFileSync(resolved);
  res.writeHead(200,{"content-type":mime[path.extname(resolved)]||"application/octet-stream",
   "cache-control":"no-store"});res.end(data);
 }catch{res.writeHead(404);res.end("Not Found")}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base="http://127.0.0.1:"+server.address().port;
try{for(const launcher of [chromium,webkit]){const browser=await launcher.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:834,height:1112}}),errors=[];page.on('pageerror',e=>errors.push(e.message));async function visit(url){await page.waitForLoadState('networkidle');await page.goto(url,{waitUntil:'networkidle'});}await visit(base+'/');await page.waitForFunction(()=>window.__luxAppReady===true);
 const panel=page.locator('#lux-daily-save-panel');
 // Locate the actual backup control's outer details rather than assuming an id.
 await page.waitForSelector('#daily-save-button',{state:'attached'});
 const details=page.locator('details').filter({has:page.locator('#daily-save-button')});assert.equal(await details.count(),1);assert.equal(await details.getAttribute('open'),null);
 await details.locator('summary').first().click();assert.equal(await page.locator('#daily-save-button').isVisible(),true);await details.locator('summary').first().click();assert.equal(await page.locator('#daily-save-button').isVisible(),false);
 // A whole unopened day has no log or answer evidence at all.
 const unopened=await page.evaluate(async()=>{
  const {C:store,Ut:day}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
  const date=new Date(Date.parse(day()+'T12:00:00Z')-86400000).toISOString().slice(0,10);
  const logs={...store.getState().dailyLog};delete logs[date];
  store.setState({dailyLog:logs,dailyVocabByDay:{},formalAttemptLog:[],recoveryVocabByDay:{},recoveryAwarded:{}});return date;
 });
 await page.waitForSelector('#lux-recovery-date');await page.locator('#lux-recovery-date').selectOption(unopened);
 assert.equal(await page.locator('#lux-recovery-quests a').count(),2);
 assert.match(await page.locator('#lux-recovery-quests').innerText(),/0 \/ 30/);
 // An unopened date exposes an opt-in ten-task plan. Do not change today.
 const dailyBefore=await page.evaluate(async()=>{
   const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
   return JSON.stringify(store.getState().daily);
 });
 await page.getByRole('button',{name:'Prepare ten recovery tasks'}).click();
 await page.waitForFunction(date=>{
   const raw=localStorage.getItem('lux-scholar-garden-v1');
   return raw && JSON.parse(raw)?.state?.dailyLog?.[date]?.total===10;
 },unopened,{timeout:15000});
 const created=await page.evaluate(async date=>{
   const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
   return {record:store.getState().dailyLog[date],today:JSON.stringify(store.getState().daily)};
 },unopened);
 assert.equal(created.record.tasks.length,10);
 assert.equal(created.record.done,0);
 assert.equal(created.record.recoveryFallback,true);
 assert.equal(created.today,dailyBefore);

 await page.evaluate(()=>window.__luxOpenDailyRecord());
 await page.locator('.lux-record-dot').nth(28).click();
 assert.equal(await page.locator('.lux-record-detail a.lux-record-recovery').count(),2);
 await page.locator('.lux-record-close').click();
 await visit(base+'/study/french/practise?daily=1&locked=1&year=8&mode=y8vocab&task=french-vocab&recover='+unopened);
 await page.waitForFunction(()=>window.__luxAppReady===true);
 const restored=await page.evaluate(async date=>{
  const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
  const today=JSON.stringify(store.getState().daily);
  for(let i=0;i<30;i++)store.getState().recordDailyVocabAttempt('french','unopened-'+i,true);
  return {row:store.getState().dailyLog[date],unchanged:today===JSON.stringify(store.getState().daily)};
 },unopened);
 assert.equal(restored.row.done,1);assert.equal(restored.row.total,10);assert.equal(restored.row.complete,false);assert.equal(restored.unchanged,true);
 await visit(base+'/');await page.waitForFunction(()=>window.__luxAppReady===true);
 const persisted=await page.evaluate(async date=>{const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);return store.getState().dailyLog[date]},unopened);
 assert.equal(persisted.tasks.find(t=>t.id==='french-vocab').recovered,true);
 const dates=await page.evaluate(async()=>{const {C:store,Ut:day}=await import([...document.scripts].find(script=>script.src.includes('/assets/index-BLVOhKhN.js')).src);const today=day(),date=n=>new Date(Date.parse(today+'T12:00:00Z')-n*86400000).toISOString().slice(0,10),a=date(1),b=date(2);const logs={...store.getState().dailyLog};for(const d of [a,b])logs[d]={date:d,tasks:[{id:'french-vocab',target:30,progress:20},{id:'latin-vocab',target:30,progress:30}]};store.setState({dailyLog:logs,recoveryVocabByDay:{},recoveryAwarded:{}});return [a,b]});
 await page.waitForSelector('#lux-recovery-date');for(const date of dates){await page.locator('#lux-recovery-date').selectOption(date);const link=page.locator('#lux-recovery-quests a');assert.equal(await link.count(),1);assert.ok((await link.getAttribute('href')).includes('recover='+date));}
 const link=await page.locator('#lux-recovery-quests a').getAttribute('href');await visit(base+link);await page.waitForFunction(()=>window.__luxAppReady===true);await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('Recovery ·'));
 // Exercise production credit recording for both original dates, then return Home.
 for(const date of dates){
  await visit(base+'/study/french/practise?daily=1&locked=1&year=8&mode=y8vocab&task=french-vocab&recover='+date);await page.waitForFunction(()=>window.__luxAppReady===true);
  const result=await page.evaluate(async date=>{const {C:store}=await import([...document.scripts].find(script=>script.src.includes('/assets/index-BLVOhKhN.js')).src);const before=store.getState().daily.map(t=>[t.id,t.progress]);for(let i=0;i<15;i++)store.getState().recordDailyVocabAttempt('french','recovery-qa-'+i,true);const state=store.getState();return {done:state.dailyLog[date].tasks.find(t=>t.id==='french-vocab').done,before,after:state.daily.map(t=>[t.id,t.progress])}},date);
  assert.equal(result.done,true);assert.deepEqual(result.after,result.before,'recovery never credits today');
 }
 await visit(base+'/');await page.waitForSelector('#lux-recovery-quests');if(await page.locator('#lux-recovery-quests').getAttribute('open')===null)await page.locator('#lux-recovery-quests > summary').click();await page.waitForSelector('#lux-recovery-date');for(const date of dates){await page.locator('#lux-recovery-date').selectOption(date);assert.ok((await page.locator('#lux-recovery-quests').innerText()).includes('Recovered ✓ · credited to '+date));}
 assert.deepEqual(errors,[]);console.log(launcher.name(),'collapsed backup and two recovery dates passed');await page.close();
 }finally{await browser.close()}}}finally{server.close()}
