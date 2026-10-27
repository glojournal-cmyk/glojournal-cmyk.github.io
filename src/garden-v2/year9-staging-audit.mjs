// V2 Year 9 Mastery imported drafts: strictly read-only validation.
// Never treat staging material as published or auto-markable.
export const V2_YEAR9_TOPIC_CODES=Object.freeze({
 M:5,C:6,B:6,P:7,F:7,L:2
});
export function auditV2Year9Topic(topic){
 const errors=[];
 if(topic?.schema!=='garden-v2-year9-mastery-staging-v1')errors.push('schema');
 if(topic?.publicationStatus!=='draft_not_live')errors.push('publication_status');
 if(topic?.year!==9)errors.push('year');
 const code=topic?.topicCode, prefix=typeof code==='string'?code[0]:null;
 const n=Number(code?.slice?.(1));
 if(!Number.isInteger(n)||n<1||n>V2_YEAR9_TOPIC_CODES[prefix])errors.push('topic_code');
 if(!Array.isArray(topic?.questions)||topic.questions.length!==30)errors.push('question_count');
 const seen=new Set();
 for(const [i,q] of (topic?.questions||[]).entries()){
  const expected=code+'.'+String(i+1).padStart(2,'0');
  if(q.sourceQuestionId!==expected||seen.has(q.sourceQuestionId))errors.push('question_id:'+i);
  seen.add(q.sourceQuestionId);
  if(!q.prompt?.trim())errors.push('prompt:'+expected);
  // Blocked M4.29 deliberately retains the unedited three-part faulty source rubric.
  if(q.maxMarks!==2||q.markPointCount!==2||(! (q.sourceQuestionId==='M4.29'&&q.status==='blocked_academic_error')&&(!Array.isArray(q.markScheme)||q.markScheme.length!==2||q.markScheme.some(x=>!String(x).trim()))))errors.push('rubric:'+expected);
  if(q.markingMode!=='manual_rubric'||q.format!=='constructed_response')errors.push('marking:'+expected);
  if(!['needs_academic_review','blocked_academic_error'].includes(q.status))errors.push('status:'+expected);
 }
 return {ok:errors.length===0,code,count:topic?.questions?.length??0,errors};
}
export function summarizeV2Year9Staging(topics){
 const seen=new Set(),errors=[],counts={};
 for(const topic of topics){
  const a=auditV2Year9Topic(topic);
  if(!a.ok)errors.push(...a.errors.map(s=>a.code+':'+s));
  if(seen.has(a.code))errors.push('duplicate_topic:'+a.code);
  seen.add(a.code);
  counts[a.code]=a.count;
 }
 if(topics.length!==33)errors.push('topic_total');
 const questions=topics.flatMap(t=>t.questions||[]);
 if(questions.length!==990)errors.push('question_total');
 const ids=questions.map(q=>q.sourceQuestionId);
 if(new Set(ids).size!==ids.length)errors.push('duplicate_id');
 if(questions.filter(q=>q.status==='blocked_academic_error').length!==1)errors.push('blocked_count');
 if(questions.find(q=>q.sourceQuestionId==='M4.29')?.status!=='blocked_academic_error')errors.push('m4_29_not_blocked');
 return {ok:errors.length===0,topicCount:topics.length,questionCount:questions.length,errors};
}
