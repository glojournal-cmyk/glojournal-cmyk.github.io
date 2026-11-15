// School assessments: independently inspect every published question, not only bank totals.
// Distinct from teacher moderation of original prose or open-ended scientific reasoning.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {MOCK,validateMock} from '../study/latin/november-2026/exam-data.js';
import {UNSEEN_PASSAGES,validateUnseens} from '../study/latin/november-2026/unseen-passages.js';

const base='assessment/';
const bankNames=[
 'biology-cell-structure-20261003.json','biology-nov2-20261017.json',
 'biology-school-20260927.json','chemistry-school-1.json',
 'chemistry-school-style-20260927.json','french-school-1.json',
 'latin-conjugations-20260928.json','latin-creusa-1.json',
 'latin-oct17-20261017.json','latin-verbs-1.json',
 'physics-nov26-20261113.json','banks/biology.json',
 'banks/english.json','banks/latin.json','banks/physics.json'
];
const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const hasText=v=>typeof v==='string'&&v.trim().length>0;
const ids=new Map(),issues=[],stats={primaryBanks:0,primaryQuestions:0,choices:0,multiMark:0,linkedFigures:0,publishedModelTests:0,incorrectChoiceTests:0,biologySections:[],chemistryMockQuestions:0,chemistryAppliedQuestions:0,latinMC:0};
const add=(condition,file,q,reason)=>{if(!condition)issues.push({file,id:q?.id||'',reason});};
const main=fs.readFileSync(base+'app-v2.js','utf8');
const ctx=vm.createContext({Math,Set,String,Object,RegExp,Number,window:{},state:{results:[]},save(){},grantWardrobe(){}});
vm.runInContext(main.slice(main.indexOf('function normal('),main.indexOf('async function start(')),ctx);
vm.runInContext(fs.readFileSync(base+'marking-hotfix-v3.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(base+'biology-marking-20261003.js','utf8'),ctx);
// November 2 uses a separate bank-specific grader which loads last in production.
vm.runInContext(fs.readFileSync(base+'biology-nov2-marking-20261017.js','utf8'),ctx);
const mark=ctx.mark;
function verify(q,file,{standalone=false}={}){
 add(hasText(q.id),file,q,'no ID');
 add(hasText(q.prompt),file,q,'blank visible prompt');
 add(!/^which (physics term or rule|biological term) best matches this description\?$/i.test((q.prompt||'').trim()),file,q,'description missing from actual question');
 add(!/(?:TODO|lorem ipsum|insert question|undefined|null)$/i.test((q.prompt||'').trim()),file,q,'placeholder in question');
 add(q.answer&&Array.isArray(q.answer.accepted)&&q.answer.accepted.some(hasText),file,q,'missing real answer key');
 if(!standalone){
   add(!ids.has(q.id),file,q,'duplicated question ID (also '+ids.get(q.id)+')');
   ids.set(q.id,file);stats.primaryQuestions++;
 }
 if(q.marks!=null){add(Number.isInteger(q.marks)&&q.marks>0,file,q,'bad mark allocation');if(q.marks>1)stats.multiMark++;}
 if(q.answer?.mode==='biology_rubric'||q.answer?.mode==='chemistry_rubric'){
  const pts=q.answer?.points||q.answer?.methodRules;
  add(Array.isArray(pts)&&pts.length>0,file,q,'rubric lacks marking points');
  if(q.marks!=null)add(Array.isArray(pts)&&pts.length===q.marks,file,q,'rubric-point/mark mismatch');
 }
 if(q.answer?.mode==='review'&&q.markingScheme?.points?.length){
   add(q.markingScheme.points.reduce((n,p)=>n+(p.marks||0),0)===q.marks,file,q,'manual-review rubric totals do not match marks');
 }
 if(q.options?.length){
  stats.choices++;
  add(q.options.length>=3,file,q,'too few options');
  add(q.options.every(hasText),file,q,'blank choice');
  add(new Set(q.options.map(norm)).size===q.options.length,file,q,'ambiguous duplicate choices');
  const key=q.answer?.accepted?.[0];
  add(q.options.filter(v=>norm(v)===norm(key)).length===1,file,q,'correct answer absent or duplicated');
  const opts=q.options.filter(opt=>norm(opt)!==norm(key));
  if(!standalone&&!['exact','review'].includes(q.answer?.mode)){
   for(const option of opts){
     const result=mark(q,option);
     add(result.credit===0,file,q,'incorrect choice incorrectly scores: '+String(option).slice(0,55));
     stats.incorrectChoiceTests++;
   }
  }
 }
 if(q.diagram||q.figure?.src||q.stimulus?.image){
  const uri=q.diagram?'/assessment/diagrams/'+q.diagram:q.figure?.src||q.stimulus?.image;
  add(typeof uri==='string'&&uri.startsWith('/')&&!uri.includes('..'),file,q,'invalid figure URL');
  if(typeof uri==='string'&&uri.startsWith('/')&&!uri.includes('..'))
    add(fs.existsSync('.'+uri)&&fs.statSync('.'+uri).size>0,file,q,'missing figure asset '+uri);
  if(q.figure)add(hasText(q.figure.alt),file,q,'figure missing alt text');
  stats.linkedFigures++;
 }
 if(q.passage!=null)add(hasText(q.passage),file,q,'empty reading passage');
 if(!standalone&&!['exact','review'].includes(q.answer?.mode)){
  const response=q.modelAnswer||q.answer?.accepted?.[0]||'';
  const got=mark(q,response);
  add(got.credit>=0.999,file,q,'published model gets under-credit: '+JSON.stringify(got));
  add(mark(q,'').credit===0,file,q,'empty response gets credit');
  stats.publishedModelTests++;
 }
}
for(const bankName of bankNames){
 const file=base+bankName,bank=JSON.parse(fs.readFileSync(file,'utf8'));
 const questions=bank.groups?bank.groups.flatMap(g=>g.questions):bank.questions;
 assert.ok(Array.isArray(questions)&&questions.length>0,file+' has no questions');
 stats.primaryBanks++;
 for(const q of questions)verify(q,file);
 if(bankName==='latin-conjugations-20260928.json'){
  for(const q of questions.filter(q=>/-20260928-b\d+$/.test(q.id)))add(q.prompt.startsWith('Translate into Latin:'),file,q,'translation direction missing');
  for(const q of questions.filter(q=>/-20260928-c\d+$/.test(q.id)))add(/translate into English/i.test(q.prompt),file,q,'translation direction missing');
 }
 if(bankName==='physics-nov26-20261113.json'){
  add(questions.length===200,file,null,'Physics school bank not 200');
  add(questions.every(q=>!/\b(convection|radiation|infrared)\b/i.test(q.prompt)),file,null,'Physics November paper includes out-of-scope heat topic');
 }
 if(bankName==='biology-cell-structure-20261003.json'){
  for(let i=1;i<=6;i++){
   const spec='4.1.1.'+i,part=questions.filter(q=>q.specification===spec);
   add(part.length===24,file,null,spec+' should hold 24 questions');
   stats.biologySections.push({spec,questions:part.length});
  }
 }
}
add(stats.primaryQuestions===1805,'ALL_BANKS',null,'unexpected inventory count '+stats.primaryQuestions);
for(const subj of ['physics','biology']){
 const b=JSON.parse(fs.readFileSync(base+'banks/'+subj+'.json','utf8')),q=b.groups.flatMap(g=>g.questions);
 add(q.length===161,'assessment/banks/'+subj+'.json',null,'expected 161 self-contained science prompts');
 const prompts=q.map(x=>norm(x.prompt));add(new Set(prompts).size===q.length,'assessment/banks/'+subj+'.json',null,'duplicate visible question text');
}
const chemistryMock=JSON.parse(fs.readFileSync('content/exam-revision/chemistry-school-mock-20261114.json','utf8'));
add(chemistryMock.durationMinutes===20&&chemistryMock.marksPerPaper===20,'CHEM_MOCK',null,'school time or marks');
for(const paper of chemistryMock.papers){
 add(paper.questions.length===13,'CHEM_MOCK',null,'paper '+paper.id+' length');
 add(paper.questions.reduce((n,q)=>n+q.marks,0)===20,'CHEM_MOCK',null,'paper '+paper.id+' marks');
 for(const q of paper.questions){
   stats.chemistryMockQuestions++;
   add(hasText(q.prompt)&&hasText(q.id),'CHEM_MOCK',q,'blank question');
   add(q.answer?.accepted?.some(hasText),'CHEM_MOCK',q,'blank key');
   if(q.options){add(new Set(q.options.map(norm)).size===q.options.length,'CHEM_MOCK',q,'duplicate MC options');
    add(q.options.some(v=>norm(v)===norm(q.answer.accepted[0])),'CHEM_MOCK',q,'key not among options');}
   if(q.format==='rubric_response')add(Array.isArray(q.markScheme)&&q.markScheme.length===q.marks,'CHEM_MOCK',q,'rubric marks mismatch');
   if(q.figure?.src)add(fs.existsSync('.'+q.figure.src)&&hasText(q.figure.alt),'CHEM_MOCK',q,'missing labelled diagram');
 }
}
const applied=JSON.parse(fs.readFileSync('content/exam-revision/chemistry-nov16-2026-applied.json','utf8'));
for(const q of applied.questions){
 stats.chemistryAppliedQuestions++;
 add(hasText(q.prompt)&&q.answer?.accepted?.some(hasText),'CHEM_APPLIED',q,'missing question/answer');
 if(q.marks>1)add(Array.isArray(q.markScheme)&&q.markScheme.length===q.marks,'CHEM_APPLIED',q,'rubric missing distinct mark points');
 if(q.options)add(q.options.some(opt=>norm(opt)===norm(q.answer.accepted[0])),'CHEM_APPLIED',q,'missing MC answer');
}
add(stats.chemistryMockQuestions===39,'CHEM_MOCK',null,'expected three 13-question school papers');
add(stats.chemistryAppliedQuestions===88,'CHEM_APPLIED',null,'expected 88 applied revision items');
add(validateMock(MOCK),'LATIN_NOV',null,'Latin 75-mark school mock invalid');
add(MOCK.durationMinutes===50,'LATIN_NOV',null,'wrong Latin school duration');
add(validateUnseens(),'LATIN_UNSEEN',null,'Latin unseen invalid');
for(const p of UNSEEN_PASSAGES){
 stats.latinMC+=p.questions.length;
 add(p.questions.length===10,'LATIN_UNSEEN',null,'ten MC per unseen');
 for(const q of p.questions){
  add(q.options?.length===4&&new Set(q.options.map(norm)).size===4,'LATIN_UNSEEN',q,'missing/duplicated choices');
  add(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,'LATIN_UNSEEN',q,'invalid answer index');
 }
}
const report={stats,issues};
fs.mkdirSync('test-results',{recursive:true});
fs.writeFileSync('test-results/assessment-full-bank-integrity-20261115.json',JSON.stringify(report,null,2)+'\n');
console.log('ASSESSMENT_FULL_BANK_INTEGRITY',JSON.stringify({stats,issueCount:issues.length,issues:issues.slice(0,40)}));
assert.equal(issues.length,0,JSON.stringify(issues.slice(0,30),null,2));
