# Maths V3.1.1 — semantic concept anti-duplication and 8/10 persistence correction

**22 November 2026 | Draft PR #306 | NOT FOR MERGE / NO LIVE LEARNER CHANGE**

## Why this increment was necessary
The established 200/200 mathematical answer-key proof remains valid. The separate 50-source-template pedagogy screen revealed that different source template labels can test effectively the *same* mathematical thinking (e.g., G7/G8 ticket-price simultaneous-equations families, rearranging rational expressions, graph intersection plus perpendicular gradient). The Maths Daily selector had prevented identical `templateId` reuse, **not different `templateId` with equivalent conceptual demand**.

The Scholar dated-task compactor also used `done: progress >= target` for all cards. Unlike ordinary tasks, Maths uses `progress` for ten **submitted** questions, but `done` requires at least **nine first-submit correct answers**; blindly compacting ten submitted was capable of turning a failed `8/10` task into `done:true` in historical task receipts.

## Actual Draft code modifications (not deployed)
- `assets/daily-maths-v31-intake-gate-20261122.js`: A Maths question now needs a documented reviewer-signed `conceptFamilyId`, `conceptFamilyEvidence` and `conceptFamilyReviewer` **in addition** to previously required teacher-taught, independent grade, full worked maths, each wrong-option rationale, source digest and iPad QA. It cannot be inferred from the author's template ID. Absent evidence remains BLOCKED; no source is self-approved.
- `assets/math-study/daily-v31-selector.js`: Exclude identical semantic concept-family IDs within a ten-question assignment even where templates differ; prefer not to repeat prior-day semantic families, separately from template avoidance. No unapproved replacement is permitted.
- `assets/daily-tasks-v3-20261122.js`: Persist two distinct maps in each approved assignment: `approvedTemplateByQuestion` (original source family) and `approvedConceptByQuestion` (independently reviewed semantic family). Historical reservations use both; Maths question validator demands reviewer provenance.
- `assets/index-BLVOhKhN.js`: Preserve both concept and template maps through compact dated study records. Preserve Maths explicit `done` from formal 9/10 evidence rather than reconstructing it from raw ten-question submission count.
- `assets/math-study/daily-v31-formal-submission.js`: Refuse ten-question assignments with missing/duplicate/pinned-mismatch `conceptFamilyId`; retain first attempt, 4/4/2 grade mix, five topics × two, A–F mapping, taught/grade/reviewer criteria and date guard.
- Updated scoped unit tests and added synthetic cases for duplicate cross-template concept IDs, previous-day concept reservation, missing reviewer evidence, graded 8/10 not passed, and 9/10 passed.

## Direct actual-source JS runtime smoke (isolated; NOT GitHub CI / iPad)
Executed the exact current pure JS modules reloaded from the Draft branch, with synthetic reviewed question fixtures **only**:
- `selectMathsV31Daily`: **20/20 dates assign 10 questions**; **200/200 unique fixture IDs** consumed; no previous-day semantic-family repeats; subsequent day blocked due to exhaustion.
- `buildDailyV3` actual planner: **20/20 ten-question Maths assignments**, 10 distinct semantic concept IDs per session, 10 original source-template IDs per session; **200 unique fixtures consumed**; day 21 blocks rather than reuse an unapproved/freshness-depleted ID.
- `verifyMathDailyAssignment`: reviewed pinned semantic concept map valid; different template IDs with the **same semantic concept ID rejected**.
- `makeVerifiedMathsSubmission`: first formal wrong A–F selection marked incorrect; forged date string rejected.
- `mathsEvidence`: ten submitted with **8 correct => completed=false**, nine correct => **completed=true**; corrected repeat cannot upgrade first wrong answer; incorrect source A–F option cannot be made correct by forged `correct:true`.
- **Not performed:** actual physical iPad, real PWA offline restart, source-backed 200-item graded player and durable XP/MP ledger after IndexedDB quota failures.

## Academic QA status / limits
- Prior mathematical stem and six-unique-option checks: **200/200 PASS**.
- 50 source templates were risk-screened in `daily-v3-maths-v311-200-item-pedagogy-screen-20261122.md`, but **50 labels are NOT 50 proven distinct concepts**.
- 50 actual wrong options across ten original sample IDs received an explicit `TRACEABLE / POSSIBLE / UNEXPLAINED / RED_FLAG` triage. This does **not** constitute 1,000 independently justified misconceptions for the full source.
- Source text of all 200 questions and answers was reopened via indexed PDFs in the earlier review; the exact full raw 200-item JSON is not available in this Draft branch, so no complete edited-bank hash or repaired source release has been claimed.
- **0/200 official school-taught, grade-calibrated, distractor-signed and iPad-approved Maths question records.** Do not set `mathsRuntimeReady`, enable Maths credit, or merge.

## Remaining blockers
1. Exact source-backed five wrong-option error paths per item, real GCSE Higher Grade 7+ demand benchmarking, and actual TGS taught-subskill evidence (Spring bisectors quarantined).
2. A real graded offline Maths player connected to durable first-answer evidence with proper acknowledgement of storage failure, no XP/MP if a save fails.
3. Current GitHub Actions **fully finished-green** verification; prior completed workflow results do not count as latest source commit evidence.
4. Physical iPad PWA reload/restart, QuotaExceeded, old-progress/Recovery/Mastery preservation; safely reconcile separate newer `main` Food Tests/numeric marking corrections.

**Do not merge PR #306; leave Maths approval 0/200. No student data was touched.**
