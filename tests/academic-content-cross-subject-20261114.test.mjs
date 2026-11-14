import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {UNSEEN_PASSAGES, validateUnseens} from '../study/latin/november-2026/unseen-passages.js';
import {MOCK, validateMock} from '../study/latin/november-2026/exam-data.js';

const read=p=>fs.readFileSync(p,'utf8');
const latin=Object.fromEntries(UNSEEN_PASSAGES.map(p=>[p.id,p]));
assert.equal(validateMock(MOCK),true,'50-minute school-matched Latin mock');
assert.equal(validateUnseens(),true,'all Latin unseen questions have distinct options and sound evidence');
assert.deepEqual(MOCK.sections.map(s=>s.questions.reduce((n,q)=>n+q.points.length,0)),[11,14,50]);
assert.equal(UNSEEN_PASSAGES.reduce((n,p)=>n+p.questions.length,0),50);
assert.ok(latin.island.passage.includes('amicus Romani in insula parva habitabat.'),
 'A friend of Romanus requires the GENITIVE Romani, not nominative Romanus');
assert.ok(!latin.island.passage.includes('amicus Romanus in insula parva habitabat.'));
assert.equal(latin.island.questions[1].options[latin.island.questions[1].answer],'On a small island');

const app=read('assessment/app-v2.js');
const sandbox={};vm.createContext(sandbox);
vm.runInContext(app.slice(app.indexOf('function normal('),app.indexOf('async function start(')),sandbox);
vm.runInContext(read('assessment/biology-marking-20261003.js'),sandbox);
const mark=sandbox.mark;
const physics=JSON.parse(read('assessment/physics-nov26-20261113.json'));
const physicsQs=physics.groups.flatMap(g=>g.questions);
assert.deepEqual(physics.groups.map(g=>g.questions.length),[40,40,40,40,40]);
assert.equal(new Set(physicsQs.map(q=>q.id)).size,200);
for(const q of physicsQs){
  assert.ok(q.prompt&&q.modelAnswer,q.id);
  assert.equal(mark(q,q.modelAnswer).credit,1,'Physics model answer must receive 100%: '+q.id);
  assert.equal(mark(q,'I do not know').credit,0,'Physics unknown response must receive zero: '+q.id);
  if(q.answer.mode==='choice') {
    assert.equal(q.options.length,4,q.id);
    assert.equal(new Set(q.options).size,4,q.id);
    assert.ok(q.options.includes(q.answer.accepted[0]),q.id);
  } else assert.equal(q.marks,q.answer.points.length,q.id);
}
assert.match(physicsQs.find(q=>q.id==='phys-nov26-d30').prompt,/^(An oil sample|A sample of oil) has (a )?mass/);
assert.doesNotMatch(physicsQs.find(q=>q.id==='phys-nov26-d30').prompt,/container.*liquid only/);

const biology=JSON.parse(read('assessment/biology-cell-structure-20261003.json'));
assert.equal(biology.questions.length,144);
assert.equal(new Set(biology.questions.map(q=>q.id)).size,144);
for(const spec of ['4.1.1.1','4.1.1.2','4.1.1.3','4.1.1.4','4.1.1.5','4.1.1.6']){
 const qs=biology.questions.filter(q=>q.specification===spec);
 assert.equal(qs.length,24,spec);
 assert.equal(qs.filter(q=>q.marks===2).length,12,spec);
 assert.equal(qs.filter(q=>q.marks===3).length,12,spec);
}
for(const q of biology.questions){
 assert.equal(q.answer.points.length,q.marks,q.id);
 assert.equal(mark(q,q.modelAnswer).credit,1,'Biology model answer must receive 100%: '+q.id);
 assert.equal(mark(q,'I do not know').credit,0,'Biology unknown response must receive zero: '+q.id);
}
const red=biology.questions.find(q=>q.id==='bio-cell-20261114-103');
assert.match(red.prompt,/biconcave/);
assert.match(red.modelAnswer,/short diffusion path/);
assert.doesNotMatch(red.prompt,/is small, flexible/);
const guide=read('assessment/biology-cell-structure/index.html');
assert.equal((guide.match(/class="question"/g)||[]).length,156);
for(const q of biology.questions)assert.ok(guide.includes(q.prompt.replaceAll('&','&amp;'))||guide.includes(q.prompt),'Guide missing '+q.id);

const chem=JSON.parse(read('content/exam-revision/chemistry-nov16-2026-applied.json'));
assert.equal(chem.questions.length,88);
assert.equal(new Set(chem.questions.map(q=>q.id)).size,88);
assert.equal(chem.assessmentExclusions.length,16,'exclude explicitly out-of-teacher-scope ion/isotope calculations');
for(const q of chem.questions){
 assert.ok(q.prompt&&q.answer,q.id);
 if(q.answer.mode==='self_review_rubric') {
   assert.equal(q.markScheme.length,q.marks,q.id);
   assert.ok(q.markScheme.every(x=>typeof x==='string'&&x.length>8),q.id);
 } else if(q.answer.mode==='choice') {
   assert.equal(q.options.length,4,q.id);
   assert.ok(q.options.includes(q.answer.accepted[0]),q.id);
 }
}
const given=id=>chem.questions.find(q=>q.id===id);
assert.ok(given('chem-nov16-2026-formula-applied-02').markScheme.join(' ').includes('Mg₃N₂'));
assert.ok(given('chem-nov16-2026-formula-applied-06').markScheme.join(' ').includes('6 oxygen'));
assert.ok(given('chem-nov16-2026-balance-applied-20').markScheme.join(' ').includes('Fe₂O₃ + 3CO → 2Fe + 3CO₂'));

const chemTopic=JSON.parse(read('content/topics/chem-y9-c7.json'));
assert.equal(chemTopic.questions.length,90);
for(const q of chemTopic.questions){
 assert.ok(q.id&&q.prompt&&q.answer?.mode,q.id);
 if(q.answer.mode==='choice')assert.ok(q.options?.includes(q.answer.accepted?.[0]),q.id);
 if(q.answer.mode==='mark_points')assert.ok(q.answer.markPoints?.length,q.id);
 if(q.answer.mode==='exact_or_equivalent')assert.ok(q.answer.accepted?.length,q.id);
 if(q.answer.mode==='pair_map')assert.ok(q.answer.pairs||q.answer.mapping||q.answer.accepted||q.answer.map,q.id);
}
const french=read('assessment/french-nov26/index.html');
assert.match(french,/AO2 content 15, AO3 range 5, AO3 accuracy 5/);
assert.match(french,/covered<2&&p.ao2!==undefined&&p.ao2>12/,'AQA one-bullet AO2 cap 12');
assert.match(french,/if\(p.ao2===0\)\{p.range=0;p.accuracy=0\}/,'AQA when AO2=0 then AO3=0');
console.log(JSON.stringify({latinMockMarks:[11,14,50],latinUnseenQuestions:50,physics:physicsQs.length,biology:biology.questions.length,chemistryApplied:chem.questions.length,chemistryTopic:chemTopic.questions.length,biologyGuide:156,frenchHigher:'AQA AO2/AO3 caps verified',result:'PASS'},null,2));
