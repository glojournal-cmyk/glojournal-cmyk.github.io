const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('assessment/app-v2.js','utf8');
const sandbox={};vm.createContext(sandbox);
vm.runInContext(src.slice(src.indexOf('function normal('),src.indexOf('async function start(')),sandbox);
vm.runInContext(src.slice(src.indexOf('function shuffle('),src.indexOf('function chemistryLevel(')),sandbox);
vm.runInContext(src.slice(src.indexOf('function selectBiology('),src.indexOf('function selectCreusa(')),sandbox);
vm.runInContext("function questionMarks(q){return ['chemistry_rubric','biology_rubric'].includes(q.answer?.mode)?q.answer.points.length:1}",sandbox);
vm.runInContext(fs.readFileSync('assessment/biology-marking-20261003.js','utf8'),sandbox);
const bank=JSON.parse(fs.readFileSync('assessment/biology-cell-structure-20261003.json'));
const failures=[];
for(const q of bank.questions){const r=sandbox.mark(q,q.modelAnswer);if(r.credit!==1)failures.push({id:q.id,model:q.modelAnswer,points:r.pointResults});assert.equal(sandbox.mark(q,'').credit,0);assert(q.marks>=1&&q.marks<=5);assert.equal(q.marks,q.answer.points.length)}
console.log('Model answer failures:',JSON.stringify(failures));
const groups=Object.fromEntries([...new Set(bank.questions.map(q=>q.topic))].map(t=>[t,4]));
let recent=[];let overlap=[];
for(let k=0;k<200;k++){
 const p=sandbox.selectBiology(bank.questions,recent,groups);
 assert.equal(p.length,24);assert.equal(new Set(p.map(q=>q.id)).size,24);assert.equal(p.reduce((s,q)=>s+q.marks,0),60);
 for(const t in groups)assert.equal(p.filter(q=>q.topic===t).length,4);
 for(const image of ['cells-20261003.webp','specialised-20261003.webp','microscopy-20261003.webp'])assert.equal(p.filter(q=>q.diagram===image).length,1);
 if(recent.length)overlap.push(p.filter(q=>recent.includes(q.id)).length);
 recent=p.map(q=>q.id);
}
const sperm=bank.questions[24];assert.equal(sandbox.mark(sperm,'The tail propels the sperm towards the egg.').credit,0.5);
assert.equal(sandbox.mark(sperm,'The tail does not propel the sperm. Mitochondria do not release energy for movement.').credit,0);
assert.equal(sandbox.mark(bank.questions[62],'30 degrees C.').credit,0);
assert.equal(sandbox.mark(bank.questions[50],'Stain increases contrast. Lowering at an angle prevents air bubbles.').credit,1);
assert.equal(sandbox.mark(bank.questions[52],'12 mm = 12000 um. Magnification = 400').credit,1);
console.log(JSON.stringify({questions:72,modelsPassed:72-failures.length,balancedPapers:200,marks:60,overlapMin:Math.min(...overlap),overlapMax:Math.max(...overlap),partialCredit:true,negation:true},null,2));
if(failures.length)process.exit(1);
