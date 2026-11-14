// Browser integration: real Assessment tracker, dedicated November routes and exam question start.
// Run with QA_BASE_URL=http://127.0.0.1:8777 after starting a static HTTP server.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8777';
for(const [name,engine,viewport] of [
 ['Chromium',chromium,{width:1280,height:800}],
 ['iPad WebKit',webkit,{width:1024,height:768}]
]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport});
  const problems=[];page.on('pageerror',e=>problems.push(e.message));
  await page.goto(base+'/assessment/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-tab="tracker"]').click();
  await page.locator('#tracker-list .assessment-tracker-entry').first().waitFor();
  const tracker=await page.locator('#tracker-list').innerText();
  for(const entry of ['Assessment 2 · Formulae, equations and atomic structure',
      'November Assessment · Taylor Chapters 1–3',
      'AQA 4.1.1 Cell structure','Devoirs: Assessment 1','Particle model of matter and conduction']){
    assert.ok(tracker.includes(entry),name+': school tracker missing '+entry);
  }
  for(const [paperId,href] of [
     ['chemistry-nov16','/study/chemistry/exam-revision/mock/'],
     ['latin-nov26','/study/latin/november-2026/'],
     ['french-nov26','/assessment/french-nov26/']
  ]){
    const row=page.locator('#tracker-list .assessment-tracker-entry').filter({hasText:paperId==='chemistry-nov16'?'Formulae, equations':paperId==='latin-nov26'?'Taylor Chapters 1–3':'Assessment 1'});
    assert.equal(await row.count(),1,name+': missing unique row for '+paperId);
    await row.locator('.assessment-tracker-item > summary').click();
    assert.equal(await row.locator('.assessment-tracker-actions a.primary').getAttribute('href'),href,name+': route mismatch '+paperId);
  }
  const bioRow=page.locator('.assessment-tracker-entry').filter({hasText:'AQA 4.1.1 Cell structure'});
  await bioRow.locator('.assessment-tracker-item > summary').click();
  await bioRow.locator('[data-tracker-paper="biology-cell-structure"]').click();
  await page.locator('#exam .question').waitFor({timeout:20000});
  assert.match(await page.locator('#exam').innerText(),/Question 1 of 24/,name+': Biology paper not launched');
  assert.ok(!(await page.locator('#exam').innerText()).includes('Model answer:'),'Answer leaked before submission');
  await page.locator('#exit').click();
  await page.locator('[data-subject="Latin"]').click();
  assert.equal(await page.locator('#paper-list a[href="/study/latin/november-2026/"]').count(),1);
  await page.locator('[data-subject="Chemistry"]').click();
  assert.equal(await page.locator('#paper-list a[href="/study/chemistry/exam-revision/mock/"]').count(),1);
  assert.deepEqual(problems,[],name+': runtime JavaScript errors');
  console.log(name+': upcoming tracker, dedicated links and Biology timed exam PASS');
 }finally{await browser.close()}
}
