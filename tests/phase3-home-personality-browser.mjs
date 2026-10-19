import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
   const url=new URL(req.url,'http://localhost');
   let name=decodeURIComponent(url.pathname);
   if(name.endsWith('/'))name+='index.html';
   const dest=path.resolve(root,'.'+name);
   if(!dest.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
   const bytes=fs.readFileSync(dest);
   res.writeHead(200,{'content-type':types[path.extname(dest)]||'application/octet-stream',
     'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
fs.mkdirSync('test-results',{recursive:true});
const failures=[],reports=[];
try{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch({headless:true});
  try{
   for(const vp of [{width:1280,height:800},{width:834,height:1112},{width:390,height:844}]){
    const context=await browser.newContext({viewport:vp,locale:'en-GB',timezoneId:'Europe/London',
      hasTouch:vp.width===834,reducedMotion:vp.width===390?'reduce':'no-preference'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      const response=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:35000});
      assert.equal(response.status(),200);
      // Approved RPG Home now owns the visible Scholar/Pet scene. The
      // original greeting and pet card remain mounted but intentionally hidden.
      await page.waitForFunction(()=>{
        const root=document.querySelector('#lux-rpg-live-home');
        const scholar=root?.querySelector('.rpg-scholar-live');
        const pet=root?.querySelector('.rpg-pet-live img');
        return !!window.__luxAppReady && !!root?.querySelector('.rpg-greet-control-live') &&
          scholar?.complete && scholar.naturalWidth>0 && pet?.complete && pet.naturalWidth>0;
      },null,{timeout:40000});
      const ui=await page.evaluate(()=>{
        const root=document.querySelector('#lux-rpg-live-home');
        const ctl=root.querySelector('.rpg-greet-control-live');
        const box=ctl.getBoundingClientRect();
        const nav=root.querySelector('.rpg-nav-live');
        return {width:box.width,height:box.height,
          originalHero:root.querySelector('.rpg-scholar-live')?.getAttribute('src'),
          petImage:root.querySelector('.rpg-pet-live img')?.getAttribute('src'),
          petLink:root.querySelector('.rpg-pet-live')?.getAttribute('href'),
          navPosition:getComputedStyle(nav).position,
          greetCount:root.querySelectorAll('.rpg-greet-control-live').length};
      });
      assert.ok(ui.width>=44&&ui.height>=44,'iPad RPG greeting must be tappable');
      assert.equal(ui.greetCount,1,'exactly one RPG greeting control');
      assert.equal(ui.petLink,'/pet/','Pet navigation remains functional');
      assert.equal(ui.navPosition,'fixed','PWA bottom navigation must be viewport-fixed');
      await page.waitForFunction(()=>{
        try{return JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'{}')?.state?.daily?.length===10}
        catch{return false}
      },null,{timeout:15000});
      const snapshot=()=>page.evaluate(()=>{
        const raw=JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'{}');
        const s=raw.state||raw;
        const p=JSON.parse(localStorage.getItem('lux-pet-companion-v1')||'{}');
        return {xp:Number(s.xp)||0,daily:(s.daily||[]).map(t=>[t.id,t.progress,t.target]),
          dailyLog:s.dailyLog,unlocked:s.unlockedOutfits,equipped:s.equippedOutfit,
          petSpecies:p.species,petLevels:p.petLevels,masteryPoints:p.masteryPoints,
          care:p.care};
      });
      const before=await snapshot();
      await page.locator('#lux-rpg-live-home .rpg-greet-control-live').focus();
      await page.keyboard.press('Enter');
      await page.locator('.rpg-greeting-line-live.is-visible').waitFor({timeout:8000});
      const line=page.locator('.rpg-greeting-line-live');
      assert.equal(await line.getAttribute('role'),'status');
      assert.ok((await line.innerText()).length>15,'greeting must have companion personality');
      assert.equal(new URL(page.url()).pathname,'/');
      assert.deepEqual(await snapshot(),before,'RPG greeting must not change saved learner/pet records');
      assert.equal(await page.locator('.rpg-scholar-live').getAttribute('src'),ui.originalHero);
      assert.equal(await page.locator('.rpg-pet-live img').getAttribute('src'),ui.petImage);
      await page.screenshot({path:'test-results/phase3-home-'+engine+'-'+vp.width+'.png'});
      // Settings shortcut must not reveal the retired native Home. It opens
      // the actual Scholar Settings tab where Sound and Music are configured.
      await page.locator('#lux-rpg-live-home .rpg-nav-live a[href="/scholar/?open=settings"]').click();
      await page.waitForURL(url=>url.pathname==='/scholar/'&&url.searchParams.get('open')==='settings',{timeout:20000});
      await page.getByText('Chimes for answers, dress-up, watering and PE.').waitFor({timeout:20000});
      assert.deepEqual(await snapshot(),before,'opening Settings must not edit progress');
      if(errors.length)throw new Error('JavaScript errors: '+errors.slice(0,3).join('; '));
      reports.push({engine,viewport:vp.width,rpgGreeting:true,keyboard:true,
        settingsNative:true,viewportFixedNav:true,noSaveChanges:true});
    }catch(e){
      failures.push({engine,viewport:vp.width,message:e.message,errors:errors.slice(0,3)});
      await page.screenshot({path:'test-results/phase3-home-FAILED-'+engine+'-'+vp.width+'.png'}).catch(()=>{});
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>server.close(ok))}
console.log('PHASE3_HOME_BROWSER_QA '+JSON.stringify({reports,failures}));
assert.deepEqual(failures,[],'Home greeting and original artwork must work in Chromium and iPad WebKit');
