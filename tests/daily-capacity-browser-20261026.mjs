import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await (process.env.BROWSER==='webkit'?webkit:chromium).launch({headless:true});const page=await browser.newPage({viewport:{width:834,height:1194},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(2000);
const watchdog=setTimeout(()=>{console.error('Browser capacity check timed out');process.exit(1)},240000);
const result=await page.evaluate(async()=>{
const m=await import('/assets/index-BLVOhKhN.js?v=20261026-dailyweak1&ux=20261013-corrections2&uxfix=20261022-priority-ux1&capacity=20261026-v1');
const {dailyTopicPool}=await import('/assets/daily-capacity-scope-20261026.js');
const {extendDailyCapacity}=await import('/assets/daily-supplement-20261026.js');
const {fillDailyLockedQuestions}=await import('/assets/daily-locked-question-fallback-20261021.js');
const cat=await (await fetch('/content/catalog.json')).json();let banks=new Map();
for(let i=0;i<cat.topics.length;i+=8){await Promise.all(cat.topics.slice(i,i+8).map(async t=>{try{banks.set(t.topicId,extendDailyCapacity(m.lt(await m.at(t.topicId),{includePreview:false})))}catch(e){banks.set(t.topicId,[]);}}));}
const rows=cat.topics.filter(t=>t.status==='enabled'&&t.enabled>0&&t.subject!=='english').map(t=>{
const topics=dailyTopicPool(cat.topics.filter(x=>x.subject===t.subject&&x.year===t.year),t.topicId);
const pool=topics.flatMap(t=>banks.get(t.topicId)||[]);const own=banks.get(t.topicId)||[];
const options={locked:true,mode:'mastery',size:20,topicId:t.topicId,subject:t.subject,correctIds:new Set()};
const selected=fillDailyLockedQuestions([],pool,options,m.rankAdaptiveQuestions,(x,mode,n)=>x.slice(0,n));
const depleted=fillDailyLockedQuestions([],pool,{...options,correctIds:new Set(own.map(q=>q.id))},m.rankAdaptiveQuestions,(x,mode,n)=>x.slice(0,n));
return {id:t.topicId,subject:t.subject,own:own.length,related:pool.length,selected:selected.length,afterOwnExhausted:depleted.length};
});return {rows,daily:m.C.getState().daily};
});fs.writeFileSync(`qa/runtime-capacity-${process.env.BROWSER||'chromium'}.json`,JSON.stringify({...result,errors},null,2));console.log(JSON.stringify({short:result.rows.filter(x=>x.selected<20),depletedShort:result.rows.filter(x=>x.afterOwnExhausted<20),errors},null,2));await page.screenshot({path:`qa/daily-capacity-${process.env.BROWSER||'chromium'}.png`,fullPage:true});await browser.close();clearTimeout(watchdog);assert.deepEqual(result.rows.filter(x=>x.selected<20),[]);assert.deepEqual(errors,[]);
