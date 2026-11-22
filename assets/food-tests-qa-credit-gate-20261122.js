// QA-only fail-closed gate: all 143 enabled Food Tests questions are unapproved.
// Never infer approval from 'enabled', a passing prose matcher or a stored correct flag.
export const FOOD_TESTS_QA_TOPIC='bio-y8-food-tests';
export const FOOD_TESTS_QA_HOLD_IDS=Object.freeze([
  "bio-y8-food-tests-iodine-solution-mc",
  "bio-y8-food-tests-iodine-solution-name",
  "bio-y8-food-tests-iodine-solution-explain",
  "bio-y8-food-tests-benedict-s-solution-mc",
  "bio-y8-food-tests-benedict-s-solution-name",
  "bio-y8-food-tests-benedict-s-solution-explain",
  "bio-y8-food-tests-biuret-solution-mc",
  "bio-y8-food-tests-biuret-solution-name",
  "bio-y8-food-tests-biuret-solution-explain",
  "bio-y8-food-tests-ethanol-emulsion-test-mc",
  "bio-y8-food-tests-ethanol-emulsion-test-name",
  "bio-y8-food-tests-ethanol-emulsion-test-explain",
  "bio-y8-food-tests-blue-black-mc",
  "bio-y8-food-tests-blue-black-name",
  "bio-y8-food-tests-blue-black-explain",
  "bio-y8-food-tests-brick-red-mc",
  "bio-y8-food-tests-brick-red-name",
  "bio-y8-food-tests-brick-red-explain",
  "bio-y8-food-tests-lilac-or-purple-mc",
  "bio-y8-food-tests-lilac-or-purple-name",
  "bio-y8-food-tests-lilac-or-purple-explain",
  "bio-y8-food-tests-cloudy-white-emulsion-mc",
  "bio-y8-food-tests-cloudy-white-emulsion-name",
  "bio-y8-food-tests-cloudy-white-emulsion-explain",
  "bio-y8-food-tests-water-bath-mc",
  "bio-y8-food-tests-water-bath-name",
  "bio-y8-food-tests-water-bath-explain",
  "bio-y8-match-food-tests-food-test-reagents-1",
  "bio-y8-match-food-tests-food-test-results-1",
  "bio-y8-app-benedicts-method",
  "bio-y8-app-food-test-match",
  "bio-y8-app-iodine-negative",
  "bio-y8-app-ethanol-safety",
  "bio-y8-food-tests-case-20261025-1-1",
  "bio-y8-food-tests-case-20261025-1-2",
  "bio-y8-food-tests-case-20261025-1-3",
  "bio-y8-food-tests-case-20261025-1-4",
  "bio-y8-food-tests-case-20261025-1-5",
  "bio-y8-food-tests-case-20261025-1-6",
  "bio-y8-food-tests-case-20261025-1-7",
  "bio-y8-food-tests-case-20261025-1-8",
  "bio-y8-food-tests-case-20261025-1-9",
  "bio-y8-food-tests-case-20261025-1-10",
  "bio-y8-food-tests-case-20261025-1-11",
  "bio-y8-food-tests-case-20261025-1-12",
  "bio-y8-food-tests-case-20261025-1-13",
  "bio-y8-food-tests-case-20261025-1-14",
  "bio-y8-food-tests-case-20261025-1-15",
  "bio-y8-food-tests-case-20261025-1-16",
  "bio-y8-food-tests-case-20261025-2-1",
  "bio-y8-food-tests-case-20261025-2-2",
  "bio-y8-food-tests-case-20261025-2-3",
  "bio-y8-food-tests-case-20261025-2-4",
  "bio-y8-food-tests-case-20261025-2-5",
  "bio-y8-food-tests-case-20261025-2-6",
  "bio-y8-food-tests-case-20261025-2-7",
  "bio-y8-food-tests-case-20261025-2-8",
  "bio-y8-food-tests-case-20261025-2-9",
  "bio-y8-food-tests-case-20261025-2-10",
  "bio-y8-food-tests-case-20261025-2-11",
  "bio-y8-food-tests-case-20261025-2-12",
  "bio-y8-food-tests-case-20261025-2-13",
  "bio-y8-food-tests-case-20261025-2-14",
  "bio-y8-food-tests-case-20261025-2-15",
  "bio-y8-food-tests-case-20261025-2-16",
  "bio-y8-food-tests-case-20261025-3-1",
  "bio-y8-food-tests-case-20261025-3-2",
  "bio-y8-food-tests-case-20261025-3-3",
  "bio-y8-food-tests-case-20261025-3-4",
  "bio-y8-food-tests-case-20261025-3-5",
  "bio-y8-food-tests-case-20261025-3-6",
  "bio-y8-food-tests-case-20261025-3-7",
  "bio-y8-food-tests-case-20261025-3-8",
  "bio-y8-food-tests-case-20261025-3-9",
  "bio-y8-food-tests-case-20261025-3-10",
  "bio-y8-food-tests-case-20261025-3-11",
  "bio-y8-food-tests-case-20261025-3-12",
  "bio-y8-food-tests-case-20261025-3-13",
  "bio-y8-food-tests-case-20261025-3-14",
  "bio-y8-food-tests-case-20261025-3-15",
  "bio-y8-food-tests-case-20261025-3-16",
  "bio-y8-food-tests-case-20261025-4-1",
  "bio-y8-food-tests-case-20261025-4-2",
  "bio-y8-food-tests-case-20261025-4-3",
  "bio-y8-food-tests-case-20261025-4-4",
  "bio-y8-food-tests-case-20261025-4-5",
  "bio-y8-food-tests-case-20261025-4-6",
  "bio-y8-food-tests-case-20261025-4-7",
  "bio-y8-food-tests-case-20261025-4-8",
  "bio-y8-food-tests-case-20261025-4-9",
  "bio-y8-food-tests-case-20261025-4-10",
  "bio-y8-food-tests-case-20261025-4-11",
  "bio-y8-food-tests-case-20261025-4-12",
  "bio-y8-food-tests-case-20261025-4-13",
  "bio-y8-food-tests-case-20261025-4-14",
  "bio-y8-food-tests-case-20261025-4-15",
  "bio-y8-food-tests-case-20261025-4-16",
  "bio-y8-food-tests-application-20261025-sample-separation",
  "bio-y8-food-tests-application-20261025-iodine-repeat",
  "bio-y8-food-tests-application-20261025-benedict-no-heat",
  "bio-y8-food-tests-application-20261025-negative-sugar",
  "bio-y8-food-tests-application-20261025-positive-sugar",
  "bio-y8-food-tests-application-20261025-biuret-control",
  "bio-y8-food-tests-application-20261025-iodine-control",
  "bio-y8-food-tests-application-20261025-repeatability",
  "bio-y8-food-tests-application-20261025-cross-contamination",
  "bio-y8-food-tests-application-20261025-ethanol-emulsion-stages",
  "bio-y8-food-tests-application-20261025-ethanol-ventilation",
  "bio-y8-food-tests-application-20261025-benedict-hot-tube",
  "bio-y8-food-tests-application-20261025-protein-extraction",
  "bio-y8-food-tests-application-20261025-starch-extraction",
  "bio-y8-food-tests-application-20261025-fair-amount",
  "bio-y8-food-tests-application-20261025-fair-reagent",
  "bio-y8-food-tests-application-20261025-sugar-strength",
  "bio-y8-food-tests-application-20261025-cloudy-not-protein",
  "bio-y8-food-tests-application-20261025-starch-vs-glucose",
  "bio-y8-food-tests-application-20261025-sugar-vs-starch",
  "bio-y8-food-tests-application-20261025-biuret-vs-sugar",
  "bio-y8-food-tests-application-20261025-lipid-vs-starch",
  "bio-y8-food-tests-application-20261025-all-negative",
  "bio-y8-food-tests-application-20261025-retest-ethanol",
  "bio-y8-food-tests-application-20261025-glassware",
  "bio-y8-food-tests-application-20261025-eyes",
  "bio-y8-food-tests-application-20261025-heat-variable",
  "bio-y8-food-tests-application-20261025-no-taste",
  "bio-y8-food-tests-application-20261025-recording",
  "bio-y8-food-tests-application-20261025-inference",
  "bio-y8-food-tests-application-20261025-weak-blueblack",
  "bio-y8-food-tests-application-20261025-temperature-safety",
  "bio-y8-food-tests-application-20261025-test-plan",
  "bio-y8-food-tests-application-20261025-positive-protein-negative-fat",
  "bio-y8-food-tests-application-20261025-result-not-proof",
  "bio-y8-food-tests-application-20261025-wrong-reagent",
  "bio-y8-food-tests-application-20261025-uncertain-emulsion",
  "bio-y8-food-tests-application-20261025-iodine-no-heat",
  "bio-y8-food-tests-application-20261025-safe-bunsen",
  "bio-y8-food-tests-application-20261025-unknown-analysis",
  "bio-y8-food-tests-application-20261025-sugar-analysis",
  "bio-y8-food-tests-application-20261025-negative-biuret",
  "bio-y8-food-tests-application-20261025-negative-emulsion",
  "bio-y8-food-tests-application-20261025-positive-benedict",
  "bio-y8-food-tests-application-20261025-starch-negative-colour",
  "bio-y8-food-tests-application-20261025-heating-method"
]);
const pending=new Set(FOOD_TESTS_QA_HOLD_IDS);
export function isFoodTestsQaHeld(value){
 const id=typeof value==='string'?value:String(value?.id||value?.questionId||'');
 const topic=value&&typeof value==='object'?String(value.topicId||''):'';
 return pending.has(id)||id===FOOD_TESTS_QA_TOPIC||id.startsWith('bio-y8-food-tests-')||topic===FOOD_TESTS_QA_TOPIC;
}
export function canEarnFormalCredit(value){return !isFoodTestsQaHeld(value);}
// Pupil-facing result for an unapproved Food Tests answer. The prose matcher
// may be wrong, so it must not be shown as correct or incorrect and must not
// reveal a model answer. Formal credit stays closed.
export function foodTestsPupilVerdict(value){
 if(!isFoodTestsQaHeld(value))return null;
 return {ok:false,practiceOnly:true,formalCredit:false,errorKind:'unmarked',score:null,total:null,pointResults:null,model:'Practice saved. Not a formal mark.'};
}

// A practice completion must never claim "saved" before iPad storage confirms.
// Preserve the existing draft on failure and let the pupil retry Finish.
export async function saveHeldPracticeCompletion(drafts,key,data,timeoutMs=3000){
 // Existing practice-drafts.save(ce:true) DELETES the draft rather than
 // persisting it. Completion is stored under ce:false with a separate flag.
 if(!drafts||typeof drafts.save!=='function'||!key||
    data?.ce!==false||data?.unmarkedCompleted!==true)return false;
 // iPad Safari can leave an IndexedDB promise pending. Never show a false
 // success or trap Finish indefinitely; a timeout is a save failure.
 let timer;
 try{
  const maxWait=Math.max(1,Math.min(10000,Number(timeoutMs)||3000));
  const completed=await Promise.race([
   Promise.resolve().then(()=>drafts.save(key,data)),
   new Promise(resolve=>{timer=setTimeout(()=>resolve(false),maxWait)})
  ]);
  return completed===true;
 }catch{return false}
 finally{if(timer)clearTimeout(timer)}
}
