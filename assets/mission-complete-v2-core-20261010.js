/* Mission Complete V2: read-only verification of the existing Scholar Garden
   local save. Never awards XP, changes task completion, or writes to main storage. */
(function(root){
"use strict";
const MAIN_KEY="lux-scholar-garden-v1";
function readSaved(storage){
 try{
  const raw=storage?.getItem(MAIN_KEY);
  const data=raw?JSON.parse(raw):null;
  const state=data?.state||data;
  return state&&typeof state==="object"&&!Array.isArray(state)?state:null;
 }catch{return null}
}
function verify(state,href,taskId,planDate,journey,storage){
 if(!journey||!state)return {state:"unavailable",verified:false,data:null};
 let live;
 try{live=journey.completion(journey.withReviewCredits(state),href,taskId)}catch{}
 if(!live)return {state:"not-daily",verified:false,data:null};
 if(planDate && journey.day()!==planDate){
  return {state:"expired",verified:false,data:live};
 }
 const saved=readSaved(storage);
 if(!saved||saved.today!==state.today||saved.today!==journey.day()||!Array.isArray(saved.daily)){
  return {state:"unverified",verified:false,data:live};
 }
 let committed;
 try{committed=journey.completion(journey.withReviewCredits(saved),href,taskId)}catch{}
 if(!committed||committed.task.id!==live.task.id ||
    Number(committed.task.progress)<Number(live.task.progress) ||
    Number(saved.xp||0)<Number(state.xp||0)){
   return {state:"unverified",verified:false,data:live};
 }
 return {state:committed.done?"complete":"in-progress",verified:true,data:committed};
}
function rewardLabel(points){
 const value=Number(points);
 return Number.isFinite(value)&&value>0?"+"+Math.floor(value)+" XP":"No additional XP";
}
function isValidNext(data,journey){
 if(!data?.next?.href)return false;
 return !!journey?.safeHref?.(data.next.href) &&
   data.next.id!==data.task?.id && Number(data.next.progress)<Number(data.next.target);
}
root.LuxMissionCompleteV2={readSaved,verify,rewardLabel,isValidNext};
})(globalThis);
