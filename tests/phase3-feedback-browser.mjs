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
try{for(const launcher of [chromium,webkit]){
 const browser=await launcher.launch({headless:true});
 try{for(const viewport of [{width:834,height:1112},{width:390,height:844}]){
 // Share the same browser context (and learner storage), but isolate each
 // route in a fresh page. Reusing a document across navigations lets WebKit
 // report cancelled fetches from the *previous* page as current page errors.
 const context=await browser.newContext({viewport,reducedMotion:viewport.width===390?'reduce':'no-preference'});
 await context.addInitScript(()=>{window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{},speak:u=>window.__spoken.push(u.text),speaking:false}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};});
 for(const route of ['/','/study/latin/practise','/study/chemistry/practise']){
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
 await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__luxAppReady===true);
 if(route==='/'){
   // Home's approved RPG layer intentionally covers its legacy voice toggle.
   // Confirm that the actual visible greeting exists; the voice toggle
   // below is still exercised on both native Study practice routes.
   await page.waitForSelector('#lux-rpg-live-home .rpg-greet-control-live',{state:'visible'});
   assert.deepEqual(errors,[],'Home must load without page errors');
   continue;
 }
 await page.waitForSelector('#lux-voice-cheer-toggle');
  console.log('PHASE3_ROUTE',JSON.stringify({requested:route,actual:new URL(page.url()).pathname}));
  assert.equal(new URL(page.url()).pathname,route,'Practice routes must not unexpectedly redirect Home');
  // Wait for Study companion only on practice routes; Home has no answer flash.
  if(route!=='/')await page.waitForSelector('#study-companion',{state:'visible',timeout:20000});
 const toggle=page.locator('#lux-voice-cheer-toggle');assert.equal(await toggle.count(),1);assert.ok((await toggle.boundingBox()).height>=44);
 const snapshot=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'{}').state||{};return JSON.stringify({xp:s.xp,daily:s.daily,outfits:s.unlockedOutfits,pet:JSON.parse(localStorage.getItem('lux-pet-companion-v1')||'{}')},(key,value)=>key==='lastEnergyUpdateAt'?undefined:value)});
 await page.waitForTimeout(800);const before=await snapshot();
 if(await toggle.getAttribute('aria-pressed')==='true')await toggle.click();
 await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');assert.ok(await page.evaluate(()=>__spoken.length>0));
 await page.evaluate(()=>{for(let i=0;i<3;i++)window.dispatchEvent(new CustomEvent('scholar:question-answered',{detail:{correct:true}}))});
 if(route!=='/'){await page.waitForSelector('.cx-answer-flash',{state:'visible',timeout:3000});assert.equal(await page.evaluate(()=>window.__luxPhase1LastAnswer?.path===location.pathname),true,'correct-answer event should reach the Study companion');}
 await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'false');assert.equal(await snapshot(),before,'feedback does not award or credit anything');
 await page.waitForTimeout(1500);assert.equal(await page.locator('#lux-voice-cheer-toggle').count(),1);assert.equal(await page.locator('#lux-loading-recovery').count(),0);
 assert.deepEqual(errors,[],'Practice route must load without page errors');
 } finally {await page.close();}
 }
 console.log(launcher.name(),viewport.width,'voice, streak, startup and progress passed');await context.close();
 }}finally{await browser.close()}
}}finally{server.close()}
