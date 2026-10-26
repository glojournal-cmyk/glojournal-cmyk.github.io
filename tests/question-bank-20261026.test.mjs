import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read = name => JSON.parse(fs.readFileSync('content/topics/'+name+'.json','utf8'));
function inspect(name, oldCount, n, expectedFormats) {
 const bank=read(name);
 assert.equal(bank.questions.length,n);
 assert.equal(bank.enabled,bank.questions.filter(q=>q.status==='enabled').length);
 assert.equal(bank.preview,bank.questions.filter(q=>q.status==='preview').length);
 assert.equal(bank.disabled,bank.questions.filter(q=>q.status==='disabled').length);
 const ids=bank.questions.map(q=>q.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(new Set(bank.questions.map(q=>JSON.stringify([q.prompt,q.stimulus,q.format]))).size,n);
 assert.equal(bank.questions.filter(q=>q.id.includes('20261026')).length,n-oldCount);
 for(const q of bank.questions){
  assert.ok(q.id&&q.conceptId&&q.prompt&&q.answer,'incomplete question: '+q.id);
  if(q.format==='mark_points'){
   assert.equal(q.answer.totalMarks,q.answer.markPoints.length,q.id);
   assert.ok(q.answer.markPoints.every(x=>typeof x==='string'&&x.trim()),'mark scheme must match live string-array scorer: '+q.id);
   assert.equal(q.answer.manualReviewFallback,true,q.id);
  }else if(q.format!=='mc_single')assert.ok(q.answer.accepted?.length,q.id);
 }
 for(const [key,count]of Object.entries(expectedFormats))
  assert.equal(bank.formats[key],count);
 return bank;
}
test('Latin cases: preserves five original IDs and upgrades to 20 high-utility prompts',()=>{
 const b=inspect('la-y8-case-role-introduction',5,20,{
  mc_single:5,typed_equivalent:11,controlled_translation:3,mark_points:1
 });
 for(let i=1;i<=5;i++)assert.ok(b.questions.some(q=>q.id==='la-y8-src-24jul-case-intro-'+i));
 assert.ok(b.questions.filter(q=>q.status==='enabled'&&q.format!=='mc_single').length>=15);
 const inherited = new Set(b.questions.slice(0,5).map(q=>q.conceptId));
 const supplements = b.questions.filter(q=>q.id.startsWith('la-y8-case-role-supplement-20261026-'));
 assert.equal(supplements.length,15);
 assert.equal(new Set(b.questions.map(q=>q.conceptId)).size,20,'independent case-role tasks must not reserve the same question opportunity');
 for (const q of supplements) assert.ok(inherited.has(q.sourceConceptId),'supplement must retain original grammar-case source linkage: '+q.id);
});
test('Biology mixed: retains old 12, adds short application and 4 rubric items',()=>{
 const b=inspect('bio-y8-mixed-exam',12,20,{
  typed_exact:12,typed_equivalent:4,mark_points:4
 });
 for(let i=1;i<=12;i++)assert.ok(b.questions.some(q=>q.id==='bio-y8-mixed-review-'+i));
 assert.ok(b.questions.filter(q=>q.status==='enabled'&&q.format==='mark_points').every(q=>q.answer.totalMarks>=3));
});
