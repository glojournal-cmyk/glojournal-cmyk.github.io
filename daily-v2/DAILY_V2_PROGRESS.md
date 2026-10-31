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
## 2026-10-26: Batch 1 Mastery bank expansion (five subjects)
- Created **100 new author-draft questions**, five new Year 8 topics with 20 items each: Latin adjective/case reasoning; French negatives/mixed tenses/writing; Biology digestion/enzymes/absorption; Chemistry ionic formulae/equations; Physics speed–time motion.
- Every topic provisionally holds **4 Foundation, 10 Application, 6 Challenge**, stable IDs, a model answer, explicit individual marking points, feedback, and semantic-review grading requirement. Drafts are isolated in `daily-v2/content/mastery/*.json`, NOT in original `content/catalog.json`.
- Fixed two ambiguous authoring prompts (Latin correction-count instruction and French error-type wording); preliminary similar-prompt check across six related existing topic banks found no token Jaccard >=0.65 pairs. Neither step is independent curriculum QA.
- Added `src/mastery-draft-validator.js`, `tests/mastery-drafts.test.js`, and `MASTERY_BANK_BATCH1_QA.md`. **10/10 new content/integration/depletion tests passed**, with old 169/169 freshly rerun = **179/179 V8 regression tests passing**. Native Node, Actions, true Safari QA remain UNVERIFIED.
- Critical safe gate: the new topics are author drafts pending independent subject/mark-scheme review and verified taught status. `adaptCertifiedDailyV2Bank` presently marks **0/100 eligible for actual Daily allocation**. Free-response semantic grader is NOT yet implemented/validated; never use raw exact-match to award full marks.
- Capacity finding: 100 topics-only questions permit two synthetic days of 2x20 fresh Mastery; on day 3 only one 20-question topic remains. 30-day real-bank readiness is NOT demonstrated. Future work needs more diverse topics AND certification of suitable existing bank questions after prior-correct exclusions.
- No modifications to GitHub main, live app, real user XP/progress, or original question catalog.

### Next content/build work
1. Independent item-by-item educational review and meaningful accepted answers, especially open-ended French/Latin and GCSE-style science marking.
2. Certify existing + new real question banks with source-bound fingerprints, corroborate taught content. Do not auto-certify authored draft labels.
3. Extend bank supply across different topics per subject and 30-day real-student-safe capacity simulation; then implement validated semantic marking and stage full task/UI integration. Production release remains blocked.

## 2026-10-26: Batch 2 Mastery authoring (latest checkpoint)
- Added **five new Year 8 topic packs, 20 questions each, 100 Batch 2 additions**: Latin present/imperfect/perfect contexts, French reflexive routines, Biology photosynthesis experiments, Chemistry acids/alkalis/neutralisation, Physics series/parallel circuits.
- Batch 1 + 2 total: **200 author-draft questions across 10 different provisional topics**, **40 per subject**, each 20-item pack provisionally distributed 4 Foundation / 10 Application / 6 Challenge. Each item carries answer, explicit independent marking points and semantic-assessment requirement.
- Source files: `daily-v2/content/mastery/{latin-y8-verb-tenses,french-y8-reflexive-routines,biology-y8-photosynthesis,chemistry-y8-acids-neutralisation,physics-y8-series-parallel}.json`. Validator now exposes `MASTERY_BATCH_2_FILES` and `ALL_MASTERY_DRAFT_FILES` without changing existing Batch 1 consumers.
- Content QA in V8 using exact fetched GitHub source+all 10 JSON files: **10/10 new Batch 2 tests passed**. Cross-batch source audit: 200/200 unique IDs and 200/200 distinct combined prompt+stimulus strings; all 10 topics preserve 4/10/6 and rubric structural completeness.
- Two review-based revisions before QA: removed ambiguous Latin tense cue and clarified French nonreflexive alternative meaning.
- All 200 remain author drafts and are **0/200 independently certified** to the Daily V2 bank adapter; external teacher coverage evidence and open-response semantic scoring QA are not completed. No live catalog edits.
- Fresh all-correct planning with these 200 **alone** yields five complete Mastery allocation days (2×20/day), then no fresh topics on day six; this is a structural dry-run, NOT real 30-day readiness. Existing certified questions may be added once verified.
- Full separate report: `daily-v2/MASTERY_BANK_BATCH2_QA.md`.
- Prior 179 isolated tests were reported passing in the earlier checkpoint; this session ran 10 new content tests and structural QA. Do not claim current native Node/GitHub Actions or iPad success.

