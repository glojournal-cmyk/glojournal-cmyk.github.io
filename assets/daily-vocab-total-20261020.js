// Shared, evidence-based total for the two Year 7–8 Daily Vocabulary tasks.
// Session scores must never replace this count. Each question ID earns daily
// credit at most once, and a later wrong answer cannot erase earlier credit.
export const DAILY_VOCAB_TARGET = 30;

export function dailyVocabTotal(state = {}, subject, day) {
  const date = day || state.today;
  const row = state.dailyVocabByDay?.[date]?.[subject] || {};
  const splitPlan=(state.today===date?state.daily:state.dailyLog?.[date]?.tasks)||[];
  if(splitPlan.some(t=>t.id===subject+'-vocab' && t.vocabSplit===true)){
    const older=new Set(), newer=new Set(), attempts=new Set();
    const add=(concept,correct)=>{
      if(typeof concept!=='string')return;
      const bucket=concept.startsWith(subject+'-y8-vocab-')?older:
        concept.startsWith(subject+'-y9-vocab-')?newer:null;
      if(!bucket)return;
      attempts.add(concept);
      if(correct===true)bucket.add(concept);
    };
    for(const [concept,ok] of Object.entries(row.splitConcepts||{}))add(concept,ok);
    for(const a of state.formalAttemptLog||[]){
      if(a?.day!==date || a.dailyTaskId!==subject+'-vocab' || a.subject!==subject ||
         a.dailyVocab!==subject || a.formal!==true || a.repair || a.recoveryFor ||
         a.assisted || a.hintUsed || a.scaffolded || typeof a.correct!=='boolean')continue;
      add(a.vocabConcept,a.correct);
    }
    const correct=Math.min(20,older.size)+Math.min(10,newer.size);
    return {subject,vocabSplit:true,attempts:attempts.size,correct,target:30,passed:correct===30,progress:correct};
  }
  const items = { ...(row.items && typeof row.items === "object" ? row.items : {}) };
  const concepts = { ...(row.conceptByQuestion || {}) };
  const conceptKey = id => concepts[id] || id;
  // Merge dated formal answers into the day-specific ledger. This also
  // restores genuine answers saved before the dedicated vocabulary ledger.
  for (const answer of state.formalAttemptLog || []) {
    // Older saved quizzes recorded the task ID but not dailyVocab.
    const assigned = answer?.dailyVocab === subject ||
      (answer?.dailyTaskId === subject + "-vocab" && answer?.subject === subject);
    if (answer?.day !== date || !assigned || !answer?.questionId ||
        (answer?.subject && answer.subject !== subject) ||
        (answer?.dailyTaskId && answer.dailyTaskId !== subject + "-vocab") ||
        (answer?.dailyVocab && answer.dailyVocab !== subject) ||
        answer?.recoveryFor || answer?.formal === false ||
        answer?.repair === true ||
        typeof answer.correct !== "boolean") continue;
    const id = String(answer.questionId);
    if (typeof answer.vocabConcept === 'string' && answer.vocabConcept) concepts[id] = answer.vocabConcept;
    // Once an answer is correct, later incorrect submissions never erase it.
    items[id] = !!items[id] || !!answer.correct;
  }
  // Do not erase a correct count the iPad has ALREADY saved in today's
  // original Daily Task or dated Daily Record. These are lower bounds only,
  // never guesses based on visits, XP, unrelated topics, or another date.
  const taskId = subject + "-vocab";
  const earlier = [
    ...(state.today === date ? (state.daily || []).filter(t =>
      t?.id === taskId && t.planDate === date) : []),
    ...((state.dailyLog?.[date]?.tasks || []).filter(t => t?.id === taskId))
  ];
  const savedCorrect = Math.min(DAILY_VOCAB_TARGET, earlier.reduce((max, t) =>
    Math.max(max, Math.max(0, Number(t.progress) || 0)), 0));
  // Legacy iPad saves sometimes retained 29/30 in Daily/dated tasks, but
  // discarded most of the question-ID ledger on quota failure. The live
  // marker records only NEW, actually correct question IDs after a frozen
  // pre-answer baseline. Repeated IDs can never add a second credit.
  const baseline=Math.max(0,Math.min(DAILY_VOCAB_TARGET,Number(row.baselineProgress)||0));
  const verifiedExtras=new Set(Object.entries(row.additionalCorrectIds||{})
    .filter(([,ok])=>ok===true).map(([id])=>conceptKey(id))).size;
  const carried=Math.min(DAILY_VOCAB_TARGET,baseline+verifiedExtras);
  const attempts = Math.max(new Set(Object.keys(items).map(conceptKey)).size, savedCorrect,carried);
  const correct = Math.max(new Set(Object.keys(items).filter(id=>items[id]).map(conceptKey)).size, savedCorrect,carried);
  return {
    subject, attempts, correct, target: DAILY_VOCAB_TARGET,
    passed: correct >= DAILY_VOCAB_TARGET,
    progress: Math.min(DAILY_VOCAB_TARGET, correct)
  };
}
