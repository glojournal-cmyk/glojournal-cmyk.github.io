/* Scholar's Garden Daily V2 — pure deterministic planner.
 * Staging only. No imports from the legacy Daily engine, no storage or UI writes.
 * This planner expects an audited, fully loaded bank with explicit roles and
 * depth bands. An adapter/quality-audit layer is REQUIRED before integration.
 */
import {isValidDailyV2Day} from './calendar.js';
export const DAILY_V2_TASKS = Object.freeze([
 {id:'latin-vocab',kind:'vocab',target:30,subject:'latin'},
 {id:'french-vocab',kind:'vocab',target:30,subject:'french'},
 {id:'latin-standard',kind:'standard',target:10,subject:'latin'},
 {id:'french-standard',kind:'standard',target:10,subject:'french'},
 {id:'science-standard',kind:'standard',target:10,subject:'science'},
 {id:'mastery-a',kind:'mastery',target:20},
 {id:'mastery-b',kind:'mastery',target:20},
 {id:'spaced-retention',kind:'retention',target:10},
 {id:'gcse-exam-skills',kind:'exam',target:3},
 {id:'year9-progressive',kind:'progressive',target:20}
]);
const isId = x => typeof x==='string' && x.trim().length>0;
const plain = x => String(x||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const bands = ['foundation','application','challenge'];
const QUOTAS = {
 'latin-standard':{grammar:4,translation:3,passage:3},
 'french-standard':{grammar:4,translation:3,writing:3},
 'mastery':{foundation:4,application:10,challenge:6},
 'year9-progressive':{foundation:6,application:11,challenge:3}
};
const validDay=isValidDailyV2Day;
function daySpan(day,oldDay){
 if(!validDay(day)||!validDay(oldDay))return -1;
 return Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(oldDay+'T12:00:00Z'))/86400000);
}
function stableHash(s){let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0;}
const sortByDay=(day,a,b)=>stableHash(day+'|'+a.id)-stableHash(day+'|'+b.id)||a.id.localeCompare(b.id);
function choose(rows,n,day){
 return [...rows].sort((a,b)=>sortByDay(day,a,b)).slice(0,n);
}
function chooseUnique(rows,n,day,prior=[]){
 const seenIds=new Set(prior.map(q=>q.id));
 const seenPrompts=new Set(prior.map(q=>q._promptKey).filter(Boolean));
 const selected=[];
 for(const q of [...rows].sort((a,b)=>sortByDay(day,a,b))){
  if(seenIds.has(q.id)||(q._promptKey&&seenPrompts.has(q._promptKey)))continue;
  seenIds.add(q.id);if(q._promptKey)seenPrompts.add(q._promptKey);
  selected.push(q);
  if(selected.length>=n)break;
 }
 return selected;
}
function normalizeQuestions(raw, day, taught) {
 const seen=new Set(), questions=[],errors=[];
 for(const q of raw||[]){
  if(!q||q.status==='disabled'||q.status==='preview'||q.formal===false||q._repair)continue;
  if(!isId(q.id)||seen.has(q.id)){errors.push({code:'INVALID_OR_DUPLICATE_QUESTION_ID',questionId:q?.id||null});continue;}
  seen.add(q.id);
  if(!isId(q.subject)||!isId(q.topicId)||![7,8,9].includes(Number(q.year))){errors.push({code:'INVALID_QUESTION_METADATA',questionId:q.id});continue;}
  if(Number(q.year)===9&&!taught.has(q.topicId))continue;
  const roles=Array.isArray(q.roles)?q.roles:[];
  if(!roles.length)continue; // not certified for Daily V2 (never auto-upgrade ordinary bank)
  if(q.roles.includes('gcse') && (!isId(q.prompt)||![1,2,3].includes(Number(q.marks))||!q.markScheme)){
   errors.push({code:'GCSE_MISSING_MARK_SCHEME',questionId:q.id});continue;
  }
  questions.push({...q,year:Number(q.year),roles:[...new Set(roles)],_promptKey:plain([q.prompt,q.stimulus?.text||'',q.stimulus?.direction||'',q.stimulus?.imageId||''].join(' | '))});
 }
 return {questions,errors};
}
function groupByTopic(rows,minimum,day,exposure={}) {
 const groups=new Map();
 for(const q of rows){const key=q.subject+'|'+q.year+'|'+q.topicId; if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
 return [...groups].filter(([,items])=>items.length>=minimum)
   .sort((a,b)=>(Number(exposure[a[1][0].subject])||0)-(Number(exposure[b[1][0].subject])||0)
      ||stableHash(day+'|'+a[0])-stableHash(day+'|'+b[0])||a[0].localeCompare(b[0]));
}
function allocateQuotas(items,quotas,day) {
 const chosen=[],used=new Set();
 for(const [label,n] of Object.entries(quotas)){
  const pool=chooseUnique(items.filter(q=>!used.has(q.id) && (q.skill===label||q.depthBand===label)),n,day+'|'+label,chosen);
  if(pool.length!==n)return {ready:false,missing:{band:label,required:n,available:pool.length}};
  for(const q of pool){used.add(q.id);chosen.push(q);}
 }
 return {ready:true,chosen};
}
function redactQuestion(q) {
 return {questionId:q.id,conceptId:q.conceptId||null,subject:q.subject,year:q.year,topicId:q.topicId,role:q.roles.join(','),depthBand:q.depthBand||null,marks:q.roles.includes('gcse')?Number(q.marks):null,
  ...(typeof q.sourceFingerprint==='string'&&q.sourceFingerprint.trim()?{
   sourceFingerprint:q.sourceFingerprint}:{})};
}
function packageTask(task,questionRows,selectedTopic,extras={}) {
 return {id:task.id,kind:task.kind,target:task.target,subject:selectedTopic?.subject||task.subject||null,
  topicId:selectedTopic?.topicId||null, questions:questionRows.map(redactQuestion),
  questionIds:questionRows.map(q=>q.id),...extras};
}
/** Creates an all-or-nothing plan; blocked plans must never be used for live practice.
 * Question adapters are responsible for audited roles, depthBand, and taught-topic status.
 * Inputs from persistent history require persisted:true.
 */
export function planDailyV2(input={}) {
 const {day,questionBank=[],priorAttempts=[],taughtTopicIds=[],correctQuestionIds=[],
        masteryStages={},subjectExposure={},existingPlan=null}=input;
 if(!validDay(day))throw new Error('DailyV2: invalid plan date');
 if(existingPlan!==null){
  if(existingPlan.version!==2||existingPlan.day!==day||!['ready','partial'].includes(existingPlan.status)
     ||!Array.isArray(existingPlan.tasks)||
     (existingPlan.status==='ready'&&existingPlan.tasks.length!==DAILY_V2_TASKS.length)){
   throw new Error('DailyV2: invalid frozen plan');
  }
  return existingPlan; // never silently reroll an in-progress plan
 }
 const taught=new Set(taughtTopicIds);
 const {questions,errors}=normalizeQuestions(questionBank,day,taught);
 const catalogById=new Map(questions.map(q=>[q.id,q]));
 const past=priorAttempts.filter(a=>a?.persisted===true && isId(a.questionId) && validDay(a.day) && a.day<day);
 const previousCorrect=new Set([...correctQuestionIds,
  ...past.filter(a=>a.correct===true).map(a=>a.questionId)]);
 // Previously correct source wording cannot re-enter Standard, Mastery,
 // Year 9 or GCSE as "new" merely because someone renamed its question ID.
 // Vocab has its separately permitted concept-level spaced rotation, while
 // Retention is the explicit route for reviewing genuinely old questions.
 const previousCorrectPrompts=new Set(questions.filter(q=>previousCorrect.has(q.id))
  .map(q=>q._promptKey).filter(Boolean));
 const previousExamPrompts=new Set(questions.filter(q=>previousCorrect.has(q.id)&&q.roles.includes('gcse'))
  .map(q=>q._promptKey).filter(Boolean));
 const assigned=new Set(),assignedPrompts=new Set(),taskRows=[];
 const diagnostics=[...errors];const usedTopics=new Set();
 const allowed=q=>!assigned.has(q.id)&&!previousCorrect.has(q.id)&&
   (!q._promptKey||(!assignedPrompts.has(q._promptKey)&&
     !previousCorrectPrompts.has(q._promptKey)));
 const take=rows=>{for(const q of rows){assigned.add(q.id);if(q._promptKey)assignedPrompts.add(q._promptKey);}};
 const fail=(task,code,detail={})=>diagnostics.push({taskId:task.id,code,...detail});
 const get=type=>DAILY_V2_TASKS.find(t=>t.id===type);
 const taskById=new Map();

 // Reserve hardest-to-fill mastery topics first; new questions are never
 // replaced by a bank metadata count or by easy questions merely to fill 20.
 for(const task of DAILY_V2_TASKS.filter(t=>t.kind==='mastery')){
  const options=groupByTopic(questions.filter(q=>q.roles.includes('mastery')
     &&!q.roles.includes('gcse')&&allowed(q)&&!usedTopics.has(q.topicId)
     &&masteryStages[q.topicId]!=='mastered'),20,day,subjectExposure);
  let result=null,firstDeficiency=null;
  for(const [,items] of options) {
   const quota=allocateQuotas(items,QUOTAS.mastery,day+'|'+task.id);
   if(quota.ready){result={items:quota.chosen,topic:items[0]};break;}
   if(!firstDeficiency)firstDeficiency={topicId:items[0].topicId,...quota.missing};
  }
  if(!result){fail(task,'MASTERY_BANK_OR_DEPTH_SHORTAGE',{eligibleTopics:options.length,firstDeficiency});
    continue;}
  take(result.items);usedTopics.add(result.topic.topicId);
  taskById.set(task.id,packageTask(task,result.items,result.topic));
 }
 // GCSE is reserved before standard: distinct IDs AND distinct wording.
 const exam=get('gcse-exam-skills');
 const examQ=[];
 for(const marks of [1,2,3]){
  const candidates=questions.filter(q=>q.roles.includes('gcse') &&Number(q.marks)===marks &&
    allowed(q) && !previousExamPrompts.has(q._promptKey) &&
    !examQ.some(e=>e._promptKey&&e._promptKey===q._promptKey) &&
    !questions.some(e=>e.id!==q.id && !e.roles.includes('gcse') && e._promptKey && e._promptKey===q._promptKey));
  const found=choose(candidates,1,day+'|exam-'+marks)[0];
  if(found)examQ.push(found);else fail(exam,'EXCLUSIVE_EXAM_MARK_SHORTAGE',{marks});
 }
 if(examQ.length===3){take(examQ);taskById.set(exam.id,packageTask(exam,examQ,null,{marks:[1,2,3]}));}

 // Latin / French Standard mix grammar, translation and passage/writing
 // ACROSS taught topics. Forcing a single topic would make real language banks
 // unusable, since the three skill families often have separate topic IDs.
 // Science Standard instead selects one suitably stocked topic per day.
 for(const task of DAILY_V2_TASKS.filter(t=>t.kind==='standard')){
  if(task.id!=='science-standard'){
   const all=questions.filter(q=>q.roles.includes(task.id)&&!q.roles.includes('gcse')&&
      q.subject===task.subject&&allowed(q));
   const quota=allocateQuotas(all,QUOTAS[task.id],day+'|'+task.id);
   if(!quota.ready){fail(task,'STANDARD_BANK_OR_SKILL_SHORTAGE',{available:all.length,
      firstDeficiency:quota.missing});continue;}
   take(quota.chosen);
   taskById.set(task.id,packageTask(task,quota.chosen,null,{
    topicIds:[...new Set(quota.chosen.map(q=>q.topicId))]
   }));
   continue;
  }
  const options=groupByTopic(questions.filter(q=>q.roles.includes(task.id)&&
    !q.roles.includes('gcse')&&allowed(q)&&
    ['biology','chemistry','physics'].includes(q.subject)),task.target,day,subjectExposure);
  let best=null;
  for(const [,items] of options){
   const chosen=chooseUnique(items,task.target,day+'|'+task.id);
   if(chosen.length===task.target){best={items:chosen,topic:items[0]};break;}
  }
  if(!best){fail(task,'STANDARD_BANK_OR_SKILL_SHORTAGE',{eligibleTopics:options.length});continue;}
  take(best.items);taskById.set(task.id,packageTask(task,best.items,best.topic));
 }

 // Progressive Year 9: all questions from a taught Y9 topic, in skill order.
 const progressive=get('year9-progressive');
 const y9Options=groupByTopic(questions.filter(q=>q.year===9&&q.roles.includes('year9-progressive')&&!q.roles.includes('gcse')&&allowed(q)),20,day,subjectExposure);
 let y9Choice=null;
 for(const [,items] of y9Options){
  const quota=allocateQuotas(items,QUOTAS['year9-progressive'],day+'|year9');
  if(quota.ready){y9Choice={items:quota.chosen,topic:items[0]};break;}
 }
 if(y9Choice){
  const order={foundation:0,application:1,challenge:2};
  y9Choice.items.sort((a,b)=>order[a.depthBand]-order[b.depthBand]||a.id.localeCompare(b.id));
  take(y9Choice.items);
  taskById.set(progressive.id,packageTask(progressive,y9Choice.items,y9Choice.topic));
 }else fail(progressive,'YEAR9_PROGRESSIVE_BANK_OR_DEPTH_SHORTAGE',{eligibleTopics:y9Options.length});

 // Vocabulary cycles by *concept*, never by question direction. Least-seen
 // concepts are selected first. Earlier fully exhausted cycles repeat.
 for(const task of DAILY_V2_TASKS.filter(t=>t.kind==='vocab')){
  const known=new Map();
  for(const a of past){
   if(a.taskId!==task.id||a.correct!==true||!isId(a.conceptId))continue;
   const token=a.conceptId+'|'+a.day;
   known.set(token,true);
  }
  const count=new Map();
  for(const pair of known.keys()){const concept=pair.slice(0,pair.lastIndexOf('|'));count.set(concept,(count.get(concept)||0)+1);}
  const creditedToday=new Set(priorAttempts.filter(a=>a?.persisted===true&&a.day===day&&a.taskId===task.id&&a.correct===true).map(a=>a.conceptId));
  // A correct lexical concept cannot reappear the very next day, even
  // as a reverse-direction question or a different source question ID.
  // If there are no other qualified concepts, block rather than pad 30.
  const yesterdayCorrect=new Set(past.filter(a=>a.taskId===task.id&&
    a.correct===true&&isId(a.conceptId)&&daySpan(day,a.day)===1)
    .map(a=>a.conceptId));
  const vocabQ=questions.filter(q=>q.roles.includes(task.id)&&!q.roles.includes('gcse')&&q.subject===task.subject&&!assigned.has(q.id));
  const chosen=[];const conceptUse=new Set();
  // Only independently verified *taught* Year 9 questions survive
  // normalizeQuestions. Take up to five taught Y9 concepts, then fill the
  // remaining slots with Y7-8. A missing/partially taught Y9 bank must never
  // turn a well-stocked Y7-8 vocab task into a false no-questions result.
  // Y9 is selected first so its wording cannot collide with later Y7-8 picks.
  for(const year of [9,8]){
   const quota=year===9?5:30-chosen.length;
   if(quota===0)continue;
   const groups=new Map();
   for(const q of vocabQ){
    if(!isId(q.conceptId)||creditedToday.has(q.conceptId)||
       yesterdayCorrect.has(q.conceptId)||
       (year===8?q.year===9:q.year!==9))continue;
    if(!groups.has(q.conceptId))groups.set(q.conceptId,[]);
    groups.get(q.conceptId).push(q);
   }
   const concepts=[...groups.keys()].filter(x=>!conceptUse.has(x)).sort((a,b)=>
     (count.get(a)||0)-(count.get(b)||0)||stableHash(day+'|'+a)-stableHash(day+'|'+b)||a.localeCompare(b));
   // A colliding concept is not a shortage if another independently
   // creditable concept or an alternative direction is available.
   let filled=0,collisions=0;
   for(const concept of concepts){
    if(filled===quota)break;
    const variant=choose(groups.get(concept).filter(q=>!assigned.has(q.id)&&
       (!q._promptKey||(!assignedPrompts.has(q._promptKey)&&
       !chosen.some(c=>c._promptKey&&c._promptKey===q._promptKey)))),1,day+'|'+concept)[0];
    if(!variant){collisions++;continue;}
    conceptUse.add(concept);chosen.push(variant);filled++;
   }
   if(year===8&&filled<quota){
    if(concepts.length<quota)fail(task,'VOCAB_CONCEPT_SHORTAGE',{year,needed:quota,available:concepts.length});
    if(collisions>0)fail(task,'VOCAB_VARIANT_COLLISION',{year,needed:quota,filled,collisions});
   }
  }
  if(chosen.length<30&&yesterdayCorrect.size>0)
   fail(task,'VOCAB_SPACING_CAPACITY_SHORTAGE',{required:30,available:chosen.length,
     yesterdayCorrectConcepts:yesterdayCorrect.size});
  if(chosen.length===30){take(chosen);taskById.set(task.id,packageTask(task,chosen,null,{
   year7to8:chosen.filter(q=>q.year!==9).length,year9:chosen.filter(q=>q.year===9).length
  }));}
 }

 // Historical retrieval: only actual persisted prior question identities.
 // GCSE's exclusivity is lifelong, not merely same-day.
 const retention=get('spaced-retention');
 const last=new Map(),lastConceptDay=new Map();
 const conceptScope=(q,conceptId)=>q.subject+'|'+conceptId;
 for(const a of past){
  const source=catalogById.get(a.questionId);
  if(!source)continue;
  const old=last.get(a.questionId);
  if(!old||old.day<a.day)last.set(a.questionId,a);
  // A reverse translation may have a different question ID while testing
  // exactly the same lexical concept. Use the most recent persisted date
  // for the concept, scoped to its language, not the oldest source ID.
  // The certified source question is authoritative for its concept ID.
  // Some older persisted attempts lack a conceptId even though their
  // question ID unambiguously identifies one in the audited bank.
  const eventConcept=isId(source.conceptId)?source.conceptId:a.conceptId;
  if(isId(eventConcept)){
   const key=conceptScope(source,eventConcept);
   const previous=lastConceptDay.get(key);
   if(!previous||previous<a.day)lastConceptDay.set(key,a.day);
  }
 }
 // A historical question is not necessarily due for spaced retention.
 // Require at least a two-day gap since the LAST attempt to the question
 // and (where identified) the same concept under any alternate question ID.
 const seenRetention=[...last.values()].map(a=>({entry:a,question:catalogById.get(a.questionId)}))
  .filter(({entry,question})=>daySpan(day,entry.day)>=2&&
    question && (!isId(question.conceptId)||
      daySpan(day,lastConceptDay.get(conceptScope(question,question.conceptId))||entry.day)>=2)&&
    !question.roles.includes('gcse')&&!assigned.has(question.id) &&
    (!question._promptKey||!assignedPrompts.has(question._promptKey)));
 const dueScore=row=>{
  const gap=daySpan(day,row.entry.day);
  return gap>=7?0:gap>=2?1:2;
 };
 seenRetention.sort((a,b)=>
  dueScore(a)-dueScore(b)||(a.entry.correct===false?-1:0)-(b.entry.correct===false?-1:0)
  ||daySpan(day,b.entry.day)-daySpan(day,a.entry.day)||a.question.id.localeCompare(b.question.id));
 const reviewItems=[];
 const reviewPrompts=new Set(),reviewConcepts=new Set();
 for(const {question} of seenRetention){
  if(question._promptKey&&reviewPrompts.has(question._promptKey))continue;
  const concept=isId(question.conceptId)?conceptScope(question,question.conceptId):null;
  if(concept&&reviewConcepts.has(concept))continue;
  reviewItems.push(question);
  if(question._promptKey)reviewPrompts.add(question._promptKey);
  if(concept)reviewConcepts.add(concept);
  if(reviewItems.length===10)break;
 }
 if(reviewItems.length!==10)fail(retention,'INSUFFICIENT_PERSISTED_HISTORY',{available:reviewItems.length,needed:10});
 else{take(reviewItems);taskById.set(retention.id,packageTask(retention,reviewItems,null,{historicalOnly:true}));}

 const finalTasks=DAILY_V2_TASKS.map(t=>taskById.get(t.id)).filter(Boolean);
 const countsValid=finalTasks.every(t=>t.questionIds.length===t.target);
 if(!countsValid)diagnostics.push({code:'PLAN_INVARIANT_FAILURE'});
 const blocked=diagnostics.length>0||finalTasks.length!==10||!countsValid;
 // On shortage, keep the existing strict public contract: tasks=[] and
 // status=blocked. A separate opt-in STAGING continuity layer can inspect
 // safe complete task candidates without pretending 163/163 is available.
 const globalErrors=diagnostics.filter(d=>!d.taskId);
 const safeCandidates=blocked&&globalErrors.length===0&&countsValid?finalTasks:[];
 const candidatesById=new Map(safeCandidates.map(t=>[t.id,t]));
 const availability=DAILY_V2_TASKS.map(t=>({
   taskId:t.id,target:t.target,
   state:candidatesById.has(t.id)?'available':blocked?'unavailable':'available',
   reasonCodes:diagnostics.filter(d=>d.taskId===t.id).map(d=>d.code)
 }));
 return {version:2,day,status:blocked?'blocked':'ready',target:163,
  tasks:blocked?[]:finalTasks,
  // Diagnostic candidates are never directly publishable or persistent.
  eligibleTasks:blocked?safeCandidates:[],
  availability,diagnostics,preflight:{
    validatedQuestions:questions.length,
    plannedQuestions:blocked?0:finalTasks.reduce((n,t)=>n+t.questions.length,0),
    eligibleQuestionCount:safeCandidates.reduce((n,t)=>n+t.questions.length,0),
    globallyUnsafe:globalErrors.length>0,
    taskCount:blocked?0:finalTasks.length,
    unpublished:blocked
  }};
}
