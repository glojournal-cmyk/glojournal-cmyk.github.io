import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulateDailyV2Days} from '../src/simulator.js';
const startDate='2026-10-26';
function syntheticBank(days=30){
 const bank=[],taughtTopicIds=[],history=[];
 const add=(id,subject,year,topicId,role,details={})=>{
  bank.push({id,subject,year,topicId,status:'enabled',formal:true,
   prompt:'QUESTION '+id,roles:[role],...details});
 };
 for(const subject of ['latin','french']){
  // Two disjoint 25-concept sets permit next-day spacing without
  // changing the 25 Y7-8 + up-to-5 verified Y9 Daily slot allocation.
  for(let i=0;i<50;i++)add(subject+'-v8-'+i,subject,8,subject+'-v8-vocabulary',
    subject+'-vocab',{conceptId:subject+'-concept-8-'+i});
  taughtTopicIds.push(subject+'-y9-vocabulary');
  for(let i=0;i<10;i++)add(subject+'-v9-'+i,subject,9,subject+'-y9-vocabulary',
    subject+'-vocab',{conceptId:subject+'-concept-9-'+i});
 }
 for(let d=0;d<days;d++){
  const topic='science-std-'+d;
  for(let i=0;i<10;i++)add('science-std-'+d+'-'+i,'biology',8,topic,'science-standard');
  for(const subject of ['latin','french']){
   const skills=subject==='latin'?[['grammar',4],['translation',3],['passage',3]]:
    [['grammar',4],['translation',3],['writing',3]];
   for(const [skill,n] of skills)for(let i=0;i<n;i++){
    add(subject+'-std-'+d+'-'+skill+'-'+i,subject,8,
     subject+'-std-'+skill+'-topic',''+subject+'-standard',{skill});
   }
  }
  const yt='taught-biology-year9-'+d;
  taughtTopicIds.push(yt);
  for(const [band,n] of [['foundation',6],['application',11],['challenge',3]]){
   for(let i=0;i<n;i++)add('y9-'+d+'-'+band+'-'+i,'biology',9,yt,'year9-progressive',{depthBand:band});
  }
  for(const marks of [1,2,3]){
   add('exam-'+d+'-'+marks,'physics',8,'exam-source','gcse',
    {marks,markScheme:Array.from({length:marks},(_,i)=>'mark-'+i)});
  }
  for(let t=0;t<2;t++){
   const masteryTopic='mastery-topic-'+(d*2+t),subject=t===0?'physics':'chemistry';
   for(const [band,n] of [['foundation',4],['application',10],['challenge',6]]){
    for(let i=0;i<n;i++)add('mastery-'+d+'-'+t+'-'+band+'-'+i,subject,8,
      masteryTopic,'mastery',{depthBand:band});
   }
  }
 }
 for(let i=0;i<10;i++){
  const id='historical-'+i;
  add(id,'physics',8,'historical-topic','retention-source');
  history.push({day:'2026-10-01',eventId:'h'+i,
   taskId:'legacy-revision',questionId:id,correct:i%2===0,persisted:true});
 }
 return {startDate,days,questionBank:bank,taughtTopicIds,priorAttempts:history};
}
test('30-day adequate synthetic bank provides 163 validated assignments every day',()=>{
 const f=syntheticBank();
 const result=simulateDailyV2Days(f);
 assert.equal(result.status,'ready');
 assert.equal(result.completedDays,30);
 assert.equal(result.simulatedAnswered,163*30);
 assert.ok(result.days.every(d=>d.questions===163&&d.retentionCount===10));
});
test('two mastery topics per day are genuinely distinct across 30 days',()=>{
 const result=simulateDailyV2Days(syntheticBank());
 const topics=result.days.flatMap(x=>x.masteryTopicIds);
 assert.equal(topics.length,60);
 assert.equal(new Set(topics).size,60);
});
test('a small Mastery bank runs out after two days, and failure is reported',()=>{
 const f=syntheticBank(30);
 f.questionBank=f.questionBank.filter(q=>!q.id.startsWith('mastery-')|| /^mastery-[01]-/.test(q.id));
 const result=simulateDailyV2Days(f);
 assert.equal(result.status,'blocked');
 assert.equal(result.completedDays,2);
 assert.equal(result.firstBlockedDay,'2026-10-28');
 assert.ok(result.diagnostics.some(d=>d.code==='MASTERY_BANK_OR_DEPTH_SHORTAGE'));
});
test('a missing challenge question halts BEFORE the child starts practice',()=>{
 const f=syntheticBank();
 f.questionBank=f.questionBank.filter(q=>q.id!=='mastery-0-0-challenge-5');
 const r=simulateDailyV2Days(f);
 // Another usable topic might be selected first. With only 59 usable
 // complete mastery topics, the shortage must eventually be exposed.
 assert.equal(r.status,'blocked');
 assert.equal(r.completedDays,29);
 assert.ok(r.diagnostics.some(d=>d.code==='MASTERY_BANK_OR_DEPTH_SHORTAGE'));
});
test('no persisted historical questions cannot silently become Retention',()=>{
 const f=syntheticBank();f.priorAttempts=[];
 const r=simulateDailyV2Days(f);
 assert.equal(r.completedDays,0);
 assert.equal(r.firstBlockedDay,startDate);
 assert.ok(r.diagnostics.some(d=>d.code==='INSUFFICIENT_PERSISTED_HISTORY'));
});
test('missing certified Y9 topic creates a visible date-specific shortage',()=>{
 const f=syntheticBank();f.taughtTopicIds=f.taughtTopicIds.filter(t=>!t.startsWith('taught-biology-year9-'));
 const r=simulateDailyV2Days(f);
 assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(d=>d.code==='YEAR9_PROGRESSIVE_BANK_OR_DEPTH_SHORTAGE'));
});
test('simulation does not modify passed bank or historical events',()=>{
 const f=syntheticBank(2),before=JSON.stringify(f);
 const r=simulateDailyV2Days(f);
 assert.equal(r.status,'ready');assert.equal(JSON.stringify(f),before);
});
test('start date invalid or day count over 90 fails rather than pretending to simulate',()=>{
 const f=syntheticBank(2);
 assert.throws(()=>simulateDailyV2Days({...f,startDate:'2026-10-32'}),/invalid ISO/);
 assert.throws(()=>simulateDailyV2Days({...f,days:91}),/days must be/);
});
test('progressive question exhaustion is not covered up by repeating yesterday questions',()=>{
 const f=syntheticBank();
 f.questionBank=f.questionBank.filter(q=>!q.id.startsWith('y9-')|| /^y9-[01]-/.test(q.id));
 const r=simulateDailyV2Days(f);
 assert.equal(r.status,'blocked');
 assert.equal(r.completedDays,2);
 assert.ok(r.diagnostics.some(d=>d.code==='YEAR9_PROGRESSIVE_BANK_OR_DEPTH_SHORTAGE'));
});
test('two consecutive days never count yesterday-correct vocabulary concepts again',()=>{
 const f=syntheticBank(3);
 const r=simulateDailyV2Days(f);
 assert.equal(r.status,'ready');
 const pick=(day,subject)=>r.days[day].vocabConceptsBySubject?.[subject]||[];
 // The simulation audits concept IDs directly; alternate source question
 // IDs/directions must not make the same concept newly creditable.
 for(const subject of ['latin','french']){
  assert.equal(pick(0,subject).length,30);
  assert.equal(pick(1,subject).length,30);
  assert.equal(pick(0,subject).filter(c=>pick(1,subject).includes(c)).length,0);
  assert.equal(pick(2,subject).length,30);
 }
});
test('30-word bank cannot masquerade as 30 fresh words on the next day',()=>{
 const f=syntheticBank(2);
 f.questionBank=f.questionBank.filter(q=>
   !q.roles.includes('latin-vocab')&&!q.roles.includes('french-vocab')||
   (q.year===9?Number(q.id.split('-').at(-1))<5:
     Number(q.id.split('-').at(-1))<25));
 const r=simulateDailyV2Days(f);
 assert.equal(r.status,'blocked');
 assert.equal(r.completedDays,1);
 assert.equal(r.firstBlockedDay,'2026-10-27');
 assert.ok(r.diagnostics.some(d=>d.code==='VOCAB_SPACING_CAPACITY_SHORTAGE'));
});
test('Vocab cycles can reuse old lexical concepts across successive days',()=>{
 const f=syntheticBank(3);
 const r=simulateDailyV2Days(f);
 assert.equal(r.status,'ready');
 assert.equal(r.completedDays,3);
 assert.equal(r.simulatedAnswered,489);
});

