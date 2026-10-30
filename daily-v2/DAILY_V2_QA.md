# Daily V2 — QA and independent review handoff
**Initial isolated implementation tests: 158/158 passed in a V8 harness** (ledger 16, planner 29, storage 24, bank adapter 17, IndexedDB adapter 12, legacy review 16, simulator 14, continuity 12, day-summary 9, mastery-audit 9), 2026-10-26. Native Node/GitHub Actions completion and iPad testing are NOT verified. The following remain release acceptance criteria.

## Data reliability
- Verified credit is derived only from persisted answer events or explicitly preserved legacy baselines.
- Duplicate retry messages and repeated event IDs do not double credit.
- Corrupt / partial storage is reported, not mistaken for 0 correct.
- Quit / reload / offline / out-of-space / IndexedDB denial recover without silent score loss.
- Home / Recovery / 30-day / XP read the same reconciliation results.

## Question availability
- Vocab: 30 independently creditable concepts; up to five independently taught/verified Y9 concepts, with Year 7–8 supplying the remainder if Y9 is not taught. No same-day duplicate credit; new cycle only after prior cycle exhausted.
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

## Independent staging QA UI (2026-10-26)
- `staging/index.html` + `staging/qa.js` demonstrate simulated full plan and one-missing-GCSE partial plan, with a visually explicit 0..163 counter, separate 0..10 tasks-completed counter, unavailable task descriptions, and full-day XP ineligibility for partial days.
- Browser UI uses only `scholar-daily-v2-staging-ui-ready` or `scholar-daily-v2-staging-ui-missing-gcse` and never reads original App storage or legacy profile. It uses actual V2 IndexedDB CAS module but browser behavior hasn't been verified on a device.
- Bad answer does not earn a credit; a simulated write failure returns an error and the same eventId is retried; browser reload should re-read frozen day/ledger. 3 marked GCSE questions allow 5/6 marks, tracked separately.
- Controller regression 11/11 in V8 harness; old suites freshly rerun 158/158 = total **169/169** isolated logic checks. Static HTML IDs/import references/syntax checked; NO live Safari/browser smoke test yet.
- To execute manual QA: see `staging/README.md`; inspect from an authenticated feature-branch checkout served over HTTP (not `file://`). The page has NOT been deployed.

## Mastery source content Batch 1
- 100 original author-draft Mastery questions across Latin, French, Biology, Chemistry, Physics. 4/10/6 per subject, explicit Model Answers, Mark Points, common-error feedback. Source path `daily-v2/content/mastery/`.
- `src/mastery-draft-validator.js` performs structural checks; `tests/mastery-drafts.test.js` validates source JSON and proves these drafts **cannot** be treated as certified Daily Mastery.
- Latest 10/10 additional tests passed, old 169/169 freshly rechecked, aggregate **179/179** focused V8 tests. This is not a second human curriculum reviewer or actual Safari/browser evidence.
- Content-only dry-run reveals fresh-question starvation by third day on 100 new questions alone. Full curriculum/taught-status, semantic marking, score and source fingerprint approval are required before learner release.
- Reports: `MASTERY_BANK_BATCH1_QA.md`.

## Mastery content Batch 2 (2026-10-26)
- Five additional 20-question author-draft topics for Latin/French/Biology/Chemistry/Physics. Across both batches: 200 source question IDs in 10 distinct topics; 4 Foundation / 10 Application / 6 Challenge per topic.
- `tests/mastery-batch2.test.js`: **10/10 passed** against exact fetched JSON in V8 harness. Combined cross-batch QA found zero duplicate IDs and zero repeated exact prompt+stimulus combinations. This is not a semantic near-duplicate corpus audit.
- Draft-only simulated all-correct Mastery supply lasts five 40-question days, and becomes exhausted on day six. Source books and complete historical correct IDs not yet certified; actual readiness unknown.
- Human curriculum and school-taught verification, answer alternatives, secure partial-credit rubric marking and independent native Node/iPad QA still outstanding. New questions remain **0/200 certified to the actual Daily adapter**.
- See `MASTERY_BANK_BATCH2_QA.md`. No original content/catalog.json or production sources changed.

