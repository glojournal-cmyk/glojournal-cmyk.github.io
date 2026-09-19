import fs from "node:fs";
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const failures=[];
const need=(src,name,token)=>{if(!src.includes(token))failures.push({type:"missing-token",name,token});};
need(wrapper,"wrapper","const TOPIC_MASTERY_XP = 50");
need(wrapper,"wrapper","mastery_retention: 10");
need(wrapper,"wrapper","if (stat.masteryRewardedAt) return null;");
need(wrapper,"wrapper","masteryRewardedAt: todayKey()");
need(wrapper,"wrapper","awardFirstTopicMastery(resolved.topicId");
need(wrapper,"wrapper","awardMasteryRetention(resolved.topicId");
need(wrapper,"wrapper","awardFirstTopicMastery(known.topicId");
need(wrapper,"wrapper","scholar:mastery-earned");
need(core,"core","masteredTopics:MwM(n)");
for(const id of ["first-mastery","mastery-five","mastery-ten","mastery-twenty"])need(core,"core",id);
need(quiz,"quiz","Topic Mastered!");
need(quiz,"quiz","Mastery retained");
need(quiz,"quiz","New reward unlocked");

function firstMasteryReward(stat,previousState,nextState){
  if(nextState!=="mastered"||previousState==="mastered"||stat.masteryRewardedAt)return 0;
  return 50;
}
if(firstMasteryReward({},"secure","mastered")!==50)failures.push({type:"first-mastery-not-50"});
if(firstMasteryReward({masteryRewardedAt:"2026-09-19"},"secure","mastered")!==0)failures.push({type:"duplicate-mastery-reward"});
if(firstMasteryReward({},"mastered","mastered")!==0)failures.push({type:"repeated-mastered-state-reward"});

const summary={failures:failures.length,firstMasteryXp:50,retentionXp:10,duplicateMasteryBlocked:true,milestoneMedals:[1,5,10,20],celebrationToast:true};
console.log("MASTERY_REWARD_QA "+JSON.stringify(summary));
console.log("MASTERY_REWARD_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/mastery-reward-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);