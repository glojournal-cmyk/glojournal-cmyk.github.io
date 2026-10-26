# Scholar's Garden — Question Bank P0/P1 Remediation Handoff
**Date:** 26 October 2026  
**Scope:** question-bank-only, isolated branch, no live deployment / learner progress edits.

## Authoritative baseline
- Repo `glojournal-cmyk/glojournal-cmyk.github.io` main commit `9f648f1936a7d47ceb05e0b0b9b12bd47bed9ea3`.
- GitHub Action: https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/40362960346 (completed SUCCESS; 254 topic JSON parsed).
- 254 topic JSON files; 15,496 question records; 14,311 initially nominally enabled/formal; 15,496 unique question IDs; **zero duplicate IDs**.
- 61 topics failed current Standard >=15 + independent-format screening; 21 qualified for Standard but not a >=20 nominal Mastery; 49 topics with >=20 enabled questions have no difficulty >=3; 121 *potential* exact content-fingerprint duplicate groups (not 121 proven inappropriate repeats).
- 60 standalone GCSE questions, 12 each for Biology, Chemistry, Physics, Latin and French. Available marks are 3, 4, 6, 10, 15 and 25; **no 1-mark or 2-mark questions**.
- All numeric eligibility counts above are **static and historic for the baseline run**, not actual learner-specific available slots. No claims of live iPad QA or a passed 30-day simulation.

## P1: two source-preserving targeted remediations on this branch
| Topic | Before | After | Change |
|---|---:|---:|---|
| Latin Y8 Case-role Introduction | 5, all multiple-choice | 20 | 11 independent short recall/application, 3 sentence translations, 1 two-mark explanation, retaining 5 MC |
| Biology Y8 Mixed Exam | 12, all term recall | 20 | 4 contextual applications + 4 4-mark rubric-based explanations, retaining original 12 |

No pre-existing question ID, answer, attempt, XP, schedule or user data was changed. Newly added questions have distinct IDs, linked source concept IDs, correct-answer records and marking instructions. QA scripts are at `tests/question-bank-20261026.test.mjs`. Supplementary authored questions are **not official exam questions**, and broader educational review is still required before merging or exposing to learners.

## Critical issues still awaiting treatment
1. Current Daily planner `assets/year8-daily-v2-20261018.js` still uses 27 Year7/8 + 3 Year9 vocab and 15-question Year9; no Proposal-specified Daily GCSE slot. Proposal v1.1 targets 25+5 each language, Year9 20, GCSE 3 and 163 total.
2. The existing `curriculumTopics()` minimum of 15 blocks some perfectly valid 10-question Standard sets, and `masteryEligible` tests catalog `enabled>=20` **before** removing already-correct, not-yet-due or same-day reserved questions. This can still result in impossible Daily quotas after this patch.
3. Topic content volume cannot determine quality. Recognition-heavy variants, unrelated mark-point "definition" questions and repeated content need human moderation. Deep, source-grounded tasks should replace, not merely inflate, easy MC sets.
4. Spaced Retention must draw 10 questions from **genuine prior-date learning history**, with a clear partial-ready policy when history is insufficient. Existing weakness/due fallback is not evidence of 10 eligible historic recalls.
5. GCSE 1-, 2-, 3-mark task must have an independent, reviewed, board-aligned question pool, answer criteria and separate 3/3 vs x/6 display. Standalone exam-practice is not yet the Daily selector.
6. Cross-task deduplication must use ID + robust question-family/fingerprint reservations, not only different Topic IDs; 121 duplicate-fingerprint groups require manual adjudication.
7. 30-day replay must account for learner taught flags, past correct answers, mode eligibility, due review, all 10 quotas, iPad persistence, stored scores, and a fallback when a bank is exhausted. A generic repository inventory cannot certify it.
8. Do not introduce the 163-task engine into production until Mastery pass/recall/complete and GCSE partial-credit policies are finalized.

## Reproducible QA
```sh
node --check scripts/question-bank-audit-20261026.mjs
node --test tests/question-bank-20261026.test.mjs
node scripts/question-bank-audit-20261026.mjs --strict --output qa-reports/question-bank-inventory-20261026.json
```
A dedicated, read-only GitHub Action uploads the complete JSON inventory as a non-site artifact. Its workflow is restricted to the audit branch. Checks are reported as passed only when the corresponding current-head run has actually completed successfully.

