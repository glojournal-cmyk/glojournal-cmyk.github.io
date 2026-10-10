import fs from 'node:fs';
import assert from 'node:assert/strict';
import {creditMistakeReview} from '../assets/mistake-review-plan-20261003.js';
const question=JSON.parse(fs.readFileSync('content/topics/chem-y8-acids-indicators-ph.json')).questions.find(q=>q.id.endsWith('ph-categories-typed'));
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
for(const name of ['quiz-session-y8fix-20260920.js','quiz-session-rWAnuDVj.js']){
 const source=fs.readFileSync('assets/'+name,'utf8');
 const grade=new Function('a','d','x',source.slice(source.indexOf('function A(e){'),source.indexOf('function V(e){'))+';return B;')(norm,norm,norm);
 for(const answer of [question.answer.accepted[0],'Acids are below 7,neutral is 7 and alkalis are above 7.','Acids are below 7; neutral is 7; alkalis are above 7','Alkalis have a pH greater than 7, acids have a pH less than 7 and neutral solutions have a pH of 7.','acidic < 7, neutral = 7, alkaline > 7'])assert.equal(grade(question,answer,'chemistry').ok,true,answer);
 for(const answer of ['Acids are above 7, neutral is 7 and alkalis are below 7.','Acids are below 6, neutral is 7 and alkalis are above 7.','Acids are below 7, neutral is 8 and alkalis are above 7.','Acids are not below 7, neutral is 7 and alkalis are above 7.','Acids are below 7, neutral is 7','Acids are below 7, neutral is 7 and alkalis are above 7 but acids are above 7.'])assert.equal(grade(question,answer,'chemistry').ok,false,answer);
 const other={id:'prose',format:'typed_short',answer:{accepted:['One, two and three.']}};
 assert(grade(other,'One,two and three','chemistry').ok);
 assert(!grade(other,'One,two and four','chemistry').ok);
 const formula={id:'formula',format:'typed_exact',answer:{accepted:['Co']}};
 assert(!grade(formula,'CO','chemistry').ok);
 let task={planDate:'2026-10-10',reviewQuestionIds:[question.id],reviewCompletedIds:[],progress:0};
 task=creditMistakeReview(task,question.id,grade(question,'Acids are below 7,neutral is 7 and alkalis are above 7.','chemistry').ok,'2026-10-10');
 assert.equal(task.progress,1);
 assert.equal(creditMistakeReview(task,question.id,true,'2026-10-10').progress,1);
}
console.log('Chemistry prose regression passed: screenshot, equivalent wording, incorrect values/directions, formula case and daily credit.');
