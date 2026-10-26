# Daily V2 — QA and independent review handoff
**Initial isolated implementation tests: 158/158 passed in a V8 harness** (ledger 16, planner 29, storage 24, bank adapter 17, IndexedDB adapter 12, legacy review 16, simulator 14, continuity 12, day-summary 9, mastery-audit 9), 2026-10-26. Native Node/GitHub Actions completion and iPad testing are NOT verified. The following remain release acceptance criteria.

## Data reliability
- Verified credit is derived only from persisted answer events or explicitly preserved legacy baselines.
- Duplicate retry messages and repeated event IDs do not double credit.
- Corrupt / partial storage is reported, not mistaken for 0 correct.
- Quit / reload / offline / out-of-space / IndexedDB denial recover without silent score loss.
- Home / Recovery / 30-day / XP read the same reconciliation results.

## Question availability
- Vocab: 25 Y7–8 and 5 Y9 concepts; new cycle only after prior cycle exhausted; no same-day duplicate credit.
- Mastery A/B: 20 available questions, quality checked; no Standard gate; prefer distinct taught topics.
- Retention: 10 historical attempted question IDs; no unseen replacement; cross-day repetition permitted.
- GCSE: 3 exclusively authored exam questions with marks 1/2/3 and no wording duplicates elsewhere.
- All tasks: frozen assignments; no shortfall at end of session; wrong answers have retry provision.

## Regression cases
- French Vocab 28/30 -> 29/30 -> 30/30 persists on iPad.
- Biology/Physics reduced shortfall (12/15 or 8/15) remains finishable.
- 20/20 Mastery, Day 2/7 and Mastered ledger are logically distinct.
- 30 days high-achievement, 30 days low-achievement, all-vocab-completed cycling.
- One topic almost exhausted, two Masteries competing for an eligible topic.
- Partial legacy historical credits with missing per-question evidence, no fabrication.

## Independent review scope (Codex)
- Audit all writes and data migrations for integrity, races and replay.
- Audit bank-selection invariants and depth rubric, run automated tests.
- Check V2 does not import legacy patched planner or overwrite legacy data.
- Output review with reproducible failures and code-specific fixes, not generic summary.

## Browser review scope (Work / staging)
- Safari-like viewport/resume, visual navigation and keyboard interactions.
- Home vs task vs 30-day numbers after submit/reopen.
- Tests are staging-only. A cloud browser is not a real iPad hardware/browser persistence validation.

## Release gate
- Independent code and QA evidence; staged migration rehearsal; rollback verification; written approval before merge or prod cutover.

## Current execution evidence and limitations (2026-10-26)
- Ledger 16/16, deterministic ten-task planner 27/27, CAS storage contract 24/24, real-bank adapter 17/17, IndexedDB adapter 12/12, read-only legacy review 16/16, 30-day simulator 10/10. in JS V8 harness executing GitHub-committed source and tests.
- CI workflow on staging branch: `.github/workflows/daily-v2-tests.yml`; no verified Actions outcome yet. Browser/workspace cannot directly reach public GitHub via container git (DNS unavailable).
- Storage tests rely on in-memory repo, so they DO NOT establish iPad IndexedDB durability. No live Safari/real-device QA done.
- Real topic catalogs have not yet been normalized to explicit roles and certified depth bands; no Daily V2 plans from real bank have been proven ready.
- Mastery must be explicitly audited against past correct IDs; do not relax 20/depth gates to hide bank shortage.

## New release blockers and findings
- Real loaded bank has not yet received manually certified `roles`, `skill`, `depthBand` and appropriate rubrics; real 163-question readiness UNVERIFIED.
- IndexedDB adapter implemented, but fake-backed tests do not prove iPad Safari reliability, actual quota recovery, secure origin persistence or hardware restart behavior.
- Legacy 28/30 count with missing concept identities is preserved but **cannot yet safely progress** under ledger's opaque-baseline guard; reconciliation workflow is mandatory.
- Duplicate generic passage instructions are differentiated by actual stimulus text to avoid rejecting independent Latin translations.
- External Vercel build-rate-limit status is not relevant to V2 module tests; do not retry Vercel or claim CI green.

## 30-day proof limits and real-file findings
- Synthetic capacity stress passes 30 x 163 allocations. The 10 simulator tests also correctly block smaller Mastery banks after depletion; this is NOT real-student or real-bank evidence.
- Spot audit: 12 authentic enabled topic files, 594 question records, detailed in `QA_REAL_BANK_12_TOPIC_SAMPLE.md`. No source difficulty 3–4 in Latin adjective agreement (24 items), French present tense (52), French accuracy traps (50), or Biology balanced diet (39). Depth labels alone are not quality certification.
- Review-bound manifest fingerprints invalidate unreviewed changes. Certification authenticity and cognitive quality still need independent curriculum review.
- GCSE saved-mark ceiling must equal frozen 1/2/3-mark question ceiling, and correctness must match fully awarded marks.
- Caution: blocking all 10 tasks when ONE bank is short prevents broken halfway quizzes but also recreates an unusable Daily home experience. Define an explicit safe fallback before cutover; never pad with low-quality or double-counted items.

## Opaque historic credit safety extension
- Given an old 28/30 counter with unknown correct concept IDs, an independently verified frozen assignment universe allows safely crediting new concepts OUTSIDE all possibly credited previous concepts. New in-universe concepts remain uncredited pending reconciliation.
- Legacy `assignedQuestionIds` are NOT interchangeable with vocabulary concept IDs. Never invent exact 28 old correct IDs.
- The student's real archived legacy assignment evidence has not been mapped or verified. These tests do NOT establish that 28/30 has been fixed for them or that a backup import will work on iPad.

## Task-by-task continuity regression (staging-only)
- 12/12 dedicated continuity tests: strict blocked plan remains unpublishable; partial plan needs explicit `allowPartial:true`; 1–9 FULL assigned tasks only; missing tasks cannot receive fictitious credit; duplicate IDs and globally invalid catalogs cannot use fallback.
- 9/9 Home projection tests: when 9/10 tasks complete and one is unavailable, the summary never marks 10/10 or grants full-day eligibility, and no current progress is lost.
- 14/14 30-day simulator tests: opt-in partial 160/day (missing GCSE 3 Marks) for 30 days, 4,800 genuine *synthetic* assignments; strict mode still blocks and rejects corrupt banks.
- Entire regression 158/158 V8-only. Native Node, real Safari and production smoke tests NOT certified.
- Curriculum review queue 9/9 tests; real 8 topic sample 438 source items, 67 advanced-format/difficulty review candidates, zero independently approved Mastery questions.
