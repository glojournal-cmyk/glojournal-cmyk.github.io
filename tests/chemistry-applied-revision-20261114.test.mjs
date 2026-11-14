import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBank,categoryOf,selectPaper,scorePaper,marksOf} from '../assets/chemistry-exam-revision-core-20261113.js';

const relative=p=>new URL('../'+p,import.meta.url);
const load=p=>JSON.parse(fs.readFileSync(relative(p),'utf8'));
const original=[5,6,7].map(n=>load('content/topics/chem-y9-c'+n+'.json'));
const extra=load('content/exam-revision/chemistry-nov16-2026-applied.json');
const bank=buildBank([...original,extra]);
const source=new Map(bank.map(q=>[q.id,q]));
const counts=group=>extra.questions.filter(q=>q.topicSkill===group);
const seeded=()=>{let s=931;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/2**32;}};

test('teacher notice scope: four topics only, 72 additional applied questions, 134 total',()=>{
  assert.equal(extra.questions.length,72);
  assert.equal(bank.length,134);
  assert.deepEqual(Object.fromEntries(['history','calc','formula','balance'].map(k=>[k,counts(k).length])),
    {history:14,calc:18,formula:18,balance:22});
  assert.deepEqual(extra.scope,['C1.5 History of the atom','C1.6 Atomic structure','chemical formulae','balancing equations']);
  assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
  for(const q of extra.questions){
    assert.equal(q.subject,'chemistry');
    assert.equal(q.year,9);
    assert.equal(q.status,'enabled');
    assert.equal(q.ordinary,true);
    assert.ok(categoryOf(q),'bad topic mapping '+q.id);
    assert.ok(!/electrolysis|mole calculation|reaction rate|organic mechanisms/i.test(q.prompt),
      'Out-of-scope question '+q.id);
  }
});

test('67 constructed responses have complete 2–6-point rubrics, 5 one-mark objective items',()=>{
  const rubric=extra.questions.filter(q=>q.format==='rubric_response');
  const objective=extra.questions.filter(q=>q.format!=='rubric_response');
  assert.equal(rubric.length,67);
  assert.equal(objective.length,5);
  assert.equal(extra.questions.reduce((n,q)=>n+marksOf(q),0),192);
  for(const q of rubric){
    assert.ok(q.marks>=2&&q.marks<=6);
    assert.equal(q.markScheme.length,q.marks,'rubric and marks differ '+q.id);
    assert.equal(new Set(q.markScheme).size,q.marks,'duplicated point '+q.id);
    assert.ok(q.markScheme.every(x=>x.length>=25),'vague marking point '+q.id);
    assert.equal(q.answer.mode,'self_review_rubric');
    assert.ok(q.answer.accepted[0].length>=60,'model answer too short '+q.id);
  }
  for(const q of objective){
    assert.equal(q.marks,1);
    assert.equal(q.answer.accepted.length,1);
    if(q.format==='mc_single'){
      assert.equal(q.options.length,4);
      assert.equal(new Set(q.options).size,4);
      assert.equal(q.options.filter(x=>x===q.answer.accepted[0]).length,1);
    }
  }
});

test('key cases independently checked: isotopes, particle counting and relative atomic mass',()=>{
  const get=(cat,n)=>source.get('chem-nov16-2026-'+cat+'-applied-'+String(n).padStart(2,'0'));
  assert.match(get('calc',1).answer.accepted[0],/11 protons/);
  assert.match(get('calc',1).answer.accepted[0],/12 neutrons/);
  assert.match(get('calc',3).answer.accepted[0],/10 electrons/);
  assert.match(get('calc',4).answer.accepted[0],/10 electrons/);
  assert.match(get('calc',6).answer.accepted[0],/8 neutrons/);
  assert.match(get('calc',10).answer.accepted[0],/35\.5/);
  assert.equal(.75*35+.25*37,35.5);
  assert.match(get('calc',11).answer.accepted[0],/63\.62/);
  assert.equal((69*63+31*65)/100,63.62);
  assert.match(get('calc',12).answer.accepted[0],/2,8,8,2/);
  assert.match(get('calc',18).answer.accepted[0],/27/);
});

test('key chemistry cases: ionic charge balance, brackets, coefficient logic and conservation of mass',()=>{
  const get=(cat,n)=>source.get('chem-nov16-2026-'+cat+'-applied-'+String(n).padStart(2,'0'));
  const contains=(c,i,re)=>assert.match(get(c,i).answer.accepted[0],re,c+' '+i);
  contains('formula',2,/Mg₃N₂/);
  assert.equal(3*2+2*(-3),0,'magnesium nitride charge balance');
  contains('formula',3,/Al\(OH\)₃/);
  contains('formula',6,/6 atoms|6 oxygen/i);
  contains('formula',10,/12 oxygen/);
  contains('formula',13,/Na₂O/);
  contains('formula',15,/AlN/);
  contains('balance',5,/4Al \+ 3O₂ → 2Al₂O₃/);
  contains('balance',8,/C₃H₈ \+ 5O₂ → 3CO₂ \+ 4H₂O/);
  contains('balance',10,/2C₂H₆ \+ 7O₂ → 4CO₂ \+ 6H₂O/);
  contains('balance',15,/3\.3 g/);
  contains('balance',20,/Fe₂O₃ \+ 3CO → 2Fe \+ 3CO₂/);
  assert.ok(Math.abs((8.3-5.0)-3.3)<1e-9,'floating-point conservation calculation');
});

test('applied rubric papers retain marks, no duplicates, four-topic coverage and end-only grading',()=>{
  for(let size of [10,20,24]){
    const sessionQuestions=selectPaper(bank,{scope:'mixed',length:size,rng:seeded()});
    assert.equal(sessionQuestions.length,size);
    assert.equal(new Set(sessionQuestions.map(q=>q.id)).size,size);
    assert.equal(new Set(sessionQuestions.map(categoryOf)).size,4);
    const constructed=sessionQuestions.filter(q=>q.format==='rubric_response');
    assert.ok(constructed.length>=4);
    const paper={questionIds:sessionQuestions.map(q=>q.id),
      answers:Object.fromEntries(sessionQuestions.map(q=>[q.id,q.answer.accepted[0]])),
      index:0,scope:'mixed'};
    let result=scorePaper(bank,paper);
    assert.equal(result.total,size);
    assert.ok(result.pendingQuestions>=4,'written answers must not be auto-graded');
    assert.equal(result.percentage,null,'final score must not appear until rubrics reviewed');
    paper.reviewMarks=Object.fromEntries(constructed.map(q=>[q.id,q.marks]));
    result=scorePaper(bank,paper);
    assert.equal(result.pendingQuestions,0);
    assert.equal(result.percentage,100);
    assert.equal(result.awarded,result.totalMarks);
  }
});

test('school-paper response types include 6-mark investigation, data interpretation and multi-step balancing',()=>{
 const text=extra.questions.map(q=>q.prompt).join('\n');
 assert.match(text,/gold-foil experiment/);
 assert.match(text,/75%/);
 assert.match(text,/69%/);
 assert.match(text,/open test tube/);
 assert.match(text,/closed container/);
 assert.match(text,/electron arrangement/);
 assert.match(text,/formula/);
 assert.match(text,/balance/i);
 assert.ok(extra.questions.some(q=>q.marks===6),'no extended explanatory answer');
 assert.ok(extra.questions.filter(q=>q.stimulus?.text).length>=3,'no scenario or observation prompts');
});
