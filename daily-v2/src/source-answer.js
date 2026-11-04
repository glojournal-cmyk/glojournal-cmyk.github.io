/* Shared real-source marking-shape inspection for Daily V2 QA.
 * Recognising a complete source answer does NOT authorize automatic grading.
 * The adapter must still fail closed for all unverified structured scorers.
 */
const nonblank=x=>typeof x==='string'&&x.trim().length>0;
const STRUCTURED_MODES=new Set([
 'mark_points','pair_map','unordered_required_groups','semantic_groups','numeric','category_map'
]);
export function inspectDailyV2AnswerShape(answer){
 const accepted=Array.isArray(answer?.accepted)&&answer.accepted.some(nonblank);
 const validMarkPoints=answer?.mode==='mark_points'&&
  Array.isArray(answer.markPoints)&&answer.markPoints.length>0&&
  answer.markPoints.every(nonblank);
 const validPairs=answer?.mode==='pair_map'&&
  Array.isArray(answer.pairs)&&answer.pairs.length>0&&
  answer.pairs.every(p=>nonblank(p?.left)&&nonblank(p?.right));
 const validGroups=['unordered_required_groups','semantic_groups'].includes(answer?.mode)&&
  Array.isArray(answer.requiredGroups)&&answer.requiredGroups.length>0&&
  answer.requiredGroups.every(g=>
    Array.isArray(g?.alternatives)&&g.alternatives.some(nonblank));
 const validNumeric=answer?.mode==='numeric'&&
  typeof answer.value==='number'&&Number.isFinite(answer.value)&&
  (answer.tolerance===undefined||(typeof answer.tolerance==='number'&&
    Number.isFinite(answer.tolerance)&&answer.tolerance>=0))&&
  (answer.units===undefined||(Array.isArray(answer.units)&&answer.units.every(nonblank)));
 const categories=answer?.categories;
 const validCategories=answer?.mode==='category_map'&&categories!==null&&
  typeof categories==='object'&&!Array.isArray(categories)&&
  Object.keys(categories).length>0&&
  Object.values(categories).every(vals=>Array.isArray(vals)&&vals.length>0&&
    vals.every(v=>nonblank(v)||(typeof v==='number'&&Number.isFinite(v))));
 const structured=Boolean(validMarkPoints||validPairs||validGroups||validNumeric||validCategories);
 const structuredMode=STRUCTURED_MODES.has(answer?.mode);
 return {
  accepted:Boolean(accepted),validMarkPoints:Boolean(validMarkPoints),
  validPairs:Boolean(validPairs),validGroups:Boolean(validGroups),
  validNumeric:Boolean(validNumeric),validCategories:Boolean(validCategories),
  hasMarkingEvidence:Boolean(accepted||structured),
  structuredMode,
  structuredEvidence:structured,
  // Even if accepted[] is also present, a multi-point/semantic/numeric mode
  // cannot be safely graded by a generic string matcher.
  requiresScoringAdapter:structuredMode,
  sourceAnswerMode:typeof answer?.mode==='string'?answer.mode:null
 };
}
