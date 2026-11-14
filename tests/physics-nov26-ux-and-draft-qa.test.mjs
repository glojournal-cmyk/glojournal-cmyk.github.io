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
const draftIsSchool=body('function physicsNov26DraftSchoolAligned(draft){','\nfunction select(questions,count','physicsNov26DraftSchoolAligned');
const select=body('function shuffle(a){','\nfunction select(questions,count','selectPhysicsSchool');
const quotas={'Particle model & changes of state':8,'Density calculations':4,'Conduction & insulation':7,'RP2 thermal insulation':3,'RP5 density':3};
const paper=select(questions,25,[],quotas);
assert.equal(draftIsSchool({questions:paper}),true,'new exam must pass draft validation');
assert.equal(draftIsSchool({questions:paper.slice(0,24)}),false,'short draft is outdated');
const withoutGraph=paper.map(q=>({...q,diagram:undefined}));
assert.equal(draftIsSchool({questions:withoutGraph}),false,'missing practical diagram must be identified');
const withoutRP5=paper.map(q=>({...q,id:['phys-nov26-r01','phys-nov26-r02','phys-nov26-r05','phys-nov26-r12','phys-nov26-r13','phys-nov26-r27','phys-nov26-r28','phys-nov26-r29','phys-nov26-r30'].includes(q.id)?'old-'+q.id:q.id}));
assert.equal(draftIsSchool({questions:withoutRP5}),false,'legacy RP5 method must be identified');
assert.ok(code.includes("if(!aligned&&!hasExistingAnswers){delete state.drafts[id];draft=null;save();}"),'outdated unanswered papers must be replaced');
assert.ok(code.includes("else if(!aligned&&hasExistingAnswers){draft.legacyPhysicsSchool=true;}"),'student answers must be preserved');
assert.ok(code.includes("This saved paper was created before the latest school-style selection rules"),'explain old saved paper');
assert.ok(code.includes("p.id==='physics-nov26'?'Practice target: 85% (not a school grade)'"),'exam header labels practice');
assert.ok(code.includes("x.paperId==='physics-nov26'?(score>=85?'Practice target reached':'Below practice target')"),'history labels home practice');
assert.ok(code.includes("p.id==='physics-nov26'?(score>=85?'Practice target reached':'Below practice target')"),'result headings label home practice');
assert.ok(code.includes("v=20261114-physics-bank200-b"),'bank version cache');
assert.ok(fs.readFileSync('assessment/index.html','utf8').includes('app-v2.js?v=20261114-physics-bank200-b'),'script cache');
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
