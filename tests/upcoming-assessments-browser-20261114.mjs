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
  // The French route must work beyond navigation: practice submission, post-paper
  // marking and local draft recovery in Chromium and the iPad WebKit viewport.
  await page.goto(base+'/assessment/french-nov26/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-tab="vocab"]').click();
  assert.equal(await page.locator('#vocabitems input[type="text"]').count(),15,name+': French dictation set size');
  assert.equal(await page.locator('#vocabrefdetails').isHidden(),true,name+': French answer reference hidden before submission');
  await page.locator('#vocabitems input[type="text"]').first().fill('test answer');
  await page.locator('#vocabfinish').click();
  await page.getByText('Practice score:',{exact:false}).waitFor();
  assert.equal(await page.locator('#vocabrefdetails').isVisible(),true,name+': reference available only after marking');
  assert.equal(await page.locator('#vocabfinish').isDisabled(),true,name+': submitted dictation must be locked');
  await page.locator('#vocabnew').click();
  assert.equal(await page.locator('#vocabfinish').isEnabled(),true,name+': new French dictation attempt must unlock');
  assert.equal(await page.locator('#vocabrefdetails').isHidden(),true,name+': fresh attempt re-locks the answer key');

  await page.locator('[data-tab="grammar"]').click();
  assert.equal(await page.locator('#grammaritems textarea').count(),12,name+': full-sentence set size');
  await page.locator('#grammaritems textarea').first().fill('Demain, nous visiterons Paris.');
  await page.locator('#grammarfinish').click();
  await page.locator('#grammarresult input[data-check]').first().check();
  assert.match(await page.locator('#grammarcount').innerText(),/Self-checked: 1\/12/,name+': French grammar self-marking');

  await page.locator('[data-tab="writing"]').click();
  const essay='Le mois dernier je suis allée à Paris avec ma famille. Nous avons visité un musée et nous avons mangé dans un restaurant. J’ai beaucoup aimé le voyage. L’année prochaine nous irons au Canada pour découvrir une autre ville.';
  await page.locator('#essay').fill(essay);
  await page.locator('#essaysubmit').click();
  assert.equal(await page.locator('#review').isVisible(),true,name+': French review should open after submission');
  await page.locator('#bulletcoverage').selectOption('1');
  await page.locator('#rubrics select[data-mark="ao2"]').selectOption('15');
  assert.equal(await page.locator('#rubrics select[data-mark="ao2"]').inputValue(),'12',name+': one-bullet AO2 cap');
  await page.locator('#rubrics select[data-mark="range"]').selectOption('4');
  await page.locator('#rubrics select[data-mark="accuracy"]').selectOption('4');
  assert.match(await page.locator('#score').innerText(),/Practice self-mark: 20\/25/,name+': 12+4+4 self mark');
  await page.locator('#scoresave').click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#review').isVisible(),true,name+': completed French essay must persist on reload');
  assert.equal(await page.locator('#essay').inputValue(),essay,name+': French essay draft must persist');
  assert.match(await page.locator('#score').innerText(),/Practice self-mark: 20\/25/,name+': French rubric marks must persist');
  console.log(name+': French vocabulary, grammar, essay, rubric caps and saved state PASS');
  assert.deepEqual(problems,[],name+': runtime JavaScript errors');
  console.log(name+': upcoming tracker, dedicated links and Biology timed exam PASS');
 }finally{await browser.close()}
}
