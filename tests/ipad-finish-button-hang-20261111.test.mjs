import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

test('stalled iPad IndexedDB cannot indefinitely block a verified Daily retry receipt', async()=>{
  const store=new Map();
  const item={
    key:'2026-11-11|latin-standard|latin|la-y8-stage-1-vocabulary|standard|15',
    day:'2026-11-11',taskId:'latin-standard',subject:'latin',
    topicId:'la-y8-stage-1-vocabulary',mode:'standard',
    target:15,year:8,at:Date.now(),
    questions:[{id:'q1',topicId:'la-y8-stage-1-vocabulary',formal:true,_repair:false}],
    answers:[{questionId:'q1',correct:false,formal:true,repair:false}]
  };
  store.set('lux-daily-completed-sessions-safe-v1',JSON.stringify([item]));
  globalThis.localStorage={
    getItem:k=>store.get(k)??null,
    setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k)
  };
  // Deliberately simulate the Safari/WebKit failure: open() neither succeeds
  // nor fails, nor emits onblocked. The old implementation hung forever.
  globalThis.indexedDB={open(){return {}}};
  const {readDailyRetryReceipt}=await import('../assets/daily-completed-session-receipts-20261024.js');
  const start=performance.now();
  const result=await readDailyRetryReceipt({
    day:item.day,taskId:item.taskId,subject:item.subject,
    year:item.year,topicId:item.topicId,mode:item.mode
  });
  const ms=performance.now()-start;
  assert.deepEqual(result,item,'Verified local fallback should remain readable');
  assert.ok(ms<3500,'Blocked IndexedDB must resolve promptly, not strand Finish: '+ms+'ms');
  const repeatStart=performance.now();
  assert.deepEqual(await readDailyRetryReceipt({
    day:item.day,taskId:item.taskId,subject:item.subject,
    year:item.year,topicId:item.topicId,mode:item.mode
  }),item);
  assert.ok(performance.now()-repeatStart<250,'Stalled DB must not be retried on every button press');
  delete globalThis.indexedDB;
  delete globalThis.localStorage;
});

test('both session players always catch Finish errors and show a result',()=>{
  for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
    const text=readFileSync(path,'utf8');
    assert.match(text,/Practice Finish failed safely/);
    assert.match(text,/setFinishFailure\(/);
    assert.match(text,/le\(true\)/);
    assert.match(text,/type:`button`,/);
    assert.match(text,/globalThis\.LuxJourney\?\.completion\?\./);
    assert.match(text,/ce&&finishFailure/,'An unverified finish must preserve the old practice draft');
  }
});

test('iPad session continuation cannot remove its draft before a verified receipt',()=>{
  const text=readFileSync('assets/quiz-session-y8fix-20260920.js','utf8');
  assert.match(text,/if\(!receiptSaved\)throw Error/);
  assert.match(text,/if\(!cleared\)\{discardDraft\.current=false;/);
  assert.match(text,/Saving results…/);
});
