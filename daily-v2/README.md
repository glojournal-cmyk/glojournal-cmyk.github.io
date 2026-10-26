# Scholar's Garden Daily V2 — isolated implementation

This is a **staging-only clean rebuild**. The live Daily Task engine remains unchanged. Do not import this directory from production UI until the complete acceptance gates in `DAILY_V2_QA.md` pass and release approval is given.

## Implemented modules
- `src/ledger.js`: pure, replay-idempotent per-day answer evidence and progress projection. Ambiguous legacy baselines are explicitly flagged as unreconciled and do not silently double-credit.
- `src/planner.js`: ten-task deterministic, all-or-nothing 163-question planner with exact quota checking. Prioritises Mastery topic depth, reserves GCSE originals, composes language skills across topics, cycles vocab, and uses only persisted prior attempts for Retention.
- `src/storage.js`: compare-and-swap transaction CONTRACT for storing a frozen daily plan and answers with mandatory read-back verification. `createMemoryDailyV2Repository` is a **volatile testing fake only**, NOT a working Safari or production adapter.
- `src/bank-adapter.js`: genuine topic JSON normalization requiring independent curriculum review manifest, never auto-upgrades bank formats into Mastery.
- `src/indexeddb-repository.js`: staging-only actual IndexedDB CAS adapter; unit-tested with an IDB behavioral fake, NOT validated in iPad Safari.
- `src/legacy-review.js`: read-only conversion/diagnostics for historical counter baselines, without invented identities or writes.
- `tests/*.test.js`: isolated regression suites (97 passing in the V8 test harness; native Node/GitHub Actions outcome not yet verified).

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
5. Production-free 30-day simulation with realistic student evidence and actual Bank availability.
6. GitHub Actions / native Node suite and real Safari/iPad verification, followed by release approval.

## Workflow
Read `DAILY_V2_PROGRESS.md` before working, write a bounded module, run its tests, commit, log exactly what was verified. Do not patch legacy Daily as part of this new development.

## Latest development checkpoint
See `BANK_CERTIFICATION_GUIDE.md` and `DAILY_V2_PROGRESS.md` for the latest handoff. Do not confuse an implementation of IndexedDB browser code with proof of real Safari QA. Legacy opaque baseline reconciliation, true mastery-bank qualification and real-bank 163-question preflight are incomplete.
