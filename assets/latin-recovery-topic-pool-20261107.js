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


// The vocabulary stages are NOT the entire audited Year 8 Latin curriculum.
// If all of those stages have been mastered, a dated Recovery still needs real
// previously unanswered material from other enabled Year 8 Latin topics.
// The supplied counter must use the source-backed Year 8 concept manifest;
// the caller lazy-loads it only for an actual Latin Recovery.
const CORE_LATIN_RECOVERY_TOPICS=[
 'la-y8-core-verbs','la-y8-nouns-and-dictionary-entries',
 'la-y8-nouns-with-genitives','la-y8-prepositions',
 'la-y8-preposition-dictionary-entries','la-y8-present-person-and-number',
 'la-y8-personal-pronouns','la-y8-case-functions',
 'la-y8-accusative-forms','la-y8-finite-verb-control',
 'la-y8-tense-recognition-from-models','la-y8-ille-singular',
 'la-y8-ille-plural','la-y8-set-text-grammar','la-y8-set-text-comprehension',
];
const CORE_RANK=new Map(CORE_LATIN_RECOVERY_TOPICS.map((id,index)=>[id,index]));

export function latinRecoveryYear8ExtendedSources(catalog,assignedTopic,sourceSupply,maxTopics=12){
 const max=Math.max(0,Math.min(16,Math.floor(Number(maxTopics)||0)));
 if(!max||typeof sourceSupply!=='function')return [];
 return (Array.isArray(catalog)?catalog:[])
   .filter(t=>t?.subject==='latin'&&Number(t.year)===8&&
     t.status==='enabled'&&t.topicId!==assignedTopic&&
     stageNumber(t.topicId)===null)
   .map(t=>({topic:t,supply:sourceSupply(t.topicId)}))
   .filter(row=>row.supply?.known===true&&row.supply.subject==='latin'&&
     Number(row.supply.available)>0)
   .sort((a,b)=>{
     const aRank=CORE_RANK.get(a.topic.topicId)??1000;
     const bRank=CORE_RANK.get(b.topic.topicId)??1000;
     return aRank-bRank||Number(b.supply.available)-Number(a.supply.available)||
       a.topic.topicId.localeCompare(b.topic.topicId);
   })
   .slice(0,max).map(row=>row.topic);
}