## Original content and manual mark-point audit
- Catalog Y8 total 153 enabled topics. Read real source for **59** of them, **4,885** eligible question records. Chemistry 8/8 and Physics 13/13 fully inspected at source level; Latin 11/65, French 13/30, Biology 14/37. **94 source topics remain unread**.
- Review-only flags (source difficulty>=3 and possibly higher-order format): Latin 65, French 0, Biology 16, Chemistry 132, Physics 216; 429 total, **none independently certified** by this metadata exercise. Many flagged Chemistry/Physics examples are actually basic recall/application. Reports `QA_EXISTING_BANK_SOURCE_REVIEW.md`, `QA_EDUCATIONAL_SPOT_CHECKS.md`, and `audit/existing-*.json`.
- Free response `src/rubric-review.js` performs **NO guessed auto-scoring**; `previewDailyV2Rubric` leaves marks null pending review and `recordDailyV2RubricReview` stores staging-only per-point reviewer awards with evidence and source fingerprint. Tests: 12/12 isolated module and 5/5 against actual authored question files (example Biology 2/4). Not a proven automated semantic grader; student ledger integration not authorized.
- Previous base 179/179 tests from earlier checkpoint, plus 17 targeted new tests this turn. Native Node, browser/iPad not verified; existing 179 tests NOT rerun this turn.
## Final source audit scope (supersedes intermediate 59-topic sample)
- All **153/153** enabled Year 8 source topic files inspected from GitHub: **8,918** eligible question records, compared with **8,829** nominal catalog-enabled records; **16** topic count mismatches, including `bio-y8-food-tests` 33 catalog versus 143 actual.
- Preliminary source high-format+level review hints: Latin 65; French 21; Biology 41; Chemistry 132; Physics 216 = **475, ZERO independently certified** from this audit. No claim that 475 is fresh, already mastered, or true Challenge quality. See `QA_FULL_Y8_EXISTING_BANK_AUDIT.md`.
- `src/catalog-integrity.js` and `tests/catalog-integrity.test.js` checked full source snapshots, **8/8 V8 harness passing**. Preflight must use actual loaded question IDs, not catalog sizes.
- Earlier same turn `src/rubric-review.js` manual 0/1 per-point stage review: **12/12** core and **5/5** authored-draft integration tests passed in V8; free-text preview always leaves scores null (never auto-awards), even exact model-answer matches. No real student score writes.
- Session new tests **25/25**; previously 179 tests historically reported but NOT rerun entirely this turn. Native Node CI, actual iPad Safari, independent school/GCSE curriculum approval and real 30-day capacity remain incomplete.
- Next curriculum priority and task ownership: `MASTERY_CONTENT_PRIORITY_PLAN.md`.

## 2026-10-30 — GCSE exam freshness across dates (staging branch)
- Found a real preflight gap: exam allocation checked same-day collisions and source originality, but did not filter `previousCorrect`, unlike Standard/Mastery/Year 9. Repeating yesterday's correct 1/2/3-mark question could make a synthetic 30-day pass look more substantial than it was.
- Corrected `planDailyV2` to exclude previously correct GCSE question IDs AND different IDs carrying the identical previously correct exam prompt/stimulus fingerprint. Incorrect past GCSE responses remain eligible for later practice. History is read-only; no records are rewritten.
- Added four planner regressions (old correct ID, clone wording, truly fresh substitute, wrong-answer retry) and two 30-day simulator regressions (31st-day depletion and 30-day completed fixture).
- These checks use a synthetic bank only and **cannot certify the real 163-question bank**, unknown actual learner history, GCSE content originality, or iPad durability. Native Node and Actions results must be recorded separately; no production cutover.

