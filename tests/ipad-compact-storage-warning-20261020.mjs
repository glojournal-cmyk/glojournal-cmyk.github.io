import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';

const root=process.cwd(),source=fs.readFileSync('assets/storage-health-20261011.js','utf8');
assert.ok(source.includes('function exportLiveProgress()'));
assert.ok(source.includes('Unsubmitted typed answers may not be included.'));
assert.ok(!source.includes('localStorage.clear()'));
const payload={app:'lux-scholar-garden',exportedAt:'2026-10-20T16:00:00Z',
 state:{xp:2862,today:'2026-10-20',daily:[{id:'french-vocab',progress:28,target:30}],
 reviews:{q:{stage:3}},pet:'kept'}};
const json=JSON.stringify(payload);
const doc='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><h1>French Daily Practice</h1><input id="answer" value="unsubmitted new answer" /></main></body></html>';
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/study/french/practise/'){res.writeHead(200,{'content-type':'text/html'});res.end(doc);return;}
 try{const f=path.resolve(root,'.'+pathname);if(!f.startsWith(root+path.sep))throw Error('unsafe');
  const contents=fs.readFileSync(f);res.writeHead(200,{'content-type':'text/javascript'});res.end(contents);
 }catch{if(res.headersSent)res.end();else{res.writeHead(404);res.end('Not Found');}}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/study/french/practise/';
let passes=0;
try {
 for(const [name,launch] of [['webkit',webkit],['chromium',chromium]]){
  const browser=await launch.launch({headless:true});
  try {
   for(const width of [1024,1366]){
    const context=await browser.newContext({acceptDownloads:true,hasTouch:true,viewport:{width,height:width===1024?768:1024}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);
    await page.evaluate(data=>{
      // Do not permit local writes, just as when native iPad storage quota is full.
      Object.defineProperty(window,'__luxStoreQuotaFailed',{value:true,writable:true});
      window.__luxStore={persist:{hasHydrated:()=>false},getState:()=>({exportProgress:()=>data})};
      const priorSet=Storage.prototype.setItem;
      window.__unsafeWrites=0;
      Storage.prototype.setItem=function(){window.__unsafeWrites++;throw Error('QuotaExceededError')};
      window.__restoreSetItem=()=>{Storage.prototype.setItem=priorSet};
    },json);
    await page.addScriptTag({url:new URL('/assets/storage-health-20261011.js',url).href});
    await page.locator('#lux-storage-toggle').waitFor({state:'visible'});
    const pill=await page.locator('#lux-storage-warning').boundingBox();
    assert.ok(pill.width<240,'the warning must not span the whole iPad');
    assert.ok(pill.height<=60,'collapsed status must not cover the question');
    assert.equal(await page.locator('#lux-storage-details').isVisible(),false,'backup details start collapsed');
    await page.getByRole('button',{name:/Progress not saved. Open backup/}).click();
    await page.locator('#lux-storage-export').waitFor({state:'visible'});
    assert.match(await page.locator('#lux-storage-warning').innerText(),/could not be saved on this iPad/i);
    assert.match(await page.locator('#lux-storage-warning').innerText(),/Unsubmitted typed answers may not be included/);
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'Save backup to Files'}).click();
    const saved=await download;
    const disk=await saved.path();
    assert.ok(disk,'backup downloaded');
    assert.deepEqual(JSON.parse(fs.readFileSync(disk,'utf8')),payload);
    assert.match(saved.suggestedFilename(),/scholar-garden-emergency-2026-10-20\.json/);
    assert.equal(await page.evaluate(()=>window.__unsafeWrites),0,'export never uses localStorage writes');
    assert.equal(await page.locator('#answer').inputValue(),'unsubmitted new answer','draft remains visible');
    assert.equal(new URL(page.url()).pathname,'/study/french/practise/','the Practice page stays open');
    // Dismissing a verified-success warning is allowed; never hide only because
    // the student clicked the compact pill.
    await page.evaluate(()=>{
      window.__luxStoreQuotaFailed=false;
      window.dispatchEvent(new CustomEvent('scholar:storage-status',{detail:{saved:true}}));
    });
    assert.equal(await page.locator('#lux-storage-warning').isVisible(),false,
      'only a reported verified save can remove the unsaved indicator');
    await page.evaluate(()=>window.__restoreSetItem());
    await context.close();
    passes++;
   }
  }finally{await browser.close();}
 }
 console.log('PASS '+passes+' iPad downloads of current live Scholar progress without navigating or local writes');
}finally{await new Promise(resolve=>server.close(resolve))}
