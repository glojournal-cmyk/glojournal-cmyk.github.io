import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const data=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-revised200-educational-grade-and-taught-gates-20261122.json',import.meta.url),'utf8'));
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const graphBisectors=new Set([5,6,7,8,17,18,19,20,37,38,39,40]);

test('200 revised candidate educational registers preserve immutable IDs, all 1000 math-path checks and zero formal approval',()=>{
 assert.equal(data.status,'ALL200_FORMAL_EDUCATIONAL_APPROVAL_HOLD');
 assert.equal(data.items.length,200);
 assert.equal(bank.questions.length,200);
 assert.equal(data.counts.questions,200);
 assert.equal(data.counts.mathWrongOptionsReproduced,1000);
 assert.equal(data.counts.individualGradeCertified,0);
 assert.equal(data.counts.individualTypicalMisconceptionCertified,0);
 assert.equal(data.counts.individualTaughtCertified,0);
 assert.equal(data.counts.creditEligible,0);
 let totalWrong=0;
 const byId=new Map(bank.questions.map(q=>[q.sourceId,q]));
 assert.equal(byId.size,200);
 const seen=new Set();
 for(const item of data.items){
  assert.ok(!seen.has(item.sourceId),'Duplicate register ID '+item.sourceId);
  seen.add(item.sourceId);
  const question=byId.get(item.sourceId);
  assert.ok(question,'Unknown source ID '+item.sourceId);
  assert.equal(item.revisionId,question.revisionId);
  assert.equal(item.printedOptions,question.options.length);
  assert.equal(item.sourceSpecificWrongMathResultsReproduced,
   question.options.filter(o=>o.id!==question.correctOptionId).length);
  assert.equal(item.sourceSpecificWrongMathResultsReproduced,5);
  assert.equal(item.grade7PlusBenchmarked,false);
  assert.equal(item.studentTypicalMisconceptionEvidence,'NOT_INDEPENDENTLY_VERIFIED');
  assert.equal(item.independentAcademicReviewer,null);
  assert.equal(item.academicDecision,'HOLD');
  assert.equal(item.dailyEligible,false);
  assert.equal(question.dailyEligible,false);
  totalWrong+=item.sourceSpecificWrongMathResultsReproduced;
 }
 assert.equal(totalWrong,1000);
});

test('76 source-specific timing or taught-scope priority risks remain unapproved, rest also require class-level evidence',()=>{
 const byId=new Map(data.items.map(q=>[q.sourceId,q]));
 const urgent=data.items.filter(q=>q.reviewQueue==='PRIORITY_SCOPE_CONFIRM');
 assert.equal(urgent.length,76);
 const indices=data.items.filter(q=>q.topicId==='math-y9-indices');
 const subject=data.items.filter(q=>q.topicId==='math-y9-changing-subject');
 const graphs=data.items.filter(q=>q.topicId==='math-y9-straight-line-graphs');
 const standard=data.items.filter(q=>q.topicId==='math-y9-standard-form');
 assert.equal(indices.filter(q=>Number(q.sourceId.slice(-3))>=29&&q.reviewQueue==='PRIORITY_SCOPE_CONFIRM').length,12);
 assert.equal(subject.filter(q=>q.reviewQueue==='PRIORITY_SCOPE_CONFIRM').length,40);
 assert.equal(graphs.filter(q=>graphBisectors.has(Number(q.sourceId.slice(-3)))&&q.reviewQueue==='PRIORITY_SCOPE_CONFIRM').length,12);
 assert.equal(standard.filter(q=>q.reviewQueue==='PRIORITY_SCOPE_CONFIRM').length,12);
 assert.equal(data.items.filter(q=>q.reviewQueue==='MUST_VERIFY_TEACHER_TAUGHT_SUBSKILL').length,124);
 for(const item of byId.values())assert.notEqual(item.gradeStatus,'VERIFIED_G7_PLUS');
});
