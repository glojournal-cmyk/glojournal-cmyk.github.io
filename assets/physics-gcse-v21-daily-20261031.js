/* GCSE Physics V2.1 -> existing locked Year 9 Daily (no new task IDs).
 * Only objective MCQs and numeric final-answer questions are eligible for
 * automatic correct-credit. The complete 90-question original bank remains
 * available in the separate mastery pilot; extended explanations are never
 * guessed by the Daily keyword marker.
 */
const TOPICS = Object.freeze({
  "phys-y9-p2": "Density & Particle Model",
  "phys-y9-p4": "Conduction & Insulation",
  "phys-y9-p5": "Infrared Radiation"
});
const VERSION = "physics-gcse-daily-v21-20261031";
const SOURCE = "/content/physics-gcse-mastery-v21/bank.json?v="+VERSION;
const PREFIX = "phys-gcse-daily-v21-";
const SKIP = new Set(["PHY-DEN-02", // figure requires a native question image
  "PHY-DEN-08" // requires strict two-significant-figure marking
]);
const UNITS = {
  "g/cm³":["g/cm³","g/cm3","g/cm^3"],
  "kg/m³":["kg/m³","kg/m3","kg/m^3"],
  "cm³":["cm³","cm3","cm^3","mL","ml"],
  "°C/min":["°C/min","C/min","degC/min","°C per min"],
  "°C":["°C","C","degC"],
  "g":["g"],"cm":["cm"]
};
export function isGcsePhysicsDaily(context={}) {
  return context.locked===true && context.taskId==="year9-light" &&
    context.subject==="physics" && Number(context.year)===9 &&
    Object.hasOwn(TOPICS,context.topicId);
}
function convert(q, topicId) {
  if(SKIP.has(q.id) || q.diagram || q.masteryReviewRequired &&
      q.format!=="calculation") return null;
  const common={
    id:PREFIX+q.id.toLowerCase(),conceptId:PREFIX+q.id.toLowerCase()+"-concept",
    topicId,topic:TOPICS[topicId],subject:"physics",year:9,status:"enabled",
    formal:true,difficulty:q.difficulty||2,
    prompt:q.prompt,
    stimulus:{text:""},
    feedback:{short:q.feedback?.short||q.answer?.accepted?.[0]||""},
    task:{label:"PHYSICS GCSE PRACTICE",instruction:q.prompt},
    sourceQuestionId:q.id
  };
  if(q.format==="mc_single" && q.options?.length>=2 &&
      q.options.includes(q.answer?.accepted?.[0]))
    return {...common,format:"mc_single",options:[...q.options],
      answer:{mode:"choice",accepted:[q.answer.accepted[0]]}};
  if(q.format!=="calculation" || !q.numericAnswer ||
      q.numericAnswer.required_significant_figures ||
      q.numericAnswer.manual_working_review) return null;
  const n=q.numericAnswer;
  if(!Number.isFinite(n.value)||!n.unit)return null;
  const prompt=String(q.prompt).replace(/\s*Show your working\.?/gi,"");
  return {...common,format:"calculation",
    prompt:prompt+" Enter your final answer including units.",
    task:{label:"CALCULATE",instruction:prompt},
    answer:{mode:"exact_or_equivalent",accepted:[...(q.answer?.accepted||[])],
      value:n.value,tolerance:Number(n.absolute_tolerance)||0,
      units:UNITS[n.unit]||[n.unit]}};
}
export function convertGcsePhysicsDaily(bank, topicId) {
  if(!Object.hasOwn(TOPICS,topicId)) return [];
  return (bank.groups||[]).filter(g=>g.title===TOPICS[topicId])
    .flatMap(g=>g.questions||[]).map(q=>convert(q,topicId)).filter(Boolean);
}
export async function extendGcsePhysicsDaily(existing, context={}, load) {
  if(!isGcsePhysicsDaily(context))return existing;
  try {
    const fetchBank=load||((url)=>fetch(url,{cache:"no-cache"}).then(r=>{
      if(!r.ok)throw Error("Physics daily bank unavailable");
      return r.json();
    }));
    const bank=await fetchBank(SOURCE);
    const used=new Set(existing.map(q=>q.id));
    return existing.concat(convertGcsePhysicsDaily(bank,context.topicId)
      .filter(q=>!used.has(q.id)));
  } catch {
    // Never block the existing Daily assignment on an optional bank fetch.
    return existing;
  }
}
export function includeGcsePhysicsDaily(picked, pool, size, context={}) {
  if(!isGcsePhysicsDaily(context))return picked;
  const result=picked.slice(0,size);
  if(!result.length)return result;
  const existing=new Set(result.map(q=>q.id));
  const extra=pool.filter(q=>q.id?.startsWith(PREFIX) && !existing.has(q.id));
  const already=result.filter(q=>q.id?.startsWith(PREFIX)).length;
  // The established assigned daily target is unchanged: replace at most 2
  // ordinary picks, never add extra credit or overwrite a saved receipt.
  const add=Math.min(Math.max(0,2-already),extra.length,result.length);
  return add?[...result.slice(0,result.length-add),...extra.slice(0,add)]:result;
}
