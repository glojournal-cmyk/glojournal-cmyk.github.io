import {chromium, webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// This is a browser-only synthetic learner record. Never use live player data.
const base=process.env.QA_BASE_URL || 'http://127.0.0.1:8777';
const runs=[
 {label:'ipad-landscape',engine:webkit,viewport:{width:1024,height:768}},
 {label:'ipad-portrait',engine:webkit,viewport:{width:768,height:1024}},
 {label:'desktop',engine:chromium,viewport:{width:1440,height:850}},
 {label:'phone',engine:chromium,viewport:{width:390,height:844}}
];
fs.mkdirSync('test-results/rpg-home',{recursive:true});
for(const run of runs){
 const browser=await run.engine.launch({headless:true,args:run.engine===chromium?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:run.viewport});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'load',timeout:60000});
  await page.locator('#lux-rpg-live-home > .rpg-days-live').waitFor({timeout:45000});
  const changed=await page.evaluate(()=>{
   const store=window.__luxStore;const s=store.getState();
   store.setState({xp:451,equippedOutfit:'house',
      unlockedOutfits:[...new Set([...(s.unlockedOutfits||[]),'house','cardigan'])]});
   return store.getState().xp;
  });
  assert.equal(changed,451);
  await page.waitForFunction(()=>{
   const img=document.querySelector('.rpg-scholar-live');
   return img?.complete && img.naturalWidth>0 && img.currentSrc.includes('/art/doll/day.png');
  },null,{timeout:18000});
  await page.evaluate(()=>window.__luxStore.setState({equippedOutfit:'cardigan'}));
  await page.waitForFunction(()=>{
    const img=document.querySelector('.rpg-scholar-live');
    return img?.complete&&img.naturalWidth>0&&img.currentSrc.includes('/art/doll/cardigan.png');
  },null,{timeout:18000});
  const hit=await page.evaluate(()=>{
   const button=document.querySelector('#lux-rpg-live-home > .rpg-days-live');
   const r=button.getBoundingClientRect();
   const nav=document.querySelector('#lux-rpg-live-home .rpg-nav-live').getBoundingClientRect();
   return {clickable:button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),
     navBottom:innerHeight-nav.bottom,navHeight:nav.height};
  });
  assert.ok(hit.clickable,'30 days hit target blocked: '+JSON.stringify(hit));
  assert.ok(hit.navBottom>=0&&hit.navBottom<65&&hit.navHeight>35,'bottom bar moved: '+JSON.stringify(hit));
  await page.locator('#lux-rpg-live-home > .rpg-days-live').click();
  assert.equal(await page.locator('.rpg-record-row-live').count(),30);
  await page.locator('#lux-rpg-modal-close').click();
  await page.locator('#lux-rpg-live-home .rpg-orb-live').first().click();
  assert.ok(await page.locator('.rpg-star-modal-live').isVisible());
  await page.locator('#lux-rpg-modal-close').click();
  await page.locator('#lux-rpg-live-home .rpg-orb-live').last().click();
  assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('lux-rpg-recovery-open')));
  await page.locator('#lux-rpg-modal-close').click();
  await page.getByRole('button',{name:'Settings',exact:true}).last().click();
  const setting=page.locator('.rpg-settings-modal-live');
  await setting.waitFor({timeout:10000});
  assert.ok(await setting.isVisible());
  const sound=await page.locator('.rpg-settings-option-live').first().getAttribute('aria-pressed');
  await page.locator('.rpg-settings-option-live').first().click();
  assert.notEqual(await page.locator('.rpg-settings-option-live').first().getAttribute('aria-pressed'),sound);
  await page.locator('#lux-rpg-modal-close').click();
  await page.screenshot({path:'test-results/rpg-home/'+run.label+'-resilient.png'});
  // Real full-page navigation from a Study shell to the RPG Home.
  await page.goto(base+'/study/',{waitUntil:'load',timeout:60000});
  const a=page.locator('a[href="/"]:visible').first();
  await a.waitFor({timeout:35000});
  await Promise.all([
   page.waitForNavigation({waitUntil:'load',timeout:35000}),
   a.click({timeout:10000})
  ]);
  await page.waitForFunction(()=>{
   const root=document.querySelector('#lux-rpg-live-home'),
    nav=root?.querySelector('.rpg-nav-live');
   const r=nav?.getBoundingClientRect();
   return root?.isConnected&&document.documentElement.classList.contains('lux-rpg-live-active')&&
     r?.height>35&&innerHeight-r.bottom>=0&&innerHeight-r.bottom<65;
  },null,{timeout:30000});
  assert.ok(page.url().includes('rpg-home=20261019-ipad-safe2'),
    'Home must fully reinitialize from Study on PWA: '+page.url());
  const after=await page.evaluate(()=>({
   xp:window.__luxStore.getState().xp,
   outfit:window.__luxStore.getState().equippedOutfit,
   active:document.documentElement.classList.contains('lux-rpg-live-active'),
   scholarW:document.querySelector('.rpg-scholar-live')?.naturalWidth,
   navBottom:innerHeight-document.querySelector('.rpg-nav-live').getBoundingClientRect().bottom
  }));
  assert.equal(after.xp,451,'preserved player XP must not be reset by navigation');
  assert.equal(after.outfit,'cardigan');
  assert.ok(after.scholarW>0&&after.navBottom>=0&&after.navBottom<65);
  assert.deepEqual(errors,[],'unexpected JavaScript errors on '+run.label);
  console.log('PASS '+run.label+' '+JSON.stringify({navBottom:after.navBottom,xp:after.xp,outfit:after.outfit}));
 }finally{await context.close();await browser.close();}
}
