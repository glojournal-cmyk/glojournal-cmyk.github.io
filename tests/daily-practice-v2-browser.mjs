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
const RELEASE='studio-shell-stable3';
const RUNTIME_RELEASE='20261024-gloria-display11';
const UNIFIED_THEME='gloria-unified-question-theme-20261024.css?v=20261024-progress2';
const FINAL_THEME='gloria-practice-mockup-final-20261024.css?v=20261024-gloria-display11';
const entrypoint = fs.readFileSync('index.html','utf8').match(/\/assets\/index-BLVOhKhN\.js\?v=[^"']+/)?.[0];
assert.ok(entrypoint, 'Home must expose the globally synchronized app entrypoint');
for (const subject of ['french','latin','biology','chemistry','physics','english']) {
  const html=fs.readFileSync('study/'+subject+'/practise/index.html','utf8');
  assert.ok(html.includes('practice-studio-20261023.js?v='+RUNTIME_RELEASE),
    subject+' Practice must use the new Safari-cached runtime');
  assert.ok(html.includes('practice-studio-20261023.css?v='+RELEASE),
    subject+' Practice must use the new Safari-cached stylesheet');
  assert.ok(html.includes(UNIFIED_THEME),
    subject+' Practice must load the unified navy-gold question stylesheet');
  assert.ok(html.includes(FINAL_THEME),
    subject+' Practice must load the approved illustrated question layout');
  assert.ok(html.includes(entrypoint),
    subject+' Practice must keep the globally synchronized app entrypoint');
}

function fixture(kind){
  const long=kind==='long-mc';
  const vocab=kind==='vocab-mc';
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
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="/assets/styles-CEE1o_78.css">'+
    '<link rel="stylesheet" href="/assets/practice-studio-20261023.css">'+
    '<link rel="stylesheet" href="/assets/gloria-unified-question-theme-20261024.css?v=20261024-progress2">'+
    '<link rel="stylesheet" href="/assets/gloria-practice-mockup-final-20261024.css?v=20261024-gloria-display11">'+
    '<script>window.tapCount=0;</script><script defer src="/assets/practice-studio-20261023.js"></script><script defer src="/lux-theme.js"></script></head>'+
    '<body><div class="paper-wash"><header style="height:58px">Legacy top bar</header><aside style="height:400px">Sidebar</aside>'+
    '<main><section id="study-companion" class="cx-study-buddy"><span class="cx-pet-art" aria-label="Antler Bean" style="display:block;background-image:url(\'/pet/art-hd-20261009/level-1/antler-bean.webp\');background-size:contain;background-position:center;background-repeat:no-repeat"></span><strong>Antler Bean is beside you</strong><button type="button" id="lux-voice-cheer-toggle" onclick="window.tapCount++">🔊 Voice On</button></section>'+
    '<div class="lux-practice-view"><header><h1>French · Practise</h1></header>'+
    '<div data-question-id="fixture-'+kind+'" data-question-format="'+(kind.endsWith('mc')?'mc_single':kind==='tiles'?'word_tiles':'typed')+'" class="space-y-4">'+
    '<div><p class="text-xs font-semibold">DAILY PRACTICE</p><h1 class="font-display text-3xl font-semibold">French · Numbers and age</h1>'+
    '<p>Question 1 / 15 · Recall · Step 2</p><p class="rounded-lg bg-sage">Recall · Step 2</p></div>'+
    '<div data-lux-daily-lock>This daily task is locked to Numbers and age. Finish the assigned set before choosing free practice.</div>'+
    '<div class="rounded-xl bg-card p-5 sm:p-6"><div><p>'+(vocab?'CHOOSE THE ANSWER':'BUILD THE ANSWER')+'</p>'+
    '<p class="mt-1 font-display text-2xl font-semibold leading-snug">'+(vocab?'Which English meaning is required for “est” in Stage 1 vocabulary?':'How do you write 15 in French?')+'</p>'+
    (vocab?'<p class="mt-2 rounded-lg bg-sage/60 px-3 py-2 text-sm">est</p>':'')+answers+'</div></div>'+
    '</div></div></main><nav class="fixed inset-x-3 bottom-3" style="height:45px">Old nav</nav></div></body></html>';
}
function vocabVisualCase(kind){return kind==='vocab-mc';}
async function checkFixture(browser,engine,kind,viewport){
  const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/study/french/practise/**',route=>{
    if(new URL(route.request().url()).searchParams.has('fixture'))return route.fulfill({status:200,contentType:'text/html',body:fixture(kind)});
    return route.continue();
  });
  await page.goto(base+'/study/french/practise/?daily=1&fixture='+kind,{waitUntil:'load'});
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
      voice:elbox(document.querySelector('#lux-voice-cheer-toggle')),
      lock:elbox(document.querySelector('[data-lux-daily-lock]')),
      decorativeBackground:getComputedStyle(document.querySelector('.paper-wash')).backgroundImage,
      tileButton:elbox(document.querySelector('[data-lux-tiles] > div:nth-child(2) button')),
      tileInk:(()=>{const btn=document.querySelector('[data-lux-tiles] > div:nth-child(2) button');return btn?getComputedStyle(btn).color:null})(),
      submitButton:(()=>{const btn=document.querySelector('[data-lux-tiles] > button:last-child');return btn?{...elbox(btn),background:getComputedStyle(btn).backgroundColor,color:getComputedStyle(btn).color}:null})(),
      outerCard:(()=>{const p=card?.parentElement;return p?{padding:getComputedStyle(p).padding,border:getComputedStyle(p).borderWidth}:null})()
    };
  });
  // Safari can paint a newly mounted React question before our rAF decorator
  // installs data-lux-* markers. Its appearance must ALREADY equal the final
  // v2 design, or the learner sees old/new/old layout on every Next.
  const undecorated=await page.evaluate(()=>{
    const q=document.querySelector('.lux-practice-view [data-question-id]');
    const intro=q.querySelector('[data-lux-question-intro]');
    const card=q.querySelector('[data-lux-question-card]');
    const prompt=q.querySelector('[data-lux-prompt]');
    const choices=q.querySelector('[data-lux-mc-options]');
    const tiles=q.querySelector('[data-lux-tiles]');
    const capture=()=>({
      introMinHeight:getComputedStyle(intro).minHeight,
      headingSize:getComputedStyle(intro.querySelector('h1')).fontSize,
      cardMinHeight:getComputedStyle(card).minHeight,
      cardPadding:getComputedStyle(card).padding,
      cardBorder:getComputedStyle(card).borderColor,
      promptFont:getComputedStyle(prompt).fontSize,
      promptColour:getComputedStyle(prompt).color,
      optionsDisplay:choices?getComputedStyle(choices).display:null,
      optionsColumns:choices?getComputedStyle(choices).gridTemplateColumns:null,
      tileDisplay:tiles?getComputedStyle(tiles).display:null
    });
    const decorated=capture();
    intro.removeAttribute('data-lux-question-intro');
    card.removeAttribute('data-lux-question-card');
    prompt.removeAttribute('data-lux-prompt');
    choices?.removeAttribute('data-lux-mc-options');
    tiles?.removeAttribute('data-lux-tiles');
    // Synchronous style read BEFORE a MutationObserver + animation frame.
    const plainReact=capture();
    return {decorated,plainReact};
  });
  const cssDiagnostic=await page.evaluate(()=>({
    finalLinks:[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>({href:x.getAttribute('href'),loaded:!!x.sheet}))
      .filter(x=>/practice-studio|gloria-unified|gloria-practice-mockup/.test(x.href||'')),
    active:document.documentElement.className,
    matchesQuestion:document.documentElement.matches(':has(.lux-practice-view [data-question-id])'),
    selectedCard:document.querySelector('.lux-practice-view [data-question-id] .rounded-xl.bg-card.p-5 > div')?.className,
    finalStylesheetRules:[...document.styleSheets].filter(x=>x.href?.includes('gloria-practice-mockup')).map(x=>{
      try{return {href:x.href,rules:x.cssRules.length}}catch(e){return {error:String(e)}}
    })
  }));
  console.log('GLORIA_STYLE_LOAD_DIAGNOSTIC '+JSON.stringify({engine,kind,viewport,cssDiagnostic,undecorated}));
  if(!vocabVisualCase(kind)) assert.deepEqual(undecorated.plainReact,undecorated.decorated,
    'iPad must render the same question text before React decoration: '+JSON.stringify(undecorated));
  const styleVersion=await page.evaluate(()=>document.getElementById('lux-daily-practice-ux-v2-style')?.getAttribute('href'));
  assert.ok(new URL(styleVersion, base).searchParams.get('v') === RELEASE,
    'Home SPA stylesheet must not load the stale Safari preview1 cached version');

  // Simulate React briefly removing a question while replacing answer/feedback.
  // During this handoff neither the page theme nor the same seven-link rail may blink.
  const handoff=await page.evaluate(async()=>{
    const root=document.documentElement;
    const oldNav=document.querySelector('#lux-daily-study-nav');
    const q=document.querySelector('.lux-practice-view [data-question-id]');
    const parent=q.parentNode,next=q.nextSibling;
    q.remove();
    await new Promise(resolve=>setTimeout(resolve,210));
    const stable=root.classList.contains('lux-daily-ux-ready') && oldNav.isConnected &&
      oldNav===document.querySelector('#lux-daily-study-nav');
    parent.insertBefore(q,next);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {stable,restored:root.classList.contains('lux-daily-ux-ready'),links:oldNav.querySelectorAll('a').length};
  });
  assert.equal(handoff.stable,true,'transient React question handoff must not flash the whole page or remount nav');
  assert.equal(handoff.restored,true,'question view styling must remain active after handoff');
  assert.equal(handoff.links,7,'handoff must preserve all seven navigation destinations');
  // Ensure feedback / results do not remount the classic UI before Next.
  if (kind==='mc' && viewport.width===1024) {
    const stable=await page.evaluate(async()=>{
      const q=document.querySelector('.lux-practice-view [data-question-id]');
      const nav=document.querySelector('#lux-daily-study-nav');
      const result=document.createElement('section');
      result.setAttribute('aria-label','Session result');
      result.textContent='Session complete. Continue to next task.';
      q.replaceWith(result);
      await new Promise(resolve=>setTimeout(resolve,220));
      const during=document.documentElement.classList.contains('lux-daily-ux-ready') &&
        document.documentElement.classList.contains('lux-daily-task-active') &&
        nav?.isConnected && document.querySelector('#lux-daily-study-nav')===nav;
      result.replaceWith(q);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const after=document.documentElement.classList.contains('lux-daily-ux-ready') &&
        document.querySelector('#lux-daily-study-nav')===nav;
      document.documentElement.classList.remove('lux-daily-ux-ready');
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const recovered=document.documentElement.classList.contains('lux-daily-ux-ready');
      return {during,after,recovered};
    });
    assert.deepEqual(stable,{during:true,after:true,recovered:true},
      'iPad Daily Studio must remain modern from result to Next and after html class hydration');
  }

  // The previous 1.2 second timeout restored the LEGACY shell between slower
  // WebKit question loads. Exercise a gap beyond that threshold.
  if (kind==='mc' && viewport.width===1024) {
    const slowHandoff=await page.evaluate(async()=>{
      const q=document.querySelector('.lux-practice-view [data-question-id]');
      const parent=q.parentNode,nav=document.getElementById('lux-daily-study-nav');
      q.remove();
      await new Promise(resolve=>setTimeout(resolve,1750));
      const stable=document.documentElement.classList.contains('lux-daily-ux-ready')
        && nav?.isConnected && nav===document.getElementById('lux-daily-study-nav');
      parent.append(q);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      return {stable,restored:document.documentElement.classList.contains('lux-daily-ux-ready')};
    });
    assert.equal(slowHandoff.stable,true,'quiz shell and nav must survive multi-second question handoff');
    assert.equal(slowHandoff.restored,true,'quiz styling must survive slower iPad question loading');
    assert.equal(await page.locator('[data-lux-tool="days"]').count(),0,
      'legacy global theme must not inject home toolbar into a live quiz');
  }

  assert.equal(details.headerHidden,true,'top bar should be hidden');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('lux-daily-task-active')),true,'assigned Daily label must activate');
  assert.equal(await page.locator('[data-lux-question-intro] > p:first-child').evaluate(el=>getComputedStyle(el,'::before').content),'"DAILY PRACTICE"','approved label is displayed');
  assert.deepEqual(details.navLabels,['⌂Home','▣Study','◇Play','♧Garden','♧Pet','▤Assessment','✎Scholar']);
  assert.match(details.navCurrent,/Study/);
  if(kind==='vocab-mc'){
    await page.waitForFunction(()=>document.querySelector('[data-question-id]')?.dataset.gloriaQuestionLayout==='target');
    const hierarchy=await page.evaluate(()=>{
      const w=document.querySelector('[data-gloria-target-word]'),p=document.querySelector('[data-gloria-instruction]');
      const a=w?.getBoundingClientRect(),b=p?.getBoundingClientRect();
      return {word:w?.textContent?.trim(),wordPx:parseFloat(getComputedStyle(w).fontSize),
        instruction:p?.textContent?.trim(),instructionPx:parseFloat(getComputedStyle(p).fontSize),
        wordTop:a?.top,instructionTop:b?.top,
        actualArt:[...document.styleSheets].some(x=>x.href?.includes('gloria-practice-mockup'))};
    });
    assert.equal(hierarchy.word,'est','actual tested Latin word must be visible');
    assert.ok(hierarchy.wordPx>=45,'est should be big in iPad landscape: '+JSON.stringify(hierarchy));
    assert.ok(hierarchy.instructionPx<=22,'question guidance must not dominate test word: '+JSON.stringify(hierarchy));
    assert.ok(hierarchy.wordPx>=hierarchy.instructionPx*2.3,'tested word must dominate instructional question: '+JSON.stringify(hierarchy));
    assert.ok(hierarchy.wordTop<hierarchy.instructionTop,'tested term must appear BEFORE question guidance');
    const art=await page.request.get(base+'/assets/gloria-approved-mockup-side-art.svg');
    assert.equal(art.status(),200,'original user-approved side illustration must be deployed');
    console.log('GLORIA_EST_VOCAB_HIERARCHY '+JSON.stringify({engine,viewport,hierarchy}));
  }
  if(kind!=='vocab-mc')assert.ok(Number(details.promptWeight)>=700,'prompt must be bold');
  if(kind!=='vocab-mc')assert.ok(details.promptSize>=27,'question must be large');
  assert.ok(details.scrollWidth<=viewport.width+1,'no horizontal overflow');
  assert.equal(await page.locator('#study-companion').isVisible(),false,'decorative character must not cover questions');
  assert.equal(await page.locator('#lux-voice-cheer-toggle').isVisible(),false,'no floating voice banner over input');
  assert.ok(details.lock?.height>=20,'approved daily lock must be readable');
  if(['mc','tiles','typed'].includes(kind)) assert.ok(details.card.bottom<details.nav.y-8,
    'question and answer card should stay above the Study bar in one iPad screen');
  assert.ok(details.decorativeBackground.includes('gloria-practice-academy-ornaments-20261024.svg'),'real approved academy illustration must load');
  const bgResponse=await page.request.get(base+'/assets/gloria-practice-academy-ornaments-20261024.svg');
  assert.equal(bgResponse.status(),200,'academy background asset must load');
  const bgSource=await bgResponse.text();
  assert.ok(bgSource.includes('id="arch"'),'new illustrated windows must load from same-origin SVG');
  assert.ok(bgSource.includes('<mask id="lm"'),'ornament background should fade away from readable question area');

  if(kind==='tiles'){
    assert.equal(details.tileInk,'rgb(255, 246, 223)','approved ivory letter tiles must remain light and readable');
    assert.ok(details.submitButton?.width>=160,'tile answer action needs prominent button');
    assert.ok(details.submitButton.y>=details.tileButton.y,'tile submission must follow available letter tiles');
    const cta=page.locator('[data-lux-tiles] > button:last-child');
    assert.equal(await cta.getAttribute('aria-label'),'Check Answer','tile submit has the approved accessible CTA name');
    assert.equal(await cta.evaluate(el=>getComputedStyle(el,'::before').content),'"Check Answer"');
    assert.equal(await page.locator('#lux-daily-clear-tiles').count(),1,'real Clear control must be present');
    const clearBox=await page.locator('#lux-daily-clear-tiles').boundingBox();
    const tilesBox=await page.locator('[data-lux-tiles] > div:nth-child(2)').boundingBox();
    assert.ok(clearBox.y >= tilesBox.y+tilesBox.height, 'Clear must be below every letter tile');
    assert.ok(clearBox.height >= 44, 'Clear keeps a touch-sized target');
    await page.locator('[data-lux-tiles] > div:nth-child(2) button').first().click();
    assert.equal(await page.evaluate(()=>window.tapCount),1,'first letter receives the tap');
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
    const compact=await page.evaluate(()=>({
      intro:getComputedStyle(document.querySelector('[data-lux-question-intro]')).display,
      height:document.querySelector('[data-lux-question-card]').getBoundingClientRect().height
    }));
    const styleTrace=()=>page.evaluate(()=>{
      const q=document.querySelector('[data-question-id]');
      const names={q,intro:q?.querySelector('[data-lux-question-intro]'),card:q?.querySelector('[data-lux-question-card]'),
        prompt:q?.querySelector('[data-lux-prompt]'),form:q?.querySelector('form'),input:q?.querySelector('input')};
      return Object.fromEntries(Object.entries(names).filter(([,e])=>e).map(([k,e])=>{
        const c=getComputedStyle(e),b=e.getBoundingClientRect();
        return [k,{h:b.height,display:c.display,padding:c.padding,margin:c.margin,gap:c.gap,
          font:c.fontSize,lineHeight:c.lineHeight,minHeight:c.minHeight,maxHeight:c.maxHeight,
          gridRows:c.gridTemplateRows,position:c.position}];
      }));
    });
    const traceFocused=await styleTrace();
    await page.locator('[data-lux-question-card] input').blur();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('lux-daily-typing'));
    assert.equal(await page.locator('#lux-daily-study-nav').isVisible(),true,'nav restored after typing');
    const afterBlur=await page.evaluate(()=>({
      compact:document.documentElement.classList.contains('lux-daily-compact'),
      intro:getComputedStyle(document.querySelector('[data-lux-question-intro]')).display,
      height:document.querySelector('[data-lux-question-card]').getBoundingClientRect().height
    }));
    console.log('GLORIA_BLUR_LAYOUT '+JSON.stringify({engine,viewport,focused:traceFocused,blurred:await styleTrace()}));
    assert.equal(afterBlur.compact,true,'iPad practice card must stay compact between editor focus changes');
    assert.equal(afterBlur.intro,compact.intro,'question heading must not flash back on blur');
    assert.equal(afterBlur.intro,'none','iPad keyboard compact mode must hide the redundant 100px session heading');
    assert.ok(Math.abs(afterBlur.height-compact.height)<=3,
      'blur must not resize the entire question stage: '+JSON.stringify({compact,afterBlur}));
  }
  if(kind==='tiles'){
    await page.locator('[data-question-format="word_tiles"] .mt-5.space-y-3 > div:nth-child(2) button').first().click();
    assert.equal(await page.evaluate(()=>window.tapCount),2,'two separate native tile clicks must both be preserved');
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
  await page.waitForFunction(()=>!!document.querySelector('#study-companion') || !!document.querySelector('#lux-daily-equipped-pet img[src]'),null,{timeout:10000});
  const before=await page.evaluate(()=>{
    const q=document.querySelector('[data-question-id]');
    const nav=document.querySelector('#lux-daily-study-nav');
    const p=q?.querySelector('[data-lux-prompt], p.font-display.text-2xl');
    return {id:q?.dataset.questionId,format:q?.dataset.questionFormat,
      navCount:nav?.children.length,
      promptSize:p?parseFloat(getComputedStyle(p).fontSize):0,
      promptWeight:p?Number(getComputedStyle(p).fontWeight):0,
      typing:!!document.querySelector('.lux-practice-view [data-question-id] :is(input,textarea,select,button[type="submit"]):focus'),
      compact:document.documentElement.classList.contains('lux-daily-compact'),
      navBottom:nav?.getBoundingClientRect().bottom,
      screenHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth};
  });
  // The approved design intentionally removes decorative character overlays.
  // Retain actual answer controls and seven-link navigation.
  const chromeDetails = await page.evaluate(() => {
    const header=document.querySelector('.paper-wash>header');
    const companion=document.querySelector('#study-companion');
    const sprite=companion?.querySelector('.cx-pet-art');
    const fallback=document.querySelector('#lux-daily-equipped-pet img');
    const voice=document.querySelector('#lux-voice-cheer-toggle');
    const rect=el => {
      if(!el)return null;
      const b=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {x:b.x,y:b.y,width:b.width,height:b.height,display:s.display,
        visibility:s.visibility,opacity:s.opacity,backgroundImage:s.backgroundImage,
        backgroundPosition:s.backgroundPosition,position:s.position};
    };
    return {header:rect(header),companion:rect(companion),sprite:rect(sprite),
      fallback:rect(fallback),fallbackComplete:fallback?.complete,
      fallbackNaturalWidth:fallback?.naturalWidth,voice:rect(voice),
      bodyText:document.body.innerText.slice(0,250)};
  });
  console.log('DAILY_REAL_CHROME_DIAGNOSTIC '+JSON.stringify({engine,chromeDetails}));
  assert.ok(chromeDetails.header?.display==='none','approved design has no top bar');
  assert.ok(!chromeDetails.companion || chromeDetails.companion.display==='none','character overlay must be hidden on the approved question screen');
  assert.ok(!chromeDetails.voice || chromeDetails.voice.display==='none','voice overlay must not cover the answer field');
  assert.ok(before.id,'real French question must load');
  assert.equal(before.navCount,7,'live question needs Study navigation');
  // Safari activates compact keyboard typography when a typed answer gets
  // focus. Require full 27px in reading mode and 22px in keyboard mode.
  assert.ok(before.promptSize>=(before.typing||before.compact?22:27),
    'real prompt must be legible at reading or active-keyboard size: '+JSON.stringify(before));
  assert.ok(before.promptWeight>=600,'real question prompt must remain bold');
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
  // A real Next click (not just a mock DOM removal) must preserve the shell
  // while the React quiz switches its question ID and redraws feedback.
  const stableNav=await page.evaluate(()=>{
    window.__luxObservedShellLoss=0;
    const nav=document.getElementById('lux-daily-study-nav');
    new MutationObserver(()=>{
      if (!document.documentElement.classList.contains('lux-daily-ux-ready'))
        window.__luxObservedShellLoss++;
    }).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    return nav?.id||'';
  });
  assert.equal(stableNav,'lux-daily-study-nav');
  const next=page.getByRole('button',{name:'Next question'});
  assert.equal(await next.count(),1,'real answered quiz must provide Next question');
  await next.click();
  await page.waitForFunction(id=>{const nextId=document.querySelector('[data-question-id]')?.dataset.questionId;return !!nextId && nextId!==id},marked.id,{timeout:15000});
  await page.waitForTimeout(800);
  const nextState=await page.evaluate(()=>({
    id:document.querySelector('[data-question-id]')?.dataset.questionId,
    ready:document.documentElement.classList.contains('lux-daily-ux-ready'),
    nav:document.querySelectorAll('#lux-daily-study-nav a').length,
    missingShellFrames:window.__luxObservedShellLoss,
    hiddenHeader:getComputedStyle(document.querySelector('.paper-wash>header')).display==='none'
  }));
  assert.ok(nextState.id && nextState.id!==marked.id,'next real question should advance');
  assert.equal(nextState.ready,true,'real question switch must retain practice shell');
  assert.equal(nextState.nav,7,'seven-link rail must persist after answering');
  assert.equal(nextState.hiddenHeader,true,'legacy header must remain hidden');
  assert.equal(nextState.missingShellFrames,0,'the quiz shell must never drop during Next');
  await page.screenshot({path:path.join(out,engine+'-real-french-next.png'),fullPage:true});
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

async function checkAssignedStandard(browser,engine) {
  // Real assigned Standard task, not a synthetic store write. Vocab is untouched.
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),navigations=[],errors=[];
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations.push(frame.url())});
  page.on('pageerror',error=>errors.push(error.message));
  const url=base+'/study/french/practise?daily=1&locked=1&year=8&mode=standard&task=y8-standard-a&topic=fr-y8-s01-quick-rules';
  try {
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('.lux-practice-view [data-question-id]',{timeout:35000});
    await page.waitForFunction(()=>!!document.querySelector('.lux-practice-view [data-lux-question-card]'),null,{timeout:10000});
    // A server-rendered question is not proof React has hydrated its controlled
    // answer field. Wait for the same ready signals used by the live-quiz QA.
    await page.waitForFunction(()=>window.__luxAppReady===true && document.documentElement.classList.contains('lux-daily-ux-ready'),null,{timeout:20000});
    await page.waitForTimeout(400);
    const before=await page.evaluate(()=>{
      window.__luxOldShellFrames=0;
      const observed=document.documentElement;
      new MutationObserver(()=>{
        if(!observed.classList.contains('lux-daily-ux-ready'))window.__luxOldShellFrames++;
      }).observe(observed,{attributes:true,attributeFilter:['class']});
      return {id:document.querySelector('[data-question-id]')?.dataset.questionId,
        format:document.querySelector('[data-question-id]')?.dataset.questionFormat,
        nav:document.querySelectorAll('#lux-daily-study-nav a').length};
    });
    assert.ok(before.id,'real non-vocab Standard question must exist');
    assert.equal(before.nav,7,'Standard task needs seven Study nav buttons');
    const q=page.locator('.lux-practice-view [data-question-id]');
    const afterInteraction=async()=>page.evaluate(()=>({
      id:document.querySelector('.lux-practice-view [data-question-id]')?.dataset.questionId,
      format:document.querySelector('.lux-practice-view [data-question-id]')?.dataset.questionFormat,
      input:document.querySelector('.lux-practice-view [data-question-id] input, .lux-practice-view [data-question-id] textarea')?.value,
      buttons:[...document.querySelectorAll('.lux-practice-view [data-question-id] button')].filter(x=>/Submit/i.test(x.textContent)).map(x=>({text:x.textContent,disabled:x.disabled})),
      preview:document.querySelector('.lux-practice-view [data-question-id]')?.innerText?.slice(0,600)
    }));
    console.log('DAILY_STANDARD_BEFORE '+JSON.stringify({engine,before,diagnostic:await afterInteraction()}));
    if(before.format==='mc_single'){
      await q.locator('[data-lux-mc-options] > button').first().click();
    } else if(before.format==='word_tiles'){
      await q.locator('.mt-5.space-y-3 > div:nth-child(2) button').first().click();
      console.log('DAILY_STANDARD_AFTER_TILE '+JSON.stringify({engine,diagnostic:await afterInteraction()}));
      await q.getByRole('button',{name:'Submit'}).click();
    } else {
      const editor=q.locator('input,textarea').first();
      await editor.fill('sample practice answer');
      console.log('DAILY_STANDARD_AFTER_FILL '+JSON.stringify({engine,diagnostic:await afterInteraction()}));
      await q.getByRole('button',{name:'Submit'}).click();
    }
    const next=page.getByRole('button',{name:'Next question'});
    await next.waitFor({state:'visible',timeout:15000});
    await next.click();
    await page.waitForFunction(id=>document.querySelector('[data-question-id]')?.dataset.questionId!==id,before.id,{timeout:15000});
    const after=await page.evaluate(()=>({
      id:document.querySelector('[data-question-id]')?.dataset.questionId,
      ready:document.documentElement.classList.contains('lux-daily-ux-ready'),
      oldShellFrames:window.__luxOldShellFrames,
      nav:document.querySelectorAll('#lux-daily-study-nav a').length,
      oldHeader:getComputedStyle(document.querySelector('.paper-wash > header')).display
    }));
    assert.ok(after.id&&after.id!==before.id,'Standard task must advance to a different question');
    assert.equal(after.ready,true,'new shell stays active during actual Standard answers');
    assert.equal(after.oldShellFrames,0,'no old Daily shell frames on Standard Submit -> Next');
    assert.equal(after.nav,7,'new Study nav persists');
    assert.equal(after.oldHeader,'none','legacy header stays hidden');
    assert.equal(errors.length,0,'no browser JS errors');
    console.log('DAILY_STANDARD_IPAD_STABILITY '+JSON.stringify({engine,before,after,navigations,errors}));
    report.push({engine,kind:'real-assigned-standard-submit-next',before,after,ok:true});
  }catch(error){
    console.error('DAILY_STANDARD_DIAGNOSTIC '+JSON.stringify({engine,url:page.url(),navigations,errors,reason:String(error)}));
    throw error;
  }finally{await context.close();}
}


async function checkExhaustedBiologyDaily(browser,engine){
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const ids=JSON.parse(fs.readFileSync('content/topics/bio-y9-b1.json','utf8')).questions.map(q=>q.id);
  const url=base+'/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task=year9-light&topic=bio-y9-b1';
  try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('.lux-practice-view [data-question-id]',{timeout:35000});
    await page.evaluate(ids=>{
      const key='lux-scholar-garden-v1',raw=localStorage.getItem(key);
      const persisted=raw?JSON.parse(raw):{state:{},version:0};
      persisted.state.seenCorrect={...(persisted.state.seenCorrect||{}),
        ...Object.fromEntries(ids.map(id=>[id,1]))};
      localStorage.setItem(key,JSON.stringify(persisted));
      // This is the TEST browser only; never remove learner device records.
      localStorage.removeItem('lux-practice-drafts-v1');
    },ids);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('.lux-practice-view [data-question-id]',{timeout:35000});
    const result=await page.evaluate(()=>({
      question:document.querySelector('[data-question-id]')?.dataset.questionId,
      locked:document.querySelector('.lux-practice-view')?.innerText?.includes('This daily task is locked'),
      error:document.body.innerText.includes('This topic needs more unused questions'),
      mask:getComputedStyle(document.body,'::before').display,
      ready:document.documentElement.classList.contains('lux-daily-ux-ready')
    }));
    assert.ok(result.question,'Biology Year 9 should not become empty after all 77 answers were correct: '+JSON.stringify(result));
    assert.equal(result.error,false,'no exhausted-question blocker on saved Biology task');
    assert.equal(result.mask,'none','no saved-progress mask over mounted Biology practice');
    assert.equal(result.ready,true,'final Practice shell stays ready');
    // The local Playwright HTTP fixture intentionally has no WebKit CORS
    // headers on unrelated Chemistry/French prefetches. Keep these visible,
    // but never mistake them for Biology task/runtime failures on same-origin
    // production GitHub Pages. All other JS exceptions are still fatal.
    const fixtureCors=/^\/127\.0\.0\.1:\d+\/(?:content\/topics\/chem-y9-c(?:1|3)\.json|assessment\/french-school-1\.json|content\/topics\/fr-y9-u1-paris-travel\.json) due to access control checks\.$/;
    const unrelated=errors.filter(e=>fixtureCors.test(e));
    const runtimeErrors=errors.filter(e=>!fixtureCors.test(e));
    if(unrelated.length)console.log('DAILY_BIOLOGY_LOCALHOST_CORS '+JSON.stringify({engine,unrelated}));
    if(runtimeErrors.length)console.error('DAILY_BIOLOGY_ERROR_DETAILS '+JSON.stringify({engine,result,runtimeErrors}));
    assert.equal(runtimeErrors.length,0,'no actual Biology JS errors during depleted-bank recovery');
    console.log('DAILY_BIOLOGY_EXHAUSTED_IPAD '+JSON.stringify({engine,result,errors}));
    report.push({engine,kind:'biology-all-previously-correct',ok:true,result});
  }finally{await context.close()}
}

try{
  for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await launcher.launch({headless:true});
    try{
      if(process.env.LUX_BIOLOGY_ONLY==='1'){
        await checkExhaustedBiologyDaily(browser,engine);
        continue;
      }
      for(const size of [{width:1024,height:768},{width:1366,height:1024}]){
        for(const kind of ['mc','long-mc','vocab-mc','typed','tiles']) await checkFixture(browser,engine,kind,size);
      }
      await checkRealPractice(browser,engine);
      await checkAssignedStandard(browser,engine);
      await checkExhaustedBiologyDaily(browser,engine);
    }finally{await browser.close();}
  }
}finally{
  server.close();
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
}
console.log('DAILY_PRACTICE_V2_QA '+JSON.stringify({scenarios:report.length,engines:['chromium','webkit'],viewports:['1024x768','1366x1024'],formats:['MC','long-MC','typed','tiles']}));
