import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const bank=JSON.parse(read('assessment/biology-cell-structure-20261003.json'));
const app=read('assessment/app-v2.js');
const index=read('assessment/index.html');
const guide=read('assessment/biology-cell-structure/index.html');
const school=read('assets/school-revision-data-20261004.js');
const AQA=['4.1.1.1','4.1.1.2','4.1.1.3','4.1.1.4','4.1.1.5','4.1.1.6'];
assert.equal(bank.assessmentWeek,'2026-11-16','official teacher notice: week of 16 November 2026');
assert.equal(bank.questions.length,144);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,144);
for(const spec of AQA){
  const rows=bank.questions.filter(q=>q.specification===spec);
  assert.equal(rows.length,24,`${spec}: require 24 core questions`);
  assert.equal(rows.filter(q=>q.marks===2).length,12);
  assert.equal(rows.filter(q=>q.marks===3).length,12);
}
for(const q of bank.questions){
  assert.equal(q.answer?.mode,'biology_rubric',q.id);
  assert.equal(q.answer?.points?.length,q.marks,q.id);
  assert.ok(q.modelAnswer&&q.prompt&&q.examGuidance?.strategy&&q.markKeywords?.length,q.id);
  assert.ok(!/4\.1\.[23]/.test(q.specification),q.id);
}
assert.match(app,/examWeek:'2026-11-16',ids:\['biology-cell-structure','biology-nov2'/);
assert.match(app,/First GCSE Biology assessment: week beginning 16 November 2026/);
assert.match(app,/const school=SCHOOL_ASSESSMENTS\.filter\(x=>x\.id!=='school-biology-20261102'/);
assert.doesNotMatch(app,/x\.id!=='school-biology-20261116'/);
assert.match(app,/[Hh]ome practice target 85%/);
assert.match(school,/id:'school-biology-20261116'/);
assert.ok(!index.includes('Biology: first GCSE assessment · week beginning 16 November'), 'Remove redundant banner to keep all mock cards visible on iPad');
assert.match(index,/app-v2\.js\?v=20261114-[^" ]+/, 'Assessment app revision must have a Nov 14 cache key');
assert.equal((guide.match(/class="question"/g)||[]).length,156,'144 core and 12 extended');
assert.equal((guide.match(/self-mark checklist/g)||[]).length,12);
for(const marks of [4,6])assert.ok(guide.includes(`<span>${marks} marks</span>`),`missing ${marks}-mark extended questions`);
for(const q of bank.questions){
 const normalized=q.prompt.replaceAll('&','&amp;').replaceAll('<','&lt;');
 assert.ok(guide.includes(normalized)||guide.includes(q.prompt),`revision page missing ${q.id}`);
}
assert.equal(bank.questions.filter(q=>q.id.startsWith('bio-cell-20261114-')).length,72);
assert.equal(bank.questions.filter(q=>q.id.startsWith('bio-cell-20261003-')).length,72);
assert.ok(guide.includes('156 questions (144 core + 12 extended)'));
for(const word of ['red blood cell','bacterial population','Required Practical 1','Required Practical 2','microscopy','aseptic'])assert.ok(guide.toLowerCase().includes(word.toLowerCase()),word);
console.log('Biology 4.1.1 November school QA: 144 graded core questions, 6 topics, 156 guide questions, 12 extended answer checklists, confirmed date, tracker and links: PASS');
