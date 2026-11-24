import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const json=p=>JSON.parse(read(p).toString('utf8'));
const report=json('qa/food-tests-143-main-reconciliation-20261124.json');
const bank=json(report.qa.path), integrated=json(report.consolidated.path);
const digest=p=>{const b=read(p);return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');};
test('all 143 IDs reconciled and exact QA inputs retained; no release approval',()=>{
 assert.equal(digest(report.qa.path),report.qa.blob);
 assert.equal(digest(report.consolidated.path),report.consolidated.blob);
 assert.deepEqual(report.rows.map(r=>r.id),bank.questions.map(q=>q.id));
 assert.equal(report.rows.length,143);assert.equal(report.rows.filter(r=>r.changed).length,93);
 assert.equal(report.rows.filter(r=>!r.changed).length,50);
 assert.equal(report.release,'BLOCKED');assert.equal(report.formalCreditEligible,false);
 const byId=new Map(bank.questions.map(q=>[q.id,q]));
 const groups=new Map(integrated.groups.map(g=>[g.sourceId,g]));
 for(const r of report.rows){
  const q=byId.get(r.id),g=groups.get(r.id);assert.ok(g);
  assert.equal(r.formalCreditEligible,false);assert.equal(r.independentAcademicApproved,false);
  assert.equal(r.changed,r.fields.length>0);
  for(const f of r.fields){assert.deepEqual(f.qa,q[f.field]??null,r.id+' / '+f.field);assert.notDeepEqual(f.main,f.qa);}
  assert.equal(g.kind,r.integratedKind);
  assert.deepEqual(r.integratedIds,g.parts?g.parts.map(p=>p.pointId):[g.question.id]);
  if(r.action==='RETAIN_CONTEXTUAL_DISTRACTORS'){assert.deepEqual(g.question.options,q.options);assert.equal(g.question.options.filter(a=>g.question.answer.accepted.includes(a)).length,1);}
  if(r.action==='RETAIN_VALID_ALTERNATIVES')for(const a of q.answer.accepted)assert.ok(g.question.answer.accepted.includes(a));
  if(r.action==='RETAIN_FOUR_PAIR_MARKS'){assert.equal(g.question.answer.pairs.length,4);assert.equal(g.question.answer.totalMarks,4);}
  if(r.action==='RETAIN_CORRECTED_COMPLETE_SET'){assert.match(g.question.prompt,/complete list of nutrient groups detected/);assert.ok(!g.question.prompt.includes(' / '));}
  if(r.action==='REPLACE_AND_REMAP_SKILL'){assert.notEqual(g.question.prompt,q.prompt);assert.equal(g.question.dailyConceptGroup,null);}
 }
 const c=report.counts.actions;
 assert.equal(c.RETAIN_CORRECTED_COMPLETE_SET,16);assert.equal(c.REPLACE_AND_REMAP_SKILL,48);
 assert.equal(c.RETAIN_STRUCTURED_REDESIGN,4);
});
test('highest-risk main answer differences stay corrected in held integrated draft',()=>{
 const q=id=>integrated.groups.find(g=>g.sourceId===id);
 for(const id of ['bio-y8-food-tests-water-bath-mc','bio-y8-food-tests-water-bath-name'])assert.doesNotMatch(q(id).question.prompt,/ethanol/);
 const b=q('bio-y8-food-tests-brick-red-name').question;
 assert.match(b.prompt,/strongest positive/);assert.ok(!b.answer.accepted.includes('orange or brick-red'));
 const iodine=q('bio-y8-app-iodine-negative').question;
 for(const a of ["starch wasn't detected","the sample tested negative for starch","starch not detected under these conditions"])assert.ok(iodine.answer.accepted.includes(a));
 assert.ok(!iodine.answer.accepted.includes('not no starch was detected'));
 const ethanol=q('bio-y8-app-ethanol-safety');
 assert.equal(ethanol.parts.length,2);assert.equal(ethanol.legacyFreeTextFormalCredit,false);
 assert.equal(q('bio-y8-food-tests-water-bath-explain').parts.length,2);
});
