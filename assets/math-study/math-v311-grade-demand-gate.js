// Strict V3.1 original-source grade-demand gate: no inferred GCSE grades.
// Generated from qa-staging/math-v311-200-item-grade-demand-triage-20261122.json.
// These 24 IDs are *review candidates*, not approved questions.
// All 176 other original IDs must be rewritten, upgraded, or taught-checked,
// and MUST NOT be upgraded in place merely by setting academicQA='approved'.
const MAYBE_REVIEW=Object.freeze([
  "LUX-MATH-Y9-GRAPHS-009",
  "LUX-MATH-Y9-GRAPHS-010",
  "LUX-MATH-Y9-GRAPHS-011",
  "LUX-MATH-Y9-GRAPHS-012",
  "LUX-MATH-Y9-GRAPHS-013",
  "LUX-MATH-Y9-GRAPHS-014",
  "LUX-MATH-Y9-GRAPHS-015",
  "LUX-MATH-Y9-GRAPHS-016",
  "LUX-MATH-Y9-GRAPHS-025",
  "LUX-MATH-Y9-GRAPHS-026",
  "LUX-MATH-Y9-GRAPHS-027",
  "LUX-MATH-Y9-GRAPHS-028",
  "LUX-MATH-Y9-GRAPHS-033",
  "LUX-MATH-Y9-GRAPHS-034",
  "LUX-MATH-Y9-GRAPHS-035",
  "LUX-MATH-Y9-GRAPHS-036",
  "LUX-MATH-Y9-SIMULTANEOUS-005",
  "LUX-MATH-Y9-SIMULTANEOUS-006",
  "LUX-MATH-Y9-SIMULTANEOUS-007",
  "LUX-MATH-Y9-SIMULTANEOUS-008",
  "LUX-MATH-Y9-SIMULTANEOUS-037",
  "LUX-MATH-Y9-SIMULTANEOUS-038",
  "LUX-MATH-Y9-SIMULTANEOUS-039",
  "LUX-MATH-Y9-SIMULTANEOUS-040"
]);
const REVIEW_SET=new Set(MAYBE_REVIEW);
const SOURCED=/^LUX-MATH-Y9-/;
const filled=x=>typeof x==='string'&&x.trim().length>=8;
export const ORIGINAL_MATHS_G7PLUS_REVIEW_CANDIDATES=MAYBE_REVIEW;
export function mathsOriginalGradeDemandDecision(q){
 const id=q?.id;
 // Test fixtures and separately versioned *non-original* future banks use the
 // general Academic QA intake. This function addresses original V3.1 IDs only.
 if(typeof id!=='string'||!SOURCED.test(id))return {ok:true,reason:null,sourceOriginal:false};
 if(!REVIEW_SET.has(id))return {ok:false,reason:'original-grade-triage-rewrite-or-taught-hold',sourceOriginal:true};
 if(q?.gradeDemandQA!=='VERIFIED_G7_PLUS'||q?.independentGradeCalibrated!==true||
    !filled(q?.gradeDemandBenchmark)||!filled(q?.gradeDemandReviewer))
  return {ok:false,reason:'independent-g7plus-review-required',sourceOriginal:true};
 return {ok:true,reason:null,sourceOriginal:true};
}
