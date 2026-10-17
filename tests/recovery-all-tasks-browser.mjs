import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    let name=decodeURIComponent(url.pathname);if(name.endsWith('/'))name+='index.html';
    const file=path.resolve(root,'.'+name);
    if(!file.startsWith(root+path.sep))throw Error('outside');
    const buf=fs.readFileSync(file);
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(buf);
  }catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
try {
 for(const launcher of [chromium,webkit]){
  const browser=await launcher.launch({headless:true});
  try {
   const page=await browser.newPage({viewport:{width:834,height:1112},hasTouch:launcher===webkit,timezoneId:'Europe/London'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__luxAppReady===true,{},{timeout:40000});
   const date=await page.evaluate(async()=>{
     const {C:store,Ut:todayKey}=await import('/assets/index-BLVOhKhN.js');
     const today=todayKey();
     const yesterday=new Date(Date.parse(today+'T12:00:00Z')-86400000).toISOString().slice(0,10);
     const log={...(store.getState().dailyLog||{})};delete log[yesterday];
     store.setState({dailyLog:log,recoveryTaskByDay:{},recoveryVocabByDay:{}});
     return yesterday;
   });
   await page.waitForSelector('#lux-recovery-date');
   await page.locator('#lux-recovery-date').selectOption(date);
   const before=await page.evaluate(()=>JSON.stringify(window.__luxStore.getState().daily));
   await page.getByRole('button',{name:'Prepare ten recovery tasks'}).click();
   await page.waitForFunction(d=>window.__luxStore?.getState().dailyLog?.[d]?.tasks?.length===10,date);
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__luxStore.getState().daily)),before);
   assert.equal((await page.evaluate(d=>window.__luxStore.getState().dailyLog[d],date)).done,0);
   await page.getByRole('button',{name:/Water recovery seedling/}).click();
   await page.waitForFunction(d=>window.__luxStore.getState().dailyLog[d]?.tasks.find(t=>t.id==='tend-garden')?.done===true,date);
   assert.equal((await page.evaluate(d=>window.__luxStore.getState().dailyLog[d],date)).done,1);
   await page.getByRole('button',{name:'Play a game to recover →'}).click();
   await page.waitForURL(/\/play/,{timeout:30000});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   const game=await page.evaluate(d=>{
     const store=window.__luxStore, games=store.getState().games||{};
     const gameId=Object.keys(games).find(x=>x!=='pe-circuit')||'verbum-match';
     store.getState().recordGame(gameId,100,2,1);
     const s=store.getState();
     return {done:s.dailyLog[d]?.tasks.find(t=>t.id==='play-game')?.done,
       pending:s.recoveryPendingGame,credited:s.dailyLog[d]?.done};
   },date);
   assert.equal(game.done,true);
   assert.equal(game.pending,null);
   assert.equal(game.credited,2);
   await page.goto(base+'/study/french/practise?daily=1&locked=1&year=8&mode=standard&task=y8-practise&recover='+date,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   const practise=await page.evaluate(d=>{
     const store=window.__luxStore,before=JSON.stringify(store.getState().daily);
     for(let i=0;i<10;i++)store.getState().recordAttempt('recovery-browser-'+i,true,'french',{formal:true,progressionTask:'y8-practise',topicId:'fr-y8-recovery'});
     const s=store.getState();
     return {credited:s.dailyLog[d]?.tasks.find(t=>t.id==='y8-practise')?.done,
       day:s.dailyLog[d]?.done,before,after:JSON.stringify(s.daily)};
   },date);
   assert.equal(practise.credited,true);
   assert.equal(practise.day,3);
   assert.equal(practise.after,practise.before,'practice recovery must not change today daily tasks');
   assert.deepEqual(errors,[],'no browser errors');
   console.log('RECOVERY_FULL_BROWSER '+JSON.stringify({browser:launcher.name(),unopened:true,water:true,game:true,practice:true,todayUnchanged:true}));
   await page.close();
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>server.close(ok))}
