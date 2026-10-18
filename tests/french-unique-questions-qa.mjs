import assert from 'node:assert/strict';
import fs from 'node:fs';
import {frenchQuestionFingerprint,uniqueFrenchQuestions} from '../assets/french-unique-questions-20261018.js';

const paths=fs.readdirSync('content/topics').filter(n=>/^fr-.*\.json$/.test(n));
const questions=paths.flatMap(n=>JSON.parse(fs.readFileSync('content/topics/'+n,'utf8')).questions||[])
  .filter(q=>q?.id);
const seen=new Map();
let duplicated=0;
for(const q of questions){
  const key=frenchQuestionFingerprint(q);
  if(seen.has(key)) duplicated++;
  else seen.set(key,q.id);
}
assert.ok(duplicated>=100,'Ensure historical duplicates are represented');
const fresh=uniqueFrenchQuestions(questions,{today:'2026-10-19'},'standard');
assert.equal(fresh.length,new Set(fresh.map(frenchQuestionFingerprint)).size,'no duplicate question content in the selectable pool');
assert.equal(questions.length-fresh.length,duplicated,'legacy IDs remain in the bank, not deleted');
const sample=questions.find(q=>questions.some(x=>x.id!==q.id&&frenchQuestionFingerprint(x)===frenchQuestionFingerprint(q)));
const siblings=questions.filter(q=>frenchQuestionFingerprint(q)===frenchQuestionFingerprint(sample));
const answerHistory={today:'2026-10-19',seenCorrect:{[siblings.at(-1).id]:1}};
assert.ok(!uniqueFrenchQuestions(siblings,answerHistory,'standard').length,'correct alias suppresses every equivalent prompt');
const dueHistory={today:'2026-10-21',reviews:{[siblings.at(-1).id]:{due:'2026-10-21',wrong:true}}};
assert.equal(uniqueFrenchQuestions(siblings,dueHistory,'due')[0].id,siblings.at(-1).id,'due review preserves its original ID');
const active=fs.readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
const fallback=fs.readFileSync('assets/study._subject.practise-D_PWgUd7.js','utf8');
for(const [label,source] of [['active',active],['fallback',fallback]]){
  assert.match(source,/import \{uniqueFrenchQuestions\}/,label);
  assert.match(source,/uniqueFrenchQuestions\(t,s\.getState\(\),E\)/,label);
}
console.log('FRENCH_UNIQUE_QA '+JSON.stringify({questionFiles:paths.length,questionEntries:questions.length,legacyDuplicateEntries:duplicated,selectableDuplicates:0,historyPreserved:true,dueIdPreserved:true}));
