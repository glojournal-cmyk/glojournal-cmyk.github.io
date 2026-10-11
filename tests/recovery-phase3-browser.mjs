import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{const url=new URL(req.url,'http://localhost');let p=decodeURIComponent(url.pathname);if(p.endsWith('/'))p+='index.html';const file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep))throw Error('outside repository');
 const content=fs.readFileSync(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(content)}
 catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [name,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true});
 try{
 const context=await browser.newContext({viewport:{width:name==='webkit'?834:1280,height:name==='webkit'?1112:800},hasTouch:name==='webkit',timezoneId:'Europe/London'});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>document.documentElement.hasAttribute('data-lux-ready')||document.documentElement.hasAttribute('data-lux-load-error'),null,{timeout:22000});
 assert.equal(await page.locator('#lux-loading-recovery').count(),0,'no failed startup panel expected');
 assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-lux-ready')),true,'hydrated home');
 const before=await page.evaluate(()=>{const get=k=>localStorage.getItem(k);return {main:get('lux-scholar-garden-v1'),pet:get('lux-pet-companion-v1')}});
 await page.reload({waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>document.documentElement.hasAttribute('data-lux-ready'),null,{timeout:22000});
 const after=await page.evaluate(()=>{const get=k=>localStorage.getItem(k);return {main:get('lux-scholar-garden-v1'),pet:get('lux-pet-companion-v1')}});
 assert.deepEqual(after,before,'reopening without answering cannot destroy XP or Pet storage');
 assert.equal(errors.length,0,'startup must not emit browser errors: '+errors.join(' | '));
 results.push({engine:name,ready:true,reload:true,dataPreserved:true,errors:0});
 await context.close();
 }finally{await browser.close()}
 }
 console.log('RECOVERY_PHASE_3_BROWSER '+JSON.stringify(results));
}finally{await new Promise(resolve=>server.close(resolve))}
