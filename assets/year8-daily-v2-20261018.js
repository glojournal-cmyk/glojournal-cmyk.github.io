import {curriculumTopics,curriculumHref} from './daily-curriculum-20261004.js';
import {coveredTopic,masteryStage} from './mastery-v2-20261018.js';

const rotation = ['physics','chemistry','biology','french'];
const label = {latin:'Latin',french:'French',biology:'Biology',chemistry:'Chemistry',physics:'Physics'};
const dayNumber = day => Math.floor((Date.parse(day+'T12:00:00Z')-Date.parse('2026-10-19T12:00:00Z'))/86400000);

// Ten assignments, 155 answers: 60 vocab, 10 Latin, 20 Standard, 30
// Mastery, 10 weakness, 10 due, 15 Year 9. A completed assignment is frozen.
export function buildYear8DailyV2(state,getCatalog,learning={}) {
  const today=state.today, previous=new Map((state.daily||[]).filter(t=>t.planDate===today).map(t=>[t.id,t]));
  const pools=Object.fromEntries(['latin',...rotation].map(subject=>[subject,curriculumTopics(subject,8,getCatalog,learning)]));
  const active=rotation.filter(subject=>pools[subject].some(t=>!coveredTopic(state,t.topicId)));
  const subject=active[Math.abs(dayNumber(today))%active.length]||rotation[Math.abs(dayNumber(today))%rotation.length];
  const assigned=new Set();
  const entries=(state.formalAttemptLog||[]).filter(e=>e.day===today&&!e.repair&&e.formal!==false&&!e.recoveryFor&&!e.dailyVocab);
  // One marked answer belongs to its opened assignment. Two tasks may visit
  // the same topic, but cannot both claim that answer toward the 155 total.
  const tally=(topicId,taskId,modes=null)=>new Set(entries.filter(e=>e.topicId===topicId&&e.dailyTaskId===taskId&&
    (!modes||modes.includes(e.mode))).map(e=>e.attemptId||e.questionId)).size;
  const pick=(id,pool,condition)=>{
    const old=previous.get(id);
    const frozen=old?.assignedTopic&&(pool.find(t=>t.topicId===old.assignedTopic)||
      {topicId:old.assignedTopic,topicLabel:old.assignedLabel,subject:old.assignedSubject,year:old.assignedYear||8});
    const choice=frozen||pool.find(t=>!assigned.has(t.topicId)&&condition(t))||pool.find(t=>!assigned.has(t.topicId))||pool[0];
    if(choice)assigned.add(choice.topicId);
    return choice;
  };
  const task=(id,topic,mode,target,description)=>{
    const old=previous.get(id);
    const same=old?.assignedTopic===topic?.topicId;
    const modes=mode==='mastery'?['mastery','year8long']:mode==='retention'?['retention','due']:
      mode==='due'?['due','retention']:mode==='weak'?['weak']:null;
    const progress=topic?Math.min(target,Math.max(same?Number(old.progress)||0:0,tally(topic.topicId,id,modes))):0;
    return {id,title:`${label[topic?.subject]||'Year 8'} · ${topic?.topicLabel||description}`,
      detail:description,href:topic?curriculumHref(topic,mode,id):'/study',target,progress,xp:mode==='mastery'?20:15,
      planDate:today,assignedSubject:topic?.subject||null,assignedTopic:topic?.topicId||null,
      assignedYear:topic?.year||8,assignedLabel:topic?.topicLabel||null,curriculumVersion:3};
  };
  const latin=pick('latin-standard',pools.latin,t=>!coveredTopic(state,t.topicId));
  const standards=['y8-standard-a','y8-standard-b'].map(id=>pick(id,pools[subject],t=>!coveredTopic(state,t.topicId)));
  const allTopics=['latin',...rotation].flatMap(s=>pools[s]);
  const covered=allTopics.filter(t=>coveredTopic(state,t.topicId)&&masteryStage(state.topicStats?.[t.topicId])!=='mastered')
    .sort((a,b)=>(Number(state.topicStats?.[a.topicId]?.attempted)||0)-(Number(state.topicStats?.[b.topicId]?.attempted)||0));
  const masteryPool=covered.length?covered:allTopics;
  const mastery=['y8-mastery-a','y8-mastery-b'].map(id=>pick(id,masteryPool,t=>!assigned.has(t.topicId)));
  const weak=pick('weakness-review',masteryPool,t=>Number(state.topicStats?.[t.topicId]?.accuracy||0)<.85);
  const dueTopic=allTopics.find(t=>
    state.topicStats?.[t.topicId]?.masteryV2?.due<=today &&
    ['check2','check7'].includes(state.topicStats[t.topicId].masteryV2.stage));
  const dueCandidates=dueTopic?[dueTopic]:allTopics.filter(t=>Object.values(state.reviews||{}).some(r=>
    r?.topicId===t.topicId&&r?.due&&r.due<=today));
  const due=pick('due-review',dueCandidates.length?dueCandidates:masteryPool,t=>true);
  const dueMode=dueTopic?'retention':dueCandidates.length?'due':'weak';
  const taught=['latin','french','chemistry','biology','physics'].flatMap(s=>(getCatalog(s,9)||[])
    .filter(t=>t?.status==='enabled'&&Number(t.enabled??t.questions??0)>=15)
    .map(t=>({...t,subject:s,year:9,topicLabel:t.title||t.topicId})));
  const year9=pick('year9-light',taught,t=>!coveredTopic(state,t.topicId));
  const vocab=s=>{
    const old=previous.get(s+'-vocab')||state.daily?.find(t=>t.id===s+'-vocab');
    const proof=state.dailyVocabByDay?.[today]?.[s]?.items||{};
    const correct=Object.values(proof).filter(Boolean).length;
    return {...old,id:s+'-vocab',title:`Year 7–8 ${label[s]} vocab`,detail:'30 correct words; due mistakes then new words.',
      href:`/study/${s}/practise?daily=1&locked=1&year=8&mode=y8vocab&task=${s}-vocab`,
      target:30,progress:Math.min(30,Math.max(correct,old?.planDate===today?Number(old.progress)||0:0)),
      xp:15,requiredCorrect:30,planDate:today};
  };
  return [vocab('latin'),vocab('french'),task('latin-standard',latin,'standard',10,'Daily Latin Standard 10'),
    ...standards.map((t,i)=>task('y8-standard-'+('ab'[i]),t,'standard',10,'Year 8 Standard 10 · topic '+(i+1)+' of 2')),
    ...mastery.map((t,i)=>task('y8-mastery-'+('ab'[i]),t,'mastery',15,'Year 8 Mastery 15 · topic '+(i+1)+' of 2')),
    task('weakness-review',weak,'weak',10,'Repair weak concepts'),
    task('due-review',due,dueMode,10,dueMode==='weak'?'Consolidation · nothing due today':'Due review and 2/7-day retention'),
    task('year9-light',year9,'standard',15,'Year 9 · light daily study')];
}
