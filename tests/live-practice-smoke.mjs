import fs from "node:fs";
import path from "node:path";

const PRACTICE="assets/study._subject.practise-D_PWgUd7.js";
const INDEX="assets/index-BLVOhKhN.js";
const practice=fs.readFileSync(PRACTICE,"utf8");
const indexSrc=fs.readFileSync(INDEX,"utf8");

function extractFunction(src,name){
  const marker="function "+name+"(";
  const start=src.indexOf(marker);
  if(start<0) throw new Error("Function not found: "+name);
  const brace=src.indexOf("{",start);
  let depth=0, quote=null, esc=false;
  for(let i=brace;i<src.length;i++){
    const ch=src[i];
    if(quote){
      if(esc){esc=false;continue;}
      if(ch==="\\"){esc=true;continue;}
      if(ch===quote){quote=null;continue;}
      if(quote==="\`" && ch==="$" && src[i+1]==="{"){
        // Template interpolation is still inside the template; braces must count.
      } else continue;
    } else if(ch==="'"||ch==='"'||ch==="\`"){quote=ch;continue;}
    if(ch==="{") depth++;
    else if(ch==="}"){depth--;if(depth===0)return src.slice(start,i+1);}
  }
  throw new Error("Unclosed function: "+name);
}

const rankBlockStart=indexSrc.indexOf("function adaptiveCognitiveDepth");
const rankBlockEnd=indexSrc.indexOf("function topicState",rankBlockStart);
const skillNormStart=indexSrc.indexOf("function normalizeSkillStat");
const skillNormEnd=indexSrc.indexOf("function topicTitle",skillNormStart);
if(rankBlockStart<0||rankBlockEnd<0||skillNormStart<0||skillNormEnd<0) throw new Error("Adaptive composer helpers missing");
const today="2026-09-19";
let currentState={};
const store={getState:()=>currentState};
const todayKey=()=>today;
const MASTERY_ACCURACY=.85;
const MASTERY_MIN_ATTEMPTS=6;
const SECURE_MIN_ATTEMPTS=5;
const SECURE_ACCURACY=.8;
function topicState(attempted,correct,productionCorrect){
  const accuracy=attempted>0?correct/attempted:0;
  if(attempted>=MASTERY_MIN_ATTEMPTS&&accuracy>=MASTERY_ACCURACY&&productionCorrect>0)return "mastered";
  if(attempted>=SECURE_MIN_ATTEMPTS&&accuracy>=SECURE_ACCURACY)return "secure";
  if(attempted>=2||correct>0)return "practising";
  return "learning";
}
function normalizeTopicStat(stat={}){
  const attempted=Math.max(0,Number(stat.attempted)||0);
  const correct=Math.max(0,Math.min(attempted,Number(stat.correct)||0));
  const productionIds=Array.isArray(stat.productionIds)?[...new Set(stat.productionIds)].slice(-20):[];
  const productionCorrect=Math.max(Number(stat.productionCorrect)||0,productionIds.length);
  const accuracy=attempted?correct/attempted:0;
  return {...stat,attempted,correct,accuracy,productionAttempted:Math.max(0,Number(stat.productionAttempted)||0),productionCorrect,productionIds,state:topicState(attempted,correct,productionCorrect),recentOutcomes:stat.recentOutcomes||[],masteryRule:1};
}
const normalizeSkillStat=new Function("MASTERY_ACCURACY",indexSrc.slice(skillNormStart,skillNormEnd)+";return normalizeSkillStat;")(MASTERY_ACCURACY);
function questionTopicId(item){return item?.topicId||"unknown";}
function getQuestionSkills(item,subject){
  if(Array.isArray(item?.skills)&&item.skills.length)return item.skills;
  const concept=String(item?.conceptId||item?.topicId||item?.id||"general").toLowerCase().replace(/[^a-z0-9]+/g,"-");
  return [subject+":test:"+concept];
}
const {rankAdaptiveQuestions}=new Function(
  "store","todayKey","questionTopicId","normalizeTopicStat","normalizeSkillStat","getQuestionSkills","MASTERY_ACCURACY","SECURE_ACCURACY",
  indexSrc.slice(rankBlockStart,rankBlockEnd)+"; return {rankAdaptiveQuestions};"
)(store,todayKey,questionTopicId,normalizeTopicStat,normalizeSkillStat,getQuestionSkills,MASTERY_ACCURACY,SECURE_ACCURACY);

