/* Isolated WebKit browser UI regression for Daily V2 staging.
 * Synthetic fixture only, served from a disposable localhost origin.
 * This is NOT a physical iPad test and never loads production Home/Pet.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webkit} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+pathname);
  if(!path.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const data=await readFile(path);
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/daily-v2/staging/qa.html';
const status=async(page,id,expected)=>{
 await page.waitForFunction(([id,expected])=>
  document.getElementById(id)?.textContent?.trim()===expected,[id,expected]);
 assert.equal(await page.locator('#'+id).innerText(),expected);
};
const taskButton=(page,id)=>page.locator('#taskGrid button').filter({hasText:
 id.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase())});
let browser;
try{
 browser=await webkit.launch({headless:true});
 for(const viewport of [{width:1024,height:768},{width:820,height:1180}]){
  const context=await browser.newContext({viewport});
  try{
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(url);
   await page.waitForFunction(()=>document.getElementById('notice')?.textContent?.includes('QA page is ready'));
   await page.evaluate(()=>{
    localStorage.setItem('lux-scholar-garden-v1','SYNTHETIC_SCHOLAR_SENTINEL');
    localStorage.setItem('lux-pet-companion-v1','SYNTHETIC_PET_SENTINEL');
   });
   await page.click('#initialize');
   await status(page,'credits','0 / 163');
   await status(page,'tasksDone','0 / 10');
   await status(page,'unavailable','0');
   assert.match(await page.locator('#planStatus').innerText(),/READY QA/);
   assert.equal(await page.locator('#taskGrid button').count(),10);

   await taskButton(page,'french-vocab').click();
   await page.fill('#answer','WRONG');
   await page.click('#submitAnswer');
   await page.waitForFunction(()=>document.getElementById('notice')?.textContent?.includes('Verified save receipt'));
   await status(page,'credits','0 / 163');
   await page.fill('#answer','QA_OK');
   await page.click('#submitAnswer');
   await status(page,'credits','1 / 163');
   await page.reload();
   await status(page,'credits','1 / 163');
   await taskButton(page,'french-vocab').click();
   await page.click('#simulateFailure');
   await page.fill('#answer','QA_OK');
   await page.click('#submitAnswer');
   await page.waitForFunction(()=>document.getElementById('notice')?.textContent?.includes('SIMULATED_STORAGE_FAILURE'));
   await status(page,'credits','1 / 163');
   await page.click('#submitAnswer');
   await status(page,'credits','2 / 163');
   await page.click('#refreshView');
   await status(page,'credits','2 / 163');

   await taskButton(page,'gcse-exam-skills').click();
   for(const [index,marks] of [1,2,2].entries()){
    await page.selectOption('#marks',String(marks));
    await page.click('#submitAnswer');
    await page.waitForFunction(progress=>
     document.getElementById('notice')?.textContent?.includes('Task progress: '+progress+'/3'),index+1);
   }
   await status(page,'credits','5 / 163');
   assert.match(await taskButton(page,'gcse-exam-skills').innerText(),/exam marks 5\/6/);

   await page.selectOption('#scenario','missing-gcse');
   await page.click('#initialize');
   await status(page,'credits','0 / 163');
   await status(page,'unavailable','1');
   await status(page,'tasksDone','0 / 10');
   assert.match(await page.locator('#planStatus').innerText(),/PARTIAL QA/);
   assert.match(await page.locator('#fullDay').innerText(),/not eligible/i);
   assert.equal(await taskButton(page,'gcse-exam-skills').isDisabled(),true);
   assert.equal(await page.locator('#taskGrid button').count(),10);
   const keys=await page.evaluate(()=>({
    scholar:localStorage.getItem('lux-scholar-garden-v1'),
    pet:localStorage.getItem('lux-pet-companion-v1')
   }));
   assert.deepEqual(keys,{scholar:'SYNTHETIC_SCHOLAR_SENTINEL',
    pet:'SYNTHETIC_PET_SENTINEL'});
   assert.deepEqual(errors,[]);
   console.log('DAILY_V2_WEBKIT_STAGING_UI_PASS',JSON.stringify({viewport,
    checks:['ten-task 163-plan','wrong answer no credit','correct credit survives reload',
     'save failure no optimistic credit','retry counts once','GCSE partial marks',
     '9-task shortage blocks full-day reward','legacy Scholar/Pet keys unchanged',
     'no uncaught page errors']}));
  }finally{await context.close();}
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
