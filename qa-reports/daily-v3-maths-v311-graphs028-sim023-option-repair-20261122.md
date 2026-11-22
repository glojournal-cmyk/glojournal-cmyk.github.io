# Maths V3.1.1 — original GRAPHS-028 and SIMULTANEOUS-023 wrong-answer replacements

**22 November 2026 | Draft PR #306 only | 0/200 independent academic approvals | NOT LIVE**

## Original source
Opened the exact `qa-staging/math-v31-original-sample10.json` from this Draft PR at **GitHub blob SHA `2638a3b0ea387189ef2a278e21803219164986a2`**. It contains original complete source stems, A–F options, correct-option letters and worked solutions for these two IDs, matching the archived 200-question student's and answer PDFs. These were not reconstructed from a summary.

- `LUX-MATH-Y9-GRAPHS-028` (original paper Q148), provisional G8: parallel line through intersection P of `y=4x−6` and `y=−4x+26` and parallel to segment A(1,2), B(6,−2); correct **C = 33/2**. Original A=37/2, B=27/2, E=35/2 were unexplained near misses, and F=17 was a rounding shortcut.
- `LUX-MATH-Y9-SIMULTANEOUS-023` (original paper Q183), provisional G8: `4x+3y=25`, `3x−4y=0`, find `2x²−y`; the original system gives **x=4, y=3 and key D=29**. Original A=27, C=29/2 had no convincing separately reproduced wrong-operation pathway.

**Correct original maths was retained.** The candidate patches change wrong choices only, preserve the exact original stems and correct A–F key letters; original sample and 200-bank were not modified.

## Staged, reproducible A–F choice rationale

[QA-only source JSON](../qa-staging/math-v311-graphs-028-sim-023-wrong-option-repairs-20261122.json) stores all original choices and complete replacements. The proposed new values are:

| Original ID | A | B | C | D | E | F |
|---|---:|---:|---:|---:|---:|---:|
| GRAPHS-028 | −17/2 | −4 | **33/2** | 66/5 | 25/2 | 3/2 |
| SIMULTANEOUS-023 | 35 | 13 | 21 | **29** | 61 | 26 |

### GRAPHS-028: signed gradient, parallel vs perpendicular, intercept
Calculate P=(4,10). Original AB gradient is `(-2−2)/(6−1)=−4/5`; required new x-axis intercept is 4−10/(−4/5)=33/2.

1. **A = −17/2**: incorrectly use positive +4/5 because the downward rise is treated as positive; 4−10/(+4/5).
2. **B = −4**: use the perpendicular gradient +5/4 instead of parallel −4/5; 4−10/(+5/4).
3. **D = 66/5**: calculate the line's **y**-intercept `c=10−(−4/5)×4` instead of its x-intercept.
4. **E = 25/2**: omit the horizontal shift `x−4`, solving `0=10−(4/5)x` instead.
5. **F = 3/2**: use slope 4 of the **first original line**, instead of segment AB, then use `4−10/4`.

### SIMULTANEOUS-023: solve correctly but mis-evaluate quadratic expression
Independently solve both original equations, yielding x=4,y=3, then `2(4²)−3=29`.

1. **A = 35**: add y rather than subtract: `2·16+3`.
2. **B = 13**: omit outer factor 2: `16−3`.
3. **C = 21**: treat x² incorrectly as xy: `2·4·3−3`.
4. **E = 61**: square entire `2x` instead of x alone: `(2·4)²−3`.
5. **F = 26**: subtract 2y rather than y: `2·16−2·3`.

These are ten mathematically distinct *hypothetical* student errors reconstructed from actual erroneous operations. They are not empirical evidence that ten misconceptions are common in TGS pupils.

## TGS and AQA scrutiny (newly externally verified)
The official [TGS Year 9 Mathematics 2026–27 outline](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10161919/Year-9-Maths-2026-2027.pdf), p.1, lists Autumn *Linear Graphs* and *Simultaneous Equations*. The detailed classroom teaching of a line parallel to an arbitrary coordinate segment, and the intended depth of equation/elimination problems, remain **unverified**; this outline is not a lesson-completion record.

[AQA GCSE Maths 8300](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/specification-at-a-glance) states Higher Tier covers grades **4–9**, not that every Higher question is Grade 7–9. Its [scheme of assessment](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment) separates **AO1 routine technique (which can include multi-step)** from **AO2 reasoning** and **AO3 solving unfamiliar problems**. The original SIMULTANEOUS-023 simply solves a system and evaluates a fixed expression, so the source's provisional G8 tag has **no independently verified Grade8 justification**. Better wrong options do not correct a weak stem.

## Independent regression and gate
A [new six-option numerical regression test](../tests/daily-v3-maths-graphs028-sim023-repair-20261122.test.mjs) independently reconstructs all original equations, each candidate A–F wrong-value outcome, verifies six distinct options per question, unchanged stems and answer letters, and no fictional academic approval. The existing Daily V3 GitHub Actions workflow runs this file on every matching PR change.

**Formal verdict:** Both source questions remain **NOT APPROVED**. Their 10 candidate wrong answers are computed/traced but not teacher-signoff or independent grade-certified. Additional taught-course confirmation, difficulty upgrade (especially SIMULTANEOUS-023), raw full-bank SHA, actual iPad PWA QA and independent release decision remain required. Student credit remains blocked; PR #306 Draft, main and Live unchanged.