const root=path.resolve("content/topics");
const allFiles=fs.readdirSync(root).filter(f=>/^(fr|la)-.*\.json$/.test(f)).sort();
const docs=new Map(allFiles.map(file=>[file,JSON.parse(fs.readFileSync(path.join(root,file),"utf8"))]));
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[’‘\`]/g,"'").toLowerCase().replace(/\s+/g," ").trim();

function stateFor(rows,scenario){
  const state={seenTotal:{},seenCorrect:{},recentQuestionIds:[],reviews:{},topicStats:{},skillStats:{}};
  if(scenario==="fresh") return state;
  const topicIds=[...new Set(rows.map(q=>q.topicId).filter(Boolean))];
  for(let i=0;i<topicIds.length;i++){
    const tid=topicIds[i];
    if(scenario==="mixed"){
      if(i%4===0) state.topicStats[tid]={attempted:4,correct:1,productionCorrect:0};
      else if(i%4===1) state.topicStats[tid]={attempted:6,correct:6,productionCorrect:1};
      else if(i%4===2) state.topicStats[tid]={attempted:5,correct:4,productionCorrect:0};
    } else if(scenario==="due"){
      state.topicStats[tid]={attempted:3,correct:i%2?1:2,productionCorrect:0};
    }
  }
  rows.forEach((q,i)=>{
    if(scenario==="mixed"){
      if(i%3!==0) state.seenTotal[q.id]=1+(i%4);
      if(i%11===0) state.reviews[q.id]={due:"2026-09-17"};
      else if(i%13===0) state.reviews[q.id]={due:"2026-09-19"};
    } else if(scenario==="due"){
      state.seenTotal[q.id]=1;
      if(i%2===0) state.reviews[q.id]={due:"2026-09-16"};
    }
  });
  state.recentQuestionIds=rows.slice(-8).map(q=>q.id);
  return state;
}

const failures=[],sessions=[];
function validateSession(label,rows,subject,size,scenario){
  if(!rows.length)return;
  currentState=stateFor(rows,scenario);
  const ranked=rankAdaptiveQuestions(rows,subject,size);
  const selected=ranked.slice(0,Math.min(size,rows.length));
  const expected=Math.min(size,rows.length);
  if(selected.length!==expected) failures.push({label,subject,size,scenario,type:"wrong-length",got:selected.length,expected});
  const ids=selected.map(q=>q.id);
  if(new Set(ids).size!==ids.length) failures.push({label,subject,size,scenario,type:"duplicate-id",ids});
  const keys=selected.map(q=>q._sessionConcept||q.conceptId||q.id);
  const distinctAvailable=new Set(rows.map(q=>q.conceptId||q.id)).size;
  const expectedUnique=Math.min(expected,distinctAvailable);
  const actualUnique=new Set(keys).size;
  if(actualUnique<expectedUnique) failures.push({label,subject,size,scenario,type:"duplicate-concept",expectedUnique,actualUnique,selected:selected.map(q=>({id:q.id,key:q._sessionConcept||q.conceptId||q.id}))});
  for(let i=1;i<keys.length;i++){
    if(keys[i]===keys[i-1]&&distinctAvailable>1){failures.push({label,subject,size,scenario,type:"adjacent-concept-repeat",index:i,key:keys[i]});break;}
  }
  for(const q of selected){
    if(q.format==="mc_single"){
      const opts=(q.options||[]).filter(Boolean), acc=q.answer?.accepted?.[0];
      if(opts.length<2) failures.push({label,subject,size,scenario,type:"mc-too-few-options",id:q.id});
      if(new Set(opts.map(norm)).size!==opts.length) failures.push({label,subject,size,scenario,type:"mc-duplicate-options",id:q.id,options:opts});
      if(!opts.some(o=>norm(o)===norm(acc))) failures.push({label,subject,size,scenario,type:"mc-correct-missing",id:q.id,accepted:acc,options:opts});
    }
  }
  const lanes=selected.map(q=>q._sessionLane||q.format||"other");
  let windowRepeats=0,depthJumps=0;
  for(let i=0;i<selected.length;i++){
    for(let j=Math.max(0,i-2);j<i;j++) if(keys[i]===keys[j]) windowRepeats++;
    if(i>0&&Number.isFinite(selected[i]._sessionDepth)&&Number.isFinite(selected[i-1]._sessionDepth)&&Math.abs(selected[i]._sessionDepth-selected[i-1]._sessionDepth)>1) depthJumps++;
  }
  if(windowRepeats&&distinctAvailable>=expected) failures.push({label,subject,size,scenario,type:"two-question-window-concept-repeat",windowRepeats});
  sessions.push({label,subject,size,scenario,questions:selected.map(q=>q.id),distinctConcepts:actualUnique,distinctLanes:new Set(lanes).size,lanes,windowRepeats,depthJumps,depths:selected.map(q=>q._sessionDepth)});
}

for(const subject of ["french","latin"]){
  const prefix=subject==="french"?"fr-":"la-";
  const files=allFiles.filter(f=>f.startsWith(prefix));
  for(const file of files){
    const rows=docs.get(file).questions||[];
    for(const size of [5,10,15]) for(const scenario of ["fresh","mixed","due"]) validateSession(file,rows,subject,size,scenario);
  }
  for(const year of [8,9]){
    const yp=subject==="french"?`fr-y${year}-`:`la-y${year}-`;
    const rows=files.filter(f=>f.startsWith(yp)).flatMap(f=>docs.get(f).questions||[]);
    for(const size of [5,10,15]) for(const scenario of ["fresh","mixed","due"]) validateSession(subject+"-y"+year+"-all-topics",rows,subject,size,scenario);
  }
}

const summary={
  sessions:sessions.length,
  failures:failures.length,
  french:sessions.filter(s=>s.subject==="french").length,
  latin:sessions.filter(s=>s.subject==="latin").length,
  quick:sessions.filter(s=>s.size===5).length,
  standard:sessions.filter(s=>s.size===10).length,
  mastery:sessions.filter(s=>s.size===15).length,
  minDistinctConcepts:Math.min(...sessions.map(s=>s.distinctConcepts)),
  maxDistinctLanes:Math.max(...sessions.map(s=>s.distinctLanes))
};
console.log("LIVE_PRACTICE_SMOKE_SUMMARY "+JSON.stringify(summary));
console.log("LIVE_PRACTICE_SMOKE_SAMPLE "+JSON.stringify(sessions.filter(s=>/all-topics/.test(s.label)&&s.scenario==="fresh")));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/live-practice-smoke.json",JSON.stringify({summary,failures,sessions},null,2));
if(failures.length){console.error("LIVE_PRACTICE_SMOKE_FAILURES "+JSON.stringify(failures.slice(0,100)));process.exit(2);}
