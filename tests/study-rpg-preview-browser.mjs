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
  const file=path.resolve(baseDir,'.'+relative);
  if (!file.startsWith(baseDir+path.sep)) throw new Error('Outside web root');
  const buf=fs.readFileSync(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(buf);
}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
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
        await page.goto(origin+'/study/?studyRpgPreview=1');
        await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').first().waitFor({timeout:25000});
        // The visual stylesheet is attached dynamically; do not inspect visibility
        // before it loads, otherwise the original hoisted nav can still flash.
        await page.waitForFunction(() => Boolean(document.getElementById('lux-study-rpg-style')?.sheet));
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-card').count(),6);
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-pet').count(),1);
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-scholar').count(),1);
        assert.equal(await page.locator('html.lux-study-rpg-active').count(),1);
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-nav a').count(),7);
        await page.waitForTimeout(150);
        await page.screenshot({path:`test-results/study-rpg-${engine.name()}-${viewport.width}-precheck.png`,fullPage:false});
        assert.equal(await page.locator('body > nav:visible').count(),0,'Legacy floating navigation must not overlap Study');
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
        assert.ok(await page.locator('.lux-study-rpg-scholar').evaluate(img => img.complete && img.naturalWidth>0 && img.getBoundingClientRect().height > 200),'Equipped outfit image must be rendered');
        assert.ok(await page.locator('.lux-study-rpg-pet').evaluate(img => img.complete && img.naturalWidth>0),'Selected pet image must be rendered');
        assert.equal(await page.locator('#lux-study-rpg-integrated .lux-study-rpg-nav a').count(),7,'Nav must remain intact after outfit/pet changes');
        assert.equal(await page.locator('body > nav:visible').count(),0,'Legacy native nav must stay hidden after state changes');
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
}finally{server.close();}