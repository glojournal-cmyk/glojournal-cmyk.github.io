import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
const baseDir=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),decoded=decodeURIComponent(url.pathname);
  let relative=decoded.endsWith('/')?decoded+'index.html':decoded;
  // Match GitHub Pages' canonical-directory handling when a nav links /play, /garden, etc.
  if (/^\/(?:study|pet|play|garden|scholar|assessment)$/.test(decoded)) relative=decoded+'/index.html';
  const file=path.resolve(baseDir,'.'+relative);
  if (!file.startsWith(baseDir+path.sep)) throw new Error('Outside web root');
  const buf=fs.readFileSync(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(buf);
}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
// A hoisted legacy nav can remain in the DOM, but must not cover the new Study rail.
async function studyNavigationIsFrontmost(page) {
  return page.evaluate(() => {
    const scene = document.getElementById('lux-study-rpg-integrated');
    const nav = scene?.querySelector('.lux-study-rpg-nav');
    if (!nav) return false;
    const rect = nav.getBoundingClientRect();
    const x = Math.max(1, Math.min(innerWidth-1, rect.left + rect.width/2));
    const y = Math.max(1, Math.min(innerHeight-1, rect.top + rect.height/2));
    const target = document.elementFromPoint(x, y);
    return !!target && nav.contains(target) && scene.contains(target);
  });
}
try{
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch({headless:true});
    try{
      for(const viewport of [{width:1024,height:768},{width:834,height:1112},{width:390,height:844}]){
        const context=await browser.newContext({viewport});
        const page=await context.newPage();
        fs.mkdirSync('test-results',{recursive:true});
        const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto(origin+'/study/');
        await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').first().waitFor({timeout:25000});
        // The visual stylesheet is attached dynamically; do not inspect visibility
        // before it loads, otherwise the original hoisted nav can still flash.
        await page.waitForFunction(() => Boolean(document.getElementById('lux-study-rpg-style')?.sheet));
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').count(),6);
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-pet').count(),1);
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-scholar').count(),1);
        assert.equal(await page.locator('html.lux-study-rpg-active').count(),1);
        assert.equal(await page.evaluate(()=>!!window.__luxStudyRpgBootInstalled),true,'Production route bridge is installed');
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-nav a').count(),7);
        await page.waitForTimeout(150);
        await page.screenshot({path:`test-results/study-rpg-${engine.name()}-${viewport.width}-precheck.png`,fullPage:false});
        assert.equal(await studyNavigationIsFrontmost(page),true,'Study navigation must be frontmost over any legacy floating nav');
        await page.locator('.lux-study-rpg-year select').selectOption('8');
        await page.waitForFunction(()=>document.querySelector('main:not(#lux-study-rpg-integrated) select:has(option[value="8"])')?.value==='8');
        assert.equal(await page.locator('.lux-study-rpg-year select').inputValue(),'8');
        const urls=await page.locator('.lux-study-rpg-actions a').evaluateAll(nodes=>nodes.map(n=>new URL(n.href).origin+new URL(n.href).pathname));
        assert.equal(urls.length,18);
        assert.ok(urls.every(url=>url.startsWith(origin+'/study/')));
        const checks=await page.locator('.lux-study-rpg-card-art').evaluateAll(nodes=>nodes.map(n=>({ready:n.complete&&n.naturalWidth>0,src:n.currentSrc})));
        assert.ok(checks.every(c=>c.ready),'Subject artwork should load at both years');
        await page.locator('.lux-study-rpg-year select').selectOption('9');
        await page.waitForFunction(()=>document.querySelector('main:not(#lux-study-rpg-integrated) select:has(option[value="9"])')?.value==='9');
        await page.evaluate(async()=>{
          const store=(await import('/assets/index-BLVOhKhN.js?v=20261018-mastery2')).C;
          store.setState({equippedOutfit:'cardigan'});
          localStorage.setItem('lux-pet-companion-v1',JSON.stringify({species:'moss-hornling',petLevels:{'moss-hornling':2}}));
          dispatchEvent(new Event('scholar:pet-changed'));
        });
        await page.waitForFunction(()=>document.querySelector('.lux-study-rpg-scholar')?.getAttribute('src')?.includes('/art/doll/cardigan.png'));
        const petExpected=await page.evaluate(async()=>{
          const x=await import('/pet/pet-art-hd-20261009.js?v=20261019-baphomet1&ux=20261013-corrections2');
          return x.petArtUrl('moss-hornling',2);
        });
        assert.equal(await page.locator('.lux-study-rpg-pet').getAttribute('src'),petExpected);
        const petPixels = await page.locator('.lux-study-rpg-pet').evaluate(img => ({
          transform:getComputedStyle(img).transform,
          width:img.getBoundingClientRect().width,
          height:img.getBoundingClientRect().height,
          quality:getComputedStyle(img).imageRendering,
          loaded:img.complete && img.naturalWidth > 0
        }));
        assert.equal(petPixels.transform, 'none','Pet must not be scaled from a tiny rasterized image');
        assert.ok(petPixels.loaded,'Full-resolution Pet sprite must load');
        assert.ok(petPixels.width >= (viewport.width>700 ? 165 : 125),
          'Pet should be sized natively, not scaled by CSS at '+viewport.width+'px');
        assert.equal(petPixels.quality,'auto','Pet should use native image sampling');
        assert.ok(await page.locator('.lux-study-rpg-scholar').evaluate(img => img.complete && img.naturalWidth>0 && img.getBoundingClientRect().height > 200),'Equipped outfit image must be rendered');
        assert.ok(await page.locator('.lux-study-rpg-pet').evaluate(img => img.complete && img.naturalWidth>0),'Selected pet image must be rendered');
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-nav a').count(),7,'Nav must remain intact after outfit/pet changes');
        assert.equal(await studyNavigationIsFrontmost(page),true,'Study navigation must remain frontmost after outfit/pet updates');
        assert.equal(await page.locator('.lux-study-rpg-scholar.lux-scholar-character').count(),0,'Legacy Pet enhancer must not rewrite the Study character');
        assert.equal(await page.locator('#lux-study-rpg-integrated.lux-scholar-pet-scene').count(),0,'Do not turn Study into the legacy Pet stage');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        fs.mkdirSync('test-results',{recursive:true});
        await page.screenshot({path:`test-results/study-rpg-${engine.name()}-${viewport.width}.png`,fullPage:false});
        assert.deepEqual(errors,[],'No uncaught errors');
        console.log(engine.name(),viewport.width,'Study RPG integration passed');
        await context.close();
      }
    }finally{await browser.close();}
  }
  // New Study scene must also load after an actual Home-to-Study tap.
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:{width:1024,height:768}});
      await page.goto(origin+'/');
      await page.locator('a[href="/study"]').first().click();
      await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').first().waitFor({timeout:25000});
      assert.equal(new URL(page.url()).pathname.replace(/\/$/,''),'/study');
      assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').count(),6,'Home→Study navigation loads production scene');
      await page.close();
    }finally{await browser.close();}
  }
  // Emergency fallback retains real native Study if a layout issue is reported.
  const fallbackBrowser=await chromium.launch({headless:true});
  try{
    const page=await fallbackBrowser.newPage();
    await page.goto(origin+'/study/?studyRpgPreview=0');
    await page.locator('main select:has(option[value="8"])').waitFor({timeout:25000});
    assert.equal(await page.locator('#lux-study-rpg-integrated').count(),0,'Legacy fallback must bypass new overlay');
    await page.close();
  }finally{await fallbackBrowser.close();}

  // Regression: a fresh Study classroom must return after visiting every
  // principal page, not the retired Study JSX. Exercise iPad WebKit and Chromium.
  for (const engine of [chromium, webkit]) {
    const browser=await engine.launch({headless:true});
    try {
      const page=await browser.newPage({viewport:{width:1024,height:768}});
      for (const target of [
        {name:'Pet',href:'/pet/',path:'/pet/'},
        {name:'Play',href:'/play',path:'/play'},
        {name:'Garden',href:'/garden',path:'/garden'},
        {name:'Scholar',href:'/scholar',path:'/scholar'},
        {name:'Assessment',href:'/assessment/',path:'/assessment/'},
        {name:'Home',href:'/',path:'/'}
      ]) {
        await page.goto(origin+'/study/');
        await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').first().waitFor({timeout:25000});
        await page.locator('#lux-study-rpg-integrated .lux-study-rpg-nav a[href="'+target.href+'"]').click();
        await page.waitForURL(u=>u.pathname.replace(/\/$/,'')===target.path.replace(/\/$/,''),{waitUntil:'domcontentloaded',timeout:20000});
        // SPA links can update the URL before React commits the destination.
        // Find and activate the real destination nav in one animation frame:
        // WebKit can replace that node between a separate wait and click.
        if (target.name === 'Play') {
          // Play is now a full-screen hall: use its visible navigation,
          // not the old React nav hidden behind that hall.
          await page.locator('#lux-play-hall-preview .lux-play-hall-nav a[href="/study/"]').click();
        } else {
          // Wait for the shared route bridge before triggering a real tap.
          // Evaluating link.click() inside waitForFunction can fire against an
          // early DOM node before Safari has installed the route handlers.
          await page.waitForFunction(
            () => window.__luxStudyRpgBootInstalled === true,
            null,{timeout:20000}
          );
          const studyNav=page.locator('a[href="/study"]:visible, a[href="/study/"]:visible');
          await studyNav.last().click({timeout:20000});
        }
        await page.waitForURL(u=>/^\/study\/?$/.test(u.pathname),{waitUntil:'domcontentloaded',timeout:20000});
        await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').first().waitFor({timeout:25000});
        await page.waitForFunction(()=>document.documentElement.classList.contains('lux-study-rpg-active'));
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').count(),6,
          'Study → '+target.name+' → Study should show six RPG subject cards');
        assert.equal(await studyNavigationIsFrontmost(page),true,
          'Study rail should be on top after returning from '+target.name);
        if(target.name==='Pet'){
          // WebKit may retain an intermediate client-side navigation entry.
          // Verify the actual back/forward recovery without assuming its URL.
          await page.goBack({waitUntil:'domcontentloaded'});
          await page.goForward({waitUntil:'domcontentloaded'});
          await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').first().waitFor({timeout:25000});
          assert.equal(await page.locator('html.lux-study-rpg-active').count(),1,
            'iPad back/forward must retain the integrated Study');
        }
        console.log(engine.name(),target.name,'→ Study return passed');
      }
      await page.close();
    } finally { await browser.close(); }
  }
}finally{server.close();}