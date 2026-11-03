import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {datedAssignmentEvidence} from '../assets/daily-dated-assignment-evidence-20261103.js';
import {canAssignVerifiedYear8Mastery,canAssignVerifiedYear8Standard,verifiedYear8MasteryConcepts,verifiedYear8ScienceStandardConcepts,verifiedYear8OtherShortConcepts} from '../assets/year8-mastery-source-capacity-20261103.js';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';
import {selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';

const today='2026-11-03';
const catalog=JSON.parse(fs.readFileSync('content/catalog.json','utf8')).topics;
const getCatalog=(subject,year)=>catalog.filter(t=>t.subject===subject&&Number(t.year)===year);
const source=id=>JSON.parse(fs.readFileSync('content/topics/'+id+'.json','utf8')).questions
  .filter(q=>q?.id&&q.status!=='disabled'&&q.status!=='preview'&&q.formal!==false&&!q._repair);
const route=(subject,topic,mode,task)=>'/study/'+subject+'/practise?daily=1&locked=1&year=8&mode='+mode+'&task='+task+'&topic='+topic;
const attempt=(task,subject,topic,mode,n)=>({day:today,dailyTaskId:task,subject,
  topicId:topic,mode,year:8,questionId:topic+'-test-'+n,correct:n!==2,
  formal:true,repair:false,recoveryFor:null});
const task=(id,subject,topic,mode,target,progress)=>({id,planDate:today,assignedSubject:subject,
  assignedTopic:topic,assignedYear:8,assignedLabel:topic,
  target,progress,done:progress>=target,href:route(subject,topic,mode,id)});

test('dated topic pin needs at least three consistently marked IDs, never free or Recovery',()=>{
 const entries=[1,2,3].map(n=>attempt('latin-standard','latin','la-y8-stage-3-vocabulary','standard',n));
 const state={formalAttemptLog:entries};
 const v=datedAssignmentEvidence(state,today,'latin-standard',getCatalog);
 assert.equal(v.topicId,'la-y8-stage-3-vocabulary');
 assert.equal(v.questionCount,3);
 assert.equal(datedAssignmentEvidence({formalAttemptLog:entries.slice(0,2)},today,'latin-standard',getCatalog),null);
 assert.equal(datedAssignmentEvidence({formalAttemptLog:[...entries,{...entries[0],questionId:'other',topicId:'la-y8-stage-1-vocabulary'}]},today,'latin-standard',getCatalog),null);
 assert.equal(datedAssignmentEvidence({formalAttemptLog:entries.map(e=>({...e,recoveryFor:'2026-11-01'}))},today,'latin-standard',getCatalog),null);
 assert.equal(datedAssignmentEvidence(state,'2026-11-04','latin-standard',getCatalog),null);
});

test('november in-flight plan reconstructs only evidenced topic and preserves valid scores',()=>{
 const old=[
  task('latin-standard','latin','la-y8-prepositions','standard',10,10),
  task('due-review','latin','la-y8-stage-1-vocabulary','due',10,10),
  task('y8-mastery-b','latin','la-y8-nouns-and-dictionary-entries','mastery',20,20),
  task('y8-mastery-a','chemistry','chem-y8-working-scientifically','mastery',20,0),
  task('y8-standard-a','physics','phys-y8-energy-stores-transfers','standard',10,5)
 ];
 const formalAttemptLog=[
  ...[1,2,3].map(n=>attempt('latin-standard','latin','la-y8-stage-3-vocabulary','standard',n)),
  ...[1,2,3].map(n=>attempt('due-review','chemistry','chem-y8-conservation-equations','weak',n)),
  ...[1,2,3].map(n=>attempt('y8-mastery-b','latin','la-y8-stage-1-vocabulary','mastery',n))
 ];
 const state={today,daily:old,dailyLog:{},formalAttemptLog,topicStats:{},skillStats:{},reviews:{},year:8};
 const result=buildYear8DailyV2(state,getCatalog,{});
 const by=id=>result.find(x=>x.id===id);
 assert.equal(by('latin-standard').assignedTopic,'la-y8-stage-3-vocabulary');
 assert.equal(by('due-review').assignedSubject,'chemistry');
 assert.equal(by('due-review').assignedTopic,'chem-y8-conservation-equations');
 assert.equal(new URL(by('due-review').href,'https://example.test').searchParams.get('mode'),'weak');
 assert.equal(by('y8-mastery-b').assignedTopic,'la-y8-stage-1-vocabulary');
 assert.equal(by('y8-mastery-b').progress,20);
 assert.equal(by('y8-standard-a').progress,5);
 assert.equal(by('y8-standard-a').target,10);
 assert.equal(by('y8-mastery-a').target,20);
 assert.ok(canAssignVerifiedYear8Mastery(by('y8-mastery-a').assignedTopic));
 assert.notEqual(by('y8-mastery-a').assignedTopic,'chem-y8-working-scientifically');
 assert.equal(result.filter(x=>x.id==='y8-mastery-a').length,1);
 assert.equal(result.length,10);
 assert.equal(state.daily[3].assignedTopic,'chem-y8-working-scientifically','planner must not mutate original state');
});

test('strict Mastery allowlist is checked against actual source concepts',()=>{
 for(const [id,expected] of Object.entries(verifiedYear8MasteryConcepts)){
  const items=source(id),concepts=new Set(items.map(q=>q.conceptId||q.id));
  const production=new Set(items.filter(q=>['typed_exact','typed_short','typed_equivalent','spelling_restore',
   'controlled_translation','mark_points','extended_response','practical_design','calculation','unordered_set'].includes(q.format))
   .map(q=>q.conceptId||q.id));
  assert.equal(concepts.size,expected.concepts,id);
  assert.equal(production.size,expected.independent,id);
  assert.ok(canAssignVerifiedYear8Mastery(id),id);
 }
 for(const id of ['chem-y8-working-scientifically','phys-y8-energy-stores-transfers']){
  const concepts=new Set(source(id).map(q=>q.conceptId||q.id));
  assert.equal(concepts.size,id==='phys-y8-energy-stores-transfers'?19:9,id);
  assert.equal(canAssignVerifiedYear8Mastery(id),false,id);
 }
});

test('three Year 9 words is a daily cap, not three more on every resume',()=>{
 const y8=Array.from({length:33},(_,i)=>({id:'la-y8-src-s1-'+i+'-l2e',
  conceptId:'la-y8-concept-vocab-test-'+i,topicId:'la-y8-stage-1-vocabulary',
  status:'enabled',formal:true,format:'typed_exact',
  stimulus:{text:'latinword'+i,direction:'Latin → English'},answer:{accepted:['meaning'+i]}}));
 const y9=Array.from({length:12},(_,i)=>({id:'daily-latin-y9-test-'+i+'-to-english',
  conceptId:'la-y9-concept-vocab-test-'+i,topicId:'la-y9-booklet-chapter-3',year:9,
  status:'enabled',formal:true,format:'typed_exact',
  stimulus:{text:'newlatinword'+i,direction:'Latin → English'},answer:{accepted:['newmeaning'+i]}}));
 const first=selectDailyVocabulary({subject:'latin',items:y8,year9Items:y9,
  legacyVocabulary:[],day:today,size:30});
 const firstY9=first.filter(q=>q._dailyYear9);
 assert.equal(firstY9.length,3);
 const ledger={[today]:{latin:{items:Object.fromEntries(firstY9.map(q=>[q.id,false]))}}};
 const resumed=selectDailyVocabulary({subject:'latin',items:y8,year9Items:y9,
  ledger,legacyVocabulary:[],day:today,size:5});
 assert.equal(resumed.filter(q=>q._dailyYear9).length,0);
 assert.ok(resumed.length>0);
 assert.ok(resumed.every(q=>!firstY9.some(a=>a.id===q.id)));
});

test('practice window only enlarges unfinished non-Mastery, non-Recovery sessions',()=>{
 for(const path of ['assets/study._subject.practise-D_PWgUd7.js',
                    'assets/study._subject.practise-y8fix-20260920.js']){
  const source=fs.readFileSync(path,'utf8');
  assert.match(source,/!dailyParams\.has\('recover'\)/);
  assert.match(source,/\['standard','quick','weak','due','y8vocab'\]\.includes\(E\)/);
  assert.ok(source.includes('W=Math.max(W,5)'),path);
  assert.ok(source.includes('vocabSessionSeed,W)'),path+' vocabulary selector must receive window');
  assert.ok(source.includes('Number(requestedSize)'),path+' vocabulary source window');
  assert.ok(source.includes('sessionItems.length<actualRequired'),path+' correct-credit shortage gate');
 }
 const quiz=fs.readFileSync('assets/quiz-session-y8fix-20260920.js','utf8');
 assert.ok(quiz.includes('dailyLastButtonLabel(journeyTaskId||c)'));
 assert.ok(quiz.includes("'Save & continue Daily'"));
 const root=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
 assert.ok(root.includes('legacyExtraTasks:archive.slice(-12)'));
 assert.ok(root.includes('legacy.every(t=>Number(t.progress||0)===0&&t.done!==true)'));
});

test('Home hydration does not recreate fourteen Daily tasks or remove verified extra work',()=>{
 const code=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
 const first=code.indexOf('function compactDailyTasks('),last=code.indexOf('function sealDailyLog(',first);
 assert.ok(first>=0&&last>first);
 // Simulate the historical monotonic merge so older zero-credit shells are
 // visible to the writer; current date must still preserve just ten slots.
 const merge=(old,row)=>({...old,...row,tasks:[
   ...(old?.tasks||[]),...row.tasks.filter(t=>!(old?.tasks||[]).some(x=>x.id===t.id))]});
 const write=new Function('mergeDailyRecordRow','todayKey',
   code.slice(first,last)+';return writeDailyLog;')(merge,()=>today);
 const canonical=['latin-vocab','french-vocab','latin-standard','y8-standard-a',
   'y8-standard-b','y8-mastery-a','y8-mastery-b','weakness-review','due-review','year9-light']
   .map(id=>({id,target:10,progress:id==='latin-standard'?10:0,planDate:today}));
 const obsolete=['study-session','year8-long-review','tend-garden','play-game']
   .map(id=>({id,target:1,progress:0,planDate:today}));
 const clean=write({},today,[...canonical,...obsolete]);
 assert.equal(clean[today].total,10);
 assert.deepEqual(write(clean,today,[...canonical,...obsolete]),clean,'idle Home navigation must not mutate history');
 const archived=write({[today]:{date:today,tasks:[...canonical,...obsolete]}},
   today,canonical);
 assert.equal(archived[today].total,10);
 assert.equal(archived[today].legacyExtraTasks?.length,4);
 const realExtra=obsolete.map((t,i)=>i===0?{...t,progress:1,done:true}:t);
 const preserved=write({},today,[...canonical,...realExtra]);
 assert.equal(preserved[today].total,14,'a genuinely earned old task cannot be silently removed');
});

test('historical Nov 3 cleanup works safely after midnight without altering XP or other days',()=>{
 const code=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
 const start=code.indexOf('function compactDailyTasks('),end=code.indexOf('function sealDailyLog(',start);
 const fn=new Function('mergeDailyRecordRow','todayKey',
   code.slice(start,end)+';return archiveNov3ZeroCreditLegacyHistory;')((a,b)=>b,()=> '2026-11-04');
 const canonical=['latin-vocab','french-vocab','latin-standard','y8-standard-a','y8-standard-b',
   'y8-mastery-a','y8-mastery-b','weakness-review','due-review','year9-light']
   .map(id=>({id,target:10,progress:id==='latin-standard'?10:0,done:id==='latin-standard'}));
 const unearned=['study-session','year8-long-review','tend-garden','play-game']
   .map(id=>({id,target:1,progress:0,done:false}));
 const before={'2026-11-03':{date:'2026-11-03',tasks:[...canonical,...unearned],total:14,done:1},
   '2026-11-02':{date:'2026-11-02',total:10,done:8},
   '2026-11-04':{date:'2026-11-04',total:10,done:0}};
 const after=fn(before);
 assert.equal(after['2026-11-03'].total,10);
 assert.equal(after['2026-11-03'].done,1);
 assert.equal(after['2026-11-03'].legacyExtraTasks.length,4);
 assert.deepEqual(after['2026-11-02'],before['2026-11-02']);
 assert.deepEqual(after['2026-11-04'],before['2026-11-04']);
 assert.deepEqual(fn(after),after,'archiving historical placeholders must be idempotent');
 const earned={'2026-11-03':{...before['2026-11-03'],
   tasks:[...canonical,...unearned.map((t,i)=>i===0?{...t,progress:1,done:true}:t)]}};
 assert.equal(fn(earned),earned,'do not remove a genuinely completed legacy task');
});

test('legacy exhausted-bank 6/6 is restored to the true 6/20 unfinished Mastery',()=>{
 const capped={...task('y8-mastery-a','latin','la-y8-nouns-and-dictionary-entries',
  'mastery',6,6),cappedBecauseQuestionBankExhausted:true,done:true};
 const state={today,daily:[capped],dailyLog:{},formalAttemptLog:[],
  topicStats:{},skillStats:{},reviews:{},xp:341,pet:{masteryPoints:144}};
 const input=JSON.stringify(state);
 const plan=buildYear8DailyV2(state,getCatalog,{});
 const found=plan.find(t=>t.id==='y8-mastery-a');
 assert.equal(found.assignedTopic,capped.assignedTopic);
 assert.equal(found.target,20,'never promote bank exhaustion into a lower pass gate');
 assert.equal(found.progress,6,'do not erase legitimate correct credits');
 assert.equal(found.done,false,'6/20 is never 6/6 completion');
 assert.equal(found.cappedBecauseQuestionBankExhausted,true,'retain audit marker');
 assert.equal(JSON.stringify(state),input,'no XP, MP, Pet or raw learner data mutation');
});

test('dated Daily Record merge cannot resurrect a capped 6/6 from a legitimate 6/20',async()=>{
 const {mergeDailyRecordRow}=await import('../assets/daily-record-integrity-20261018.js');
 const original={id:'y8-mastery-a',assignedSubject:'latin',assignedTopic:'la-y8-nouns-and-dictionary-entries',
  assignedYear:8,href:'/study/latin/practise?daily=1&locked=1&year=8&mode=mastery&task=y8-mastery-a&topic=la-y8-nouns-and-dictionary-entries',
  target:6,progress:6,done:true,cappedBecauseQuestionBankExhausted:true};
 const verified={...original,target:20,progress:6,done:false,
  cappedBecauseQuestionBankExhausted:false};
 const current=mergeDailyRecordRow({date:today,tasks:[original]},
  {date:today,tasks:[verified]},today);
 assert.equal(current.tasks.length,1);
 assert.equal(current.tasks[0].target,20);
 assert.equal(current.tasks[0].progress,6);
 assert.equal(current.tasks[0].done,false);
 assert.equal(current.complete,false);
 assert.equal(current.tasks[0].cappedBecauseQuestionBankExhausted,true);
 const reversed=mergeDailyRecordRow({date:today,tasks:[verified]},
  {date:today,tasks:[original]},today);
 assert.equal(reversed.tasks[0].target,20,'merge order must not shorten original target');
 assert.equal(reversed.tasks[0].progress,6);
 assert.equal(reversed.tasks[0].done,false);
 const wrongYear=mergeDailyRecordRow({date:today,tasks:[original]},
  {date:today,tasks:[{...verified,assignedYear:9}]},today);
 assert.equal(wrongYear.tasks[0].target,6,'cannot transfer old cap to a different year');
 const unrelated={...verified,assignedTopic:'la-y8-core-verbs'};
 const alien=mergeDailyRecordRow({date:today,tasks:[original]},
  {date:today,tasks:[unrelated]},today);
 assert.equal(alien.tasks[0].assignedTopic,original.assignedTopic,
  'topic drift cannot inherit or overwrite another assignment');
 assert.equal(alien.tasks[0].target,6,
  'never reassign old capped credit to another topic');
 const historical=mergeDailyRecordRow({date:'2026-10-23',tasks:[original]},
  {date:'2026-10-23',tasks:[verified]},'2026-10-23');
 assert.equal(historical.tasks[0].target,6,'prior-day completed historic cap unchanged');
});

test('real Year 8 Physics energy Standard now has enough genuinely fresh concepts to refill 5/10',()=>{
 const items=source('phys-y8-energy-stores-transfers');
 const groups=new Map();
 for(const q of items){
   assert.equal(q.status,'enabled');
   assert.equal(q.topicId,'phys-y8-energy-stores-transfers');
   const id=q.conceptId||q.id;
   groups.set(id,[...(groups.get(id)||[]),q]);
 }
 assert.equal(groups.size,19,'35 question variants were only 9 concepts; ten new independent concepts added');
 const additions=items.filter(q=>/-20261103$/.test(q.id));
 // Fixed IDs are stable and source-marked; do not rely on suffixes.
 const newItems=items.filter(q=>['kinetic-faster','raising-backpack','hot-water-cold-spoon',
  'sunlight-vacuum','lamp-electrical-pathway','thermal-insulation','brake-friction',
  'efficiency-40-percent','sankey-width','joule-unit']
  .some(slug=>q.id==='phys-y8-energy-stores-transfers-'+slug));
 assert.equal(newItems.length,10);
 assert.equal(new Set(newItems.map(q=>q.conceptId)).size,10);
 for(const q of newItems){
  assert.ok(q.feedback?.short&&q.feedback?.steps?.length,'usable explanatory marking');
  if(q.format==='mc_single'){
   assert.equal(q.options?.length,4);
   assert.equal(new Set(q.options).size,4);
   assert.equal(q.answer?.mode,'choice');
   assert.equal(q.options.filter(t=>q.answer.accepted.includes(t)).length,1,'one correct choice');
  }else{
   assert.equal(q.format,'typed_short');
   assert.equal(q.answer.mode,'equivalent');
   assert.ok(q.answer.accepted.includes('J'));
  }
 }
 assert.ok(groups.size-5>=10,'even five already-credited concepts leave >=10 distinct concepts');
 assert.equal(canAssignVerifiedYear8Mastery('phys-y8-energy-stores-transfers'),false,
  'nineteen concepts still insufficient for 20-question Mastery');
 const record=catalog.find(t=>t.topicId==='phys-y8-energy-stores-transfers');
 assert.equal(record.enabled,items.length);
});

test('all 21 Year 8 Chemistry and Physics catalog capacities are source checked',()=>{
 const science=catalog.filter(t=>t.year===8&&['chemistry','physics'].includes(t.subject)&&t.status==='enabled');
 assert.equal(science.length,21);
 assert.equal(Object.keys(verifiedYear8ScienceStandardConcepts).length,21);
 for(const t of science){
  const qs=source(t.topicId);
  const conceptCount=new Set(qs.map(q=>q.conceptId||q.id)).size;
  assert.equal(conceptCount,verifiedYear8ScienceStandardConcepts[t.topicId],t.topicId);
  assert.equal(canAssignVerifiedYear8Standard(t.topicId),conceptCount>=10);
  if(t.topicId!=='phys-y8-energy-stores-transfers')assert.equal(conceptCount,9,t.topicId);
 }
});

test('fresh Daily never overbooks 19-concept Physics or assigns nine-concept Science Standard',()=>{
 for(const date of ['2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']){
  const state={today:date,daily:[],dailyLog:{},year:8,formalAttemptLog:[],
    reviews:{},topicStats:{},skillStats:{}};
  const before=JSON.stringify(state);
  const rows=buildYear8DailyV2(state,getCatalog,{});
  assert.equal(rows.length,10,date);
  const standards=rows.filter(t=>t.id==='y8-standard-a'||t.id==='y8-standard-b');
  assert.equal(standards.length,2,date);
  assert.equal(new Set(standards.map(t=>t.assignedTopic)).size,2,
   'two 10-question Standard slots must reserve different topic pools on '+date);
  assert.ok(standards.every(t=>t.assignedTopic&&
   canAssignVerifiedYear8Standard(t.assignedTopic)),date);
  assert.ok(rows.filter(t=>['due-review','weakness-review'].includes(t.id))
   .every(t=>canAssignVerifiedYear8Standard(t.assignedTopic)),date);
  assert.equal(JSON.stringify(state),before,'planner cannot edit XP, MP or any state');
 }
});

test('unopened impossible Science Standard is safely reassigned; started one stays pinned',()=>{
 const old=task('y8-standard-a','chemistry','chem-y8-working-scientifically','standard',10,0);
 const base={today,daily:[old],dailyLog:{},year:8,formalAttemptLog:[],reviews:{},topicStats:{}};
 const fresh=buildYear8DailyV2(base,getCatalog,{});
 assert.notEqual(fresh.find(x=>x.id===old.id).assignedTopic,old.assignedTopic);
 assert.ok(canAssignVerifiedYear8Standard(fresh.find(x=>x.id===old.id).assignedTopic));
 const started=buildYear8DailyV2({...base,daily:[{...old,progress:3}]},getCatalog,{});
 const matched=started.find(t=>t.id===old.id);
 assert.equal(matched.assignedTopic,old.assignedTopic,'preserve historic partial credits');
 assert.equal(matched.progress,3);
 assert.equal(matched.target,10,'never reduce threshold to saved answers');
});

test('all 115 eligible Year 8 topic packs have accurate Standard concept-capacity routing',()=>{
 const subjects=['latin','french','biology','chemistry','physics'];
 const qualified=catalog.filter(t=>t.year===8&&subjects.includes(t.subject)&&
  t.status==='enabled'&&Number(t.enabled)>=15&&
  (!t.formats||Object.entries(t.formats).some(([k,v])=>[
   'typed_exact','typed_short','typed_equivalent','spelling_restore','controlled_translation',
   'mark_points','extended_response','practical_design','calculation','unordered_set']
   .includes(k)&&Number(v)>0)));
 assert.equal(qualified.length,110,'five non-production-only Latin packs are excluded by the real Daily curriculum filter');
 assert.equal(Object.keys(verifiedYear8OtherShortConcepts).length,9);
 let ineligible=0;
 for(const t of qualified){
  const qs=source(t.topicId).filter(q=>q.status==='enabled'&&q.preview!==true);
  const n=new Set(qs.map(q=>q.conceptId||q.id)).size;
  const canAssign=canAssignVerifiedYear8Standard(t.topicId);
  assert.equal(canAssign,n>=10,'source audit concept-count error: '+t.topicId);
  if(!canAssign)ineligible++;
 }
 assert.equal(ineligible,29,'twenty science and nine Latin/Biology topics require bank repair');
});

test('real dated planner preserves started Biology/Latin credit but rotates unopened 8-concept Standard',()=>{
 for(const [subject,topic] of [
  ['biology','bio-y8-dna-structure'],['latin','la-y8-adjective-agreement']
 ]){
  const id=subject==='latin'?'latin-standard':'y8-standard-b', mode='standard';
  const original=task(id,subject,topic,mode,10,0);
  const base={today,daily:[original],dailyLog:{},year:8,formalAttemptLog:[],
    reviews:{},topicStats:{},skillStats:{}};
  const fresh=buildYear8DailyV2(base,getCatalog,{}).find(t=>t.id===id);
  assert.notEqual(fresh.assignedTopic,topic,'unstarted short topic must be replaced');
  assert.ok(canAssignVerifiedYear8Standard(fresh.assignedTopic));
  const ongoing=buildYear8DailyV2({...base,daily:[{...original,progress:4}]},getCatalog,{})
   .find(t=>t.id===id);
  assert.equal(ongoing.assignedTopic,topic,'existing marked work cannot be silently moved');
  assert.equal(ongoing.progress,4);
  assert.equal(ongoing.target,10);
 }
});
