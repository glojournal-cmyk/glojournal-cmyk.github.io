# Scholar's Garden — Daily V2 Clean Rebuild
Status: DESIGN BASELINE (not deployed), 2026-10-26. This file describes the agreed design and outstanding decisions; it is NOT a claim that the app implements these rules.

## Non-negotiable boundaries
- Rebuild the Daily engine independently, not another patch on the existing Daily modules.
- Do NOT change production/GitHub Pages, existing student data, XP, wardrobe, Study, Play or saved learning history while developing.
- Migration MUST preserve legacy verified credits even where the old ledger lacks exact question IDs; do not fabricate question-level evidence.
- Separate Daily V2 staging storage and test state. No live writes from staging.
- Do not enable a V2 task whose question bank, required formats or persistence is not verified.

## Daily task plan (10 tasks, 163 questions)
| id | Name | Target | Criteria |
|---|---|---:|---|
| latin-vocab | Latin Vocab | 30 | 25 unique Y7-8 vocabulary concepts and 5 Y9 concepts, cyclic after whole round |
| french-vocab | French Vocab | 30 | same; independent French-accent-tolerant grading |
| latin-standard | Latin Standard | 10 | Y7-8 + taught Y9: 4 grammar, 3 translation, 3 taught passage analysis (suggested proportions) |
| french-standard | French Standard | 10 | Y7-8 + taught Y9: 4 grammar, 3 translation, 3 short writing (suggested proportions) |
| science-standard | Science Standard | 10 | taught biology/chemistry/physics, balanced long-term rotation |
| mastery-a | Mastery A | 20 | taught topic, no Standard-completion prerequisite, favour unmastered topics |
| mastery-b | Mastery B | 20 | distinct taught topic if possible, same availability/quality rules |
| spaced-retention | Spaced Retention | 10 | ONLY questions with persisted prior attempts, preferentially due 2-/7-day or older |
| gcse-exam-skills | GCSE Exam Skills | 3 | exclusive question IDs AND unique original prompts, 1/2/3-mark exam-style questions with mark schemes |
| year9-progressive | Year 9 Progressive Learning | 20 | taught Y9 only; 6 foundation, 11 standard, 3 mastery-lite (suggested mix) |

### Core allocation and completion rules
1. Preflight all ten tasks before publishing a day plan. Eligibility uses actual loaded question objects, not catalog counts.
2. Pre-assign stable question/variant identities and maintain a reserve strategy for incorrect answers. An incomplete task must never become a dead end; never silently cap/auto-complete for exhausted questions.
3. Exclude already-correct questions from ordinary same-day task reassignment; allow explicitly valid cross-day Vocab cycle and historical Spaced Retention. Do not double-credit the same answer event or concept.
4. Each recorded attempt has immutable event ID, date, task ID, question ID, concept ID (if applicable), assigned subject/year/topic, marking result, timestamp, storage receipt. One event cannot count for two Daily tasks.
5. Durable commit first; only then display verified progress. Home, 30-day history, XP and Recovery derive from one reconciled source of truth. Save failures are visible and recoverable.
6. Quiz reopening restores the frozen assignment and correct-score tally; no rerolls/double credit. Don't recompute an in-progress plan from changed mastery state or changed catalog metadata.
7. Spaced Retention must use persisted historical attempts as proof and must not overwrite original results. Unserved due retention remains due; insufficient history is an explicit unavailability error, never silently filled with unseen questions.
8. Mastery must have at least 20 genuinely available, grade-appropriate questions after exclusions and ideally a difficulty mix of 4 Foundation / 10 Application / 6 Challenge. 20 enabled alone is NOT sufficient; do not borrow 20 low-level vocabulary MC questions.
9. GCSE reports both 3/3 questions marked and a separate earned/possible marks total; no score equivalence assumptions.
10. Year9 content requires explicit taught/eligible status. Don't use all enabled Y9 catalog entries as evidence of taught status.

### Language and grading
- Ignore irrelevant case/whitespace/punctuation; French diacritics may be ignored for Daily learning; Latin permissible word order variants must be accepted.
- French free-sentence writing needs criterion/meaning-sensitive marking; no brittle string-equality grading.
- Science written answers need robust concept/mark point evaluation, units and equivalent responses; GCSE awards partial marks.
- Align GCSE French with verified AQA and Latin with verified OCR; verify science boards independently against school records before certification.

### Learning outcomes (not just task completion)
- Measure 7-day retention, performance on previously unseen transfer questions, and changes in weakest skills independently of repeated-bank completion.
- The 163 question target remains the agreed design baseline; real-world ~45-min completion is a measured baseline, not proof every redesigned writing question fits the same time.

## Open educational decisions (DO NOT guess)
- Whether five Y9 vocab concepts each day must be wholly new versus revisited during cyclic rotation.
- Exact 20/20 Daily completion, Mastery assessment pass and day-2/day-7 'Mastered' state linkage; do not collapse them.
- Whether GCSE Task 9 completion requires only three marked responses or a passing percentage.
- How to handle permanently exhausted genuine mastery topics without degrading educational quality.

## Hard acceptance gates
- 30-day deterministic simulation including low-bank, high-mastery, fully cycled vocab, varied taught-topic and error-heavy cases.
- Reproduce historical 28/30 French, 12/15 Biology, 8/15 Physics dead ends in test fixtures and ensure all are recoverable.
- Verify iPad/Safari reload, close/reopen, failure to write, storage-quota errors and device-local restored data.
- Prove migration leaves original progress/XP unchanged, and rollback cannot discard answers created since cutover.
- Inspect 100% of available Mastery questions for quality as well as counts. Latin depth is known weak; French/Biology need review. Science counts do not imply every question is deep.
- No production cutover without tests and explicit approval.

## Legacy opaque baseline credit restoration (implemented as isolated staging logic, not production)
Old 28/30 progress may lack each exact correct concept ID. The new ledger preserves the historical count. To safely credit new, verified submissions without double-counting, it can optionally accept an **independently verified SUPerset** of all concept IDs that might have contributed to the old count, identified from the student's original frozen assignment evidence. Only a new concept outside that set can increase the old counter. The original 28 correct IDs are NOT inferred, and if the superset is unavailable the counter remains protected with any attempted credits marked unreconciled. Cross-device disagreement invalidates the superset until separately resolved. Actual backup-schema mapping and iPad import remain UNVERIFIED.
