import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';

const day='2026-10-21', topic='la-y8-prepositions', taskId='latin-standard';
const assignedHref=`/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=${taskId}&topic=${topic}`;
const questions=Array.from({length:10},(_,i)=>({id:'la-prep-'+i,topicId:topic,formal:true}));
const answers=questions.map(q=>({questionId:q.id,correct:true,formal:true,repair:false}));
function fixture(overrides={}){
 const task={id:taskId,title:'Latin · Preposition dictionary entries',href:assignedHref,planDate:day,
   assignedSubject:'latin',assignedTopic:topic,assignedYear:8,target:10,progress:0,...overrides.task};
 const history={date:day,done:0,total:1,complete:false,tasks:[{id:taskId,target:10,progress:0,done:false}]};
 return {today:day,daily:[task],dailyLog:{[day]:history,'2026-10-20':{date:'2026-10-20',done:2,total:10,tasks:[]}},
   xp:419,rewardLedgerByDay:{[day]:{daily_complete:1}},...overrides,
   daily:[task],dailyLog:overrides.dailyLog||{[day]:history,'2026-10-20':{date:'2026-10-20',done:2,total:10,tasks:[]}}};
}
const receipt=(overrides={})=>({day,taskId,subject:'latin',year:8,mode:'standard',
  questions,answers,...overrides});

test('Latin 10/10 becomes Home Daily 10/10, once only, no additional XP',()=>{
 const original=fixture();
 const first=reconcileDailySession(original,receipt());
 assert.equal(first.changed,true);
 assert.equal(first.progress,10);
 assert.equal(first.daily[0].progress,10);
 assert.equal(first.dailyLog[day].done,1);
 assert.equal(first.dailyLog[day].complete,true);
 assert.equal(first.dailyLog['2026-10-20'],original.dailyLog['2026-10-20']);
 assert.equal(original.daily[0].progress,0,'source must remain immutable');
 assert.equal(original.xp,419);
 const second=reconcileDailySession({...original,daily:first.daily,dailyLog:first.dailyLog},receipt());
 assert.equal(second.changed,false,'same answers cannot count twice');
});
test('Only actually checked formal, matching-topic questions count',()=>{
 const result=reconcileDailySession(fixture(),receipt({answers:[
   answers[0],answers[0],{...answers[1],correct:false},
   {...answers[2],repair:true},{...answers[3],formal:false},
   {...answers[4],questionId:'unassigned-id'},...answers.slice(5,7)
 ]}));
 assert.equal(result.progress,4,'two unique, distinct formal + two other marked answers');
 assert.equal(result.dailyLog[day].complete,false);
});
test('Wrong topic, day, subject, year, mode or task cannot claim another Daily task',()=>{
 for(const changes of [
   {day:'2026-10-20'},{taskId:'y8-standard-a'},{subject:'french'},
   {year:9},{mode:'mastery'},{questions:questions.map(q=>({...q,topicId:'la-other'}))},
   {answers:answers.map(q=>({...q,questionId:'other-'+q.questionId}))}
 ]){
   assert.equal(reconcileDailySession(fixture(),receipt(changes)).changed,false,JSON.stringify(changes).slice(0,85));
 }
});
test('Never credit a regular free quiz, vocabulary, or unlocked task',()=>{
 for(const changes of [{task:{href:'/study/latin/practise?mode=standard'}},
   {task:{id:'latin-vocab'}},{task:{planDate:'2026-10-20'}},
   {task:{assignedTopic:'la-different'}},{task:{assignedSubject:'french'}}]){
   assert.equal(reconcileDailySession(fixture(changes),receipt()).changed,false);
 }
});
test('A partial session cannot erase higher previously counted progress',()=>{
 const first=reconcileDailySession(fixture({task:{progress:8}}),
   receipt({answers:answers.slice(0,3)}));
 assert.equal(first.changed,false);
 assert.equal(first.progress,8);
});
test('Formal wrong answers still count as attempted, not rewarded correctness',()=>{
 const wrong=[...answers];wrong[0]={...wrong[0],correct:false};
 const result=reconcileDailySession(fixture(),receipt({answers:wrong}));
 assert.equal(result.progress,10,'Daily Standard target is ten attempts');
 assert.equal(result.dailyLog[day].complete,true);
});
test('A session with no marked answers cannot generate completion',()=>{
 const result=reconcileDailySession(fixture(),receipt({answers:[]}));
 assert.equal(result.changed,false);
});

test('iPad loads cache-busted quiz, Daily route, wrapper and core (not stale JavaScript)',()=>{
 const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const practiceRelease='20261024-correct-credit1';
 const quizRelease='20261024-correct-credit1';
 const creditRelease='20261024-correct-credit1';
 // The core gets a fresh version when a different app feature is repaired.
 // Require a dated cache-buster, not one frozen release name.
 assert.ok(/index-BLVOhKhN\.core\.js\?v=20261024-[a-z0-9-]+/.test(file('assets/index-BLVOhKhN.js')));
 assert.ok(file('assets/index-BLVOhKhN.core.js').includes('study._subject.practise-y8fix-20260920.js?v='+practiceRelease));
 for(const module of ['assets/study._subject.practise-y8fix-20260920.js','assets/study._subject.practise-D_PWgUd7.js'])
   assert.ok(file(module).includes('quiz-session-y8fix-20260920.js?v='+quizRelease),module);
 assert.ok(file('assets/quiz-session-y8fix-20260920.js').includes('daily-session-credit-20261021.js?v='+creditRelease));
 for(const route of ['index.html',...['latin','french','biology','chemistry','physics','english'].map(s=>'study/'+s+'/practise/index.html')])
   assert.ok(/index-BLVOhKhN\.js\?v=20261024-[a-z0-9-]+/.test(file(route)),route);
});


test('20 marked Mastery quiz slots count 20/20 including a repeated question ID',()=>{
 const masteryId='y8-mastery-a';
 const repeated=[...Array.from({length:19},(_,i)=>({id:'mastery-'+i,topicId:topic,formal:true})),
   {id:'mastery-0',topicId:topic,formal:true}];
 const source=fixture({task:{id:masteryId,target:20,progress:0,
   href:`/study/latin/practise?daily=1&locked=1&year=8&mode=mastery&task=${masteryId}&topic=${topic}`}});
 const result=reconcileDailySession(source,{day,taskId:masteryId,subject:'latin',year:8,
   mode:'mastery',questions:repeated,answers:repeated.map(q=>({questionId:q.id,correct:false,formal:true}))});
 assert.equal(result.progress,20,'even incorrect attempts must be recorded');
 assert.equal(result.daily[0].progress,20);
 assert.equal(source.daily[0].progress,0);
 const duplicate=reconcileDailySession(source,{day,taskId:masteryId,subject:'latin',year:8,
   mode:'mastery',questions:repeated,answers:[...repeated.map(q=>({questionId:q.id,correct:false,formal:true})),
     {questionId:'mastery-0',correct:false,formal:true}]});
 assert.equal(duplicate.progress,20,'a forged extra repeat is not credited');
});
