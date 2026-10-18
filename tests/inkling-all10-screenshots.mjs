import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const out=path.join(root,'pet/previews/inkling-all10-20261018');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.ico':'image/x-icon','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
  try {
    let u=new URL(req.url,'http://localhost').pathname;
    if(u.endsWith('/'))u+='index.html';
    let f=path.resolve(root,'.'+u);
    if(!f.startsWith(root+path.sep))throw Error('traversal');
    if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');
    res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});
    res.end(fs.readFileSync(f));
  } catch {res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1550,height:1100},deviceScaleFactor:1.5,reducedMotion:'reduce'});
 await page.addInitScript(()=>{
   try {
     const k='lux-pet-companion-v1';
     localStorage.setItem(k,JSON.stringify({
       species:'inkling',
       masteryPoints:0,
       unlockedSecrets:{'inkling':true},
       petLevels:{'inkling':1}
     }));
   }catch{}
 });
 await page.goto(base+'/pet/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#petFormGrid .pet-form', {timeout:15000});
 await page.waitForFunction(()=>document.querySelectorAll('#petFormGrid .pet-form').length===10,{timeout:15000});
 const title=(await page.locator('#petTitle').innerText()).trim();
 assert.ok(title.includes('Inkling'),'Selected wrong companion: '+title);
 const stages=await page.locator('#petFormGrid .pet-form-art').evaluateAll(nodes=>nodes.map(x=>getComputedStyle(x).backgroundImage));
 assert.equal(stages.length,10);
 for(let level=1;level<=10;level++)assert.ok(stages[level-1].includes('/art-inkling-all10-20261018/level-'+level+'.png'),'Missing deployed Owl image '+level);
 await page.evaluate(async()=>{
  const nodes=[...document.querySelectorAll('#petFormGrid .pet-form-art')];
  await Promise.all(nodes.map(async el=>{
   const raw=getComputedStyle(el).backgroundImage;
   const url=raw.match(/url\(["']?(.*?)["']?\)/)?.[1];
   if(!url)throw Error('No image on level card');
   const image=new Image();
   image.src=url;
   await image.decode();
  }));
 });
 await page.locator('#petFormGrid').screenshot({path:path.join(out,'full-gallery-lv1-10.png'),animations:'disabled'});
 for(let level=1;level<=10;level++){
  await page.locator('#petFormGrid .pet-form').nth(level-1).screenshot({
    path:path.join(out,'level-'+level+'-app-card.png'), animations:'disabled'
  });
 }
 await page.addStyleTag({content:`
  #petFormGrid {display:grid !important;grid-template-columns:repeat(5,minmax(0,1fr)) !important;gap:20px !important;max-width:1280px !important;margin:0 auto !important;}
  #petFormGrid > .pet-form{min-height:360px !important;}
  #petFormGrid .pet-form-art{height:230px !important;min-height:230px !important;background-size:contain !important;}
  #petFormGrid strong {font-size:22px !important;}
 `});
 await page.locator('#petFormGrid').screenshot({path:path.join(out,'lv1-10-comparison.png'),animations:'disabled'});
 console.log('INKLING_SCREENSHOTS_DONE: '+JSON.stringify({
    title,
    levels:10,
    files:fs.readdirSync(out).map(name=>({name,bytes:fs.statSync(path.join(out,name)).size})),
    unlockWasOnlyInEphemeralPlaywrightProfile:true
 }));
} finally {
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