## 2026-10-30 — GCSE partial-credit retry repair (staging-only)
- Confirmed `summarizeDailyV2Task` used only the first marked event per GCSE question. A persisted 1/3 followed by a verified 3/3 retry remained 1/3, despite the retained answer history. This was a genuine data/projection inconsistency, not a learner error.
- Updated isolated `src/ledger.js` to sum the **best verified marks per original question ID**, count each exam question once, preserve both immutable events, and reject contradictory per-question max marks in a saved ledger.
- Added four direct ledger cases (partial-to-full, reverse event order, three distinct questions with a retry, contradictory maximum) and one end-to-end atomic storage/replay regression. Production scoring, XP, saved learner records and main branch unchanged.
- This protects QA-only marking projections. It does NOT approve automatic written-answer evaluation, actual iPad IndexedDB behavior, historical student import or production rollout.

## 2026-10-30 — Answer receipt credit deltas and safe legacy baseline bounds
- Found a reward-integration hazard: a successful immutable answer event receipt (`verified:true`, `alreadyRecorded:false`) did **not** distinguish a genuinely new credit from a wrong answer or a new-event-ID retry of an already credited question. A future XP integration using this receipt alone could overpay.
- `commitDailyV2Answer` now returns `creditDelta` (0 or 1), `examMarkDelta` (nonnegative), and `newVerifiedCredit` only after CAS + readback confirmation. Duplicate event replays return zero deltas. A valid GCSE 1/3→3/3 resubmission yields `creditDelta:0` and `examMarkDelta:2` on the retry, while preserving both events. Two concurrent writes to the same concept have an aggregate credited delta of one.
- Added eight storage regression tests for correct/wrong/same-ID/new-ID submissions, concurrent tabs, opaque legacy credits and GCSE partial marks. This is a **receipt contract** only: no actual XP or MP is granted by this isolated V2 module.
- Audited legacy baseline entry: previously a raw baseline count above task target could be clamped to a completed task (e.g. 31/30). Plan freezing now rejects unknown task baselines or credits above the frozen task target; `makeDailyV2Ledger` additionally rejects more distinct known keys than claimed credits.
- Normal 28/30 baseline remains unchanged. Old legacy-review now uses the shared strict calendar validator (e.g., an impossible February 30 is refused). Five targeted baseline/calendar tests added.
- No production code, active student scores, device data, Pet/MP/XP or live task counts changed. Real Safari and migration verification remain separate blockers.

## 2026-10-30 — Original structured-answer scoring follow-up
- The real-bank QA inventory contains 10,014 structurally active questions, of which 9,875 belong to Daily V2 subjects. Source-shape checking proves marking data exists for all 9,875, but **source structure is not curriculum certification or a proven scorer**. No student record was accessed.
- Actual source format counts from read-only QA: 755 `mark_points` candidates and 286 other structured answer review candidates. The scoring-adapter release-blocker count is **1,041**; it includes structured-mode sources that happen to have `accepted[]` fallback text, because `semantic_groups`, numeric, mark points, matching and other multi-component scoring cannot be safely downgraded to a simple string comparator.
- Fixed `src/rubric-review.js` to review original `answer.mode='mark_points'` questions with explicit per-point reviewer awards, written reasoning, an unchanged source fingerprint and a staging-only `releaseGrade:false` receipt. Tests use authentic Biology Year 8 source items. Mark ceiling mismatches and changed rubrics are rejected. This is **manual human review**, not automatic grades.
- Centralized the recognized original answer shapes in `src/source-answer.js`. `src/bank-adapter.js` now emits `STRUCTURED_SCORING_ADAPTER_NOT_VERIFIED` for otherwise complete but not approved modes, and `STRUCTURED_MARKING_EVIDENCE_INVALID` for malformed structured rubrics, rather than incorrectly describing them as missing answers.
- **Critical guard:** even a source with an `accepted[]` string and `semantic_groups` (or `mark_points`, numeric, matching etc.) must not be certified for generic automatic scoring; the structured scoring mode always wins. No manifest or reviewer field can bypass this guard in the current adapter.
- GitHub Actions run `41049415112`: **296/296 PASS**, 0 failures. Real-source audit: 9,875 structural human-review candidates, zero missing marking content, 1,041 specialist scoring-adapter blockers, and **0 independently curriculum certified**. No formal Daily V2 planning release or physical iPad migration approved.

