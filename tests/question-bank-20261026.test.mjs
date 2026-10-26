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
test('Latin cases: preserves five original IDs and upgrades to 25 varied prompts',()=>{
 const b=inspect('la-y8-case-role-introduction',5,25,{
  mc_single:5,typed_equivalent:14,controlled_translation:4,mark_points:2
 });
 for(let i=1;i<=5;i++)assert.ok(b.questions.some(q=>q.id==='la-y8-src-24jul-case-intro-'+i));
 assert.ok(b.questions.filter(q=>q.status==='enabled'&&q.format!=='mc_single').length>=15);
 const inherited = new Set(b.questions.slice(0,5).map(q=>q.conceptId));
 const supplements = b.questions.filter(q=>q.id.startsWith('la-y8-case-role-supplement-20261026-'));
 assert.equal(supplements.length,15);
 assert.equal(new Set(b.questions.map(q=>q.conceptId)).size,25,'independent case-role tasks must not reserve the same question opportunity');
 for (const q of supplements) assert.ok(inherited.has(q.sourceConceptId),'supplement must retain original grammar-case source linkage: '+q.id);
});
test('Biology mixed: retains old 12, adds short application and 4 rubric items',()=>{
 const b=inspect('bio-y8-mixed-exam',12,20,{
  typed_exact:12,typed_equivalent:4,mark_points:4
 });
 for(let i=1;i<=12;i++)assert.ok(b.questions.some(q=>q.id==='bio-y8-mixed-review-'+i));
 assert.ok(b.questions.filter(q=>q.status==='enabled'&&q.format==='mark_points').every(q=>q.answer.totalMarks>=3));
});


test('Latin Case Role retains 20 formally eligible questions after five distinct prior successes',async()=>{
 const {diagnoseTaskQuestionEligibility}=await import('../src/lib/daily/question-eligibility-diagnostics-20261026.mjs');
 const b=read('la-y8-case-role-introduction');
 const reserves=b.questions.filter(q=>q.id.includes('case-role-reserve-20261026'));
 assert.equal(reserves.length,5);
 assert.ok(reserves.every(q=>q.status==='enabled'&&q.formal===true&&q.origin?.reviewStatus==='requires-academic-and-grading-QA'));
 const canonical=new Set(b.questions.slice(0,5).map(q=>q.conceptId));
 assert.ok(reserves.every(q=>canonical.has(q.sourceConceptId)));
 assert.ok(reserves.every(q=>q.answer&&(['typed_equivalent','controlled_translation','mark_points'].includes(q.format))));
 assert.ok(reserves.filter(q=>q.format==='mark_points').every(q=>q.answer.markPoints.length===q.answer.totalMarks&&q.answer.manualReviewFallback===true));
 const already=Object.fromEntries(b.questions.slice(0,5).map(q=>[q.id,1]));
 const task={id:'latin-case-role-mastery',subject:'latin',year:8,topicId:b.topicId,mode:'mastery',target:20};
 const report=diagnoseTaskQuestionEligibility(task,b.questions,{today:'2026-10-26',seenCorrect:already},'2026-10-26');
 assert.equal(report.nominal,25);
 assert.equal(report.eligible,20);
 assert.equal(report.shortage,0);
});
