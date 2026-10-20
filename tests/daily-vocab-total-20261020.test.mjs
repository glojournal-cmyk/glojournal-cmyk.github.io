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

test("real iPad regression: 13 saved ledger items but 30 marked answers must show 30", () => {
  const items = Object.fromEntries(Array.from({length: 13}, (_,i)=>["fr-"+i,true]));
  const formalAttemptLog = Array.from({length: 30}, (_,i)=>({
    day, subject:"french", dailyVocab: i < 28 ? "french" : null,
    dailyTaskId:"french-vocab", questionId:"fr-"+i, correct:true, formal:true
  }));
  const x={today:day,dailyVocabByDay:{[day]:{french:{items}}},formalAttemptLog,
    daily:[{id:"french-vocab",planDate:day,target:30,progress:13}]};
  assert.equal(dailyVocabTotal(x,"french",day).progress,30);
  assert.equal(dailyVocabTotal(x,"latin",day).progress,0);
});

test("old same-day Daily Record credits survive missing vocabulary ledger", () => {
  const x={today:day,dailyVocabByDay:{[day]:{french:{items:{"fr-1":true}}}},
    dailyLog:{[day]:{tasks:[{id:"french-vocab",target:30,progress:30}]}},
    daily:[{id:"french-vocab",planDate:day,target:30,progress:13}]};
  assert.equal(dailyVocabTotal(x,"french",day).progress,30);
  assert.equal(dailyVocabTotal({...x,today:"2026-10-21"},"french","2026-10-21").progress,0);
});

test("do not accept unassigned subject, wrong date, repair, informal or Recovery", () => {
  const x={today:day,formalAttemptLog:[
    {day,subject:"physics",dailyTaskId:"french-vocab",questionId:"a",correct:true},
    {day,subject:"french",dailyTaskId:"french-vocab",questionId:"b",correct:true,repair:true},
    {day,subject:"french",dailyTaskId:"french-vocab",questionId:"c",correct:true,formal:false},
    {day,subject:"french",dailyTaskId:"french-vocab",questionId:"d",correct:true,recoveryFor:"2026-10-19"},
    {day:"2026-10-19",subject:"french",dailyTaskId:"french-vocab",questionId:"e",correct:true},
    {day,subject:"french",dailyTaskId:"french-vocab",questionId:"real",correct:true}
  ]};
  assert.equal(dailyVocabTotal(x,"french",day).progress,1);
});
