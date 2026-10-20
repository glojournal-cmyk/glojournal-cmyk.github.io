import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';

const root=process.cwd(),out='test-results/garden-academy-preview';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.png':'image/png','.webp':'image/webp','.json':'application/json',
 '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  if(pathname.endsWith('/'))pathname+='index.html';
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))throw Error('outside root');
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  const buf=fs.readFileSync(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(buf);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
async function run(engine,runner,viewport){
 const browser=await runner.launch({headless:true});
 const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[],bad=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)bad.push([r.status(),r.url()]);});
 try{
  await page.goto(origin+'/garden/?gardenPreview=1',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#lux-garden-academy-preview .lux-garden-item').first().waitFor({timeout:30000});
  await page.waitForFunction(()=>document.querySelector('.lux-garden-map-preview')&&
    getComputedStyle(document.querySelector('.lux-garden-map-preview')).position==='fixed');
  await page.waitForFunction(()=>{
    const frame=document.getElementById('lux-garden-academy-preview');
    if(!frame)return false;
    return [...document.querySelectorAll('nav,[role="navigation"]')]
      .filter(n=>!frame.contains(n))
      .every(n=>getComputedStyle(n).display==='none'||n.getBoundingClientRect().height===0);
  },null,{timeout:12000}).catch(async error=>{
    const info=await page.evaluate(()=>({
      htmlClass:document.documentElement.className,
      elements:[...document.querySelectorAll('nav,[role="navigation"]')].map(n=>({
        name:n.className||n.tagName,display:getComputedStyle(n).display,
        inline:n.getAttribute('style'),height:n.getBoundingClientRect().height,
        insideGarden:!!document.getElementById('lux-garden-academy-preview')?.contains(n)
      }))
    }));
    console.log('GARDEN_NATIVE_NAV_DEBUG '+JSON.stringify({engine,viewport,info}));
    throw error;
  });
  const snap=await page.evaluate(()=>{
    const rect=el=>{if(!el)return null;const b=el.getBoundingClientRect();
      return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
    const frame=document.querySelector('#lux-garden-academy-preview');
    const nav=frame.querySelector('.lux-garden-nav');
    const labels=[...nav.querySelectorAll('a')].map(n=>n.textContent);
    const water=frame.querySelector('.lux-water'),basil=frame.querySelector('.lux-basil-box');
    const url=new URL('/assets/index-BLVOhKhN.js?v=20261018-mastery2&ux=20261013-corrections2',location);
    return {navLabels:labels,selected:nav.querySelector('[aria-current="page"]')?.textContent,
      nav:rect(nav),water:rect(water),basil:rect(basil),world:rect(frame.querySelector('.lux-garden-world')),
      stage:frame.querySelector('.lux-garden-stage strong')?.textContent,
      basilText:basil.textContent,waterLabel:water.textContent,disabled:water.disabled,
      scrollWidth:document.documentElement.scrollWidth,frameVisible:getComputedStyle(frame).visibility,
      visibleExtraNavigation:[...document.querySelectorAll('nav,[role="navigation"]')].filter(n=>
        !frame.contains(n)&&getComputedStyle(n).visibility!=='hidden'&&
        n.getBoundingClientRect().height>35).map(n=>n.className||n.id||n.tagName),
      pageWidth:innerWidth,pageHeight:innerHeight,nativeWater:!![...document.querySelectorAll('body>.paper-wash button')].find(b=>/Water the garden|Watered today/.test(b.textContent))};
  });
  assert.equal(snap.navLabels.length,7,'Garden navigation must retain seven items');
  assert.deepEqual(snap.visibleExtraNavigation,[],'Legacy Garden navigation must not show underneath the approved Study rail');
  assert.match(snap.selected,/Garden/);
  assert.match(snap.stage,/Stage [1-4]/,'rendered stage comes from real app');
  assert.match(snap.basilText,/growth: \d \/ 7 steps/,'Basil comes from existing seven-step record');
  assert.equal(snap.nativeWater,true,'native water action must exist');
  assert.ok(snap.scrollWidth<=viewport.width+1,'no horizontal overflow');
  assert.ok(snap.world.width>viewport.width*.9,'garden must be the primary scene');
  assert.ok(snap.water.bottom<=snap.nav.y-5,'Water button must be above the bottom rail');
  assert.ok(snap.water.y>=snap.basil.y-1&&snap.water.bottom<=snap.basil.bottom+1,
    'The Water button must sit inside the Basil panel');
  const art=await page.evaluate(async()=>{
    const ui=document.querySelector('.lux-garden-map-preview'),css=getComputedStyle(ui);
    const image=new Image();image.src='/assets/garden-academy-approved-20261020.jpg';
    await image.decode();
    return{background:css.backgroundImage,loaded:image.naturalWidth>=1400,actualWidth:image.naturalWidth,actualHeight:image.naturalHeight,
      titleOpacity:getComputedStyle(document.querySelector('.lux-garden-title')).opacity};
  });
  assert.ok(art.loaded,'approved illustration must load at full resolution');
  assert.ok(art.background.includes('garden-academy-approved-20261020.jpg'),'do not show old placeholder background');
  assert.equal(art.titleOpacity,'0','do not duplicate the title baked into approved artwork');
  assert.ok(await page.locator('.lux-garden-item').count()===4);
  const stageValue=await page.evaluate(async()=>{
    const mod=await import('/assets/index-BLVOhKhN.js?v=20261018-mastery2&ux=20261013-corrections2');
    const xp=mod.C.getState().xp||0;return {stage:mod.Q(xp).stage,xp};
  });
  assert.ok(snap.stage.startsWith('Stage '+stageValue.stage),'Stage based on saved Scholar XP');
  await page.screenshot({path:path.join(out,engine+'-'+viewport.width+'x'+viewport.height+'-initial.png')});
  await page.locator('.lux-garden-item[data-item="bench"]').click();
  const detail=page.getByRole('dialog',{name:'Wooden Bench'});
  await detail.waitFor({timeout:8000});
  assert.ok((await detail.innerText()).length>25,'Garden objects must show their live unlock requirements');
  await page.getByRole('button',{name:'Close Wooden Bench'}).click();
  await page.getByRole('button',{name:/DECORATIONS/}).click();
  await page.getByRole('dialog',{name:'Garden Decorations'}).waitFor();
  assert.ok(await page.locator('.lux-garden-decor').count()>=4,'real collectible list exists');
  await page.getByRole('button',{name:'Close Garden Decorations'}).click();
  await page.getByRole('button',{name:/GARDEN LOG/}).click();
  await page.getByRole('dialog',{name:'Recent Growth'}).waitFor();
  await page.getByRole('button',{name:'Close Recent Growth'}).click();
  // Native handler remains responsible for watering and its once/day gate.
  const water=page.locator('#lux-garden-academy-preview button.lux-water');
  const before=await page.evaluate(async()=>{
    const m=await import('/assets/index-BLVOhKhN.js?v=20261018-mastery2&ux=20261013-corrections2');
    const s=m.C.getState();return {count:s.waterCount||0,day:s.wateredOn||null};
  });
  if(!snap.disabled){
    await water.click();
    await page.waitForFunction(()=>document.querySelector('#lux-garden-academy-preview .lux-water')?.disabled,{timeout:8000});
    const after=await page.evaluate(async()=>{
      const m=await import('/assets/index-BLVOhKhN.js?v=20261018-mastery2&ux=20261013-corrections2');
      const s=m.C.getState();return {count:s.waterCount||0,day:s.wateredOn||null};
    });
    assert.equal(after.count,before.count+1,'Water only via the native once-daily handler');
    assert.ok(after.day&&after.day!==before.day,'watering date is persisted by native Garden');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#lux-garden-academy-preview .lux-water:disabled').waitFor({timeout:25000});
    const restored=await page.evaluate(async()=>{
      const m=await import('/assets/index-BLVOhKhN.js?v=20261018-mastery2&ux=20261013-corrections2');
      return {count:m.C.getState().waterCount,day:m.C.getState().wateredOn};
    });
    assert.equal(restored.count,after.count,'reload does not duplicate watering or reset progress');
    assert.equal(restored.day,after.day,'watered day survives reload');
  }
  await page.screenshot({path:path.join(out,engine+'-'+viewport.width+'x'+viewport.height+'-after.png')});
  await page.goto(origin+'/garden/?gardenPreview=0',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('body>.paper-wash main',{timeout:15000});
  assert.equal(await page.locator('#lux-garden-academy-preview').count(),0,'native Garden remains available');
  const appErrors=errors.filter(e=>!(engine==='webkit'&&e.includes('/assessment/')&&e.includes('.json due to access control checks.')));
  if(appErrors.length!==errors.length) console.log('GARDEN_BACKGROUND_FETCH_IGNORED '+JSON.stringify({engine,ignored:errors.filter(e=>!appErrors.includes(e))}));
  assert.deepEqual(appErrors,[], 'No Garden-originating JavaScript errors');
  assert.deepEqual(bad,[], 'No missing internal assets');
  results.push({engine,viewport,ok:true,stage:snap.stage,basil:snap.basilText,water:snap.waterLabel});
  console.log('GARDEN_ACADEMY_QA '+JSON.stringify(results.at(-1)));
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]])
  for(const vp of [{width:1024,height:768},{width:1366,height:1024}])
   await run(name,engine,vp);
}finally{server.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2))}
console.log('GARDEN_ACADEMY_QA_SUMMARY '+JSON.stringify({cases:results.length,pass:results.every(x=>x.ok)}));
