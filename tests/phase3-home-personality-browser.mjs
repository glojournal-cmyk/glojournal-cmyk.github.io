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
      await page.waitForFunction(()=>{
       const control=document.getElementById('lux-home-personality-greet');
       const pet=document.querySelector('#mastery-pet-home .mph-art');
       const scholar=document.querySelector('main img.scholar-idle');
       return !!window.__luxAppReady&&!!control&&!!pet&&!!scholar&&scholar.complete&&scholar.naturalWidth>0;
      },null,{timeout:30000});
      const ui=await page.evaluate(()=>{
       const ctl=document.getElementById('lux-home-personality-greet');
       const card=document.getElementById('mastery-pet-home');
       const box=ctl.getBoundingClientRect();
       return {width:box.width,height:box.height,petLink:card.getAttribute('href'),
        originalHero:document.querySelector('main img.scholar-idle')?.getAttribute('src'),
        sprite:card.querySelector('.mph-art')?.getAttribute('style'),
        buttonCount:document.querySelectorAll('#lux-home-personality-greet').length,
        wasDark:!!document.documentElement.classList.contains('cx-quiet')};
      });
      assert.ok(ui.width>=44&&ui.height>=44,'iPad greeting control must be tappable');
      assert.equal(ui.petLink,'/pet/','original pet navigation intact');
      assert.equal(ui.buttonCount,1,'one greeting control after rerenders');
      assert.match(ui.originalHero,/\/art\/doll\/.+\.png/);
      assert.match(ui.sprite,/sprite|background|url/i,'original pet art remains');
      await page.waitForFunction(()=>{
        try{return JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'{}')?.state?.daily?.length===10}
        catch{return false}
      },null,{timeout:15000});
      // Normal app hydration writes the initial ten-task plan after first paint.
      // Snapshot authoritative reward/task fields only when hydration has settled.
      const snapshot=()=>page.evaluate(()=>{
        const saved=JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'{}');
        const state=saved.state||saved;
        const pet=JSON.parse(localStorage.getItem('lux-pet-companion-v1')||'{}');
        return {xp:Number(state.xp)||0,
          tasks:(state.daily||[]).map(t=>[t.id,Number(t.progress)||0,Number(t.target)||0]),
          unlocked:[...(state.unlockedOutfits||[])],equipped:state.equippedOutfit,
          species:pet.species||'',masteryPoints:Number(pet.masteryPoints)||0,
          care:pet.care||null,petLevels:pet.petLevels||null};
      });
      const before=await snapshot();
      const button=page.locator('#lux-home-personality-greet');
      await button.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(()=>!!document.querySelector('#lux-home-personality-line.is-visible')?.textContent);
      const greeting=await page.locator('#lux-home-personality-line').innerText();
      assert.ok(greeting.length>15,'companion has a personality response');
      assert.equal(await page.locator('#lux-home-personality-line').getAttribute('role'),'status');
      assert.equal(new URL(page.url()).pathname,'/','greeting never navigates away');
      const after=await snapshot();
      assert.deepEqual(after,before,'greeting cannot award XP, credit, outfits, pet Bond or Energy');
      const animation=await page.evaluate(()=>({
        art:document.getElementById('mastery-pet-home')?.querySelector('.mph-art')?.getAttribute('style'),
        hero:document.querySelector('main img.scholar-idle')?.getAttribute('src'),
        playing:document.querySelector('.lux-scholar-pet-scene')?.classList.contains('lux-home-personality-playing')
      }));
      assert.equal(animation.art,ui.sprite,'pet appearance remains unchanged');
      assert.equal(animation.hero,ui.originalHero,'scholar appearance remains unchanged');
      if(vp.width===390)assert.equal(animation.playing,false,'reduced motion disables movement');
      else assert.equal(animation.playing,true,'manual greeting gives subtle reaction');
      assert.equal(await page.locator('#mastery-pet-home').count(),1);
      await page.screenshot({path:'test-results/phase3-home-'+engine+'-'+vp.width+'.png',fullPage:false});
      if(errors.length)throw new Error('JavaScript errors: '+errors.slice(0,3).join('; '));
      reports.push({engine,viewport:vp.width,greet:true,keyboard:true,noSaveChanges:true,
        reducedMotion:vp.width===390});
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
