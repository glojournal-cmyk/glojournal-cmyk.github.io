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

## Isolated browser staging addition — review scope
- `daily-v2/staging/index.html` and companion CSS/browser JS, mock fixture and controller. It is not production UI and does not use real student data.
- Browser tester has two scenarios: all 163 mock questions or 160 with GCSE 3-mark shortage. Verify no 163/163 false completion, no XP, persistence across reload, failed write recovery and 5/6 exam marks. Examine synthetic-only IndexedDB namespace and any XSS/DOM risks.
- Added `tests/qa-controller.test.js` with 11 tests; entire suite now **169/169 V8 harness tests**. Native Node tests/CI and Safari/iPad are NOT verified.

## New content audit — 100 drafted Mastery questions
Review `daily-v2/content/mastery/*.json` and `MASTERY_BANK_BATCH1_QA.md`: five subjects, 20 each, 4/10/6, open-ended Mark Points. `mastery-draft-validator.js` plus dedicated 10 source-backed tests included; total **179/179** isolated V8 tests.
High-risk review: is each question actually appropriate for a taught Y8 topic; do French/Latin variants permit fair assessment; are scientific statements/calculations and partial marks accurate; does the eventual automated semantic grader accept equivalent correct responses and reject wrong causal explanations? Draft source `status:'enabled'` is only file-level, NOT independent review approval; **0/100 certified to live planner**. No live catalog/XP/student state changed.

## Review now required for Batch 2 Mastery content
- `MASTERY_BANK_BATCH2_QA.md`: 100 additional draft items in 5 new topics; across Batch 1 and 2 there are 200 candidates with provisional 4/10/6 band quotas.
- `tests/mastery-batch2.test.js` 10/10 V8 passed, including 200-ID exact uniqueness and cross-batch five-day all-correct depletion. This is NOT 30-day real-bank readiness.
- Reviewer priorities: known Stage/lesson coverage, tense and reflexive gender variants, experimental controls, calculation units and worked numerical answers, false-positive keyword matching in `rubric_review`, and read-only cross-question overlap against the entire original source catalog.
- **0/200** new authored items are independently certified for the real Daily V2 adapter. No real student-facing deployment authorized.

## Current audit additions (2026-10-26)
- Original bank audit `QA_EXISTING_BANK_SOURCE_REVIEW.md` covers actual JSON of 59 Y8 topics/4,885 items and all of Chemistry/Physics; 429 source-format review hints only, **0 certified**. Example false-high-difficulty tags: `servus laborat`, visible spectrum colour listing, pH4 classification. `QA_EDUCATIONAL_SPOT_CHECKS.md`.
- `src/rubric-review.js`: review-only per-point scoring with audited source fingerprint, not automatic semantic grading. `tests/rubric-review.test.js` 12/12 and `tests/rubric-real-drafts.test.js` 5/5 V8 harness. Every production answer must still pass validated marking semantics and iPad storage proof.
- Do not claim 429 fresh Mastery questions, that student history is reconciled, or 30-day capacity based on these counts.

## Reviewer handoff — source discrepancies and staged partial credit
- **All 153 enabled Year8 topic source files read**; `QA_FULL_Y8_EXISTING_BANK_AUDIT.md` and per-subject JSON audit shards contain actual source SHAs, IDs, counts, 16 catalogue mismatches and 475 source-format/difficulty leads. These are NOT independent certifications.
- `src/catalog-integrity.js` plus 8 tests: ensures actual eligible source count is not silently conflated with catalog (8,918 versus 8,829). Main culprit `bio-y8-food-tests` +110. Source eligibility filters remove `formal:false` from some topics. DO NOT mutate live catalog or source until root generator/data owner reviewed.
- `src/rubric-review.js` plus 17 tests: source-bound, auditable **manual** one-point-per-criterion reviews, exemplified 2/4. It explicitly leaves unreviewed free-text marks null and writes NO Daily ledger credits. Needs real semantic-marking design and authenticated reviewer workflow before use.
- Freshness/taught topics/student history unknown. 200 new Mastery drafts remain unapproved, despite strong structural QA. Ask Codex to identify genuine false Challenge tags and curricular/rubric mistakes, not auto-promote 475 source candidates.
- This session 25/25 new V8 checks passed; old 179/179 not rerun, native Node and Safari not verified. No production/main changes.