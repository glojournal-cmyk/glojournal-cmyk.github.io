import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(readFileSync(join(root,'content/physics-gcse-mastery-v21/bank.json'),'utf8'));
const app=readFileSync(join(root,'study/physics/mastery/app.js'),'utf8');
const html=readFileSync(join(root,'study/physics/mastery/index.html'),'utf8');
const figures=readFileSync(join(root,'study/physics/mastery/diagrams.js'),'utf8');
const questions=bank.groups.flatMap(g=>g.questions);
assert.equal(questions.length,90);
assert.deepEqual(bank.groups.map(g=>g.questions.length),[30,30,30]);
assert.deepEqual(bank.groups.map(g=>g.questions.reduce((s,q)=>s+q.marks,0)),[79,72,82]);
assert.equal(questions.reduce((s,q)=>s+q.marks,0),233);
assert.equal(new Set(questions.map(q=>q.id)).size,90);
assert.equal(new Set(questions.map(q=>q.conceptId)).size,90);
const statuses={};
for(const q of questions){
 assert.ok(q.prompt&&q.id&&q.answer?.accepted?.length,`Incomplete ${q.id}`);
 assert.ok(q.marks>=1&&q.marks<=6,`Bad marks ${q.id}`);
 assert.equal(q.answer.markPoints.length,q.marks,`Rubric mark count ${q.id}`);
 assert.ok(['choice','REVIEW_REQUIRED','NUMERIC_VERIFIER_REQUIRED'].includes(q.answer.mode),`Unknown mode ${q.id}`);
 if(q.answer.mode==='choice'){
  assert.ok(q.options.includes(q.answer.accepted[0]),`MCQ answer not in options ${q.id}`);
  assert.equal(q.marks,1,`MCQ marks ${q.id}`);
 }
 if(q.answer.mode==='NUMERIC_VERIFIER_REQUIRED'){
  assert.equal(q.marks,1,`Numeric pilot only handles single-point auto marks ${q.id}`);
  assert.ok(Number.isFinite(q.numericAnswer?.value)&&q.numericAnswer.unit,`Numeric rule ${q.id}`);
 }
 if(q.answer.mode==='REVIEW_REQUIRED')assert.ok(q.masteryReviewRequired,`Manual review flag missing ${q.id}`);
 if(q.diagram){const m=q.diagram.match(/figure-(\d+)-/);assert.ok(m&&Number(m[1])>=1&&Number(m[1])<=8,`Unmapped diagram ${q.id}`)}
 if(/\b(?:previous question|above question|Q\d+|as described earlier|the same beaker with)\b/i.test(q.prompt))throw new Error(`Cross-question dependency ${q.id}`);
 statuses[q.answer.mode]=(statuses[q.answer.mode]||0)+1;
}
assert.deepEqual(statuses,{choice:9,NUMERIC_VERIFIER_REQUIRED:3,REVIEW_REQUIRED:78});
assert.ok(html.includes('/study/physics/mastery/app.js'));
assert.ok(app.includes('lux-physics-gcse-mastery-pilot-v21-draft'));
assert.ok(!/grantWardrobe|addMasteryEvidence|updateDailyTask|giveMP|awardXP/.test(app),'Pilot must never grant main-app rewards');
assert.ok(app.includes("state.phase='review'"),'Feedback must wait until submission');
assert.ok(app.includes("state.phase='completed'"),'Self-assessment must be completed');
assert.ok(figures.includes('figure-(\\d+)-'),'All diagrams must be mapped to SVG');
assert.ok(html.includes('viewport-fit=cover'),'iPad viewport config required');
console.log(`PASS: ${questions.length} questions, 233 marks, ${statuses.choice} MCQ, ${statuses.NUMERIC_VERIFIER_REQUIRED} numeric, ${statuses.REVIEW_REQUIRED} review-required; diagrams linked; pilot state isolated.`);