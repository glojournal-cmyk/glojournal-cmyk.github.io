# Daily V2 — resumable build log
Status as of 2026-10-26

## Repository and isolation
- Repository: glojournal-cmyk/glojournal-cmyk.github.io
- Working branch: feature/daily-v2-clean-rebuild-20261026
- Production branch: main (NO V2 changes allowed before acceptance)
- Durable spec: daily-v2/DAILY_V2_SPEC.md

## Completed
- [x] Create isolated GitHub working branch from main.
- [x] Record V2 10-task / 163-question agreement and non-negotiable acceptance gates.

## Not yet done — not to be represented as complete
- [x] Implement pure deterministic ten-task planner with all-or-nothing preflight at daily-v2/src/planner.js (synthetic fixtures only; real bank adapter pending).
- [~] Pure replay-idempotent ledger at daily-v2/src/ledger.js. Atomic CAS repository contract + readback verified receipts implemented at daily-v2/src/storage.js, but REAL IndexedDB durable adapter and legacy identity reconciliation NOT done.
- [~] Stable frozen question assignments and same-question wrong-answer retry supported by planner + storage contract; explicit alternative-question reserve strategy, production retry UI and migration NOT done.
- [ ] Build 10 task adapters, Vocab cycling, genuine history-only retention, independent GCSE marking.
- [~] Metadata audit in daily-v2/QA_BANK_AUDIT.md. Conservative per-question real-bank adapter implemented, but complete authentic certification manifest and missing content authoring NOT done.
- [~] 122 focused tests executed successfully against exact committed code in isolated V8 harness suites: ledger 16, planner 27, storage 24, bank-adapter 17, indexeddb-repository 12, legacy-review 16, simulator 10. Native Node/GitHub Actions, real-bank 30-day simulation, property tests and Safari validation NOT yet verified.
- [ ] Add staging-only UI integration and reconciliation layers (Home / Daily / 30 days / Recovery / XP).
- [~] Real IndexedDB transaction adapter (staging namespace) implemented with 12 IndexedDB-behavior-fake tests. No REAL Safari/iPad hardware tests, browser quota tests or legacy production migration.
- [ ] Produce independent Codex review handoff with exactly changed files and failed tests.
- [ ] Run Work browser QA if useful; genuine iPad validation still required.
- [ ] Independent sign-off and explicit permission before production switch.

## Working rules to prevent wasted tokens
1. Read THIS file and the SPEC, not the complete chat history, at the start of each build session.
2. Work in isolated daily-v2/ source and tests, no production writes.
3. Modify/test/commit ONE coherent source module before moving on.
4. Update this file with precise evidence, commit SHA, test output, and next step each session.
5. Treat CI, unit tests, browser checks and actual iPad checks as DIFFERENT evidence levels.
6. Preserve source file hashes and previous data backups before eventual migration.
7. Never claim integration, iPad validation, rollout or migration complete without evidence.
8. If total viable Mastery supply is insufficient, report educational content gap; never fill with low-level MC merely to reach 20.

## Verified progress (2026-10-26)
- First isolated module: daily-v2/src/ledger.js; commit 5a9c21b28417dedce94054022a367fd47c3562c9.
- Regression suite: daily-v2/tests/ledger.test.js; commit b7cf201c29c6594d4938000e3971fcfa3e2bbf20.
- Verification: 12/12 cases passed in V8 harness executing the retrieved committed source/tests with Node assertion semantics emulated. This is NOT GitHub Actions or native node:test execution.
- Safety behavior: opaque legacy baseline retains verified amount and flags new attempted credits as pending reconciliation, rather than fabricating evidence or silently double-crediting. Full historical migration is still a blocker.
- No production files modified, no live data touched, no V2 integration.

## 2026-10-26 latest checkpoint: simulation / source audit / exam invariants
- Implemented `daily-v2/src/simulator.js` with ten deterministic stress scenarios in `tests/simulator.test.js`. A deliberately sufficient **synthetic** bank passed 30 days x 163 questions = 4,890 assignments; a small 2-day Mastery bank correctly blocked on day 3 (2026-10-28). Missing historical Retention and challenged Year 9 depth are detected before daily publication.
- Hardened `bank-adapter.js`: a review now requires `sourceFingerprint` bound to topic + original prompt, stimulus, options, answer and format. Changed answers or stimuli invalidate certification. See test additions (17/17).
- Hardened frozen exam manifest + `storage.js`: 1/2/3 allocated max marks are mandatory; forged exam totals, inconsistent correctness and nonexam marks are rejected. Storage suite now 24/24.
- Inspected 12 REAL topic files (594 eligible records) read-only, documented in `QA_REAL_BANK_12_TOPIC_SAMPLE.md` including exact blob hashes. Latin adjective agreement (24) and Biology balanced diet (39) had **zero** source difficulty 3+; structural supply ≠ certified Mastery.
- **Overall: 114/114** focused tests passed against exact GitHub committed JavaScript in V8 harness (imports combined and assertions emulated). This is NOT native Node `node --test`, GitHub Actions, real Safari or iPad validation.
- New engine remains completely isolated; no edits to `main`, production UI, student records or XP.
- OPEN: true 30-day student-evidence bank readiness; exhaustive content review and source-bound manifest; iPad storage QA; safe legacy opaque baseline resumption; UI/XP/Recovery integration and explicit task-shortage handling.
- Current strict preflight blocks the WHOLE new daily plan if any one task has insufficient verified supply. This avoids mid-session dead-ends but is NOT acceptable as user-facing continuity; fallback policy must be designed and validated before release.

## 2026-10-26 latest checkpoint: safe opaque-legacy credit recovery
- `ledger.js` now permits credits above an opaque 28/30 historical baseline ONLY when a verified superset of all potentially credited old concept IDs is available, and only for new concept IDs definitively outside that set. It never invents which original 28 items were correct.
- `legacy-review.js` can preserve this optional read-only verified historical frozen-assignment evidence from `assignedVocabularyConceptIds` (not question IDs). Mixed or conflicting device assignment sources invalidate proof.
- Unknown or incomplete historical rosters remain a release blocker. The student's actual backup has NOT been successfully mapped into this format; no legacy migration or actual student repair has been performed.
- 8 additional ledger/legacy review regression cases implemented and passed; **122/122 total** tests passed with each suite compiled separately to avoid cross-module namespace contamination.
- Only development branch files changed; no production deployment or student writes.

## Next build unit
1. Real-bank certification of taught topic/skill/depth and a safe, per-task shortage handling policy; do NOT bypass high-level Mastery.
2. Read-only real emergency backup schema analysis and reconciliation for opaque 28/30 records, without changing user data.
3. Run real certified-bank 30-day simulation; then staging UI integration, native CI and iPad Safari smoke tests. Production release requires approval.
