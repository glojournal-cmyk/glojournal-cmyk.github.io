# Daily Tasks V3 — Technical QA Report
**Date:** 22 November 2026  
**Status:** **LANGUAGES + Y9 STANDARD B SOURCE QA AND SCOPED UNIT TESTS IMPLEMENTED; REAL-DEVICE RELEASE STILL BLOCKED**  
**Base:** `main` at `c37627acafde596ac5ef9232d25346efe6d90827`  
**Development branch:** `feature/daily-tasks-v3-20261122`  
**Live deployment:** **NOT PERFORMED; NOT VERIFIED**. No change was merged to `main` and no claim about production PWA state is made.  
**Latest completed CI evidence at time of this report update:** [V3 CI run 45016892120](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45016892120): **25/25 V3-specific tests and 59/59 existing Daily/Vocab/Recovery tests passed** at SHA `ce3469f215`. Subsequent changes add scope-aware scoring, replay/cross-task checks and iPad browser QA, but their newer CI workflows were queued as of the report update and cannot be called passed until completion.

## Files changed
### Runtime
- `assets/daily-tasks-v3-20261122.js` — V3 ten-card contract, 165 normal questions, freeze guard, explicit Academic QA supply gates, languages/math evidence and question identity checks.
- `assets/index-BLVOhKhN.js` — date-gated V3 planner call; V3 assignment metadata retained in compact daily history; old dated receipts kept in existing paths.
- `assets/daily-vocab-20261003.js` — V3 10 Y9 cap only for explicitly approved teacher-taught words; otherwise Year 7–8 backfill. Historical 27+3 unchanged.
- `assets/study._subject.practise-D_PWgUd7.js` — composite Language 5+5 task route; Y9 Standard B and Y9 Due selection restricted to approved question IDs.
- `assets/quiz-session-rWAnuDVj.js` — prohibit blind single-subject `bumpDaily` for composite Languages card.
- `study/languages/standard/index.html` — Languages subject launcher with independent continuation links and no reward side effect.

### Newly checked content and tests (22 November follow-up)
- `assets/daily-v3-approved-content-20261122.js` — narrow 40-item QA whitelist: 10 Latin Y8, 10 French Y8, 20 French Y9 across six source files; every accepted question has exact source id, concept, key, topic lesson, bank SHA.
- `tests/daily-v3-academic-approved-20261122.test.mjs` — verify source SHA, exact accepted answers, formal/preview status, unique MC option, French accent normalization and 40 explicit IDs.
- `tests/daily-v3-scoring-integrity-20261122.test.mjs` — date/subject/year/topic/task-specific answer receipts, no wrong/repair/assisted/recovery credit, no cross-task duplicate, 5+5 isolation, simulated JSON roundtrip and XP/MP/streak/Recovery/Mastery preservation.
- `study/languages/standard/index.html`, `tests/daily-v3-ipad-browser-20261122.mjs`, `.github/workflows/daily-v3-ipad-browser-20261122.yml` — distinct subject routes and real-app Chromium/WebKit iPad-emulation runtime selection/reload probes. **Not a physical iPad acceptance test; CI queued/not signed off.**
- `qa-reports/daily-v3-approved-question-register-20261122.md` — reviewable list of 40 exact questions, sources, keys and marking limits.

### Tests and evidence
- `tests/daily-v3-contract-20261122.test.mjs` — plan, source supply, quiz metadata validation, 5+5 credits, due recall case, legacy freeze and duplication tests.
- `tests/daily-v3-vocab-20261122.test.mjs` — Year 9 taught-source fallback and no inverse translation double credit.
- `tests/daily-20261103-inflight-and-window.test.mjs` — corrected one stale **test expectation**, Year8 qualifying catalog topics 110→111; the per-topic source validation and production filters remain in place. No curricular bank modified.
- `scripts/daily-v3-bank-audit-20261122.mjs` — read-only structural source inventory (Academic QA explicitly pending).
- `.github/workflows/daily-v3-contract-20261122.yml` — Node syntax, unit tests, existing Daily/Vocab/Recovery/source regressions, downloadable inventory artifact.
- `qa-reports/daily-v3-academic-20261122.md` and this technical report.

