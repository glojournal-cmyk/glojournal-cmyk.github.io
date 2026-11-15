import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assessment/app-v2.js','utf8');
const begin=app.indexOf('function completeDescriptionQuestion(q){');
const end=app.indexOf('\nasync function start(id){',begin);
assert.ok(begin>=0&&end>begin,'runtime description repair function must exist');
const repair=vm.runInNewContext(app.slice(begin,end)+'\ncompleteDescriptionQuestion;');
const cases=[
  {name:'physics',stem:'Which physics term or rule best matches this description?',prefix:'Which physics term or rule best matches the following description?'},
  {name:'biology',stem:'Which biological term best matches this description?',prefix:'Which biological term best matches the following description?'}
];
let checked=0;
for(const {name,stem,prefix} of cases){
  const bank=JSON.parse(fs.readFileSync('assessment/banks/'+name+'.json','utf8'));
  const questions=bank.groups.flatMap(group=>group.questions);
  assert.equal(questions.length,161,name+' should retain 161 questions');
  for(const q of questions){
    checked++;
    assert.ok(q.prompt.startsWith(prefix+' '),q.id+' must show its scientific description in the prompt');
    assert.ok(q.prompt.length>prefix.length+2,q.id+' blank clue');
    assert.ok(!q.prompt.endsWith('this description?'),q.id+' has placeholder stem');
    assert.ok(q.feedback?.short?.trim(),q.id+' must have answer explanation');
    assert.equal(q.answer?.mode,'choice',q.id+' must be multiple choice');
    assert.equal(new Set(q.options).size,q.options.length,q.id+' duplicate options');
    assert.ok(q.options.includes(q.answer.accepted[0]),q.id+' key missing from options');
    assert.equal(repair(q),q,q.id+' completed prompt should not be rewritten');
    const old={...q,prompt:stem};
    const fixed=repair(old);
    assert.equal(fixed.id,q.id);
    assert.equal(fixed.answer,q.answer);
    assert.equal(fixed.prompt,q.prompt,q.id+' cached iPad question repaired identically to new bank');
  }
}
assert.throws(()=>repair({id:'empty-description',prompt:cases[0].stem,feedback:{short:''}}),/no description/);
assert.match(app,/draft&&\['physics','biology'\]\.includes\(id\)/,'legacy drafts must be repaired');
assert.match(app,/delete draft\.answers\[i\];repaired\+\+/,'unfair choices must be removed');
assert.match(app,/draft\.remaining=p\.minutes\*60/,'repaired draft timer must restart');
assert.match(app,/\.map\(completeDescriptionQuestion\)/,'newly loaded old cached banks must also be repaired');
const html=fs.readFileSync('assessment/index.html','utf8');
assert.ok(html.includes('genericFix=20261115-description-v1'),'iPad script cache must be busted');
console.log('YEAR9_GENERIC_ASSESSMENT_DESCRIPTION_QA_PASS',JSON.stringify({questions:checked,banks:cases.map(c=>c.name),savedDrafts:'guarded',timer:'reset'}));
