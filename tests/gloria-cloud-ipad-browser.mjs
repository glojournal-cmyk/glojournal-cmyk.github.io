import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {webkit,chromium} from "playwright";
const root=process.cwd(),token="Z".repeat(43),origin="https://glojournal-cmyk.github.io";
const fixture='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+
 '<div id="daily-save-panel"></div><div class="lux-practice-view"><div data-question-id="question-14">'+
 '<input id="answer" value="Je voudrais un verre deau"></div></div>'+
 '<script>window.__luxStore={getState:()=>({exportProgress:()=>JSON.stringify({'+
 'app:"lux-scholar-garden",version:10,state:{xp:2748,today:"2026-10-20",daily:[{id:"french-vocab",progress:28,target:30}],reviews:{q:{stage:3}}}})}),'+
 'subscribe:()=>()=>{}};localStorage.setItem("lux-practice-drafts-v1",JSON.stringify({draft:{N:"older French"}}));'+
 'document.getElementById("answer").focus();</script>'+
 '<script type="module" src="/assets/gloria-cloud-backup-ui-20261020.js"></script></body></html>';
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,"http://localhost").pathname;
 if(pathname==="/"){res.writeHead(200,{"content-type":"text/html; charset=utf-8"});res.end(fixture);return}
 try{
  const file=path.resolve(root,"."+pathname);
  if(!file.startsWith(root+path.sep))throw Error("invalid");
  const bytes=fs.readFileSync(file);
  res.writeHead(200,{"content-type":"text/javascript; charset=utf-8"});res.end(bytes);
 }catch{if(!res.headersSent){res.writeHead(404);res.end("Not Found")}}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
let passed=0;
try{
 for(const [engine,launch] of [["WebKit",webkit],["Chromium",chromium]]){
  const browser=await launch.launch({headless:true});
  try{
   for(const width of [1024,1366]){
    const context=await browser.newContext({viewport:{width,height:width===1024?768:1024},
      hasTouch:true,deviceScaleFactor:2});
    const page=await context.newPage(),errors=[],uploads=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("https://owner-test.workers.dev/v1/**",async route=>{
     if(route.request().method()==="OPTIONS"){
       return route.fulfill({status:204,headers:{
         "access-control-allow-origin":"*",
         "access-control-allow-methods":"GET, POST, OPTIONS",
         "access-control-allow-headers":"authorization, content-type"}});
     }
     assert.equal(route.request().headers()["authorization"],"Bearer "+token);
     if(route.request().method()==="POST"){
      const body=JSON.parse(route.request().postData());
      uploads.push(body);
      return route.fulfill({status:201,contentType:"application/json",
        headers:{"access-control-allow-origin":"*"},
        body:JSON.stringify({saved:true,id:"test-v1",digest:body.contentSha256,uploadedAt:"2026-10-20T17:00:00Z"})});
     }
     return route.fulfill({status:200,contentType:"application/json",
       headers:{"access-control-allow-origin":"*"},
       body:JSON.stringify({latest:null,lastEmailAccepted:null})});
    });
    await page.goto("http://127.0.0.1:"+server.address().port+"/");
    await page.getByText("Connect private cloud backup").click();
    await page.getByPlaceholder("https://your-worker.your-subdomain.workers.dev").fill("https://owner-test.workers.dev");
    await page.locator("input[type=password]").first().fill(token);
    await page.getByRole("button",{name:"Pair and generate recovery key"}).click();
    await page.getByText("Paired, NOT uploading yet.",{exact:false}).waitFor();
    const recovery=await page.locator("#gloria-cloud-parent-setup textarea").inputValue();
    assert.ok(recovery.length>=43,"owner must be shown recoverable AES key");
    assert.equal(uploads.length,0,"do not send anything until recovery key saved");
    await page.getByRole("button",{name:/I safely stored recovery key/}).click();
    // On the real iPad localStorage writes have been failing with quota errors.
    // The cloud upload path MUST use live store memory + IndexedDB key and work
    // without attempting any localStorage write.
    await page.evaluate(()=>{
      const original=Storage.prototype.setItem;
      window.__quotaWriteAttempts=0;
      Storage.prototype.setItem=function(){
        window.__quotaWriteAttempts++;
        throw new DOMException("Storage quota exceeded","QuotaExceededError");
      };
      window.__restoreStorage=()=>{Storage.prototype.setItem=original};
    });
    await page.getByRole("button",{name:"Back up now"}).click();
    await page.getByText("Cloud saved and verified",{exact:false}).waitFor();
    assert.equal(uploads.length,1,"manual backup should send exactly one encrypted copy");
    assert.equal(uploads[0].format,"gloria-encrypted-v1");
    assert.ok(!JSON.stringify(uploads[0]).includes("2748"),"XP must not appear in ciphertext");
    assert.ok(!JSON.stringify(uploads[0]).includes("older French"),"draft must be encrypted");
    const restore=await page.evaluate(async ({envelope,recovery})=>{
      const {decryptBackup}=await import("/assets/gloria-cloud-backup-20261020.js");
      return decryptBackup(envelope,recovery);
    },{envelope:uploads[0],recovery});
    assert.equal(restore.main.state.xp,2748);
    assert.equal(restore.drafts.draft.N,"older French");
    assert.equal(await page.locator("#answer").inputValue(),"Je voudrais un verre deau");
    assert.equal(await page.evaluate(()=>window.__quotaWriteAttempts),0,"cloud backup makes no localStorage writes");
    await page.evaluate(()=>window.__restoreStorage());
    await page.reload();
    await page.getByText("Cloud enabled. Latest:",{exact:false}).waitFor();
    assert.equal(await page.evaluate(async()=>{
      const {readConfig}=await import("/assets/gloria-cloud-backup-20261020.js");
      const cfg=await readConfig();return Boolean(cfg.enabled&&cfg.key&&cfg.token);
    }),true,"installed iPad CryptoKey and token must survive reload via IndexedDB");
    assert.deepEqual(errors,[]);
    await context.close();passed++;
   }
  }finally{await browser.close()}
 }
 console.log("PASS "+passed+" browser native encrypted owner pairing, stored key, manual upload and recovery checks");
}finally{await new Promise(ok=>server.close(ok))}
