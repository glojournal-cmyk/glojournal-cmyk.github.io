import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORIES,STORE_KEY,categoryOf,buildBank,selectPaper,isCorrect,scorePaper,validateStoredState,isExamEligible} from '../assets/chemistry-exam-revision-core-20261113.js';

const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const sources=[...([5,6,7].map(n=>read('content/topics/chem-y9-c'+n+'.json'))),read('content/exam-revision/chemistry-nov16-2026-applied.json')];
const questions=buildBank(sources);
const deterministic=()=>{let seed=12345;return()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};};
function draft(selected,answers={},index=0){
  return {id:'qa-paper',scope:'mixed',index,questionIds:selected.map(q=>q.id),answers,startedAt:new Date().toISOString()};
}

test('134 assessed questions plus 16 historical extensions remain available for saved results',()=>{
  assert.equal(questions.length,150);
  assert.equal(questions.filter(isExamEligible).length,134);
  assert.equal(questions.filter(q=>!isExamEligible(q)).length,16);
  assert.equal(new Set(questions.map(q=>q.id)).size,150);
  const distribution=Object.fromEntries(CATEGORIES.map(c=>[c.id,questions.filter(q=>isExamEligible(q)&&categoryOf(q)===c.id).length]));
  assert.deepEqual(distribution,{history:22,atomic:28,formula:32,balance:52});
  assert.ok(questions.every(q=>q.status==='enabled'&&q.subject==='chemistry'&&q.year===9));
});

test('mixed 10, 20 and 24-question papers cover all four topics without duplicates',()=>{
  for(const size of [10,20,24]){
    const rng=deterministic();
    for(let attempt=0;attempt<50;attempt++){
      const paper=selectPaper(questions,{scope:'mixed',length:size,rng});
      assert.equal(paper.length,size);
      assert.equal(new Set(paper.map(q=>q.id)).size,size);
      assert.equal(new Set(paper.map(categoryOf)).size,4);
      const groups=CATEGORIES.map(c=>paper.filter(q=>categoryOf(q)===c.id).length);
      assert.ok(Math.max(...groups)-Math.min(...groups)<=1);
    }
  }
  assert.equal(selectPaper(questions,{scope:'history',length:20}).length,20);
  assert.equal(selectPaper(questions,{scope:'atomic',length:20}).length,20);
  assert.equal(selectPaper(questions,{scope:'formula',length:20}).length,20);
  assert.equal(selectPaper(questions,{scope:'balance',length:20}).length,20);
});

test('all 106 official key variants accepted; wrong formulas, equations and option text rejected',()=>{
  let checked=0;
  for(const q of questions.filter(q=>q.format!=='rubric_response')){
    for(const answer of q.answer.accepted){
      assert.equal(isCorrect(q,answer),true,q.id+': '+answer);
      checked++;
    }
    assert.equal(isCorrect(q,''),false,q.id);
  }
  assert.equal(checked,111);
  const formula=questions.find(q=>q.id.includes('-formula-02'));
  const balance=questions.find(q=>q.id.includes('-balance-01'));
  const history=questions.find(q=>q.id.includes('-history-01'));
  assert.equal(isCorrect(formula,'al2o3'),false,'wrong case not accepted');
  assert.equal(isCorrect(formula,'Al3O2'),false,'wrong formula not accepted');
  assert.equal(isCorrect(balance,'Na + Cl2 -> NaCl'),false,'unbalanced equation rejected');
  assert.equal(isCorrect(balance,'2Na + Cl2 -> 2NaCl + H2'),false,'extra product rejected');
  assert.equal(isCorrect(balance,'Cl2 + 2Na = 2NaCl'),true,'order and arrow formatting equivalent');
  assert.equal(isCorrect(history,history.options.find(x=>x!==history.answer.accepted[0])),false);
});

test('marks are calculated only on submitted paper; category summaries match individual answers',()=>{
  const paper=selectPaper(questions.filter(q=>q.format!=='rubric_response'),{scope:'mixed',length:20,rng:deterministic()});
  const answers=Object.fromEntries(paper.map((q,i)=>[q.id,i%2===0?q.answer.accepted[0]:'']));
  const session=draft(paper,answers);
  const result=scorePaper(questions,session);
  assert.equal(result.total,20);
  assert.equal(result.correct,10);
  assert.equal(result.percentage,50);
  assert.equal(result.awarded,10);
  assert.equal(result.totalMarks,20);
  assert.equal(result.pendingQuestions,0);
  assert.equal(result.rows.filter(x=>x.correct).length,10);
  assert.equal(Object.values(result.byCategory).reduce((n,c)=>n+c.total,0),20);
  assert.equal(Object.values(result.byCategory).reduce((n,c)=>n+c.correct,0),10);
});

