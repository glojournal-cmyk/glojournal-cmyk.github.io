// Integrated school-assessment QA: date/route wiring, released questions and marking.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MOCK,validateMock} from '../study/latin/november-2026/exam-data.js';
import {UNSEEN_PASSAGES,validateUnseens} from '../study/latin/november-2026/unseen-passages.js';

const base=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,base),'utf8');
const json=path=>JSON.parse(read(path));
const app=read('assessment/app-v2.js');
const schoolCode=read('assets/school-revision-data-20261004.js');
const context={};vm.createContext(context);
vm.runInContext(schoolCode,context);
const revision=context.LuxSchoolRevision;
const scienceContext={};vm.createContext(scienceContext);
vm.runInContext(app.slice(app.indexOf('function normal('),app.indexOf('async function start(')),scienceContext);
vm.runInContext(read('assessment/biology-marking-20261003.js'),scienceContext);
const mark=scienceContext.mark;

test('School tracker lists each November 2026 assessed subject with its accurate date meaning',()=>{
 const byId=Object.fromEntries(revision.schoolAssessments.map(a=>[a.id,a]));
 const upcoming=[
  ['school-physics-20261109','Physics','2026-11-09','week','physics-nov26'],
  ['school-biology-20261116','Biology','2026-11-16','week','biology-cell-structure'],
  ['school-chemistry-20261116','Chemistry','2026-11-16','week','chemistry-nov16'],
  ['school-latin-20261123','Latin','2026-11-23','week','latin-nov26'],
  ['school-french-20261126','French','2026-11-26','day','french-nov26']
 ];
 for(const [id,subject,date,kind,paperId] of upcoming){
  const a=byId[id];assert.ok(a,'Missing school tracker assessment: '+id);
  assert.equal(a.subject,subject);assert.equal(a.date,date);assert.equal(a.dateKind,kind);assert.equal(a.paperId,paperId);
  assert.ok(a.scope.length>=30&&a.notes.length>=60,'Missing meaningful scope / marking guidance '+id);
 }
 assert.match(byId['school-french-20261126'].dateLabel,/Classroom due/,'Do not claim an unconfirmed exam sitting on 26 Nov');
 const plan=revision.buildRevisionPlan({}, {},'2026-11-14');
 for(const id of upcoming.map(x=>x[0]))assert.ok(plan.active.some(a=>a.id===id),id+' must be current/upcoming on 14 Nov');
 assert.ok(plan.suggestion.href.startsWith('/assessment/'),'Plan must not send an empty-topic assessment to a blank link');
});

