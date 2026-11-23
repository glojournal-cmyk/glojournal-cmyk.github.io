import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit,foodTestsPupilVerdict} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const before=read('qa/food-tests-37-unseen-probes.json');
const added=read('qa/food-tests-15-extra-unseen-20261123.json');
test('exact all-52 original long-answer / 99-mark-point unseen QA coverage',()=>{
 const qs=bank.questions.filter(q=>q.format==='mark_points');
 const rows=[...before.rows,...added.rows];
 assert.equal(bank.questions.length,143);
 assert.equal(qs.length,52);
 assert.equal(qs.reduce((sum,q)=>sum+q.answer.markPoints.length,0),99);
 assert.equal(before.rows.length,37);
 assert.equal(added.rows.length,15);
 assert.equal(added.markPoints,26);
 assert.equal(added.academicApproved,0);
 assert.equal(rows.length,52);
 assert.equal(new Set(rows.map(x=>x.questionId)).size,52);
 assert.deepEqual(new Set(rows.map(x=>x.questionId)),new Set(qs.map(q=>q.id)));
 assert.equal(rows.reduce((sum,x)=>sum+x.expectedMarks,0),99);
 for(const q of qs){
  const fixture=rows.find(r=>r.questionId===q.id);
  assert.equal(fixture.expectedMarks,q.answer.markPoints.length,q.id);
  assert.deepEqual(fixture.holdout.map(x=>x.kind),['full-paraphrase-unseen','false-conclusion-unseen'],q.id);
  assert.equal(fixture.holdout[0].expected,fixture.expectedMarks,q.id);
  assert.equal(fixture.holdout[1].expected,0,q.id);
  assert.equal(canEarnFormalCredit(q),false,q.id);
  const verdict=foodTestsPupilVerdict(q);
  assert.equal(verdict.score,null,q.id);
  assert.equal(verdict.errorKind,'unmarked',q.id);
 }
});
test('15 newly added cases retain exact original question and marking scope, not approvals',()=>{
 assert.equal(added.status,'QA_DIAGNOSTIC_ONLY');
 const byId=new Map(bank.questions.map(q=>[q.id,q]));
 for(const item of added.rows){
  const source=byId.get(item.questionId);
  assert.ok(source,item.questionId);
  assert.equal(source.prompt,item.prompt,item.questionId);
  assert.deepEqual(source.answer.markPoints,item.sourceMarkPoints,item.questionId);
  assert.ok(item.holdout.every(x=>x.answer.length>20&&x.academicAdjudication==='pending'),item.questionId);
  assert.notEqual(item.holdout[0].answer,item.holdout[1].answer,item.questionId);
 }
});
