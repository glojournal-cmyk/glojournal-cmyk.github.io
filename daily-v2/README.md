# Scholar's Garden Daily V2 — isolated implementation

This is a **staging-only clean rebuild**. The live Daily Task engine remains unchanged. Do not import this directory from production UI until the complete acceptance gates in `DAILY_V2_QA.md` pass and release approval is given.

## Implemented modules
- `src/ledger.js`: pure, replay-idempotent per-day answer evidence and progress projection. Ambiguous legacy baselines are explicitly flagged as unreconciled and do not silently double-credit.
- `src/planner.js`: ten-task deterministic, all-or-nothing 163-question planner with exact quota checking. Prioritises Mastery topic depth, reserves GCSE originals, composes language skills across topics, cycles vocab, and uses only persisted prior attempts for Retention.
- `src/storage.js`: compare-and-swap transaction CONTRACT for storing a frozen daily plan and answers with mandatory read-back verification. `createMemoryDailyV2Repository` is a **volatile testing fake only**, NOT a working Safari or production adapter.
- `src/bank-adapter.js`: genuine topic JSON normalization requiring independent curriculum review manifest, never auto-upgrades bank formats into Mastery.
- `src/indexeddb-repository.js`: staging-only actual IndexedDB CAS adapter; unit-tested with an IDB behavioral fake, NOT validated in iPad Safari.
- `src/legacy-review.js`: read-only conversion/diagnostics for historical counter baselines, without invented identities or writes.
- `src/simulator.js`: read-only 1–90-day all-correct allocation stress test; a synthetic upper-bound test, not a real-bank availability claim.
- `tests/*.test.js`: isolated regression suites (169 passing in the V8 test harness; native Node/GitHub Actions outcome not yet verified).

## Run local Node tests
```bash
node --test daily-v2/tests/*.test.js
```

## Key planDailyV2 inputs
`{day, questionBank, priorAttempts, taughtTopicIds, correctQuestionIds, masteryStages, subjectExposure, existingPlan}`

All question records must be **real, loaded** and independently audited. Example:
```js
{
 id:"unique-question-id", subject:"latin", year:8,
 topicId:"la-y8-topic", status:"enabled", formal:true,
 roles:["latin-standard"], skill:"passage", depthBand:"challenge",
 prompt:"...", conceptId:null
}
```
For Vocab use `roles:["latin-vocab"]` and a stable, true unique `conceptId`. For GCSE use `roles:["gcse"]`, `marks:1|2|3`, and a nonempty `markScheme`. Year 9 is eligible ONLY if the topic ID is in `taughtTopicIds`. Retention consumes only `priorAttempts` carrying `persisted:true` from a previous date and containing a valid question ID. No role or difficulty is guessed from catalog counts. The bank adapter and educational content certification are **not implemented yet**.

The planner only publishes `status:'ready'` after allocating every task exactly to target. `status:'blocked'` includes shortage diagnostics and `tasks:[]`; blocked plans must not reach the student. Previously frozen and persisted plans may be passed as `existingPlan` to prevent rerolls after reload.

## Persistence rule
In production, implement `repo.read(day)` and `repo.compareAndSwap(day,expectedRevision,nextSnapshot)` backed by **one atomic durable IndexedDB transaction** with a revision compare, transaction completion handling, cross-tab conflict retries, and explicit quota/access error reporting. Commit/read-back receipt must be verified before scoring. The contract tests use only an in-memory fake; zero Safari persistence claims are made.

## Known release blockers
1. Genuine durable browser storage adapter and catastrophic failure/backup recovery logic.
2. Verified legacy baseline migration with unknown Question ID histories (do not reset or double-credit). Existing `opaque` baseline deliberately pauses new credit and reports pending reconciliation; this is a known **not yet production-usable** case.
3. Bank normalization and quality audit across all ten tasks, especially advanced Latin/French/Biology.
4. Task UI, Home / 30-day / Recovery / XP integration, and correctness of marking logic.
5. Real-bank/student evidence 30-day simulation and independently reviewed Mastery certification. The synthetic 30-day simulation exists and passes; it is NOT real-bank readiness.
6. GitHub Actions / native Node suite and real Safari/iPad verification, followed by release approval.

