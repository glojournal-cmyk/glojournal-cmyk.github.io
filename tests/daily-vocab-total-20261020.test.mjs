import test from "node:test";
import assert from "node:assert/strict";
import {dailyVocabTotal} from "../assets/daily-vocab-total-20261020.js";

const day = "2026-10-20";
const words = (count, start = 1) => Object.fromEntries(
  Array.from({length: count}, (_, index) => ["latin-" + (start + index), true])
);
const state = (items) => ({today: day, dailyVocabByDay: {[day]: {latin: {items}}}});

test("28 distinct correct words plus 2 more become 30, never 13", () => {
  const before = state(words(28));
  assert.equal(dailyVocabTotal(before, "latin", day).correct, 28);
  const after = state({...words(28), "latin-29": true, "latin-30": true});
  assert.equal(dailyVocabTotal(after, "latin", day).correct, 30);
  assert.equal(dailyVocabTotal(after, "latin", day).passed, true);
});

test("repeated IDs and later wrong attempts never subtract credit", () => {
  const old = state(words(28));
  old.formalAttemptLog = [
    {day, dailyVocab: "latin", questionId: "latin-1", correct: false},
    {day, dailyVocab: "latin", questionId: "latin-29", correct: true},
    {day, dailyVocab: "latin", questionId: "latin-29", correct: true},
    {day, dailyVocab: "latin", questionId: "latin-30", correct: true}
  ];
  const total = dailyVocabTotal(old, "latin", day);
  assert.equal(total.correct, 30);
  assert.equal(total.attempts, 30);
});

test("only the assigned subject, date, and non-repair answers count", () => {
  const x = state({"latin-1": true, "latin-2": false});
  x.formalAttemptLog = [
    {day, dailyVocab: "latin", questionId: "latin-2", correct: true, repair: true},
    {day, dailyVocab: "french", questionId: "fr-1", correct: true},
    {day: "2026-10-19", dailyVocab: "latin", questionId: "latin-3", correct: true},
    {day, dailyVocab: "latin", questionId: "latin-4", correct: true}
  ];
  assert.deepEqual(dailyVocabTotal(x, "latin", day).correct, 2);
  assert.equal(dailyVocabTotal(x, "latin", day).attempts, 3);
  assert.equal(dailyVocabTotal(x, "french", day).correct, 1);
});

test("an answer journal can restore daily credit lost from the dedicated ledger", () => {
  const x = {today: day, formalAttemptLog: [
    {day, dailyVocab: "french", questionId: "fr-1", correct: true},
    {day, dailyVocab: "french", questionId: "fr-2", correct: false},
    {day, dailyVocab: "french", questionId: "fr-2", correct: true}
  ]};
  assert.equal(dailyVocabTotal(x, "french", day).correct, 2);
  assert.equal(dailyVocabTotal(x, "french", day).attempts, 2);
});
