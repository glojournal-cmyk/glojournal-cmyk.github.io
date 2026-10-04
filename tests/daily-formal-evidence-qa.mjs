import {creditCurriculumAttempt} from "../assets/daily-curriculum-20261004.js";
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
const day='2026-09-30',topic='fr-y8-s24-numbers-and-age';
let state={today:day,year:8,topicStats:{},reviews:{},daily:[],questionsToday:0};
const context=vm.createContext({
  creditCurriculumAttempt,
  todayKey:()=>day,inferSubjectFromTopic:()=> 'french',
  store:{getState:()=>state,setState:patch=>{state={...state,...patch};}},
  originalRecordAttempt(id,correct,subject,meta){state={...state,questionsToday:state.questionsToday+(!meta.repair&&meta.formal!==false&&!meta.excludeGeneralDaily?1:0),reviews:{...state.reviews,[id]:{last:day,due:'2026-10-02'}}};},
  inferAttemptMeta:(_id,subject,meta)=>({...meta,topicId:meta.topicId||topic,subject,topicTitle:'Numbers and age',skills:[]}),
  isIndependentProduction:()=>true,
  normalizeTopicStat:raw=>({attempted:0,correct:0,productionAttempted:0,productionIds:[],errors:{},errorTypes:{},recentOutcomes:[],state:'learning',...raw}),
  topicState:()=> 'learning',diagnoseError:()=>null,
  applyFormalSkillAttempt:s=>s,appendLearningEvents:e=>e,
  topicTitle:()=> 'Numbers and age',normalizeState(){},recordDailyVocabAttempt(){},
  shiftDay:()=> '2026-10-02',awardFirstTopicMastery(){throw Error('Unexpected mastery');},awardMasteryRetention(){throw Error('Unexpected retention award');},
});
vm.runInContext(fs.readFileSync('assets/weekly-evidence-20261004.js','utf8'),context);
for(const [start,end] of [['function focusAttemptsToday(','const DAILY_VOCAB_TARGET'],['function topicAttemptsToday(','function year8ReviewPlan('],['function patchedRecordAttempt(','function recordDailyVocabAttempt(']]){
  const from=src.indexOf(start),to=src.indexOf(end,from);assert.ok(from>=0&&to>from);vm.runInContext(src.slice(from,to),context);
}
const focus={subject:'french',topicId:topic};
context.patchedRecordAttempt('q1',false,'french',{topicId:topic});
assert.equal(context.focusAttemptsToday(state,focus),1);
assert.equal(context.topicAttemptsToday(state,topic),1);
assert.equal(state.questionsToday,1);
context.patchedRecordAttempt('repair-q1',true,'french',{topicId:topic,repair:true,repairOf:'q1'});
assert.equal(context.focusAttemptsToday(state,focus),1,'Repair cannot advance adaptive focus');
assert.equal(context.topicAttemptsToday(state,topic),1,'Repair cannot advance formal Year 8 work');
assert.equal(state.questionsToday,1,'Repair cannot advance general daily work');
context.patchedRecordAttempt('game-q1',true,'french',{topicId:topic,formal:false});
assert.equal(context.focusAttemptsToday(state,focus),1,'Game cannot advance adaptive focus');
assert.equal(context.topicAttemptsToday(state,topic),1,'Game cannot advance formal Year 8 work');
context.patchedRecordAttempt('q2',true,'french',{topicId:topic,excludeGeneralDaily:true,yearOverride:8});
assert.equal(context.topicAttemptsToday(state,topic),2,'Formal Year 8 practice adds topic evidence');
assert.equal(state.questionsToday,2,'Formal Year 8 work counts towards the general daily target');
const restored=JSON.parse(JSON.stringify(state));
assert.equal(context.topicAttemptsToday(restored,topic),2,'Saved topic evidence survives a round-trip');
for(let i=0;i<35;i++) context.patchedRecordAttempt('extra-'+i,true,'french',{topicId:topic,excludeGeneralDaily:true,yearOverride:8});
assert.equal(context.topicAttemptsToday(state,topic),37,'Durable ledger outlives the 20-outcome window');
assert.equal(context.focusAttemptsToday(state,focus),37,'Focus uses the durable daily count');
assert.equal(state.questionsToday,37,'Every formal answer adds one daily attempt');
console.log('DAILY_FORMAL_EVIDENCE_QA passed: formal work retained; Year 8 work also advances general daily progress; repairs and games stay excluded.');
