import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const quiz=fs.readFileSync('assets/quiz-session-rWAnuDVj.js','utf8');
const practise=fs.readFileSync('assets/study._subject.practise-D_PWgUd7.js','utf8');
const subjectHome=fs.readFileSync('assets/study._subject.index-BzZL_sy9.js','utf8');
for(const token of ['source=y8.filter','Year 7–8 revision · ${allCount}','Dictation · Year 7–8 revision','scope=`revision`','Year 9 words are excluded.'])assert.ok(quiz.includes(token),token);
for(const token of ['label:`Vocabulary Bank`','label:`Dictation`','Year 7–8 revision words'])assert.ok(practise.includes(token),token);
for(const token of ['mode=vocab&scope=revision','mode=dictation&scope=revision','Browse and search Year 7–8 revision words only.'])assert.ok(subjectHome.includes(token),token);
const ctx=vm.createContext({f:[{id:'l8',latin:'canis',english:'dog',year:8},{id:'l9',latin:'future',english:'unlearned',year:9}],c:[{id:'f8',french:'bonjour',english:'hello',spelling:true,year:8},{id:'f9',french:'unlearned',english:'unlearned',spelling:true,year:9}],g:[],GQS:()=>[]});
vm.runInContext(quiz.slice(quiz.indexOf('function D('),quiz.indexOf('function O(')),ctx);
for(const scope of ['revision','all','current'])for(const subject of ['latin','french']){
 const rows=ctx.D(subject,9,scope);assert.equal(rows.length,1);assert.equal(rows[0].year,8);assert.ok(rows[0].id.endsWith('8'));
}
assert.ok(!quiz.includes('setScope(`current`)'),'Do not offer an unlearned current-year bank');
console.log('VOCAB_BANK_DICTATION_QA passed: Year 7–8 only, even with stored Year 9 and old all/current links.');
