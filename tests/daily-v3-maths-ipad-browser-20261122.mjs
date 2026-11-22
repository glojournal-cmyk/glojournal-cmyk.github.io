import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const root=process.cwd(),out='test-results/maths-v31-ipad-qa';
fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync('qa-staging/math-v31-original-sample10.json','utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml',
 '.png':'image/png','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  const decoded=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+(decoded.endsWith('/')?decoded+'index.html':decoded));
  if(!target.startsWith(root+path.sep))throw Error('outside project');
  res.writeHead(200,{'content-type':types[path.extname(target)]||'application/octet-stream',
     'cache-control':'no-store'});res.end(fs.readFileSync(target));
 }catch{res.writeHead(404);res.end('not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port,results=[];
async function inspect(name,browserType){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1024,height:1366},isMobile:true,hasTouch:true,
   timezoneId:'Europe/London'});
 const page=await context.newPage(),errors=[],externalRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith(base+'/'))externalRequests.push(r.url())});
 page.setDefaultTimeout(20000);
 try{
  await page.goto(base+'/study/maths/daily/',{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('body').innerText(),/ACADEMIC QA HOLD/);
  assert.equal(await page.locator('#qa-preview').isHidden(),true);
  const initial=await page.evaluate(()=>({
   keys:Object.keys(localStorage).sort(),attempts:localStorage.getItem('lux-scholar-garden-v1')
  }));
  await page.goto(base+'/study/maths/daily/?qa=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__mathsQAReviewerState?.().rendered===true,null,{timeout:30000});
  const q=page.locator('#qa-question');
  assert.equal(await q.getAttribute('data-question-id'),source.questions[0].id);
  assert.equal(await page.locator('#qa-choices button.choice').count(),6);
  assert.ok(await page.locator('math[xmlns="http://www.w3.org/1998/Math/MathML"]').count()>0,
    'Offline native MathML must actually render formulas on WebKit/Chromium');
  // The renderer must keep working after the browser loses network.
  await context.setOffline(true);
  const option=source.questions[0].correctOptionId;
  await page.locator('#qa-choices button[data-option-id="'+option+'"]').click();
  await page.locator('#qa-worked').waitFor({state:'visible'});
  assert.match(await page.locator('#qa-result').innerText(),/Correct option/);
  assert.ok(await page.locator('#qa-solution li').count()>=2);
  await page.locator('#qa-next').click();
  await page.waitForFunction(()=>window.__mathsQAReviewerState?.().index===1&&
    window.__mathsQAReviewerState?.().rendered===true);
  assert.equal(await q.getAttribute('data-question-id'),source.questions[1].id);
  const final=await page.evaluate(()=>({
   keys:Object.keys(localStorage).sort(),attempts:localStorage.getItem('lux-scholar-garden-v1'),
   reviewer:window.__mathsQAReviewerState()
  }));
  assert.deepEqual(externalRequests,[],'Offline native rendering must make no third-party CDN requests');
  assert.deepEqual(final.keys,initial.keys,'QA must never write learner storage');
  assert.equal(final.attempts,initial.attempts,'QA must not change main learner state');
  assert.equal(final.reviewer.answers.length,1);
  assert.equal(final.reviewer.sourceStatus,'QA_ONLY_NOT_APPROVED');
  await page.screenshot({path:out+'/'+name+'-passed.png',fullPage:true});
  results.push({browser:name,pass:true,firstQuestion:source.questions[0].id,
    secondQuestion:source.questions[1].id,nativeOfflineMathML:true,storageUnchanged:true});
 }catch(e){
  await page.screenshot({path:out+'/'+name+'-failed.png',fullPage:true}).catch(()=>{});
  const detail={browser:name,pass:false,message:String(e),pageErrors:errors,
    pageText:(await page.locator('body').innerText().catch(()=>''))?.slice(-1300)};
  results.push(detail);console.error('MATHS_V31_IPAD_QA_FAIL',JSON.stringify(detail));
  throw e;
 }finally{await context.close();await browser.close()}
}
try{
 await inspect('chromium',chromium);
 await inspect('webkit',webkit);
}finally{
 fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));
 await new Promise(resolve=>server.close(resolve));
}
console.log('MATHS_V31_IPAD_QA '+JSON.stringify(results));
