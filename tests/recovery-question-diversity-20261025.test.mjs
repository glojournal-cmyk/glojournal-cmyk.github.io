import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectDiverseRecoveryQuestions,recoveryQuestionExclusions,recoveryQuestionFingerprint} from '../assets/recovery-question-diversity-20261025.js';
const date='2026-10-24',day='2026-10-25',topic='bio-y9-cell-structure';
const t=(id,target=10)=>({id,target,progress:0,assignedYear:9,assignedSubject:'biology',assignedTopic:topic,href:'/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task='+id+'&topic='+topic});
const state=()=>({today:day,seenCorrect:{},formalAttemptLog:[],recoveryTaskByDay:{},dailyLog:{
 [date]:{date,tasks:[t('study-session'),t('year9-light',15),t('adaptive-focus',4)]}
}});
const pool=(n=60)=>Array.from({length:n},(_,i)=>({id:'q-'+i,prompt:'Describe cell feature '+i,topicId:topic,format:i%3===0?'mark_points':'typed_short',formal:true}));
const opts=(s,taskId,size=10,mode='standard')=>({state:s,date,taskId,subject:'biology',year:9,topicId:topic,size,mode,day});
const rank=(arr)=>arr;
const progression=(arr)=>arr;
const ids=arr=>new Set(arr.map(q=>q.id));
test('Independent Recovery cards reserve distinct question windows before either card is answered',()=>{
 const s=state(),bank=pool(60);
 const a=selectDiverseRecoveryQuestions(bank,bank,opts(s,'study-session',10),rank,progression);
 const b=selectDiverseRecoveryQuestions(bank,bank,opts(s,'year9-light',15),rank,progression);
 const c=selectDiverseRecoveryQuestions(bank,bank,opts(s,'adaptive-focus',4),rank,progression);
 assert.equal(a.length,10);assert.equal(b.length,15);assert.equal(c.length,4);
 assert.equal(new Set([...ids(a),...ids(b),...ids(c)]).size,29);
 assert.deepEqual(b.map(q=>q.id),bank.slice(10,25).map(q=>q.id));
});
test('Other Recovery task answers are excluded whether correct or wrong; already correct anywhere is never recycled',()=>{
 const s=state(),bank=pool(60);
 s.formalAttemptLog=[
 {questionId:'q-4',subject:'biology',year:9,recoveryFor:date,dailyTaskId:'study-session',correct:false,formal:true},
 {questionId:'q-5',subject:'biology',year:9,recoveryFor:date,dailyTaskId:'study-session',correct:true,formal:true},
 {questionId:'q-28',subject:'biology',year:9,recoveryFor:'2026-10-23',dailyTaskId:'year9-light',correct:true,formal:true}
 ];
 s.seenCorrect['q-6']=1;
 s.recoveryTaskByDay[date]={'study-session':{items:{'q-7@old':true,'q-8':false}}};
 const excluded=recoveryQuestionExclusions(s,opts(s,'year9-light'));
 for(const id of ['q-4','q-5','q-6','q-7','q-8','q-28'])assert.equal(excluded.ids.has(id),true,id);
 const questions=selectDiverseRecoveryQuestions(bank,bank,opts(s,'year9-light',15),rank,progression);
 for(const id of ['q-4','q-5','q-6','q-7','q-8','q-28'])assert.equal(ids(questions).has(id),false,id);
});
test('Different IDs that print the same question are de-duplicated, including accented/whitespace variants',()=>{
 const s=state(),b=pool(35);
 b[1]={id:'duplicate-a',prompt:'  Déscríbe   the   cell! ',format:'typed_short',topicId:topic};
 b[2]={id:'duplicate-b',prompt:'describe the cell',format:'typed_short',topicId:topic};
 const selected=selectDiverseRecoveryQuestions(b,b,opts(s,'study-session',15),rank,progression);
 assert.equal(selected.filter(q=>q.id==='duplicate-a'||q.id==='duplicate-b').length,1);
 assert.equal(recoveryQuestionFingerprint(b[1]),recoveryQuestionFingerprint(b[2]));
});
test('Correct answers in saved iPad Recovery receipts are excluded even after main store loses its answer log',()=>{
 const s=state(),b=pool(50);
 s.recoveryReceipts=[{date,taskId:'study-session',subject:'biology',verifiedCorrect:true,
   correctQuestionIds:['q-23'],questionIds:['q-23','q-24']}];
 const next=selectDiverseRecoveryQuestions(b,b,opts(s,'year9-light',15),rank,progression);
 assert.equal(ids(next).has('q-23'),false);
 assert.equal(ids(next).has('q-24'),false);
});
test('Wrong unanswered questions are not excluded permanently, but not-yet-due wrong review remains deferred',()=>{
 const s=state(),b=pool(10);
 s.reviews={'q-0':{wrong:true,due:'2026-10-27'}};
 const result=selectDiverseRecoveryQuestions(b,b,opts(s,'study-session',10),rank,progression);
 assert.equal(ids(result).has('q-0'),false);
 assert.equal(result.length,9);
});
test('When the topic bank is exhausted, a shorter genuine set is used instead of recycling ten mastered items',()=>{
 const s=state(),b=pool(12);
 for(let i=0;i<9;i++)s.seenCorrect['q-'+i]=1;
 const out=selectDiverseRecoveryQuestions(b,b,opts(s,'study-session',10),rank,progression);
 assert.equal(out.length,3);
 assert.deepEqual(out.map(q=>q.id),['q-9','q-10','q-11']);
});
test('Review assignments stay within their original selected wrong/due pool and do not silently become random practice',()=>{
 const s=state(),b=pool(50),selected=[b[13],b[32]];
 const out=selectDiverseRecoveryQuestions(selected,b,{...opts(s,'study-session',10,'mistakes'),
   reviewQuestionIds:['q-13']},rank,progression);
 assert.deepEqual(ids(out),new Set(['q-13']));
});
test('Non-Recovery ordinary Study practice is unchanged and student records are read-only',()=>{
 const s=state(),b=pool(20),snapshot=JSON.stringify(s);
 const out=selectDiverseRecoveryQuestions(b.slice(0,10),b,{...opts(s,'study-session',10),date:null},rank,progression);
 assert.deepEqual(out,b.slice(0,10));
 selectDiverseRecoveryQuestions(b,b,opts(s,'study-session',10),rank,progression);
 assert.equal(JSON.stringify(s),snapshot);
});
test('Both live Science and Latin/French Recovery entrypoints use cross-task selection and both vocab ledgers',()=>{
 for(const file of ['assets/study._subject.practise-D_PWgUd7.js','assets/study._subject.practise-y8fix-20260920.js']){
   const js=readFileSync(new URL('../'+file,import.meta.url),'utf8');
   assert.match(js,/selectDiverseRecoveryQuestions\(fillDailyLockedQuestions\(/);
   assert.match(js,/recoveryReceipts:listRecoveryReceipts\(\)/);
   assert.match(js,/Object\.entries\(s\.getState\(\)\?\.recoveryVocabByDay\|\|\{\}\)/);
   assert.match(js,/seed:recoveryDate\?String\(R\)\+':recovery:'\+recoveryDate:String\(R\)\+':daily:'\+subject/);
 }
});

test('One Recovery answer is never automatically counted as another Recovery task',()=>{
 const core=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
 const ledger=readFileSync(new URL('../assets/recovery-task-ledger-20261017.js',import.meta.url),'utf8');
 const quest=readFileSync(new URL('../assets/quest-recovery-20261011.js',import.meta.url),'utf8');
 const start=core.indexOf('const creditIds=new Set([taskId]);',core.indexOf('function patchedRecordAttempt('));
 const end=core.indexOf('let nextState=store.getState()',start);
 assert.ok(start>0&&end>start);
 assert.doesNotMatch(core.slice(start,end),/creditIds\.add\(/);
 assert.match(ledger,/if\(entry\.dailyTaskId&&entry\.dailyTaskId!==taskId\)return false/);
 assert.match(quest,/const matched=entries\.filter\(a=>a\.dailyTaskId===taskId/);
});

test('Correct answers from yesterday are excluded from the other Recovery day even with only a compact iPad proof',()=>{
 const s=state(),b=pool(60);
 s.dailyLog['2026-10-23']={date:'2026-10-23',tasks:[t('year9-light',15)]};
 s.recoveryTaskByDay['2026-10-23']={'year9-light':{items:{'q-12@ipad-1':true,'q-14':false}}};
 s.recoveryReceipts=[{date:'2026-10-23',subject:'biology',taskId:'year9-light',
   verifiedCorrect:true,correctQuestionIds:['q-18'],questionIds:['q-18']}];
 const selected=selectDiverseRecoveryQuestions(b,b,opts(s,'study-session',15),rank,progression);
 assert.equal(ids(selected).has('q-12'),false);
 assert.equal(ids(selected).has('q-18'),false);
 assert.equal(ids(selected).has('q-14'),true,'a wrong question from the previous date remains available after its scheduled retry');
});
