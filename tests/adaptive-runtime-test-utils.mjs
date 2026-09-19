import fs from "node:fs";

export function buildAdaptiveRuntime(){
  const src=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
  const rankStart=src.indexOf("function adaptiveContentKey");
  const rankEnd=src.indexOf("function topicState",rankStart);
  const normStart=src.indexOf("function normalizeSkillStat");
  const normEnd=src.indexOf("function topicTitle",normStart);
  if(rankStart<0||rankEnd<0||normStart<0||normEnd<0) throw new Error("Adaptive composer helpers missing");
  const MASTERY_ACCURACY=.85, SECURE_ACCURACY=.8;
  const normalizeSkillStat=new Function("MASTERY_ACCURACY",src.slice(normStart,normEnd)+";return normalizeSkillStat;")(MASTERY_ACCURACY);
  function topicState(attempted,correct,productionCorrect){
    const accuracy=attempted?correct/attempted:0;
    if(attempted>=6&&accuracy>=.85&&productionCorrect>0)return "mastered";
    if(attempted>=5&&accuracy>=.8)return "secure";
    if(attempted>=2||correct>0)return "practising";
    return "learning";
  }
  function normalizeTopicStat(stat={}){
    const attempted=Math.max(0,Number(stat.attempted)||0);
    const correct=Math.max(0,Math.min(attempted,Number(stat.correct)||0));
    const productionIds=Array.isArray(stat.productionIds)?[...new Set(stat.productionIds)].slice(-20):[];
    const productionCorrect=Math.max(Number(stat.productionCorrect)||0,productionIds.length);
    return {...stat,attempted,correct,accuracy:attempted?correct/attempted:0,productionAttempted:Math.max(0,Number(stat.productionAttempted)||0),productionCorrect,productionIds,state:topicState(attempted,correct,productionCorrect),recentOutcomes:Array.isArray(stat.recentOutcomes)?stat.recentOutcomes:[]};
  }
  let state={seenTotal:{},seenCorrect:{},recentQuestionIds:[],reviews:{},topicStats:{},skillStats:{}};
  const store={getState:()=>state};
  const todayKey=()=>"2026-09-19";
  const questionTopicId=item=>item?.topicId||"unknown";
  const getQuestionSkills=(item,subject)=>{
    if(Array.isArray(item?.skills)&&item.skills.length)return item.skills;
    const concept=String(item?.conceptId||item?.topicId||item?.id||"general").toLowerCase().replace(/[^a-z0-9]+/g,"-");
    return [subject+":test:"+concept];
  };
  const api=new Function(
    "store","todayKey","questionTopicId","normalizeTopicStat","normalizeSkillStat","getQuestionSkills","MASTERY_ACCURACY","SECURE_ACCURACY",
    src.slice(rankStart,rankEnd)+";return {rankAdaptiveQuestions,adaptiveCognitiveDepth,adaptiveFormatLane,adaptiveContentKey};"
  )(store,todayKey,questionTopicId,normalizeTopicStat,normalizeSkillStat,getQuestionSkills,MASTERY_ACCURACY,SECURE_ACCURACY);
  return {
    ...api,
    setState(next){state={seenTotal:{},seenCorrect:{},recentQuestionIds:[],reviews:{},topicStats:{},skillStats:{},...next};},
    getState(){return state;}
  };
}

export function sessionConcept(q){return q?._sessionConcept||q?.conceptId||q?.id;}
export function sessionLane(q){return q?._sessionLane||q?.format||"other";}
export function countWindowRepeats(rows,windowSize=2){
  let repeats=0;
  for(let i=0;i<rows.length;i++)for(let j=Math.max(0,i-windowSize);j<i;j++)if(sessionConcept(rows[i])===sessionConcept(rows[j]))repeats++;
  return repeats;
}
