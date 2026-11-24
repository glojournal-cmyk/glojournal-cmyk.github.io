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

## Additional confirmed wrapped-Mastery bypass — 24 November 2026

A second QA-branch test reproduced an actual in-memory scoring state mutation (not a production student record change). Given a fabricated wrapper submission with `questionId:'display-wrapper-id'`, `sourceId:'bio-y8-app-ethanol-safety'`, `formal:true` and `correct:true`, the *old* `addMasteryEvidence` returned a state with **one new attempt** because it checked only `isFoodTestsQaHeld(entry.questionId)`, ignoring the held source ID on the entry itself.

**QA-only remediation:** `assets/mastery-v2-20261018.js` now calls `isFoodTestsQaHeld(entry)` to check all ID forms. The hold gate also checks each of `id`, `questionId`, `sourceId` and `pointId` independently so even an unrelated wrapper identifier cannot mask the held original. This retains the existing guard for unrelated subjects.

**Direct actual-code checks** from current GitHub files, separate from a real iPad:
- All **99** structured source point IDs as regular submissions: no Mastery credit.
- All **99** point IDs as *wrapped entries with unrelated question IDs*: no Mastery attempts (99/99).
- Wrapper object carrying held `sourceId` or held `pointId` as the question in `verifiedQuizSlots`: no Daily credit.
- Unrelated biology/Mastery and unrelated Daily identifiers still follow their normal paths, rather than being globally blocked.

Added regression assertions to `tests/food-tests-qa-credit-hold-20261122.test.mjs` so CI must check all 99 point identifiers, 52 candidate group sources and both fabricated wrapper bypasses. This demonstrates a **potential future import/routing credit vulnerability** identified using fabricated data, **not evidence any real pupil's stored points had changed**.

Approval remains 0/143 source and 0/99 candidate. All score/release gates remain BLOCKED, PR #308 Draft; no merge, deployment or history rewrite.


## Additional confirmed Daily reconciliation bypasses — 24 November 2026

A targeted adversarial check found that an archived formal answer event could use an unrelated `questionId:'display-wrapper-id'` with a held Food Tests `sourceId:'bio-y8-app-ethanol-safety'` and a different assigned Biology topic. The previous Daily journal reconciliation checked `isFoodTestsQaHeld(event.questionId)` and **in the fabricated state increased progress from 0/10 to 1/10**.

A second fabricated case exposed the same risk on the fresh submitted-answer path: a generic question `id:'display-wrapper-id'` accompanied by an answer with held Food Tests `sourceId` was treated as a verified slot and increased progress **0/10 → 1/10**.

**Corrections (QA branch only):**
- `assets/daily-session-credit-20261021.js` checks the **entire answer object** inside `verifiedQuizSlots` and before Daily session answer verification, plus in its later correct-answer aggregation.
- The same module checks the **entire journal event object** in `formalAttemptLog` instead of considering only `event.questionId`.
- The full ID gate recognises `id`, `questionId`, `pointId`, `sourceId` and held `sourceId::pN` identifiers.

**Retested** against the actual GitHub Daily code with 99 held structured points wrapped as different-topic answers and journal events: no verified slots, no change in daily progress, and no modification to the original task. As a negative control, an unrelated Biology answer correctly increased progress. Also added the complete source-linked 99-case-per-path regression into `tests/food-tests-qa-credit-hold-20261122.test.mjs`.

**Classification:** Confirmed *synthetic-data credit-path weakness*, not evidence of real student misuse, live app release, or stored learner marks changing. The fixes are in **unmerged Draft QA PR #308** only. They are required for future candidate imports but do not approve the science, questions, Daily mappings, or PWA player. Formal Academic Approval remains **0/143** original sources and **0/99** candidate points.


## Safari receipt sanitization boundary — 24 November 2026

The compact receipt converter `sanitized(source,task)` in `assets/daily-completed-session-receipts-20261024.js` originally copied the visible question `id` and answer `questionId` but **discarded original `sourceId` and `pointId` metadata**. That meant a wrapped held Food Tests answer could lose its only visible held-source identification **before** subsequent Daily credit verification, including Safari retry / fallback storage. This was a further potential future import loophole; no evidence of a real pupil saved receipt being affected.

The QA branch now **fails closed before sanitization** if any source question or answer is held under its original ID, point ID, source ID, or Food Tests topic. The synchronous Biology single-answer fallback also explicitly checks the entire answer object. This avoids persisting a compact record with critical QA hold provenance silently removed.

`tests/food-tests-qa-credit-hold-20261122.test.mjs` now covers three concrete wrapped-meta cases in **both** `saveVerifiedBiologyAnswerSync` and `saveCompletedDailyReceipt`, verifying that both paths refuse the held records before any persistence attempt. This is code-level defensive evidence, not actual IndexedDB/iPad acceptance.

**Combined P0 scope:** 99 source mark-point IDs, 52 group objects, wrapper-identified Mastery entries, immediate and journal Daily evidence, plus Safari compact receipt paths. Approval **0/143** original bank and **0/99** candidate MCQ points; no merge/deploy/student-history changes.
