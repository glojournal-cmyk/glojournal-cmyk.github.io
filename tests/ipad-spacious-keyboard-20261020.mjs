import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';

const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
const ipad=fs.readFileSync('assets/ipad-experience-20261004.js','utf8');
const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
assert.ok(css.includes('iPad spacious answer stage: keyboard-visible'),'large keyboard stage should exist');
assert.ok(!entry.includes("import('/assets/daily-keyboard-safe-20261020.js"),
 'old oscillating helper must not be re-enabled');
assert.ok(ipad.includes("e.matches?.('input,textarea')&&e.closest?.('.lux-practice-view [data-question-id]')"),
 'old keepVisible must not programmatically scroll the active practice editor');
assert.ok(ipad.includes("active?.matches?.('input,textarea')&&active?.closest?.('.lux-practice-view [data-question-id]')"),
 'old page parking must yield to the active answer');
const savedState='{"state":{"xp":2735,"daily":[{"id":"french-vocab","correct":28}]}}';
const html=[
'<!doctype html><html class="lux-daily-ux-ready lux-daily-task-active"><head>',
'<meta name="viewport" content="width=device-width, initial-scale=1">',
'<link rel="stylesheet" href="/assets/daily-practice-ux-v2-20261020.css">',
'<style>body{margin:0}body.lux-desk{overflow:hidden}',
'.paper-wash > main{padding:15px}.lux-practice-view{width:100%}',
'form{display:flex;gap:10px;margin-top:12px}button{cursor:pointer}',
'input{min-width:0;flex:1} .notice{padding:4px 10px}</style></head>',
'<body class="lux-desk"><div class="paper-wash"><main>',
'<div class="lux-practice-view"><div data-question-id="french-sample" data-question-format="typed_exact">',
'<div data-lux-question-intro><h1>French · Food, drink and restaurants</h1><p>Question 14 / 30</p></div>',
'<p class="notice" role="alert">Could not save this practice on this device. Keep this page open to retain your answer.</p>',
'<div data-lux-review-progress>Last seen revision</div>',
'<div class="rounded-xl bg-card p-5"><div data-lux-question-card>',
'<p>RESTORE THE SPELLING</p>',
'<p data-lux-prompt class="font-display text-2xl">Restore the complete French spelling for “What do you drink?” in Food, drink and restaurants.</p>',
'<p class="bg-sage">What do you drink? — Qu’est-ce que tu bois ?</p>',
'<form onsubmit="event.preventDefault();window.submissions=(window.submissions||0)+1">',
'<input aria-label="Answer" placeholder="Restore the French spelling" />',
'<button type="submit">Submit</button></form>',
'</div></div></div></div></main><nav class="lux-daily-study-nav">Navigation</nav></div>',
'<script>localStorage.setItem("lux-scholar-garden-v1",',
JSON.stringify(savedState),');window.submissions=0;</script>',
'</body></html>'
].join('');
const root=process.cwd(),out='test-results/ipad-spacious-keyboard-20261020';
fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.startsWith('/study/french/practise/')){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;
 }
 try{
  const f=path.resolve(root,'.'+pathname);
  if(!f.startsWith(root+path.sep))throw Error('outside root');
  res.writeHead(200,{'content-type':'text/css; charset=utf-8'});res.end(fs.readFileSync(f));
 }catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/study/french/practise/';
let passes=0;
try{
 for(const [engine,launch] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launch.launch({headless:true});
  try{
   for(const [width,full,visible] of [[1024,768,420],[1366,1024,610]]){
    const context=await browser.newContext({viewport:{width,height:full},deviceScaleFactor:2,hasTouch:true});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    const measure=()=>page.evaluate(()=>{
     const get=(selector)=>{
       const e=document.querySelector(selector);const r=e.getBoundingClientRect();
       return {top:r.top,bottom:r.bottom,height:r.height,font:parseFloat(getComputedStyle(e).fontSize),display:getComputedStyle(e).display}
     };
     return {
       card:get('[data-lux-question-card]'),
       question:get('[data-lux-prompt]'),
       input:get('input'),
       submit:get('button[type=submit]'),
       notice:get('[role=alert]'),
       intro:get('[data-lux-question-intro]'),
       scrollY,
       bodyOverflow:getComputedStyle(document.body).overflowY
     };
    });
    const baseline=await measure();
    await page.getByRole('textbox',{name:'Answer'}).focus();
    await page.setViewportSize({width,height:visible});
    await page.waitForTimeout(160);
    const after=await measure();
    assert.equal(after.intro.display,'none','nonessential top intro hides while typing');
    assert.equal(after.bodyOverflow,'auto','text questions allow manual scroll');
    assert.ok(after.question.font>=32,'large question font must not shrink: '+after.question.font);
    assert.ok(after.input.height>=60 && after.submit.height>=60,'input and Submit remain comfortable tap targets');
    assert.ok(after.card.height>=280,'give upper screen to question, do not collapse card');
    assert.ok(after.question.top>=0 && after.question.bottom<visible-60,'prompt must be legible above keyboard: '+JSON.stringify(after));
    assert.ok(after.input.bottom<=visible+3&&after.submit.bottom<=visible+3,
     'text and Submit both remain above on-screen keyboard: '+JSON.stringify(after));
    assert.ok(after.notice.display!=='none','never hide unsaved progress warning');
    for(let j=0;j<3;j++){
     await page.setViewportSize({width,height:visible+2});
     await page.setViewportSize({width,height:visible});
    }
    await page.waitForTimeout(200);
    const repeat=await measure();
    assert.ok(Math.abs(repeat.scrollY-after.scrollY)<=3,'no auto-scroll jitter: '+JSON.stringify({after,repeat}));
    await page.getByRole('textbox',{name:'Answer'}).fill('Qu’est-ce que tu bois ?');
    await page.getByRole('button',{name:'Submit'}).click();
    assert.equal(await page.evaluate(()=>window.submissions),1,'Submit still executes native callback');
    assert.equal(await page.evaluate(()=>localStorage.getItem('lux-scholar-garden-v1')),savedState,
      'saved student progress must stay untouched');
    await page.evaluate(()=>document.activeElement.blur());
    await page.setViewportSize({width,height:full});
    const restored=await measure();
    assert.notEqual(restored.intro.display,'none','normal card and Study view restored after keyboard dismissal');
    assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(out,engine+'-'+width+'x'+full+'.png')});
    await context.close();passes++;
   }
  }finally{await browser.close()}
 }
 console.log('PASS '+passes+' spacious iPad Daily typed answer checks in Chromium and WebKit');
}finally{await new Promise(resolve=>server.close(resolve))}
