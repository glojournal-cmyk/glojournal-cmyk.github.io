# Biology Year 8 — targeted content repair, Phase 1 + Phase 2 (1 November 2026)
Status: **DRAFT — do not merge/deploy** until curriculum, marking and iPad QA has passed.

## Curriculum boundary
School reference: [Tiffin Girls' School Year 8 KS3 Science Curriculum Outline 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10114141/Year-8-Science-Curriculum-Outline-2026-27.pdf) (official Biology department link).
- Autumn 1 'Energy in our diets and the digestive system': daily energy requirement calculations, diet, digestion, enzymes **simply as biological catalysts**.
- Summer 1 'Genetics and evolution': simple inherited information, chromosomes/genes/DNA, continuous versus discontinuous variation, measurements and graphs.
- Scientific skills: recall, interpret experimental/graph data, explanations and evaluation throughout Year 8.
- Graph correlation is treated as general Year 8 data interpretation (not a claim that a separately taught Correlation Biology unit appears by title).
- **Not included in new Mixed Exam items:** GCSE respiration, advanced enzyme active-site mechanism, allele-frequency selection, genetics Punnett dominance models or other unconfirmed Year 9-only teaching. These may still exist in legacy content and need a separate curriculum review.

## Phase 1: four-topic repair
| Year 8 topic | Current main source-eligible | Draft source-eligible | Newly added question records | Depth |
|---|---:|---:|---:|---|
| Basal energy requirement | 10 | 25 | 15 | school-specified simplified 5.4 × mass × 24 calculations, estimate limits, one-mark numeric, manually reviewed explanation |
| Continuous variation | 12 | 25 | 13 | data classification, grouped measurement, histogram, range, genes/environment |
| Correlation / hand span and height | 12 | 25 | 13 | interpreting graph patterns and limitations |
| Mixed exam practice | 12 | 25 | 13 | nutrition, photosynthesis, ecology, simple heredity, data skills |
| **Total** | **46** | **100** | **54** | |

**Critical unit correction:** Original unmerged draft BER seven-day total of `45360 kJ` incorrectly listed accepted units/model answer as `kJ/day`; the draft question now gives `kJ`. It calculates `6480 kJ/day × 7 days` and is a one-mark final-answer question. A week-total answer in kJ/day is scientifically incorrect.

## Phase 2 — confirmed Year 8 scope, three more source-preserving topic repairs

**Official source:** [Tiffin Girls' School, Year 8 Science Curriculum Outline 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10114141/Year-8-Science-Curriculum-Outline-2026-27.pdf), pp. 1–3. Specifically: healthy-diet nutrient content and energy calculations (Autumn 1); photosynthesis limiting factors (Spring 1); experiments, graph analysis, data and evaluation throughout the Year 8 course. Do NOT substitute the similarly named boys’ Tiffin School curriculum.

| Phase 2 topic | Main formal eligible | This draft formal eligible | New item records | Distinct concept IDs in 25 items |
|---|---:|---:|---:|---:|
| Nutrition labels | 16 | 25 | 9 (4 earlier draft, 5 new) | 17 |
| Practical conclusions | 16 | 25 | 9 (4 earlier draft, 5 new) | 17 |
| Limiting factors | 18 | 25 | 7 (new) | 15 |
| **Phase 2 total** | **50** | **75** | **25** | — |

**Phase 1 + 3 combined:** 7 topics, source-eligible inventory **96 → 185**, with **89 newly added question records** (and 2 legacy informal diagram entries remain non-formal). Every original question, stable ID and existing attempts remain intact. `content/catalog.json` is updated to match the original and added formal eligibility counts; in original source topic files, the `.enabled` metadata counts *all status-enabled items* (including two informal diagrams), while the catalog `.enabled` counts *formal-eligible items* for planning. This difference is intentional and now asserted by both the priority content test and targeted QA.

## Phase 3 — genuine independent-concept reserve for Limiting Factors
The original Phase 2 Limiting Factors pool contained 25 formal question IDs but only 15 distinct concept IDs. An additional **10 new independently scoped questions** now cover temperature confounding, rate conversion, repeat means, anomalous observations, experimental independent variables, genuinely light-limited carbon-dioxide cases, bubble-size measurement limitations, whether a plateau identifies another limiting factor, time-period standardisation and scientific graph axis units. This brings Limiting Factors to **35 formal item IDs / 25 distinct concept IDs** (including the existing informal diagrams excluded from formal marks).

Explicitly validated numeric results: 9 bubbles in 30 s = 18 bubbles/min; mean of 10, 12, 14 = 12 bubbles/min; 24 bubbles in 2 min = 12 bubbles/min. One-mark numeric model answers include correct units; all two-mark explanations identify exactly two separate criteria, with manual review fallback. These topics are covered under Year 8 working scientifically/photosynthesis, not extra Year 9-only theory.

**Seven-topic running total: 89 added candidate question records; 185 formal-eligible records** (main had 96). Five of the remaining topics are still below 20 independent concept families; formal count alone does NOT guarantee fresh 20-question Mastery after past corrects.

## Higher-level topics not cleared for Year 8 Daily
The official school Year 8 outline describes **a simple model of chromosomes, genes and DNA**, but does not explicitly prescribe Punnett square dominance crosses, named genetic disorders with X-linked inheritance, DNA base-pair arithmetic/karyograms, or detailed LDL/HDL lipid biochemistry. These appear in older `bio-y8-punnett-squares`, `bio-y8-genetic-disorders`, `bio-y8-dna-structure`, and `bio-y8-fats-cholesterol` banks. They are **not** independently certified as taught Year 8 or appropriate for compulsory Year 8 Daily. We deliberately did **not add** new questions to these four unconfirmed pools; any later selection eligibility restriction requires a careful learner-record-compatible planner change, rather than deleting legacy data or silently retagging Year 9 questions.

## Additional independent-concept capacity warning (important)
The candidate records are NOT all independent concepts. Unique `conceptId` family counts among 25 eligible items are:
- BER: **21** distinct families / 25 question IDs
- Continuous variation: **18** / 25
- Correlation: **19** / 25
- Mixed exam: **20** / 25

Some original vocabulary questions intentionally assess the **same concept** as multiple-choice and typed responses. One proposed continuous-variation pair also shares a concept ID legitimately. Do not rename shared concepts solely to manufacture fresh independent stock. For genuine Mastery capacity, the target remains **at least 20 fresh, independent and unreserved concept families at assignment time**, considering answer history and due dates. Current batches remain CONTENT CANDIDATES, not proven Mastery-ready. A subsequent distinct-concept authoring/merging pass and a learner-aware preflight are required.

## Marking contract and education gates
- Every new numeric question: exactly one machine-graded final-answer mark with value, units, stated working and model answer. Never invent a second method mark from a final-answer-only scorer.
- Typed short answers: explicit accepted alternatives; synonyms not in accepted arrays are not guaranteed accepted by the live marker.
- `mark_points`: distinct 1-mark criteria, sum matches `totalMarks`, plain string items compatible with the known current format, model answer, teacher/manual review fallback. These **must not silently award full marks** on superficially similar words with wrong meaning; no automatic semantic certification claimed.
- Original questions and original IDs copied **unaltered**; previously earned marks/XP/MP/history are untouched. Existing legacy numeric 2-mark claims not fixed in this patch and need a separate grading audit.
- These 25 eligible items per topic are **only a first capacity repair**. A 20-question Mastery session leaves a reserve of five before deducting previous correctly answered prompts, duplicate families, overlapping tasks, unfinished sessions or due periods. Do not claim this is robust for repeated Daily quotas or 30-day capacity.
- Confirm school/taught topic timing in actual student's course, human-read mark points, genuine paraphrases and negative examples, multi-question session selection, Chromium/WebKit, on-device iPad save/restore and score preservation BEFORE merging.

QA: `node tests/year8-biology-content-repair-20261101.mjs` (requires `origin/main`). CI checks original items with deep equality, exactly 79 additions, Year 8 metadata, source/catalog count agreement, 25 formal opportunities per topic, answer/rubric structure and numeric reference answers. This is **static QA only**, not live grader validation.

## Remaining low-capacity Biology, not changed
Genetic disorders, DNA structure, nutrition labels, practical conclusions, Punnett squares, limiting factors, fats/cholesterol (under 20 actual source questions). Additional Year 8 scope review required for some subtopics. Latin micro-topic consolidation is explicitly deferred to a separate source-preserving cross-topic design; it has **not** been implemented here.

## Current release checkpoint
Content schema/number QA, the whole-site integrity regression, actual live scorer tests for accepted alternatives and wrong answers, and physical iPad preservation are separate checks. The draft PR does not and must not count as deployment or a proven 30-day fresh-question supply. No learner backup was read/written or migrated.

Latest audited Limiting Factors total is 35 / 25 concept families. Older Phase 2 row above is retained as historical milestone, not current final count.

## Latest actual-scoring tests (1 Nov 2026)
Both active quiz scorer bundles were replayed against every one of the 89 new candidates: **706 model, accepted-variant, correct-unit and wrong-value checks**, with zero failures/soft warnings. Additionally, a focused **14-check adversarial negative-answer suite** verified that seven clearly incorrect science explanations were not accidentally given marks in either scorer. The seven cases include wrong conclusions about starch, photosynthesis controls and plateaus, bubble-volume measurement, nutrition-label sugar comparisons and correlation versus causation. The exact question IDs, test responses and outputs are preserved in the uploaded GitHub Actions QA artifact. These tests cover selected cases only; independent educator review and unseen paraphrase testing remain release gates.
