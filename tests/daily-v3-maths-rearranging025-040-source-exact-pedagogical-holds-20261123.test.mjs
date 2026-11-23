import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>JSON.parse(readFileSync(new URL('../qa-staging/'+name,import.meta.url),'utf8'));
const bank=read('math-v311-reviewed-200.json');
const register=read('math-v311-rearranging025-040-16-source-exact-pedagogical-holds-20261123.json');
const family=n=>n<=28?'ROOT_RECIPROCAL_FOUR_PARAMETER_VARIANTS':n<=32?'SHIFTED_MOBIUS_FOUR_PARAMETER_VARIANTS':n<=36?'NESTED_RECIPROCAL_FOUR_PARAMETER_VARIANTS':'ROOT_OF_RATIONAL_FOUR_PARAMETER_VARIANTS';

test('source-exact Q025-040: 16 unapproved records, no altered or releasable Maths questions',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(q=>q.dailyEligible===true).length,0);
 assert.equal(register.kind,'SOURCE_EXACT_16_ITEM_PEDAGOGICAL_HOLD_NOT_GRADE_CERTIFICATION');
 assert.equal(register.count,16); assert.equal(register.uniqueFourFamilies,4);
 assert.equal(register.formalApprovalCount,0); assert.equal(register.sourceBankModified,false);
 assert.equal(register.schoolPdf,'SKIPPED_AT_PARENT_REQUEST');
 assert.equal(register.rows.length,16);
 const ids=new Set();
 for(const row of register.rows){
  const number=Number(row.sourceId.slice(-3));
  assert.ok(number>=25&&number<=40);
  const source=bank.questions.find(q=>q.sourceId===row.sourceId);
  assert.ok(source&&source.revisionId===row.revisionId);
  assert.equal(row.sourceStem,source.stem);
  assert.equal(row.sourceKey,source.correctOptionId);
  assert.equal(row.family,family(number));
  assert.equal(row.academicDecision,'HOLD');
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.equal(row.independentPedagogyApproved,false);
  assert.equal(row.classroomSubskillConfirmed,false);
  assert.equal(row.exactSourceGrade7Plus,null);
  assert.equal(source.dailyEligible,false);
  ids.add(row.sourceId);
 }
 assert.equal(ids.size,16);
});

test('four parameter-copy families are not four independent Mastery concepts each',()=>{
 const families=new Map();
 for(const row of register.rows){
  const stem=row.sourceStem.toLowerCase().replace(/\d+(?:\.\d+)?/g,'#').replace(/\s+/g,' ').trim();
  const set=families.get(row.family)||new Set();
  set.add(stem); families.set(row.family,set);
 }
 assert.equal(families.size,4);
 for(const [name,templates] of families)
  assert.equal(templates.size,1,'Numerically identical source family changed: '+name);
});
