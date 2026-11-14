import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const {chromium,webkit}=await import('playwright');
const root=process.cwd();
const known={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 try{
  let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',known[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const doc=JSON.parse(fs.readFileSync('content/exam-revision/chemistry-school-mock-20261114.json','utf8'));
const questions=new Map(doc.papers.flatMap(p=>p.questions).map(q=>[q.id,q]));
const storeKey='lux-chemistry-school-mock-20261116-v1';
const errors=[];
async function saved(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storeKey);}
async function answerCurrent(page,q){
 if(q.format==='mc_single')await page.locator('#answer-area input[type="radio"]').nth(q.options.indexOf(q.answer.accepted[0])).check();
 else if(q.format==='rubric_response')await page.locator('#answer-area textarea').fill(q.answer.accepted[0]);
 else await page.locator('#answer-area input[type="text"]').fill(q.answer.accepted[0]);
}
try{
 for(const [engine,label,viewport] of [[chromium,'desktop',{width:1280,height:900}],[webkit,'iPad WebKit',{width:820,height:1180}]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport,acceptDownloads:true});
   page.on('pageerror',e=>errors.push(label+': '+e.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.goto(base+'/study/chemistry/exam-revision/mock/');
   await page.locator('#start').waitFor({state:'visible'});
   assert.match(await page.locator('body').innerText(),/16 November 2026/);
   await page.evaluate(()=>localStorage.setItem('mock-qa-main-progress-guard','unchanged'));
   await page.selectOption('#version','A');
   await page.click('#start');
   await page.locator('#paper').waitFor({state:'visible'});
   assert.match(await page.locator('#clock').innerText(),/\d\d:\d\d remaining/);
   let draft=await saved(page);
   assert.equal(draft.active.paperId,'A');
   assert.equal(draft.active.questionIds.length,13);
   let q=questions.get(draft.active.questionIds[0]);
   assert.ok(await page.locator('#figure img').isVisible(),'First question has a visible Rutherford diagram');
   await answerCurrent(page,q);
   await page.click('#next');
   draft=await saved(page);assert.equal(draft.active.index,1);
   await page.reload();
   await page.locator('#resume').waitFor({state:'visible'});
   assert.match(await page.locator('#resume').innerText(),/1\/13 answered/);
   await page.click('#resume');
   assert.match(await page.locator('#position').innerText(),/Question 2 of 13/);
   for(let i=1;i<13;i++){
    draft=await saved(page);q=questions.get(draft.active.questionIds[i]);
    await answerCurrent(page,q);
    if(i<12)await page.click('#next');
   }
   await page.click('#submit');
   await page.locator('#results').waitFor({state:'visible'});
   assert.equal(await page.locator('.review-item').count(),13);
   assert.match(await page.locator('#result-note').innerText(),/await self-marking/);
   for(let i=0;i<13;i++){
    const q=questions.get(draft.active.questionIds[i]);
    if(q.format==='rubric_response')
      await page.locator('.review-item').nth(i).locator('.self-mark select').selectOption(String(q.marks));
   }
   assert.match(await page.locator('#score').innerText(),/20\/20 marks/);
   assert.match(await page.locator('#score').innerText(),/100%/);
   assert.equal(await page.evaluate(()=>localStorage.getItem('mock-qa-main-progress-guard')),'unchanged');
   const record=await saved(page);
   assert.equal(record.active,null);
   assert.equal(record.history.length,1);
   await page.click('#new-paper');
   await page.locator('#start').waitFor({state:'visible'});
   await page.selectOption('#version','C');
   await page.click('#start');
   assert.match(await page.locator('#paper-title').innerText(),/School Mock C/);
   console.log(label+' Chemistry School Mock: end-to-end PASS');
  }finally{await browser.close();}
 }
 assert.deepEqual(errors,[]);
}finally{await new Promise(resolve=>server.close(resolve));}
