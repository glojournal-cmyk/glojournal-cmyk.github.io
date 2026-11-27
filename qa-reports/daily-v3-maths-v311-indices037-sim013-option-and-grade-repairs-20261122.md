# Maths Academic QA continuation — INDICES-037 and SIMULTANEOUS-013 (original source)

**22 November 2026 | PR #306 Draft | 0/200 formally approved | Live question bank, XP, MP, Mastery and Recovery untouched**

## Original-source provenance

The exact original source was reopened in `qa-staging/math-v31-original-sample10.json` at **blob SHA `2638a3b0ea387189ef2a278e21803219164986a2`**. The two source IDs are `LUX-MATH-Y9-INDICES-037` (printed paper Q37) and `LUX-MATH-Y9-SIMULTANEOUS-013` (printed Q173). These were checked against the original source stems, all six original A–F options, source answer letters and worked solutions. This is not a full 200-item raw JSON snapshot; source version/hash for the full canonical bank is not available for migration.

The [QA-only repair manifest](../qa-staging/math-v311-indices037-sim013-verified-options-20261122.json) contains **three distinct candidate versions** for **two original IDs**. The third is a *separate replacement stem for greater challenge*, NOT a second original question and NEVER an import-ready duplication.

## INDICES-037: full A–F distractor repair, original stem unchanged

Original source stem: `sqrt(2^(2n+6)) × 16^(n−1) / 8^(n−2) = 2^9`, then give `n²−n`.

Independent algebra: exponent on left is `(n+3)+4(n−1)−3(n−2)=2n+5`. Thus `2n+5=9`, `n=2`, and **F = 2**.

| Choice | New exact value | Explicit incorrect operation |
|---|---:|---|
| A | 0 | Calculate `n²−2n` instead of `n²−n`: `4−4=0` |
| B | 12 | Get `2n=4` then omit ÷2 and use n=4: `16−4=12` |
| C | 4 | Omit the final subtraction and give `n²=4` |
| D | 6 | Change the minus sign to plus: `n²+n=6` |
| E | −2/9 | Fail to halve the exponent under the square root, so wrong left exponent becomes `3n+8=9`, n=1/3 and `n²−n=−2/9` |
| **F** | **2** | **Correct** |

**Original B=5/2 and D=−3** are replaced; previous separate candidate had already proposed D=6, which this pack retains. The new E=−2/9 provides a genuine index-law error route, not another arbitrary nearby integer. Academic difficulty remains *provisional G8–9*: the central radical-index simplification overlaps the earlier `INDICES-029..032` family, so assess independent conceptual demand before assigning mastery.

## SIMULTANEOUS-013: exact original stem, reconstructed wrong operations

Original equations: `2x+3y=7` and `kx+6y=15`; find k for **no solution**.

The y-coefficients require scale factor 6/3=2, so k=2×2=4; the scaled first RHS would be 14, not 15. The two lines are parallel and distinct. **Original correct C=4 is retained.**

| Choice | New exact value | Explicit incorrect operation |
|---|---:|---|
| A | 30/7 | Incorrectly equate the x-coefficient ratio `k/2` to the RHS ratio `15/7`, ignoring the y-coefficient ratio |
| B | 5 | Add the +3 difference of y-coefficients to the original x-coefficient instead of doubling: `2+(6−3)=5` |
| **C** | **4** | **Correct** |
| D | −9 | Mistake no-solution parallel for perpendicular: slopes `−2/3`, `−k/6`, requiring product −1 → k=−9 |
| E | 2 | Copy original x-coefficient unchanged and fail to scale it |
| F | 12 | Treat the number 6 as the scale factor instead of `6/3=2` and set k=2×6 |

**Original G7 difficulty label remains unsupported**. The original stem largely needs one proportionality check and a simple constant comparison. Even if all five wrong options become diagnostic, it would be methodologically misleading to certify Grade 7 on that basis alone.

## SIMULTANEOUS-013: separately versioned higher-reasoning alternative

A new, *noncanonical* candidate asks:

`2x+3y=7` and `(k+1)x+(2k−2)y=15` have no solution. Find k **and justify why the lines are distinct rather than coincident**.

Set determinant zero: `2(2k−2)−3(k+1)=0`. Expanding `4k−4−3k−3=0` gives **k=7, correct letter C**. At k=7, the second LHS is `8x+12y` (4× the first) but RHS 15≠28: distinct parallel lines and no solution.

| Choice | Proposed value | Recoverable error |
|---|---:|---|
| A | −1 | Change `2k−2` to `2k+2` when forming the ratio |
| B | 5 | Expand `2(2k−2)` as `4k−2`, not `4k−4` |
| **C** | **7** | **Correct; must also justify inconsistent constants** |
| D | 23/7 | Incorrectly match variable coefficient to RHS constant ratio `(k+1)/2=15/7` |
| E | 1/2 | Apply perpendicular-gradient condition instead of parallel |
| F | −7 | Reach `−k=−7` correctly but do not reverse sign after division by −1 |

This candidate adds simultaneous parameter reasoning and a two-condition proof (parallel plus distinctness). This is **a plausible higher-demand redesign**, not proof of a Grade 7 classification. Per the [AQA GCSE Maths 8300 assessment objectives](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment), multi-step routine calculations can still be AO1. AO2 reasoning/AO3 unfamiliar problem-solving require independent comparison with authentic graded work; a changed parameter does not automatically qualify.

**Source identity rule:** Although original correct letter C is preserved, new solution **k=7 is NOT k=4**. This stronger stem must receive a distinct canonical/versioned ID and reviewed full-bank source digest before any import. Never overwrite `SIMULTANEOUS-013` by only changing a correct-option value.

## Automation and blocking

[Independent regression suite](../tests/daily-v3-maths-indices037-sim013-adversarial-20261122.test.mjs) reconstructs **3 × 6 = 18 options**, checks all **15 explicit error operations**, compares source details to the pinned original, verifies the no-solution determinant and noncoincident constants (including checking that wrong options have unique intersections), validates that the grade-uplift stem has its own candidate ID, and requires `studentCredit=false`, `mathDailyEnabled=false`, `independentGradeCalibration=false`, `exactTgsSchoolTaughtSubskillConfirmed=false` and `independentAcademicReviewerSigned=false`.

**Verdict:** Maths 0/200 signed. Two original full-choice repairs and one separately versioned stronger candidate staged, all HOLD. Await external grade benchmarking, school taught-subskill evidence, full canonical raw-bank SHA, genuine student error diagnostic review, iPad/offline/first-attempt durability and independent release approval. No Live change.
