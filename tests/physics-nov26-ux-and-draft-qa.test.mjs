import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync('assessment/app-v2.js','utf8');
const bank=JSON.parse(fs.readFileSync('assessment/physics-nov26-20261113.json','utf8'));
const questions=bank.groups.flatMap(g=>g.questions);
const point=(id)=>questions.find(q=>q.id==='phys-nov26-'+id);
function body(begin,end,exported){
 const start=code.indexOf(begin),stop=code.indexOf(end,start);
 assert.ok(start>=0&&stop>start,'production function not found '+exported);
 return vm.runInNewContext(code.slice(start,stop)+'\n'+exported+';',{'Math':Math});
}
const grader=body('function physicsNov26Mark(q,value){','\nfunction mark(q,value){','physicsNov26Mark');
const draftIsSchool=body('function physicsScenarioKey(q){','\nfunction select(questions,count','physicsNov26DraftSchoolAligned');
const select=body('function shuffle(a){','\nfunction select(questions,count','selectPhysicsSchool');
const quotas={'Particle model & changes of state':8,'Density calculations':4,'Conduction & insulation':7,'RP2 thermal insulation':3,'RP5 density':3};
const paper=select(questions,25,[],quotas);
assert.equal(draftIsSchool({questions:paper}),true,'new exam must pass draft validation');
const sameDataDraft=paper.map(q=>({...q}));
const densitySlots=sameDataDraft.flatMap((q,i)=>q.topic==='Density calculations'?[i]:[]);
const first=densitySlots.find(i=>['phys-nov26-d06','phys-nov26-d12'].includes(sameDataDraft[i].id))??densitySlots[0];
const second=densitySlots.find(i=>i!==first&&!['phys-nov26-d06','phys-nov26-d12'].includes(sameDataDraft[i].id));
assert.ok(second!==undefined,'independent density item available to simulate a same-data draft');
sameDataDraft[first].id='phys-nov26-d06';sameDataDraft[second].id='phys-nov26-d12';
assert.equal(new Set(sameDataDraft.map(q=>q.id)).size,25,'duplicate scenario can still have distinct IDs');
assert.equal(draftIsSchool({questions:sameDataDraft}),false,'reject a new draft with duplicate calculation inputs');
assert.equal(draftIsSchool({questions:paper.slice(0,24)}),false,'short draft is outdated');
const withoutGraph=paper.map(q=>({...q,diagram:undefined}));
assert.equal(draftIsSchool({questions:withoutGraph}),false,'missing practical diagram must be identified');
const rp5Focus=['r01','r02','r05','r06','r09','r12','r13','r27','r28','r29','r30','r33','r34','r35','r36','r39'].map(s=>'phys-nov26-'+s);
const withoutRP5=paper.map(q=>({...q,id:rp5Focus.includes(q.id)?'old-'+q.id:q.id}));
assert.equal(draftIsSchool({questions:withoutRP5}),false,'legacy RP5 method must be identified');
assert.ok(code.includes("if(!aligned&&!hasExistingAnswers){delete state.drafts[id];draft=null;save();}"),'outdated unanswered papers must be replaced');
assert.ok(code.includes("else if(!aligned&&hasExistingAnswers){draft.legacyPhysicsSchool=true;}"),'student answers must be preserved');
assert.ok(code.includes("This saved paper was created before the latest school-style selection rules"),'explain old saved paper');
assert.ok(code.includes("[...(state.recent[p.id]||[]),...d.questions.map(q=>q.id)].slice(-160)"),'Physics keeps a bounded 160-question rotation history');
assert.ok(code.includes("p.id==='physics-nov26'?'Practice target: 85% (not a school grade)'"),'exam header labels practice');
assert.ok(code.includes("x.paperId==='physics-nov26'?(score>=85?'Practice target reached':'Below practice target')"),'history labels home practice');
assert.ok(code.includes("p.id==='physics-nov26'?(score>=85?'Practice target reached':'Below practice target')"),'result headings label home practice');
assert.ok(code.includes("v=20261114-physics-selection-qa1"),'bank version cache');
assert.ok(fs.readFileSync('assessment/index.html','utf8').includes('app-v2.js?v=20261114-physics-selection-qa1'),'script cache');
const ring=point('d13');
const correct=[
 'Density = mass/volume = 9.65/0.60 = 16.1 g/cm³, so the ring is not pure gold since 16.1 is below 19.3 g/cm³.',
 'ρ=9.65/0.60=16.1 g/cm³. Not pure gold, because 16.1 is lower than 19.3 g/cm³.'
];
for(const answer of correct)assert.equal(grader(ring,answer).matched,4,'award all valid gold-density marks '+answer);
for(const [answer,expected] of [
 ['The density is 16.1 g/cm3. Since 16.1 < 19.3, this ring isn\'t pure gold.',2],
 ['The density is not 16.1g/cm3, so it is not pure gold.',0]
]){
 const m=grader(ring,answer);
 assert.equal(m.matched,expected,'no credit for unearned steps or incorrect statement '+JSON.stringify(m));
}
for(const q of questions){
 if(q.answer.mode!=='chemistry_rubric')continue;
 assert.equal(grader(q,q.modelAnswer).matched,q.marks,'full credit for model answer '+q.id);
}
console.log('PHYSICS_END_TO_END_QA_PASS',JSON.stringify({
 questions:questions.length,savedDrafts:'preserved when answered',goldDensityVariants:correct.length,
 scope:'physics only',practiceGrades:'no official school pass'
}));
