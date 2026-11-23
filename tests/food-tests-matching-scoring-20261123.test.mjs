// QA-only score arithmetic acceptance; DOES NOT authorise Food Tests credit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=JSON.parse(read('content/topics/bio-y8-food-tests.json'));
const question=source.questions.find(q=>q.id==='bio-y8-app-food-test-match');
if(!question)throw Error('Missing original four-pair matching item');
const bundles=['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js'];
for(const bundle of bundles){
 test(bundle+': actual quiz scorer yields exactly 0..4 independently correct matches',()=>{
  const src=read(bundle),start=src.indexOf('function B(e,t,n,r){');
  const end=src.indexOf('function ',start+30);
  assert.ok(start>0&&end>start&&end-start<12000,bundle+' parse scorer');
  const body=src.slice(start,end);
  const score=new Function('L','I',body+'\nreturn B;')(q=>q.answer?.modelAnswer||'',q=>q.answer?.accepted||[]);
  const pairs=question.answer.pairs;
  assert.equal(pairs.length,4);
  assert.equal(question.answer.totalMarks,4);
  for(let earned=0;earned<=4;earned++){
   const choices=Object.fromEntries(pairs.map((pair,i)=>[
    pair.left,i<earned?pair.right:pairs[(i+1)%4].right
   ]));
   const result=score(question,'biology answers','biology',{pairs:choices});
   assert.equal(result.score,earned,bundle+' / score '+earned);
   assert.equal(result.total,4,bundle+' / total '+earned);
   assert.equal(result.ok,earned===4,bundle+' / all-complete state '+earned);
   assert.equal(result.errorKind,earned===4?'none':earned>0?'partial':'wrong');
  }
 });
}
test('matching partial credit does not unlock an unapproved academic topic',()=>{
 assert.equal(source.questions.length,143);
 assert.equal(question.status,'enabled','historical source status is not academic approval');
 const gate=read('assets/food-tests-qa-credit-gate-20261122.js');
 assert.ok(gate.includes('bio-y8-food-tests'));
 assert.ok(gate.includes('isFoodTestsQaHeld'));
 // A source status and credit gate are not the same. No score release is
 // authorised by a correct four-pair calculator.
});
