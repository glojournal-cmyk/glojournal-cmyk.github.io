import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const bank=JSON.parse(fs.readFileSync('assessment/physics-nov26-20261113.json','utf8'));
const all=bank.groups.flatMap(g=>g.questions);
const questions=new Map(all.map(q=>[q.id,q]));
const app=fs.readFileSync('assessment/app-v2.js','utf8');
const start=app.indexOf('function physicsNov26Mark(q,value){');
const end=app.indexOf('\nfunction mark(q,value){',start);
assert.ok(start>0&&end>start,'independent scorer exists in live assessment script');
const scorer=vm.runInNewContext(app.slice(start,end)+'\nphysicsNov26Mark;');
assert.equal(typeof scorer,'function');
assert.match(app,/startsWith\('phys-nov26-'\)&&mode==='chemistry_rubric'\)return physicsNov26Mark\(q,value\)/);

for(const q of all){
  if(q.answer.mode==='choice'){
    assert.equal(q.options.length,4);
    assert.equal(new Set(q.options).size,4);
    assert.ok(q.options.includes(q.answer.accepted[0]));
  }else{
    const m=scorer(q,q.modelAnswer);
    assert.equal(m.credit,1,q.id+': model answer should get full credit '+JSON.stringify(m));
    assert.equal(m.pointResults.length,q.marks);
    assert.equal(m.total,q.marks);
    assert.equal(scorer(q,'I do not know.').credit,0,q.id+': unrelated sentence should score zero');
  }
}

const equivalent=[
 ['p02','The particles are tightly packed in an ordered lattice and oscillate about their fixed locations.',2],
 ['p03','There are big gaps among gas molecules but almost no gaps among liquid molecules.',2],
 ['p04','200 g because no matter was lost.',2],
 ['d02','rho = 540/200 = 2.7 g cm^-3',3],
 ['d03','m = 2.7 × 50 = 135 g',2],
 ['c05','Two glass panes trap a vacuum between them; the absence of particles stops conduction.',2],
 ['c06','Mineral wool contains small air pockets which are not good at transferring energy.',2],
 ['i01','I changed the insulating material and measured the decrease in water temperature.',2],
 ['i04','80 - 60.3 = 19.7°C',2],
 ['i05','Bubble wrap, since it only drops by 11.6 degrees versus 26.9 degrees unwrapped.',2],
 ['i11','11.6/10 = 1.16 degrees per minute.',2],
 ['r02','Fill the overflow vessel to spout level, immerse the object, and measure the volume of water collected with a measuring cylinder.',3],
 ['r03','Reading from above the scale creates an error; place your eyes level with the lower meniscus.',2],
 ['r04',"Zero the balance with the cylinder on it and record the liquid's mass directly.",2],
 ['r09','Trapped air displaces extra water, so the volume is overestimated and density is underestimated.',2]
];
for(const [suffix,response,expected] of equivalent){
 const q=questions.get('phys-nov26-'+suffix);
 assert.ok(q,'missing '+suffix);
 const got=scorer(q,response);
 assert.equal(got.matched,expected,q.id+' reasonable alternative answer '+JSON.stringify(got));
}
const contradictions=[
 ['p02','Solid particles are not close together and are not regular. They do not vibrate around fixed positions.'],
 ['p03','Gas particles do not have spaces between them, and liquids are not close together.'],
 ['r09','Air bubbles do not increase volume. The mass is not the same. Density cannot be too low.'],
 ['d02','2.7 g/cm3 is not the correct answer.'],
 ['i04','The answer is not 19.7 C.']
];
for(const [suffix,response] of contradictions){
 const q=questions.get('phys-nov26-'+suffix),got=scorer(q,response);
 assert.equal(got.matched,0,q.id+' must not reward explicit contradiction '+JSON.stringify(got));
}
for(const suffix of ['i03','i04','i05','i11','i12']){
 const q=questions.get('phys-nov26-'+suffix);
 assert.equal(q.diagram,'physics-nov26-rp2-cooling.svg',suffix+' cooling graph absent');
}
const svg=fs.readFileSync('assessment/diagrams/physics-nov26-rp2-cooling.svg','utf8');
assert.match(svg,/Illustrative practice data only/);
assert.doesNotMatch(svg,/data from supplied revision slides/);
assert.ok(app.includes('20261114-school-v2'));

console.log('PHYSICS_NOV26_MARKING_REGRESSION PASS',JSON.stringify({
 canonical:all.length,alternativeAnswers:equivalent.length,
 contradictionsRejected:contradictions.length,graphQuestions:5
}));
