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
const failures=[],reports=[];
try{
 for(const [name,launcher] of [["chromium",chromium],["webkit",webkit]]){
  const browser=await launcher.launch({headless:true});
  try{
   for(const vp of [{width:1280,height:800},{width:834,height:1112}]){
    const context=await browser.newContext({viewport:vp,locale:"en-GB",
     timezoneId:"Europe/London",hasTouch:vp.width===834});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    try{
     const response=await page.goto(base+"/study/",{waitUntil:"domcontentloaded",timeout:35000});
     assert.equal(response.status(),200,"Study HTTP status");
     await page.waitForFunction(()=>{
       const nav=document.getElementById("lux-study-paths-v2");
       const app=document.querySelector("main h1");
       return !!nav && !!app && /Continue Learning/i.test(app.textContent||"");
     },null,{timeout:30000});
     assert.equal(await page.locator("#lux-study-paths-v2 article").count(),3);
     assert.equal(await page.locator('a[href="/assessment/"]').count()>0,true);
     assert.equal(await page.locator("#lux-study-paths-v2 a[href^='/']").count()>0,true);
     assert.equal(await page.locator('main a[href="/study/latin"]').count()>0,true);
     assert.equal(await page.locator('main a[href="/study/chemistry"]').count()>0,true);
     assert.ok((await page.locator("main").innerText()).length>250,"non-blank Study page");
     const homeResponse=await page.request.get(base+"/");
     const homeText=await homeResponse.text();
     assert.doesNotMatch(homeText,/study-navigation-v2-20261010/,"Home untouched");
     // The UX year buttons must delegate to the existing Study year selection.
     await page.locator('#lux-study-paths-v2 button[data-lux-year="8"]').click();
     await page.waitForTimeout(700);
     assert.equal(await page.locator('main select:has(option[value="8"])').inputValue(),"8",
       "native Study year switch");
     const href=await page.locator("#lux-study-paths-v2 article").first().locator("a").getAttribute("href");
     assert.ok(href?.startsWith("/"),"daily link same-origin");
     if(errors.length)throw Error("JS errors: "+errors.slice(0,4).join("; "));
     reports.push({engine:name,viewport:vp.width,panels:3,studyAlive:true,year8Works:true});
     await page.screenshot({path:"test-results/study-nav-"+name+"-"+vp.width+".png",fullPage:true});
    }catch(e){
     failures.push({engine:name,viewport:vp.width,message:e.message,errors});
     await page.screenshot({path:"test-results/study-nav-FAILED-"+name+"-"+vp.width+".png",fullPage:true}).catch(()=>{});
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(r=>server.close(r))}
console.log("STUDY_NAV_BROWSER_QA "+JSON.stringify({base,reports,failures}));
assert.deepEqual(failures,[],"Study navigation must render in Chromium and iPad WebKit");
