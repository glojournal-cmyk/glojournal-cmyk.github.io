import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../assets/learning-feedback-20261003.js';

const bank=JSON.parse(readFileSync('content/topics/fr-y8-s22-high-scoring-structures.json','utf8'));
const {buildCorrection}=globalThis.LuxLearningFeedback;
const scenarios={
  sequence:['d’abord','puis','ensuite','après','finalement'],
  contrast:['mais','cependant','pourtant','en revanche'],
  time:['le matin','le soir','tout de suite'],
  reaction:['heureusement','malheureusement']
};
const getQuestion=purpose=>bank.questions.find(q=>
  q.prompt.includes('Give one taught French option for this purpose: '+purpose+'.'));

test('screenshot: la séquence is a category label, not a sequence expression',()=>{
 const q=getQuestion('sequence');
 assert.ok(q,'Expected the actual Year 8 screenshot question');
 assert.equal(q.format,'typed_equivalent');
 assert.ok(q.answer.accepted.includes('d’abord'));
 assert.ok(q.answer.accepted.includes('puis'));
 assert.ok(!q.answer.accepted.includes('la séquence'));
 const correction=buildCorrection(q,{
  ok:false,errorKind:'wrong',given:'la séquence',model:'d’abord'
 },'french');
 assert.match(correction.reason,/names the category \(sequence\)/);
 assert.match(correction.reason,/d’abord/);
 assert.deepEqual(correction.missingWords,[],'Category label is not a missing-word or grammar-ending error');
 assert.match(correction.rule,/one example/i);
 assert.doesNotMatch(correction.reason,/familiar stem|article or ending/i);
});
test('four French purpose questions give semantic, not generic grammatical feedback',()=>{
 for(const [purpose,examples] of Object.entries(scenarios)){
  const q=getQuestion(purpose);
  assert.ok(q,purpose+' question must exist');
  for(const word of examples)assert.ok(q.answer.accepted.includes(word),purpose+' accepted '+word);
  const text=[q.feedback.short,...q.feedback.steps,q.feedback.commonError,q.feedback.remember,q.feedback.rule].join(' ');
  assert.doesNotMatch(text,/Compare the subject, tense marker, article and ending/);
  assert.doesNotMatch(text,/A small article or ending can change the grammar/);
  assert.doesNotMatch(text,/scientific detail|Suggested answer:/);
  assert.match(text,/one/i);
  const correction=buildCorrection(q,{ok:false,errorKind:'wrong',given:'category label',model:q.answer.accepted[0]},'french');
  assert.deepEqual(correction.missingWords,[]);
  assert.match(correction.reason,/one of the taught French expressions/);
 }
});
test('plain translation feedback is not misclassified as grammar agreement',()=>{
 const q={
  format:'typed_equivalent',
  prompt:'Translate into French: first',
  answer:{accepted:['d’abord']},
  feedback:{remember:'d’abord means first'}
 };
 const result=buildCorrection(q,{ok:false,given:'la séquence',model:'d’abord',errorKind:'wrong'},'french');
 assert.match(result.reason,/requested meaning or form/);
 assert.doesNotMatch(result.reason,/familiar stem/);
 assert.deepEqual(result.missingWords,[]);
});
test('both live and legacy lesson players avoid false bank-depletion and blame language',()=>{
 for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
  const code=readFileSync(path,'utf8');
  assert.doesNotMatch(code,/No unused variant of this concept is available/);
  assert.doesNotMatch(code,/Wrong idea/);
  assert.match(code,/Review the model answer and its explanation/);
  assert.match(code,/Not the requested answer/);
 }
});
