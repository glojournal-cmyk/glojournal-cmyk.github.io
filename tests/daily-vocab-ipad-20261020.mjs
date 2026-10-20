import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {chromium,webkit} from "playwright";
const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp",".woff2":"font/woff2"};
const server=createServer((req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(pathname.endsWith("/"))pathname+="index.html";
  const file=path.resolve(root,"."+pathname);
  if(!file.startsWith(root+path.sep))throw Error("path outside root");
  const resolved=fs.statSync(file).isDirectory()?path.join(file,"index.html"):file;
  const data=fs.readFileSync(resolved);
  res.writeHead(200,{"content-type":mime[path.extname(resolved)]||"application/octet-stream","cache-control":"no-store"});res.end(data);
 }catch{res.writeHead(404);res.end("not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const route="/study/french/practise?daily=1&locked=1&year=8&mode=y8vocab&task=french-vocab";
const readCount=async page=>page.evaluate(async()=>{
 const {C:store}=await import("/assets/index-BLVOhKhN.js");
 const s=store.getState(),date=s.today;
 const items=s.dailyVocabByDay?.[date]?.french?.items||{};
 return {day:date,correct:Object.values(items).filter(Boolean).length,
  attempts:Object.keys(items).length,task:s.daily?.find(t=>t.id==="french-vocab")||null,
  saved:localStorage.getItem("lux-scholar-garden-v1")};
});
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1194,height:834},isMobile:engine===webkit,hasTouch:engine===webkit});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto(origin+"/",{waitUntil:"networkidle"});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   await page.evaluate(async()=>{
    const {C:store}=await import("/assets/index-BLVOhKhN.js");
    for(let i=0;i<28;i++)store.getState().recordDailyVocabAttempt("french","qa-daily-vocab-"+i,true);
   });
   let state=await readCount(page);
   assert.equal(state.correct,28,engine.name()+" initial 28");
   assert.equal(state.task?.progress,28,"Home daily task must show cumulative 28");
   await page.goto(origin+route,{waitUntil:"networkidle"});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   state=await readCount(page);
   assert.equal(state.correct,28,"Entering Practice must not reset 28 correct");
   await page.evaluate(async()=>{
    const {C:store}=await import("/assets/index-BLVOhKhN.js");
    store.getState().recordDailyVocabAttempt("french","qa-daily-vocab-28",true);
    store.getState().recordDailyVocabAttempt("french","qa-daily-vocab-29",true);
   });
   state=await readCount(page);
   assert.equal(state.correct,30,"28 + 2 distinct correct must remain 30");
   assert.equal(state.task?.progress,30,"Live daily task must complete at 30");
   await page.reload({waitUntil:"networkidle"});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   state=await readCount(page);
   assert.equal(state.correct,30,"Refresh must preserve all 30 correct");
   await page.evaluate(async()=>{
    const {C:store}=await import("/assets/index-BLVOhKhN.js");
    store.getState().recordDailyVocabAttempt("french","qa-daily-vocab-29",false);
    store.getState().recordDailyVocabAttempt("french","qa-daily-vocab-29",true);
   });
   state=await readCount(page);
   assert.equal(state.correct,30,"Retry cannot remove or double-count a credited answer");
   await page.goto(origin+"/",{waitUntil:"networkidle"});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   state=await readCount(page);
   assert.equal(state.correct,30,"Home return must not replace cumulative count by session score");
   assert.equal(state.task?.progress,30,"Home must show completed Daily Vocab after Practice");
   assert.deepEqual(errors,[],"Unexpected browser exceptions");
   fs.mkdirSync("test-results",{recursive:true});
   await page.screenshot({path:"test-results/daily-vocab-ipad-"+engine.name()+".png",fullPage:false});
   console.log("DAILY_VOCAB_IPAD_PASS "+engine.name()+" 28 + 2 = 30, reload/return/repeat safe");
   await context.close();
  }finally{await browser.close()}
 }
}finally{server.close()}
