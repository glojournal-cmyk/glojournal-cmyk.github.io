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
- [ ] Design and implement pure Daily V2 planner and question-preflight with dry-run mode.
- [~] Pure replay-idempotent ledger projection IMPLEMENTED at daily-v2/src/ledger.js; durable storage receipt adapter and full legacy identity migration NOT done.
- [ ] Implement stable question assignment and deterministic retry reserves.
- [ ] Build 10 task adapters, Vocab cycling, genuine history-only retention, independent GCSE marking.
- [ ] Create automated bank-depth auditor and content improvement plan (Latin first).
- [~] 12 focused ledger regression tests committed at daily-v2/tests/ledger.test.js; 12/12 executed successfully in JS test harness against exact GitHub source. Native node:test CI, property tests and 30-day simulations NOT yet executed.
- [ ] Add staging-only UI integration and reconciliation layers (Home / Daily / 30 days / Recovery / XP).
- [ ] Add Safari-specific persistence and failure recovery tests.
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

## Next build unit
Implement DailyV2 deterministic question planner, dry-run eligibility gate, and tests; then genuine persistence adapter, migration and task adapters.
