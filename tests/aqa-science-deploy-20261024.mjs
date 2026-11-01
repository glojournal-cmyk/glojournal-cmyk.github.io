import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='content/topics/';
const rows=[['physics','phys-y9-p2','8463',80],['chemistry','chem-y9-c4','8462',117],['biology','bio-y9-b3','8461',68]];
const catalog=JSON.parse(fs.readFileSync('content/catalog.json','utf8'));
let total=0,examQuestions=0,fullSixMarks=0;
for(const [subject,topicId,spec,expected] of rows){
 const doc=JSON.parse(fs.readFileSync(root+topicId+'.json','utf8'));
 assert.ok(doc.questions.length>=expected,`${topicId}: original question capacity unexpectedly shrank`);
 assert.equal(doc.enabled+doc.preview+doc.disabled,doc.questions.length);
 const practice=doc.questions.filter(q=>q.id.includes('-aqa-exam-20261024-'));
 assert.equal(practice.length,4);
 for(const q of practice){
   assert.equal(q.status,'enabled');
   assert.equal(q.formal,false,'No automatic Daily/Mastery credit for preview question');
   assert.equal(q.examPractice.specification,spec);
   assert.equal(q.examPractice.board,'AQA');
   assert.equal(q.examPractice.marking,'formative');
   assert.ok(q.prompt&&q.answer&&q.feedback&&q.task);
   if(q.answer.mode==='mark_points'){
     assert.equal(q.stimulus.marks,q.answer.totalMarks);
     assert.equal(q.answer.markPoints.length,q.answer.totalMarks);
     assert.equal(q.answer.markPointAlternatives.length,q.answer.totalMarks);
     assert.equal(q.answer.requireFullMarks,true);
     assert.ok(q.answer.markPoints.every(p=>q.answer.modelAnswer.includes(p)));
   }else{
     assert.equal(q.answer.mode,'numeric');
     assert.ok(Number.isFinite(q.answer.value));
     assert.ok(Array.isArray(q.answer.units)&&q.answer.working);
   }
   if(q.answer.totalMarks===6)fullSixMarks++;
   examQuestions++;
 }
 assert.equal(catalog.topics.find(t=>t.topicId===topicId).questions,doc.questions.length,`${topicId}: catalog/source count drift`);
 total+=practice.length;
}
assert.equal(examQuestions,12);
assert.equal(fullSixMarks,6);
assert.ok(catalog.totals.questions>=16539,'Catalog questions unexpectedly below original AQA release');
assert.ok(catalog.totals.enabled>=15410,'Enabled count unexpectedly below original AQA release');
assert.equal(catalog.bySubjectYear.reduce((n,t)=>n+t.questions,0),catalog.totals.questions);
const html=fs.readFileSync('assessment/index.html','utf8');
const js=fs.readFileSync('assessment/aqa-science-practice-20261024.js','utf8');
const css=fs.readFileSync('assessment/aqa-science-practice-20261024.css','utf8');
for(const path of ['phys-y9-p2.json','chem-y9-c4.json','bio-y9-b3.json'])assert.ok(js.includes(path));
for(const t of ['id="gcse-science-panel"','id="gcse-science-selector"','id="gcse-science-questions"','aqa-science-practice-20261024.js','aqa-science-practice-20261024.css'])assert.ok(html.includes(t));
assert.ok(js.includes('Self-check: '));
assert.ok(!js.includes('localStorage')&&!js.includes('bumpDaily')&&!js.includes('recordMastery'));
assert.ok(css.includes('gcse-science-card'));
console.log('AQA_SCIENCE_DEPLOY_QA',JSON.stringify({topics:3,added:12,sixMarkTasks:6,isolated:true,linkedFromAssessment:true,failures:0}));
