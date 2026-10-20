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
try{for(const launcher of [chromium,webkit]){const browser=await launcher.launch({headless:true});try{for(const viewport of [{width:834,height:1112},{width:1280,height:800},{width:390,height:844}]){const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/study/?studyRpgPreview=0');await page.waitForSelector('.lux-study-shortcuts');assert.equal(await page.locator('main h1').textContent(),'Study Library');assert.equal(await page.locator('#lux-study-paths-v2 img').count(),0);assert.equal(await page.locator('#lux-study-subjects-v2 h3').count(),6);assert.ok(await page.locator('#lux-study-subjects-v2').isVisible());await page.locator('main select').selectOption('8');await page.waitForTimeout(500);assert.equal(await page.locator('main select').inputValue(),'8');assert.ok(await page.locator('#lux-study-subjects-v2').textContent().then(x=>x.includes('Year 8')));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log(launcher.name(),viewport.width,'passed');await page.close();}}finally{await browser.close();}}}finally{server.close();}
