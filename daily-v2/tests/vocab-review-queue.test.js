import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVocabReviewQueue,loadVocabReviewQueue,csvRows} from '../scripts/build-vocab-review-queue.mjs';
const topic=(subject,year,questions)=>({sourceFile:'topics/'+subject+'-'+year+'.json',
 topic:{topicId:subject+'-'+year,subject,year,status:'enabled',questions}});
const question=(id,conceptId,options={})=>({
 id,conceptId,prompt:'Translate a source word: '+id,
 format:'typed_exact',stimulus:{text:'word '+id},
 answer:{mode:'exact_or_equivalent',accepted:['meaning '+id]},
 ...options
});
test('authentic source-only vocabulary audit never certifies or enables answers',()=>{
 const q=loadVocabReviewQueue();
 assert.ok(q.summary.answerShapedReviewRows>0);
 assert.equal(q.summary.independentlyCertified,0);
 assert.equal(q.summary.releaseReady,false);
 assert.equal(q.summary.learnerDataRead,false);
 assert.ok(q.rows.every(r=>r.approvedForDaily===false&&r.lexicalUnitVerified===false&&
  r.curriculumDecision==='pending'&&r.scoringDecision==='pending'));
 assert.ok(q.shortlist.every(r=>r.year<9));
 for(const subject of ['latin','french']){
  assert.ok(q.summary.bySubject[subject].distinctSourceConceptIds>0,subject);
  assert.ok(q.shortlist.filter(r=>r.subject===subject).length<=60);
  assert.equal(new Set(q.shortlist.filter(r=>r.subject===subject)
   .map(r=>r.conceptId)).size,q.shortlist.filter(r=>r.subject===subject).length);
 }
});
test('structured mark points do not get silently downgraded to exact-answer vocab',()=>{
 const d=buildVocabReviewQueue([
  topic('latin',8,[question('valid','meaning-1'),question('unsafe','meaning-2',
   {answer:{mode:'semantic_groups',accepted:['a'],
     requiredGroups:[{alternatives:['a']}]}})]),
  topic('french',8,[question('year8','fr-concept')]),
  topic('french',9,[question('year9','untaught-year9-concept')])
 ]);
 assert.equal(d.rows.length,2);
 assert.equal(d.summary.structuredScoringExcluded,1);
 assert.equal(d.summary.independentlyCertified,0);
 assert.equal(d.summary.bySubject.french.distinctSourceConceptIds,1);
 assert.ok(d.shortlist.every(r=>r.year===8));
});
test('distinct question IDs sharing a concept count as one, with warning',()=>{
 const q=buildVocabReviewQueue([topic('latin',8,[
  question('latin-forward','shared-concept'),
  question('latin-reverse','shared-concept')
 ])]);
 assert.equal(q.summary.bySubject.latin.distinctSourceConceptIds,1);
 assert.equal(q.shortlist.length,1);
 assert.equal(q.summary.flagCounts.MULTIPLE_QUESTIONS_SAME_CONCEPT,2);
});
test('missing concept IDs and duplicates are flagged without fabricating missing source identity',()=>{
 const q=buildVocabReviewQueue([topic('latin',8,[
  question('reused-id','c1'),question('reused-id','c2'),
  question('missing','')])]);
 assert.equal(q.summary.missingConceptExcluded,1);
 assert.ok(q.rows.every(r=>r.flags.includes('DUPLICATE_QUESTION_ID')));
 assert.equal(q.summary.independentlyCertified,0);
});
test('CSV protects leading spreadsheet formulas even in source prompts and answers',()=>{
 const rows=buildVocabReviewQueue([topic('french',8,[
  question('q1','c1',{prompt:'=SUM(A1:A2)',answer:{
   mode:'exact_or_equivalent',accepted:['@unsafe']}})
 ])]).rows;
 const s=csvRows(rows);
 assert.ok(s.includes("'=SUM(A1:A2)"));
 assert.ok(s.includes('[@unsafe')===false,'raw spreadsheet functions must not be emitted');
 assert.ok(s.includes('@unsafe'),'answers remain available for reviewer inspection');
 assert.ok(!s.includes('curriculumCertified,true'));
});
