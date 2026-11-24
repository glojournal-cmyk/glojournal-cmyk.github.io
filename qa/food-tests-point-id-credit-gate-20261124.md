# Food Tests PR #308 — P0 candidate mark-point ID formal-credit gate regression

**QA date:** 24 November 2026  
**Branch:** `qa/p0-eligibility-2e556ff`, PR #308 **Draft**.  
**Release Gate:** **BLOCKED — 0/143 original questions and 0/99 structured candidates formally approved**.

## Defect discovered

The held original bank contains **143 distinct question IDs**. The unapproved structured MCQ prototype converts the original 52 prose questions into **99 separately identifiable mark points**, using `sourceQuestionId::p1`, `::p2` and `::p3` IDs.

The former `isFoodTestsQaHeld` gate recognised exact original IDs, `bio-y8-food-tests-` prefixed IDs, or an explicit topic ID. It did not reduce the `::pN` suffix to its source ID before checking. Five candidate points were especially vulnerable because their parent original IDs begin **`bio-y8-app-`** instead of the usual `bio-y8-food-tests-`:

- `bio-y8-app-benedicts-method::p1`
- `bio-y8-app-benedicts-method::p2`
- `bio-y8-app-benedicts-method::p3`
- `bio-y8-app-ethanol-safety::p1`
- `bio-y8-app-ethanol-safety::p2`

The structured concept-choice scorer independently returns `formalCreditEligible: false`, so **this discovery is a potential future direct-ID routing bypass, not evidence that any actual learner was given unauthorised Daily/MP/Mastery credit**. The parent question remained held.

## Minimal fail-closed correction in QA branch only

`assets/food-tests-qa-credit-gate-20261122.js` now checks all available object identity fields separately (`id`, `questionId`, `pointId`, `sourceId`) and derives the original source ID from each structured `::` suffix. A wrapper object cannot hide a held `sourceId` behind an unrelated `id`. Exact original source-ID matching, Food Tests prefix matching and explicit `topicId` hold remain in effect. Unrelated questions and years are not intentionally held by this change.

`tests/food-tests-qa-credit-hold-20261122.test.mjs` now requires a formal hold on all **99 point IDs**, all **52 source-linked candidate group objects**, ID-only / point-object / source-only / wrapper-object forms, and the five formerly unrecognised `bio-y8-app-...::pN` entries. It tests that even artificially supplied `correct:true, formal:true` outcomes cannot create verified Daily slots or change the Mastery state for the five particularly vulnerable points.

## Evidence and limits

A separate direct execution of the exact updated GitHub hold-module logic against the current source and structured candidate JSON performed **448 candidate credit-gate checks: 448 passed / 0 escaped**, with all 143 original bank IDs present and unrelated Maths sample allowed. This is source-bound unit-level evidence, not a claim of an actual iPad PWA or end-to-end Daily Tasks acceptance. GitHub Actions must still complete on this head; independent Academic QA of sole keys/distractors, TGS taught-scope review and real iPad acceptance remain outstanding.

**No question IDs, options, answers, school progress, learner history or live `main` were changed. No PR merge or deployment.**
