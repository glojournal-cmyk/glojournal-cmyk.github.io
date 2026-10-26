# Daily V2 — lean independent Codex review handoff
Status: NOT READY FOR RELEASE; independent review is future work. Updated 2026-10-26.

## Fast orientation — minimise context/token spend
Repository: `glojournal-cmyk/glojournal-cmyk.github.io`
Branch: `feature/daily-v2-clean-rebuild-20261026`
Read only:
1. `daily-v2/DAILY_V2_PROGRESS.md` (current status).
2. `daily-v2/DAILY_V2_SPEC.md` (non-negotiable requirements).
3. `daily-v2/DAILY_V2_QA.md` (acceptance and release safety).

Do NOT scan the entire historic chat, repository, backups or visual assets unless a specific check fails.

## In-scope sources
- `daily-v2/src/ledger.js`: idempotent attempt evidence, opaque legacy credit baselines, possible-legacy-key verified roster.
- `daily-v2/src/planner.js`: ten-task/163 question preflight; typed language quotas, GCSE exclusive, mastery 4/10/6, vocab cycles, history-only spaced retention, frozen plan behavior.
- `daily-v2/src/storage.js`: frozen plan/attempt CAS receipt, exam marks verification, no stale revision writes.
- `daily-v2/src/indexeddb-repository.js`: true IndexedDB transaction semantics and receipt verification; simulated browser only until real Safari QA.
- `daily-v2/src/bank-adapter.js`: per-question authentic source fingerprint and curriculum certification.
- `daily-v2/src/legacy-review.js`: old student backups read-only; no invented correct question IDs.
- `daily-v2/src/simulator.js`: 1–90 day synthetic allocation QA.
- `daily-v2/tests/*.test.js`: seven focused regression suites.

## Test command (native Node required)
```bash
node --test daily-v2/tests/*.test.js
```
Current verified evidence: **158/158** test cases passed in separate V8 harness runs against exact committed JS with module imports adapted and node assertions emulated. **Native node:test, GitHub Actions green, real browser and iPad Safari are NOT verified.** No live integration.

## Independent reviewers: high-risk targets
1. Ledger replay idempotence under concurrency, cross-date disallow, legacy missing-concept 28/30 safety. `potentialLegacyKeys` must be a verified superset of potential old credits, not a guessed set.
2. Frozen plan load; no reroll on browser restart, no phantom 163 count, no shortcuts when 1/10 tasks short.
3. Cross-day depletion. Full synthetic supply 30 days x 163 passes; actual corpus/Student correct IDs NOT certified.
4. Question uniqueness requires full prompt+stimulus; unrelated sentences may share generic prompt.
5. GDPR/student history: do not write into or reset main/prod localStorage/IndexedDB, Recovery or XP.
6. GCSE scores: 1/2/3 marked question maxima, cannot fake 5 marks for a 2-mark item.
7. Curriculum authenticity: source difficulty and high-level format are NOT independent evidence of Challenge. See `QA_REAL_BANK_12_TOPIC_SAMPLE.md`.
8. UI integration, real Safari quota/access denial, offline mode, cross-tab transaction lifecycle.
9. UX shortage policy: currently ALL ten tasks blocked if one fails; deliberate staging protection, but unsuitable as final end-user behavior absent approved fallback.

## Required output from Codex when invited
Report code-specific/reproducible failures by file + line, prioritized by data-loss/stuck-task risk; patch only isolated branch; add regression tests. Do not merge to main or deploy. Request explicit approval for release cutover. Keep a compact review ledger with actual test output.


## Current isolated build additions (2026-10-26)
- src/continuity.js: explicit staging-only partial tasks with strong no-fake-completion and source-error guards.
- src/day-summary.js: verified Home and 30-day projection, unavailable tasks never counted as completed.
- src/mastery-audit.js: read-only source Mastery review queue, not a curriculum certificate.
- 30-day synthetic continuity test: missing GCSE 3-mark item still allows 160/163 questions per day; full-day completion remains false.
- Total 158/158 isolated V8 tests; native Node, real Safari, real student backup and actual corpus readiness remain unverified.