test('All upcoming school papers are reachable from tracker and correct dedicated routes',()=>{
 const routes={
  'chemistry-nov16':'/study/chemistry/exam-revision/mock/',
  'latin-nov26':'/study/latin/november-2026/',
  'french-nov26':'/assessment/french-nov26/'
 };
 for(const [id,href] of Object.entries(routes)){
  assert.equal(revision.paperHref(id),href,id);
  assert.ok(fs.existsSync(new URL(href.slice(1)+'index.html',base)),id+' missing destination');
  assert.ok(app.includes("'"+id+"':["),'Tracker must render direct link '+id);
 }
 const main=read('assessment/index.html');
 assert.match(main,/chemistry\/exam-revision\/mock\//);
 assert.match(main,/latin\/november-2026\//);
 assert.match(main,/french-nov26\//);
 assert.match(app,/source\.groups\|\|\[\]\)\.flatMap/,'Follow-up must flatten grouped Physics banks');
 assert.ok(!app.includes('const bank=paper?(await (await fetch(bankUrl(paper))).json()).questions'),
   'Follow-up must not rely solely on flat questions');
 assert.ok(app.includes("const end=x.dateKind==='week'"),'Tracker must treat week assessments as current throughout their week');
});

test('Latin written mock: prescribed school format and MC are separate, fully keyed practices',()=>{
 assert.equal(validateMock(MOCK),true);
 assert.equal(MOCK.durationMinutes,50);
 assert.deepEqual(MOCK.sections.map(s=>s.questions.reduce((n,q)=>n+q.points.length,0)),[11,14,50]);
 assert.equal(validateUnseens(),true);
 assert.equal(UNSEEN_PASSAGES.length,5);
 for(const p of UNSEEN_PASSAGES){
  assert.equal(p.questions.length,10,p.id);
  for(const q of p.questions){
   assert.equal(q.options.length,4,q.id);
   assert.equal(new Set(q.options).size,4,q.id);
   assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,q.id);
  }
 }
});

test('Chemistry 16 Nov: three 20-minute mock versions with complete scoring and unambiguous keys',()=>{
 const bank=json('content/exam-revision/chemistry-school-mock-20261114.json');
 assert.equal(bank.schoolDate,'2026-11-16');
 assert.equal(bank.durationMinutes,20);assert.equal(bank.marksPerPaper,20);
 assert.deepEqual(bank.papers.map(p=>p.id),['A','B','C']);
 const seen=new Set();
 for(const paper of bank.papers){
  assert.equal(paper.questions.length,13,paper.id);
  assert.equal(paper.questions.reduce((n,q)=>n+q.marks,0),20,paper.id);
  const topicMarks={history:0,atomic:0,formula:0,balance:0};
  for(const q of paper.questions){
   assert.ok(q.id&&q.prompt&&q.answer?.accepted?.[0],paper.id);
   assert.ok(!seen.has(q.id),'Duplicate across school mocks: '+q.id);seen.add(q.id);
   if(q.format==='rubric_response'){
    assert.equal(q.markScheme.length,q.marks,q.id);
    assert.equal(new Set(q.markScheme).size,q.marks,q.id);
   }else assert.equal(q.marks,1,'Automatic marking is for one-mark items');
   if(q.options){assert.equal(new Set(q.options).size,q.options.length,q.id);
    assert.equal(q.options.filter(a=>a===q.answer.accepted[0]).length,1,q.id);}
   const slug=(q.category||q.topic||'').toLowerCase();
   const bucket=Object.keys(topicMarks).find(name=>slug.includes(name));
   if(bucket)topicMarks[bucket]+=q.marks;
  }
 }
 assert.equal(seen.size,39);
});

test('Biology 16 Nov: six 4.1.1 topics each allocate 10 marks, all 144 published model answers fully credit',()=>{
 const bank=json('assessment/biology-cell-structure-20261003.json');
 assert.equal(bank.questions.length,144);
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,144);
 for(const spec of ['4.1.1.1','4.1.1.2','4.1.1.3','4.1.1.4','4.1.1.5','4.1.1.6']){
  const qs=bank.questions.filter(q=>q.specification===spec);
  assert.equal(qs.length,24,spec);
  assert.equal(qs.filter(q=>q.marks===2).length,12,spec);
  assert.equal(qs.filter(q=>q.marks===3).length,12,spec);
 }
 for(const q of bank.questions){
  assert.equal(q.answer.points.length,q.marks,q.id);
  assert.equal(mark(q,q.modelAnswer).credit,1,'Full model answer under-credited: '+q.id);
  assert.equal(mark(q,'I do not know').credit,0,'Wrong answer credited: '+q.id);
  assert.equal(mark(q,'').credit,0,'Blank credited: '+q.id);
 }
 const page=read('assessment/biology-cell-structure/index.html');
 assert.ok(page.includes('4.1.1'));
});

test('Physics Nov school bank: 200 unique questions, every full model earns all marks and wrong/blank zero',()=>{
 const bank=json('assessment/physics-nov26-20261113.json');
 assert.equal(bank.groups.length,5);
 assert.deepEqual(bank.groups.map(g=>g.questions.length),[40,40,40,40,40]);
 const questions=bank.groups.flatMap(g=>g.questions);
 assert.equal(new Set(questions.map(q=>q.id)).size,200);
 for(const q of questions){
  assert.ok(q.prompt&&q.modelAnswer,q.id);
  assert.equal(mark(q,q.modelAnswer).credit,1,'Full model answer under-credited: '+q.id);
  assert.equal(mark(q,'I do not know').credit,0,'Wrong answer credited: '+q.id);
  assert.equal(mark(q,'').credit,0,'Blank credited: '+q.id);
  if(q.answer.mode!=='choice')assert.equal(q.answer.points.length,q.marks,q.id);
 }
 assert.ok(!app.includes('convection or radiation. Marking is provisional for equivalent free text'),
   'Assessment display must include current test-week context');
});

test('French 26 November is clearly self-marked AO2+AO3 rather than automatic essay scoring',()=>{
 const html=read('assessment/french-nov26/index.html');
 assert.match(html,/AO2 content 15, AO3 range 5, AO3 accuracy 5/);
 assert.match(html,/covered<2&&p.ao2!==undefined&&p.ao2>12/);
 assert.match(html,/if\(p.ao2===0\)\{p.range=0;p.accuracy=0\}/);
 assert.match(html,/Marks are self-assessed/);
 assert.match(html,/Classroom due: 26 November 2026/);
 assert.match(html,/two-bullet|both compulsory bullet points/i);
});
