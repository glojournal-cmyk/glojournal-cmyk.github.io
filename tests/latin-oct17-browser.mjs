import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const bank=JSON.parse(fs.readFileSync('assessment/latin-oct17-20261017.json'));
const external=process.env.QA_BASE_URL,base=external||'http://127.0.0.1:8776';
const server=external?null:spawn('python3',['-m','http.server','8776','--bind','127.0.0.1'],{stdio:'ignore'});
for(let i=0;i<60;i++){try{if((await fetch(base+'/assessment/latin-oct17-20261017.json')).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
fs.mkdirSync('test-results/latin-oct17',{recursive:true});
try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1024,height:1366},hasTouch:true,isMobile:name==='webkit'});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+'/assessment/latin-oct17/practice/');await page.locator('#settings').waitFor();assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgba(0, 0, 0, 0)');
 await page.screenshot({path:`test-results/latin-oct17/${name}-ipad.png`,fullPage:true});
 await page.selectOption('#topic','vocabulary');await page.selectOption('#size','5');await page.locator('#settings button').click();
 for(let i=0;i<5;i++){const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-latin-oct17-bank-v1')).ids[JSON.parse(localStorage.getItem('lux-latin-oct17-bank-v1')).index]);const q=bank.questions.find(q=>q.id===id);await page.fill('#answer',q.modelAnswer);if(i===0){await page.reload();await page.locator('#answer').waitFor();assert.equal(await page.inputValue('#answer'),q.modelAnswer)}await page.locator('#answer-form button').click();assert.match(await page.locator('.feedback').innerText(),/Model answer matched/);await page.locator('#next').click()}
 assert.match(await page.locator('#latin-bank-app').innerText(),/SET COMPLETE/);
 await page.selectOption('#topic','creusa');await page.selectOption('#size','5');await page.locator('#settings button').click();await page.fill('#answer','Wording requiring human review');await page.locator('#answer-form button').click();await page.locator('#confirm-review').waitFor();assert.match(await page.locator('.feedback').innerText(),/self-assessed score/);await page.locator('#confirm-review').click();assert.match(await page.locator('.score').innerText(),/Self-assessed/);
 await page.locator('#new-set').click();await page.selectOption('#topic','journey');await page.selectOption('#size','5');await page.selectOption('#mode','paper');await page.locator('#settings button').click();
 for(let i=0;i<5;i++){const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-latin-oct17-bank-v1')));const q=bank.questions.find(q=>q.id===state.ids[state.index]);assert.equal(await page.locator('.feedback').count(),0);await page.fill('#answer',q.modelAnswer);await page.locator('#paper-next').click()}
 for(let i=0;i<5;i++){await page.locator('.feedback').waitFor();await page.locator('#next').click()}
 assert.match(await page.locator('#latin-bank-app').innerText(),/SET COMPLETE/);
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#settings').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:`test-results/latin-oct17/${name}-mobile.png`,fullPage:true});
 await page.goto(base+'/study/latin/');await page.locator('a[href="/assessment/latin-oct17/practice/"]').first().waitFor({timeout:40000});
 assert.deepEqual(errors,[]);console.log('LATIN_OCT17_BROWSER_PASS '+name+' · reload, marking, self-review, hidden test answers, completion, mobile and Latin entry');await ctx.close();
 }finally{await browser.close()}
}}finally{server?.kill()}