## Exact planner logic implemented
1. Dates **before 23 November 2026** are built by the unchanged V2 planner. A new V3 date first obtains the existing V2 plan; V3 transformation is **read-only** against the saved state.
2. If today's V2 assignment or its answer journal shows started work, return the original V2 plan unchanged. Today's existing ten-card V3 assignment is retained on rebuild; language and maths progress is derived from dated evidence.
3. Card order/nominal counts: French Vocab 30, Latin Vocab 30, Languages Standard 10, Standard A Y8 10, Standard B Y9 10, Mastery A Y8 20, Mastery B Y8 20, Maths 10, Due 10, Year9 Light 15. Weakness Review is absent from new V3 Daily but existing weakness state remains in the learner store.
4. Standard A, both Year 8 Mastery tasks and Year 9 Light are reused from the original planner. Year 9 Standard B now has **two narrow, individually reviewed ten-question candidate topics** (future tense, perfect tense), selected by uncredited concept. It never borrows Year 8 or repeats an already credited concept; exhaustion blocks.
5. Languages Standard now has **two approved five-concept Latin grammar pools and two approved five-concept French grammar pools**. The card pins exact approved question IDs and independently verifies the Latin/French answer receipt by date/subject/year/topic/concept. Other Daily tasks' question IDs cannot confer a second credit.
6. Year9 vocab is selected only after explicit `academicQA:approved` plus `taughtVerified:true` per word; Year 7–8 supplements the unapproved or insufficient Y9 quota.
7. Due Y9 may only be picked from 10 independently approved due concept groups each backed by actual saved due timestamps. Existing Year8 Day2/7 recalls take priority; an unopened 5-question legacy recall is offered inside a ten-question new-card target, without minting prior completion. Production Day2/7 + full Due scoring still requires end-to-end verification.
8. Maths 10 uses an approved-only 4/4/2 metadata supply gate, six unique option IDs/texts, one keyed correct option, stated distractor rationales and worked solution/source fields. **No actual Maths bank or working Maths quiz exists yet**, so no Daily completion/XP is granted for this task.
9. V3 does not write `XP`, `MP`, `streak`, `topicStats`, `dailyLog` or historic task receipts during planner construction. Actual app save/refresh/restart integrity remains to be independently tested on an iPad PWA copy.

## Test cases — expected vs actual
| Case | Expected | Actual | Evidence |
|--|--|--|--|
| Contract | 10 unique card IDs, target sum 165 | Passed | V3 unit |
| Old date | V2 tasks, earned credit unchanged | Passed in fixture | V3 unit |
| Current day begun on V2 | No V3 replacement, old receipt preserved | Passed in fixture | V3 unit |
| Standard B supply 0/5/9/10/15/20 | Block below ten **distinct** concepts | Passed in synthetic fixture | V3 unit |
| Standard B Year boundary | Year9 only, no Year8 substitution | Passed in synthetic fixture | V3 unit |
| Languages one-sided credit | Latin-only answers cannot complete 5+5 | Passed in synthetic fixture | V3 unit |
| Vocabulary new date no approved Y9 | Fall back to 30 Year7–8 distinct words | Passed in synthetic fixture | V3 vocab unit |
| Vocabulary legacy date | Keep 27+3 history | Passed in synthetic fixture | V3 vocab unit |
| Maths validator | Reject fewer than 6 options / repeated options / absent correct ID | Passed on **synthetic metadata** | V3 unit |
| Maths completion | Ten distinct marked submissions; 9/10 target reported separately | Passed on synthetic attempts | V3 unit |
| Day2/7 unopened recall | Normal 10-task 165 target with no invented credit | Passed in synthetic fixture | V3 unit |
| Bank source inventory | Files parsed, count candidate concept IDs; no fabricated academic signoff | Passed structural check (254 files; zero structural issues) | Source audit |
| Actual question-ID source allowlist + scoped scoring | Select only approved 40 IDs and count per distinct concept, date, topic, subject/year | **Source-content audit completed; direct real-manifest planner/scoring smoke passed; actual full browser graded submissions pending** | Source QA and scoped smoke |
| Browser iPad PWA restart, QuotaExceeded, previous receipts | No data loss/inflation | **New Chromium/WebKit iPad-emulation workflow and storage tests added; execution results pending at update** | Browser/store gate |
| Maths option shuffle / worked render / timing / retries | Functional 10-question exam-style Maths quiz | **NOT IMPLEMENTED / NOT VERIFIED** | Bank & runtime blocker |
| Full marking, difficulty, alternatives, school-taught curriculum | Independent academic QA passed | **NOT VERIFIED** | See Academic QA Report |
| Live website | New code deployed and working on real device | **NOT DEPLOYED / NOT VERIFIED** | No main merge |

