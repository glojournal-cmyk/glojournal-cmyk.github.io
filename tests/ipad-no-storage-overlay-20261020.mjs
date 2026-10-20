import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {chromium,webkit} from "playwright";

const source=fs.readFileSync("assets/storage-health-20261011.js","utf8");
assert.ok(!source.includes("Progress could not be saved on this iPad"),"the fixed warning text must be removed");
assert.ok(!source.includes("document.createElement"),"storage health cannot create another overlay");
assert.ok(source.includes("recoverProgressStorage(store)"),"keep quota recovery enabled");
assert.ok(source.includes("root.__luxStoreQuotaFailed=!saved"),"do not falsely mark a failed write as successful");
assert.ok(!source.includes("localStorage.clear("));
for(const path of ["index.html","404.html"]){
 const page=fs.readFileSync(path,"utf8");
 assert.ok(page.includes("storage-health-20261011.js?v=20261020-no-overlay1"),"new script must be cache-busted on "+path);
}
const origin="http://127.0.0.1";
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
'<body><main><h1>Daily Practice Chemistry</h1><input id="answer" value="unsaved current answer"></main>'+
'<aside id="lux-storage-warning" style="position:fixed;bottom:90px;width:700px">Old warning</aside>'+
'<script>window.__luxStoreQuotaFailed=true;window.__luxStore={persist:{hasHydrated:()=>false},getState:()=>({xp:2177}),setState:()=>{throw Error("unexpected write")}};window.__originalRecord=localStorage.getItem("lux-scholar-garden-v1");</script>'+
'<script src="/assets/storage-health-20261011.js"></script></body></html>';
const root=process.cwd();
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,origin).pathname;
 if(pathname==="/"){res.writeHead(200,{"content-type":"text/html"});res.end(html);return}
 try{
 const file=path.resolve(root,"."+pathname);
 if(!file.startsWith(root+path.sep))throw Error("invalid");
 res.writeHead(200,{"content-type":"text/javascript"});res.end(fs.readFileSync(file));
 }catch{res.writeHead(404);res.end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let passes=0;
try{
 for(const [engine,launcher] of [["WebKit",webkit],["Chromium",chromium]]){
  const browser=await launcher.launch({headless:true});
  try{
   for(const width of [1024,1366]){
    const context=await browser.newContext({viewport:{width,height:width===1024?768:1024},hasTouch:true,deviceScaleFactor:2});
    const page=await context.newPage();
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin+":"+server.address().port+"/");
    await page.waitForTimeout(300);
    assert.equal(await page.locator("#lux-storage-warning").count(),0,"remove old overlay at startup");
    const result=await page.evaluate(()=>{
      window.dispatchEvent(new CustomEvent("scholar:storage-status",{detail:{saved:false}}));
      window.dispatchEvent(new CustomEvent("scholar:storage-status",{detail:{saved:true}}));
      window.dispatchEvent(new Event("lux:app-ready"));
      return {
        overlay:document.querySelectorAll("#lux-storage-warning").length,
        fixed:[...document.querySelectorAll("aside,[role=alert]")].filter(n=>getComputedStyle(n).position==="fixed").length,
        unsavedFlag:window.__luxStoreQuotaFailed,
        input:document.getElementById("answer").value,
        before:window.__originalRecord,
        after:localStorage.getItem("lux-scholar-garden-v1")
      };
    });
    assert.equal(result.overlay,0);
    assert.equal(result.fixed,0);
    assert.equal(result.unsavedFlag,true,"never clear failed-save flag without verification");
    assert.equal(result.input,"unsaved current answer");
    assert.equal(result.before,result.after,"never mutate saved progress");
    assert.deepEqual(errors,[]);
    await context.close();
    passes++;
   }
  }finally{await browser.close()}
 }
 console.log("PASS "+passes+" iPad WebKit/Chromium: no banner, no popup, no lost input, unsaved flag preserved");
}finally{await new Promise(resolve=>server.close(resolve))}
