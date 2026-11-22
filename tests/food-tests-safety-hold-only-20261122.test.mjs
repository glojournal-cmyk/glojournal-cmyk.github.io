import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FOOD_TESTS_QA_HOLD_IDS,isFoodTestsQaHeld,canEarnFormalCredit,foodTestsPupilVerdict} from '../assets/food-tests-qa-credit-gate-20261122.js';
import {verifiedQuizSlots,reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {saveVerifiedBiologyAnswerSync} from '../assets/daily-completed-session-receipts-20261024.js';
import {addMasteryEvidence} from '../assets/mastery-v2-20261018.js';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const bank = JSON.parse(read('content/topics/bio-y8-food-tests.json'));

test('Main Food Tests bank is held without changing question text', () => {
  assert.equal(bank.questions.length, 143);
  assert.deepEqual([...FOOD_TESTS_QA_HOLD_IDS].sort(), bank.questions.map((q) => q.id).sort());
  for (const question of bank.questions) {
    assert.equal(canEarnFormalCredit(question), false);
    const shown = foodTestsPupilVerdict(question);
    assert.equal(shown.errorKind, 'unmarked');
    assert.equal(shown.score, null);
    assert.equal(shown.formalCredit, false);
    assert.equal(/model answer|blue-black|brick-red/i.test(shown.model), false);
  }
  assert.equal(foodTestsPupilVerdict({id: 'unrelated-maths-item'}), null);
});

test('A correct Food Tests answer cannot add Daily credit, a receipt, or Mastery', () => {
  const q = bank.questions[0];
  assert.deepEqual(verifiedQuizSlots([q], [{questionId: q.id, correct: true, formal: true}]), []);
  const task = {id: 'y8-standard-a', planDate: '2026-11-22', assignedTopic: 'bio-y8-food-tests', assignedSubject: 'biology', assignedYear: 8, target: 10, progress: 3, done: false};
  const state = {today: '2026-11-22', daily: [task], formalAttemptLog: [], dailyLog: {}};
  const result = reconcileDailySession(state, {day: state.today, taskId: task.id, subject: 'biology', year: 8, mode: 'standard', questions: [q], answers: [{questionId: q.id, correct: true, formal: true}]});
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'academic-qa-hold');
  assert.equal(result.progress, 3);
  assert.equal(saveVerifiedBiologyAnswerSync(state, {day: state.today, taskId: task.id, subject: 'biology', year: 8, questions: [q], answers: [{questionId: q.id, correct: true, formal: true, repair: false}]}), false);
  const before = {masteryV2: {stage: 'seen'}};
  const after = addMasteryEvidence(before, {questionId: q.id, year: 8, formal: true, correct: true, day: '2026-11-22', mode: 'standard', format: 'typed_short'});
  assert.equal(after, before.masteryV2);
  assert.equal(isFoodTestsQaHeld('unrelated-maths-item'), false);
});

test('Quiz sessions hide the unreliable verdict and do not call the prose rubrics', () => {
  for (const file of ['assets/quiz-session-y8fix-20260920.js', 'assets/quiz-session-rWAnuDVj.js']) {
    const source = read(file);
    assert.equal(source.includes('foodTestsPupilVerdict'), true, file);
    assert.equal(source.includes('Practice saved. Not a formal mark.'), true, file);
    assert.equal(source.includes('scoreFoodTestsRemaining37'), false, file);
    assert.equal(source.includes('scoreFoodTestsGuarded'), false, file);
    assert.equal(source.includes('scoreFoodTestsEthanolSafety'), false, file);
    assert.equal(source.includes('!qaHeld&&x(Y.id,formalOk'), true, file);
    assert.equal(source.includes('...(G.practiceOnly?[]:G.ok?['), true, file);
  }
});
