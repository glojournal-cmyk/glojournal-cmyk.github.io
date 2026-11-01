import {createServer} from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {webkit} from "playwright";
const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json"};
const server=createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const f=path.resolve(root,"."+pathname);
  if(!f.startsWith(root+path.sep))throw Error("path blocked");
  const data=fs.readFileSync(f);
  res.writeHead(200,{"content-type":mime[path.extname(f)]||"application/octet-stream","cache-control":"no-store"});
  res.end(data);
 }catch{res.writeHead(404);res.end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const wallet={species:"snow-owl",masteryPoints:144,
 petLevels:{"snow-owl":3,"moss-hornling":4},unlockedSecrets:{"night-spider":true},
 mpLedger:{"mastery-topic":10},mpTransactions:[{id:"earned",amount:10}]};
const raw=JSON.stringify(wallet,null,2);
const backup={app:"lux-scholar-garden",version:10,
 state:{today:"2026-11-01",xp:2870,
  daily:Array.from({length:10},(_,i)=>({id:"t"+i,target:10,progress:0,done:false})),
  dailyLog:{},dailyVocabByDay:{},dailyCompleteAwarded:{},formalAttemptLog:[]},
 petCompanion:wallet,
 petWalletBackup:{version:1,storageKey:"lux-pet-companion-v1",raw}};
const browser=await webkit.launch({headless:true});
try{
 for(const width of [820,1024]){
  const context=await browser.newContext({viewport:{width,height:1180}});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("dialog",d=>d.accept());
  await page.goto(base+"/import-progress.html",{waitUntil:"load"});
  await page.locator("#backup-file").setInputFiles({name:"scholar-combined.json",
    mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup))});
  await page.locator("#preview-button").click();
  await page.locator("#status").waitFor({state:"visible"});
  await page.waitForFunction(()=>document.getElementById("status")?.textContent?.includes("Preview ready"));
  assert.match(await page.locator("#comparison").innerText(),/Pet wallet in backup/i);
  assert.match(await page.locator("#comparison").innerText(),/Ready: new empty wallet/i);
  assert.match(await page.locator("#comparison").innerText(),/Pet MP in backup[\s\S]*144/i);
  assert.match(await page.locator("#comparison").innerText(),/MP transactions stored[\s\S]*1/i);
  assert.equal(await page.locator("#apply-button").isEnabled(),true);
  await page.locator("#apply-button").click();
  await page.waitForFunction(()=>document.getElementById("result")?.textContent?.includes("Import verified"));
  const result=await page.evaluate(()=>{
   const scholar=JSON.parse(localStorage.getItem("lux-scholar-garden-v1")||"null");
   return {xp:scholar?.state?.xp,walletRaw:localStorage.getItem("lux-pet-companion-v1")};
  });
  assert.equal(result.xp,2870);
  assert.equal(result.walletRaw,raw);
  assert.deepEqual(JSON.parse(result.walletRaw),wallet);
  assert.deepEqual(errors,[],"WebKit must not throw while importing synthetic combined JSON");
  console.log("PET_WALLET_WEBKIT_SAFE_IMPORT_PASS",width,result.xp,JSON.parse(result.walletRaw).masteryPoints);
  await context.close();
 }

 // An existing Pet wallet with a different MP ledger must block before
 // the Scholar store is written and must preserve the current wallet.
 const context=await browser.newContext({viewport:{width:820,height:1180}});
 const page=await context.newPage();
 await page.goto(base+"/import-progress.html");
 const current=JSON.stringify({...wallet,masteryPoints:50,mpTransactions:[{id:"spent",amount:-94}]});
 await page.evaluate(value=>localStorage.setItem("lux-pet-companion-v1",value),current);
 await page.locator("#backup-file").setInputFiles({name:"scholar-combined.json",
   mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup))});
 await page.locator("#preview-button").click();
 await page.waitForFunction(()=>document.getElementById("status")?.textContent?.includes("Pet MP wallet conflict"));
 assert.equal(await page.locator("#apply-button").isEnabled(),false);
 assert.match(await page.locator("#warning").innerText(),/Import is blocked/i);
 const after=await page.evaluate(()=>({
  scholar:localStorage.getItem("lux-scholar-garden-v1"),
  wallet:localStorage.getItem("lux-pet-companion-v1")}));
 assert.equal(after.scholar,null);
 assert.equal(after.wallet,current);
 console.log("PET_WALLET_WEBKIT_CONFLICT_BLOCK_PASS");
 await context.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
