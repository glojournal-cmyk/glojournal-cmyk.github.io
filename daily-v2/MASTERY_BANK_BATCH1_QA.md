# Daily V2 — Mastery Question Bank Expansion, Batch 1

Date: 2026-10-26. Branch: `feature/daily-v2-clean-rebuild-20261026`.
**Content staging only. NOT merged into any live content/catalog.json, not exposed to students, not certified for Daily V2.**

## Scope and educational intention
Daily Mastery A and B remain **20 items each**, with NO extra daily exercises added by this change. This expands available bank content, not the learner's daily quota. Each newly authored topic follows a provisionally labelled 4 Foundation, 10 Application and 6 Challenge questions.

| Subject | New draft topic | New items | Emphasis |
|---|---|---:|---|
| Latin | `la-y8-v2-mastery-adjective-agreement` | 20 | Case, number, gender, agreement in new sentences, translation and reasoning |
| French | `fr-y8-v2-mastery-negative-tenses-writing` | 20 | ne...pas, present/past/near future, written sentences, agreement and corrections |
| Biology | `bio-y8-v2-mastery-digestion-absorption` | 20 | Enzymes, villi, fat emulsification, experiments and causal explanations |
| Chemistry | `chem-y8-v2-mastery-formulae-equations` | 20 | Ionic formula charges, equations, mass conservation, calculations |
| Physics | `phys-y8-v2-mastery-speed-time` | 20 | Gradient, graph area, multi-stage journeys, acceleration and experiment design |

**Total 100 newly authored source question IDs**. Each includes `format`, `prompt`, `stimulus`, `answer.accepted`, `answer.modelAnswer`, `answer.markPoints`, `answer.totalMarks`, `feedback` and provisional `depthBand`. All open responses have `answer.mode: "rubric_review"` and `requiresSemanticAssessment: true`.

## Direct files
- `content/mastery/latin-y8-adjective-agreement.json`
- `content/mastery/french-y8-negatives-tenses-writing.json`
- `content/mastery/biology-y8-digestion-absorption.json`
- `content/mastery/chemistry-y8-formulae-equations.json`
- `content/mastery/physics-y8-speed-time.json`
- `src/mastery-draft-validator.js`: conservative authoring completeness/structure audit
- `tests/mastery-drafts.test.js`: 10 content and supply/depletion regression tests

## Evidence and limitations
- Source QA: 100/100 have stable unique IDs, nonempty full prompts and associated stimuli, explicit rubric Mark Points and 4/10/6 per subject.
- First structural audit had **zero** duplicate full prompt+stimulus combinations across new items.
- A preliminary Jaccard token similarity scan against six adjacent existing topic files detected **zero high-similarity pairs at >=0.65**; this is NOT an exhaustive semantic duplication assessment.
- A Latin challenge instruction wrongly referred to two corrections where only one error was present; changed to request one correction with full grammar justification.
- Dedicated test suite: **10/10 passed** using exact GitHub draft JSON and current modules in an isolated V8 harness. Native Node/GitHub Actions result remains unverified.
- Adapter protection: `adaptCertifiedDailyV2Bank({topics: newDrafts})` yields **0** certified questions and **100** pending/unclassified. This is intentional until independent educational review and approved source-bound certification exist.
- A draft-only planner rehearsal allocates two 20-item Mastery candidates for TWO consecutive all-correct days but has only one unspent 20-item subject topic left on day three. Therefore **100 new draft items are categorically NOT 30-day supply readiness**. Existing non-draft corpus might help after proper certification and previous-correct filtering.
- Model answers for open writing are **examples**, not the only acceptable wording. The current live marking engine does not yet support these `rubric_review` drafts. No claim of reliable automatic credit until a verified semantic/mark-point grader is integrated and QA'd.
- School coverage/taught-topic proof for these particular subtopics (especially cross-tense French and specialist Biology/Physics challenges) has not been reconfirmed against the pupil's latest teacher records. Keep withheld until verified.
- All five draft topics have `curriculumReview:"pending-independent-review"`, `taughtStatus:"not-verified-for-student"`; they are intentionally NOT in original `content/catalog.json` nor production.

## Next content work
1. Independent subject-level factual and mark scheme review (French accepted variants / Latin grammar forms / Science numeric and concepts). Record reviewer and source fingerprints, preserving actual human review provenance.
2. Audit the existing **full** Y8 and taught Y9 question bank for qualified Mastery before authoring unnecessary duplicates, including prior-correct depletion using protected student history.
3. Expand multiple DIFFERENT topics per subject rather than endlessly varying one prompt; author short answer, application and genuine transfer/challenge with a tested marking contract.
4. For a 30-day all-correct Daily schedule, two Mastery tasks x20 x30 = **1,200 distinct qualifying assignment slots** (subject to approved spaced-repeat rules). The new 100 are one small part of eventual supply; do not treat them as sufficient.
5. Run 30-day genuine-bank simulation after certification, grading QA and safe history mapping. Then integrate through the new planner, staging only, before any production cutover.
