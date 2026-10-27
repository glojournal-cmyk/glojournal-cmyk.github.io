// Read-only V2 capacity stress using real Year 8 source banks, NOT the user's learner state.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planGardenV2Day,V2_DAILY_QUOTAS} from '../src/garden-v2/daily-planner.mjs';
const names=[
 'la-y8-case-role-introduction','bio-y8-mixed-exam','bio-y8-continuous-variation',
 'bio-y8-correlation','bio-y8-ber','bio-y8-dna-structure',
 'bio-y8-fats-cholesterol','bio-y8-genetic-disorders',
 'bio-y8-nutrition-labels','bio-y8-punnett-squares'
];
const banks=names.map(name=>JSON.parse(fs.readFileSync('content/topics/'+name+'.json','utf8')));
const tasks=()=>banks.map((bank,i)=>({id:'v2-research-'+i,target:V2_DAILY_QUOTAS[i],
 candidates:bank.questions.filter(q=>q.status==='enabled'&&q.formal!==false&&!q._repair)}));
test('real Year 8 source banks disclose unavailable 163 daily slots instead of fabricating success',()=>{
 const r=planGardenV2Day(tasks());
 assert.equal(r.requested,163);
 assert.equal(r.status,'PARTIAL_READY','this bank-to-task sample lacks enough formal vocabulary-sized pools');
 assert.ok(r.shortage>0);
 assert.equal(r.assigned+r.shortage,163);
 const ids=r.rows.flatMap(x=>x.questionIds);
 assert.equal(new Set(ids).size,ids.length);
 console.log('GARDEN_V2_REAL_BANK_DIAGNOSTIC '+JSON.stringify({
  sampleTopicIds:banks.map(b=>b.topicId),requested:163,assigned:r.assigned,shortage:r.shortage,
  rowShortages:r.rows.map(x=>({id:x.id,shortage:x.shortage})),
  caveat:'Illustrative Year 8 topic-file mapping only; not official V2 task mappings or learner eligibility'}));
});
test('correct-history exclusions reduce actual eligible slots without replaying credited IDs',()=>{
 const source=tasks(),credited=source[0].candidates.slice(0,5).map(q=>q.id);
 const r=planGardenV2Day(source,{previouslyCreditedIds:credited});
 const all=new Set(r.rows.flatMap(x=>x.questionIds));
 assert.ok(credited.every(id=>!all.has(id)));
 assert.equal(r.assigned+r.shortage,163);
 assert.equal(r.status,'PARTIAL_READY');
});
