# Daily V2 — QA and independent review handoff
**Initial isolated implementation tests: 56/56 passed in a V8 harness** (ledger 12, planner 27, storage 17), 2026-10-26. Native Node/GitHub Actions completion and iPad testing are NOT verified. The following remain release acceptance criteria.

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
- Ledger 12/12, deterministic ten-task planner 27/27, CAS storage contract 17/17 in JS V8 harness executing GitHub-committed source and tests.
- CI workflow on staging branch: `.github/workflows/daily-v2-tests.yml`; no verified Actions outcome yet. Browser/workspace cannot directly reach public GitHub via container git (DNS unavailable).
- Storage tests rely on in-memory repo, so they DO NOT establish iPad IndexedDB durability. No live Safari/real-device QA done.
- Real topic catalogs have not yet been normalized to explicit roles and certified depth bands; no Daily V2 plans from real bank have been proven ready.
- Mastery must be explicitly audited against past correct IDs; do not relax 20/depth gates to hide bank shortage.
