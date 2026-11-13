import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildBank,STORE_KEY} from '../assets/chemistry-exam-revision-core-20261113.js';

const {chromium,webkit}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?
  process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright/index.mjs':'playwright');
const root=process.cwd();
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer((req,res)=>{
  let p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  try{
    if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');
    res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');
    res.end(fs.readFileSync(p));
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const bank=buildBank([5,6,7].map(n=>JSON.parse(fs.readFileSync('content/topics/chem-y9-c'+n+'.json','utf8'))));
const byId=new Map(bank.map(q=>[q.id,q]));
const errors=[];
async function state(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORE_KEY);}
try{
  for(const [engine,label,viewport] of [
    [chromium,'desktop',{width:1280,height:880}],
    [webkit,'iPad WebKit',{width:820,height:1180}],
    [webkit,'phone WebKit',{width:390,height:844}]
  ]){
    const browser=await engine.launch({headless:true});
    try{
      const page=await browser.newPage({viewport,acceptDownloads:true});
      page.on('pageerror',error=>errors.push(label+': '+error.message));
      page.on('dialog',dialog=>dialog.accept());
      await page.goto(base+'/study/chemistry/exam-revision/');
      await page.locator('#start').waitFor({state:'visible'});
      await page.evaluate(()=>localStorage.setItem('scholar-progression-qa-guard','unchanged'));
      assert.match(await page.locator('#status').innerText(),/62 assessment questions ready/);
      await page.selectOption('#scope','mixed');
      await page.selectOption('#length','10');
      await page.click('#start');
      await page.locator('#paper').waitFor({state:'visible'});
      let draft=await state(page);
      assert.equal(draft.active.questionIds.length,10);
      const first=draft.active.questionIds[0],firstQuestion=byId.get(first);
      if(firstQuestion.format==='mc_single'){
        await page.locator('input[name="exam-choice"]').nth(firstQuestion.options.indexOf(firstQuestion.answer.accepted[0])).check();
      }else{
        await page.locator('#answer-area input[type="text"]').fill(firstQuestion.answer.accepted[0]);
      }
      await page.click('#next');
      await page.reload();
      await page.locator('#resume').waitFor({state:'visible'});
      assert.match(await page.locator('#resume').innerText(),/1 of 10 answered/);
      await page.click('#resume');
      assert.match(await page.locator('#position').innerText(),/Question 2/);
      assert.equal(await page.locator('#results').isVisible(),false,'results must not show during exam');
      // Check all 10 answers and submit; already-entered question is kept on resume.
      for(let i=1;i<10;i++){
        draft=await state(page);
        const q=byId.get(draft.active.questionIds[i]);
        if(q.format==='mc_single'){
          await page.locator('input[name="exam-choice"]').nth(q.options.indexOf(q.answer.accepted[0])).check();
        }else await page.locator('#answer-area input[type="text"]').fill(q.answer.accepted[0]);
        if(i<9)await page.click('#next');
      }
      await page.click('#submit');
      await page.locator('#results').waitFor({state:'visible'});
      assert.match(await page.locator('#result-score').innerText(),/10 \/ 10 · 100%/);
      assert.equal(await page.locator('.review-item').count(),10);
      assert.equal(await page.locator('#redo-wrong').isVisible(),false);
      assert.equal((await state(page)).active,null);
      assert.equal(await page.evaluate(()=>localStorage.getItem('scholar-progression-qa-guard')),'unchanged');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' has horizontal overflow');
      await page.click('#new-paper');
      await page.selectOption('#scope','history');
      await page.selectOption('#length','20');
      await page.click('#start');
      draft=await state(page);
      assert.equal(draft.active.questionIds.length,8,'History topic paper must not claim 20 available questions');
      for(let i=0;i<7;i++)await page.click('#next');
      await page.click('#submit'); // Confirm blank submission; no accidental credit.
      assert.match(await page.locator('#result-score').innerText(),/0 \/ 8 · 0%/);
      await page.click('#redo-wrong');
      assert.equal((await state(page)).active.questionIds.length,8);
      console.log('EXAM_REVISION_BROWSER '+label+' PASS: load, start, resume, answer, end-mark, review, empty submission, wrong retry, isolated storage');
    }finally{await browser.close();}
  }
  assert.deepEqual(errors,[],'No browser page errors');
}finally{await new Promise(resolve=>server.close(resolve));}
