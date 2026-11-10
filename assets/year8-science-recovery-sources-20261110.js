// Read-only source selection for a dated Year 8 science Practice Recovery.
// Never switch school years, subjects, preview lessons, dates or saved targets.
const SCIENCE=new Set(['biology','chemistry','physics']);
export function year8ScienceRecoveryTopics(catalog,subject,assignedTopic,alreadyLoaded=[]){
 if(!SCIENCE.has(subject)||!assignedTopic)return [];
 const known=new Set((Array.isArray(alreadyLoaded)?alreadyLoaded:[]).map(t=>t?.topicId));
 return (Array.isArray(catalog)?catalog:[]).filter(t=>
  t?.subject===subject&&Number(t.year)===8&&t.status==='enabled'&&
  !!t.topicId&&t.topicId!==assignedTopic&&!known.has(t.topicId));
}
