import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';

const base='https://glojournal-cmyk.github.io';
const out='test-results/live-production-20261030';
mkdirSync(out,{recursive:true});
const results=[];
const requiredRuntime='mpverify=20261030-save-retry3-modeguard2';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let lastError;
for(let attempt=1;attempt<=5;attempt++){
 try{
  const r=await fetch(base+'/?live_probe='+Date.now(),{headers:{'cache-control':'no-cache'}});
  assert.equal(r.status,200,'published Home is HTTP 200');
  const html=await r.text();
  assert.ok(html.includes(requiredRuntime),'live Home still serves an obsolete app runtime');
  results.push({test:'Live published Home HTML',status:200,runtime:requiredRuntime});
  lastError=null;
  break;
 }catch(e){lastError=e;await sleep(6000)}
}
if(lastError)throw lastError;

const cases=[
 {name:'home',path:'/'},
 {name:'french-practice',path:'/study/french/practise/'},
 {name:'latin-practice',path:'/study/latin/practise/'},
 {name:'biology-practice',path:'/study/biology/practise/'},
 {name:'pet',path:'/pet/'},
];
for(const [engineName,browserType,viewport,mobile] of [
 ['chromium-desktop',chromium,{width:1365,height:900},false],
 ['webkit-ipad',webkit,{width:1180,height:820},true],
]){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext({
   viewport,deviceScaleFactor:mobile?2:1,isMobile:mobile,
   hasTouch:mobile,serviceWorkers:'block',locale:'en-GB',
 });
 let page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const item of cases){
   const url=base+item.path+'?live_browser_test='+Date.now();
   const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(resp?.status(),200,engineName+' '+item.name+' HTTP 200');
   await page.waitForTimeout(4500);
   const data=await page.evaluate(()=>{
     const body=document.body?.innerText||'';
     const state=globalThis.__luxStore?.getState?.();
     return {title:document.title,bodyChars:body.length,
       textHead:body.slice(0,340),
       storePresent:!!state,dailyTasks:state?.daily?.length??null,
       visibleButtons:document.querySelectorAll('button').length,
       appRoot:!!document.querySelector('main')};
   });
   await page.screenshot({path:out+'/'+engineName+'-'+item.name+'.png'});
   console.log('LIVE_PAGE',JSON.stringify({engineName,...item,...data}));
   assert.ok(data.bodyChars>55,engineName+' '+item.name+' blank UI: '+JSON.stringify(data));
   assert.ok(data.appRoot,engineName+' '+item.name+' missing app root');
   if(/loading your saved progress/i.test(data.textHead)&&data.bodyChars<170)
     throw Error(engineName+' '+item.name+' stuck on loading screen');
   results.push({test:engineName+' '+item.name,status:resp.status(),...data});
   if(item.name==='home'){
     // Exercise the EXACT published browser modules with 14 archived saved
     // rows. State is synthetic inside the CI browser, never a student's iPad.
     const check=await page.evaluate(async()=>{
       const {dailyHistorySummary,CORE_DAILY_TASK_IDS}=await import('/assets/daily-history-display-20261030.js');
       const {eligibleRecoveryTasks}=await import('/assets/recovery-task-ledger-20261017.js');
       const date='2026-10-29', today='2026-10-30';
       const old=['study-session','year8-long-review','tend-garden','play-game'];
       const tasks=[
         ...CORE_DAILY_TASK_IDS.map((id,i)=>({id,target:10,progress:i<9?10:0,done:i<9})),
         ...old.map(id=>({id,target:1,progress:0,done:false}))
       ];
       const row={date,tasks,total:14,done:9};
       const state={dailyLog:{[date]:row}};
       const before=JSON.stringify(state);
       const h=dailyHistorySummary(row,date);
       const rec=eligibleRecoveryTasks(state,date,today);
       const completed={date,tasks:[
         ...CORE_DAILY_TASK_IDS.map(id=>({id,target:10,progress:10,done:true})),
         ...old.map(id=>({id,target:1,progress:0,done:false}))
       ],total:14,done:10};
       const d=dailyHistorySummary(completed,date);
       return {total:h.total,done:h.done,extra:h.extraSavedRecords,
         eligible:rec.length,unfinished:rec.filter(t=>!t.done).map(t=>t.id),
         completedTotal:d.total,completedDone:d.done,unchanged:before===JSON.stringify(state)};
     });
     assert.deepEqual({total:check.total,done:check.done,extra:check.extra,eligible:check.eligible,
       unfinished:check.unfinished,completedTotal:check.completedTotal,
       completedDone:check.completedDone,unchanged:check.unchanged},
       {total:10,done:9,extra:4,eligible:10,unfinished:['year9-light'],
        completedTotal:10,completedDone:10,unchanged:true});
     results.push({test:engineName+' live 14-row History and 48h Recovery',...check});
     const credit=await page.evaluate(async()=>{
       const {reconcileDailySession}=await import('/assets/daily-session-credit-20261021.js?v=20261026-bio-savefix1&modeguard=20261030-2');
       const day='2026-10-30',topic='bio-y9-cell-structure';
       const task={id:'year9-light',planDate:day,assignedSubject:'biology',
         assignedTopic:topic,assignedYear:9,target:15,progress:0,
         href:'/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task=year9-light&topic='+topic};
       const state={today:day,daily:[task],formalAttemptLog:[],dailyLog:{}};
       const qs=[{id:'q0',formal:true,topicId:topic},{id:'q1',formal:true,topicId:topic}];
       const basic={day,taskId:task.id,subject:'biology',year:9,mode:'standard',questions:qs,
         answers:[{questionId:'q0',correct:true,formal:true},{questionId:'q1',correct:false,formal:true}]};
       const valid=reconcileDailySession(state,basic);
       const wrongMode=reconcileDailySession(state,{...basic,mode:'mastery'});
       return {score:valid.progress,target:valid.target,changed:valid.changed,
         wrongModeAccepted:wrongMode.changed,wrongModeReason:wrongMode.reason};
     });
     assert.equal(credit.score,1);
     assert.equal(credit.target,15);
     assert.equal(credit.changed,true);
     assert.equal(credit.wrongModeAccepted,false);
     results.push({test:engineName+' live correct-only and Biology mode lock',...credit});
   }
 }
 const severe=errors.filter(m=>!/ResizeObserver loop/i.test(m));
 results.push({test:engineName+' uncaught browser errors',count:severe.length,
   messages:severe.slice(0,12)});
 if(severe.length)throw Error(engineName+' app had uncaught JS errors: '+JSON.stringify(severe.slice(0,5)));
 await context.close();await browser.close();
}
writeFileSync(out+'/results.json',JSON.stringify({base,checkedAt:new Date().toISOString(),results},null,2));
console.log('LIVE_PRODUCTION_IPAD_SMOKE_PASSED '+JSON.stringify(results));