## Priority for next changes
- **P0 remaining:** classify the 61 unavailable and 21 borderline topics by actual current-Daily use; produce dynamic learner-specific eligibility simulation (with a sanitised backup).
- **P1:** address highest-frequency taught topics that block quotas; expand actual application depth, not question count alone; adjudicate duplicate groups.
- **P2:** integrate an all-task allocation/preflight engine plus a board-reviewed GCSE bank; run 30 synthetic dates and controlled iPad acceptance before considering merge/deploy.

**Release gate:** Keep PR in draft until completeness of 163-question allocation, updated learning policy, academic marking, data migration and iPad recovery have all been explicitly verified.

## Round 2 — 26 October 2026, additional P0/P1 remediation

Three previously under-capacity Year 8 Biology topics were expanded (original questions and stable IDs preserved):

| Topic | Before | Added | After | Educational change |
|---|---:|---:|---:|---|
| `bio-y8-continuous-variation` | 13 | 7 | 20 | Continuous variables; histogram, frequency, polygenic/environmental reasoning |
| `bio-y8-correlation` | 13 | 7 | 20 | Paired data, scatter plots, outliers, correlation vs causation |
| `bio-y8-ber` | 10 | 10 | 20 | 6 numerical exercises, 4 multi-mark evaluations, correct units and dimensional reasoning |

Both rounds combined add **47** question records across **5** topics: 15 Latin case role, 8 Biology mixed, 7 Biology continuous variation, 7 Biology correlation, 10 Biology BER. Structural checks and test specifications exist in `tests/question-bank-20261026-round2.test.mjs`.

**Important:** This makes these five topics nominally eligible for the existing >=15 and >=20 static thresholds; it does **not** guarantee sufficient *fresh* or *past-attempted* questions for every actual date or task. These additional questions are supplemental authored content requiring academic approval and manual marking verification before exposure to learners.

### P0 learner-state diagnostic (not connected to production)

`src/lib/daily/question-eligibility-diagnostics-20261026.mjs` takes *sanitised* question/answer state and classifies exclusions: prior success, future review, incorrect topic/subject/year, status, and historical-only retention. It feeds the cross-task unique allocator and reports true quota shortfalls. The regression test uses **real Repo topic files** and covers:

- BER 20 nominal enabled, nine historical successes → 11 eligible; Mastery shortfall 9.
- Two Standard tasks asking for 15 answers each from the same 20-question topic → only 20 total question reservations, ten shortage.
- Retention without genuinely attempted earlier-date questions → zero eligible, no invented progress.
- Earlier-date attempts vs same-date attempts; not-yet-due review exclusion.
- Standalone GCSE bank still lacks 1-mark and 2-mark questions.

The prototype is **diagnostic only**: not wired into Scholar UI or current 165-task engine, and its use does not prove live iPad pass. Its assumptions may need adjustment when the 163-question daily business rules are frozen.

### QA caveats

The first action scan baseline succeeded on 254 original topic files. The rerun against latest modified head with new assertions may be queued. Final PASS must refer to the exact latest commit (not an older successful workflow).

Do not merge until academic and runtime QA have passed. Next work should target the remaining blocked topics by actual taught/assigned frequency, rather than bulk-padding every small topic.

### Scoring compatibility gate (additional critical discovery)

The actual current `assets/quiz-session-rWAnuDVj.js` science rubric renderer uses `answer.markPoints.join('; ')` and passes each point as text to the matching function. Accordingly, all 17 newly authored `mark_points` questions in five improved topics were normalized to an **array of strings**, with `totalMarks` equal to string count. Tests now fail on object-shaped mark points. This addresses schema compatibility only; automatic semantic scoring of paraphrases must still be validated manually with correct and borderline wrong answers before merging.

**Latest check:** five repaired files read back from GitHub, 47 new questions, all questions have unique IDs and answer keys; 17/17 supplemental `mark_points` rubrics are string arrays. This read-back is NOT a substitute for latest-head Actions passing.
