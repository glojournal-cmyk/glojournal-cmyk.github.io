import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit} from 'playwright';
const base='https://glojournal-cmyk.github.io',results=[];
const out='test-results/gloria-live-ipad';
fs.mkdirSync(out,{recursive:true});
const routes=['/','/study/latin/practise/','/study/french/practise/','/study/biology/practise/','/study/chemistry/practise/','/study/physics/practise/','/study/english/practise/'];
async function checkFiles(request){
 for(const route of routes){
  const r=await request.get(base+route,{timeout:45000}),html=await r.text();
  assert.equal(r.status(),200,route+' live HTTP');
  assert.ok(html.includes('practice-studio-20261023.js?v=ipad-fit2'),route+' latest runtime');
  assert.ok(html.includes('gloria-practice-stability-20261024.css?v=ipad-fit2'),route+' latest CSS');
  results.push({type:'production-route',route,ok:true});
 }
 const r=await request.get(base+'/assets/gloria-practice-academy-ornaments-20261024.svg');
 assert.equal(r.status(),200,'production vector background HTTP');
 assert.match(await r.text(),/<svg/);
 results.push({type:'production-background',ok:true});
}
async function checkPractice(browser,engine,viewport){
 const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:2,timezoneId:'Europe/London'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/study/french/practise/?year=8&mode=quick&topic=fr-y8-s01-quick-rules',{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForSelector('.lux-practice-view [data-question-id]',{timeout:35000});
  await page.waitForFunction(()=>document.documentElement.classList.contains('lux-daily-ux-ready')&&document.querySelectorAll('#lux-daily-study-nav a').length===7,null,{timeout:15000});
  const info=await page.evaluate(()=>{
   const q=document.querySelector('.lux-practice-view [data-question-id]'),nav=document.getElementById('lux-daily-study-nav');
   const input=q?.querySelector('input,textarea'),form=q?.querySelector('form');
   const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width}};
   return {questionId:q?.dataset.questionId,format:q?.dataset.questionFormat,navCount:nav?.querySelectorAll('a').length,
    navPosition:getComputedStyle(nav).position,nav:rect(nav),form:rect(form),input:rect(input),
    scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
    background:getComputedStyle(document.querySelector('.paper-wash')).backgroundImage};
  });
  assert.ok(info.questionId,'real French question should render');
  assert.equal(info.navCount,7,'seven navigation links');
  assert.equal(info.navPosition,'fixed','nav should be pinned to the bottom and never appear above the question');
  assert.ok(info.nav.top>=viewport.height-120,'nav is at bottom, not top');
  if(info.form?.bottom!==undefined && info.form.bottom<=viewport.height) assert.ok(info.form.bottom<=info.nav.top+4,'form must not be underneath bottom nav');
  assert.ok(info.scrollWidth<=info.viewportWidth+2,'iPad no sideways scroll');
  assert.ok(info.background.includes('gloria-practice-academy-ornaments-20261024.svg'),'vector background applied');
  if(info.input)assert.ok(info.input.width>=130,'typing width usable');
  assert.deepEqual(errors,[],'no live runtime exceptions');
  await page.screenshot({path:path.join(out,engine+'-'+viewport.width+'x'+viewport.height+'.png'),fullPage:true});
  results.push({type:'production-practice',engine,viewport,info,ok:true});
 }catch(e){
  results.push({type:'production-practice',engine,viewport,error:String(e),errors,ok:false});
  await page.screenshot({path:path.join(out,engine+'-'+viewport.width+'x'+viewport.height+'-failure.png'),fullPage:true}).catch(()=>{});
  throw e;
 }finally{await context.close();}
}
let failure=null;
try{
 for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   if(name==='chromium'){
    const ctx=await browser.newContext();
    try{await checkFiles(ctx.request)}finally{await ctx.close()}
   }
   for(const viewport of [{width:1024,height:768},{width:820,height:1180}])
    await checkPractice(browser,name,viewport);
  }finally{await browser.close();}
 }
}catch(e){failure=e;}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,failure:String(failure||'')},null,2))}
if(failure)throw failure;
console.log('GLORIA_LIVE_IPAD_QA '+JSON.stringify({passed:results.length,failed:0}));
