import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';

const root=process.cwd(), out='test-results/daily-keyboard-ipad';
fs.mkdirSync(out,{recursive:true});
const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
assert.ok(entry.includes("import('/assets/daily-keyboard-safe-20261020.js?v=1')"),
  'SPA entry must load keyboard guard on all navigation routes');
const ipad=fs.readFileSync('assets/ipad-experience-20261004.js','utf8');
assert.ok(ipad.includes("document.documentElement.classList.contains('lux-practice-keyboard-open')"),
  'legacy iPad desk must not park a keyboard-focused question');

const fixture=[
'<!doctype html><html lang="en"><head><meta charset="utf-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
'<style>body{margin:0;background:#f6f1e7} body.lux-desk{overflow:hidden}',
'.paper-wash>main{padding:20px 28px}.lux-practice-view{max-width:900px;margin:auto}',
'.rounded-xl.bg-card.p-5{min-height:470px;padding:30px;background:#fff;border:1px solid #bba;}',
'p.font-display.text-2xl{font-size:38px;font-weight:700;margin:24px 0}',
'.bg-sage{background:#f0eee6;padding:16px;font-size:20px}',
'form{display:flex;gap:12px;margin-top:20px}input{min-width:0;flex:1;font-size:20px;height:56px}',
'button{min-width:130px;font-size:18px} h1{font-size:32px}</style>',
'<script>window.sent=0</script>',
'<script defer src="/assets/daily-keyboard-safe-20261020.js"></script>',
'</head><body class="lux-desk"><div class="paper-wash">',
'<header style="height:70px">Old toolbar</header>',
'<main><div class="lux-practice-view"><div data-question-id="french-translate-1" data-question-format="typed_exact">',
'<div><h1 class="font-display text-3xl">French · Practice</h1><p>Question 8/15</p></div>',
'<div class="rounded-xl bg-card p-5"><div data-lux-question-card>',
'<p data-lux-prompt class="font-display text-2xl">Translate this sentence into French</p>',
'<p class="bg-sage">I am strong in music, but I do not understand anything in French.</p>',
'<form onsubmit="window.sent++;event.preventDefault()">',
'<input aria-label="Your answer" placeholder="Translate the quoted English into French" />',
'<button type="submit">Submit</button></form>',
'</div></div></div></div></main>',
'<nav class="fixed">Old navigation</nav></div></body></html>'
].join('');

const server=createServer((req,res)=>{
  try{
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.startsWith('/study/french/practise/')){
      res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(fixture);return;
    }
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep))throw Error('bad path');
    const data=fs.readFileSync(file);
    res.writeHead(200,{'content-type':pathname.endsWith('.css')?'text/css':'text/javascript',
      'cache-control':'no-store'});
    res.end(data);
  }catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port+'/study/french/practise/?daily=1';
let cases=0;
try{
  for (const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await launcher.launch({headless:true});
    try{
      for (const [w,h,kh] of [[1024,768,390],[1366,1024,510]]){
        const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:true});
        const page=await context.newPage();
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto(url,{waitUntil:'load'});
        await page.evaluate(()=>localStorage.setItem('lux-daily-existing-progress','saved-history'));
        const field=page.getByRole('textbox',{name:'Your answer'});
        await field.focus();
        await page.setViewportSize({width:w,height:kh});
        await page.waitForFunction(()=>document.documentElement.classList.contains('lux-practice-keyboard-open'));
        await page.waitForTimeout(650);
        const result=await page.evaluate(()=>{
          const rect=sel=>{const r=document.querySelector(sel).getBoundingClientRect();
            return {top:r.top,bottom:r.bottom}};
          return {
            overflow:getComputedStyle(document.body).overflowY,
            heading:getComputedStyle(document.querySelector('[data-question-id]>div:first-child')).display,
            prompt:rect('[data-lux-prompt]'),
            input:rect('input'),
            submit:rect('button[type="submit"]'),
            visible:visualViewport?.height||innerHeight,
            saved:localStorage.getItem('lux-daily-existing-progress')
          };
        });
        assert.equal(result.overflow,'auto',engine+' iPad keyboard must allow scrolling');
        assert.equal(result.heading,'none','hide redundant title only while keyboard is open');
        assert.equal(result.saved,'saved-history','saved progress must remain unchanged');
        assert.ok(result.prompt.top>=-2 && result.prompt.top<result.visible-40,
          engine+' question must remain visible when keyboard is up: '+JSON.stringify(result));
        assert.ok(result.input.bottom<=result.visible+3,
          engine+' input must remain above keyboard: '+JSON.stringify(result));
        assert.ok(result.submit.bottom<=result.visible+3,
          engine+' Submit must remain above keyboard: '+JSON.stringify(result));
        await field.fill('Je suis forte en musique');
        await page.getByRole('button',{name:'Submit'}).click();
        assert.equal(await page.evaluate(()=>window.sent),1,'original Submit handler preserved');
        await page.screenshot({path:path.join(out,engine+'-'+w+'x'+h+'-keyboard.png')});
        await page.evaluate(()=>document.activeElement.blur());
        await page.setViewportSize({width:w,height:h});
        await page.waitForFunction(()=>!document.documentElement.classList.contains('lux-practice-keyboard-open'));
        assert.deepEqual(errors,[],'no script errors in keyboard scenario');
        await context.close();
        cases++;
      }
    }finally{await browser.close()}
  }
  console.log('PASS: '+cases+' iPad landscape keyboard scenarios, 2 browser engines, stored progress and Submit checks');
}finally{await new Promise(done=>server.close(done))}
