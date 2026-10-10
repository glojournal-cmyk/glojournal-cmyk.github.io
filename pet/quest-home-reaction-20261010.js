/* Verify Home return reactions against already persisted daily credit. */
export function readyHomeReaction(cue,state,now=Date.now()){
 if(!cue||!state||!Array.isArray(state.daily)||!Number.isFinite(cue.at)||
 cue.at>now+30000||now-cue.at>600000||String(cue.day)!==String(state.today))
  return null;
 const item=state.daily.find(t=>t.id===cue.taskId);
 if(!item||!(Number(item.target)>0)||Number(item.progress)<Number(item.target))return null;
 const tasks=state.daily.filter(t=>Number(t.target)>0);
 const count=tasks.filter(t=>Number(t.progress)>=Number(t.target)).length;
 return {count,total:tasks.length,text:count+' / '+tasks.length+' daily stars saved'};
}
