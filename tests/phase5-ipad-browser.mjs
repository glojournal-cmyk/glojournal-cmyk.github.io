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
 for(const viewport of [{width:834,height:1112},{width:1112,height:834}]){
 const context=await browser.newContext({viewport,deviceScaleFactor:2,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const view=new EventTarget();let height=innerHeight;Object.defineProperties(view,{height:{get:()=>height},width:{get:()=>innerWidth},offsetTop:{get:()=>0},offsetLeft:{get:()=>0},scale:{get:()=>1}});Object.defineProperty(window,'visualViewport',{value:view,configurable:true});window.__keyboardHeight=n=>{height=n;view.dispatchEvent(new Event('resize'))}});
 await page.goto(base+'/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__luxAppReady===true);await page.waitForSelector('link[href*="phase5-ipad-display"]');
 const hero=page.locator('main img.scholar-idle').first();await hero.evaluate(img=>img.decode());assert.ok(await hero.evaluate(img=>img.naturalWidth>=1024&&img.naturalHeight>=1499),'existing HD character retained');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('lux-page-paused')),true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('lux-page-paused')),false);
 await page.goto(base+'/scholar/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__luxAppReady===true);await page.getByRole('button',{name:'Settings',exact:true}).click();
 const preview=page.locator('main img[src^="/art/doll/"]').first();await preview.evaluate(img=>img.decode());assert.equal(await preview.evaluate(img=>getComputedStyle(img).objectFit),'contain');assert.equal(await preview.getAttribute('decoding'),'async');
 const undersized=await page.evaluate(()=>[...document.querySelectorAll('main button')].filter(b=>b.getBoundingClientRect().width>0&&b.getBoundingClientRect().height>0&&b.getBoundingClientRect().height<43.5).map(b=>b.textContent));assert.deepEqual(undersized,[],'iPad main controls must be tappable');
 await page.goto(base+'/play/weekly-boss/',{waitUntil:'networkidle'});await page.waitForSelector('.sm-theme-picker');await page.getByRole('button',{name:/Moonlit Masquerade/}).click();const field=page.getByRole('textbox',{name:'Your answer'});await field.focus();await page.evaluate(()=>__keyboardHeight(450));await page.waitForFunction(()=>document.body.classList.contains('lux-keyboard-open'));
 assert.equal(await page.locator('nav.fixed.inset-x-3.bottom-3, nav.lux-companion-bottom-nav').first().isVisible(),false,'bottom nav cannot cover answer field');
 await page.evaluate(()=>{document.activeElement.blur();__keyboardHeight(innerHeight)});await page.waitForFunction(()=>!document.body.classList.contains('lux-keyboard-open'));
 assert.equal(await page.locator('nav.fixed.inset-x-3.bottom-3, nav.lux-companion-bottom-nav').first().isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log(launcher.name(),viewport.width,'HD preview, touch targets, reduced motion and keyboard passed');await context.close();
 }
 const page=await browser.newPage();await page.goto(base+'/pet/',{waitUntil:'networkidle'});await page.waitForSelector('#petImage');
 const audit=await page.evaluate(async()=>{const {petArtUrl}=await import('/pet/pet-art-hd-20261009.js');const names=['antler-bean','moss-hornling','inkling','pebble-wisp','moon-puff','mothling','bloom-snail','velvet-batling','sprig-dragon','star-toadlet','snow-owl','night-spider'];let count=0;for(const name of names)for(let level=1;level<=5;level++){const im=new Image();im.src=petArtUrl(name,level);await im.decode();if(im.naturalWidth!==1254||im.naturalHeight!==1254)throw Error(name+' '+level+' is not the existing full HD sprite');count++}return count});assert.equal(audit,60);console.log(launcher.name(),'all 60 existing pet stages decode at 1254px');await page.close();
 }finally{await browser.close()}}}finally{server.close()}
