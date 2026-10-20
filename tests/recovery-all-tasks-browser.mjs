import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {chromium,webkit} from "playwright";
const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp",".woff2":"font/woff2"};
const server=createServer((req,res)=>{
 try{
  let name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(name.endsWith("/"))name+="index.html";
  const file=path.resolve(root,"."+name);
  if(!file.startsWith(root+path.sep))throw Error("outside web root");
  const served=fs.statSync(file).isDirectory()?path.join(file,"index.html"):file;
  const buf=fs.readFileSync(served);
  res.writeHead(200,{"content-type":mime[path.extname(served)]||"application/octet-stream","cache-control":"no-store"});
  res.end(buf);
 }catch{res.writeHead(404);res.end("Not Found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
async function openRecovery(page){
 await page.waitForFunction(()=>window.__luxAppReady===true);
 await page.locator(".rpg-nav-live").getByRole("button",{name:"Recovery"}).click();
 await page.locator("#lux-recovery-date").waitFor({state:"visible",timeout:15000});
}
const expectedIds=["french-vocab","latin-vocab","latin-standard","y8-standard-a","y8-standard-b","y8-mastery-a","y8-mastery-b","weakness-review","due-review","year9-light"];
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1194,height:834},hasTouch:engine===webkit,timezoneId:"Europe/London"});
   const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(origin+"/",{waitUntil:"networkidle"});
   await openRecovery(page);
   const date=await page.evaluate(async()=>{
    const {C:store,Ut:todayKey}=await import("/assets/index-BLVOhKhN.js");
    const today=todayKey(),yesterday=new Date(Date.parse(today+"T12:00:00Z")-86400000).toISOString().slice(0,10);
    const log={...(store.getState().dailyLog||{})};delete log[yesterday];
    store.setState({dailyLog:log,recoveryTaskByDay:{},recoveryVocabByDay:{}});
    return yesterday;
   });
   await page.locator("#lux-recovery-date").selectOption(date);
   const initial=await page.evaluate(()=>Object.fromEntries((window.__luxStore.getState().daily||[]).map(t=>[t.id,Number(t.progress)||0])));
   await page.getByRole("button",{name:"Prepare ten recovery tasks"}).click();
   await page.waitForFunction(date=>window.__luxStore?.getState().dailyLog?.[date]?.tasks?.length===10,date);
   const prepared=await page.evaluate(date=>{
    const state=window.__luxStore.getState(),row=state.dailyLog[date];
    return {row,today:Object.fromEntries((state.daily||[]).map(t=>[t.id,Number(t.progress)||0]))};
   },date);
   assert.equal(prepared.row.recoveryFallback,true);
   assert.equal(prepared.row.done,0);
   assert.equal(prepared.row.total,10);
   assert.deepEqual([...prepared.row.tasks.map(t=>t.id)].sort(),[...expectedIds].sort(),"Recovery fallback follows current 10-task syllabus");
   assert.deepEqual(prepared.today,initial,"Preparing yesterday's tasks may not rewrite today's assignment");
   await page.locator("#lux-recovery-date").selectOption(date);
   const link=page.locator('#lux-recovery-quests a[href*="task=latin-standard"]').first();
   await link.waitFor({state:"visible",timeout:15000});
   const href=await link.getAttribute("href");
   assert.ok(href.includes("recover="+date));
   assert.ok(href.includes("task=latin-standard"));
   await page.goto(origin+href,{waitUntil:"networkidle"});
   await page.waitForFunction(()=>typeof window.__luxStore?.getState()?.recordAttempt==="function");
   const result=await page.evaluate(date=>{
    const store=window.__luxStore,first=store.getState(),
      before=Object.fromEntries((first.daily||[]).map(t=>[t.id,Number(t.progress)||0])),
      assigned=first.dailyLog[date].tasks.find(t=>t.id==="latin-standard");
    for(let i=0;i<10;i++){
      store.getState().recordAttempt("qa-recover-latin-"+i,true,"latin",{
       formal:true,progressionTask:"latin-standard",dailyTaskId:"latin-standard",
       topicId:assigned.assignedTopic,yearOverride:8
      });
    }
    const updated=store.getState(),row=updated.dailyLog[date];
    return {done:row.tasks.find(t=>t.id==="latin-standard")?.done,completed:row.done,
      before,after:Object.fromEntries((updated.daily||[]).map(t=>[t.id,Number(t.progress)||0]))};
   },date);
   assert.equal(result.done,true,"Ten formal answers must complete the missed Latin Standard task");
   assert.equal(result.completed,1,"Only the genuinely completed Recovery task is credited");
   assert.deepEqual(result.after,result.before,"Recovery must not credit today's Daily Task");
   await page.goto(origin+"/",{waitUntil:"networkidle"});
   await openRecovery(page);
   await page.locator("#lux-recovery-date").selectOption(date);
   const content=await page.locator("#lux-recovery-quests").innerText();
   assert.match(content,new RegExp("Completed ✓ · credited to "+date),"Home Recovery must show the original date credit");
   assert.deepEqual(errors,[],"No browser exceptions");
   console.log("RECOVERY_TEN_TASKS_IPAD_PASS "+engine.name()+" current assignments and date-specific credit");
   await context.close();
  }finally{await browser.close()}
 }
}finally{await new Promise(resolve=>server.close(resolve))}
