import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

// Actual deployed QuizSession scoring function; no mocked student-credit results.
// Not independent teacher/grade/signoff evidence.
const bank=JSON.parse(fs.readFileSync('content/topics/bio-y8-food-tests.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('qa-staging/food-tests-46-markpoint-evidence-draft-20261122.json','utf8'));
const script=fs.readFileSync('assets/quiz-session-rWAnuDVj.js','utf8');
const from=script.indexOf('function A(e){'),to=script.indexOf('function V(e){',from);
assert.ok(from>=0&&to>from,'Need real QuizSession scorer');
const base=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/æ/g,'ae').replace(/œ/g,'oe').toLowerCase()
 .replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const science=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9 ']/g,'').replace(/\s+/g,' ').trim();
const exact=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ');
const B=new Function('a','d','x',script.slice(from,to)+';return B;')(science,base,exact);
const byId=new Map(bank.questions.map(q=>[q.id,q]));

const invalidStatements=[
 'Iodine is used to test for protein, not starch.',
 "Benedict's reagent detects starch but does not detect reducing sugars.",
 'Biuret tests for reducing sugars not proteins.',
 'Ethanol must be heated to test for lipids.',
 'It is safe to use a naked flame next to ethanol.',
 'A blue-black iodine result shows no starch.',
 "Brick-red Benedict's means reducing sugar absent.",
 'A purple Biuret result is negative for protein.',
 'A clear emulsion means lipids were found.',
 'A cloudy white emulsion proves protein is present.',
 "The negative Benedict's result shows that starch is present.",
 'The same unwashed pipette makes the test more reliable.',
 'A positive test proves the food is healthy.'
];

test('46 original unguarded questions have unique source identities, 86 separately assessed marks',()=>{
 assert.equal(manifest.status,'QA_STAGING_NOT_ACADEMIC_APPROVED');
 assert.equal(manifest.applyToLive,false);
 assert.equal(manifest.independentTeacherSignoff,false);
 assert.equal(manifest.rules.length,46);
 assert.equal(manifest.scope.marks,86);
 assert.equal(new Set(manifest.rules.map(q=>q.questionId)).size,46);
 assert.equal(bank.questions.length,143);
 assert.equal(bank.questions.filter(q=>q.format==='mark_points').length,52);
 assert.equal(bank.questions.filter(q=>q.format==='mark_points')
  .reduce((sum,q)=>sum+q.answer.markPoints.length,0),98);
});

test('every source rubric equals its independently inspectable evidence manifest',()=>{
 const full=bank.questions.filter(q=>q.format==='mark_points');
 for(const q of full){
  assert.equal(q.answer.markPointEvidence?.length,q.answer.markPoints.length,q.id);
  assert.equal(q.answer.markPointAlternatives?.length,q.answer.markPoints.length,q.id);
  assert.notEqual(q.academicQA,'approved');
 }
 for(const entry of manifest.rules){
  const q=byId.get(entry.questionId);
  assert.ok(q&&q.format==='mark_points',entry.questionId);
  assert.equal(q.answer.markPointQAStatus,'SOURCE_LEVEL_SCREENED_INDEPENDENT_SIGNOFF_PENDING');
  assert.equal(q.answer.totalMarks||q.answer.markPoints.length,entry.rules.length,q.id);
  assert.deepEqual(q.answer.markPointEvidence,entry.rules.map(x=>({
   all:x.all,notAnywhere:x.notAnywhere
  })),q.id+' evidence must agree with reviewed manifest');
  assert.deepEqual(q.answer.markPointAlternatives,entry.rules.map(x=>x.alternatives),
   q.id+' alternatives must agree with reviewed manifest');
  for(const rule of entry.rules){
   assert.ok(rule.all.length>0&&rule.alternatives.length>0);
   for(const pattern of [...rule.all,...rule.notAnywhere])
    assert.doesNotThrow(()=>new RegExp(pattern,'i'),q.id+' malformed evidence regex');
  }
 }
});

test('all 46 complete model answers score full marks in the real QuizSession',()=>{
 for(const entry of manifest.rules){
  const q=byId.get(entry.questionId);
  const res=B(q,q.answer.markPoints.join('; '),'biology',{});
  assert.equal(res.score,q.answer.markPoints.length,q.id+': '+JSON.stringify(res));
  assert.ok(res.pointResults.every(Boolean),q.id);
 }
});

test('86 approved-as-candidate concise paraphrases earn ONLY their own mark; 86 wholesale-denials do not',()=>{
 for(const entry of manifest.rules){
  const q=byId.get(entry.questionId);
  for(let i=0;i<entry.rules.length;i++){
   const paraphrase=entry.rules[i].alternatives[0];
   const pass=B(q,paraphrase,'biology',{});
   assert.equal(pass.score,1,q.id+' paraphrase '+i+': '+JSON.stringify(pass));
   assert.equal(pass.pointResults[i],true,q.id+' correct concept '+i);
   const denied='It is not true that '+q.answer.markPoints[i]+'.';
   const reject=B(q,denied,'biology',{});
   assert.equal(reject.pointResults[i],false,q.id+' denied fact '+i);
  }
 }
});

test('598 original/source-topic inaccurate science statements cannot score through semantic overlap',()=>{
 assert.equal(invalidStatements.length,13);
 for(const entry of manifest.rules){
  const q=byId.get(entry.questionId);
  for(const answer of invalidStatements){
   const result=B(q,answer,'biology',{});
   assert.equal(result.score,0,q.id+' wrong answer '+answer+': '+JSON.stringify(result));
  }
 }
});