### Next bounded work
1. Review educational correctness and alternatives per item, and evidence of taught topics for this learner.
2. Assess full existing Latin/French/Science source banks before authoring further questions; document actual certified remaining fresh supply.
3. Build and verify semantic/mark-point partial-credit assessment; then real-bank, learner-history-aware 30-day stress test.
4. Continue isolation. No main merge, production release or student state writes.

## Latest checkpoint — original bank audit and safe partial-credit grading (2026-10-26)
- Original Year 8 Catalog metadata: 153 enabled topics, across Latin 65 / French 30 / Biology 37 / Chemistry 8 / Physics 13. Read 59 actual topic JSON files representing 4,885 enabled non-preview question records: Latin 11 files/230 questions; French 13/3,313; Biology 14/614; Chemistry all 8/280; Physics all 13/448. Remaining 94 topics NOT audited per question.
- Conservative challenge-format + source difficulty >=3 **review leads only**: Latin 65, French 0, Biology 16, Chemistry 132, Physics 216 = **429 leads, ZERO independently certified**. French 0 under this heuristic does not mean no demanding French questions. Documented all observed source question IDs, prompt snippets, format and topic blob SHAs in `daily-v2/audit/existing-*-y8*.json`; consolidated `QA_EXISTING_BANK_SOURCE_REVIEW.md`.
- Actual question/answer educational spot-checks documented in `QA_EDUCATIONAL_SPOT_CHECKS.md`: source difficulty 4 `servus laborat` is Foundation; source difficulty 3 visible-spectrum colour listing is recall; pH4 category is lower-order application. Latin set-text translations and scientific causal explanations are more promising but require review and alternate-answer grading. NO certificates created.
- Implemented `src/rubric-review.js`: conservative free-response `previewDailyV2Rubric` always returns `review-required` and `marksEarned:null`, including exact model-answer text. `recordDailyV2RubricReview` accepts explicitly adjudicated **0/1 per mark point**, every reviewer explanation, exact source fingerprint, reviewer/review IDs. Example staging 2/4 possible; always `releaseGrade:false`. This is **manual audit-record functionality, not production automatic semantic scoring**.
- **12/12 rubric core regression + 5/5 actual five-subject Mastery draft integration tests passed** using committed GitHub JS and source JSON in V8 harness. Previous 179/179 regression cases were reported in earlier checkpoint; this session did NOT rerun all 179. No native Node, web-browser, actual iPad, student XP or real mark migration QA.
- Original student question bank/catalog and GitHub main never modified. Existing 200 drafts still 0/200 independently certified; actual masterable remaining fresh questions still unknown without student ledger/taught-topic evidence.
### Next bounded work
1. Complete 94 remaining source file reviews and independent subject-specific item certification before claiming usable Mastery count.
2. Review per-subject alternative acceptable answers and create quality-vetted marking rubrics; avoid auto-awarding from keywords/one literal model answer.
3. Inspect actual safe student backup and taught-topic evidence and rerun real 30-day simulator with prior-correct depletion.
4. Integrate approved grading and bank into isolated test UI, then verify native Node CI and Safari iPad. Explicit release approval still required.
## Full Year 8 source audit completed (2026-10-26) — supersedes previous 59-topic interim sample
- **ALL 153/153 enabled original Y8 topic JSON files read**: Latin 65, French 30, Biology 37, Chemistry 8, Physics 13; **8,918 source-eligible non-preview formal question records**. Original catalog reports 8,829 nominal enabled, not a safe quantity for assignment. **16 individual topic count mismatches** found. Largest: `bio-y8-food-tests` catalog 33 vs actual 143 enabled formal question records (110 more); original file has no duplicate Question IDs in spot check. Some negative deltas are explained by source `formal:false` exclusions.
- Source difficulty>=3 + potentially higher-order format produced **475 preliminary content review leads** (Latin 65, French 21, Biology 41, Chemistry 132, Physics 216). These are NOT qualified Mastery items. Original 200 authored questions remain pending independent review.
- New `QA_FULL_Y8_EXISTING_BANK_AUDIT.md` is the authoritative full source inventory; 14 audit JSON manifests in `audit/` record per-topic source SHAs and candidate IDs. `QA_EDUCATIONAL_SPOT_CHECKS.md` records preliminary grade-quality dispositions and false-Challenge flags. `MASTERY_CONTENT_PRIORITY_PLAN.md` prioritizes next per-subject certification versus authoring.
- New `src/catalog-integrity.js` and `tests/catalog-integrity.test.js`: **8/8 V8 checks passed** on exact GitHub audited data, detecting all 16 count discrepancies and refusing nominal counts as planning evidence. Does NOT rewrite original catalog.
- Earlier today: `src/rubric-review.js` and `tests/rubric-review.test.js` 12/12, `tests/rubric-real-drafts.test.js` 5/5 passed against exact GitHub code+real authored drafts. These records are reviewed staging-only, NEVER automatic semantic grades or production XP.
- **25/25 newly added focused audit+rubric tests passed this session.** Previously reported 179/179 older tests NOT fully re-executed this session; do not imply aggregate 204/204 ran together. Native Node/GitHub Actions green, genuine Safari/iPad, student migration and full real-bank readiness NOT verified.
- All development only on feature branch, no content/catalog.json change, no student progress writes, no merge/deploy.

