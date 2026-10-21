import fs from 'node:fs';import path from 'node:path';import {createServer} from 'node:http';
import assert from 'node:assert/strict';import {chromium,webkit} from 'playwright';
const cwd=process.cwd(),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
const srv=createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');let name=decodeURIComponent(url.pathname);if(name.endsWith('/'))name+='index.html';const target=path.resolve(cwd,'.'+name);if(!target.startsWith(cwd+path.sep)){res.writeHead(403);res.end();return;}const stat=fs.statSync(target);if(stat.isDirectory()){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(target).pipe(res);}catch{res.writeHead(404);res.end();}});
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));const origin=`http://127.0.0.1:${srv.address().port}`;
const ids=['verbum-match','sentence-mosaic','phrase-mosaic','mot-match','dictation-dash','word-match','organelle-match','element-match','force-match','pe-circuit','forma-forge','manuscript','case-locker','error-hunter','sixty-blitz','weekly-boss','runway-check'];
fs.mkdirSync('test-results',{recursive:true});
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{
   for(const viewport of [{width:1024,height:768},{width:834,height:1112},{width:390,height:844}]){
    const context=await browser.newContext({viewport,serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/play/',{waitUntil:'domcontentloaded'});
    await page.locator('#lux-play-hall-preview .lux-play-hall-card').first().waitFor({timeout:30000});
    await page.waitForFunction(()=>!!document.querySelector('#lux-play-hall-preview-style')?.sheet,{timeout:20000});
    assert.equal(await page.locator('.lux-play-hall-card').count(),4);
    assert.equal(await page.locator('.lux-play-hall-nav-link').count(),7);
    assert.equal(await page.locator('.lux-play-hall-scholar').count(),1);
    assert.equal(await page.locator('#lux-play-hall-preview img').count(),1,'Only approved standing Scholar, no Pet');
    // Every real game must have a working, visible chip inside its own hall.
    const cards=page.locator('#lux-play-hall-preview .lux-play-hall-card');
    const counts=[6,4,4,3];
    for(let i=0;i<counts.length;i++){
      const card=cards.nth(i);
      assert.equal(await card.locator('.lux-play-hall-pills a').count(),counts[i],
        'All games must be directly selectable in hall '+i);
      const clipped=await card.evaluate(el=>{
        const content=el.querySelector('.lux-play-hall-pills').getBoundingClientRect();
        const footer=el.querySelector('.lux-play-hall-card-footer').getBoundingClientRect();
        return content.bottom>footer.top+2;
      });
      assert.equal(clipped,false,'Game buttons must fit above the card footer');
    }
    const chips=page.locator('.lux-play-hall-pills a');
    assert.equal(await chips.count(),17,'All 17 existing games must be shown as direct buttons');
    const chipIds=await chips.evaluateAll(nodes=>nodes.map(a=>new URL(a.href).pathname.split('/').pop()));
    assert.deepEqual([...chipIds].sort(),[...ids].sort(),'All visible game buttons must point to real native routes');
    await page.waitForFunction(()=>{const img=document.querySelector('.lux-play-hall-scholar');return img?.complete&&img.naturalWidth>0;});
    // Visual signoff also captures the true default standing Home outfit.
    if(viewport.width===1024) await page.screenshot({path:`test-results/play-hall-${engine.name()}-1024-default.png`,fullPage:false});
    const heroSize=await page.locator('.lux-play-hall-scholar').evaluate(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}));
    if(viewport.width===1024){
      assert.ok(heroSize.height>=390,'The standing Scholar must remain full-body and readable');
      assert.ok(heroSize.height<=viewport.height*.73,
        'The standing Scholar must be at least 20 percent smaller than previous oversized version');
    }
    // Outfit switch is performed through the original store; Play preview never writes.
    await page.evaluate(async()=>{const store=(await import('/assets/index-BLVOhKhN.js?v=20261021-medical-careers1&ux=20261013-corrections2')).C;store.setState({equippedOutfit:'cardigan'});});
    const outfitArt=await page.evaluate(async()=>{const m=await import('/assets/index-BLVOhKhN.js?v=20261021-medical-careers1&ux=20261013-corrections2');return m.A.find(item=>item.id==='cardigan')?.art||'/art/home-rpg/scholar-clean.png';});
    await page.waitForFunction(expected=>document.querySelector('.lux-play-hall-scholar')?.getAttribute('src')===expected,outfitArt);
    assert.equal(await page.locator('.lux-play-hall-scholar').getAttribute('src'),outfitArt);
    const before=await page.evaluate(async()=>{const m=await import('/assets/index-BLVOhKhN.js?v=20261021-medical-careers1&ux=20261013-corrections2');return JSON.stringify({xp:m.C.getState().xp,games:m.C.getState().games});});
    await page.locator('.lux-play-hall-all-games').click();
    const dialog=page.getByRole('dialog',{name:'All games'});await dialog.waitFor();
    assert.equal(await dialog.locator('a[href^="/play/"]').count(),17);
    const hrefs=await dialog.locator('a[href^="/play/"]').evaluateAll(nodes=>nodes.map(n=>new URL(n.href).pathname.split('/').pop()));
    assert.deepEqual([...hrefs].sort(),[...ids].sort(),'Every native game is accessible');
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
    await page.locator('button[aria-label="Browse Science Laboratory games"]').click();
    assert.equal(await page.getByRole('dialog',{name:'Science Laboratory'}).locator('a[href^="/play/"]').count(),4);
    await page.getByRole('button',{name:'Close games list'}).click();
    const after=await page.evaluate(async()=>{const m=await import('/assets/index-BLVOhKhN.js?v=20261021-medical-careers1&ux=20261013-corrections2');return JSON.stringify({xp:m.C.getState().xp,games:m.C.getState().games});});
    assert.equal(after,before,'Browsing cannot overwrite XP or original game history');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Avoid iPad horizontal overflow');
    await page.screenshot({path:`test-results/play-hall-${engine.name()}-${viewport.width}.png`,fullPage:false});
    assert.deepEqual(errors,[],'No uncaught JavaScript exceptions');
    console.log('PASS',engine.name(),viewport.width);
    await context.close();
   }
  }finally{await browser.close();}
 }
 // The approved design is now the default. Confirm returning to the
 // complete Hall from Home, Study, and one original game on both engines.
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1024,height:768}});
   await page.goto(origin+'/');
   await page.locator('#lux-rpg-live-home a[href="/play"]').first().click();
   await page.locator('#lux-play-hall-preview .lux-play-hall-card').first().waitFor({timeout:30000});
   assert.equal(new URL(page.url()).pathname,'/play/','Home -> Play should land on the real Hall');
   await page.goto(origin+'/study/');
   await page.locator('#lux-study-rpg-integrated .lux-study-rpg-nav a[href="/play"]').click();
   await page.locator('#lux-play-hall-preview .lux-play-hall-card').first().waitFor({timeout:30000});
   assert.equal(new URL(page.url()).pathname,'/play/','Study -> Play should land on Hall');
   await page.goto(origin+'/play/verbum-match/');
   await page.locator('a[href="/play"]:visible').first().click();
   await page.locator('#lux-play-hall-preview .lux-play-hall-card').first().waitFor({timeout:30000});
   assert.equal(new URL(page.url()).pathname,'/play/','Original game -> Play should land on Hall');
   await page.close();
  }finally{await browser.close();}
 }
 const b=await chromium.launch({headless:true});
 try{
   const page=await b.newPage();
   await page.goto(origin+'/play/?playHallPreview=0');
   await page.waitForTimeout(1500);
   assert.equal(await page.locator('#lux-play-hall-preview').count(),0,'Legacy Play fallback must remain available');
   await page.close();
 }finally{await b.close();}
}finally{srv.close();}