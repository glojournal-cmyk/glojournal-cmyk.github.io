# Daily Tasks V3 — Technical QA Report
**Date:** 22 November 2026  
**Status:** **PARTIAL IMPLEMENTATION / RELEASE BLOCKED**  
**Base:** `main` at `c37627acafde596ac5ef9232d25346efe6d90827`  
**Development branch:** `feature/daily-tasks-v3-20261122`  
**Live deployment:** **NOT PERFORMED; NOT VERIFIED**. No change was merged to `main` and no claim about production PWA state is made.  
**Unit test evidence:** [Daily V3 contract workflow run 45011210120](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45011210120): 17/17 V3 unit tests passed. Further regression run may have newer results.

## Files changed
### Runtime
- `assets/daily-tasks-v3-20261122.js` — V3 ten-card contract, 165 normal questions, freeze guard, explicit Academic QA supply gates, languages/math evidence and question identity checks.
- `assets/index-BLVOhKhN.js` — date-gated V3 planner call; V3 assignment metadata retained in compact daily history; old dated receipts kept in existing paths.
- `assets/daily-vocab-20261003.js` — V3 10 Y9 cap only for explicitly approved teacher-taught words; otherwise Year 7–8 backfill. Historical 27+3 unchanged.
- `assets/study._subject.practise-D_PWgUd7.js` — composite Language 5+5 task route; Y9 Standard B and Y9 Due selection restricted to approved question IDs.
- `assets/quiz-session-rWAnuDVj.js` — prohibit blind single-subject `bumpDaily` for composite Languages card.
- `study/languages/standard/index.html` — Languages subject launcher with independent continuation links and no reward side effect.

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
4. Standard A, both Year 8 Mastery tasks and Year 9 Light are reused from the original planner; Year 9 Standard B is **blocked** until 10 approved distinct uncredited concepts. It never borrows Year 8.
5. Languages Standard selects separate **five-concept** accepted Latin and French Year8 groups, and includes independently specified question IDs; one card with per-language attempt/correct evidence. This is a scaffold for production content; there is **no accepted grammar manifest** yet.
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
| Actual randomized question selection + score reconciliation | Correct per-subject/year selection, unique concepts, persistent correct evidence | **NOT VERIFIED** | Blocker |
| Browser iPad PWA restart, QuotaExceeded, previous receipts | No data loss/inflation | **NOT VERIFIED** | Blocker |
| Maths option shuffle / worked render / timing / retries | Functional 10-question exam-style Maths quiz | **NOT IMPLEMENTED / NOT VERIFIED** | Bank & runtime blocker |
| Full marking, difficulty, alternatives, school-taught curriculum | Independent academic QA passed | **NOT VERIFIED** | See Academic QA Report |
| Live website | New code deployed and working on real device | **NOT DEPLOYED / NOT VERIFIED** | No main merge |

## Regression record and important limitations
- V3 contract suite: **17 passed, 0 failed** at `7666cb726de1da02452f1b05e82c0ca766b429be` (workflow 45011210120).
- Initial expanded legacy regression suite: **58 passed, 1 failed** (workflow 45011321308), because a hard-coded 3 November expectation said 110 qualified Year8 packs while the current repo catalog has 111. Neither V3 code nor its branch changes `content/catalog.json`. The stale test fixture was updated to the current **111** without removing per-topic source/concept assertions; a follow-up run determines whether other regression blockers exist.
- **Do not interpret unit or source-inventory green as full technical QA, full academic signoff or device QA.**

## Release gates remaining
1. Import and independently approve student-taught source manifests; verify production quiz renderer selects *only* approved IDs.
2. Add the real Maths quiz, stable 10-Q daily assignments and resume, six-choice shuffle/marking, worked steps, mathematics rendering, duration record, first/retry distinction, and no-hint full-credit rule; unit and iPad browser QA.
3. Full V3 end-to-end tests: 10 cards, 165 non-repeated genuine questions, real Standard B topics, Language Standard split and partial completion, Y8/Y9 Due priority, Day2/7 recall, actual answers vs planner counts and ledger consistency.
4. Snapshot-and-restore tests for progress, XP, MP, streak, Mastery, 48-hour Recovery, dated completed assignments, storage quota and iPad PWA refresh/restart/update.
5. Independent Academic QA signoff on each imported source question; only then consider merging to main. After merge, verify GitHub Pages job and real production pages on iPad.

**Deployment decision: WITHHELD.**
