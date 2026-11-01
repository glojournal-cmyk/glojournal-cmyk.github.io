# Scholar's Garden — Year 8 topic-bank capacity triage (1 November 2026)
**Scope:** Read-only inventory of the CURRENT `main` `content/catalog.json` (blob `5c0f16349986ffe7210690655e311023a2829db3`), plus known source-file audit limitations. No learner/backup data used. Nothing in this report certifies pedagogical quality or live availability.

## Current Year 8 catalog coverage
| Subject | Enabled topics | Nominal enabled records | Under 10 | Under 15 | 15–19 | 20–24 | 25+ |
|---|---:|---:|---:|---:|---:|---:|---:|
| Latin | 65 | 2492 | 25 | 34 | 2 | 3 | 26 |
| French | 30 | 4601 | 0 | 0 | 0 | 0 | 30 |
| Biology | 37 | 1001 | 0 | 4 | 6 | 4 | 23 |
| Chemistry | 8 | 280 | 0 | 0 | 0 | 0 | 8 |
| Physics | 13 | 455 | 0 | 0 | 0 | 0 | 13 |
| **TOTAL** | **153** | **8829** | **25** | **38** | **8** | **7** | **100** |

**What these counts mean:** The existing `assets/daily-curriculum-20261004.js` chooses only enabled Year 8 topics with **at least 15 nominal questions** AND at least one independent-answer format (plus learner-taught eligibility). An existing 20-question Mastery needs **20 ACTUALLY eligible, unreserved, not previously credited opportunities**; 20 catalog records is not equivalent to 20 available questions. Even a 25-question bank is a thin reserve after repeats, previous correct answers, duplicate logical prompts, spaced intervals, and concurrent tasks.

## Priority list — low catalog counts (below 20)
| Subject | Topic ID | Catalog enabled | Priority |
|---|---|---:|---|
| Latin | `la-y8-production-method` | 1 | P0 |
| Latin | `la-y8-whole-passage-understanding` | 1 | P0 |
| Latin | `la-y8-tense-purpose` | 2 | P0 |
| Latin | `la-y8-research-questions` | 4 | P0 |
| Latin | `la-y8-tense-recognition` | 4 | P0 |
| Latin | `la-y8-case-role-introduction` | 5 | P0 |
| Latin | `la-y8-declension-recognition` | 5 | P0 |
| Latin | `la-y8-perfect-patterns` | 5 | P0 |
| Latin | `la-y8-possessives` | 5 | P0 |
| Latin | `la-y8-choose-the-complete-translation` | 6 | P0 |
| Latin | `la-y8-english-latin` | 6 | P0 |
| Latin | `la-y8-latin-english` | 6 | P0 |
| Latin | `la-y8-person-and-number` | 6 | P0 |
| Latin | `la-y8-pluperfect-recognition` | 6 | P0 |
| Latin | `la-y8-restore-the-sentence` | 6 | P0 |
| Latin | `la-y8-tense-in-context` | 6 | P0 |
| Latin | `la-y8-translation-method` | 6 | P0 |
| Latin | `la-y8-vocative` | 6 | P0 |
| Latin | `la-y8-case-and-grammar-role` | 7 | P0 |
| Latin | `la-y8-choose-the-exact-latin` | 7 | P0 |
| Latin | `la-y8-complete-comprehension` | 7 | P0 |
| Latin | `la-y8-restore-the-exact-verb` | 7 | P0 |
| Latin | `la-y8-test-style-production` | 7 | P0 |
| Latin | `la-y8-test-style-translation` | 7 | P0 |
| Latin | `la-y8-tense-meaning` | 8 | P0 |
| Latin | `la-y8-case-functions` | 10 | P0 |
| Latin | `la-y8-map-locations` | 10 | P0 |
| Latin | `la-y8-why-each-place-matters` | 10 | P0 |
| Latin | `la-y8-accusative-forms` | 11 | P0 |
| Latin | `la-y8-set-text-verb-tense` | 11 | P0 |
| Latin | `la-y8-find-the-finite-verb` | 12 | P0 |
| Latin | `la-y8-genitive-phrases` | 12 | P0 |
| Latin | `la-y8-finite-verb-control` | 14 | P0 |
| Latin | `la-y8-set-text-comprehension` | 14 | P0 |
| Latin | `la-y8-restore-the-set-text` | 15 | P1 |
| Latin | `la-y8-tense-recognition-from-models` | 16 | P1 |
| Biology | `bio-y8-ber` | 10 | P0 |
| Biology | `bio-y8-mixed-exam` | 12 | P0 |
| Biology | `bio-y8-continuous-variation` | 13 | P0 |
| Biology | `bio-y8-correlation` | 13 | P0 |
| Biology | `bio-y8-genetic-disorders` | 15 | P1 |
| Biology | `bio-y8-nutrition-labels` | 16 | P1 |
| Biology | `bio-y8-practical-conclusions` | 16 | P1 |
| Biology | `bio-y8-punnett-squares` | 17 | P1 |
| Biology | `bio-y8-dna-structure` | 18 | P1 |
| Biology | `bio-y8-fats-cholesterol` | 19 | P1 |

