// Shared, evidence-based total for the two Year 7–8 Daily Vocabulary tasks.
// Session scores must never replace this count. Each question ID earns daily
// credit at most once, and a later wrong answer cannot erase earlier credit.
export const DAILY_VOCAB_TARGET = 30;

export function dailyVocabTotal(state = {}, subject, day) {
  const date = day || state.today;
  const row = state.dailyVocabByDay?.[date]?.[subject] || {};
  const items = { ...(row.items && typeof row.items === "object" ? row.items : {}) };
  // Merge dated formal answers into the day-specific ledger. This also
  // restores genuine answers saved before the dedicated vocabulary ledger.
  for (const answer of state.formalAttemptLog || []) {
    // Older saved quizzes recorded the task ID but not dailyVocab.
    const assigned = answer?.dailyVocab === subject ||
      (answer?.dailyTaskId === subject + "-vocab" && answer?.subject === subject);
    if (answer?.day !== date || !assigned || !answer?.questionId ||
        answer?.repair || answer?.recoveryFor || answer?.formal === false) continue;
    const id = String(answer.questionId);
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
  const verifiedExtras=Object.values(row.additionalCorrectIds||{}).filter(v=>v===true).length;
  const carried=Math.min(DAILY_VOCAB_TARGET,baseline+verifiedExtras);
  const attempts = Math.max(Object.keys(items).length, savedCorrect,carried);
  const correct = Math.max(Object.values(items).filter(Boolean).length, savedCorrect,carried);
  return {
    subject, attempts, correct, target: DAILY_VOCAB_TARGET,
    passed: correct >= DAILY_VOCAB_TARGET,
    progress: Math.min(DAILY_VOCAB_TARGET, correct)
  };
}
