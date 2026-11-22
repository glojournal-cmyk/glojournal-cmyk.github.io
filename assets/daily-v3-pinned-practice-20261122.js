// Original approved V3 Daily question IDs are the ONLY allowed practice source.
// No student storage/XP/MP writes. Returning an empty set on missing pinned
// content is deliberate: never substitute unrelated, not independently QA'd IDs.
const TARGETS=Object.freeze({'languages-standard':{year:8},'y8-standard-b':{year:9}});
const nonEmpty=x=>typeof x==='string'&&x.length>0;
export function pinnedV3DailyPractice({dailyLocked=false,taskId=null,assignment=null,
  subject=null,year=null,topicId=null,day=null,recovery=false,questions=[]}={}){
 const applicable=dailyLocked===true&&recovery!==true&&
   Object.hasOwn(TARGETS,String(taskId||''));
 if(!applicable)return {applicable:false,items:[],required:0,issue:null};
 const blocked=issue=>({applicable:true,items:[],required:0,issue});
 if(!assignment||assignment.id!==taskId||assignment.dailyV3!==true||
    assignment.supplyBlocked===true||assignment.planDate!==day||
    !nonEmpty(topicId)||!Array.isArray(questions)||
    (taskId!=='languages-standard'&&Number(assignment.assignedYear)!==TARGETS[taskId].year)||
    Number(year)!==TARGETS[taskId].year)
   return blocked('missing-or-invalid-v3-assignment');
 let allowed,expectedTopic,required;
 if(taskId==='languages-standard'){
   if(!['latin','french'].includes(subject))return blocked('incorrect-language-subject');
   const part=assignment.languageSplit?.[subject];
   if(!part||part.subject!==subject||Number(part.year)!==8||part.target!==5)
     return blocked('missing-signed-language-split');
   allowed=part.approvedQuestionIds;
   expectedTopic=part.topicId;
   required=5;
 }else{
   if(!nonEmpty(subject)||assignment.assignedSubject!==subject||
     Number(assignment.target)!==10)return blocked('invalid-standard-b-assignment');
   allowed=assignment.approvedQuestionIds;
   expectedTopic=assignment.assignedTopic;
   required=10;
 }
 if(!nonEmpty(expectedTopic)||expectedTopic!==topicId||
   !Array.isArray(allowed)||allowed.length!==required||
   new Set(allowed).size!==required||allowed.some(id=>!nonEmpty(id)))
   return blocked('invalid-pinned-v3-question-ids-or-topic');
 const byId=new Map();
 for(const question of questions){
   if(!question||!nonEmpty(question.id)||question.topicId!==topicId)continue;
   if(byId.has(question.id))return blocked('ambiguous-duplicated-question-id-in-bank');
   byId.set(question.id,question);
 }
 if(allowed.some(id=>!byId.has(id)))
   return blocked('approved-question-id-missing-from-loaded-bank');
 return {applicable:true,items:allowed.map(id=>byId.get(id)),required,issue:null};
}
