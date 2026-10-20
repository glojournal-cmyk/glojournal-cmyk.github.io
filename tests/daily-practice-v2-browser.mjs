import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium, webkit} from 'playwright';

const root=process.cwd(), out='test-results/daily-practice-v2';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml',
  '.jpg':'image/jpeg','.json':'application/json'};
const server=createServer((req,res)=>{
  try{
    let relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(relative.endsWith('/'))relative+='index.html';
    const target=path.resolve(root,'.'+relative);
    if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const file=fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
    const data=fs.readFileSync(file);
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  }catch{res.writeHead(404);res.end('Not Found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const report=[];
function fixture(kind){
  const long=kind==='long-mc';
  const choices=long?[
    'The cell membrane regulates movement of substances into and out of the cell and also distinguishes its interior from its surroundings.',
    'The ribosome is responsible for synthesising proteins and works in both prokaryotic and eukaryotic organisms.',
    'The nucleus contains chromosomes and controls the activity of cells, including the expression of many genes.',
    'The mitochondrion carries out aerobic respiration to supply energy for cell processes.'
  ]:['Ribosome','Nucleus','Cell membrane','Mitochondrion'];
  const answers=kind.endsWith('mc')?
    '<div class="mt-5 grid gap-2">'+choices.map((s,i)=>
      '<button type="button" onclick="window.tapCount++" class="min-h-12 rounded-lg border px-4 py-3 text-left text-sm">'+
      String.fromCharCode(65+i)+'. '+s+'</button>').join('')+'</div>':
    kind==='tiles'?
    '<div class="mt-5 space-y-3"><div class="flex min-h-12 flex-wrap gap-2 rounded-lg bg-sage/50 p-3">Tap tiles to build the answer</div><div class="flex flex-wrap gap-2">'+
    'quinze'.split('').map(letter=>'<button type="button" onclick="window.tapCount++">'+letter+'</button>').join('')+
    '</div><button type="button" onclick="window.tapCount++">Submit</button></div>':
    '<form class="mt-5 flex gap-2"><input placeholder="Type the answer" aria-label="Your answer"><button type="submit">Submit</button></form>';
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="/assets/styles-CEE1o_78.css">'+
    '<link rel="stylesheet" href="/assets/daily-practice-ux-v2-20261020.css">'+
    '<script>window.tapCount=0;</script><script defer src="/assets/daily-practice-layout-20261020.js"></script></head>'+
    '<body><div class="paper-wash"><header style="height:58px">Legacy top bar</header><aside style="height:400px">Sidebar</aside>'+
    '<main><section id="study-companion" class="cx-study-buddy"><span class="cx-pet-art"></span><strong>Antler Bean is beside you</strong></section>'+
    '<div class="lux-practice-view"><header><h1>French · Practise</h1></header>'+
    '<div data-question-id="fixture-'+kind+'" data-question-format="'+(kind.endsWith('mc')?'mc_single':kind==='tiles'?'word_tiles':'typed')+'" class="space-y-4">'+
    '<div><p class="text-xs font-semibold">DAILY PRACTICE</p><h1 class="font-display text-3xl font-semibold">French · Numbers and age</h1>'+
    '<p>Question 1 / 15</p><p class="rounded-lg bg-sage">Recall · Step 2</p></div>'+
    '<div class="rounded-xl bg-card p-5 sm:p-6"><div><p>BUILD THE ANSWER</p>'+
    '<p class="mt-1 font-display text-2xl font-semibold leading-snug">How do you write 15 in French?</p>'+answers+'</div></div>'+
    '</div></div></main><nav class="fixed inset-x-3 bottom-3" style="height:45px">Old nav</nav></div></body></html>';
}
async function checkFixture(browser,engine,kind,viewport){
  const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/study/french/practise/**',route=>{
    if(new URL(route.request().url()).searchParams.has('fixture'))return route.fulfill({status:200,contentType:'text/html',body:fixture(kind)});
    return route.continue();
  });
  await page.goto(base+'/study/french/practise/?fixture='+kind,{waitUntil:'load'});
  await page.waitForFunction(()=>document.documentElement.classList.contains('lux-daily-ux-ready'),null,{timeout:12000});
  await page.waitForSelector('[data-lux-question-card]');
  const details=await page.evaluate(()=>{
    const card=document.querySelector('[data-lux-question-card]');
    const prompt=document.querySelector('[data-lux-prompt]');
    const nav=document.querySelector('#lux-daily-study-nav');
    const opts=document.querySelector('[data-lux-mc-options]');
    const input=document.querySelector('[data-lux-question-card] input');
    const elbox=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
    return {
      width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
      headerHidden:getComputedStyle(document.querySelector('.paper-wash>header')).display==='none',
      navLabels:[...nav.querySelectorAll('a')].map(a=>a.textContent),
      navCurrent:nav.querySelector('[aria-current="page"]')?.textContent,
      promptWeight:getComputedStyle(prompt).fontWeight,promptSize:parseFloat(getComputedStyle(prompt).fontSize),
      card:elbox(card),prompt:elbox(prompt),nav:elbox(nav),
      optsColumns:opts?getComputedStyle(opts).gridTemplateColumns.split(' ').length:0,
      options:opts?[...opts.children].map(elbox):[],
      input:elbox(input),pet:elbox(document.querySelector('#study-companion')),
      decorativeBackground:getComputedStyle(document.querySelector('.paper-wash')).backgroundImage,
      tileButton:elbox(document.querySelector('[data-lux-tiles] > div:nth-child(2) button')),
      tileInk:(()=>{const btn=document.querySelector('[data-lux-tiles] > div:nth-child(2) button');return btn?getComputedStyle(btn).color:null})(),
      submitButton:(()=>{const btn=document.querySelector('[data-lux-tiles] > button:last-child');return btn?{...elbox(btn),background:getComputedStyle(btn).backgroundColor,color:getComputedStyle(btn).color}:null})(),
      outerCard:(()=>{const p=card?.parentElement;return p?{padding:getComputedStyle(p).padding,border:getComputedStyle(p).borderWidth}:null})()
    };
  });
  assert.equal(details.headerHidden,true,'top bar should be hidden');
  assert.deepEqual(details.navLabels,['⌂Home','▣Study','◇Play','♧Garden','♧Pet','▤Assessment','✎Scholar']);
  assert.match(details.navCurrent,/Study/);
  assert.ok(Number(details.promptWeight)>=700,'prompt must be bold');
  assert.ok(details.promptSize>=27,'question must be large');
  assert.ok(details.scrollWidth<=viewport.width+1,'no horizontal overflow');
  assert.ok(details.pet.width>=38 && details.pet.width<=210,'pet artwork must be visible but compact');
  assert.ok(details.decorativeBackground.includes('daily-practice-botanical-frame'),'decorative frame must be present');
  if(kind==='tiles'){
    assert.equal(details.tileInk,'rgb(255, 249, 238)','letter tile needs light readable text');
    assert.ok(details.submitButton?.width>=160,'tile answer action needs prominent button');
    assert.ok(details.submitButton.y<=details.tileButton.y+20,'answer button must line up with tiles');
  }
  if(kind.endsWith('mc')){
    assert.equal(details.optsColumns,kind==='long-mc'?1:2,'MC columns should follow answer length');
    await page.locator('[data-lux-mc-options] button').first().click();
    assert.equal(await page.evaluate(()=>window.tapCount),1,'native MC click event preserved');
  }
  if(kind==='typed'){
    await page.locator('[data-lux-question-card] input').fill('quinze');
    assert.equal(await page.locator('[data-lux-question-card] input').inputValue(),'quinze');
    assert.equal(await page.locator('#lux-daily-study-nav').isVisible(),false,'nav must hide on focus');
    await page.locator('[data-lux-question-card] input').blur();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('lux-daily-typing'));
    assert.equal(await page.locator('#lux-daily-study-nav').isVisible(),true,'nav restored after typing');
  }
  if(kind==='tiles'){
    await page.locator('[data-question-format="word_tiles"] .mt-5.space-y-3 > div:nth-child(2) button').first().click();
    assert.equal(await page.evaluate(()=>window.tapCount),1,'tile click event preserved');
  }
  assert.deepEqual(errors,[],'fixture must not raise JS errors');
  await page.screenshot({path:path.join(out,engine+'-'+kind+'-'+viewport.width+'x'+viewport.height+'.png'),fullPage:true});
  report.push({engine,kind,viewport,details,errors,ok:true});
  await context.close();
}
async function checkRealPractice(browser,engine){
  const context=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:2,hasTouch:true,timezoneId:'Europe/London'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const url=base+'/study/french/practise/?year=8&mode=quick&topic=fr-y8-s01-quick-rules';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('.lux-practice-view [data-question-id]',{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.classList.contains('lux-daily-ux-ready'),null,{timeout:10000});
  const before=await page.evaluate(()=>{
    const q=document.querySelector('[data-question-id]');
    const nav=document.querySelector('#lux-daily-study-nav');
    const p=q?.querySelector('[data-lux-prompt]');
    return {id:q?.dataset.questionId,format:q?.dataset.questionFormat,
      navCount:nav?.children.length,
      promptSize:p?parseFloat(getComputedStyle(p).fontSize):0,
      navBottom:nav?.getBoundingClientRect().bottom,
      screenHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth};
  });
  assert.ok(before.id,'real French question must load');
  assert.equal(before.navCount,7,'live question needs Study navigation');
  assert.ok(before.promptSize>=27,'real question should be large and bold');
  assert.ok(before.scrollWidth<=1025,'no sideways scroll in live question');
  await page.screenshot({path:path.join(out,engine+'-real-french-before.png'),fullPage:true});
  const q=page.locator('[data-question-id]');
  if(before.format==='mc_single'){
    const options=q.locator('[data-lux-mc-options] > button');
    assert.ok(await options.count()>=2,'real MC choices available');
    await options.first().click();
  } else if(before.format==='word_tiles'){
    const tile=q.locator('.mt-5.space-y-3 > div:nth-child(2) button').first();
    await tile.click();
    await q.getByRole('button',{name:'Submit'}).click();
  } else {
    const field=q.locator('input,textarea').first();
    await field.fill('sample test answer');
    assert.equal(await page.locator('#lux-daily-study-nav').isVisible(),false);
    await q.getByRole('button',{name:'Submit'}).click();
  }
  await page.waitForTimeout(700);
  const marked=await page.evaluate(()=>{
    const q=document.querySelector('[data-question-id]');
    return {id:q?.dataset.questionId,
      text:q?.innerText.slice(-1700),
      feedback:!!q?.querySelector('.bg-blush,.bg-sage,button:disabled')};
  });
  assert.ok(marked.id,'answering must not remove the quiz');
  assert.ok(marked.text.length>40,'feedback and live question must remain readable');
  await page.screenshot({path:path.join(out,engine+'-real-french-after.png'),fullPage:true});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(6000);
  const restoreDiagnostic=await page.evaluate(()=>({
    location:location.href,ready:window.__luxAppReady,
    title:document.title,
    body:document.body.innerText.slice(0,1800),
    questionCount:document.querySelectorAll('[data-question-id]').length,
    active:document.documentElement.classList.contains('lux-daily-ux-ready'),
    main:document.querySelector('main')?.innerText.slice(0,1800),
    year:window.__luxStore?.getState?.().year,
    storageKeys:Object.keys(localStorage).filter(k=>/draft|progress|lux/.test(k)).slice(0,25),
    errors:document.querySelector('#lux-loading-recovery')?.innerText
  }));
  console.log('DAILY_REAL_RESUME_DIAGNOSTIC '+JSON.stringify({engine,restoreDiagnostic,errors}));
  await page.screenshot({path:path.join(out,engine+'-real-french-reload.png'),fullPage:true});
  await page.waitForSelector('.lux-practice-view [data-question-id]',{timeout:16000});
  assert.equal(await page.locator('#lux-daily-study-nav a').count(),7,'reload must restore Study nav');
  await page.goto(url+'&dailyUxPreview=0',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.lux-practice-view [data-question-id]',{timeout:30000});
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('lux-daily-ux-ready')),false,'rollback query disables layout');
  report.push({engine,kind:'real-french',before,marked,errors,ok:true});
  await context.close();
}
try{
  for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await launcher.launch({headless:true});
    try{
      for(const size of [{width:1024,height:768},{width:1366,height:1024}]){
        for(const kind of ['mc','long-mc','typed','tiles']) await checkFixture(browser,engine,kind,size);
      }
      await checkRealPractice(browser,engine);
    }finally{await browser.close();}
  }
}finally{
  server.close();
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
}
console.log('DAILY_PRACTICE_V2_QA '+JSON.stringify({scenarios:report.length,engines:['chromium','webkit'],viewports:['1024x768','1366x1024'],formats:['MC','long-MC','typed','tiles']}));
