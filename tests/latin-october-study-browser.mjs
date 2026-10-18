import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const bank=JSON.parse(fs.readFileSync('assessment/latin-oct17-20261017.json'));
const topics=JSON.parse(fs.readFileSync('content/catalog.json')).topics.filter(t=>t.sourceId==='latin-oct17-teaching-pack');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8778';
const server=process.env.QA_BASE_URL?null:spawn('python3',['-m','http.server','8778','--bind','127.0.0.1'],{stdio:'ignore'});
for(let i=0;i<60;i++){try{if((await fetch(base+'/content/catalog.json')).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
fs.mkdirSync('test-results/latin-study',{recursive:true});
try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1024,height:1366},hasTouch:true,isMobile:name==='webkit'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await ctx.addInitScript(topics=>{localStorage.setItem('lux-topic-learning-v1',JSON.stringify(Object.fromEntries(topics.map(t=>[t.topicId,true]))))},topics);
 await page.goto(base+'/study/latin/?q=October');await page.getByText('October lessons · Six topics',{exact:false}).first().waitFor({timeout:45000});
 for(const t of topics){const link=page.locator(`a[href*="/study/latin/practise?topic=${t.topicId}"]`);assert.equal(await link.count(),1)}
 await page.screenshot({path:`test-results/latin-study/${name}-topic-library.png`,fullPage:true});
 for(const t of topics){
  await page.goto(`${base}/study/latin/learn?year=9&topic=${t.topicId}`);await page.getByRole('heading',{name:t.title,exact:true}).waitFor({timeout:45000});
  await page.goto(`${base}/study/latin/practise?year=9&topic=${t.topicId}&mode=quick`);const question=page.locator('[data-question-id]').first();await question.waitFor({timeout:45000});
  const id=await question.getAttribute('data-question-id');const source=bank.questions.find(q=>q.id===id);assert(source);assert.equal('la-y9-oct17-'+source.topicId,t.topicId);
  const answer=question.locator('input:not([type=checkbox]),textarea').first();await answer.fill(source.modelAnswer);await question.getByRole('button',{name:'Submit',exact:true}).click();await question.getByText('Well done!',{exact:true}).waitFor();await question.getByText('Marking scheme',{exact:false}).first().waitFor();
  await page.reload();await page.locator('[data-question-id]').first().waitFor();assert.equal(await page.locator('[data-question-id]').first().getAttribute('data-question-id'),id);assert.match(await page.locator('[data-question-id]').innerText(),/Well done/);
 }
 const t=topics.find(t=>t.topicId.endsWith('-creusa'));
 await page.goto(`${base}/study/latin/practise?year=9&topic=${t.topicId}&mode=standard`);let question=page.locator('[data-question-id]').first();await question.waitFor({timeout:45000});
 // Standard and quick are distinct saved drafts. Open a fresh standard question for review.
 const id=await question.getAttribute('data-question-id');await question.locator('input:not([type=checkbox]),textarea').first().fill('Alternative wording needing rubric review');await question.getByRole('button',{name:'Submit',exact:true}).click();const review=page.locator('[data-latin-rubric-review]');await review.waitFor();assert.match(await review.innerText(),/not been marked wrong/);await review.locator('input[type=checkbox]').first().check();await review.getByRole('button',{name:'Confirm rubric review'}).click();assert.match(await page.locator('[data-question-id]').innerText(),/Self-assessed practice/);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:`test-results/latin-study/${name}-native-review.png`,fullPage:true});assert.deepEqual(errors,[]);console.log(`LATIN_NATIVE_STUDY_BROWSER_PASS ${name}: all 8 topic cards, Learn, native Practise, answers, rubrics, reload and review.`);await ctx.close();
 }finally{await browser.close()}
}}finally{server?.kill()}
