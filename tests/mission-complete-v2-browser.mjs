import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const root=process.cwd(),mime={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png',
 '.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'
};
const server=createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  let name=decodeURIComponent(u.pathname);
  if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  const data=fs.readFileSync(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
fs.mkdirSync('test-results',{recursive:true});
const reports=[],failures=[];
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   for(const vp of [{width:1560,height:900},{width:1280,height:800},
      {width:834,height:1112},{width:390,height:844}]){
    const ctx=await browser.newContext({viewport:vp,locale:'en-GB',
      timezoneId:'Europe/London',hasTouch:vp.width<1000});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      // The live React router must still load on real Practice + Home routes.
      for(const route of ['/study/chemistry/practise/','/study/latin/practise/']){
       const pageRes=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:35000});
       assert.equal(pageRes.status(),200,route+' should load');
       await page.waitForFunction(()=>window.__luxAppReady===true&&
         document.querySelector('main')?.textContent?.length>70,
         null,{timeout:30000});
       assert.equal(await page.locator('link[href*="mission-complete-v2-20261010.css"]').count(),1);
       const sessions=await page.request.get(base+'/assets/session-reflection-20261004.js');
       assert.equal(sessions.status(),200);
       assert.match(await sessions.text(),/lux-session-rewards-v2/);
      }
      const asset=await page.request.get(base+'/assets/journey-navigation-ui-20261004.js');
      assert.match(await asset.text(),/data-mission-save-status/);
      await page.addScriptTag({url:'/assets/mission-complete-v2-core-20261010.js'});
      const states=await page.evaluate(()=>{
       const today='2026-10-10';
       const row=(id,p)=>({id,title:id,progress:p,target:10,href:'/study/latin/practise/?daily=1&task='+id});
       const mk=p=>({today,xp:60,daily:[row('latin-vocab',p),row('french-vocab',0)]});
       const fake={
        day:()=>today,withReviewCredits:s=>s,safeHref:h=>h.startsWith('/study/'),
        completion:(s,_,id)=>{
         const task=s.daily.find(x=>x.id===id),next=s.daily.find(x=>x.progress<x.target&&x.id!==id);
         return task?{task,done:task.progress>=task.target,
          completed:s.daily.filter(x=>x.progress>=x.target).length,
          total:s.daily.length,next,remaining:Math.max(0,task.target-task.progress)}:null;
        }
       };
       const m=window.LuxMissionCompleteV2,href='/study/latin/practise/?daily=1';
       const task='latin-vocab';
       const local=window.localStorage;
       const previous=local.getItem('lux-scholar-garden-v1');
       let output={};
       try{
        local.removeItem('lux-scholar-garden-v1');
        output.before=m.verify(mk(10),href,task,today,fake,local).state;
        local.setItem('lux-scholar-garden-v1',JSON.stringify({state:mk(8)}));
        output.partial=m.verify(mk(10),href,task,today,fake,local).verified;
        local.setItem('lux-scholar-garden-v1',JSON.stringify({state:mk(10)}));
        const saved=m.verify(mk(10),href,task,today,fake,local);
        output.saved=saved.state;output.next=m.isValidNext(saved.data,fake);
       }finally{
        if(previous==null)local.removeItem('lux-scholar-garden-v1');
        else local.setItem('lux-scholar-garden-v1',previous);
       }
       return output;
      });
      assert.deepEqual(states,{before:'unverified',partial:false,saved:'complete',next:true});
      // Render the actual mission styles as a DOM smoke fixture, independent of
      // any test-only XP or daily credit changes.
      await page.evaluate(()=>{
       const fixture=document.createElement('section');
       fixture.id='mission-smoke-fixture';fixture.className='lux-mission-v2 is-complete is-celebrating';
       fixture.style.maxWidth='740px';
       fixture.innerHTML='<p class="lux-mission-eyebrow-v2">TODAY’S QUEST · Chemistry</p>'+
        '<h2>Mission Complete!</h2>'+
        '<p class="lux-mission-message-v2">Saved and counted towards today’s tasks</p>'+
        '<div class="lux-mission-track-head-v2"><strong>Today’s Journey</strong><span>6 / 10 tasks</span></div>'+
        '<progress max="10" value="6"></progress>'+
        '<div class="lux-mission-stars-v2">✦ ✦ ✦ ✦ ✦ ✦ ✧ ✧ ✧ ✧</div>'+
        '<p class="lux-mission-save-v2">✓ Progress saved on this device</p>'+
        '<a href="/study/latin/practise/" class="lux-mission-cta-v2">Next mission →</a>';
       document.querySelector('main')?.prepend(fixture);
      });
      const geom=await page.locator('#mission-smoke-fixture').boundingBox();
      const cta=await page.locator('#mission-smoke-fixture a').boundingBox();
      assert.ok(geom&&cta&&cta.width>200&&cta.height>=44);
      assert.ok(cta.y+cta.height<=geom.y+geom.height+1,'Next mission not clipped');
      await page.screenshot({path:'test-results/mission-v2-'+engine+'-'+vp.width+'.png',fullPage:false});
      const homeRes=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
      assert.equal(homeRes.status(),200);
      await page.waitForFunction(()=>window.__luxAppReady===true&&
         document.querySelector('main')?.textContent?.length>100,
         null,{timeout:30000});
      assert.equal(await page.locator('link[href*="mission-complete-v2-20261010.css"]').count(),0,
       'Home does not get new result-only stylesheet');
      // WebKit can report aborted assessment-bank fetches from pages navigated
      // away from during this smoke sequence. Treat those as nonfatal network
      // interruptions; still fail on genuine component crashes and exceptions.
      const fatal=errors.filter(x=>!x.includes('due to access control checks.'));
      if(fatal.length)throw Error('Browser errors: '+fatal.slice(0,3).join('; '));
      reports.push({engine,viewport:vp.width,practice:true,home:true,saveVerification:states.saved});
    }catch(e){failures.push({engine,viewport:vp.width,message:e.message,errors});
       await page.screenshot({path:'test-results/mission-FAILED-'+engine+'-'+vp.width+'.png'}).catch(()=>{});
    }finally{await ctx.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>server.close(ok))}
console.log('MISSION_COMPLETE_BROWSER_QA '+JSON.stringify({reports,failures}));
assert.deepEqual(failures,[],'Practice, Mission Complete and Home must render in Chromium and iPad WebKit');
