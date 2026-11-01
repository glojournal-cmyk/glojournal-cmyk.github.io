import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';

const load = (name) => JSON.parse(readFileSync(new URL('../content/topics/'+name+'.json',import.meta.url),'utf8'));
const catalog = JSON.parse(readFileSync(new URL('../content/catalog.json',import.meta.url),'utf8'));
const topicIds = ['chem-y9-c4','chem-y9-c1'];
const docs = topicIds.map(load);
const imported = docs.flatMap(doc=>doc.questions.filter(q=>q.id.startsWith('chem-g8-20261101-')));
const sep = imported.filter(q=>q.topicId==='chem-y9-c4');
const pt = imported.filter(q=>q.topicId==='chem-y9-c1');

test('the QA-corrected 70-question GCSE Chemistry bank is available in Year 9 Mastery topics', () => {
  assert.equal(sep.length,40);
  assert.equal(pt.length,30);
  assert.equal(imported.reduce((sum,q)=>sum+q.stimulus.marks,0),152);
  assert.equal(new Set(imported.map(q=>q.id)).size,70);
  assert.equal(new Set(imported.map(q=>q.conceptId)).size,70);
  assert.ok(imported.every(q=>q.status==='enabled'&&q.preview===false&&q.ordinary===true));
  assert.ok(imported.every(q=>q.subject==='chemistry'&&q.year===9&&q.answer&&q.prompt&&q.stimulus.marks>0));
  assert.ok(imported.every(q=>q.qaSource?.sourceId?.startsWith('CHEM-')));
});

test('catalog enables the new questions without changing the number of topics', () => {
  for(const doc of docs){
    const meta = catalog.topics.find(t=>t.topicId===doc.topicId);
    assert.ok(meta,'Catalog has '+doc.topicId);
    assert.equal(meta.questions,doc.questions.length);
    assert.equal(meta.enabled,doc.questions.filter(q=>q.status==='enabled').length);
  }
  const summary=catalog.bySubjectYear.find(r=>r.subject==='chemistry'&&r.year===9);
  assert.equal(summary.questions,1160);
  assert.equal(summary.enabled,1150);
});

test('all GCSE Chemistry figure references have valid accessible illustration files', () => {
  const illustrated=imported.filter(q=>q.stimulus.image);
  assert.equal(illustrated.length,6);
  for(const q of illustrated){
    assert.match(q.stimulus.image,/^\/content\/diagrams\/chem-g8-/);
    assert.ok(q.stimulus.imageAlt);
    assert.ok(existsSync(new URL('..'+q.stimulus.image,import.meta.url)),q.id+' figure exists');
  }
});

test('no question is marked without a supported answer and a clear feedback scheme', () => {
  const formats=new Set(['mc_single','typed_short','mark_points','calculation','extended_response']);
  for(const q of imported){
    assert.ok(formats.has(q.format),q.id+' supported format');
    assert.ok(q.feedback?.steps?.length>0,q.id+' has feedback');
    if(q.answer.mode==='choice'){
      assert.ok(q.answer.accepted.every(a=>q.options.includes(a)),q.id+' choice answer in options');
    }
    if(q.answer.mode==='numeric'){
      assert.ok(Number.isFinite(q.answer.value),q.id+' numeric answer');
    }
    if(q.answer.mode==='mark_points'){
      assert.ok(q.answer.totalMarks>0,q.id+' marking maximum');
      assert.ok(q.answer.markPoints.length>=q.answer.totalMarks,q.id+' distinct mark points');
    }
  }
});

test('science answers known to have caused QA failures remain corrected', () => {
  const q=(id)=>imported.find(x=>x.stimulus.sourceId===id);
  assert.equal(q('CHEM-SEP-008').answer.markPoints[0],'C');
  assert.match(q('CHEM-SEP-032').prompt,/A = 0.32.*C = 0.75/);
  assert.match(q('CHEM-PT-021').prompt,/Argon.*Potassium/);
  assert.match(q('CHEM-SEP-025').answer.modelAnswer,/dry the clean sand/);
  assert.match(q('CHEM-PT-001').prompt,/TWO DASHED boxes/);
  assert.match(q('CHEM-PT-030').prompt,/predicted.*68.*69.7/i);
});
