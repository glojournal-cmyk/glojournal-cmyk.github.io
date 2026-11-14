import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildBank,scorePaper,STORE_KEY} from '../assets/chemistry-exam-revision-core-20261113.js';

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
const bank=buildBank([...([5,6,7].map(n=>JSON.parse(fs.readFileSync('content/topics/chem-y9-c'+n+'.json','utf8')))),JSON.parse(fs.readFileSync('content/exam-revision/chemistry-nov16-2026-applied.json','utf8'))]);
assert.equal(bank.length,150,'legacy C1.7/C1.8 items retained for saved-result compatibility');
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
      assert.match(await page.locator('#status').innerText(),/134 school-assessment questions ready/);
      await page.selectOption('#scope','mixed');
      await page.selectOption('#length','10');
      await page.click('#start');
      await page.locator('#paper').waitFor({state:'visible'});
      let draft=await state(page);
      assert.equal(draft.active.questionIds.length,10);
      const first=draft.active.questionIds[0],firstQuestion=byId.get(first);
      if(firstQuestion.format==='mc_single'){
        await page.locator('input[name="exam-choice"]').nth(firstQuestion.options.indexOf(firstQuestion.answer.accepted[0])).check();
      }else if(firstQuestion.format==='rubric_response'){
        await page.locator('#answer-area textarea').fill(firstQuestion.answer.accepted[0]);
      }else{
        await page.locator('#answer-area input[type="text"]').fill(firstQuestion.answer.accepted[0]);
      }
      // A failed iPad draft write must not advance the visible question.
      // The learner can export the in-memory paper without leaving the answer.
      await page.evaluate(key=>{
        const original=Storage.prototype.setItem;
        Storage.prototype.setItem=function(k,v){
          if(k===key&&window.__examWriteBlocked)
            throw new DOMException('Simulated storage quota error','QuotaExceededError');
          return original.call(this,k,v);
        };
        window.__examWriteBlocked=true;
      },STORE_KEY);
      await page.click('#next');
      assert.match(await page.locator('#position').innerText(),/Question 1/);
      assert.equal((await state(page)).active.index,0,'failed save must not advance saved question position');
      assert.match(await page.locator('#paper-save-status').innerText(),/Save failed/);
      assert.equal(await page.locator('#paper-export').isVisible(),true,'backup export is reachable while answering');
      await page.evaluate(()=>{window.__examWriteBlocked=false;});
      await page.click('#next');
      assert.match(await page.locator('#position').innerText(),/Question 2/);
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
        }else if(q.format==='rubric_response'){
          await page.locator('#answer-area textarea').fill(q.answer.accepted[0]);
        }else await page.locator('#answer-area input[type="text"]').fill(q.answer.accepted[0]);
        if(i<9)await page.click('#next');
      }
      await page.click('#submit');
      await page.locator('#results').waitFor({state:'visible'});
      const afterSubmit=scorePaper(bank,(await state(page)).latest);
      assert.ok(afterSubmit.pendingQuestions>0,'Assessment papers must include self-marked multi-part responses');
      assert.equal(await page.locator('.review-item').count(),10);
      assert.match(await page.locator('#result-score').innerText(),/marks confirmed/);
      // Simulate Safari QuotaExceededError while awarding a rubric mark.
      // A visible mark must not be credited unless localStorage verified the write.
      await page.evaluate(key=>{
        const original=Storage.prototype.setItem;
        Storage.prototype.setItem=function(k,v){
          if(k===key&&window.__examWriteBlocked)
            throw new DOMException('Simulated storage quota error','QuotaExceededError');
          return original.call(this,k,v);
        };
        window.__examWriteBlocked=true;
      },STORE_KEY);
      const firstPending=afterSubmit.rows.find(x=>x.pending);
      const markControl=page.getByLabel('Award marks for question '+firstPending.id);
      await markControl.selectOption(String(firstPending.marks));
      assert.equal(await markControl.inputValue(),'','failed rubric mark must reset the selector');
      assert.equal(scorePaper(bank,(await state(page)).latest).pendingQuestions,afterSubmit.pendingQuestions,
        'failed rubric mark must not change saved results');
      assert.match(await page.locator('#status').innerText(),/Save failed/);
      await page.evaluate(()=>{window.__examWriteBlocked=false;});
      for(const row of afterSubmit.rows.filter(x=>x.pending)){
        await page.getByLabel('Award marks for question '+row.id).selectOption(String(row.marks));
      }
      const graded=scorePaper(bank,(await state(page)).latest);
      assert.equal(graded.pendingQuestions,0);
      assert.equal(graded.percentage,100,'Every mark scheme point was awarded');
      assert.match(await page.locator('#result-score').innerText(),/100%/);
      assert.equal(await page.locator('#redo-wrong').isVisible(),false);
      await page.reload();
      await page.locator('#history').waitFor({state:'visible'});
      await page.getByRole('button',{name:'Review paper'}).first().click();
      assert.match(await page.locator('#result-score').innerText(),/100%/,
        'All rubric marks must survive a page reload and review-history reopening');
      assert.equal((await state(page)).active,null);
      assert.equal(await page.evaluate(()=>localStorage.getItem('scholar-progression-qa-guard')),'unchanged');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' has horizontal overflow');
      await page.click('#new-paper');
      await page.selectOption('#scope','history');
      await page.selectOption('#length','20');
      await page.click('#start');
      draft=await state(page);
      assert.equal(draft.active.questionIds.length,20,'History topic bank now has 22 questions');
      for(let i=0;i<19;i++)await page.click('#next');
      const unsent=(await state(page)).active.id;
      // Reloading removed our first Storage monkey patch: re-install before testing.
      await page.evaluate(key=>{
        const original=Storage.prototype.setItem;
        Storage.prototype.setItem=function(k,v){
          if(k===key&&window.__examWriteBlocked)
            throw new DOMException('Simulated storage quota error','QuotaExceededError');
          return original.call(this,k,v);
        };
        window.__examWriteBlocked=true;
      },STORE_KEY);
      await page.click('#submit'); // Failed writes must not destroy the old draft.
      assert.equal(await page.locator('#paper').isVisible(),true,'failed submit must remain on paper');
      assert.equal((await state(page)).active.id,unsent,'completed draft must survive failed submit');
      assert.match(await page.locator('#status').innerText(),/Save failed/);
      await page.evaluate(()=>{window.__examWriteBlocked=false;});
      await page.click('#submit'); // Blank multi-mark responses must be zero, not pending.
      const empty=scorePaper(bank,(await state(page)).latest);
      assert.equal(empty.awarded,0);
      assert.equal(empty.pendingQuestions,0);
      assert.match(await page.locator('#result-score').innerText(),/0 \/ .* · 0%/);
      await page.click('#redo-wrong');
      assert.equal((await state(page)).active.questionIds.length,20);
      const oldDraftId=(await state(page)).active.id;
      await page.click('#back-setup');
      await page.evaluate(()=>{window.__examWriteBlocked=true;});
      await page.click('#start'); // Failure must not overwrite an existing redo draft.
      assert.equal((await state(page)).active.id,oldDraftId);
      assert.equal(await page.locator('#setup').isVisible(),true);
      assert.match(await page.locator('#status').innerText(),/Save failed/);
      await page.evaluate(()=>{window.__examWriteBlocked=false;});
      await page.click('#resume');
      assert.equal((await state(page)).active.id,oldDraftId);
      console.log('EXAM_REVISION_BROWSER '+label+' PASS: load, start, resume, answer, end-mark, multi-mark self-review, quota failures, safe submission, wrong retry, isolated storage');
    }finally{await browser.close();}
  }
  assert.deepEqual(errors,[],'No browser page errors');
}finally{await new Promise(resolve=>server.close(resolve));}
