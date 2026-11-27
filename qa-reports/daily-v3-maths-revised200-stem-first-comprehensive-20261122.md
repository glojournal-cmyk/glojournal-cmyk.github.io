# Lux et Labor Maths V3.1.1 — complete 200-item **revised candidate** stem-first mathematical QA

**22 November 2026 · PR #306 Draft only · Academic approval 0/200 · DO NOT MERGE / NO LIVE STUDENT CREDIT**

## Exactly which source has been verified
This pass reopens the branch's **staged revised candidate bank**:
\`qa-staging/math-v311-reviewed-200.json\`, whose \`status\` is \`DRAFT_CONTENT_REVIEW\`.
It is not the original 74-page 200-item PDF, nor a formally approved school curriculum bank. The original V3.1 mathematical re-solve and original-formatted-answer checks are distinct evidence and must not be transferred automatically to revised question versions.

This review independently derives each revised question's mathematical result **from its visible stem** using topic-specific source parsers and arithmetic/geometry/linear-equation rules. It then checks the stored candidate key against the new result and verifies all **six** candidate A–F options for a single correct mathematical answer and no pairwise mathematical equivalence under the applicable tested domain.

| Revised topic | Source IDs | Mathematical stem-first check | Options checked | Additional evidence |
|---|---|---:|---:|---|
| Indices | \`INDICES-001..040\` | **40/40** | **240/240** | Perfect-cube bounds, smallest nonnegative n, HCF/LCM, symbolic shift identity Q4, negative/fractional indices, both exponent identities, principal square root |
| Standard Form | \`STANDARD_FORM-001..040\` | **40/40** | **240/240** | Context-driven mass/volume/density, two batches, speed, corrections and percentages, unit conversion, successive losses and reverse operations |
| Changing the Subject | \`REARRANGING-001..040\` | **40/40** | **240/240** | **920** valid source→inverse rechecks and **600** option-function pair comparisons over sampled valid input domains |
| Straight-Line Graphs | \`GRAPHS-001..040\` | **40/40** | **240/240** | Independent gradients, perpendiculars, bisectors, intersections, axis intercepts, distance, area and signed displacement |
| Simultaneous Equations | \`SIMULTANEOUS-001..040\` | **40/40** | **240/240** | Independent coefficients, system solutions, ticket/mass word problems, parameter equations, eight parallel **but not coincident** no-solution conditions |
| **Total** | **200 revised question IDs** | **200/200 calculation checks PASS** | **1,200/1,200 option checks PASS** | **Not an educational difficulty, teaching or device approval** |

### Executable QA suite now in GitHub
Five new source-derived tests are present on the QA branch and explicitly referenced in the GitHub Actions workflow's push/PR path filters, syntax checks and Node test command:

1. \`tests/daily-v3-maths-revised40-indices-stem-first-20261122.test.mjs\`
2. \`tests/daily-v3-maths-revised40-standard-form-stem-first-20261122.test.mjs\`
3. \`tests/daily-v3-maths-revised40-changing-subject-stem-first-20261122.test.mjs\`
4. \`tests/daily-v3-maths-revised40-graphs-stem-first-geometry-20261122.test.mjs\`
5. \`tests/daily-v3-maths-revised40-simultaneous-stem-first-20261122.test.mjs\`

The independent source-first calculations were executed in this review and produced the 200/200 and 1,200/1,200 results above. **Do not conflate this direct calculation with a completed-green GitHub Actions run.** A fresh official CI run result has not been independently retrieved, and browser WebKit/PWA testing is still incomplete.

An additional full-bank structural/display gate \`tests/daily-v3-maths-reviewed200-render-and-credit-deny-20261122.test.mjs\` covers all 200 stems, 1,200 option formulas and 648 written explanation lines. Existing earlier source-based revised-subject inverse and 200-maths-original tests remain in CI; the five new tests supplement rather than replace them.

## Mathematical uniqueness versus plausible pupil misconception
The latest source-first pass establishes **single mathematically correct candidate option**, not that each wrong option is a pupil-realistic, *causally reproducible* misconception. The staged 1,000 incorrect choices have 248 distinct verbatim explanation strings. **393** uses of wrong-choice explanations are from 20 descriptions repeated ten times or more.

The next educational Academic QA must validate **each individual** wrong option by showing the stated wrong algebra/arithmetic leads to its displayed result (not simply a result different from the answer), that the mistake is likely for the TGS Year9 Set1 learner, and that the stem demands genuine Higher Grade7+ AO2/AO3 thinking. Numerical reparameterizations of a repeated template cannot automatically count as independent Mastery concepts.

## Known hold categories, not "math wrong" findings
- **12 Graphs perpendicular-bisector** source concepts are on the TGS Spring construction/loci side; do not infer already taught in Autumn.
- **12 Indices advanced surd/fractional-power** source concepts need individual teacher evidence. The broad Autumn indices heading is not adequate confirmation.
- Rearrangement of algebraic fractions, reciprocals, nested denominators and principal roots requires proof of taught subskills; 40 revised candidate keys being correct does not resolve school scope.
- Some Standard Form problems involve percent change/reverse or compound loss; taught-timing and true Grade7+ demand remain separate decisions.
- The original 200 source-PDF bank still had **507** formatting-dependent A–F option slots without successful image-based spatial verification in the earlier source audit. This is **not** an error count and is separate from the now machine-readable *revised* candidate choices.
- A 200-question set with A–F choices is useful as daily diagnosis, but cannot substitute for written GCSE Higher reasoning. Production 10-a-day selection, daily receipts and iPad storage/restart validation are not certified by the mathematical proof.

## Release decision
**Formal academic accepted: 0/200** because individual GCSE-grade calibration, exact classroom scope, 1,000 option-level misconception explanations, independent academic second review and actual browser/physical iPad testing are not all signed off.

All 200 revised candidates remain \`dailyEligible: false\`. PR #306 remains Draft; do not merge, deploy, change learner data or award XP/MP/Mastery/Recovery. The independent Food Tests/numeric corrections currently on \`main\` must not be overwritten by this older-base QA branch.