### Next bounded stage
1. Independently educationally certify actual candidate questions (not all 475; reject false positives); identify real remaining 4/10/6 Mastery capacity per subject and topic.
2. Implement/verify accurate open response partial credit and safe interface workflow; present per-criterion evidence rather than string matching.
3. Read student backup safely, confirm taught topics and per-question history, run real 30-day depletion. Reconcile 16 catalog drift cases safely. Release still blocked.
## 2026-10-27 — independent V2 creditability guard (no live App change)
- Confirmed source branch `feature/daily-v2-clean-rebuild-20261026` actually contains the **standalone** Ledger, Frozen Planner, CAS storage, IndexedDB adapter, staging QA interface and 200 unapproved Mastery drafts. Do not confuse this branch with current-app PR #171/#175/#176 or the separate draft question-bank PR #172.
- **Root-cause risk found:** previously `commitDailyV2Plan()` checked 30 distinct *question IDs* but did not require 30 distinct *vocabulary concept IDs*. Two translation variants for one word could be frozen as 30 questions while the V2 ledger can only award 29 unique concept credits, recreating an impossible 29/30 Daily.
- **Fix committed** to `daily-v2/src/storage.js` (`f94cb48dc984ed22429e605fabe0aff1d2a7bea5`): for each Vocab task, reject absent, blank, whitespace-noncanonical, or repeated concept IDs BEFORE any plan write; keep French and Latin concept scopes independent.
- **Tests committed** to `daily-v2/tests/storage.test.js` (`f954e91584ee87a3de52995a0c4ed0ffc97ac0e1`): duplicate concept with distinct question IDs, missing/invalid identity, identical token across different subjects is legal; failed plan writes must leave repository empty.
- **Executed code evidence:** 4/4 focused frozen-roster checks and 3/3 additional persisted-answer/replay checks passed in an in-process V8 harness against current `ledger.js`, `planner.js`, `storage.js` fetched from GitHub. Confirmed invalid plans leave the repository empty, correct unique answers produce 1→2 credit, identical event replay is idempotent, and contradictory replay is rejected. This is **NOT native Node/GitHub Actions/real Safari QA**. Latest isolated branch push workflow remains unverified by these results.
- **Next blockers (unchanged):** native full-suite CI, actual certified 163-question real-bank simulation, content depth/rubric review and taught-topic evidence, legacy opaque 28/30 reconciliation with genuine backup, real iPad/Safari IndexedDB quota/reload QA, then separately approved integration/migration. **Do not merge, deploy, or edit student records.**