## Workflow
Read `DAILY_V2_PROGRESS.md` before working, write a bounded module, run its tests, commit, log exactly what was verified. Do not patch legacy Daily as part of this new development.

## Latest development checkpoint
See `BANK_CERTIFICATION_GUIDE.md` and `DAILY_V2_PROGRESS.md` for the latest handoff. Do not confuse an implementation of IndexedDB browser code with proof of real Safari QA. Legacy opaque baseline reconciliation, true mastery-bank qualification and real-bank 163-question preflight are incomplete.

## 2026-10-26 latest checks
- 169 V8 harness tests passed against exact committed JavaScript, including 10 multi-day simulation cases and four additional GCSE-stored-mark assertions.
- `QA_REAL_BANK_12_TOPIC_SAMPLE.md` documents a real 12-topic / 594-question source audit. Many topics have no difficulty-3+ questions despite enough raw question IDs.
- `bank-adapter.js` now rejects any certification missing a source-bound fingerprint. A changed prompt, stimulus, options or answer invalidates approval.
- `storage.js` enforces exact 1/2/3 GCSE max marks in frozen plan and per-attempt grading. No live app/UI or real Safari testing has been completed.

## 28/30 legacy preservation and safe recovery
Pure `ledger.js` now supports optional `potentialLegacyKeys`, `potentialKeysVerified:true` and `potentialKeysSource` in a baseline. They represent a verified SUPERSET of all concept identities that could have been credited in the historical 28/30 task, not invented records of exactly 28 correct answers. Fresh correct concepts outside the entire old set may safely advance to 29/30 and 30/30. Without verified prior roster evidence, any fresh concepts remain pending review; the baseline 28 must not be reset. `legacy-review.js` reads this only from explicitly verified `assignedVocabularyConceptIds`, never from arbitrary question IDs.


## Current staging-only features
- `src/continuity.js`: opt-in 1–9 complete task fallback; unavailable tasks remain clearly uncompleted and do not silently generate credit.
- `src/day-summary.js`: Home/30-day projection from the verified ledger, blocks full-day rewards for any partial day.
- `src/mastery-audit.js`: source evidence and individual question review queue, not automatic Mastery certification.
- Source triage: `QA_MASTERY_TRIAGE_8_REAL_TOPICS.md`.
- Latest regression: 169/169 passed in V8 test harness (native Node/CI and actual iPad Safari remain unverified).


## Standalone QA interface (latest 2026-10-26)
- `staging/index.html` is a separate **non-deployed** browser QA app, not part of the student's Home/Study/Recovery routes.
- `staging/qa-controller.js` uses frozen V2 plans, persisted readback and the single-source Home projection.
- `staging/qa-fixture.js` supplies fake 163-question or fake 160/163 shortage scenarios. No real learning answers, XP or student history are involved.
- `staging/README.md` describes how a developer can serve/check the feature branch over HTTP.
- **169/169 isolated V8 harness tests passed** across 11 focused suites (previous 158 rerun plus 11 new staging-flow tests); the browser UI itself has NOT yet been run in Safari or signed off.

## New five-subject Mastery question packs (Batch 1)
- `content/mastery/*.json`: 20 authored questions each for Latin, French, Biology, Chemistry and Physics (100 total).
- `src/mastery-draft-validator.js`: rigid structural/mark-scheme completeness gate; `tests/mastery-drafts.test.js` has ten source-backed tests.
- `MASTERY_BANK_BATCH1_QA.md` describes coverage and capacity limitations. Model answers require semantic/rubric review, NOT string equality, and student taught-topic status is not yet independently verified.
- **179/179 V8 harness tests passed** (old 169 + new 10). The five draft topics are still excluded by `bank-adapter.js` without explicitly verified, fingerprint-bound curriculum certification.
