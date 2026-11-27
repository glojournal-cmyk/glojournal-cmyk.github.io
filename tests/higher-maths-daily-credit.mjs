import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {assignment,dailyAnswer,dailyScore} from '../assets/math-study/higher-daily-20261125.js';
const {chromium}=createRequire(import.meta.url)('playwright');
const day='2026-11-26';
const keys=assignment(day);
assert.equal(new Set(keys.map(([id])=>id)).size,10);
assert.equal(assignment('2026-11-27').filter(([id])=>keys.some(([previous])=>previous===id)).length,0);
assert.throws(()=>dailyAnswer(day,keys[0][0],'A',new Date('2026-11-27T00:00Z')));
assert.equal(dailyScore(keys.map(([questionId])=>({day,questionId,correct:true})),day).submitted,0);
const browser=await chromium.launch({channel:'chrome',headless:true});
const url='http://127.0.0.1:8765';
async function session(goal){
  const context=await browser.newContext({timezoneId:'Europe/London'});
  async function newPage(){
    const page=await context.newPage();
    await page.clock.setFixedTime(new Date(day+'T17:00:00Z'));
    page.setDefaultTimeout(16000);
    return page;
  }
  try {
    let page=await newPage();
    await page.goto(url+'/');
    await page.waitForFunction(()=>window.__luxStore?.getState().daily?.length>0);
    await page.getByRole('link',{name:/Year 9 Higher Maths MCQ/}).waitFor();
    await page.waitForFunction(day=>window.__luxStore.getState().dailyLog?.[day]?.total===11,day);
    assert.deepEqual(await page.evaluate(day=>{
      const s=window.__luxStore.getState(), tasks=s.daily;
      return [tasks.length,tasks.reduce((n,t)=>n+t.target,0),s.dailyLog[day].tasks.length];
    },day),[11,175,11]);
    await page.getByRole('link',{name:/Year 9 Higher Maths MCQ/}).click();
    await page.waitForURL('**/higher-practice/**');
    for(const [i,[id,key]] of keys.entries()){
      const card=page.locator('article:visible');
      await card.waitFor();
      assert.equal(await card.getAttribute('data-question'),id);
      const selected=i<10-goal?(key==='A'?'B':'A'):key;
      let stale;
      if(i===0&&goal===9){
        stale=await newPage();await stale.goto(page.url());
        await stale.locator('article:visible button').first().waitFor();
      }
      await card.locator('[data-choice="'+selected+'"]').click();
      await card.locator('.solution').waitFor();
      if(stale){
        await stale.locator('article:visible [data-choice="'+key+'"]').click();
        await stale.locator('article:visible .solution').waitFor();
        assert.match(await stale.locator('article:visible .result').innerText(),new RegExp('first choice was '+selected));
        await stale.close();
      }
      if(i===2){
        const href=page.url();await page.close();page=await newPage();await page.goto(href);
      }else await page.locator('#next').click();
    }
    await page.getByText(goal+'/10 correct ·',{exact:false}).waitFor();
    assert.equal((await page.locator('#progress').innerText()).includes('Counted into'),goal>=9);
    await page.locator('#switch-mode').click();
    await page.waitForFunction(()=>window.__luxStore?.getState().formalAttemptLog?.filter(a=>a.dailyTaskId==='maths-daily').length===10);
    // Reopen Home and verify both the visible task list and the persisted dated record.
    await page.reload();
    await page.waitForFunction(({day,goal})=>{
      const s=window.__luxStore?.getState(), log=s?.dailyLog?.[day];
      return log?.tasks?.length>0 && s.formalAttemptLog?.filter(a=>a.dailyTaskId==='maths-daily').length===10 &&
        s.daily.filter(t=>t.id==='maths-daily'&&t.done===true).length===Number(goal>=9) &&
        log.tasks.filter(t=>t.id==='maths-daily'&&t.done===true).length===Number(goal>=9);
    },{day,goal},{timeout:25000});
    console.log(goal+'/10 confirmed in the student player, Home tasks and dated Daily Record after reload.');
  } finally {await context.close();}
}
try {for(const goal of [8,9,10]) await session(goal);}
finally {await browser.close();}
