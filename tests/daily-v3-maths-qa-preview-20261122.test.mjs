import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const qa=JSON.parse(read('qa-staging/math-v31-original-sample10.json'));
const html=read('study/maths/daily/index.html');
const js=read('assets/math-study/daily-v31-qa-preview.js');
const count=(key)=>qa.questions.reduce((n,q)=>n+(q[key]==='G7'?0:0),0);
test('Reviewer sample contains exactly ten original Maths V3.1 IDs with six options',()=>{
 assert.equal(qa.status,'QA_ONLY_NOT_APPROVED');
 assert.equal(qa.questions.length,10);
 assert.equal(new Set(qa.questions.map(q=>q.id)).size,10);
 assert.equal(new Set(qa.questions.map(q=>q.templateId)).size,10);
 for(const q of qa.questions){
  assert.match(q.id,/^LUX-MATH-Y9-/);
  assert.equal(q.options.length,6,q.id);
  assert.deepEqual(new Set(q.options.map(o=>o.id)),new Set(['A','B','C','D','E','F']));
  assert.equal(q.options.filter(o=>o.id===q.correctOptionId).length,1);
  assert.ok(q.stem.includes('$'),'MathJax needed for '+q.id);
  assert.ok(q.workedSolutionSteps.length>=2);
 }
});
test('Reviewer sample has five topics two each, four G7/four G8/two G8-9',()=>{
 const buckets={};
 const grades={'G7':0,'G8':0,'G8-9':0};
 for(const q of qa.questions){
  buckets[q.topicId]=(buckets[q.topicId]||0)+1;
  assert.ok(Object.hasOwn(grades,q.difficultyTarget));
  grades[q.difficultyTarget]++;
 }
 assert.equal(Object.keys(buckets).length,5);
 assert.ok(Object.values(buckets).every(n=>n===2));
 assert.deepEqual(grades,{'G7':4,'G8':4,'G8-9':2});
});
test('Live Maths Daily page is fail-closed, never imports Scholar state or writes a student store',()=>{
 assert.match(html,/ACADEMIC QA HOLD/);
 assert.match(html,/NOT AVAILABLE FOR DAILY CREDIT/);
 assert.ok(html.includes('daily-v31-qa-preview.js'));
 assert.ok(js.includes("params.get('qa')==='1'"));
 assert.ok(js.includes("QA_ONLY_NOT_APPROVED"));
 assert.ok(js.includes('mathsRichTextHTML'));
 assert.ok(js.includes('mathsOptionHTML'));
 assert.doesNotMatch(js,/MathJax|cdn\.jsdelivr|katex\.min\.js/);
 assert.ok(js.includes('root.dataset.questionId=q.id'));
 assert.ok(js.includes('optionId===q.correctOptionId'));
 assert.doesNotMatch(js,/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|__luxStore|bumpDaily|award\(/);
 assert.doesNotMatch(html,/__luxStore|bumpDaily|localStorage|indexedDB|MathJax|cdn\.jsdelivr/);
});
