import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';

const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
const ipad=fs.readFileSync('assets/ipad-experience-20261004.js','utf8');
const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
assert.ok(css.includes('html.lux-daily-typing .lux-daily-study-nav') &&
 css.includes('html.lux-daily-ux-ready [data-lux-question-card]'),
 'CSS-only typing layout and nav concealment are missing');
assert.ok(ipad.includes("document.activeElement?.matches?.('.lux-practice-view [data-question-id] input"),
 'legacy iPad scroll parking must not compete with text input');
assert.ok(!entry.includes("import('/assets/daily-keyboard-safe-20261020.js"),'oscillating helper is still loaded');
const root=process.cwd(), dir='test-results/ipad-css-keyboard-20261020';
fs.mkdirSync(dir,{recursive:true});
const fixture=[
'<!doctype html><html class="lux-daily-ux-ready lux-daily-task-active"><head>',
'<meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8">',
'<link rel="stylesheet" href="/assets/daily-practice-ux-v2-20261020.css">',
'<style>body{margin:0}body.lux-desk{overflow:hidden}.paper-wash>main{padding:20px}',
'.lux-practice-view{width:100%;margin:auto}input{font-size:18px;min-width:0}',
'form{display:flex;gap:8px;margin-top:16px}</style></head>',
'<body class="lux-desk"><div class="paper-wash"><header>Legacy header</header><main>',
'<div class="lux-practice-view"><div data-question-id="trans-1" data-question-format="typed_exact">',
'<div data-lux-question-intro><p>Daily Practice</p><h1>French · Holidays</h1><p>Question 8 / 15</p></div>',
'<div data-lux-daily-lock>Locked to today task</div>',
'<div class="rounded-xl bg-card p-5"><div data-lux-question-card>',
'<p>ENGLISH TO FRENCH</p><p data-lux-prompt class="font-display text-2xl">',
'Translate this English sentence into French.</p>',
'<p class="bg-sage">I am strong in music, but I do not understand anything in French.</p>',
'<form onsubmit="event.preventDefault();window.submitted++">',
'<input aria-label="French translation" placeholder="Translate the quoted English into French.">',
'<button type="submit">Submit</button></form></div></div></div></div></main>',
'<nav class="lux-daily-study-nav">Navigation</nav></div>',
'<script>window.submitted=0</script></body></html>'
].join('');
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.startsWith('/study/french/practise/')){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(fixture);return;
 }
 try{
  const f=path.resolve(root,'.'+pathname);
  if(!f.startsWith(root+path.sep))throw Error('invalid');
  res.writeHead(200,{'content-type':'text/css; charset=utf-8'});res.end(fs.readFileSync(f));
 }catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/study/french/practise/?daily=1';
let checks=0;
try{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch({headless:true});
  try{
   for(const [width,height,shortHeight] of [[1024,768,420],[1366,1024,540]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,deviceScaleFactor:2});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'load'});
    const field=page.getByRole('textbox',{name:'French translation'});
    const get=()=>page.evaluate(()=>{
     const box=s=>{const r=document.querySelector(s).getBoundingClientRect();
       return {top:r.top,bottom:r.bottom,height:r.height}};
     return {intro:getComputedStyle(document.querySelector('[data-lux-question-intro]')).display,
      card:box('[data-lux-question-card]'),prompt:box('[data-lux-prompt]'),
      field:box('input'),submit:box('button[type=submit]'),
      overflow:getComputedStyle(document.body).overflowY,
      scrollY,screen:window.innerHeight,
      nav:getComputedStyle(document.querySelector('.lux-daily-study-nav')).display};
    });
    const before=await get();
    assert.notEqual(before.intro,'none');
    await field.focus();
    await page.setViewportSize({width,height:shortHeight});
    await page.waitForTimeout(450);
    const focused=await get();
    assert.equal(focused.intro,'none','title must collapse while typing');
    assert.equal(focused.nav,'none','floating navigation must hide');
    assert.equal(focused.overflow,'auto','browser scrolling must remain available');
    assert.ok(focused.card.height<before.card.height,'card must shrink: '+JSON.stringify({before,focused}));
    assert.ok(focused.prompt.top>=-5 && focused.prompt.top<shortHeight,'prompt obscured: '+JSON.stringify(focused));
    assert.ok(focused.field.bottom<=shortHeight+5 && focused.submit.bottom<=shortHeight+5,
      'editor or Submit obscured: '+JSON.stringify(focused));
    const scrollY=focused.scrollY;
    for(let i=0;i<3;i++){
      await page.setViewportSize({width,height:shortHeight+3});
      await page.setViewportSize({width,height:shortHeight});
    }
    await page.waitForTimeout(300);
    const repeated=await get();
    assert.ok(Math.abs(repeated.scrollY-scrollY)<=3,'scroll jitter: '+JSON.stringify({scrollY,repeated}));
    await field.fill('Je suis forte en musique');
    await page.getByRole('button',{name:'Submit'}).click();
    assert.equal(await page.evaluate(()=>window.submitted),1,'original submit callback preserved');
    await page.screenshot({path:path.join(dir,engine+'-'+width+'x'+height+'.png')});
    await page.evaluate(()=>document.activeElement?.blur());
    await page.setViewportSize({width,height});
    const after=await get();
    assert.notEqual(after.intro,'none','standard layout must return on blur');
    assert.deepEqual(errors,[]);
    await context.close();checks++;
   }
  }finally{await browser.close()}
 }
 console.log('PASS '+checks+' iPad Chromium/WebKit CSS-only keyboard layout checks');
}finally{await new Promise(resolve=>server.close(resolve))}
