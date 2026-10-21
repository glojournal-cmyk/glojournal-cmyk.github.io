import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {webkit} from "playwright";
const root=process.cwd();
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const start=core.indexOf("let d=()=>{let e=a.partialize"),end=core.indexOf(",f=i.setState",start);
assert.ok(start>0&&end>start);
const persistCode=core.slice(start,end)+";return d";
const server=createServer((req,res)=>{
 try{
  const pathname=new URL(req.url,"http://localhost").pathname;
  if(pathname==="/"){res.setHeader("content-type","text/html");res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main>Study question<input aria-label="Answer"></main><button id="daily-save-button">Export progress</button></body></html>');return}
  const file=path.resolve(root,"."+pathname);
  if(!file.startsWith(root+path.sep))throw Error("bad path");
  res.setHeader("content-type","text/javascript");res.end(fs.readFileSync(file));
 }catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port;
const browser=await webkit.launch({headless:true});
try{
 for(const width of [1024,1366]){
  for(const blocked of [false,true]){
   const ctx=await browser.newContext({viewport:{width,height:width===1024?768:1024},hasTouch:true});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(url);
    await page.evaluate(({persistCode,blocked})=>{
     const key="lux-scholar-garden-v1",auto="lux-progress-auto-v1";
     const original={state:{xp:2748,today:"2026-10-20",daily:[]},version:10};
     localStorage.setItem(key,JSON.stringify(original));
     const backup={savedAt:"2026-10-20T12:00:00Z",day:"2026-10-20",done:0,total:0,
      data:JSON.stringify({app:"lux-scholar-garden",state:{...original.state,notes:"b".repeat(700000)}})};
     localStorage.setItem(auto,JSON.stringify(backup,null,2));
     localStorage.setItem("lux-pet-v1",'{"level":8}');
     localStorage.setItem("lux-assessment-v1",'{"score":28}');
     // Exhaust native Safari localStorage, then attempt a larger current save.
     for(let i=0;i<200;i++){try{localStorage.setItem("quota-fixture-"+i,"x".repeat(65536))}catch{break}}
     const live={...original.state,xp:2862,reviews:{q:{stage:3}},notes:"n".repeat(200000)};
     const options={name:key,version:10,partialize:x=>x};
     const persist=new Function("a","r","u","window","CustomEvent",persistCode)(
      options,()=>live,{setItem:(k,v)=>localStorage.setItem(k,JSON.stringify(v))},window,CustomEvent);
     window.__luxStore={getState:()=>live,setState:()=>persist(),
      persist:{hasHydrated:()=>true,getOptions:()=>options}};
     persist();
     if(!window.__luxStoreQuotaFailed)throw Error("Fixture did not exceed native storage quota");
     if(blocked)Object.defineProperty(window,"indexedDB",{value:{open(){throw Error("Vault unavailable")}}});
    },{persistCode,blocked});
    await page.addScriptTag({url:url+"/assets/storage-health-20261011.js"});
    // The parent explicitly requested NO visual warning, even on quota failure.
    // Retry must continue silently; never erase existing data or misreport success.
    if(blocked){
     await page.waitForTimeout(500);
     assert.equal(await page.locator("#lux-storage-warning").count(),0,"no obstructive fixed warning");
     assert.equal(await page.evaluate(()=>window.__luxStoreQuotaFailed),true);
     assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-scholar-garden-v1")).state.xp),2748);
     assert.ok(await page.evaluate(()=>localStorage.getItem("lux-progress-auto-v1")));
    }else{
     await page.waitForFunction(()=>window.__luxStoreQuotaFailed===false,null,{timeout:20000});
     assert.equal(await page.locator("#lux-storage-warning").count(),0);
     assert.equal(await page.evaluate(()=>localStorage.getItem("lux-progress-auto-v1")),null);
     await page.reload();
     assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-scholar-garden-v1")).state.xp),2862);
     assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-scholar-garden-v1")).state.reviews.q.stage),3);
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem("lux-pet-v1")),'{"level":8}');
    assert.equal(await page.evaluate(()=>localStorage.getItem("lux-assessment-v1")),'{"score":28}');
    assert.deepEqual(errors,[]);
    console.log("PASS Safari iPad "+width+" native quota "+(blocked?"vault failure":"verified recovery"));
   }finally{await ctx.close()}
  }
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