## 2026-10-30 — Objective scoring Phase 1 (staging preview)
- Added `src/objective-scorer.js`, isolated and strictly read-only. Supported answer modes: `numeric`, `pair_map`, `category_map`, `unordered_required_groups`. The preview explicitly returns `releaseGrade:false` and `ledgerEligible:false`; it NEVER updates student records, XP/MP, Home or Daily completion.
- **True-source regressions** cover Biology basal-energy-requirement calculations (including exact value, units and source-defined tolerances), nutrient matching with clearly separated alternatives, seven nutrient unordered terms and Chemistry pH sorting. Other checks cover partial marks per independent matching/category item, swapped/missing assignments, unknown extra response labels, order-independent list matching, synonyms and one-to-one group credit.
- Numeric *final-answer errors* return `marksEarned:null` and `reviewRequired:true`, since a working or method mark may be deserved. Fully matched numeric finals yield **preview-only** score, not authorized student credit. Mismatched source ceilings and uncertain extra answers require review rather than a fabricated fractional mark.
- Found an IEEE-754 boundary bug: `259.3 - 259.2` is marginally above `0.1` in JS, falsely rejecting an answer exactly on the specified tolerance. Fixed with tightly capped rounding slack, disabled for zero-tolerance questions and tested against high-magnitude numeric false positives.
- GitHub Actions `41053255754` originally detected this tolerance boundary failure (309/310 passed); patched; `41053395467` passed 310/310. Further precision safety regressions `41053550824` passed **312/312**, 0 failed.
- This is a **previewing scorer, not a validated production integration or an independent curricular review**. The 1,041 structured-source adapter blockers remain until specialized marking, error feedback, moderation and release authorization are verified against all relevant actual sources. Semantic free text and unrestricted Mark Points continue through manual review, not guessed keyword scoring.

## 2026-10-30 — Phase 1 objective scorer: full real-bank compatibility and adversarial QA
- Added read-only `scripts/qa-objective-scorer.mjs`, invoked by `.github/workflows/daily-v2-tests.yml`. It audits all checked-in active 5-subject topic sources, never touches learner records, and reports each four objective answer modes without claiming curriculum certification.
- Real loaded question counts: **191** objective items (115 `pair_map`, 22 `unordered_required_groups`, 46 `numeric`, 8 `category_map`). **191/191 source-derived canonical responses scored full in staging preview**, 0 scorer errors; **191 deliberately wrong source-derived answer probes failed to earn full marks**, 0 false-full results. Neither source-derived "correct" answers nor these deliberate wrong answers substitute for review of alternate pupil answers, teaching suitability or GCSE marks policy.
- Repaired real duplicate-term bug in unordered scoring: repeated identical submitted words such as `glucose, glucose` cannot earn two overlapping group points. The read-only audit now chooses *different* allowed values for source rubrics explicitly requiring two/four distinct examples; otherwise four genuine school questions were false-positive blocked by repeated QA answer generation.
- Examined six initially held Biology sources. Two matching questions explicitly carry **two scored components per pair**: enzyme+products (6 marks) and food reagent+positive result (8 marks). The preview scorer now supports **two separately entered, explicitly identified response fields per pair** using only unambiguous `->` or `;` source rubrics; incomplete parts receive independent marks, while free-form strings or unparseable rubrics return `review-required` with no invented grade. Real-file regressions cover full and partial two-component marking.
- Integrated additional real-question regression tests into native CI. Final GitHub Actions run **`41055598898`: 322/322 PASS, 0 failures**, real capacity and objective-scoring QA steps PASS. All results remain `releaseGrade:false`, `ledgerEligible:false`. **No new curriculum-approved V2 bank questions** and no XP/MP or iPad updates. Staged objective scoring can only become authoritative after a separate independent curriculum/rubric review, fail-safe learner answer-input validation, durable-storage integration and iPad QA.
- `mark_points` and `semantic_groups` remain outside automated objective scoring; 1,041 structured questions counted in the overall release gate remain unapproved, even though the 191 objective source examples now work as previews. The 27 listed-but-missing Year 9 files, 163-per-day real certified supply and 30-day student-history proof also remain unresolved.
