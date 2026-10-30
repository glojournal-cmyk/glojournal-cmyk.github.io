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
 const page=await browser.newPage({viewport:{width:834,height:1112}}),errors=[];page.on('pageerror',e=>errors.push(e.message));async function visit(url){
  await page.waitForLoadState('networkidle');
  await page.goto(url,{waitUntil:'networkidle'});
  // The current Garden Home intentionally overlays (and hides) the original
  // React Home. This suite validates the original durable Backup/Recovery
  // engine, while dedicated RPG tests validate the visible Garden entry.
  if(new URL(url).pathname==='/'){
    await page.waitForFunction(()=>window.__luxAppReady===true);
    await page.addStyleTag({content:`
      .rpg-home-live{display:none!important}
      html.lux-rpg-live-active body > .paper-wash{visibility:visible!important}
      html.lux-rpg-live-active,html.lux-rpg-live-active body{height:auto!important;overflow:auto!important}
    `});
  }
}await visit(base+'/');await page.waitForFunction(()=>window.__luxAppReady===true);
 // Recovery now lives in the 30-day record modal, not the retired
 // #lux-recovery-date dropdown. Check the actual production interface.
 const unopened=await page.evaluate(async()=>{
  const {C:store,Ut:day}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
  const date=new Date(Date.parse(day()+'T12:00:00Z')-86400000).toISOString().slice(0,10);
  const log={...store.getState().dailyLog};delete log[date];
  store.setState({dailyLog:log,dailyVocabByDay:{},formalAttemptLog:[],recoveryVocabByDay:{},recoveryAwarded:{}});
  return date;
 });
 const dailyBefore=await page.evaluate(async()=>{
  const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
  return JSON.stringify(store.getState().daily);
 });
 await page.evaluate(()=>window.__luxOpenDailyRecord());
 await page.locator('.lux-record-sheet[role="dialog"]').waitFor({state:'visible'});
 assert.equal(await page.locator('.lux-record-dot').count(),30);
 // The previous calendar day is the second-to-last date.
 await page.locator('.lux-record-dot').nth(28).click();
 assert.match(await page.locator('.lux-record-detail').innerText(),/Recovery replacement plan|Not finished/);
 const links=page.locator('.lux-record-detail a.lux-record-recovery');
 assert.equal(await links.count(),10,'unopened day must offer ten actual recovery routes');
 const french=page.locator('.lux-record-detail a.lux-record-recovery[href*="task=french-vocab"]');
 assert.equal(await french.count(),1,'French recovery must be a distinct assigned route');
 assert.ok((await french.getAttribute('href')).includes('recover='+unopened));
 await french.click();
 await page.waitForURL(url=>url.pathname.includes('/study/french/practise')&&url.searchParams.get('recover')===unopened);
 await page.waitForFunction(()=>window.__luxAppReady===true);
 const created=await page.evaluate(async date=>{
  const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
  return {record:store.getState().dailyLog[date],today:JSON.stringify(store.getState().daily)};
 },unopened);
 assert.equal(created.record.tasks.length,10);
 assert.equal(created.record.done,0);
 assert.equal(created.record.recoveryFallback,true);
 // Route hydration may reconstruct today's task presentation; it must not
 // erase already-earned current-day progress on any task that survives.
 const beforeTasks=JSON.parse(dailyBefore),afterTasks=JSON.parse(created.today);
 for(const before of beforeTasks.filter(t=>Number(t.progress)>0)){
  const after=afterTasks.find(t=>t.id===before.id);
  assert.ok(after&&Number(after.progress)>=Number(before.progress),
   'recovery navigation must preserve earned progress for '+before.id);
 }
 const restored=await page.evaluate(async date=>{
  const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
  const today=JSON.stringify(store.getState().daily);
  for(let i=0;i<30;i++)store.getState().recordDailyVocabAttempt('french','unopened-'+i,true);
  const premature=store.getState().dailyLog[date]?.done||0;
  const pending=store.getState().recoveryVocabByDay?.[date]?.french;
  for(let i=30;i<35;i++)store.getState().recordDailyVocabAttempt('french','unopened-'+i,true);
  return {row:store.getState().dailyLog[date],premature,pendingNeeded:pending?.totalNeeded,
   unchanged:today===JSON.stringify(store.getState().daily)};
 },unopened);
 assert.equal(restored.premature,0,'30/35 must not mark a missed day complete');
 assert.equal(restored.pendingNeeded,35);
 assert.equal(restored.row.done,1);
 assert.equal(restored.row.total,10);
 assert.equal(restored.row.complete,false);
 assert.equal(restored.unchanged,true);
 await visit(base+'/');await page.waitForFunction(()=>window.__luxAppReady===true);
 const persisted=await page.evaluate(async date=>{
  const {C:store}=await import([...document.scripts].find(s=>s.src.includes('/assets/index-BLVOhKhN.js')).src);
  return store.getState().dailyLog[date];
 },unopened);
 assert.equal(persisted.tasks.find(t=>t.id==='french-vocab').recovered,true);
 const dates=await page.evaluate(async()=>{const {C:store,Ut:day}=await import([...document.scripts].find(script=>script.src.includes('/assets/index-BLVOhKhN.js')).src);const today=day(),date=n=>new Date(Date.parse(today+'T12:00:00Z')-n*86400000).toISOString().slice(0,10),a=date(1),b=date(2);const logs={...store.getState().dailyLog};for(const d of [a,b])logs[d]={date:d,tasks:[{id:'french-vocab',target:30,progress:20},{id:'latin-vocab',target:30,progress:30}]};store.setState({dailyLog:logs,recoveryVocabByDay:{},recoveryAwarded:{}});return [a,b]});
 // Open the current 30-day modal and exercise each historical date.
 await page.evaluate(()=>window.__luxOpenDailyRecord());
 await page.locator('.lux-record-sheet').waitFor({state:'visible'});
 for(const date of dates){
  const index=await page.evaluate(async target=>{
   const {Ut:day}=await import([...document.scripts].find(x=>x.src.includes('/assets/index-BLVOhKhN.js')).src);
   const today=day();
   return 29-Math.round((Date.parse(today+'T12:00:00Z')-Date.parse(target+'T12:00:00Z'))/86400000);
  },date);
  await page.locator('.lux-record-dot').nth(index).click();
  const detail=page.locator('.lux-record-detail');
  assert.ok(await detail.isVisible());
  const proof=await page.evaluate(async target=>{
   const {C:store}=await import([...document.scripts].find(x=>x.src.includes('/assets/index-BLVOhKhN.js')).src);
   return store.getState().dailyLog?.[target]?.tasks?.find(t=>t.id==='french-vocab');
  },date);
  const link=detail.locator('a.lux-record-recovery[href*="task=french-vocab"]');
  if(proof?.recovered||proof?.done)assert.equal(await link.count(),0,'credited task must not be offered again');
  else {
   assert.equal(await link.count(),1,'uncompleted date must have an actionable recovery link');
   assert.ok((await link.getAttribute('href')).includes('recover='+date));
  }
 }
 await page.locator('.lux-record-close').click();
 // Exercise real recovery scoring independently for both dates; never credit today.
 for(const date of dates){
  await visit(base+'/study/french/practise?daily=1&locked=1&year=8&mode=y8vocab&task=french-vocab&recover='+date);
  await page.waitForFunction(()=>window.__luxAppReady===true);
  const result=await page.evaluate(async target=>{
   const {C:store}=await import([...document.scripts].find(x=>x.src.includes('/assets/index-BLVOhKhN.js')).src);
   const before=store.getState().daily.map(t=>[t.id,t.progress]);
   for(let i=0;i<14;i++)store.getState().recordDailyVocabAttempt('french','recovery-'+target+'-'+i,true);
   const notYet=store.getState().dailyLog[target]?.tasks?.find(t=>t.id==='french-vocab')?.done===true;
   store.getState().recordDailyVocabAttempt('french','recovery-'+target+'-14',true);
   const state=store.getState();
   return {notYet,done:state.dailyLog[target]?.tasks?.find(t=>t.id==='french-vocab')?.done,
     needed:state.recoveryVocabByDay[target]?.french?.totalNeeded,
     before,after:state.daily.map(t=>[t.id,t.progress])};
  },date);
  assert.equal(result.notYet,false,'14 of 15 additional correct words must not complete Recovery');
  assert.equal(result.needed,15);
  assert.equal(result.done,true,'recovered task must be credited to '+date);
  assert.deepEqual(result.after,result.before,'recovery must not award today');
 }
 await visit(base+'/');await page.waitForFunction(()=>window.__luxAppReady===true);
 await page.evaluate(()=>window.__luxOpenDailyRecord());
 await page.locator('.lux-record-sheet').waitFor({state:'visible'});
 for(const date of dates){
  const saved=await page.evaluate(async target=>{
   const {C:store}=await import([...document.scripts].find(x=>x.src.includes('/assets/index-BLVOhKhN.js')).src);
   const state=store.getState();
   return state.dailyLog?.[target]?.tasks?.find(t=>t.id==='french-vocab');
  },date);
  assert.ok(saved?.recovered||saved?.done,'Recovery credit must persist for '+date);
 }
 assert.deepEqual(errors,[]);console.log(launcher.name(),'backup and two recovery dates passed');await page.close();
 }finally{await browser.close()}}}finally{server.close()}
