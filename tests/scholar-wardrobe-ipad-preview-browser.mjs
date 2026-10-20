import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';

const root=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  let name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile())throw Error('Not found');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
fs.mkdirSync('test-results',{recursive:true});
const report=[];
try{
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  for(const viewport of [{width:1024,height:768},{width:834,height:1112},{width:390,height:844}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   await page.goto(base+'/scholar/?scholarPreview=1',{waitUntil:'domcontentloaded'});
   await page.locator('body.scholar-wardrobe-preview').waitFor({timeout:25000});
   await page.locator('.scholar-preview-bottom-nav a').first().waitFor({timeout:25000});
   await page.locator('.scholar-wardrobe-tabs button').first().waitFor({timeout:25000});
   await page.locator('.scholar-wardrobe-stage img[alt^="Scholar in "]').waitFor({timeout:25000});
   await page.locator('.scholar-wardrobe-closet button').first().waitFor({timeout:25000});
   assert.equal(await page.locator('.scholar-preview-bottom-nav a').count(),7,'Seven real app destinations');
   assert.deepEqual((await page.locator('.scholar-preview-bottom-nav a').allTextContents()).map(s=>s.trim()),
     ['Home','Study','Play','Garden','Pet','Assessment','Scholar'],'Match approved global nav order');
   assert.equal(await page.locator('.scholar-preview-bottom-nav a[href="/scholar"][aria-current="page"]').count(),1,'Scholar tab active');
   assert.deepEqual((await page.locator('.scholar-wardrobe-tabs button').allTextContents()).map(s=>s.trim()),
     ['Wardrobe','Collection','Achievements','Settings'],'Preserve four real scholar tabs');
   const outfitCount=await page.locator('.scholar-wardrobe-closet>div.mt-4.grid>button').count();
   assert.ok(outfitCount>=25,'Original wardrobe assets and requirements remain');
   assert.ok(await page.locator('.scholar-wardrobe-stage img[alt^="Scholar in "]').isVisible(),'Full body of original girl visible');
   assert.ok(await page.locator('.scholar-wardrobe-closet button:has-text("Day Uniform")').count()>0,'Original equipped school uniform kept');
   assert.ok(await page.locator('.scholar-wardrobe-closet button:has-text("Cardigan")').count()>0,'Original locked costume available');
   const positions=await page.evaluate(()=>{
     const rect=selector=>{
       const d=document.querySelector(selector).getBoundingClientRect();
       return {x:d.x,y:d.y,width:d.width,height:d.height,bottom:d.bottom,left:d.left,right:d.right};
     };
     return {stage:rect('.scholar-wardrobe-stage'),closet:rect('.scholar-wardrobe-closet'),
       nav:rect('.scholar-preview-bottom-nav'), tabs:rect('.scholar-wardrobe-tabs'),
       main:rect('main'),bodyWidth:document.documentElement.scrollWidth};
   });
   console.log(engine.name()+' '+viewport.width+' scholar-layout '+JSON.stringify(positions));
   assert.ok(positions.bodyWidth<=viewport.width+5,'No horizontal page overflow');
   if(viewport.width===1024){
     assert.ok(positions.closet.x>positions.stage.right-4,'Live girl and closet side-by-side');
     assert.ok(positions.stage.bottom<positions.nav.y-6,'Character full body above nav');
     assert.ok(positions.closet.bottom<positions.nav.y-6,'Wardrobe panel above nav');
     assert.ok(Math.abs(positions.nav.x+positions.nav.width/2-viewport.width/2)<5,'Footer centered');
     assert.ok(positions.stage.height>=450,'Full size girl rather than tiny thumbnail');
     await page.screenshot({path:'test-results/scholar-'+engine.name()+'-1024-wardrobe.png',animations:'disabled'});
   }else if(viewport.width===834){
     await page.screenshot({path:'test-results/scholar-'+engine.name()+'-834-portrait.png',animations:'disabled'});
   }else{
     await page.screenshot({path:'test-results/scholar-'+engine.name()+'-390-phone.png',animations:'disabled'});
   }
   const wardrobe=page.getByRole('button',{name:'Wardrobe',exact:true});
   const collection=page.getByRole('button',{name:'Collection',exact:true});
   const achievements=page.getByRole('button',{name:'Achievements',exact:true});
   const settings=page.getByRole('button',{name:'Settings',exact:true});
   await collection.click();
   await page.waitForTimeout(350);
   assert.equal(await page.getByRole('button',{name:'Collection',exact:true}).count(),1,'Collection selection works');
   if(viewport.width===1024)await page.screenshot({path:'test-results/scholar-'+engine.name()+'-1024-collection.png',animations:'disabled'});
   await achievements.click();
   await page.waitForTimeout(350);
   if(viewport.width===1024)await page.screenshot({path:'test-results/scholar-'+engine.name()+'-1024-achievements.png',animations:'disabled'});
   await settings.click();
   await page.waitForTimeout(350);
   if(viewport.width===1024)await page.screenshot({path:'test-results/scholar-'+engine.name()+'-1024-settings.png',animations:'disabled'});
   await wardrobe.click();
   await page.locator('.scholar-wardrobe-stage img[alt^="Scholar in "]').waitFor({timeout:15000});
   const dayName=await page.locator('.scholar-wardrobe-stage img[alt^="Scholar in "]').getAttribute('alt');
   // Use a genuine interactive background option. The actual React handler,
   // not our CSS, must change the stage and restore its state on reload.
   await page.getByRole('button',{name:'Classroom',exact:true}).click();
   await page.waitForTimeout(350);
   const classroomSrc=await page.locator('.scholar-wardrobe-stage>img').first().getAttribute('src');
   assert.ok(classroomSrc?.includes('classroom'),'Backgrounds control changes real stage');
   assert.equal(await page.locator('.scholar-wardrobe-stage img[alt^="Scholar in "]').getAttribute('alt'),dayName,
     'Changing background must not alter current outfit');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.scholar-wardrobe-stage>img').first().waitFor({timeout:25000});
   const afterReload=await page.locator('.scholar-wardrobe-stage>img').first().getAttribute('src');
   assert.ok(afterReload?.includes('classroom'),'Background selection survives reload');
   assert.ok(await page.locator('.scholar-wardrobe-closet').count()===1,'Live Wardrobe restored on reload');
   assert.deepEqual(errors,[],'No runtime JavaScript errors on page');
   report.push({engine:engine.name(),width:viewport.width,outfits:outfitCount,backgroundPersisted:true});
   await context.close();
  }
  const ctx=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'});
  const page=await ctx.newPage();
  await page.goto(base+'/scholar/?scholarPreview=0',{waitUntil:'domcontentloaded'});
  await page.locator('main').waitFor();
  assert.equal(await page.locator('body.scholar-wardrobe-preview').count(),0,'Legacy Scholar available without redesign');
  assert.equal(await page.locator('.scholar-preview-bottom-nav').count(),0,'No duplicate nav on original page');
  await ctx.close();
 }finally{await browser.close();}
}
console.log('SCHOLAR_IPAD_PREVIEW_QA '+JSON.stringify(report));
}finally{server.close();}
