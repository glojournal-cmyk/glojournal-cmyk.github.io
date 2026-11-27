import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=name=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+name+'-20261122.json',import.meta.url),'utf8'));
const topics=['indices','standard-form','changing-subject','straight-line-graphs','simultaneous-equations'];
test('all 1200 printed A–F source option starts inventoried, exactly 1000 wrong choices held for pedagogical QA',()=>{
 const ids=new Set(),all=[];
 for(const topic of topics){
  const source=load('batch40-'+topic+'-source-qa');
  const ledger=load(topic+'-240-source-options-qa-ledger');
  assert.equal(ledger.sourceQuestionCount,40);
  assert.equal(ledger.sourceOptionsTotal,240);
  assert.equal(ledger.originalWrongChoicesToIndependentlyCertify,200);
  assert.equal(ledger.independentWrongChoicePedagogyApproved,0);
  assert.equal(ledger.visualOptionMathCertified,0);
  assert.equal(ledger.studentCreditAllowed,false);
  const group=new Map();
  for(const option of ledger.choices){
    if(!group.has(option.originalSourceId))group.set(option.originalSourceId,[]);
    group.get(option.originalSourceId).push(option);
    assert.equal(option.independentPedagogyApproval,false);
    assert.equal(option.exactSourceOptionMathVisualMatch,false);
    assert.equal(option.eligibleForCredit,false);
    assert.equal(option.independentlyDerivedPedagogicalErrorPath,null);
    assert.equal(option.wrongOptionMathematicallyIndistinctFromKey,null);
    assert.ok(option.sourceOptionTextFromPdf.startsWith(option.sourceOptionLetter+'.'));
    all.push(option);
  }
  assert.equal(group.size,40);
  for(const row of source.sourceQuestionRows){
    const opts=group.get(row.id);
    assert.ok(opts,row.id);
    assert.equal(opts.length,6);
    assert.deepEqual(opts.map(o=>o.sourceOptionLetter),['A','B','C','D','E','F']);
    assert.equal(opts.filter(o=>o.sourceKey).length,1);
    assert.equal(opts.find(o=>o.sourceKey).sourceOptionLetter,row.originalRegisteredCorrectOption);
    assert.equal(opts.filter(o=>!o.sourceKey).length,5);
    assert.ok(!ids.has(row.id));ids.add(row.id);
  }
 }
 assert.equal(all.length,1200);
 assert.equal(all.filter(x=>x.sourceKey).length,200);
 assert.equal(all.filter(x=>!x.sourceKey).length,1000);
 assert.equal(ids.size,200);
 assert.equal(all.filter(x=>x.independentPedagogyApproval).length,0);
});
