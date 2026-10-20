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
    if (answer?.day !== date || answer?.dailyVocab !== subject ||
        !answer?.questionId || answer?.repair) continue;
    const id = String(answer.questionId);
    items[id] = !!items[id] || !!answer.correct;
  }
  const attempts = Object.keys(items).length;
  const correct = Object.values(items).filter(Boolean).length;
  return {
    subject, attempts, correct, target: DAILY_VOCAB_TARGET,
    passed: correct >= DAILY_VOCAB_TARGET,
    progress: Math.min(DAILY_VOCAB_TARGET, correct)
  };
}