See `qa-reports/year8-bank-catalog-snapshot-20261101.csv` for **all 153 topics** and the 20–24 and 25+ cohorts. This CSV is a catalog-only snapshot, NOT a source verification.

## Source-of-truth audit: existing evidence and discrepancies
- An isolated 26 October 2026 audit in **draft PR #240** checked all 153 Year 8 topic files, observing 8,918 source-eligible records versus 8,829 catalog-enabled counts and **16 source/catalog mismatches**. The biggest was `bio-y8-food-tests` (catalog 33 vs actual 143); other topic files had 1–3 fewer eligible items than advertised. The present script reruns against actual current source files; prior values must not be treated as latest-head verification.
- The active `main` catalog still reports e.g. Biology BER=10, Mixed exam=12, Continuous variation=13, Correlation=13, and Latin Case-role Introduction=5. **Draft PR #172** proposed additions to 11 original topic files (79 supplemental questions in its later rounds), but remains unmerged; do NOT count those draft questions as live supply or merge the PR without academic and grader QA.
- **Draft PR #240** also contains 200 new non-production Mastery drafts in its isolated package, with **zero independently certified for live Daily V2**, and does not wire V2 into production. Do not count these as deployed live content.
- A read-only, reproducible current-source audit is provided at `scripts/audit-year8-topic-capacity-20261101.mjs`; it checks all enabled Year 8 source JSON files, valid formats, source eligibility, distinct concept/prompt indicators, duplicates and catalog mismatches, and writes CSV + Markdown artifact. Its workflow is informational: insufficient banks are reported, not silently passed as safe for tasks. Structural fatal errors fail CI.

## The screenshot is a SKILL dashboard, not a topic question-count display
- `Formal: 2/4` and `6/10` mean **correct / attempted evidence** stored for an individual skill, NOT 4 or 10 total questions in a bank.
- `biology:working-scientifically` is a cross-topic skill inferred from practical/variables/evidence content; the Year 8 Biology catalog does not have a standalone topic titled Working Scientifically. `chem-y8-working-scientifically` is a different Chemistry topic (catalog 35).
- `biology:respiration` can accrue skill evidence through biology questions, but the current Year 8 Biology catalog has **no dedicated `bio-y8-respiration` topic**; Year 9 has `bio-y9-b11` ("Aerobic and anaerobic respiration"). Audit the provenance/year of skill evidence before promising a direct Year 8 topic-specific pool. Do not transfer Year 9 questions into Year 8 Daily.

## Corrective sequence
1. **P0** Resolve the current 38 topics nominally below 15 (34 Latin, 4 Biology). Do not blindly pad one- or two-question Latin micro-skills to 20; group authentic taught micro-skills into coherent, markable Standard topics or keep them for targeted review, preserving old topic IDs and attempts.
2. **P1** Resolve the additional 8 topics at 15–19 (2 Latin, 6 Biology) for 20-question Mastery; independently assess required recall/application/challenge depth and clear answer alternatives.
3. **P2** Add healthy reserves in 20–24 topics, prioritising actually taught/repeated topics. A practical authoring target is 30–40 **distinct authentic questions per frequently used topic**, not 30 copied questions with altered wording.
4. **P0 runtime** Before assigning a Daily/Mastery set, check actual loaded eligible IDs, previous correct IDs, due/review status, duplicate prompt/concept-family, and other same-day reservations. A topic lacking enough fresh unique questions must be visibly blocked/substituted with an appropriately taught same-subject topic (without falsifying credit or lowering pass marks). Preserve pinned sessions, original tasks, 48h Recovery, XP, MP and Pet records.
5. **QA** Gate academic answer keys, paraphrase/negation marking, numerical units, iPad offline, 30-day learner-state replay and question freshness before merge/deploy. Keep past attempts intact.

**No live app code or student data is changed by this audit PR.**
