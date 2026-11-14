import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const bank=JSON.parse(fs.readFileSync('assessment/physics-nov26-20261113.json','utf8'));
const app=fs.readFileSync('assessment/app-v2.js','utf8');
const qs=bank.groups.flatMap(g=>g.questions),byId=new Map(qs.map(q=>[q.id,q]));
const scorerStart=app.indexOf('function physicsNov26Mark(q,value){');
const scorerEnd=app.indexOf('\nfunction mark(q,value){',scorerStart);
assert.ok(scorerStart>=0&&scorerEnd>scorerStart);
const score=vm.runInNewContext(app.slice(scorerStart,scorerEnd)+'\nphysicsNov26Mark;');
const selStart=app.indexOf('function shuffle(a){');
const selEnd=app.indexOf('\nfunction select(questions,count,',selStart);
assert.ok(selStart>=0&&selEnd>selStart);
const select=vm.runInNewContext(app.slice(selStart,selEnd)+'\nselectPhysicsSchool;');
const aligned=vm.runInNewContext(app.slice(selStart,selEnd)+'\nphysicsNov26DraftSchoolAligned;');
const topicCounts={'Particle model & changes of state':8,'Density calculations':4,'Conduction & insulation':7,'RP2 thermal insulation':3,'RP5 density':3};
assert.ok(bank.version.startsWith('2026-11-14-physics-bank200'));
assert.equal(qs.length,200);
assert.deepEqual(bank.groups.map(g=>g.questions.length),[40,40,40,40,40]);
assert.equal(new Set(qs.map(q=>q.id)).size,200);
assert.equal(new Set(qs.map(q=>q.conceptId)).size,200);
assert.equal(qs.filter(q=>q.schoolExamStyle).length,148);
assert.equal(qs.filter(q=>q.answer.mode==='choice').length,77);
assert.equal(qs.filter(q=>q.answer.mode==='chemistry_rubric').length,123);
assert.ok(qs.every(q=>q.year===9&&q.subject==='physics'&&q.topic&&q.source));
assert.ok(qs.every(q=>!/\b(convection|radiation|infrared)\b/i.test(q.prompt)),'Scope must remain conduction-only');
assert.ok(app.includes("count:25,minutes:60,groups:{'Particle model & changes of state':8,'Density calculations':4,'Conduction & insulation':7,'RP2 thermal insulation':3,'RP5 density':3}"));
assert.ok(app.includes("20261114-physics-selection-qa1"));
assert.ok(fs.readFileSync('assessment/index.html','utf8').includes('app-v2.js?v=20261114-physics-selection-qa1'));
for(const q of qs){
 assert.equal(q.answer.accepted.includes(q.modelAnswer),true,q.id+' model key');
 if(q.answer.mode==='choice'){
  assert.equal(q.marks,1,q.id);
  assert.equal(q.options.length,4,q.id);
  assert.equal(new Set(q.options).size,4,q.id);
  assert.ok(q.options.includes(q.modelAnswer),q.id);
 }else{
  const got=score(q,q.modelAnswer);
  assert.equal(got.matched,q.marks,q.id+' canonical full credit '+JSON.stringify(got));
  assert.equal(got.pointResults.length,q.marks,q.id);
  assert.equal(score(q,'I do not know.').matched,0,q.id+' irrelevant response');
 }
}
let previous=[],maxOverlap=0;
for(let n=0;n<1000;n++){
 const paper=select(qs,25,previous,topicCounts),ids=paper.map(q=>q.id);
 assert.equal(paper.length,25,'25 questions');
 assert.equal(new Set(ids).size,25,'no duplication within a paper');
 for(const [topic,n] of Object.entries(topicCounts)){
  const subset=paper.filter(q=>q.topic===topic);
  assert.equal(subset.length,n,'weighted school scope '+topic);
  assert.ok(subset.filter(q=>q.marks>=3).length>=(topic==='RP2 thermal insulation'||topic==='RP5 density'?1:2),topic+' enough extended questions');
  assert.equal(subset.filter(q=>q.answer.mode==='choice').length,1,topic+' one MC');
 }
 assert.equal(aligned({questions:paper}),true,'paper must meet updated school coverage');
 const overlap=ids.filter(id=>previous.includes(id)).length;
 maxOverlap=Math.max(maxOverlap,overlap);
 assert.equal(overlap,0,'avoid repeating immediately previous mock questions');
 previous=ids;
}
const numericCases=[
 ['d23','density',360,120,3,'g/cm³'],
 ['d24','density',42,60,0.7,'g/cm³'],
 ['d25','density',312,40,7.8,'g/cm³'],
 ['d26','density',285,150,1.9,'g/cm³'],
 ['d27','density',96,160,0.6,'g/cm³'],
 ['d28','density',0.36,0.003,120,'kg/m³'],
 ['d29','density',1.44,0.0012,1200,'kg/m³'],
 ['d30','density',0.96,0.0012,800,'kg/m³'],
 ['d31','mass',2.5,24,60,'g'],
 ['d32','mass',0.8,150,120,'g'],
 ['d33','mass',2400,0.015,36,'kg'],
 ['d34','mass',1.4,75,105,'g'],
 ['d35','volume',7,126,18,'cm³'],
 ['d36','volume',750,675,0.9,'m³'],
 ['d37','volume',2.7,54,20,'cm³'],
 ['d38','displacement',110,20,5.5,'g/cm³'],
 ['d39','cube',256,64,4,'g/cm³'],
 ['d40','cuboid',2.5,72,180,'g']
];
for(const [id,type,a,b,expected,unit] of numericCases){
 const actual=type==='density'||type==='displacement'||type==='cube'?a/b:
   type==='mass'||type==='cuboid'?a*b:b/a;
 assert.ok(Math.abs(actual-expected)<1e-9,'independent arithmetic '+id+' '+actual+' vs '+expected);
 const q=byId.get('phys-nov26-'+id);
 assert.ok(q,q?.id||'missing '+id);
 assert.ok(q.modelAnswer.includes(String(expected)+' '+unit),id+' model numeric answer and unit');
 assert.equal(q.marks,q.answer.methodRules.length,id+' distinct equation, substitution and answer marks');
 const bare=score(q,expected+' '+unit);
 assert.equal(bare.matched,1,id+' final answer only earns answer mark '+JSON.stringify(bare));
 assert.equal(score(q,q.modelAnswer).matched,q.marks,id+' working earns full marks');
}
assert.equal(score(byId.get('phys-nov26-d23'),'Not 3 g/cm³').matched,0,'reject negated final answer');
assert.equal(score(byId.get('phys-nov26-d40'),'181 g').matched,0,'reject incorrect calculation');
console.log('PHYSICS_NOV26_BANK200_QA_PASS',JSON.stringify({
 total:qs.length,topics:bank.groups.map(g=>g.questions.length),choice:77,
 rubric:123,mathCases:numericCases.length,randomPaperDraws:1000,maxConsecutiveOverlap:maxOverlap
}));
