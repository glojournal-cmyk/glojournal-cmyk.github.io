// Synthetic iPad Safari (Playwright WebKit) preservation test: no pupil data.
// Exercises real IndexedDB backup migration, offline reads, reopen and merge.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {webkit} from 'playwright';

const root=process.cwd();
const server=createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){
    res.writeHead(200,{'content-type':'text/html'});
    res.end('<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><title>iPad vault QA</title><body>Safe synthetic QA</body></html>');
    return;
  }
  try{
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep))throw Error('bad path');
    res.writeHead(200,{'content-type':'text/javascript'});
    res.end(fs.readFileSync(file));
  }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port;
const tasks=Array.from({length:10},(_,i)=>({id:i===0?'french-vocab':'task-'+i,
  target:i===0?30:10,progress:i===0?28:i,done:false}));
const state={
  xp:2862,today:'2026-10-30',daily:tasks,
  dailyLog:{'2026-10-29':{date:'2026-10-29',tasks:[{id:'french-vocab',target:30,progress:20}]}},
  dailyCompleteAwarded:{'2026-10-27':true},
  dailyVocabByDay:{'2026-10-30':{french:{items:{q1:true,q2:true}}}},
  recoveryVocabByDay:{'2026-10-29':{french:{originalCount:20,totalNeeded:15,items:{q3:true},completed:false}}},
  recoveryAwarded:{'2026-10-27:french':true},
  formalAttemptLog:[{attemptId:'qa-test-1',day:'2026-10-30',questionId:'q1',correct:true}],
  collectibles:['herb','owl'],medals:['garden-medal'],
  unlockedOutfits:['day','library'],unlockedScenes:['dusk','glasshouse'],
  equippedOutfit:'library',rewardLedgerByDay:{'2026-10-30':{'practice-first':4}},
  gameRewardByDay:{'2026-10-29':{'weekly':1}},
  games:{'quad-circuit':{points:42,stars:[1,2]}},
};
const saved={savedAt:'2026-10-30T12:00:00Z',day:state.today,done:0,total:10,
 data:JSON.stringify({app:'lux-scholar-garden',version:10,state})};
const petSidecar={species:'snow-owl',masteryPoints:144,petLevels:{'moss-hornling':4,'snow-owl':2},unlockedSecrets:{'snow-owl':true},mpLedger:{'synthetic-topic':10},mpTransactions:[]};
const originalPrimary={state,version:10};

try{
 const browser=await webkit.launch({headless:true});
 try{
  for(const viewport of [{width:1024,height:768},{width:1366,height:1024}]){
   const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:2});
   try{
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    const initial=await page.evaluate(async ({saved,petSidecar,originalPrimary})=>{
      const vault=await import('/assets/backup-vault-20261011.js');
      localStorage.setItem('lux-scholar-garden-v1',JSON.stringify(originalPrimary));
      localStorage.setItem('lux-pet-companion-v1',JSON.stringify(petSidecar));
      localStorage.setItem(vault.AUTO_KEY,JSON.stringify(saved,null,2));
      localStorage.setItem(vault.MANUAL_KEY,JSON.stringify(saved));
      const migration=await vault.migrateOldBackups();
      const auto=await vault.readBackup(vault.AUTO_KEY);
      const manual=await vault.readBackup(vault.MANUAL_KEY);
      return {migration,auto,manual,
       localAuto:localStorage.getItem(vault.AUTO_KEY),
       localManual:localStorage.getItem(vault.MANUAL_KEY),
       primary:JSON.parse(localStorage.getItem('lux-scholar-garden-v1')),
       pet:JSON.parse(localStorage.getItem('lux-pet-companion-v1'))};
    },{saved,petSidecar,originalPrimary});
    assert.equal(initial.migration.moved,2);
    assert.equal(initial.migration.failed,0);
    assert.equal(initial.localAuto,null);
    assert.equal(initial.localManual,null);
    assert.deepEqual(initial.auto,saved);
    assert.deepEqual(initial.manual,saved);
    assert.deepEqual(initial.primary,originalPrimary);
    assert.deepEqual(initial.pet,petSidecar);

    await context.setOffline(true);
    const offline=await page.evaluate(async()=>{
      const vault=await import('/assets/backup-vault-20261011.js');
      return {auto:await vault.readBackup(vault.AUTO_KEY),
        primary:JSON.parse(localStorage.getItem('lux-scholar-garden-v1')),
        pet:JSON.parse(localStorage.getItem('lux-pet-companion-v1'))};
    });
    assert.deepEqual(offline.auto,saved,'verified IndexedDB snapshot must be readable offline');
    assert.deepEqual(offline.primary,originalPrimary);
    assert.deepEqual(offline.pet,petSidecar);
    await context.setOffline(false);

    await page.reload();
    const reopened=await page.evaluate(async()=>{
      const vault=await import('/assets/backup-vault-20261011.js');
      return {auto:await vault.readBackup(vault.AUTO_KEY),
        primary:JSON.parse(localStorage.getItem('lux-scholar-garden-v1')),
        pet:JSON.parse(localStorage.getItem('lux-pet-companion-v1'))};
    });
    assert.deepEqual(reopened.auto,saved);
    assert.deepEqual(reopened.primary,originalPrimary);
    assert.deepEqual(reopened.pet,petSidecar);
    for(const field of ['collectibles','medals','unlockedOutfits','unlockedScenes',
      'rewardLedgerByDay','gameRewardByDay','games','recoveryVocabByDay','recoveryAwarded','formalAttemptLog']){
      assert.deepEqual(JSON.parse(reopened.auto.data).state[field],state[field],field+' restored exactly');
    }

    const merged=await page.evaluate(async backup=>{
      const {mergeImportProgress}=await import('/assets/backup-import-safety-20261023.js');
      const current={...backup.state,xp:2980,
        collectibles:['herb','spider'],unlockedOutfits:['day','sport'],
        rewardLedgerByDay:{'2026-10-30':{'practice-first':4}},
        recoveryAwarded:{'2026-10-27:french':true,'2026-10-28:latin':true}};
      return mergeImportProgress(backup,current,(a,b)=>({...b,...a})).backup.state;
    },JSON.parse(saved.data));
    assert.equal(merged.xp,2980,'import must not double XP or reduce higher current XP');
    assert.deepEqual(new Set(merged.collectibles),new Set(['herb','owl','spider']));
    assert.deepEqual(new Set(merged.unlockedOutfits),new Set(['day','library','sport']));
    assert.equal(merged.rewardLedgerByDay['2026-10-30']['practice-first'],4);
    assert.equal(merged.recoveryAwarded['2026-10-27:french'],true);
    assert.equal(merged.recoveryAwarded['2026-10-28:latin'],true);
    assert.deepEqual(errors,[]);
    console.log('IPAD_REWARDS_VAULT_WEBKIT_PASS '+JSON.stringify({viewport,
      checks:['idb verified migration','offline read','reopen','reward and recovery proof preservation','no XP double credit']}));
   }finally{await context.close()}
  }
 }finally{await browser.close()}
}finally{await new Promise(resolve=>server.close(resolve))}