test('resuming and backup validation reject missing IDs, malformed answers and unsafe data',()=>{
  const set=selectPaper(questions,{scope:'mixed',length:10,rng:deterministic()});
  const active=draft(set,{[set[0].id]:'first answer'},2);
  const saved={version:1,active,latest:null,history:[]};
  assert.equal(validateStoredState(saved,questions),saved);
  assert.throws(()=>validateStoredState({...saved,active:{...active,index:50}},questions));
  assert.throws(()=>validateStoredState({...saved,active:{...active,questionIds:['unknown-id']}},questions));
  assert.throws(()=>validateStoredState({...saved,active:{...active,answers:{[set[0].id]:'a'.repeat(2001)}}},questions));
  assert.throws(()=>validateStoredState({...saved,history:new Array(31).fill(active)},questions));
  assert.match(STORE_KEY,/chemistry-exam-revision/);
});

test('standalone page and Chemistry topic directory expose the correct route',()=>{
  const page=fs.readFileSync(new URL('../study/chemistry/exam-revision/index.html',import.meta.url),'utf8');
  const parent=fs.readFileSync(new URL('../assets/study._subject.index-safe-20260920.js',import.meta.url),'utf8');
  const ssr=fs.readFileSync(new URL('../study/chemistry/index.html',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../assets/chemistry-exam-revision-20261113.js',import.meta.url),'utf8');
  assert.match(parent,/\/study\/chemistry\/exam-revision\//);
  assert.match(ssr,/\/study\/chemistry\/exam-revision\//);
  assert.match(page,/id="results"/);
  assert.match(page,/id="resume"/);
  assert.match(app,/scorePaper\(bank,session\)/);
  assert.match(app,/state\.active=null/);
  assert.ok(!app.includes('dailyLog=')&&!app.includes('setXP('));
});


test('each full 20-question paper offers an applied rubric in every teacher topic',()=>{
  for(let n=0;n<40;n++){
    const paper=selectPaper(questions,{scope:'mixed',length:20,rng:deterministic()});
    for(const cat of CATEGORIES){
      const subset=paper.filter(q=>categoryOf(q)===cat.id);
      assert.equal(subset.length,5);
      assert.ok(subset.some(q=>q.format==='rubric_response'),cat.id);
      assert.ok(subset.some(q=>q.format!=='rubric_response'),cat.id);
    }
  }
});

test('rubric answers do not auto-mark; partial marks and pending grades are supported',()=>{
  const selected=questions.filter(q=>q.format==='rubric_response').slice(0,2);
  const [a,b]=selected;
  const session=draft(selected,{[a.id]:a.answer.accepted[0],[b.id]:b.answer.accepted[0]});
  const unreviewed=scorePaper(questions,session);
  assert.equal(unreviewed.pendingQuestions,2);
  assert.equal(unreviewed.percentage,null);
  assert.equal(unreviewed.awarded,0);
  session.reviewMarks={[a.id]:1};
  const partly=scorePaper(questions,session);
  assert.equal(partly.pendingQuestions,1);
  assert.equal(partly.awarded,1);
  session.reviewMarks[b.id]=b.marks;
  const full=scorePaper(questions,session);
  assert.equal(full.pendingQuestions,0);
  assert.equal(full.awarded,1+b.marks);
  assert.equal(full.totalMarks,a.marks+b.marks);
  assert.ok(full.percentage<100,'partial evidence must not earn full marks');
  assert.equal(validateStoredState({version:1,active:null,latest:session,history:[session]},questions).latest,session);
  assert.throws(()=>validateStoredState({version:1,active:null,latest:{...session,reviewMarks:{[a.id]:100}},history:[]},questions));
});

test('C1.7/C1.8 questions are NEVER selected for new school papers but remain readable in saved history',()=>{
  const extensions=questions.filter(q=>!isExamEligible(q));
  assert.equal(extensions.length,16);
  assert.ok(extensions.every(q=>categoryOf(q)==='atomic'));
  for(const length of [10,20,24]){
    const rng=deterministic();
    for(let trial=0;trial<100;trial++){
      for(const scope of ['mixed','atomic']){
        const paper=selectPaper(questions,{scope,length,rng});
        assert.ok(paper.every(isExamEligible),'out-of-scope item selected for '+scope);
        assert.equal(new Set(paper.map(q=>q.id)).size,paper.length);
      }
    }
  }
  const legacy=draft(extensions.slice(0,2),{
    [extensions[0].id]:extensions[0].answer.accepted[0],
    [extensions[1].id]:extensions[1].answer.accepted[0]
  });
  const historical=scorePaper(questions,legacy);
  assert.equal(historical.total,2);
  assert.equal(validateStoredState({version:1,active:legacy,history:[],latest:null},questions).active,legacy);
});
