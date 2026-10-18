import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:8777';
for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[],failedRequests=[];
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  page.on('requestfailed',request=>failedRequests.push({url:request.url(),reason:request.failure()?.errorText}));
  await page.clock.install({time:new Date('2026-10-19T10:00:00Z')});
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
    const tasks=window.__luxStore?.getState()?.daily||[];
    return ['y8-standard-a','y8-standard-b','y8-mastery-a','y8-mastery-b'].every(id=>tasks.find(t=>t.id===id)?.assignedTopic);
  },null,{timeout:30000});
  let before=await page.evaluate(()=>{
    const state=window.__luxStore.getState();return {today:state.today,
      tasks:state.daily.map(t=>({id:t.id,topic:t.assignedTopic,subject:t.assignedSubject,target:t.target,progress:t.progress,href:t.href})),
      xp:state.xp};
  });
  assert.equal(before.today,'2026-10-19');assert.equal(before.tasks.length,10);
  assert.equal(before.tasks.reduce((sum,t)=>sum+t.target,0),155);
  const standards=before.tasks.filter(t=>t.id.startsWith('y8-standard-'));
  assert.equal(standards.length,2);assert.equal(standards[0].subject,standards[1].subject);
  assert.notEqual(standards[0].topic,standards[1].topic);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
    const tasks=window.__luxStore?.getState()?.daily||[];
    return tasks.length===10 && tasks.find(t=>t.id==='y8-standard-a')?.assignedTopic &&
      !tasks.some(t=>['study-session','year8-long-review','tend-garden'].includes(t.id));
  },null,{timeout:30000});
  const after=await page.evaluate(()=>window.__luxStore.getState().daily.map(t=>[t.id,t.assignedTopic,t.progress]));
  assert.deepEqual(after,before.tasks.map(t=>[t.id,t.topic,t.progress]));
  // WebKit may reject a pending fetch when the preceding document is closed.
  // Check errors from the destination route independently of that navigation.
  errors.length=0;failedRequests.length=0;
  await page.goto(base+standards[0].href,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1200);
  assert.ok((await page.locator('body').innerText()).length>200);
  // Safari/WebKit reports aborted old-document fetches as access-control
  // pageerrors during a full navigation. The route sweep separately checks
  // every page for HTTP failures; keep all other errors fatal here.
  const routeErrors=errors.filter(message=>!(engine===webkit && failedRequests.length===0 &&
    /Fetch API cannot load .* due to access control checks/.test(message)));
  assert.equal(routeErrors.length,0,JSON.stringify({engine:engine.name(),errors:routeErrors,failedRequests}));
  await browser.close();
}
console.log('Mastery 2.0 browser QA: 1024px iPad viewport, assignments, reload, Study route in Chromium and WebKit.');
