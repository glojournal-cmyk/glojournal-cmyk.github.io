import assert from 'node:assert/strict';
import fs from 'node:fs';

const root='.';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const bank=json('assessment/physics-nov26-20261113.json');
const catalog=json('content/catalog.json');
assert.equal(bank.subject,'physics');
assert.equal(bank.year,9);
assert.equal(bank.groups.length,5);
assert.ok(bank.version.startsWith('2026-11-14-physics-bank200'), 'expected school-aligned question bank version');


const totals=[40,40,40,40,40];
const all=bank.groups.flatMap(g=>g.questions);
assert.equal(all.length,200);
assert.deepEqual(bank.groups.map(g=>g.questions.length),totals);
assert.ok(all.filter(q=>q.marks>=3).length>=70,'enough 3–4 mark school-style questions');
assert.equal(all.filter(q=>q.schoolExamStyle).length,148);
assert.ok(!all.some(q=>/\b(?:convection|radiation|infrared)\b/i.test(q.prompt)));

assert.equal(new Set(all.map(q=>q.id)).size,200);
assert.equal(new Set(all.map(q=>q.conceptId)).size,200);

const groupNames=bank.groups.map(g=>g.title);
assert.deepEqual(groupNames,[
 'Particle model & changes of state',
 'Density calculations',
 'Conduction & insulation',
 'RP2 thermal insulation',
 'RP5 density'
]);
for(const group of bank.groups){
 assert.ok(group.questions.length>=5,'minimum questions for quota');
 for(const q of group.questions){
  assert.equal(q.topic,group.title);
  assert.equal(q.subject,'physics');
  assert.equal(q.year,9);
  assert.ok(q.prompt && q.modelAnswer);
  assert.ok(!['convection','radiation','infrared'].some(term=>q.prompt.toLowerCase().includes(term)),q.id+' outside exam scope');
  assert.ok(Array.isArray(q.answer.accepted) && q.answer.accepted.includes(q.modelAnswer));
  if(q.answer.mode==='choice'){
   assert.equal(q.options.length,4);
   assert.equal(new Set(q.options).size,4);
   assert.ok(q.options.includes(q.modelAnswer));
   assert.equal(q.marks,1);
  }else{
   assert.equal(q.answer.mode,'chemistry_rubric');
   assert.ok(q.answer.points.length>=2 && q.answer.points.length<=4);
   assert.equal(q.marks,q.answer.points.length);
   for(const point of q.answer.points){
    assert.ok(point.label);
    assert.ok(point.alternatives.includes(point.label));
    for(const pattern of point.patterns||[])assert.match(q.modelAnswer,new RegExp(pattern,'i'),q.id+' nonmatching marking point');
   }
  }
 }
}
const file='assessment/app-v2.js',app=read(file);
assert.match(app,/id:'physics-nov26'/);
assert.ok(app.includes('/assessment/physics-nov26-20261113.json'));
assert.match(app,/subject:'Physics'.*physics-nov26/);
assert.match(app,/count:25,minutes:60/);
const expectedQuotas={'Particle model & changes of state':8,'Density calculations':4,'Conduction & insulation':7,'RP2 thermal insulation':3,'RP5 density':3};
for(const g of groupNames)assert.ok(app.includes("'"+g+"':"+expectedQuotas[g]),'quota missing for '+g);
assert.ok(read('assessment/index.html').includes('app-v2.js?v=20261114-physics-selection-qa1'));
assert.ok(read('study/physics/index.html').includes('/assessment/?subject=physics'));
const svg=read('assessment/diagrams/physics-nov26-rp2-cooling.svg');
for(const val of ['53.1','60.3','68.4','Temperature (°C)','Time (minutes)','Bubble wrap','Newspaper','No insulation']){
 assert.ok(svg.includes(val),'cooling graph missing '+val);
}
const added={1:3,2:7,4:9,7:3};
for(const [number,n] of Object.entries(added)){
 const id='phys-y9-p'+number;
 const topic=json('content/topics/'+id+'.json');
 const fresh=topic.questions.filter(q=>q.id.includes('-nov26-'));
 assert.equal(fresh.length,n,id+' new question count');
 assert.equal(topic.questions.length,topic.enabled,id+' count');
 assert.equal(new Set(topic.questions.map(q=>q.id)).size,topic.questions.length);
 const entry=catalog.topics.find(e=>e.topicId===id);
 assert.equal(entry.questions,topic.questions.length);
 assert.equal(entry.enabled,topic.enabled);
 assert.deepEqual(entry.formats,topic.formats);
 for(const q of fresh){
  assert.ok(q.prompt&&q.feedback&&q.answer);
  if(q.answer.mode==='mark_points'){
   assert.equal(q.answer.totalMarks,q.answer.markPoints.length);
   assert.equal(q.stimulus.marks,q.answer.totalMarks);
  }else{
   assert.equal(q.answer.mode,'choice');
   assert.ok(q.options.includes(q.answer.accepted[0]));
  }
 }
}
assert.equal(catalog.bySubjectYear.find(x=>x.subject==='physics'&&x.year===9).questions,1066);
assert.equal(catalog.totals.questions,16693);
assert.equal(catalog.totals.enabled,catalog.bySubjectYear.reduce((a,b)=>a+b.enabled,0));
assert.equal(catalog.totals.questions,catalog.bySubjectYear.reduce((a,b)=>a+b.questions,0));
console.log('PHYSICS_NOV26_QA PASS',JSON.stringify({examQuestions:all.length,examPerGroup:totals,existingTopicAdds:22,examSelection:25,scope:'conduction only'}));
