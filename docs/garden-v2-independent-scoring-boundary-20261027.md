# Garden Version 2 — Independent Daily and Scoring System
Date: 2026-10-27
Status: DRAFT SPECIFICATION ONLY; not deployed.

## Non-negotiable distinction
**Garden Version 2** is the user's NEW, proposed scoring, question allocation, Daily-task and Mastery design. It is **NOT** the scoring or task rules currently deployed in the existing Scholar's Garden app.

Do not refer to fixes for current-app PR #173, #174, #175, #176 (Biology saved credit, canonical store, Practice cache) as evidence that Garden V2 scoring is implemented or verified. Those fixes address production maintenance only.

## Implementation boundary
- Keep V2 rules and V2 tests in dedicated, versioned source paths, separated from production assets, currently deployed scoring, storage keys and routes.
- No importing V2 into the live app, no automatic migration, no merging to main, no alteration of learner XP, task history, answers, backup, rewards or recovery data without a separate explicit release decision and evidence-based migration plan.
- Source topic JSON may be audited and reused as read-only input, but V2 eligibility, grading, assignments and credit records must remain separately versioned.
- Existing app QA and Garden V2 QA are separate reports, with independent pass/fail conclusions.

## Garden V2 proposal checkpoints, not current app behavior
- Proposed 10 daily tasks totaling 163 question slots; verify exact task names and policy against final signed-off proposal before wiring runtime.
- Vocab: 30 French + 30 Latin each, proposal split 25 Year 7–8 plus 5 taught Year 9.
- Two Mastery allocations of 20 questions each; require 40 conflict-free eligible questions, not 40 nominal records.
- Strictly no double-credit for a correct answer; preserve opened/partially completed assignments and dated history, even on reload.
- Cross-task reservation by question ID and meaningful question family/fingerprint, with explicit shortage, not fabricated completion.
- Retention requires genuine prior-date eligible attempts; a fresh never-attempted question must not silently substitute.
- GCSE 1/2/3 mark Daily component and partial marking require academically approved rubrics and clearly separated question and mark counts.
- Never change existing user scores because of V2 preflight/testing.

## Current V2 readiness (at this document's creation)
1. Draft PR #172 includes independent read-only inventory and allocation/eligibility prototypes, plus synthetic tests.
2. Prototype passing or 30-day synthetic tests do not prove the actual learner's 163-slot daily allocation.
3. The V2 integrated runtime, actual grading, complete learner-state simulation and iPad acceptance are **NOT FINISHED**.
4. The latest current-app PR #176 CI results are **not** Garden V2 results.

## Next engineering gates
1. Freeze final V2 scoring policy and formal task contracts independently of today's live app.
2. Implement explicit V2 scoring ledger with idempotent per-answer credit, replay safety and deterministic completion receipt contract.
3. Integrate learner-aware selection with safe shortage handling; test with anonymised user state without mutating it.
4. Validate 30 days against actual eligible banks, cross-task conflicts and zero/partial/full completion.
5. Stage separately, manually review learning quality and Safari/iPad persistence; only then consider explicit release/migration.
