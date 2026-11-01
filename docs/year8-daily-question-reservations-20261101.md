# Year 8 Daily task question reservations — release candidate (1 November 2026)

**State:** isolated Draft PR, dependent on **PR #249**. No production deployment, data migration, XP, MP, Pet or Recovery mutation.

## What was missing
- Current Year 8 Daily planner normally chooses different topics per task, but a previously pinned/recovered assignment can still share a source topic with another today's task. A 20-question Mastery can unintentionally consume questions a Standard or Due task needs.
- The question selector excludes correct IDs and same-concept variants within Mastery but previously did not reserve *other tasks' prospective IDs* before either task was answered. Cross-task correctness cannot be inferred from the question bank alone.

## Implemented read-only contract
New `assets/daily-question-reservations-20261101.js`:
1. Considers only **current** date, Year 8, supported ordinary locked Daily tasks, exact subject/topic/year and the pinned plan. Declines any missing/unrecognised assignment. Other dates and free study cannot affect today's reservations.
2. Uses the actual loaded source question IDs and concept families; partitions a shared topic deterministically between today's known tasks **before any answers**. No writes, random seeds or backdated assignment changes.
3. Reserves an existing task's verified correct IDs, actual marked correct **and wrong** question IDs, and its specified due/weak review IDs *before* allocating unclaimed families. An unfinished task therefore keeps its marked question for a legitimate retry; no false credit.
4. Excludes 1–2-day-old unfinished Recovery proof question IDs **only when linked to a trustworthy historical task with identical subject/topic/year**. When opening the Recovery itself, the guard is bypassed; the existing dated Recovery logic remains in charge.
5. For each other task's occupied concept family, excludes **all** variant question IDs. If two 20-question tasks share only 25 different concepts, one task cannot steal the other's reserved stock to fake a pass. A shortfall is reported using PR #249's original-target guard, rather than silently lowering the target.
6. Filters reservations both in the initial locked question fallback and **after** unfinished retry can reorder questions. Existing in-memory `sessionSnapshot` remains intact.

## Source scope and QA
- `tests/year8-same-day-reservations-20261101.mjs` exercises two empty tasks, source concepts shared by multiple question IDs, an original wrongly answered question, verified assignments, active vs expired Recovery, Year 9/date/topic isolation, Mastery refills and runtime wiring.
- `tests/french-practice-regression.mjs` was updated to inject the added pure helper in its VM test harness. French marks and accented answers are untouched.
- `.github/workflows/year8-same-day-reservations-20261101.yml` reruns the structural and behavioral tests. Parent PR #249's already passing Year 8 Mastery and Daily/Recovery QA remain mandatory.
- No new Biology/Latin question banks are merged here. Biology #245 and Latin composite #248 remain separate.

## Important limits — do not misrepresent as atomic locking
This is a **deterministic read-only reservation policy**, NOT a database-backed atomic lock across two devices or concurrent iPad tabs. It protects the recorded, date-pinned plan and task-scoped marked work, but cannot observe an unpersisted in-progress question on another disconnected device. A future persisted cross-tab reservation ledger would need an IndexedDB transaction, quota/recovery design and iPad replay tests. Do not add one silently to this preservation-sensitive repair.

## Mandatory release gates
- Whole Site, Daily Progress, Mastery, French Practice, iPad WebKit and Recovery browser tests pass at the combined PR head.
- 20-item/17-correct with 3 independent correct evidence, repeated-question submissions, 48-hour recovery and Day 2/7 review.
- Verify real iPad export/import, task-specific drafts, existing Pet/Outfit/XP/MP records and no quotas exceeded.
- Do not mark any incomplete assignment as done; never replace an already pinned assignment or alter historic receipts.

## 1 November follow-up: WebKit and legacy collision QA
The previous latest-head branch passed Whole Site but failed the **Biology WebKit iPad smoke** because its synthetic test attempted to remove only a legacy localStorage draft. Safari correctly resumed a newer test draft saved in IndexedDB/sessionStorage, hiding the expected depleted-bank state. The test now uses the existing visible **Start a fresh set** button inside the disposable Playwright test browser only, and asserts the Student Scholar state (daily task rows, correct-answer IDs) is unchanged after that test-only draft cleanup. **No production code automatically deletes drafts** and no real iPad data was accessed.

A further read-only historical safeguard preserves original per-task marked question evidence when a legacy data log already shows the same ID answered for two different tasks. We cannot retroactively pretend those two saved records never existed; future fresh allocations remain disjoint. Added automated checks for this case and for no Year 9, preview or informal content in Year 8 source reservations. This is still NOT a cross-tab atomic reservation lock.

Release gate remains the latest commit's separate WebKit smoke, Whole Site Browser, Recovery and 48-hour Day 2/7 QA results, followed by a real learner export/import replay before merge.
