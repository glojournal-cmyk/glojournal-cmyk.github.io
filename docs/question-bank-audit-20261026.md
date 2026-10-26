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

## Round 3 — six Year 8 Biology Mastery-size gaps closed on draft branch

| Topic | Original | Added | New nominal total |
|---|---:|---:|---:|
| DNA Structure | 18 | 2 | 20 |
| Fats & Cholesterol | 19 | 1 | 20 |
| Genetic Disorders | 15 | 5 | 20 |
| Nutrition Labels | 16 | 4 | 20 |
| Practical Conclusions | 16 | 4 | 20 |
| Punnett Squares | 17 | 3 | 20 |

**Round 3 new = 19 questions; rounds 1–3 total = 66 new questions across 11 topic files.** Original question objects and IDs remain byte-for-byte equivalent after parsing. Manual read-back structural QA has found no duplicate IDs, missing answer objects, bad supplemental mark-point arrays, or incorrect automatic numeric mark counts for the 11 changed files. Automated GitHub Actions on the latest head must still independently pass.

The six previously undersized topics now each meet the existing **nominal** 20-question Mastery gate, but a new mastery session can still have fewer than 20 eligible questions once history and overlap exclusions apply. **Do not claim these topics are daily-ready until the global eligibility preflight passes with learner-specific history.**

### Scoring contract correction
- All newly authored `mark_points` questions use `answer.markPoints` as **plain strings**, not objects, consistent with the live quiz grader's assumption.
- Six earlier BER numeric questions were corrected from `totalMarks=2` to `totalMarks=1`: the current automatic numerical scorer awards final-answer credit as one mark, not method marks. New nutrition-label numeric questions follow the same rule. GCSE multi-mark calculation scoring remains a separate development requirement.
- Correct long-answer synonyms and borderline wrong answers have **not** yet been browser-tested. Structural mark-schema QA must never be described as verified semantic marking.

### Mastery headroom reporting
The read-only audit now reports whether a nominally Mastery-eligible topic has five or ten additional enabled questions beyond the 20-slot quota (`>=25` or `>=30`). These are **synthetic stock scenarios only**; real eligibility also depends on student history, due dates, currently taught topics, IDs and conceptual overlap. At exactly 20 enabled questions there is no capacity reserve.

### Work remaining in priority order
1. Run latest-head GitHub Actions (all round-one, -two, -three, allocation and eligibility suites) and respond to actual failures.
2. Rank all remaining blocked/marginal topics by current taught and daily-assignment frequency; do not indiscriminately pad banks that aren't in the learner's curriculum.
3. Validate actual grading of new short-, long- and numeric-answer questions with plausible paraphrases and mistakes; ensure semantically correct responses do not fail due to strict matching.
4. Develop genuine daily 1-, 2-, 3-mark GCSE bank, with validated source and paper board mapping, then build 163-slot plan allocation; no live deployment until accepted.
5. Model 30 days with genuine or sanitised state, iPad persistence/recovery and idempotent scoring before merging.

**Safety:** Draft PR #172 remains unmerged. No production `main` code, live data, student answers, XP or deployment modified.

## Round 4 — Mastery actual-availability topic picker (independent prototype)

A new **read-only, not imported by the production app** `src/lib/daily/mastery-capacity-picker-20261026.mjs` diagnoses the full learner-aware availability of each *taught Year 8* Mastery topic, requiring **20 currently eligible questions per slot** rather than trusting the topic's `enabled >= 20` metadata. It calls the global conflict-free allocator so two different topics must yield **40 distinct, non-overlapping question opportunities**. If this cannot be verified, it returns `NOT_READY` (or `NEEDS_REVIEW` if a bounded search limit is reached), **not fabricated completion**.

`tests/mastery-capacity-picker-20261026.test.mjs` covers: a nominal 20-item topic depleted by five old successes; pairwise duplicate content with different IDs; only one eligible topic; an untaught topic excluded from selection; and all pools exhausted by past success. The test is now part of the dedicated Action workflow. **It does not yet preserve/merge historic in-progress assignments or run live quiz grading.** Those are separate runtime integration/release gates.

The inventory also now records **Mastery reserve scenarios**: how many topics can still offer a 20-slot assignment after hypothetical five or ten prior correctly answered questions. Do not describe these static scenarios as the learner's real state or as results of the 30-day simulation.

**P0/P1 cumulative summary:** Eleven original topic files each now contain 20 enabled questions, 66 added in total; the user's progress database and the live website remain unchanged. This is *initial structural capacity*, **not** a guarantee of all ten 163-question Daily tasks. The GCSE 1/2/3 mark bank, full Daily task migration, student-state 30-day test, semantic grading and iPad acceptance remain uncompleted. Keep PR #172 in draft.
