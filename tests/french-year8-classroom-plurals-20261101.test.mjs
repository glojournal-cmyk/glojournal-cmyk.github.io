import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const doc=JSON.parse(fs.readFileSync('content/topics/fr-y8-s25-classroom-objects.json','utf8'));
const cases=[
 ['1230-des-calculatrices','calculator','calculators'],
 ['1234-des-crayons','pencil','pencils'],
 ['1238-des-stylos','pen','pens'],
 ['1242-des-ordinateurs','computer','computers'],
 ['1246-des-taille-crayons','pencil sharpener','pencil sharpeners'],
 ['1254-des-cahiers','exercise book','exercise books'],
 ['1258-des-sacs-a-dos','rucksack','rucksacks'],
 ['1262-des-trousses','pencil case','pencil cases'],
 ['1270-des-gommes','eraser','erasers'],
 ['1274-des-livres','book','books'],
 ['1278-des-boites','box','boxes'],
 ['1282-des-chaises','chair','chairs'],
 ['1286-des-tables','table','tables'],
 ['1290-des-portes','door','doors']
];
const map=new Map(doc.questions.map(q=>[q.id,q]));
const norm=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9 ']/g,'').replace(/\s+/g,' ').trim();
const raw=fs.readFileSync('assets/quiz-session-rWAnuDVj.js','utf8');
const start=raw.indexOf('function A(e){'),end=raw.indexOf('function re(e)',start);
assert.ok(start>=0&&end>start,'live quiz scorer functions must be available');
const context=vm.createContext({d:norm,a:norm,x:value=>value.normalize('NFC').trim().replace(/\s+/g,' ')});
vm.runInContext(raw.slice(start,end),context);
const mark=(q,value)=>context.B(q,value,'french');

test('Year 8 French source count and question identities remain stable',()=>{
 assert.equal(doc.subject,'french');assert.equal(doc.year,8);
 assert.equal(doc.topicId,'fr-y8-s25-classroom-objects');
 assert.equal(doc.questions.length,265);
 assert.equal(new Set(doc.questions.map(q=>q.id)).size,doc.questions.length);
 assert.equal(cases.length,14);
});
test('all 14 countable French plural nouns require a plural English response',()=>{
 for(const [suffix,singular,plural] of cases){
  const id='fr-y8-src-fr-25-'+suffix;
  const q=map.get(id);
  assert.ok(q,id);
  assert.equal(q.status,'enabled');
  assert.equal(q.format,'controlled_translation');
  assert.equal(q.answer.mode,'exact_or_equivalent');
  assert.equal(q.stimulus.text.startsWith('des '),true,id);
  assert.ok(q.conceptId?.startsWith('fr-y8-concept-vocab-'),id);
  assert.ok(q.answer.accepted.includes(singular+' (plural)'),id+': keep reviewed teacher annotation');
  assert.ok(q.answer.accepted.includes(plural),id+': natural English plural');
  assert.ok(q.answer.accepted.includes('some '+plural),id+': partitive some plural');
  assert.equal(q.answer.accepted.includes(singular),false,id+': no bare singular');
  for(const correct of [plural,'some '+plural,singular+' (plural)'])
   assert.equal(mark(q,correct).ok,true,id+': should credit '+correct);
  for(const incorrect of [singular,'some '+singular])
   assert.equal(mark(q,incorrect).ok,false,id+': must not credit '+incorrect);
 }
});
test('meaningful British English plural alternatives remain supported',()=>{
 for(const [suffix,answers] of [
  ['1254-des-cahiers',['notebooks','some notebooks']],
  ['1258-des-sacs-a-dos',['backpacks','some backpacks']],
  ['1270-des-gommes',['rubbers']]
 ]){
  const q=map.get('fr-y8-src-fr-25-'+suffix);
  for(const answer of answers){
   assert.ok(q.answer.accepted.includes(answer),q.id+': '+answer);
   assert.equal(mark(q,answer).ok,true,q.id+': '+answer);
  }
 }
});
test('disabled ambiguous phrases stay disabled and existing learner identities stay untouched',()=>{
 for(const suffix of ['1266-des-cartables','1294-des-batons-de-colle-des-colles']){
  const q=map.get('fr-y8-src-fr-25-'+suffix);
  assert.ok(q);
  assert.equal(q.status,'disabled');
  assert.equal(q.answer.mode,'manual_review');
 }
 for(const q of doc.questions)assert.ok(q.id&&q.conceptId);
});
