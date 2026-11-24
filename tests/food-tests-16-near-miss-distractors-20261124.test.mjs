import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const src=read('qa/food-tests-16-retained-case-concrete-observations-20261124.json');
const draft=read('qa/food-tests-16-near-miss-distractor-proposals-20261124.json');
const bank=read('content/topics/bio-y8-food-tests.json');
const names=['starch','reducing sugar','protein','lipid'];
const mask=s=>{if(s==='none of these four nutrients')return 0;const parts=s.split(', ');assert.equal(new Set(parts).size,parts.length);assert.ok(parts.every(p=>names.includes(p)));return parts.reduce((n,p)=>n|(1<<names.indexOf(p)),0);};
const bits=n=>n.toString(2).replace(/0/g,'').length;
test('16 held proposals: one science key, 32 single and 16 double near misses, no majority-vote shortcut',()=>{
 assert.equal(draft.release,'BLOCKED');
 assert.equal(draft.formalCreditEligible,false);
 assert.deepEqual(draft.counts,{cases:16,options:64,keys:16,singleIndicatorFoils:32,approved:0,twoIndicatorFoils:16});
 assert.equal(draft.items.length,16);
 const counts=[0,0,0,0],mistakes=[0,0,0,0],seen=new Set();
 for(const row of draft.items){
  assert.ok(!seen.has(row.sourceId));seen.add(row.sourceId);
  const original=src.items.find(x=>x.sourceId===row.sourceId);
  const source=bank.questions.find(x=>x.id===row.sourceId);
  assert.ok(original&&source);
  assert.equal(row.prompt,original.proposedPrompt);
  assert.deepEqual(row.oldOptions,source.options);
  assert.deepEqual(row.sourceAnswer,source.answer.accepted);
  assert.equal(row.formalCreditEligible,false);assert.equal(row.academicApproved,false);assert.equal(row.sourceEdited,false);
  assert.equal(canEarnFormalCredit(row.sourceId),false);
  const p=row.prompt;
  const target=(p.includes('iodine blue-black')?1:0)+(/heated Benedict's (green|yellow|orange|brick-red) precipitate/.test(p)?2:0)+(/Biuret (lilac|purple)/.test(p)?4:0)+(p.includes('cloudy white emulsion')?8:0);
  const options=row.newOptions.map(mask);
  assert.equal(new Set(options).size,4);
  assert.deepEqual(options.map((v,i)=>v===target?i:-1).filter(i=>i>=0),[row.keyIndex]);
  assert.equal(mask(source.answer.accepted[0]),target);
  counts[row.keyIndex]++;
  assert.deepEqual(options.filter((_,i)=>i!==row.keyIndex).map(v=>bits(v^target)).sort(),[1,1,2]);
  assert.ok(names.some((_,j)=>options.filter(v=>v&(1<<j)).length===2),'no unique bitwise majority key');
  for(let i=0;i<4;i++){
   const reason=row.optionReasons[i];assert.equal(reason.text,row.newOptions[i]);assert.ok(reason.reason.length>15);
   if(i===row.keyIndex){assert.equal(reason.kind,'key');continue;}
   const difference=options[i]^target;
   const flipped=names.filter((_,j)=>difference&(1<<j));
   assert.deepEqual([...reason.nutrients].sort(),[...flipped].sort());
   for(const n of flipped)mistakes[names.indexOf(n)]++;
  }
 }
 assert.deepEqual(counts,[4,4,4,4]);
 assert.ok(mistakes.every(n=>n>0));
 assert.ok(draft.items.some((q,i)=>i>=4&&q.keyIndex!==draft.items[i-4].keyIndex),'no repeated four-position cycle');
});
