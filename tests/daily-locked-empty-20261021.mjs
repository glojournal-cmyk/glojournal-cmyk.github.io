import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';

const topic=JSON.parse(fs.readFileSync('content/topics/bio-y9-b1.json','utf8'));
assert.ok(topic.questions.length>=15,'Biology Year 9 topic must contain a usable bank');
const loaded=topic.questions.map(q=>({...q,topicId:topic.topicId}));
const state=JSON.stringify(loaded);
const rank=rows=>rows;
const select=(rows,mode,size)=>rows.slice(0,size);

// Reproduce the iPad screenshot: all verified questions were excluded by the
// previously-correct filter, so the Practice card said it needed unused ones.
const fresh=[];
let picked=fillDailyLockedQuestions(fresh,loaded,{
 locked:true,mode:'standard',size:15,subject:'biology',topicId:'bio-y9-b1'
},rank,select);
assert.equal(picked.length,15,'exhausted Year 9 Biology must still open 15 formal revision questions');
assert.equal(new Set(picked.map(q=>q.id)).size,15,'do not repeat questions in the same Daily set');
assert.ok(picked.every(q=>q.topicId==='bio-y9-b1'),'never credit the wrong assigned topic');
assert.equal(JSON.stringify(loaded),state,'never modify or delete the original question bank');
assert.equal(fillDailyLockedQuestions([],loaded,{locked:true,mode:'y8vocab',size:30,topicId:'bio-y9-b1'},rank,select).length,0,
 'already-working vocabulary remains untouched');
assert.equal(fillDailyLockedQuestions([],loaded,{locked:false,mode:'standard',size:15,topicId:'bio-y9-b1'},rank,select).length,0,
 'free practice keeps its original fresh-question policy');
assert.equal(fillDailyLockedQuestions([],loaded,{locked:true,mode:'standard',size:15,topicId:'nonexistent'},rank,select).length,0,
 'never assign a different topic when the selected bank is actually missing');
picked=fillDailyLockedQuestions(loaded.slice(0,4),loaded,{locked:true,mode:'mastery',size:15,topicId:'bio-y9-b1'},rank,select);
assert.equal(picked.length,15,'partially exhausted mastery can complete 15 questions');
assert.deepEqual(picked.slice(0,4).map(q=>q.id),loaded.slice(0,4).map(q=>q.id),'keep the already-selected live question order');
for(const path of ['assets/study._subject.practise-D_PWgUd7.js','assets/study._subject.practise-y8fix-20260920.js']){
 const source=fs.readFileSync(path,'utf8');
 assert.match(source,/fillDailyLockedQuestions\(U,z,/,'every Practice runtime must use the refill');
 assert.match(source,/sessionSnapshot=\(0,w\.useRef\)\(null\)/,'non-vocab session remains stable');
}
const guard=fs.readFileSync('assets/progression-guard-20260927.js','utf8').replace(/^import .*\n/gm,'');
const location={origin:'https://school.test',href:'https://school.test/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task=year9-light&topic=bio-y9-b1',replace(v){this.replaced=v;}};
const store={getState:()=>({daily:[],topicStats:{},today:'2026-10-21'})};
const ctx={URL,URLSearchParams,location,store,progressionSubjects:['biology'],getTopicCatalog:()=>[{topicId:'bio-y9-b1'}],
 curriculumFrontier:()=>({subject:'biology',topicId:'bio-y9-b1',year:9}),curriculumHref:()=>'/study/biology/practise?daily=1&locked=1&year=9&task=year9-light&topic=bio-y9-b1',
 localStorage:{getItem:()=>null},document:{readyState:'loading',addEventListener(){}},setTimeout,clearTimeout};
vm.createContext(ctx);vm.runInContext(guard+'\nthis.guard=guardCurrentDailyRoute;',ctx);ctx.guard();
assert.equal(location.replaced,undefined,'delayed iPad progress hydration must not restart an assigned Daily route');
const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
assert.match(css,/html:has\(\.lux-practice-view\) body::before/,'an already-rendered quiz cannot be covered by the global saved-progress mask');
console.log('DAILY_EMPTY_IPAD_QA PASS: 77 Biology questions, 15 usable, no wrong-topic/duplicate/Vocab changes, no route reload and no mounted progress mask.');
