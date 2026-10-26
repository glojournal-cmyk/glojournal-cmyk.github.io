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
