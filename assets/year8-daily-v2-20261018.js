import {curriculumTopics,curriculumHref} from './daily-curriculum-20261004.js';
import {coveredTopic,masteryStage} from './mastery-v2-20261018.js';
import {dailyVocabTotal} from './daily-vocab-total-20261020.js?v=20261023-final-credit1';

const rotation = ['physics','chemistry','biology','french'];
const subjects = ['latin','french','biology','chemistry','physics'];
const balancedTaskIds = new Set(['y8-standard-a','y8-standard-b','y8-mastery-a','y8-mastery-b','y8-mastery-topup-a','y8-mastery-topup-b','year9-light']);
const label = {latin:'Latin',french:'French',biology:'Biology',chemistry:'Chemistry',physics:'Physics'};
const dayNumber = day => Math.floor((Date.parse(day+'T12:00:00Z')-Date.parse('2026-10-19T12:00:00Z'))/86400000);

// Subject balance looks back six days; preserve the logged assignments
// untouched. Vocabulary and compulsory Latin never count against the quota.
function recentSubjectExposure(state,today){
  const blank=()=>Object.fromEntries(subjects.map(s=>[s,0]));
  const counts={flex:blank(),standard:blank(),mastery:blank(),year9:blank()};
  const current=dayNumber(today);
  for(const [date,row] of Object.entries(state.dailyLog||{})){
    const age=current-dayNumber(date);
    if(!Number.isFinite(age)||age<1||age>6)continue;
    for(const task of row?.tasks||[]){
      if(!balancedTaskIds.has(task?.id))continue;
      const subject=task.assignedSubject||(typeof task.href==='string'?task.href.split('/')[2]:null);
      if(!subjects.includes(subject))continue;
      counts.flex[subject]++;
      const slot=task.id.startsWith('y8-standard-')?'standard':
        task.id.startsWith('y8-mastery-')?'mastery':'year9';
      counts[slot][subject]++;
    }
  }
  return counts;
}
// Stable tie-break by calendar date, with no randomness or persisted counters.
function cyclicRank(subject,order,today){
  const i=order.indexOf(subject);
  return i<0?order.length:
    (i-((dayNumber(today)%order.length)+order.length)%order.length+order.length)%order.length;
}
function balancedCompare(a,b,primary,secondary,order,today){
  return (primary[a.subject]||0)-(primary[b.subject]||0)||
    (secondary[a.subject]||0)-(secondary[b.subject]||0)||
    cyclicRank(a.subject,order,today)-cyclicRank(b.subject,order,today);
}

