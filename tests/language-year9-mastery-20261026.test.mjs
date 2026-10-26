import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {diagnoseTaskQuestionEligibility} from '../src/lib/daily/question-eligibility-diagnostics-20261026.mjs';
import {allocateGlobalQuestions} from '../src/lib/daily/global-allocation-preflight-20261026.mjs';

// Read-only QA; no app runtime import, student progress edits, or deployment.
const cases=[
 {topic:'fr-y9-u1-perfect-negatives',old:14,added:11,total:25,distinctConcepts:25,subject:'french'},
 {topic:'fr-y9-u2-comparatives-superlatives',old:13,added:12,total:25,distinctConcepts:25,subject:'french'},
 {topic:'fr-y9-u2-perfect-vs-imperfect',old:11,added:14,total:25,distinctConcepts:25,subject:'french'},
 {topic:'la-y9-s01-case-functions',old:18,added:13,total:31,distinctConcepts:25,subject:'latin'}
];
const get=topic=>JSON.parse(fs.readFileSync('content/topics/'+topic+'.json','utf8'));
const normal=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
for(const spec of cases){
 test(spec.topic+' preserves pre-existing IDs and has a Mastery reserve',()=>{
  const bank=get(spec.topic),q=bank.questions||[];
  assert.equal(bank.subject,spec.subject);
  assert.equal(bank.year,9);
  assert.equal(q.length,spec.total);
  assert.equal(bank.enabled,spec.total);
  assert.equal(new Set(q.map(x=>x.id)).size,spec.total);
  assert.equal(new Set(q.map(x=>x.conceptId)).size,spec.distinctConcepts,'do not count legacy shared concept variants as independent concepts');
  const prior=q.slice(0,spec.old),supplement=q.slice(spec.old);
  assert.ok(prior.every(x=>!x.id.includes('-mastery-20261026-')),'prior record IDs must remain in original order');
  assert.equal(supplement.length,spec.added);
  assert.ok(supplement.every(x=>x.id.includes('-mastery-20261026-')));
  assert.ok(supplement.every(x=>x.status==='enabled'&&x.formal===true&&x.year===9&&x.topicId===spec.topic));
  assert.ok(supplement.every(x=>x.origin?.reviewStatus==='requires-academic-and-grading-QA'),'authored items must be clearly flagged for content moderation');
  assert.ok(supplement.every(x=>Number(x.difficulty)>=3));
  assert.ok(supplement.every(x=>x.answer?.mode==='exact_or_equivalent'||x.answer?.mode==='mark_points'));
  const fingerprints=q.map(x=>[normal(x.prompt),normal(JSON.stringify(x.stimulus||{})),x.format].join('|'));
  assert.equal(new Set(fingerprints).size,fingerprints.length,'no verbatim repeat');
  for(const row of supplement){
   if(row.format==='mark_points'){
    assert.ok(Array.isArray(row.answer.markPoints)&&row.answer.markPoints.length>=2);
    assert.equal(row.answer.totalMarks,row.answer.markPoints.length);
    assert.ok(row.answer.markPoints.every(s=>typeof s==='string'&&s.trim()));
    assert.equal(row.answer.manualReviewFallback,true,'rubric scoring requires a review path');
   }else{
    assert.ok(['typed_equivalent','controlled_translation'].includes(row.format));
    assert.ok(row.answer.accepted?.every(a=>typeof a==='string'&&a.trim()));
    assert.ok(row.answer.accepted?.length>0);
   }
  }
  if(spec.subject==='latin'){
   const core=new Set(prior.map(x=>x.conceptId));
   assert.ok(supplement.every(x=>core.has(x.sourceConceptId)),'case applications must link to taught base concept');
   assert.ok(supplement.some(x=>x.format==='controlled_translation'));
   assert.ok(supplement.some(x=>x.format==='mark_points'));
  }else{
   assert.ok(supplement.some(x=>x.format==='controlled_translation'),'French needs sentence production');
  }
 });
 test(spec.topic+' still has 20 unanswered formal questions after five previously correct answers',()=>{
  const b=get(spec.topic);
  const solved=Object.fromEntries(b.questions.slice(0,5).map(q=>[q.id,1]));
  const task={id:'preview-'+spec.topic,subject:spec.subject,year:9,topicId:spec.topic,mode:'mastery',target:20};
  const report=diagnoseTaskQuestionEligibility(task,b.questions,{today:'2026-10-26',seenCorrect:solved},'2026-10-26');
  assert.equal(report.nominal,spec.total);
  assert.equal(report.eligible,spec.total-5);
  assert.ok(new Set(report.questions.map(x=>x.conceptId)).size>=20,'remaining tasks must cover at least 20 independently labeled concepts');
  assert.equal(report.shortage,0);
  assert.equal(report.reasons.previously_correct,5);
 });
}
test('the four repaired Y9 language topics can allocate 80 mutually distinct formal opportunities',()=>{
 const tasks=cases.map(c=>({id:c.topic,target:20,candidates:get(c.topic).questions.filter(q=>q.status==='enabled'&&q.formal!==false)}));
 const x=allocateGlobalQuestions(tasks);
 assert.equal(x.status,'FULL_READY');
 assert.equal(x.requested,80);
 assert.equal(x.assigned,80);
 assert.equal(new Set(x.rows.flatMap(y=>y.items.map(q=>q.id))).size,80);
});
