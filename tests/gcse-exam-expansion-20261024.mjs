import fs from 'node:fs';
import assert from 'node:assert/strict';
const bank=JSON.parse(fs.readFileSync('content/exam-practice/gcse-20261024.json'));
assert.equal(bank.questions.length,60);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,60);
assert.equal(new Set(bank.questions.map(q=>q.prompt+'\n'+(q.stimulus||q.audioScript||''))).size,60);
for(const s of ['physics','chemistry','biology','french','latin'])assert.equal(bank.questions.filter(q=>q.subject===s).length,12);
for(const q of bank.questions){
 assert.ok(q.prompt&&q.specRef&&q.markingNote&&q.markScheme.length>=3,q.id);
 assert.ok(Number.isInteger(q.marks)&&q.marks>0);
 assert.equal(q.marking,'self_or_teacher');
 if(q.kind==='extended'){assert.equal(q.marks,6);assert.equal(q.levels.length,4);assert.match(q.markingNote,/not a one-mark-per-keyword/);}
 if(q.kind==='writing90'){assert.equal(q.bullets.length,3);assert.equal(q.marks,15);}
 if(q.kind==='writing150'){assert.equal(q.bullets.length,2);assert.equal(q.marks,25);}
 if(q.subject==='french'&&q.kind==='translation'){assert.ok(q.prompt.split('\n')[1].split(/\s+/).length>=50);assert.equal(q.meaningUnits.length,15);}
 if(q.kind==='dictation')assert.ok(q.audioScript.split(/\s+/).length>=30);
 if(q.kind==='readaloud'){assert.ok(q.stimulus.split(/\s+/).length>=50);assert.equal(q.teacherScript.length,4);}
 if(q.subject==='latin'&&q.kind==='literature'){assert.match(q.textSource,/not a verified/);assert.ok(q.stimulus.includes('magno veluti cum flamma sonore'));assert.ok(!q.stimulus.includes('crepitante'));}
}
// Independent numerical checks against the authored answer keys.
const answers={'physics-01':.216/(.02*.03*.04),'physics-02':60*200/(.5*40),'physics-03':100*120/.03,'chemistry-01':36/60,'chemistry-02':(.75*35+.25*37),'biology-01':45*1000/30,'biology-02':12/20*5,'biology-03':(2.76-2.4)/2.4*100,'biology-04':200*2**(120/30)};
for(const [key,value] of Object.entries(answers)){const [s,n]=key.split('-');const q=bank.questions.find(q=>q.id===`${s}-exam-20261024-${n}`);assert.ok(Math.abs(q.check.value-value)<1e-8,key);}
for(const s of Object.keys(bank.subjects))assert.ok(fs.readFileSync(`study/${s}/index.html`,'utf8').includes(`/study/exam-practice/?subject=${s}`));
console.log('PASS: 60 original tasks, five subject mappings, rubric structure, task lengths, independent calculations and Study entry links.');
