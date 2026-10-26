import assert from 'node:assert/strict';
import test from 'node:test';
import {proposeTwoMasteryTopics} from '../src/lib/daily/mastery-capacity-picker-20261026.mjs';
const qs=(topic,n,prefix=topic)=>Array.from({length:n},(_,i)=>({
 id:topic+'-'+String(i).padStart(2,'0'),topicId:topic,year:8,subject:'biology',
 status:'enabled',format:'typed_equivalent',prompt:prefix+' independent question '+i,
 answer:{mode:'exact_or_equivalent',accepted:['answer '+i]}
}));
const topic=(id,n,priority)=>({topicId:id,subject:'biology',year:8,status:'enabled',taught:true,priority,questions:qs(id,n)});
test('a 20-question topic with five prior successes is NOT selected for 20-answer Mastery',()=>{
 const a=topic('A',20,10),b=topic('B',30,9),c=topic('C',26,8);
 const saved=Object.fromEntries(a.questions.slice(0,5).map(q=>[q.id,1]));
 const out=proposeTwoMasteryTopics([a,b,c],{today:'2026-10-26',seenCorrect:saved},'2026-10-26');
 assert.equal(out.status,'FULL_READY');
 assert.deepEqual(out.assignments.map(x=>x.topicId),['B','C']);
 assert.equal(out.assignments[0].questionIds.length,20);
 assert.equal(out.assignments[1].questionIds.length,20);
 assert.ok(out.skipped.some(x=>x.topicId==='A'&&x.eligible===15));
});
test('reject a pair when two topics have different IDs but ten IDENTICAL question texts',()=>{
 const a=topic('A',20,10),b=topic('B',20,9),c=topic('C',30,8);
 for(let i=0;i<10;i++)b.questions[i].prompt=a.questions[i].prompt;
 const out=proposeTwoMasteryTopics([a,b,c],{today:'2026-10-26'},'2026-10-26');
 assert.equal(out.status,'FULL_READY');assert.deepEqual(out.assignments.map(x=>x.topicId),['A','C']);
});
test('do not invent completion when only one topic contains 20 genuinely new questions',()=>{
 const a=topic('A',20,10),b=topic('B',19,9);
 const out=proposeTwoMasteryTopics([a,b],{today:'2026-10-26'},'2026-10-26');
 assert.equal(out.status,'NOT_READY');assert.equal(out.assignments,undefined);
 assert.ok(out.skipped.some(x=>x.topicId==='B'&&x.eligible===19));
});
test('do not select an untaught topic to fill an otherwise empty Mastery slot',()=>{
 const a=topic('A',30,8),b=topic('B',35,9);b.taught=false;
 const out=proposeTwoMasteryTopics([a,b],{today:'2026-10-26'},'2026-10-26');
 assert.equal(out.status,'NOT_READY');
 assert.ok(out.skipped.some(x=>x.topicId==='B'&&x.reason==='not_enabled_taught_y8'));
});
test('preserve an explicit confirmation that no pair has enough questions',()=>{
 const a=topic('A',20,9),b=topic('B',20,8);
 const seen=Object.fromEntries([...a.questions.slice(0,3),...b.questions.slice(0,7)].map(q=>[q.id,1]));
 const out=proposeTwoMasteryTopics([a,b],{today:'2026-10-26',seenCorrect:seen},'2026-10-26');
 assert.equal(out.status,'NOT_READY');assert.equal(out.eligibleTopics,0);
});

test('do not reuse a question already reserved by another Daily task',()=>{
 const a=topic('A',20,10),b=topic('B',20,9);
 const out=proposeTwoMasteryTopics([a,b],{today:'2026-10-26'},'2026-10-26',{reservedQuestions:[a.questions[0]]});
 assert.equal(out.status,'NOT_READY');
});
test('reject question-family duplicates of existing Daily assignments even with distinct IDs',()=>{
 const a=topic('A',20,10),b=topic('B',20,9);
 const previous={...qs('other',1)[0],id:'earlier-daily',questionFamily:'shared-family'};
 a.questions[0].questionFamily='shared-family';
 const out=proposeTwoMasteryTopics([a,b],{today:'2026-10-26'},'2026-10-26',{reservedQuestions:[previous]});
 assert.equal(out.status,'NOT_READY');
});
test('allow 40 new Mastery questions when existing Daily reservations do not conflict',()=>{
 const a=topic('A',20,10),b=topic('B',20,9);
 const out=proposeTwoMasteryTopics([a,b],{today:'2026-10-26'},'2026-10-26',{reservedQuestions:qs('other',5)});
 assert.equal(out.status,'FULL_READY');
 assert.equal(out.assignments.flatMap(x=>x.questionIds).length,40);
});
test('refuse invalid reservation records instead of silently ignoring occupied slots',()=>{
 const out=proposeTwoMasteryTopics([topic('A',20,10),topic('B',20,9)],{},'2026-10-26',{reservedQuestions:[{prompt:'unknown question'}]});
 assert.equal(out.status,'NEEDS_REVIEW');
});