test('30-day partial mode keeps nine legitimate tasks usable without fabricating GCSE points',()=>{
 const f=syntheticBank(30);
 f.questionBank=f.questionBank.filter(q=>!q.id.startsWith('exam-')||!q.id.endsWith('-3'));
 const r=simulateDailyV2Days({...f,continuityMode:'staging-partial'});
 assert.equal(r.status,'partial');
 assert.equal(r.completedDays,30);
 assert.equal(r.partialDays,30);
 assert.equal(r.questionsNotAssigned,90);
 assert.equal(r.simulatedAnswered,4800);
 assert.ok(r.days.every(d=>d.status==='partial'&&d.questions===160));
});
test('strict default simulation still blocks the entire day when GCSE bank is short',()=>{
 const f=syntheticBank(30);
 f.questionBank=f.questionBank.filter(q=>!q.id.startsWith('exam-')||!q.id.endsWith('-3'));
 const r=simulateDailyV2Days(f);
 assert.equal(r.status,'blocked');
 assert.equal(r.completedDays,0);
 assert.ok(r.diagnostics.some(d=>d.code==='EXCLUSIVE_EXAM_MARK_SHORTAGE'));
});
test('staging partial mode still rejects unsafe globally duplicated bank IDs',()=>{
 const f=syntheticBank(2);
 f.questionBank.push({...f.questionBank[0]});
 const r=simulateDailyV2Days({...f,continuityMode:'staging-partial'});
 assert.equal(r.status,'blocked');
 assert.equal(r.completedDays,0);
 assert.ok(r.diagnostics.some(d=>d.code==='INVALID_OR_DUPLICATE_QUESTION_ID'));
});
test('unsupported continuity modes cannot turn off shortage validation',()=>{
 assert.throws(()=>simulateDailyV2Days({...syntheticBank(2),continuityMode:'disable-checks'}),/invalid continuity mode/);
});

test('real exhaustion: only 30 daily GCSE sets cannot pretend a 31st fresh set exists',()=>{
 const f=syntheticBank(30);
 const r=simulateDailyV2Days({...f,days:31});
 assert.equal(r.status,'blocked');
 assert.equal(r.completedDays,30);
 assert.ok(r.diagnostics.some(d=>d.code==='EXCLUSIVE_EXAM_MARK_SHORTAGE'));
});
test('all-correct 30-day GCSE usage never silently repeats exam IDs',()=>{
 const r=simulateDailyV2Days(syntheticBank(30));
 assert.equal(r.status,'ready');
 // The fixture provides exactly 90 originals (30 per mark band).
 assert.equal(r.completedDays,30);
 assert.equal(r.simulatedAnswered,4890);
});
