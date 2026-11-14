import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const bank=JSON.parse(fs.readFileSync('assessment/physics-nov26-20261113.json','utf8'));
const qs=bank.groups.flatMap(g=>g.questions);
const byId=new Map(qs.map(q=>[q.id,q]));
const code=fs.readFileSync('assessment/app-v2.js','utf8');
const scorerStart=code.indexOf('function physicsNov26Mark(q,value){');
const scorerEnd=code.indexOf('\nfunction mark(q,value){',scorerStart);
assert.ok(scorerStart>=0&&scorerEnd>scorerStart,'find production Physics scorer');
const scorer=vm.runInNewContext(code.slice(scorerStart,scorerEnd)+'\nphysicsNov26Mark;');

const selectStart=code.indexOf('function shuffle(a){');
const selectEnd=code.indexOf('\nfunction select(questions,count,',selectStart);
assert.ok(selectStart>=0&&selectEnd>selectStart,'find production school paper selector');
const select=vm.runInNewContext(code.slice(selectStart,selectEnd)+'\nselectPhysicsSchool;');
assert.equal(typeof select,'function');
assert.ok(code.includes("id==='physics-nov26'?selectPhysicsSchool(valid,p.count,previous,quotas)"));
assert.ok(code.includes("count:25,minutes:60"));
assert.ok(code.includes("The 85% threshold is a home practice target, not the school pass grade"));
assert.ok(!code.includes('const calcFinal='),'No final-answer full-credit shortcut allowed');
const quotas={
 'Particle model & changes of state':8,
 'Density calculations':4,
 'Conduction & insulation':7,
 'RP2 thermal insulation':3,
 'RP5 density':3
};
assert.equal(qs.length,200);
assert.ok(qs.every(q=>q.subject==='physics'&&q.year===9));
assert.equal(new Set(qs.map(q=>q.id)).size,qs.length);
assert.deepEqual(bank.groups.map(g=>g.questions.length),[40,40,40,40,40]);
assert.equal(qs.filter(q=>q.schoolExamStyle).length,148);

for(const q of qs){
 assert.ok(!/\b(convection|radiation|infrared)\b/i.test(q.prompt),q.id+' outside teacher scope');
 if(q.answer.mode==='choice'){
   assert.equal(q.options.length,4);
   assert.equal(new Set(q.options).size,4);
   assert.ok(q.options.includes(q.modelAnswer));
 }else{
   const m=scorer(q,q.modelAnswer);
   assert.equal(m.matched,q.marks,q.id+': model answer should get each method mark '+JSON.stringify(m));
   assert.equal(m.pointResults.length,q.marks);
   assert.equal(scorer(q,'I do not know.').matched,0,q.id+': irrelevant answer');
 }
}
let previous=[];
for(let n=0;n<300;n++){
 const picked=select(qs,25,previous,quotas);
 assert.equal(picked.length,25,'paper length');
 assert.equal(new Set(picked.map(q=>q.id)).size,25,'no duplicated concepts');
 for(const [topic,quota] of Object.entries(quotas)){
   const part=picked.filter(q=>q.topic===topic);
   assert.equal(part.length,quota,topic+' question quota');
   assert.ok(part.filter(q=>q.marks>=3).length>=2,topic+' at least two extended answers');
 }
 const ids=new Set(picked.map(q=>q.id));
 assert.ok(picked.some(q=>q.topic==='RP2 thermal insulation'&&q.diagram),'RP2 graph question on every paper');
 assert.ok([...['i08','i13']].some(id=>ids.has('phys-nov26-'+id)),'RP2 fair-test design on every paper');
 assert.ok(['r01','r02','r05','r12','r13','r27','r28','r29','r30'].some(id=>ids.has('phys-nov26-'+id)),'RP5 practical method on every paper');
 assert.ok(['r06','r09','r34','r35','r36'].some(id=>ids.has('phys-nov26-'+id)),'RP5 error/calculation on every paper');
 assert.ok(['d11','d13','d06'].some(id=>ids.has('phys-nov26-'+id)),'integrated density application on every paper');
 previous=picked.map(q=>q.id);
}
const finalOnly={
 d02:['2.7 g/cm³',1],d03:['135 g',1],d04:['50 cm³',1],
 d06:['0.24 kg',1],d08:['600 kg/m³',1],d09:['3 g/cm³',1],
 i04:['19.7 °C',1],i11:['1.16 °C/min',1],r06:['3 g/cm³',1],
 r11:['19 cm³',1],d11:['0.003 m³',1],d12:['0.240 kg',1],
 d13:['16.1 g/cm³',1],i12:['11.6°C',1]
};
for(const [id,[answer,expected]] of Object.entries(finalOnly)){
 const q=byId.get('phys-nov26-'+id);
 assert.equal(q.answer.methodRules.length,q.marks,'per-point rules for '+id);
 const m=scorer(q,answer);
 assert.equal(m.matched,expected,id+': final-only response cannot earn method marks '+JSON.stringify(m));
}
const worked=[
 ['d02','ρ = 540/200 = 2.7 g/cm³',3],
 ['d03','m = 2.7 × 50 = 135 g',2],
 ['d09','V = 65 - 40 = 25 cm³. Density = 75/25 = 3 g/cm³.',3],
 ['r06','65−40 =25 cm³. ρ =75/25 =3 g/cm³.',3],
 ['d11','V = 2.4/800 = 0.003 m³. It floats because 800 kg/m³ is less than water at 1000 kg/m³.',3],
 ['i04','80-60.3=19.7°C',2],
 ['i11','80−68.4=11.6°C. The rate is 1.16°C/min.',2]
];
for(const [id,answer,expected] of worked){
 const m=scorer(byId.get('phys-nov26-'+id),answer);
 assert.equal(m.matched,expected,id+': worked numeric answer '+JSON.stringify(m));
}
for(const [id,answer] of [
 ['d02','2.7 g/cm³ is not correct.'],
 ['r06','The density is not 3 g/cm³.'],
 ['p02','Solid particles are not regular and do not vibrate about fixed positions.'],
 ['d11','It does not float because 800 is higher than 1000.']
]){
 assert.equal(scorer(byId.get('phys-nov26-'+id),answer).matched,0,id+' reject contradiction');
}
console.log('PHYSICS_SCHOOL_STANDARD_V2_QA_PASS',JSON.stringify({
 bank:qs.length,extended:qs.filter(q=>q.marks>=3).length,
 examDraws:300,questionsPerExam:25,graphGuaranteed:true,rp5Guaranteed:true,
 calculatedFinalOnly:Object.keys(finalOnly).length,workedExamples:worked.length
}));
