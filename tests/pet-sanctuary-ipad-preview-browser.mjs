import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit} from 'playwright';

const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
  try{
    let name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(name.endsWith('/'))name+='index.html';
    const file=path.resolve(root,'.'+name);
    if(!file.startsWith(root+path.sep))throw Error('Out of root');
    if(!fs.statSync(file).isFile())throw Error('Not file');
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(res);
  }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port;
fs.mkdirSync('test-results',{recursive:true});
const passed=[];
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{
   for(const viewport of [{width:1024,height:768},{width:834,height:1112},{width:390,height:844}]){
    const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce',timezoneId:'Europe/London'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url+'/pet/',{waitUntil:'domcontentloaded'});
    await page.locator('body.pet-sanctuary-preview').waitFor({timeout:15000});
    await page.locator('#petCareActions [data-pet-action]').first().waitFor({timeout:30000});
    await page.locator('#petFormGrid .pet-form').first().waitFor();
    assert.equal(await page.locator('#petFormGrid .pet-form').count(),10,'Keep all 10 real evolution forms');
    assert.ok(await page.locator('#petAvatar .pet-sprite').count()===1,'The equipped real pet art is in the character stage');
    assert.ok(await page.locator('#openPetChooser').isVisible(),'Collection selection is available');
    assert.ok(await page.locator('#evolvePet').count()===1,'Keep original evolution button');
    assert.ok(await page.locator('#mpCount').count()===1,'Keep real MP wallet');
    assert.ok(await page.locator('#petBondValue').count()===1,'Keep bond');
    assert.ok(await page.locator('#petMoodValue').count()===1,'Keep mood');
    assert.ok(await page.locator('#petEnergyValue').count()===1,'Keep energy');
    assert.equal(await page.locator('.pet-preview-bottom-bar a').count(),7,'Keep approved seven-link global navigation');
    assert.equal(await page.locator('.pet-preview-bottom-bar a[href="/pet/"][aria-current="page"]').count(),1,'Pet nav must be active');
    assert.equal(await page.locator('.pet-preview-bottom-bar a').count(),7,'Approved Pet is now the default destination');
    assert.deepEqual(await page.locator('.pet-preview-bottom-bar a').allTextContents(),
      ['Home','Study','Play','Garden','Pet','Assessment','Scholar'],
      'Keep the exact Study/Play bottom navigation order and singular tab names');
    assert.equal(await page.locator('#stageSteps .pet-step').count(),10,'Show all ten evolution steps on the same Pet screen');
    assert.ok(await page.locator('#pet-next-preview').count()===1,'Show real next evolution artwork inside main panel');
    assert.ok(await page.locator('.pet-evolve-guide-grid>span').count()===3,'Explain both ways to earn MP and the Evolve action on the same page');
    assert.ok(await page.locator('#petGrowth #evolvePet').count()===1,'Original functional Evolve button stays with the explanation');
    assert.equal(await page.locator('.pet-page-intro').isVisible(),false,'Remove redundant top report heading');

    const sizes=await page.evaluate(()=>{
      const box=selector=>{
       const b=document.querySelector(selector).getBoundingClientRect();
       return {left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height};
      };
      const bg=getComputedStyle(document.body).backgroundImage;
      const style=[...document.styleSheets].some(s=>s.href?.includes('pet-sanctuary-ipad-preview-20261020.css'));
      const art=getComputedStyle(document.querySelector('#petImage')).backgroundImage;
      return {pet:box('.pet-stage-card'),care:box('#petCarePanel'),growth:box('#petGrowth'),nav:box('.pet-preview-bottom-bar'),stage:box('#petAvatar'),bg,style,art,topbar:document.querySelector('.pet-topbar') ? getComputedStyle(document.querySelector('.pet-topbar')).display : 'none',classes:document.body.className,scrollWidth:document.documentElement.scrollWidth};
    });
    console.log(engine.name()+' viewport '+viewport.width+' preview layout '+JSON.stringify(sizes));
    assert.ok(sizes.style,'Pet sanctuary stylesheet loaded');
    assert.equal(sizes.topbar,'none','Old duplicate Pet topbar must be hidden in preview');
    assert.ok(sizes.bg.includes('magic-floor.jpg'),'Same academy botanical scene as other new pages');
    const visibleColours=await page.evaluate(()=>({
      need:getComputedStyle(document.querySelector('#nextText')).color,
      needFill:getComputedStyle(document.querySelector('#nextText')).webkitTextFillColor,
      nav:getComputedStyle(document.querySelector('.pet-preview-bottom-bar')).backgroundColor,
      petLink:getComputedStyle(document.querySelector('.pet-preview-bottom-bar a[href="/pet/"]')).color
    }));
    assert.ok(visibleColours.need==='rgb(255, 240, 211)' || visibleColours.needFill==='rgb(255, 240, 211)',
      'MP requirement glyph fill is visibly light on navy Evolution panel');
    assert.equal(visibleColours.nav,'rgba(26, 51, 64, 0.965)','Bottom nav matches Study/Play dark navy');
    const inactiveNavColour=await page.locator('.pet-preview-bottom-bar a[href="/study/"]').evaluate(el=>getComputedStyle(el).color);
    assert.equal(inactiveNavColour,'rgb(255, 244, 222)','Inactive bottom tabs must be readable on dark navy');
    assert.ok(sizes.art.includes('url('),'Real species/level artwork loaded');
    assert.ok(sizes.pet.width>=viewport.width*.4||viewport.width<700,'Large focal stage in landscape');
    assert.ok(sizes.scrollWidth<=viewport.width+4,'No horizontal overflow on iPad/mobile');
    if(viewport.width===1024){
      assert.ok(Math.abs(sizes.pet.top-sizes.growth.top)<25,'Evolution Path and current pet stage start together');
      assert.ok(sizes.growth.left>sizes.pet.right-4,'Growth panel stays in right column');
      assert.ok(sizes.care.top>sizes.growth.bottom-4,'Evolution Path must be fully above Care in Safari and Chromium');
      await page.screenshot({path:'test-results/pet-sanctuary-'+engine.name()+'-1024-home.png'});
      console.log(engine.name()+' 1024 layout '+JSON.stringify(sizes));
      assert.ok(sizes.nav.left>50 && sizes.nav.right<viewport.width-50,'Approved seven-tab nav is actually centred, not cut off');
      assert.ok(Math.abs((sizes.nav.left+sizes.nav.right)/2-viewport.width/2)<4,'Seven-tab nav centred exactly on viewport');
      assert.ok(sizes.pet.bottom<sizes.nav.top+5,'Full pet card fits above approved bottom nav');
      const evolutionEnd=await page.locator('#stageSteps').evaluate(el=>el.getBoundingClientRect().bottom);
      const evolveButtonEnd=await page.locator('#evolvePet').evaluate(el=>el.getBoundingClientRect().bottom);
      assert.ok(evolutionEnd<sizes.nav.top-3,'All ten evolution Levels visible above bottom nav');
      assert.ok(evolveButtonEnd<sizes.nav.top-30,'Evolve action visible above bottom nav');
    }
    if(viewport.width===834)await page.screenshot({path:'test-results/pet-sanctuary-'+engine.name()+'-834-portrait.png'});
    if(viewport.width===390)await page.screenshot({path:'test-results/pet-sanctuary-'+engine.name()+'-390-mobile.png'});
    await page.locator('#openPetChooser').click();
    await page.locator('#petChooserDialog[open]').waitFor();
    assert.ok(await page.locator('#petChooserDialog .pet-choice').count()>=10,'All native companion choices preserved');
    if(viewport.width===1024)await page.screenshot({path:'test-results/pet-sanctuary-'+engine.name()+'-1024-collection.png'});
    await page.locator('#closePetChooser').click();
    assert.equal(await page.locator('#petChooserDialog').evaluate(e=>e.open),false,'Collection closes');

    const bondBefore=await page.locator('#petBondValue').textContent();
    const action=page.locator('#petCareActions [data-pet-action]:not([disabled])').first();
    if(await action.count()){
      await action.click();
      await page.locator('#petCareStatus').waitFor();
      const bondAfter=await page.locator('#petBondValue').textContent();
      assert.ok(bondAfter!==bondBefore || (await page.locator('#petCareStatus').textContent()).length>0,'Real care action still works');
    }
    assert.deepEqual(errors,[],'No uncaught JS errors');
    passed.push({engine:engine.name(),width:viewport.width,realForms:10,collection:true,care:true,stageHeight:Math.round(sizes.pet.height)});
    await context.close();
   }
   const ctx=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'});
   const legacy=await ctx.newPage();
   await legacy.goto(url+'/pet/?petPreview=0',{waitUntil:'domcontentloaded'});
   assert.equal(await legacy.locator('body.pet-sanctuary-preview').count(),0,'Original Pet page is available only with explicit legacy opt-out');
   await ctx.close();
  }finally{await browser.close()}
 }
 console.log('PET_SANCTUARY_IPAD_QA '+JSON.stringify(passed));
}finally{server.close()}
