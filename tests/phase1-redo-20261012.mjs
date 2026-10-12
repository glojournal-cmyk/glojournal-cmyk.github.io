import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const quiz=readFileSync('assets/quiz-session-y8fix-20260920.js','utf8');
const practise=readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
const first=quiz.indexOf('// Reroll only a new free-practice session.');
const last=quiz.indexOf('function H({title:',first);
assert.ok(first>=0&&last>first,'the replay helpers must be loaded by actual practice');
const window={location:{href:'https://glojournal-cmyk.github.io/study/french/practise?daily=1&locked=1&task=french-vocab&year=8&mode=y8vocab&topic=fr-y8-s24'}};
const ctx=vm.createContext({window,URL,Date});
vm.runInContext(quiz.slice(first,last)+';globalThis.helpers={luxRedoPracticeURL,luxRepeatQuestions}',ctx);
const {luxRedoPracticeURL:redoURL,luxRepeatQuestions:reroll}=ctx.helpers;
const url=new URL(redoURL(),'https://glojournal-cmyk.github.io');
assert.equal(url.pathname,'/study/french/practise');
for(const key of ['daily','locked','task','recover','day'])assert.equal(url.searchParams.has(key),false,'extra practice must not remain a daily task: '+key);
assert.equal(url.searchParams.get('year'),'8');
assert.equal(url.searchParams.get('mode'),'y8vocab');
assert.match(url.searchParams.get('redo'),/^\d{10,15}$/);
assert.match(quiz,/onAgain:\(\)=>\{discardDraft\.current=true;globalThis\.LuxPracticeDrafts\.clear\(draftKey\);window\.location\.assign\(luxRedoPracticeURL\(\)\)\}/);
assert.match(quiz,/if\(saved\)return saved\.base/,'resuming must preserve the actual saved questions');
assert.match(practise,/dailyLocked\?chosen:chosen\.map\(q=>\(\{\.\.\.q,_dailyVocab:null\}\)\)/,'free vocabulary must not accrue daily-vocab answers');

window.location.href='https://glojournal-cmyk.github.io/study/latin/practise?daily=1&locked=1&task=year8-long-review&mode=year8long';
assert.equal(new URL(redoURL(),'https://glojournal-cmyk.github.io').searchParams.get('mode'),'standard','daily year8long replay must not create a hidden daily task');

window.location.href='https://glojournal-cmyk.github.io/study/biology/practise?year=9&mode=standard&topic=cell';
const free=new URL(redoURL(),'https://glojournal-cmyk.github.io');
assert.equal(free.searchParams.get('topic'),'cell');
assert.equal(free.searchParams.get('year'),'9');
const bank=Array.from({length:18},(_,i)=>({id:'q'+i}));
const pick=Array.from(reroll(bank,'1791821100000')).slice(0,10).map(q=>q.id);
assert.equal(new Set(pick).size,10,'a rerolled session must have no duplicate question IDs');
assert.notDeepEqual(pick,bank.slice(0,10).map(q=>q.id),'a fresh session must not simply replay the same fixed selection');
assert.deepEqual(pick,Array.from(reroll(bank,'1791821100000')).slice(0,10).map(q=>q.id),'same resume seed must keep stable ordering');
console.log('PHASE1_REDO_QA: daily isolation, free vocabulary, saved draft, new selection passed');