## Regression record and important limitations
- V3 contract suite originally **17 passed, 0 failed** at `7666cb726de1da02452f1b05e82c0ca766b429be` (workflow 45011210120). Expanded suite passed **25/25 V3 and 59/59 legacy** at `ce3469f215...` (workflow 45016892120), before further direct scoped-scoring/browser QA changes.
- Initial expanded legacy regression suite: **58 passed, 1 failed** (workflow 45011321308), solely due to a stale 3 November fixed expectation of 110 qualified Year8 packs. The current repository has 111; the branch has not changed `content/catalog.json`. That fixed expected count was updated to **111** while retaining full source-by-concept checks. The repeat legacy run [45011421000](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45011421000) passed **59/59**, with V3 contract **17/17** passed in the same CI run. This validates these specific tests, not device or academic quality.
- **Do not interpret unit or source-inventory green as full technical QA, full academic signoff or device QA.**

## Release gates remaining
1. Import and independently approve student-taught source manifests; verify production quiz renderer selects *only* approved IDs.
2. Add the real Maths quiz, stable 10-Q daily assignments and resume, six-choice shuffle/marking, worked steps, mathematics rendering, duration record, first/retry distinction, and no-hint full-credit rule; unit and iPad browser QA.
3. Full V3 end-to-end tests: 10 cards, 165 non-repeated genuine questions, real Standard B topics, Language Standard split and partial completion, Y8/Y9 Due priority, Day2/7 recall, actual answers vs planner counts and ledger consistency.
4. Snapshot-and-restore tests for progress, XP, MP, streak, Mastery, 48-hour Recovery, dated completed assignments, storage quota and iPad PWA refresh/restart/update.
5. Independent Academic QA signoff on each imported source question; only then consider merging to main. After merge, verify GitHub Pages job and real production pages on iPad.

**Deployment decision: WITHHELD.**

## 22 November follow-up: direct real-whitelist scoring smoke
Independent from the Github Actions queue, the exact branch V3 planner module and real 40-ID whitelist were loaded and executed against a no-credit synthetic learner state. **Observed:** 10 cards / 165 targets; Languages split 5 Latin + 5 French; Standard B assigned Year9 French future tense with 10 approved IDs; Math intentionally blocked. Five correct Latin and zero French gave composite progress 5/10, not completed. Ten uniquely correct approved Year9 Standard B answers plus two repeat submissions still gave only 10/10; another fixture with nine correct, one wrong, repair/hint answer attempts gave 9/10 and not completed. This is actual plan/answer-evidence logic, **not** a proof that the React quiz UI or iPad PWA saved ten real student submissions.

## QA disposition
**The 40-question academic whitelist and planner-scoring isolation have substantive positive evidence. Full Technical QA for the live app and physical iPad remains OPEN / RELEASE BLOCKED.** Keep PR as draft and production unchanged until real browser, storage, grading and learner-state regression gates are proven. Maths remains out of scope (bank not supplied).
