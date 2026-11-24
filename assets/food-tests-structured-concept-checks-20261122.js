// Deterministic per-mark-point scoring framework; none of today's Food Tests
// questions are approved. This prototype never authorises Daily/MP/Mastery.
export function validateConceptChoiceItem(item){
 if(!item||!Array.isArray(item.parts)||!item.parts.length)return {valid:false,reason:'missing-parts'};
 if(item.academicReview!=='approved')return {valid:false,reason:'unapproved-item'};
 const ids=new Set();
 for(const part of item.parts){
  if(part.approved!==true||typeof part.pointId!=='string'||ids.has(part.pointId))return {valid:false,reason:'unapproved-or-duplicate-part'};
  ids.add(part.pointId);
  if(!Array.isArray(part.options)||part.options.length!==4)return {valid:false,reason:'requires-four-options-per-point'};
  const keys=part.options.map(o=>o?.id);
  if(keys.some(id=>typeof id!=='string'||!id)||new Set(keys).size!==4||!keys.includes(part.correctOptionId))return {valid:false,reason:'invalid-option-keys'};
 }
 return {valid:true,reason:'schema-valid'};
}
export function scoreConceptChoices(item,responses){
 const valid=validateConceptChoiceItem(item);
 if(!valid.valid)return {status:'academic-qa-pending',score:0,total:item?.parts?.length||0,pointResults:[],formalCreditEligible:false,reason:valid.reason};
 const flags=item.parts.map(p=>responses?.[p.pointId]===p.correctOptionId);
 return {status:'deterministic-check',score:flags.filter(Boolean).length,total:flags.length,pointResults:flags,formalCreditEligible:false,reason:'Entire Food Tests bank is on an academic QA hold'};
}
