// Read-only Year 8 Latin alternate source selection for a dated Recovery only.
// The original missed-day task and its target/score/reward rules NEVER change.
import {latinDailyUncreditedConcepts} from './latin-daily-capacity-20261107.js';

const stageNumber=id=>{
 const match=String(id||'').match(/^la-y8-stage-(1[0-2]|[1-9])-vocabulary$/);
 return match?Number(match[1]):null;
};

export function latinRecoveryYear8Sources(catalog,assignedTopic,seenCorrect={},maxTopics=8){
 const stages=(Array.isArray(catalog)?catalog:[]).filter(t=>
   t?.subject==='latin'&&Number(t.year)===8&&t.status==='enabled'&&
   stageNumber(t.topicId)!==null).sort((a,b)=>
     stageNumber(a.topicId)-stageNumber(b.topicId));
 const assigned=stages.findIndex(t=>t.topicId===assignedTopic);
 const after=assigned>=0?assigned+1:0;
 const ordered=[...stages.slice(after),...stages.slice(0,after)];
 const max=Math.max(0,Math.min(12,Number(maxTopics)||0));
 return ordered.filter(t=>t.topicId!==assignedTopic&&
   latinDailyUncreditedConcepts(t.topicId,seenCorrect)>0).slice(0,max);
}
