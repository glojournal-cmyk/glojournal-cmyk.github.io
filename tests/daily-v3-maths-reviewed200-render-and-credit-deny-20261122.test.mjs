import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mathsRichTextHTML, mathsOptionHTML, latexMathML }
  from '../assets/math-study/math-v31-native-mathml.js';

const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const topics=[
 'math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
 'math-y9-straight-line-graphs','math-y9-simultaneous-equations'
];
const letters=['A','B','C','D','E','F'];
test('all 200 reviewed redraft stems, all 1200 candidate options and all worked lines render offline',()=>{
 assert.equal(bank.status,'DRAFT_CONTENT_REVIEW');
 assert.equal(bank.questions.length,200);
 const sourceIds=new Set(),revisionIds=new Set();
 const counts=Object.fromEntries(topics.map(topic=>[topic,0]));
 let stems=0,options=0,worked=0;
 for(const q of bank.questions){
  assert.ok(topics.includes(q.topicId),q.sourceId+' unexpected topic');
  counts[q.topicId]++;
  assert.ok(!sourceIds.has(q.sourceId),q.sourceId+' duplicate source ID');
  assert.ok(!revisionIds.has(q.revisionId),q.sourceId+' duplicate revision ID');
  sourceIds.add(q.sourceId);revisionIds.add(q.revisionId);
  assert.equal(q.dailyEligible,false,q.sourceId+' must remain release-blocked');
  assert.ok(q.revisionId!==q.sourceId,q.sourceId+' must be a versioned candidate');
  assert.ok(typeof q.stem==='string'&&q.stem.trim().length>=10,q.sourceId);
  const rendered=mathsRichTextHTML(q.stem);
  assert.ok(rendered.length>0,q.sourceId+' blank stem');
  assert.doesNotMatch(rendered,/<script\b|<iframe\b|https?:\/\//i,q.sourceId+' unsafe HTML');
  stems++;
  assert.deepEqual(q.options.map(o=>o.id),letters,q.sourceId+' missing A–F');
  assert.equal(new Set(q.options.map(o=>o.latex.replace(/\s+/g,''))).size,6,
   q.sourceId+' duplicate textual choice');
  assert.ok(letters.includes(q.correctOptionId),q.sourceId+' bad key letter');
  const keyed=q.options.find(o=>o.id===q.correctOptionId);
  assert.equal(keyed.latex.replace(/\s+/g,''),q.correctAnswerLatex.replace(/\s+/g,''),
    q.sourceId+' key does not match its printed candidate formula');
  for(const choice of q.options){
   assert.ok(typeof choice.latex==='string'&&choice.latex.trim(),q.sourceId+' empty option '+choice.id);
   const html=mathsOptionHTML(choice);
   assert.match(html,/^<math xmlns=/,q.sourceId+' '+choice.id+' MathML');
   assert.doesNotMatch(html,/<script\b|<iframe\b|https?:\/\//i,q.sourceId+' '+choice.id);
   if(choice.id!==q.correctOptionId)
    assert.ok(typeof choice.errorPath==='string'&&choice.errorPath.trim().length>=10,
      q.sourceId+' '+choice.id+' lacks provisional wrong-path explanation');
   options++;
  }
  assert.ok(Array.isArray(q.workedSolutionSteps)&&q.workedSolutionSteps.length>=2,
    q.sourceId+' needs worked steps');
  for(const step of q.workedSolutionSteps){
   assert.ok(typeof step==='string'&&step.trim().length>=10,q.sourceId+' blank worked line');
   const html=mathsRichTextHTML(step);
   assert.ok(html.length>0,q.sourceId+' blank rendered line');
   assert.doesNotMatch(html,/<script\b|<iframe\b|https?:\/\//i,q.sourceId+' unsafe worked step');
   worked++;
  }
  assert.match(latexMathML(q.correctAnswerLatex),/^<math xmlns=/);
 }
 assert.deepEqual(counts,Object.fromEntries(topics.map(topic=>[topic,40])));
 assert.equal(stems,200);assert.equal(options,1200);
 assert.ok(worked>=400,'expect at least two independently reviewable lines per question');
});

test('renderer QA is strictly structural: no academic or scoring approval can be inferred',()=>{
 assert.equal(bank.questions.filter(q=>q.dailyEligible===true).length,0);
 assert.equal(bank.questions.filter(q=>q.academicQA==='approved'||q.approvedForDaily===true).length,0);
 assert.equal(bank.questions.filter(q=>q.independentGradeCalibrated===true).length,0);
});
