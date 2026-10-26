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
- [~] 158 focused tests passed in isolated V8 harness suites: ledger 16, planner 29, storage 24, bank-adapter 17, indexeddb-repository 12, legacy-review 16, simulator 14, continuity 12, day-summary 9, mastery-audit 9. Native Node/GitHub Actions, real-bank 30-day simulation, property tests and Safari validation NOT yet verified.
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

## Latest checkpoint — staged daily continuity + 30-day evidence (2026-10-26)
- `planner.js` preserves strict `status:'blocked', tasks:[]` when any requirement fails, but now exposes safe, FULL-LENGTH `eligibleTasks` plus per-task availability reasons. A globally malformed catalog invalidates all candidates.
- `continuity.js` converts only safe block diagnostics to an explicitly labelled **staging-only** 1–9 task partial plan. It never claims 163/163, changes Mastery difficulty or credits unavailable tasks. `storage.js` refuses partial freezing unless `allowPartial:true` explicitly supplied, and frozen rosters cannot be silently replaced. Saved answers can only apply to listed tasks.
- `day-summary.js` builds Home/30-day display values from the verified event ledger: e.g. 9 available tasks completed and one blocked is **9/10, not 10/10**, and is NEVER eligible for a full-day completion reward.
- `simulator.js` supports `continuityMode:'staging-partial'`: synthetic 30 days with missing GCSE 3-Mark bank produce **160 real planned questions/day, 4,800 allocations total, 90 questions explicitly unavailable**, versus strict-mode block. This is NOT proof of actual bank capacity or live UX.
- `mastery-audit.js` creates conservative read-only per-topic reviewer candidate queues from authentic topic files; no auto-certified Mastery. Initial real run inspected 8 topics, 438 enabled records, 67 source high-format/difficulty candidates, 0 curriculum-certified. See `QA_MASTERY_TRIAGE_8_REAL_TOPICS.md`.
- **Full regression: 158/158 passed** using exact GitHub-committed JS in an isolated V8 harness with test imports/assertions adapted; native `node --test`, Actions CI and physical iPad Safari remain UNVERIFIED.
- Located prior 2026-10-26 emergency JSON and 2026-10-25 backup in user's Library, but authorized raw-byte materialization did NOT succeed. No raw backup data was read or modified; actual backup schema migration remains a blocker.
- All changes on `feature/daily-v2-clean-rebuild-20261026` only. GitHub `main`, production App and student's original XP/history never modified.

### Release blockers (do not bypass)
1. Staging-only partial plan policy requires UI design and explicit release approval; unverified global source data must never permit partial.
2. Certify actual educational item depth and mark schemes, add genuinely missing high-quality content, prove taught Year9 and per-student fresh IDs.
3. Real backup mapping with immutable legacy correct records and verified assignment universe, safe import & rollback.
4. Actual browser IndexedDB quota/private mode/reload/reopen and iPad Safari device persistence QA.
5. Native Node/GitHub Actions evidence and genuine real-bank 30-day progression.
6. No merge or production deployment without explicit approval.

### Next bounded build unit
Implement staging-only 10-task Home/Quiz presentation, task-specific shortage messages and a safe QA browser harness; continue source curriculum review. Do not alter live Daily/XP.

## Current checkpoint — isolated staging browser QA (2026-10-26)
- Created independent `daily-v2/staging/index.html`, `qa.css`, `qa.js`, `qa-fixture.js`, `qa-controller.js` and `staging/README.md`. Not linked to production, not merged, not deployed. Source page offers full synthetic 163 tasks, deliberately missing GCSE 3-mark item (160 of 163 in 9 available tasks), persistent browser QA score reading, wrong-answer retry, 1–3 GCSE marks, deliberate one-save failure injection, and wipe of **only** `scholar-daily-v2-staging-ui-*` database.
- The QA controller routes through authentic V2 frozen planner, staging partial continuity opt-in, verified CAS receipt, pure ledger and Home projector. No real question banks or actual learner state are read or written.
- **11/11 new controller tests** passed: first-plan freeze; 163 and 160 scenarios; wrong-then-right; unchanged event retry; 5/6 exam marks with 3/3 questions graded; reopen; unavailable-task exclusion; full 163 synthetic correct; QA-only no XP.
- Re-ran prior 10 suites separately (**158/158 pass**) plus controller (**11/11 pass**) = **169/169 focused regression tests passed** against exact committed source in a V8 harness with imported module syntax and Node test API emulated. Staging `qa.js` syntax, documented DOM IDs and static asset links independently checked. This does NOT prove native Node CI or any browser/iPad behavior.
- Fixed staging CSS to honor the HTML `hidden` property despite visible-label rules.
- Staging test guide: `daily-v2/staging/README.md`. To run: checkout feature branch, run `python3 -m http.server 8000` from repo root, browse `http://localhost:8000/daily-v2/staging/`.
- The prior real emergency JSON was found by Library metadata but could NOT be materialized to raw bytes; actual historical student import NOT done.

### Release blockers still open
1. Browser and real iPad Safari / PWA storage verification, including reload, storage failure/quota, reopen and multi-tab.
2. Genuine student backup mapping, historical 28/30 ledger migration and rollback safety.
3. Real curriculum bank question certification, taught Year9 evidence, actual 30-day bank and missing high-depth Mastery content.
4. Full UI integration with live Home/Study/Recovery/XP remains deliberately withheld. User approval required before main merge and production deployment.

### Next bounded build unit
Staging browser smoke tests in a real browser where available; improve task-specific shortage explanation UX and safe restoration; later independent Codex review with exact failing test evidence. Do not touch production. 