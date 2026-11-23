# Maths Academic QA V3.1.6 — 80 Indices/Standard Form concept-risk groups and four new reasoning candidates

**Date:** 23 November 2026  
**Repository:** `glojournal-cmyk/glojournal-cmyk.github.io` · **Draft PR:** [#306](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/pull/306)  
**Release gate:** **BLOCKED** · **Formal academic approvals:** **0/200** · No source-bank mutation, live Daily credit, XP, MP or Mastery changes.

## Grounded source snapshot

- Reopened the full canonical [revised 200 Maths source bank](../qa-staging/math-v311-reviewed-200.json), Git blob `0655fbc1b796bff68f533c060a43339dff6664be`.
- Reopened the existing V3.1.5 [80-row academic risk register](../qa-staging/math-v315-indices40-standardform40-source-exact-pedagogical-hold-and-12-risk-corrections-20261123.json) and four earlier V315 reasoning drafts.
- Tiffin Girls School's Year 9 maths PDF **not re-fetched**, following the explicit parent instruction. Exact taught skills therefore remain UNVERIFIED.
- This report distinguishes literal source-derived findings, mathematical independently recalculated findings and **provisional reviewer judgement**. No external teacher, school or empirical student-misconception review has been completed.

## Stage 1 — Source-content based concept overlap, independent of numerical text-normalisation

Rather than treating each changed coefficient as a new learning goal, the [V316 80-source provisional technique map](../qa-staging/math-v316-indices-standard-80-method-families-and-mastery-collisions-20261123.json) re-read source question stems and the *mathematical operation being tested* to classify **40 Indices into 13 method families** and **40 Standard Form into 19 method families**.

This is not the same as the older simple 33 text-template group tally, and it is not yet a psychometrically established Mastery taxonomy. A human reviewer must determine whether the groupings are educationally equivalent. Every family has `finalPedagogicalConceptEquivalence:UNVERIFIED`; there is **no** approved transfer of MP between them.

### Six high-priority possible concept collisions

| Provisional families | Specific overlap to investigate before Mastery credit |
|---|---|
| INDICES-013–016 vs INDICES-021–024 | Equate x- and y-exponents to recover one n; introducing negative signs need not create a separate mastery construct |
| INDICES-029–032 vs INDICES-037–040 | Same source radical/16/8 powers kernel; latter adds a final quadratic expression rather than a completely new exponent technique |
| STANDARD_FORM-009–012 vs STANDARD_FORM-013–016 | Same subtract-then-divide operation embedded in factory prose vs a purely numerical fraction |
| STANDARD_FORM-003 vs STANDARD_FORM-017 | Mass removed before density calculation, varying count/volume context |
| STANDARD_FORM-002 vs STANDARD_FORM-018 | Combine two batch masses, with filtration as additional operation |
| STANDARD_FORM-033 vs STANDARD_FORM-034 | Reduce material before dividing into packages, varying order of loss and reservation |

These are flagged as **potential**, not proved equivalences. The register specifically sets `allowedToMintSeparateMasteryCredit:false`. No group has been released.

## Stage 2 — Four additional distinct reasoning candidates, 24 choices

[Read all four complete, source-linked V316 question candidates](../qa-staging/math-v316-indices009-037-standard029-021-four-distinct-reasoning-candidates-20261123.json).

| Original source ID (not replaced) | New source-specific reasoning demand | Exact independently derived result | Key | Remaining academic risk |
|---|---|---|:---:|---|
| INDICES-009 | Constrain two hidden indices simultaneously using xy=2⁵ and a negative-index expression; evaluate new x²y | **256** from a=3,b=2 | B | Could still be algebraic substitution more than Grade7; actual taught index/linear-system links unknown |
| INDICES-037 | Simplify a surd/exponential expression to 2^(2n+5), compare cube and square conditions over 0≤n≤8 | **(3 cubes, 0 squares)** | C | Reasoning is valid but the enum pattern may remain short/routine for strong Set 1; independent Grade7 calibration needed |
| STANDARD_FORM-029 | Apply scientific notation arithmetic, bounds on equal particles per cartridge, and integer divisibility before choosing the maximum feasible cartridge count | **50 cartridges** | C | Stronger AO3 candidate but exact coverage of divisibility and constrained optimisation requires confirmation |
| STANDARD_FORM-021 | Calibrated reading with unknown integer percentage and an inclusive relative-increase interval | **7** permitted p values, 10–16 | B | Multi-inequality model; might be routine if heavily rehearsed; needs benchmark |

Each contains six A–F choices, causal hypothetical distractor rationales and three worked solution steps. The draft metadata is **`academicQA:pending`**, `independentGrade7PlusCertification:false`, `teacherTaughtConfirmed:false`, `dailyEligible:false`, `masteryEligible:false`.

A direct invocation of the App's offline native Maths renderer parsed **40/40** stem/option/step formula fields after replacing one unsupported `\\ldots` token with words. [The V316 independent Node tests](../tests/daily-v3-maths-v316-80-method-collisions-four-reasoning-20261123.test.mjs) independently derive the correct option from source mathematical constraints and test negative changes to the student-facing bounds and numbers. Source bank remains unchanged.

## Why the assessment-grade gate is still separate

The [AQA GCSE Mathematics 8300 scheme of assessment](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment) distinguishes **AO1** standard techniques, including routine multi-step procedures, from **AO2** mathematical reasoning and **AO3** problem-solving and contextual interpretation. The [Ofqual mathematics assessment guidance](https://assets.publishing.service.gov.uk/media/5a7f7643ed915d74e622a9a1/gcse-subject-level-guidance-for-mathematics.pdf) similarly makes clear that merely sequencing multiple processes does not on its own establish a non-routine challenge.

A question's provisional AO2/AO3 intent does not grant an official per-question Grade7 rating. Authentic student misconception patterns also require actual pupil evidence rather than a numerically reproducible distractor alone. The ongoing 200-item release gate therefore cannot be lifted by a passing CI test.

## Explicit next academic gates

1. Independently distinguish Grade7+ vs potentially still Grade5–6/routine on each staged challenge, using representative Higher GCSE questions with marking demand, not only the number of arithmetic operations.
2. Resolve the six potential cross-template concept overlaps before any item earns a distinct MP/Mastery target.
3. Confirm that every exact specialist skill has been taught (school curriculum PDF deliberately skipped; cannot claim it verified).
4. Independently assess all candidate wrong options for actual student plausibility; existing source-derived arithmetic validity alone is insufficient.
5. Run a real physical iPad PWA acceptance covering offline data, question rendering, selection, score isolation, refresh persistence and Daily lock; browser-based WebKit tests do not constitute hardware signoff.

**Current formal source approval stays 0/200. PR #306 remains Draft, no merge, no deployment, no Daily/XP/MP/Mastery/Recovery credit.**
