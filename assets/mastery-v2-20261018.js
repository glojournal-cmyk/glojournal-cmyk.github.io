// Year 8 learning evidence. Historical records are read, never rewritten.
export const independentRecallFormats = new Set([
  'typed_exact', 'typed_short', 'typed_equivalent', 'spelling_restore',
  'controlled_translation', 'mark_points', 'extended_response',
  'practical_design', 'calculation', 'unordered_set'
]);

export function coveredTopic(state, topicId) {
  if (state?.topicStats?.[topicId]?.coveredAt) return true;
  if (masteryStage(state?.topicStats?.[topicId]) === 'mastered') return true;
  // Older releases did not store a separate coverage marker. Ten actual formal
  // answers in their topic statistics are sufficient legacy evidence.
  return Number(state?.topicStats?.[topicId]?.attempted || 0) >= 10;
}

export function masteryStage(stat = {}) {
  if (stat.masteryV2?.stage === 'mastered' ||
      (!stat.masteryV2 && stat.state === 'mastered')) return 'mastered';
  return stat.masteryV2?.stage || 'learning';
}

export function addMasteryEvidence(stat = {}, entry = {}) {
  const current = stat.masteryV2 || {};
  if (!entry.questionId || entry.formal === false || entry.repair || entry.recoveryFor ||
      Number(entry.year) !== 8) return current;
  const day = entry.day;
  const mode = entry.mode;
  const id = String(entry.questionId);
  if (mode === 'mastery' || mode === 'year8long') {
    if (current.stage === 'mastered' || current.stage === 'check2' || current.stage === 'check7') return current;
    // Two assigned Year 8 Daily Mastery sets now contain 20 distinct answers.
    // Keep an already-started 15-question set on its original 13/15 rule;
    // never invalidate genuine work saved on an older iPad.
    const target = [15, 20].includes(Number(current.roundTarget))
      ? Number(current.roundTarget)
      : Number(entry.masteryTarget) === 15 ? 15 : 20;
    const requiredCorrect = target === 15 ? 13 : 17; // at least 85%, plus recall
    // Count distinct marked events even when a quiz presents a question twice.
    // Never double-count the same persisted event after an iPad reload.
    const eventId = String(entry.attemptId || (entry.at ? `${id}@${entry.at}` : id));
    const attempts = [...(current.attempts || [])];
    if (attempts.some(row => row.id === eventId)) return current;
    attempts.push({id: eventId, questionId: id, correct: !!entry.correct, independent: !!entry.correct && independentRecallFormats.has(entry.format)});
    const round = attempts.slice(-target);
    if (round.length < target) return {...current, stage: 'learning', roundTarget: target, attempts: round};
    const passed = round.filter(row => row.correct).length >= requiredCorrect &&
      round.filter(row => row.independent).length >= 3;
    return passed ? {stage: 'check2', attempts: [], passedMasteryAt: day, passedMasteryTarget: target, due: shift(day, 2), checks: []}
      : {stage: 'learning', attempts: [], roundTarget: target, lastMasteryAttempt: day};
  }
  if (!['retention', 'due'].includes(mode) || !['check2', 'check7'].includes(current.stage) ||
      !current.due || day < current.due) return current;
  const checks = current.checkDay === day ? [...(current.checks || [])] : [];
  if (checks.some(row => row.id === id)) return current;
  checks.push({id, correct: !!entry.correct});
  if (checks.length < 5) return {...current, checkDay: day, checks};
  const passed = checks.filter(row => row.correct).length >= 4;
  if (passed && current.stage === 'check2') return {...current, stage: 'check7', due: shift(day, 5), checkDay: null, checks: [], passedTwoDayAt: day};
  if (passed) return {...current, stage: 'mastered', due: null, checkDay: null, checks: [], masteredAt: day};
  return {...current, stage: 'needs-reinforcement', due: null, checkDay: null, checks: [], failedCheckAt: day};
}

function shift(day, amount) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function eligibleFreshQuestions(items, state, mode = 'standard', day = state?.today) {
  if (['due', 'retention', 'weak', 'mistakes'].includes(mode)) return items;
  return items.filter(q => !Number(state?.seenCorrect?.[q.id] || 0) &&
    !(state?.reviews?.[q.id]?.due && state.reviews[q.id].due > day));
}
