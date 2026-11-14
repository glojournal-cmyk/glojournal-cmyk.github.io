import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBank,isCorrect,categoryOf} from '../assets/chemistry-exam-revision-core-20261113.js';
import {validateMockBank,validateMockState,mockQuestions,getMockScore,remainingSeconds,MOCK_STORAGE_KEY,MOCK_DURATION_SECONDS} from '../assets/chemistry-school-mock-core-20261114.js';

const root=new URL('../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const source=read('content/exam-revision/chemistry-school-mock-20261114.json');
const verified=validateMockBank(source);
const category=q=>categoryOf(q);
const section={history:4,atomic:5,formula:5,balance:6};
const session=id=>({id:'qa-'+id,paperId:id,index:0,questionIds:mockQuestions(verified,id).map(q=>q.id),answers:{},startedAt:'2026-11-14T14:00:00.000Z'});

test('school date stays 16 November 2026, with three exactly 20-minute/20-mark school-style papers',()=>{
 assert.equal(source.schoolDate,'2026-11-16');
 assert.equal(source.durationMinutes,20);
 assert.equal(source.marksPerPaper,20);
 assert.equal(source.papers.length,3);
 assert.equal(verified.questions.length,39);
 assert.equal(new Set(verified.questions.map(q=>q.id)).size,39);
 assert.deepEqual(source.papers.map(p=>p.id),['A','B','C']);
 assert.match(MOCK_STORAGE_KEY,/20261116/);
 assert.equal(MOCK_DURATION_SECONDS,1200);
});

test('each mock has 13 original questions, a 4/5/5/6 mark spread, and at least two diagram tasks',()=>{
 const allIds=new Set();
 for(const paper of source.papers){
  const questions=mockQuestions(verified,paper.id);
  assert.equal(questions.length,13);
  assert.equal(questions.reduce((n,q)=>n+q.marks,0),20);
  const totals={history:0,atomic:0,formula:0,balance:0};
  for(const q of questions){
   assert.ok(!allIds.has(q.id),q.id);allIds.add(q.id);
   assert.ok(q.prompt&&q.answer.accepted[0]&&q.feedback.steps.length);
   totals[category(q)]+=q.marks;
  }
  assert.deepEqual(totals,section);
  const illustrated=questions.filter(q=>q.figure);
  assert.ok(illustrated.length>=2);
  for(const q of illustrated){
   assert.ok(q.figure.alt&&q.figure.src.startsWith('/content/diagrams/'));
   const svg=fs.readFileSync(new URL(q.figure.src.slice(1),root),'utf8');
   assert.match(svg,/<svg[^>]+role="img"/);
   assert.match(svg,/<\/svg>/);
  }
 }
});

test('all MC keys uniquely occur among four options; all rubrics allocate distinct marks',()=>{
 for(const q of verified.questions){
  if(q.format==='mc_single'){
   assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
   assert.equal(q.options.filter(x=>x===q.answer.accepted[0]).length,1,q.id);
  }
  if(q.format==='rubric_response'){
   assert.equal(q.markScheme.length,q.marks,q.id);
   assert.equal(new Set(q.markScheme).size,q.marks,q.id);
   assert.ok(q.markScheme.every(s=>s.length>25),q.id);
  }else assert.equal(q.marks,1);
 }
});

test('correct objective answers are accepted and common mistakes are rejected',()=>{
 for(const q of verified.questions.filter(q=>q.format!=='rubric_response')){
  assert.equal(isCorrect(q,q.answer.accepted[0]),true,q.id);
  assert.equal(isCorrect(q,''),false,q.id);
  if(q.format==='mc_single'){
   const wrong=q.options.find(o=>o!==q.answer.accepted[0]);
   assert.equal(isCorrect(q,wrong),false,q.id);
  }
 }
 const formula=verified.questions.find(q=>q.answer.accepted[0]==='Al2O3');
 assert.equal(isCorrect(formula,'al2o3'),false,'chemical-symbol capitalisation matters');
 const equation=verified.questions.find(q=>q.answer.accepted[0].includes('2Na + Cl2'));
 assert.ok(equation);
 assert.equal(isCorrect(equation,'Na + Cl2 -> NaCl'),false,'unbalanced formula cannot earn a mark');
 assert.equal(isCorrect(equation,'2Na + Cl2 = 2NaCl'),true,'equals sign accepted as arrow');
});

test('chemical keys represent conserved atoms and do not alter subscripts',()=>{
 const atomCount=formula=>{
  const stack=[{}];let pos=0;
  while(pos<formula.length){
   if(formula[pos]==='('){stack.push({});pos++;continue;}
   if(formula[pos]===')'){pos++;const match=/^\d*/.exec(formula.slice(pos))[0];pos+=match.length;
     const values=stack.pop();for(const [el,n] of Object.entries(values))stack.at(-1)[el]=(stack.at(-1)[el]||0)+n*Number(match||1);continue;}
   const item=/^([A-Z][a-z]?)(\d*)/.exec(formula.slice(pos));assert.ok(item,'Unexpected formula '+formula);
   stack.at(-1)[item[1]]=(stack.at(-1)[item[1]]||0)+Number(item[2]||1);pos+=item[0].length;
  }
  assert.equal(stack.length,1);return stack[0];
 };
 const side=s=>{const result={};for(const term of s.trim().split(/\s*\+\s*/)){
  const item=/^(\d+)?([A-Za-z0-9()]+)$/.exec(term);assert.ok(item,'Bad species '+term);
  for(const [el,n] of Object.entries(atomCount(item[2])))result[el]=(result[el]||0)+n*Number(item[1]||1);
 }return Object.entries(result).sort();};
 const keys=verified.questions.filter(q=>q.format==='typed_short'&&category(q)==='balance');
 assert.equal(keys.length,6);
 for(const q of keys){
  const eq=q.answer.accepted[0].replaceAll(' ','').split('->');assert.equal(eq.length,2,q.id);
  assert.deepEqual(side(eq[0]),side(eq[1]),q.id);
 }
 assert.ok(source.papers.some(p=>p.questions.some(q=>q.prompt.includes('Word equation'))));
});

test('written answers stay unmarked until the pupil reviews separate mark points',()=>{
 for(const p of source.papers){
  const active=session(p.id);
  for(const q of mockQuestions(verified,p.id))active.answers[q.id]=q.answer.accepted[0];
  const pending=getMockScore(verified,active);
  assert.equal(pending.totalMarks,20);
  assert.equal(pending.percentage,null);
  assert.ok(pending.pendingQuestions>=4);
  const rubric=mockQuestions(verified,p.id).filter(q=>q.format==='rubric_response');
  active.reviewMarks=Object.fromEntries(rubric.map(q=>[q.id,q.marks]));
  const final=getMockScore(verified,active);
  assert.equal(final.awarded,20);
  assert.equal(final.percentage,100);
  active.reviewMarks[rubric[0].id]=rubric[0].marks-1;
  const partial=getMockScore(verified,active);
  assert.equal(partial.awarded,19);
  assert.equal(partial.percentage,95);
 }
});

test('mock state validation preserves answers and refuses tampering',()=>{
 const a=session('A'),saved={version:1,active:a,latest:null,history:[]};
 assert.equal(validateMockState(saved,verified),saved);
 assert.throws(()=>validateMockState({...saved,active:{...a,questionIds:[...a.questionIds].reverse()}},verified));
 assert.throws(()=>validateMockState({...saved,active:{...a,index:14}},verified));
 assert.throws(()=>validateMockState({...saved,active:{...a,answers:{unknown:'true'}}},verified));
 assert.throws(()=>validateMockState({...saved,active:{...a,answers:{[a.questionIds[0]]:'x'.repeat(2001)}}},verified));
 assert.throws(()=>validateMockState({...saved,active:{...a,reviewMarks:{[a.questionIds[0]]:20}}},verified));
});

test('timer resets at 20 minutes, survives resume and never awards extra marks',()=>{
 const start='2026-11-14T14:00:00.000Z';
 assert.equal(remainingSeconds(start,Date.parse(start)),1200);
 assert.equal(remainingSeconds(start,Date.parse(start)+600000),600);
 assert.equal(remainingSeconds(start,Date.parse(start)+1200000),0);
 assert.equal(remainingSeconds(start,Date.parse(start)+1500000),0);
});

test('the original 134 eligible revision questions are unchanged and school mock is separate',()=>{
 const normal=buildBank([...([5,6,7].map(n=>read('content/topics/chem-y9-c'+n+'.json'))),read('content/exam-revision/chemistry-nov16-2026-applied.json')]);
 assert.equal(normal.filter(q=>q.examEligible).length,134);
 assert.equal(normal.length,150);
 assert.ok(verified.questions.every(q=>q.examEligible===false));
 assert.equal(verified.questions.filter(q=>normal.some(old=>old.id===q.id)).length,0);
 const mockHtml=fs.readFileSync(new URL('study/chemistry/exam-revision/mock/index.html',root),'utf8');
 const revision=fs.readFileSync(new URL('study/chemistry/exam-revision/index.html',root),'utf8');
 const mockJs=fs.readFileSync(new URL('assets/chemistry-school-mock-20261114.js',root),'utf8');
 assert.match(revision,/href="\/study\/chemistry\/exam-revision\/mock\/"/);
 assert.match(mockHtml,/16 November 2026/);
 assert.match(mockHtml,/id="clock"/);
 assert.match(mockHtml,/20-mark total is based on the last school assessment/);
 assert.match(mockJs,/getMockScore\(bank,complete\)/);
 assert.match(mockJs,/if\(!store\(/);
 assert.ok(!mockJs.includes('setXP(')&&!mockJs.includes('dailyLog='));
});