// Ten assignments, normally 165 answers: 60 vocab, 10 Latin, 20 Standard,
// two separate 20-question Mastery sets, 10 weakness, 10 due, 15 Year 9.
// Day 2/7 retention stays in Due Review; it never replaces daily Mastery A/B.
// On an existing in-flight date, preserve the originally scored five-question
// recall as a separate task and ADD a make-up 20-question Mastery assignment.
// Never turn five marked answers into a fake 20/20, or overwrite their receipt.
// October 23 was an IN-PROGRESS Daily day when its assignments were
// unintentionally regenerated. The student's before/after iPad screenshots
// independently establish these exact same-day task receipts. Restore only
// this one proven record, NOT historical question attempts or Mastered status.
// All new plans, beginning October 24, continue with two full Mastery 20 sets.
const OCT23_RESTORED_TASKS = [
  ['latin-standard','latin',8,'la-y8-stage-1-vocabulary','standard',10,10,false],
  ['y8-standard-a','biology',8,'bio-y8-food-tests','standard',10,10,false],
  ['y8-standard-b','biology',8,'bio-y8-digestion-absorption','standard',10,10,false],
  ['y8-mastery-a','latin',8,'la-y8-miscellaneous-words','due',5,5,true],
  ['y8-mastery-b','french',8,'fr-y8-s12-ks3-extension-irregular-verbs','mastery',20,20,false],
  ['weakness-review','latin',8,'la-y8-core-verbs','weak',10,10,false],
  ['due-review','latin',8,'la-y8-preposition-dictionary-entries','due',5,5,true],
  ['year9-light','french',9,'fr-y9-u1-paris-travel','standard',15,15,false]
];
function restoreVerifiedOct23Daily(state,getCatalog){
  const date='2026-10-23';
  const rows=[...(Array.isArray(state.daily)?state.daily:[]),
    ...(state.dailyLog?.[date]?.tasks||[])];
  const has=(id,min)=>rows.some(t=>t?.id===id&&Number(t.progress||0)>=min);
  // Limit the repair to the photographed, substantially completed plan.
  // Never give another device a completion from a calendar date alone.
  if(!has('french-vocab',29)||!has('latin-standard',10)||
     !has('y8-standard-a',10)||!has('y8-standard-b',10)||
     !has('y8-mastery-b',20))return null;
  const byId=new Map((state.daily||[]).filter(t=>t.planDate===date).map(t=>[t.id,t]));
  const logged=state.dailyLog?.[date]?.tasks||[];
  const linked=(id,topic)=>[byId.get(id),...logged.filter(t=>t.id===id)]
    .filter(t=>t?.assignedTopic===topic);
  const vocab=subject=>{
    const id=subject+'-vocab',old=byId.get(id);
    const proven=subject==='french'?29:0;
    const count=Math.min(30,Math.max(proven,Number(dailyVocabTotal(state,subject,date).progress)||0,
      ...[old,...logged.filter(t=>t.id===id)].map(t=>Number(t?.progress)||0)));
    return {...old,id,title:label[subject]+' Vocab',
      detail:'30 vocabulary words: 27 Year 7–8 + 3 Year 9; no sentences.',
      href:`/study/${subject}/practise?daily=1&locked=1&year=8&mode=y8vocab&task=${id}`,
      target:30,progress:count,xp:15,requiredCorrect:30,planDate:date};
  };
  const restored=OCT23_RESTORED_TASKS.map(([id,subject,year,topicId,mode,target,receipt,masteryCheck])=>{
    const row=(getCatalog(subject,year)||[]).find(t=>t.topicId===topicId);
    const title=label[subject]+' · '+(row?.title||topicId);
    const matches=linked(id,topicId);
    const progress=Math.min(target,Math.max(receipt,...matches.map(t=>Number(t.progress)||0)));
    return {id,title,detail:'23 October · original completed Daily assignment',
      href:curriculumHref({subject,year,topicId},mode,id),target,progress,
      xp:mode==='mastery'?20:15,planDate:date,assignedSubject:subject,
      assignedTopic:topicId,assignedYear:year,assignedLabel:row?.title||topicId,
      masteryCheck,curriculumVersion:4,restoredOriginalDaily:true};
  });
  return [vocab('latin'),vocab('french'),...restored];
}
export function buildYear8DailyV2(state,getCatalog,learning={}) {
  // Only Oct 23's already-proven receipts are frozen. Future dates always
  // follow the normal 20+20 Mastery policy, with retention kept separately.
  if(state.today==='2026-10-23'){
    const restored=restoreVerifiedOct23Daily(state,getCatalog);
    if(restored)return restored;
  }
  const today=state.today, previous=new Map((state.daily||[]).filter(t=>t.planDate===today).map(t=>[t.id,t]));
  const pools=Object.fromEntries(['latin',...rotation].map(subject=>[subject,curriculumTopics(subject,8,getCatalog,learning)]));
  const exposure=recentSubjectExposure(state,today);
  const active=rotation.filter(subject=>pools[subject].some(t=>!coveredTopic(state,t.topicId)));
  const available=active.length?active:rotation.filter(subject=>
    pools[subject].some(t=>masteryStage(state.topicStats?.[t.topicId])!=='mastered'));
  const candidates=available.length?available:rotation.filter(subject=>pools[subject].length);
  const subject=[...candidates].sort((a,b)=>
    (exposure.standard[a]||0)-(exposure.standard[b]||0)||
    cyclicRank(a,rotation,today)-cyclicRank(b,rotation,today))[0];
  const assigned=new Set();
  const entries=(state.formalAttemptLog||[]).filter(e=>e.day===today&&!e.repair&&e.formal!==false&&!e.recoveryFor&&!e.dailyVocab);
  // One marked answer belongs to its opened assignment. Two tasks may visit
  // the same topic, but cannot both claim that answer toward the 155 total.
  const tally=(topicId,taskId,modes=null)=>new Set(entries.filter(e=>e.topicId===topicId&&e.dailyTaskId===taskId&&
    (!modes||modes.includes(e.mode))).map(e=>e.attemptId||e.questionId)).size;
  const pick=(id,pool,condition,compare)=>{
    const old=previous.get(id);
    const frozen=old?.assignedTopic&&(pool.find(t=>t.topicId===old.assignedTopic)||
      {topicId:old.assignedTopic,topicLabel:old.assignedLabel,subject:old.assignedSubject,year:old.assignedYear||8});
    const eligible=pool.filter(t=>!assigned.has(t.topicId)&&condition(t));
    const choice=frozen||(compare?[...eligible].sort(compare)[0]:eligible[0])||
      pool.find(t=>!assigned.has(t.topicId))||pool[0];
    if(choice)assigned.add(choice.topicId);
    return choice;
  };
  const savedMode=t=>{try{return new URL(t?.href,'https://scholar.invalid').searchParams.get('mode')}catch{return null}};
  const task=(id,topic,mode,target,description,masteryCheck=false)=>{
    const old=previous.get(id);
    const same=!!topic&&old?.assignedTopic===topic.topicId;
    // Repair a saved pre-fix route. "retention" was not a recognised
    // practice mode, so its recorded answers cannot prove the Day 2/7 check.
    const legacyRecall=same&&savedMode(old)==='retention';
    if(same&&old?.href){
      mode=legacyRecall?'due':savedMode(old)||mode;
      // Upgrade an unopened legacy 15-question assignment to 20.
      // Retain the original 15 for a set with actual marked evidence.
      const existingAnswers=tally(topic.topicId,id,['mastery','year8long']);
      const untouchedMastery=id.startsWith('y8-mastery-')&&
        savedMode(old)==='mastery'&&Number(old.target)===15&&
        Number(old.progress||0)===0&&existingAnswers===0;
      target=legacyRecall?5:untouchedMastery?20:Number(old.target)||target;
      masteryCheck=legacyRecall||old.masteryCheck===true;
    }
    const modes=mode==='mastery'?['mastery','year8long']:mode==='retention'?['retention','due']:
      mode==='due'?['due','retention']:mode==='weak'?['weak']:null;
    let progress=topic?Math.min(target,Math.max(same&&!legacyRecall?Number(old.progress)||0:0,tally(topic.topicId,id,modes))):0;
    // 20 marked answers are 20/20. Keep the independent Mastery pass
    // decision and Day 2/7 review stage separate from task completion.
    const passedToday=state.topicStats?.[topic?.topicId]?.masteryV2?.passedMasteryAt===today;
    const outcome=id.startsWith('y8-mastery-')&&mode==='mastery'&&progress>=target
      ? (passedToday?' · Mastery pass; Day 2/7 recall next':' · 20 answered; Mastery standard not yet passed')
      : '';
    const fullMastery=id.startsWith('y8-mastery-')&&mode==='mastery';
    const recallInOldMastery=id.startsWith('y8-mastery-')&&masteryCheck&&mode==='due';
    const displaySubject=label[topic?.subject]||'Year 8';
    const displayTopic=topic?.topicLabel||description;
    const displaySlot=id.endsWith('-b')?'B':'A';
    const title=fullMastery?`Mastery ${displaySlot} · ${displaySubject} · ${displayTopic}`:
      recallInOldMastery?`Day 2/7 recall · ${displaySubject} · ${displayTopic}`:
      `${displaySubject} · ${displayTopic}`;
    return {id,title,
      detail:description+outcome,href:topic?curriculumHref(topic,mode,id):'/study',target,progress,xp:mode==='mastery'?20:15,
      planDate:today,assignedSubject:topic?.subject||null,assignedTopic:topic?.topicId||null,
      assignedYear:topic?.year||8,assignedLabel:topic?.topicLabel||null,masteryCheck,curriculumVersion:4};
  };
  const pendingRecall=t=>['check2','check7'].includes(
    state.topicStats?.[t.topicId]?.masteryV2?.stage);
  // Reserve every in-progress recall topic for its five-question due date.
  const latin=pick('latin-standard',pools.latin.filter(t=>!pendingRecall(t)),
    t=>!coveredTopic(state,t.topicId));
  const standardPool=(pools[subject]||[]).filter(t=>!pendingRecall(t));
  const standards=['y8-standard-a','y8-standard-b'].map(id=>{
    const topic=pick(id,standardPool,t=>!coveredTopic(state,t.topicId));
    if(topic?.subject){exposure.standard[topic.subject]++;exposure.flex[topic.subject]++;}
    return topic;
  });
  const allTopics=['latin',...rotation].flatMap(s=>pools[s]);
  const dueMastery=allTopics.filter(t=>{
    const m=state.topicStats?.[t.topicId]?.masteryV2;
    return ['check2','check7'].includes(m?.stage)&&m.due&&m.due<=today;
  }).sort((a,b)=>String(state.topicStats[a.topicId].masteryV2.due)
    .localeCompare(String(state.topicStats[b.topicId].masteryV2.due))||
    (state.topicStats[a.topicId].masteryV2.stage==='check7'?-1:1));
  const generalDue=allTopics.filter(t=>Object.values(state.reviews||{}).some(r=>
    r?.topicId===t.topicId&&r?.due&&r.due<=today));
  const due=pick('due-review',dueMastery.length?dueMastery:generalDue.length?generalDue:allTopics.filter(t=>!pendingRecall(t)),()=>true);
  const oldDue=previous.get('due-review');
  const dueCheck=oldDue?.assignedTopic?oldDue.masteryCheck===true:
    dueMastery.some(t=>t.topicId===due?.topicId);
  const dueMode=(oldDue?.assignedTopic?savedMode(oldDue):null)||
    (dueCheck?'due':generalDue.length?'due':'weak');
  // Never reassign a pending Day 2/7 topic to a new 15-question gate.
  const learningTopics=allTopics.filter(t=>
    ['learning','needs-reinforcement'].includes(masteryStage(state.topicStats?.[t.topicId])));
  // A 20-question formal Mastery needs at least 20 enabled questions.
  // Some shorter Year 8 Biology banks remain available for Standard/review.
  const masteryEligible=learningTopics.filter(t=>Number(t.enabled??t.questions??0)>=20);
  const covered=masteryEligible.filter(t=>coveredTopic(state,t.topicId))
    .sort((a,b)=>(Number(state.topicStats?.[a.topicId]?.attempted)||0)-
      (Number(state.topicStats?.[b.topicId]?.attempted)||0));
  const masteryPool=covered.length?covered:masteryEligible;
  const mastery=['y8-mastery-a','y8-mastery-b'].map(id=>{
    const old=previous.get(id);
    const oldMode=savedMode(old);
    const oldRecall=!!old?.assignedTopic&&
      (old.masteryCheck===true||['due','retention'].includes(oldMode));
    const recallStarted=oldRecall&&(
      Number(old.progress||0)>0||
      tally(old.assignedTopic,id,['due','retention'])>0);
    // Earlier planners spent Mastery slots on five-question recall checks.
    // Replace an unopened legacy check with a new full Mastery assignment;
    // keep an already-answered check intact until the next date.
    if(oldRecall&&!recallStarted)previous.delete(id);
    const retained=previous.get(id);
    const topic=pick(id,recallStarted?[...masteryPool,...dueMastery]:masteryPool,
      t=>!assigned.has(t.topicId),(a,b)=>
        balancedCompare(a,b,exposure.flex,exposure.mastery,subjects,today));
    if(topic?.subject){exposure.mastery[topic.subject]++;exposure.flex[topic.subject]++;}
    return {topic,mode:recallStarted?'due':retained?.assignedTopic?(savedMode(retained)||'mastery'):'mastery',
      check:!!recallStarted};
  });
  // An older device may have already completed a five-question check under
  // y8-mastery-a/b. It MUST still see two real 20-question Mastery sets TODAY.
  // Do not reuse the saved ID: date-ledger merging would falsely turn 5/5
  // into 20/20. The compensating slot has its own durable task identity.
  const makeUpMastery=mastery.flatMap((m,i)=>{
    if(!m.check)return [];
    const id='y8-mastery-topup-'+('ab'[i]);
    const chosen=pick(id,masteryPool,t=>!assigned.has(t.topicId),(a,b)=>
      balancedCompare(a,b,exposure.flex,exposure.mastery,subjects,today));
    if(chosen?.subject){exposure.mastery[chosen.subject]++;exposure.flex[chosen.subject]++;}
    return [task(id,chosen,'mastery',20,'Year 8 Mastery · 20 new questions; previous five-question recall remains recorded')];
  });
  const weak=pick('weakness-review',learningTopics.length?learningTopics:allTopics,
    t=>Number(state.topicStats?.[t.topicId]?.accuracy||0)<.85);
  const taught=['latin','french','chemistry','biology','physics'].flatMap(s=>(getCatalog(s,9)||[])
    .filter(t=>t?.status==='enabled'&&Number(t.enabled??t.questions??0)>=15)
    .map(t=>({...t,subject:s,year:9,topicLabel:t.title||t.topicId})));
  const unmasteredY9=taught.filter(t=>masteryStage(state.topicStats?.[t.topicId])!=='mastered');
  const year9Pool=unmasteredY9.length?unmasteredY9:taught;
  const year9=pick('year9-light',year9Pool,t=>!coveredTopic(state,t.topicId),(a,b)=>
    balancedCompare(a,b,exposure.year9,exposure.flex,subjects,today));
  const vocab=s=>{
    const old=previous.get(s+'-vocab')||state.daily?.find(t=>t.id===s+'-vocab');
    // The 2026-10-19 home task used to read ONLY the new ledger, so an
    // older iPad session's valid formal journal was ignored (e.g. 13/30).
    const total=dailyVocabTotal(state,s,today);
    const correct=total.correct;
    return {...old,id:s+'-vocab',title:`${label[s]} Vocab`,detail:'30 vocabulary words: 27 Year 7–8 (including review) + 3 Year 9; no sentences.',
      href:`/study/${s}/practise?daily=1&locked=1&year=8&mode=y8vocab&task=${s}-vocab`,
      target:30,progress:total.progress,
      xp:15,requiredCorrect:30,planDate:today};
  };
  return [vocab('latin'),vocab('french'),task('latin-standard',latin,'standard',10,'Daily Latin Standard 10'),
    ...standards.map((t,i)=>task('y8-standard-'+('ab'[i]),t,'standard',10,'Year 8 Standard 10 · topic '+(i+1)+' of 2')),
    ...mastery.map((m,i)=>task('y8-mastery-'+('ab'[i]),m.topic,m.mode,m.check?5:20,m.check?'Year 8 Day 2/7 recall · five questions':'Year 8 Mastery · 17/20 including three independent answers',m.check)),
    ...makeUpMastery,
    task('weakness-review',weak,'weak',10,'Repair weak concepts'),
    task('due-review',due,dueMode,dueCheck?5:10,dueCheck?'Year 8 Day 2/7 recall · five questions':dueMode==='weak'?'Consolidation · nothing due today':'Due review',dueCheck),
    task('year9-light',year9,'standard',15,'Year 9 · light daily study')];
}
