import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assessment/app-v2.js','utf8');
const bank=JSON.parse(fs.readFileSync('assessment/physics-nov26-20261113.json','utf8'));
const questions=bank.groups.flatMap(group=>group.questions);
const start=app.indexOf('function shuffle(a){');
const end=app.indexOf('\nfunction select(questions,count,',start);
assert.ok(start>=0&&end>start,'production selection functions exist');
const source=app.slice(start,end);
const select=vm.runInNewContext(source+'\nselectPhysicsSchool;');
const aligned=vm.runInNewContext(source+'\nphysicsNov26DraftSchoolAligned;');
const sameData=new Map([
 ['phys-nov26-d06','cuboid-2x3x5-density-8'],
 ['phys-nov26-d12','cuboid-2x3x5-density-8'],
 ['phys-nov26-d09','displacement-75g-40-to-65'],
 ['phys-nov26-r06','displacement-75g-40-to-65']
]);
const scenarioKey=id=>sameData.get(id)||id;
const quotas={
 'Particle model & changes of state':8,
 'Density calculations':4,
 'Conduction & insulation':7,
 'RP2 thermal insulation':3,
 'RP5 density':3
};
const focus=['r01','r02','r05','r06','r09','r12','r13','r27',
 'r28','r29','r30','r33','r34','r35','r36','r39']
 .map(x=>'phys-nov26-'+x);
assert.equal(questions.length,200);
assert.equal(new Set(questions.map(q=>q.id)).size,200);
assert.ok(app.includes("state.recent[p.id]=p.id==='physics-nov26'"),'Physics-specific recent history');
assert.ok(app.includes("[...(state.recent[p.id]||[]),...d.questions.map(q=>q.id)].slice(-160)"),'bounded 160-item history');
let history=[],lastPaper=[],lastScenarios=[],lastOverlap=0,maxOverlap=0;
const counts=new Map(questions.map(q=>[q.id,0]));
const simulations=5000;
for(let n=0;n<simulations;n++){
 const paper=select(questions,25,history,quotas);
 const ids=paper.map(q=>q.id);
 assert.equal(paper.length,25,'paper contains 25 items');
 assert.equal(new Set(ids).size,25,'unique question IDs');
 const scenarios=ids.map(scenarioKey);
 assert.equal(new Set(scenarios).size,25,'no two questions with identical calculation inputs in one mock');
 assert.equal(paper.filter(q=>['phys-nov26-d06','phys-nov26-d11','phys-nov26-d12','phys-nov26-d13'].includes(q.id)).length,1,
  'rotate exactly one integrated density application per paper');
 assert.equal(scenarios.filter(key=>lastScenarios.includes(key)).length,0,
  'avoid same numeric scenario across immediately consecutive mocks');
 assert.equal(aligned({questions:paper}),true,'every paper has valid practical coverage');
 assert.equal(paper.filter(q=>q.answer.mode==='choice').length,5,'five MC per paper');
 for(const [topic,quantity] of Object.entries(quotas)){
   const part=paper.filter(q=>q.topic===topic);
   assert.equal(part.length,quantity,topic+' weighted count');
   assert.equal(part.filter(q=>q.answer.mode==='choice').length,1,topic+' one MC');
   const extended=topic==='RP2 thermal insulation'||topic==='RP5 density'?1:2;
   assert.ok(part.filter(q=>q.marks>=3).length>=extended,topic+' extended answers');
 }
 assert.ok(paper.some(q=>q.topic==='RP2 thermal insulation'&&q.diagram),'RP2 graph');
 assert.ok(paper.some(q=>focus.includes(q.id)),'RP5 practical method or evaluation');
 assert.ok(paper.some(q=>['phys-nov26-d11','phys-nov26-d13','phys-nov26-d06','phys-nov26-d12'].includes(q.id)),
   'integrated density application');
 const overlap=ids.filter(id=>lastPaper.includes(id)).length;
 maxOverlap=Math.max(maxOverlap,overlap);lastOverlap+=overlap;
 assert.equal(overlap,0,'previous-paper items must not repeat immediately');
 for(const id of ids)counts.set(id,counts.get(id)+1);
 history=[...history,...ids].slice(-160);
 lastPaper=ids;lastScenarios=scenarios;
}
const never=questions.filter(q=>counts.get(q.id)===0);
assert.deepEqual(never.map(q=>q.id),[],'all 200 questions must actually be selectable');
for(const topic of ['RP2 thermal insulation','RP5 density']){
 const group=questions.filter(q=>q.topic===topic);
 assert.equal(group.filter(q=>counts.get(q.id)>0).length,40,topic+' all 40 accessible');
 assert.ok(group.filter(q=>q.marks===2&&counts.get(q.id)>0).length>=8,
  topic+' at least eight 2-mark questions accessed');
}
assert.equal(lastOverlap,0);
console.log('PHYSICS_NOV26_REACHABILITY_QA_PASS',JSON.stringify({
 bank:questions.length,simulations,draws:simulations*25,
 accessible:questions.filter(q=>counts.get(q.id)>0).length,
 inaccessible:never.length,maxConsecutiveOverlap:maxOverlap,historyWindow:160,
 rp2Accessible:40,rp5Accessible:40
}));
