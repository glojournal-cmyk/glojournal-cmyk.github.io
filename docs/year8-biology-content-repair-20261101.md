# Biology Year 8 — targeted content repair (1 November 2026)
Status: **DRAFT — do not merge/deploy** until curriculum, marking and iPad QA has passed.

## Curriculum boundary
School reference: [Tiffin Girls' School Year 8 KS3 Science Curriculum Outline 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10114141/Year-8-Science-Curriculum-Outline-2026-27.pdf) (official Biology department link).
- Autumn 1 'Energy in our diets and the digestive system': daily energy requirement calculations, diet, digestion, enzymes **simply as biological catalysts**.
- Summer 1 'Genetics and evolution': simple inherited information, chromosomes/genes/DNA, continuous versus discontinuous variation, measurements and graphs.
- Scientific skills: recall, interpret experimental/graph data, explanations and evaluation throughout Year 8.
- Graph correlation is treated as general Year 8 data interpretation (not a claim that a separately taught Correlation Biology unit appears by title).
- **Not included in new Mixed Exam items:** GCSE respiration, advanced enzyme active-site mechanism, allele-frequency selection, genetics Punnett dominance models or other unconfirmed Year 9-only teaching. These may still exist in legacy content and need a separate curriculum review.

## Actual four-topic repair
| Year 8 topic | Current main source-eligible | Draft source-eligible | Newly added question records | Depth |
|---|---:|---:|---:|---|
| Basal energy requirement | 10 | 25 | 15 | school-specified simplified 5.4 × mass × 24 calculations, estimate limits, one-mark numeric, manually reviewed explanation |
| Continuous variation | 12 | 25 | 13 | data classification, grouped measurement, histogram, range, genes/environment |
| Correlation / hand span and height | 12 | 25 | 13 | interpreting graph patterns and limitations |
| Mixed exam practice | 12 | 25 | 13 | nutrition, photosynthesis, ecology, simple heredity, data skills |
| **Total** | **46** | **100** | **54** | |

**Critical unit correction:** Original unmerged draft BER seven-day total of `45360 kJ` incorrectly listed accepted units/model answer as `kJ/day`; the draft question now gives `kJ`. It calculates `6480 kJ/day × 7 days` and is a one-mark final-answer question. A week-total answer in kJ/day is scientifically incorrect.

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

QA: `node tests/year8-biology-content-repair-20261101.mjs` (requires `origin/main`). CI checks original items with deep equality, exactly 54 additions, Year 8 metadata, source/catalog count agreement, 25 formal opportunities per topic, answer/rubric structure and numeric reference answers. This is **static QA only**, not live grader validation.

## Remaining low-capacity Biology, not changed
Genetic disorders, DNA structure, nutrition labels, practical conclusions, Punnett squares, limiting factors, fats/cholesterol (under 20 actual source questions). Additional Year 8 scope review required for some subtopics. Latin micro-topic consolidation is explicitly deferred to a separate source-preserving cross-topic design; it has **not** been implemented here.
