import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const ledger=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-revised200-template-reuse-review-20261123.json',import.meta.url),'utf8'));
const normalise=stem=>stem.toLowerCase().replace(/\\dfrac/g,'\\frac')
  .replace(/\d+(?:\.\d+)?/g,'#').replace(/\s+/g,' ').trim();

test('all 200 revised items have one traceable template reuse review and no conceptual Mastery approval',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(ledger.status,'ALL_TEMPLATE_SIMILARITY_GROUPS_UNAPPROVED');
 assert.equal(ledger.questions.length,200);
 assert.equal(ledger.totals.questions,200);
 assert.equal(ledger.totals.independentConceptApprovals,0);
 const byId=new Map(bank.questions.map(q=>[q.sourceId,q]));
 const templates=new Map(ledger.groups.map(g=>[g.templateId,g]));
 const seen=new Set();
 assert.equal(byId.size,200);
 for(const record of ledger.questions){
  assert.ok(!seen.has(record.sourceId),'Duplicate source record '+record.sourceId);
  seen.add(record.sourceId);
  const q=byId.get(record.sourceId),group=templates.get(record.templateId);
  assert.ok(q&&group,'Invalid question/template foreign key '+record.sourceId);
  assert.equal(q.revisionId,record.revisionId);
  assert.equal(q.topicId,record.topicId);
  assert.equal(group.numericNeutralStem,normalise(q.stem));
  assert.equal(group.topicId,q.topicId);
  assert.equal(group.variantCount,record.variantCount);
  assert.ok(group.questionIds.includes(q.sourceId));
  assert.deepEqual(record.peerVariantIds,group.questionIds.filter(id=>id!==q.sourceId));
  assert.equal(record.independentConceptApproved,false);
  assert.equal(record.academicDecision,'HOLD');
  assert.equal(q.dailyEligible,false);
 }
 assert.equal(seen.size,200);
});

test('84 literal numeric-neutral patterns, 164 potentially repetitious items must not be treated as 200 separate mastered concepts',()=>{
 const groupIds=ledger.groups.flatMap(g=>g.questionIds);
 assert.equal(ledger.groups.length,84);
 assert.equal(new Set(groupIds).size,200);
 assert.equal(groupIds.length,200);
 const variantRows=ledger.questions.filter(q=>q.variantCount>1);
 assert.equal(variantRows.length,164);
 assert.equal(ledger.totals.questionsWithSiblingVariants,164);
 assert.equal(ledger.totals.withoutSibling,36);
 const topicExpect={
  'math-y9-indices': [14,35],
  'math-y9-standard-form': [19,28],
  'math-y9-changing-subject': [11,40],
  'math-y9-straight-line-graphs': [22,27],
  'math-y9-simultaneous-equations': [18,34]
 };
 for(const [topic,[unique,shared]] of Object.entries(topicExpect)){
  const groups=ledger.groups.filter(g=>g.topicId===topic);
  const rows=ledger.questions.filter(q=>q.topicId===topic);
  assert.equal(rows.length,40);
  assert.equal(groups.length,unique,topic+' expected stem groups');
  assert.equal(rows.filter(q=>q.variantCount>1).length,shared,topic+' repeated-template items');
 }
});
