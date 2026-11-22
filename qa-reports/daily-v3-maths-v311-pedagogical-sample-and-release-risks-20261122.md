# Maths V3.1.1 — pedagogical sample review and release-risk register
**22 November 2026 | Draft PR #306 | NON-LIVE / NOT ACADEMIC SIGN-OFF**

**Decision: BLOCKED. Formal Maths bank approvals remain 0/200; no Maths Daily XP, MP or Mastery credit.** This document is a *new targeted pedagogical review*, separate from the completed 200/200 stem-first computational maths answer checks. It must not be cited as teacher confirmation, calibrated grade approval, or a physical-iPad test.

## Exact-source inventory cross-check
Read the indexed 200-row `Lux_Maths_V3_1_Formal_Academic_QA_Register_20261122.csv` and compared it with the reviewer-only source sample and the independent mathematical proof report:
- 200 unique question records; 5 topics × 40; 80 provisional G7, 80 G8, 40 G8–9.
- 50 distinct template IDs, **exactly four variants per template**. Four variants of one concept do not count as four independently different concepts in the same daily assignment.
- Every one of 200 rows is still flagged `TAUGHT_SUBSKILL_UNCONFIRMED`, `GRADE_DIFFICULTY_UNCALIBRATED`, `DISTRACTOR_RATIONALE_MISSING` and `IPAD_APP_RENDER_UNVERIFIED` in the formal register.
- 12 **Spring-scope perpendicular-bisector** IDs: `GRAPHS-005..008`, `GRAPHS-017..020`, `GRAPHS-037..040`.
- 4 **fractional-indices teaching-check** IDs: `INDICES-033..036`.
- 12 **advanced-rearrangement teaching-check** rows flagged in the register; this is a subskill check, not proof of an error.
- Official school curriculum: [Tiffin Girls Year 9 Maths Outline 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10161919/Year-9-Maths-2026-2027.pdf), pages 1–2: Autumn lists indices including negative powers, standard form, rearranging formulae, straight-line graphs, and simultaneous equations; Spring specifically places perpendicular bisectors within Construction and Loci.
- [AQA 8300](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/specification-at-a-glance) describes Higher tier **grades 4–9**, not a guarantee that an individual Higher-style question has grade-7+ demand.

## Ten exact reviewer-sample IDs — targeted teaching/quality findings
Source: `qa-staging/math-v31-original-sample10.json` (original V3.1 records). The correct-option maths calculations for these ten items were independently checked in `daily-v3-maths-v31-continued-20261122.md`, and the entire edited bank has separate 200/200 mathematical proof evidence. None of the ten is now approved academically.

| Exact source ID | Prior maths-key check | New pedagogical / curriculum finding | Required action before credit |
|---|---|---|---|
| `GRAPHS-028` | C = 33/2 | Intersection plus gradient from two points plus x-intercept is genuinely multi-step, but the line-composition subskill is more specific than school outline | Teacher taught-subskill evidence; independently benchmark difficulty and explain all five alternative mechanisms |
| `REARRANGING-023` | D | Original reviewer sample still prints `(1z-4)x`; V3.1.1 candidate repairs to `(z-4)x`. Domain / excluded-value explanation may be improved (`x≠−6`, `y≠5` in the original relation). | Use verified corrected editorial source, re-render in actual iPad; proofread worked steps and restrictions |
| `STANDARD_FORM-011` | A = 1.875×10^7 | Straight subtraction and division in standard form. Grade-7 label is **not independently established** by the fact that the topic is Higher | Calibrate against genuine complex G7 items; verify distractors reflect errors, not just random numbers |
| `INDICES-005` | A = 16 | Valid negative-index multi-stage arithmetic. The extreme 65536 distractor needs an explicit plausible misconception justification | Record A–F error mechanisms and grade evidence |
| `REARRANGING-020` | B | Formula inversion involving `1/y` and a denominator requires teaching evidence; exclude `y=0` and `y=1/2` when interpreting the result | Specify exact taught algebraic-fraction depth and fully explain restricted values |
| `STANDARD_FORM-017` | C = 3×10^2 | The answer implies density **300 g/cm³**, unusually high for a real-world material; mathematically valid but a distracting/unrealistic science context for this age | Prefer physically plausible numbers or a clearly hypothetical abstract context; check each distractor rationale |
| `INDICES-037` | F = 2 | Involves radical-index manipulation and follow-on expression, beyond what the outline explicitly details | Confirm precise taught powers/roots skill and benchmark G8–9 label |
| `SIMULTANEOUS-013` | C = 4 | Identifying distinct parallel equations and no solution is valid, but whether this one-step parameter recognition sustains a **G7** demand is uncertain | Compare to published Higher specimen complexity; write error rationales for all five options |
| `GRAPHS-039` | F = 7 | Correct mathematics, but **perpendicular bisector is explicitly Spring**, not automatically eligible in Autumn | **Quarantine** pending teacher proof of earlier teaching; do not include in Autumn credit supply |
| `SIMULTANEOUS-023` | D = 29 | Linear simultaneous solve followed by `2x²−y` evaluation; a **G8** label requires stronger evidence than a two-step calculation | External difficulty calibration; check if concept/distractors genuinely challenge Set 1 at intended grade |

**Interpretation:** These are **10 exact IDs examined for pedagogical risks**, not 10 independently approved items. In particular, marking key correctness and exact six non-equivalent options do not establish the quality of the five distractors. No rationales are fabricated or signed off here.

## Separate technical/retention risk from actual runtime trace
The current branch's `assets/index-BLVOhKhN.js` writes `formalAttemptLog` to the Scholar store while invoking the IndexedDB backup with `void saveMarkedAnswer({...})`, i.e. it **does not await or check this independent backup promise**. The added `tests/daily-v3-maths-idb-fallback-20261122.test.mjs` verifies that the backup helper returns `false` when both IndexedDB and localStorage fail. This is valuable fail-detection at helper level, **not** proof that a future production Maths graded session will stop the learner from seeing completion/XP when the write fails. Before enabling Maths, add a real end-to-end failure-injection test that asserts **no durable submission means no award / no misleading saved confirmation**, including reload and iPad PWA restart. Avoid changing the older learner reward logic casually; reconcile with newer `main` and preserve all existing historical data.

**Fixed on this Draft branch after this review:** `makeVerifiedMathsSubmission` previously accepted `submittedAt` when a nonempty string merely started with `day`. The pure validator now parses an offset-aware ISO timestamp and compares the actual instant with the Europe/London task date. New `tests/daily-v3-maths-formal-submission-20261122.test.mjs` cases reject bogus/missing-zone timestamps and cover BST midnight in both UTC and +01:00 forms. Nine standalone Node timestamp checks passed locally; the complete repo CI, real device and production player are **still pending/not certified**.

## Release gates: unchanged
1. Teacher's **taught** evidence on each subskill, especially the 12 bisectors, fractional indices and advanced rational rearrangements.
2. Independent grade 7+ demand benchmarking and five **source-specific** misconception/distractor analyses for each chosen item; proofread complete worked solutions.
3. Full native MathML device output, genuine ten-question offline production player, immutable first-option marking, **9/10 daily clearance**, no hints/repairs/Recovery double credit.
4. Real persisted answer/XP/MP/Mastery/Day2/7/Recovery safety after quota failure and restart. Pending GitHub Actions jobs and emulated browsers cannot be called passed; a **physical iPad acceptance** is separately outstanding.
5. Merge conflict regression with current `main` (especially separately shipped Food Tests and numerical marking fixes), with no overwrite of existing student records.

**No app/student store or live website modified by this review. Remain DRAFT / DO NOT MERGE.**
