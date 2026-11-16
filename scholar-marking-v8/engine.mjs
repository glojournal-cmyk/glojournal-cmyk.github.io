// V8 short-field evaluator. Scope: supported practice; never original-task mastery.
export function normalize(value,kind='term'){
 let s=String(value??'').normalize('NFKC').replace(/[’‘`]/g,"'").replace(/[−]/g,'-').replace(/[‐‑‒–—]/g,'-').trim().replace(/[.!?;]+$/g,'').replace(/\s+/g,' ');
 if(kind==='symbol')return s.replace(/\s+/g,'');
 if(kind==='temperature')return s.replace(/\s*(?:degrees?|deg)\s*celsius/gi,'°C').replace(/\s*°\s*C/g,'°C');
 if(kind==='number'){
  const frac=s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);if(frac&&Number(frac[2])!==0)return String(Number(frac[1])/Number(frac[2]));
  if(/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s))return String(Number(s.replaceAll(',','')));
  return s;
 }
 s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('œ','oe').replaceAll('æ','ae');
 if(kind==='translation')s=s.replace(/[,;:]/g,' ').replace(/\s+/g,' ');
 if(kind==='latin_form')return s;
 return s.replace(/\bcolour/g,'color').replace(/\bcentres?\b/g,'center').replace(/-/g,' ').replace(/\s+/g,' ').trim();
}
const equal=(a,b,k)=>normalize(a,k)===normalize(b,k);
function point(field,value){
 const s=String(value??'').trim();
 if(!s)return {key:field.key,marks:0,status:'BLANK',feedback:'This field is blank.'};
 if(field.accepted.some(a=>equal(a,s,field.kind)))return {key:field.key,marks:field.marks,status:'CREDIT',feedback:'Accepted alternative.'};
 if(field.reject.some(a=>equal(a,s,field.kind))||/^(?:incorrect answer|wrong|nonsense|\?\?)$/i.test(s))return {key:field.key,marks:0,status:'INCORRECT',feedback:'This answer does not satisfy this marking point.'};
 // A bare negation of a listed correct term is definitely not that term.
 // Other unrecognised responses remain unassessed; no global keyword inference.
 if(field.accepted.some(a=>equal('not '+a,s,field.kind)||equal(a+' is wrong',s,field.kind)))return {key:field.key,marks:0,status:'CONTRADICTED',feedback:'This field negates the required answer.'};
 return {key:field.key,marks:0,status:'UNRECOGNISED',feedback:'This wording has not been assessed. Rephrase only this field using a short term, or retain it for review. It is not a final zero.'};
}
function result(rule,points){
 const pending=points.filter(p=>p.status==='UNRECOGNISED');
 const confirmed=points.reduce((n,p)=>n+p.marks,0);
 return {confirmed_marks:confirmed,max_marks:rule.max_marks,pending_marks:pending.length,final_marks:pending.length?null:confirmed,complete:!pending.length,all_correct:!pending.length&&confirmed===rule.max_marks,point_results:points,unrecognised_fields:pending.map(p=>p.key),response_requires_human:false,next_action:pending.length?'REPHRASE_FLAGGED_FIELDS_OR_OPTIONAL_REVIEW':'SHOW_MARKS',assessment_identity:rule.assessment_identity};
}
function gradeBase(rule,response){
 if(rule.mode==='reasoned_response')return {confirmed_marks:0,max_marks:rule.max_marks,final_marks:null,complete:false,all_correct:false,response_requires_human:true,next_action:'EVALUATE_REASONING_WITH_RUBRIC'};
 if(typeof response==='string'){
  if((rule.full_answer_alternatives||[]).some(a=>equal(a,response,rule.fields.some(f=>f.kind==='symbol')?'symbol':rule.subject==='Latin'&&rule.mode==='latin_production_components'?'latin_form':'translation')))
   return result(rule,rule.fields.map(f=>({key:f.key,marks:f.marks,status:'CREDIT',feedback:'Approved complete-answer alternative.'})));
  if(rule.fields.length===1)return result(rule,[point(rule.fields[0],response)]);
  return {confirmed_marks:0,max_marks:rule.max_marks,final_marks:null,complete:false,all_correct:false,response_requires_human:false,next_action:'USE_SEPARATE_FIELDS',feedback:'Use the marking-point fields so each point can receive credit independently.'};
 }
 if(!response||typeof response!=='object'||Array.isArray(response))return {complete:false,final_marks:null,all_correct:false,next_action:'USE_SEPARATE_FIELDS'};
 const extra=Object.keys(response).filter(k=>!rule.fields.some(f=>f.key===k));
 if(extra.length)return {complete:false,final_marks:null,all_correct:false,next_action:'REMOVE_UNEXPECTED_FIELDS',unexpected_fields:extra};
 if(rule.mode==='distinct_examples'){
  const used=new Set();
  return result(rule,rule.fields.map(f=>{
   const v=response[f.key]??'',index=rule.accepted_groups.findIndex(g=>g.some(a=>equal(a,v)));
   if(index>=0){if(used.has(index))return {key:f.key,marks:0,status:'DUPLICATE',feedback:'This repeats an example already credited.'};used.add(index);return {key:f.key,marks:1,status:'CREDIT',feedback:'Distinct valid example.'}}
   return point({...f,accepted:[]},v);
  }));
 }
 return result(rule,rule.fields.map(f=>point(f,response[f.key])));
}

export function grade(rule,response){
 if(!rule||!Array.isArray(rule.fields)||rule.version!=='8.0.0')return {complete:false,final_marks:null,all_correct:false,next_action:'UNSUPPORTED_RULE_VERSION'};
 const g=gradeBase(rule,response);
 if(!g.point_results||!rule.unordered_groups?.length||typeof response!=='object')return g;
 for(const keys of rule.unordered_groups){
  const fs=keys.map(k=>rule.fields.find(f=>f.key===k));
  // Maximum matching: each response and each marking point can be used once.
  const candidates=fs.map(slot=>fs.map((f,i)=>f.accepted.some(a=>equal(a,response[slot.key]??'',f.kind))?i:-1).filter(i=>i>=0));
  let best=[];
  function visit(i,used,assignment){if(i===fs.length){if(assignment.filter(x=>x>=0).length>best.filter(x=>x>=0).length)best=assignment.slice();return}
   for(const j of candidates[i])if(!used.has(j)){used.add(j);visit(i+1,used,[...assignment,j]);used.delete(j)}visit(i+1,used,[...assignment,-1]);}
  visit(0,new Set(),[]);
  for(let i=0;i<fs.length;i++){
   const f=fs[i],j=best[i]??-1;
   const p=j>=0?{key:f.key,marks:1,status:'CREDIT',feedback:'Distinct marking point accepted in either order.'}:candidates[i].length?{key:f.key,marks:0,status:'DUPLICATE',feedback:'This concept has already been credited.'}:point(f,response[f.key]);
   g.point_results[g.point_results.findIndex(p=>p.key===f.key)]=p;
  }
 }
 return result(rule,g.point_results);
}
export function practiceRecord(rule,response,options={}){
 const g=grade(rule,response);
 const answered=typeof response==='string'?response.trim().length>0:rule.fields.every(f=>String(response?.[f.key]??'').trim());
 const complete=g.complete===true&&Boolean(answered)&&!options.revealed;
 return {schema:'lux.practice.receipt.v8',version:'8.0.0',rule_id:rule.id,concept_id:rule.concept_id,assessment_identity:rule.assessment_identity,response,grade:g,practice_complete:complete,assisted:Boolean(options.revealed),daily_credit:0,original_mastery_credit:0,at:new Date().toISOString()};
}
