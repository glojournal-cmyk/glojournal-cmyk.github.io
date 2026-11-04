# Daily V2 Mastery — Batch 2 question authoring and QA
Date: 2026-10-26. **Not released.** Branch: `feature/daily-v2-clean-rebuild-20261026`.

## New content
Batch 2 adds five DIFFERENT Year 8 topics (20 questions each), keeping the student's daily Mastery A/B quotas unchanged at 20 + 20.

| Subject | Batch 2 topic ID | Main cognitive coverage |
|---|---|---|
| Latin | `la-y8-v2-mastery-present-imperfect-perfect` | Recognise and use present / imperfect / perfect; distinguish ongoing background and completed action; context translation and inference |
| French | `fr-y8-v2-mastery-reflexive-routines` | Reflexive pronouns, present vs passé composé, ne...pas around auxiliary, accurate daily-routine composition |
| Biology | `bio-y8-v2-mastery-photosynthesis-investigation` | Photosynthesis, limiting factors, starch evidence, controls, reliability, experimental design |
| Chemistry | `chem-y8-v2-mastery-acids-neutralisation` | pH, acid vs alkali, neutralisation, reaction products, indicators, safe methods and evaluation |
| Physics | `phys-y8-v2-mastery-series-parallel-circuits` | Ammeter/voltmeter placement, same series current, parallel voltage, branch currents, measurement evaluation |

Every new topic: **4 Foundation + 10 Application + 6 Challenge**, unique IDs, original prompted stimuli, model answer, explicit individual marking points, and a flagged semantic-marking requirement. Examples accept valid equivalent responses upon eventual validated rubric marking; literal string matching must NOT be treated as educational assessment.

## Cross-batch cumulative inventory
| Batch | Latin | French | Biology | Chemistry | Physics | Total |
|---|---:|---:|---:|---:|---:|---:|
| Batch 1 | 20 | 20 | 20 | 20 | 20 | 100 |
| Batch 2 | 20 | 20 | 20 | 20 | 20 | 100 |
| **Cumulative** | **40** | **40** | **40** | **40** | **40** | **200** |

- 10 different provisional topics, 200 unique source question IDs and 200 unique full prompt + stimulus text combinations.
- Every 20-item pack meets the structural 4/10/6 allocation shape.
- 10/10 new cross-batch and depletion tests passed in an isolated V8 harness executing actual GitHub topic JSON, curriculum adapter and planner code. Native Node/CI and iPad Safari were not tested.
- After a dry-run in which every attempt is correct and no correct Mastery question is repeated, the **200 drafts alone support just five 40-question days**. The sixth day is depleted; this is explicitly a content-draft capacity test, NOT released Daily readiness.
- The curriculum adapter, without a reviewer-signed per-question source fingerprint and tested free-response rubric, accepts **0 of these 200 drafts** into real Daily V2.
- The 30-day fully correct Mastery allocation goal is 2 × 20 × 30 = **1,200 distinct question assignments** if *none* of the already-correct items is deliberately repeated. Existing properly certified and fresh questions can contribute; 1,000 additional candidates is the nominal gap versus these 200, **not** a claim that 1,000 new questions must be authored from scratch.
- Full real-bank auditing and student-specific depletion analysis are not yet complete. It would be misleading to call the curriculum bank ready on the basis of this raw count.

## QA observations
1. Corrected a Latin narrative ending that used a potentially ambiguous tense form (replaced with clearly perfect `intravit`); this avoids asking students to infer a uniquely encoded tense from an ambiguous form.
2. Corrected a French prompt where `tu me lèves` could be grammatical with a different meaning; the exercise now explicitly specifies the intended reflexive meaning.
3. All structural Mark Points are present, but **independent item-by-item human subject review is still pending**. The audit does not establish an AQA/OCR Grade 8–9 educational validity judgement.
4. The student-taught status of each specific topic has NOT been independently verified against the latest school lessons. The question banks must not automatically enter student Daily based on `year=8` alone.
5. Open-ended written answers demand a validated partial-credit semantic marking layer. This is **not yet completed**. No automatic grading based on one wording should occur.

## Next content QA actions
- Audit all eligible existing subject topics for overlap and genuine Foundation/Application/Challenge depth before authoring repetitive additions.
- Prioritise stronger independent Latin translation/grammar, French unseen writing, Biology experiment-inference, Chemistry calculations and Physics multi-step applications.
- Build a review manifest with approved question ID, source checksum, exact taught topic evidence, alternative acceptable answers and rubric; re-review on source changes.
- Only after certification: simulate actual learner's previously-correct depletion, demonstrate adequate daily supply, verify fully marked long answers and stage integration in a safe branch.
- Keep `main`, production `content/catalog.json`, original daily planner, all student marks, XP and 30-day history untouched until separate release approval.

## Source files
- `daily-v2/content/mastery/latin-y8-verb-tenses.json`
- `daily-v2/content/mastery/french-y8-reflexive-routines.json`
- `daily-v2/content/mastery/biology-y8-photosynthesis.json`
- `daily-v2/content/mastery/chemistry-y8-acids-neutralisation.json`
- `daily-v2/content/mastery/physics-y8-series-parallel.json`
- `daily-v2/tests/mastery-batch2.test.js`
- `daily-v2/MASTERY_BANK_BATCH1_QA.md`
