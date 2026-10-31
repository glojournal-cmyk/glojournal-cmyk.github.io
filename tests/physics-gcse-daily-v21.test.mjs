import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  convertGcsePhysicsDaily, extendGcsePhysicsDaily,
  includeGcsePhysicsDaily, isGcsePhysicsDaily
} from '../assets/physics-gcse-v21-daily-20261031.js';

const raw=readFileSync(new URL('../content/physics-gcse-mastery-v21/bank.json',import.meta.url),'utf8');
const bank=JSON.parse(raw);
const context=(topicId='phys-y9-p2')=>({
  subject:'physics',year:9,topicId,taskId:'year9-light',locked:true
});
const all=bank.groups.flatMap(group=>group.questions);
const selected=(n=15)=>Array.from({length:n},(_,i)=>({
  id:'existing-phys-'+i,topicId:'phys-y9-p2',format:'mc_single'
}));

test('all 90 V2.1 source questions remain intact, 30 per topic',()=>{
  assert.equal(all.length,90);
  assert.deepEqual(bank.groups.map(g=>g.questions.length),[30,30,30]);
  assert.equal(new Set(all.map(q=>q.id)).size,90);
});

test('existing daily is protected outside locked Year9 Physics assignment',async()=>{
  for(const input of [
    {...context(),subject:'chemistry'}, {...context(),year:8},
    {...context(),locked:false}, {...context(),taskId:'y8-mastery-a'},
    {...context(),topicId:'phys-y9-p14'}
  ]){
    assert.equal(isGcsePhysicsDaily(input),false);
    const original=selected();
    assert.equal(await extendGcsePhysicsDaily(original,input,()=>{throw Error('unreachable')}),original);
  }
});

test('only objectively markable question types enter the old Daily',()=>{
  let count=0;
  for(const id of ['phys-y9-p2','phys-y9-p4','phys-y9-p5']){
    const rows=convertGcsePhysicsDaily(bank,id);
    assert.ok(rows.length>=3);
    count+=rows.length;
    for(const q of rows){
      assert.ok(['calculation','mc_single'].includes(q.format));
      assert.ok(q.id.startsWith('phys-gcse-daily-v21-'));
      assert.equal(q.topicId,id);
      assert.equal(q.year,9);
      assert.equal(q.formal,true);
      assert.equal(q.status,'enabled');
      assert.ok(!q.diagram);
      if(q.format==='mc_single')assert.ok(q.options.includes(q.answer.accepted[0]));
      else {
        assert.equal(typeof q.answer.value,'number');
        assert.ok(q.answer.units.length);
        assert.ok(q.answer.tolerance>=0);
      }
    }
  }
  assert.equal(count,20,'20 objective prompts, 70 open-response/figure/sig-fig prompts stay out of automatic Daily scoring');
});

test('locked Year9 physics 15-answer task keeps exactly 15, replacing at most two',async()=>{
  const original=selected();
  const loaded=await extendGcsePhysicsDaily(original,context(),async()=>bank);
  assert.equal(loaded.length,original.length+convertGcsePhysicsDaily(bank,'phys-y9-p2').length);
  const mixed=includeGcsePhysicsDaily(original,loaded,15,context());
  assert.equal(mixed.length,15);
  assert.equal(new Set(mixed.map(q=>q.id)).size,15);
  assert.equal(mixed.filter(q=>q.id.startsWith('phys-gcse-daily-v21-')).length,2);
  assert.equal(original.length,15,'do not mutate preselected tasks');
  assert.equal(original.every(q=>q.id.startsWith('existing-')),true);
});

test('saved correct questions do not reappear after Daily filter',()=>{
  const original=selected();
  const newItems=convertGcsePhysicsDaily(bank,'phys-y9-p4');
  const chosen=newItems[0];
  const freshPool=[...original,...newItems.filter(q=>q.id!==chosen.id)];
  const mixed=includeGcsePhysicsDaily(original,freshPool,15,context('phys-y9-p4'));
  assert.ok(!mixed.some(q=>q.id===chosen.id));
});

test('bank network error fails open with unchanged Daily questions',async()=>{
  const original=selected();
  const result=await extendGcsePhysicsDaily(original,context(),async()=>{throw new Error('offline');});
  assert.equal(result,original);
});

test('existing task receipts, rewards, and Home planner are not edited',()=>{
  const adapter=readFileSync(new URL('../assets/physics-gcse-v21-daily-20261031.js',import.meta.url),'utf8');
  const route=readFileSync(new URL('../assets/study._subject.practise-D_PWgUd7.js',import.meta.url),'utf8');
  assert.ok(route.includes('await extendGcsePhysicsDaily'));
  assert.ok(route.includes('includeGcsePhysicsDaily(chosen,t,W'));
  assert.ok(route.includes('if(t)B(augmented)'));
  assert.ok(!/localStorage|sessionStorage|award\(|recordAttempt\(|dailyLog\s*=|\.progress\s*=/.test(adapter));
  assert.ok(!route.includes('B(extendYear9ParticleQuestions(e.flatMap')); // original shadowed subject bug fixed
});
