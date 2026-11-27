import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

// This suite executes the ACTUAL minified production scorer, not a mock
// approximation. The selected source is never treated as teacher-approved.
const food=JSON.parse(fs.readFileSync('content/topics/bio-y8-food-tests.json','utf8'));
const questions=food.questions.filter(q=>q.format==='mark_points');
const script=fs.readFileSync('assets/quiz-session-rWAnuDVj.js','utf8');
const begin=script.indexOf('function A(e){'),end=script.indexOf('function V(e){',begin);
assert.ok(begin>=0&&end>begin,'production QuizSession scorer boundaries');
const normalized=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/æ/g,'ae').replace(/œ/g,'oe').toLowerCase()
  .replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const scientific=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9 ']/g,'').replace(/\s+/g,' ').trim();
const exact=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ');
const {B}=new Function('a','d','x',script.slice(begin,end)+';return {B};')(
  scientific,normalized,exact
);
const find=suffix=>{
 const hits=questions.filter(q=>q.id.endsWith(suffix));
 assert.equal(hits.length,1,'Unique source ID expected: '+suffix);
 return hits[0];
};

test('complete 52-row original source inventory and model-answer marks',()=>{
 assert.equal(food.questions.length,143);
 assert.equal(questions.length,52);
 assert.equal(new Set(questions.map(q=>q.id)).size,52);
 for(const q of questions){
  assert.equal(q.status,'enabled',q.id);
  const total=q.answer.totalMarks||q.answer.markPoints.length;
  assert.equal(total,q.answer.markPoints.length,q.id+' totalMarks mismatch');
  const outcome=B(q,q.answer.markPoints.join('; '),'biology',{});
  assert.equal(outcome.score,total,q.id+' rubric model must receive every mark');
  assert.equal(outcome.pointResults.length,total,q.id+' per-mark reporting');
 }
});

test('six high-risk Food Tests items use item-specific independently reviewable core evidence',()=>{
 const expected={
  'iodine-solution-explain':1,
  'biuret-solution-explain':1,
  'benedicts-method':3,
  'negative-sugar':2,
  'iodine-control':2,
  'unknown-analysis':3
 };
 for(const [suffix,count] of Object.entries(expected)){
  const q=find(suffix);
  assert.equal(q.answer.markPointEvidence?.length,count,q.id+' evidence count');
  assert.equal(q.answer.markPointAlternatives?.length,count,q.id+' alternative count');
  for(let i=0;i<count;i++){
   const r=q.answer.markPointEvidence[i];
   assert.ok(Array.isArray(r.all)&&r.all.length>0,q.id+' '+i);
   for(const text of [...r.all,...(r.not||[]),...(r.notAnywhere||[])])
    assert.doesNotThrow(()=>new RegExp(text,'i'),q.id+' invalid regex '+text);
   assert.ok(q.answer.markPointAlternatives[i].length>0,q.id+' missing alternatives');
  }
 }
 assert.match(script,/function verifiedFoodMarkEvidence\(rule,response\)/);
 assert.ok(script.includes('e.answer.markPointEvidence?.[index]'),
   'must actually use evidence gate in the real live scorer');
});

const audited=[
 // Incorrect reagent assertions, fabricated observations or contradiction
 // must not mint any credit, even when they share scientific words.
 ['iodine-solution-explain','Benedict solution is a starch test.',0],
 ['biuret-solution-explain','Iodine tests for protein and reducing sugar.',0],
 ['benedicts-method',"Benedict's solution is for starch.",0],
 ['negative-sugar',"Benedict's solution is for starch.",0],
 ['iodine-control','Benedict solution is a starch test.',0],
 ['unknown-analysis','Biuret stays blue; protein is present.',0],
 // Equivalently correct, concise responses must stay creditworthy.
 ['iodine-solution-explain','iodine detects starch',1],
 ['iodine-solution-explain',"Unlike Benedict's solution, iodine tests for starch",1],
 ['biuret-solution-explain','Unlike iodine, Biuret tests for protein',1],
 ['biuret-solution-explain','Biuret tests for proteins',1],
 ['negative-sugar',"Benedict's solution stays blue; no reducing sugar detected",2],
 ['benedicts-method',"Add Benedict's reagent to the sample; heat in a hot water bath; turns orange",3],
 ['iodine-control','Use known starch solution; iodine turns blue-black',2],
 ['unknown-analysis','Starch was found; protein is present; lipids were not detected',3],
 // A genuinely correct fragment earns only its own mark, not full credit.
 ['positive-sugar','Reducing sugar is present',1],
 ['sugar-vs-starch','Reducing sugar was detected',1],
 ['sugar-analysis','Reducing sugar is present',1]
];

test('seventeen positive/negative source-specific marking acceptance cases',()=>{
 for(const [suffix,answer,expected] of audited){
  const q=find(suffix);
  const result=B(q,answer,'biology',{});
  assert.equal(result.score,expected,q.id+' '+JSON.stringify({answer,result}));
 }
});

test('seven clarified mark schemes preserve mark counts and avoid multi-demand answers',()=>{
 const ids=[
  'bio-y8-food-tests-benedict-s-solution-explain',
  'bio-y8-food-tests-water-bath-explain',
  'bio-y8-app-ethanol-safety',
  'bio-y8-food-tests-application-20261025-ethanol-emulsion-stages',
  'bio-y8-food-tests-application-20261025-recording',
  'bio-y8-food-tests-application-20261025-positive-sugar',
  'bio-y8-food-tests-application-20261025-sample-separation'
 ];
 for(const id of ids){
  const q=questions.find(x=>x.id===id);
  assert.ok(q,id);
  assert.equal(q.answer.totalMarks||q.answer.markPoints.length,
    q.answer.markPoints.length,id);
  assert.ok(q.answer.markPoints.every(p=>typeof p==='string'&&p.length>12),id);
 }
 assert.deepEqual(find('ethanol-emulsion-stages').answer.markPoints,[
  'shake the food sample with ethanol',
  'add water after shaking the sample with ethanol'
 ]);
 assert.equal(find('water-bath-explain').answer.markPoints.length,1);
 assert.doesNotMatch(find('water-bath-explain').answer.markPoints[0],/ethanol/i);
});
