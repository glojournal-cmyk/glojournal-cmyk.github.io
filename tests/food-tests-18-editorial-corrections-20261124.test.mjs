import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url));
const read=p=>JSON.parse(raw(p).toString('utf8'));
const overlay=read('qa/food-tests-18-editorial-corrections-preview-20261124.json');
const bank=read(overlay.sourcePath);
const base=read(overlay.basePreview);
const original=new Map(bank.questions.map(q=>[q.id,q]));
const previous=new Map(base.questions.map(q=>[q.id,q]));
const items=overlay.items;
test('18 complete corrections are QA-only, source-bound, with zero formal approval',()=>{
 const bytes=raw(overlay.sourcePath);
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),overlay.sourceBlob);
 assert.equal(bank.questions.length,143);
 assert.equal(base.questions.length,143);
 assert.equal(items.length,18);
 assert.equal(new Set(items.map(r=>r.sourceId)).size,18);
 assert.equal(overlay.formalCreditEligible,false);
 assert.equal(overlay.release,'BLOCKED');
 assert.equal(overlay.sourceEdited,false);
 assert.equal(overlay.counts.independentlyApproved,0);
 for(const row of items){
  const q=row.question, old=original.get(row.sourceId), prior=previous.get(row.sourceId);
  assert.ok(old); assert.ok(prior);
  assert.equal(q.id,old.id); assert.equal(q.conceptId,old.conceptId);
  assert.equal(q.format,old.format); assert.equal(q.topicId,old.topicId);
  assert.notEqual(q.prompt,old.prompt); assert.notDeepEqual(q.feedback,old.feedback);
  assert.equal(prior.prompt,old.prompt);
  for(const k of ['academicApproved','formalCreditEligible']){assert.equal(q[k],false);assert.equal(row[k],false);}
  assert.equal(row.independentQualifiedApproval,false);
  assert.equal(q.preview,true); assert.equal(q.ordinary,false); assert.equal(q.status,'qa-pending');
  assert.equal(canEarnFormalCredit(q.id),false);
 }
});
test('16 revised observations yield exactly the original complete nutrient set and sole choice',()=>{
 const cases=items.filter(r=>r.change==='CONCRETE_OBSERVATION_AND_COMPLETE_SET');
 assert.equal(cases.length,16);
 for(const {question:q} of cases){
  const p=q.prompt;
  assert.match(p,/complete list of nutrient groups detected by these four tests/);
  assert.ok(!p.includes(' / '));
  assert.match(p,/iodine (blue-black|orange-brown)/);
  assert.match(p,/heated Benedict's (remains blue|(green|yellow|orange|brick-red) precipitate)/);
  assert.match(p,/Biuret (remains blue|lilac|purple)/);
  assert.match(p,/ethanol emulsion test (cloudy white emulsion|remains clear)/);
  const expected=[['starch',p.includes('iodine blue-black')],['reducing sugar',!p.includes("heated Benedict's remains blue")],['protein',!p.includes('Biuret remains blue')],['lipid',p.includes('cloudy white emulsion')]].filter(x=>x[1]).map(x=>x[0]).join(', ')||'none of these four nutrients';
  assert.deepEqual(q.answer.accepted,[expected]); assert.deepEqual(q.answer,original.get(q.id).answer);
  assert.deepEqual(q.options,original.get(q.id).options);
  assert.equal(q.options.filter(x=>x===expected).length,1);
  assert.equal(q.feedback.steps.length,4);
  assert.match(q.feedback.commonError,/negative result does not establish absolute absence/);
 }
});
test('Benedict strength is conditional and iodine shorthand remains in legacy source',()=>{
 const b=items.find(r=>r.change==='BENEDICT_STRENGTH_UNAMBIGUOUS').question;
 assert.match(b.prompt,/same heated Benedict's test conditions/);
 assert.match(b.prompt,/strongest positive/); assert.deepEqual(b.answer.accepted,['brick-red']);
 assert.deepEqual(b.options,original.get(b.id).options);
 const r=items.find(r=>r.change==='DETECTION_LIMIT_PRECISE_TYPED_DRAFT'), q=r.question, old=original.get(q.id);
 assert.match(q.prompt,/do not make a claim about absolute absence/);
 assert.equal(r.legacyAcceptedPreservedInSource,true);
 assert.equal(r.typedScorerFairnessVerified,false);
 assert.equal(r.schoolShorthandPending.length,4);
 for(const s of r.schoolShorthandPending){assert.ok(old.answer.accepted.includes(s));assert.ok(!q.answer.accepted.includes(s));}
 for(const s of old.answer.accepted.filter(s=>!r.schoolShorthandPending.includes(s)))assert.ok(q.answer.accepted.includes(s));
 assert.equal(new Set(q.answer.accepted).size,q.answer.accepted.length);
 assert.equal(q.answer.totalMarks,old.answer.totalMarks);
});
