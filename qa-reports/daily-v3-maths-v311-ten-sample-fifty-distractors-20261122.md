# Maths V3.1 — exact A–F pedagogical distractor review (10 original sample IDs)

**22 November 2026 — reviewer-only original sample. 50 / 50 WRONG options inspected for plausible teaching mechanisms; 0 / 10 formally signed for Live.**

## Method & important distinction
- Source is the branch's **exact original** `qa-staging/math-v31-original-sample10.json`, with original `correctOptionId`, six `latex` choices and worked steps, plus the independent mathematical correctness audit already completed on 200/200.
- For ten sampled IDs, each of the **five incorrect** A–F options is compared against the actual mathematical result and original question. A `TRACEABLE` error is arithmetically/algebraically reproducible from an identifiable mistaken operation. `POSSIBLE` remains a hypothesis. `UNEXPLAINED` means no distinct actual student misconception demonstrated. `RED_FLAG` has a concrete plausibility/problem-design issue.
- **No rationales invented for unknown options.** This is not a formal independent external GCSE grade calibration, confirmation that TGS taught the subskill, or a review of all 1,000 wrong options. A question with apparently traceable wrong options can still be grade-inappropriate.
- Categories from this source-based screening: UNEXPLAINED=20; POSSIBLE=19; TRACEABLE=8; RED_FLAG=3. This counts options, not approved questions.

| Original ID | Wrong choice | Exact option | QA assessment | Source-related explanation |
|---|---|---|---|---|
| `GRAPHS-028` | A | `37/2` | **UNEXPLAINED** | Two units above correct 33/2; no independently identifiable wrong gradient/intercept operation |
| `GRAPHS-028` | B | `27/2` | **UNEXPLAINED** | Three units below correct 33/2; a distinct student misconception has not been demonstrated |
| `GRAPHS-028` | D | `33` | **POSSIBLE** | Exactly double the correct x-intercept; could reflect mishandling the denominator of a half-valued result |
| `GRAPHS-028` | E | `35/2` | **UNEXPLAINED** | One unit above the key; not demonstrably caused by a specific student method |
| `GRAPHS-028` | F | `17` | **POSSIBLE** | Rounding 16.5 to 17 without instruction would be a plausible misreading, but unconfirmed |
| `REARRANGING-023` | A | `-2(3y-5)/(y-5)` | **UNEXPLAINED** | Numerator differs from correct -(6y-11)/(y-5) by a constant 1; no worked student-error pathway |
| `REARRANGING-023` | B | `-(6y-11)/(y-3)` | **POSSIBLE** | Wrong collection of denominator terms after z=y-1, changing correct y-5 into y-3 |
| `REARRANGING-023` | C | `-(6y-13)/(y-5)` | **UNEXPLAINED** | Numerator constant differs by 2 with no source-specific algebra trace |
| `REARRANGING-023` | E | `-(7y-16)/(y-5)` | **UNEXPLAINED** | Both linear numerator coefficients changed; no single consistent student mistake established |
| `REARRANGING-023` | F | `-6(y-2)/(y-5)` | **UNEXPLAINED** | Numerator differs by 1 from the true one; another near-miss rather than a justified unique misconception |
| `STANDARD_FORM-011` | B | `7.5×10^7` | **TRACEABLE** | Correct remaining material, but never divide it equally among 4 containers |
| `STANDARD_FORM-011` | C | `1.875×10^8` | **TRACEABLE** | Correct mantissa with exponent raised one power of 10 |
| `STANDARD_FORM-011` | D | `2.125×10^7` | **TRACEABLE** | Add discarded 5×10^6 rather than subtract before dividing by 4 |
| `STANDARD_FORM-011` | E | `2×10^7` | **TRACEABLE** | Ignore the waste and divide original 8×10^7 by 4 |
| `STANDARD_FORM-011` | F | `1.875×10^6` | **TRACEABLE** | Correct mantissa with exponent reduced one power of 10 |
| `INDICES-005` | B | `1/16` | **POSSIBLE** | Reciprocal of correct 16; a negative-exponent sign reversal is possible |
| `INDICES-005` | C | `8` | **POSSIBLE** | One power of two too few, 2^3 instead of 2^4 |
| `INDICES-005` | D | `65536` | **RED_FLAG** | 2^16, a very large outlier without an obvious misconception trace; replace only after deriving a genuine wrong solution |
| `INDICES-005` | E | `32` | **POSSIBLE** | One power of two too many, 2^5 instead of 2^4 |
| `INDICES-005` | F | `1` | **UNEXPLAINED** | Would require exponent 0; derivation from original product/square/division is unsubstantiated |
| `REARRANGING-020` | A | `-3/4+3/[4(2+1/y)]` | **POSSIBLE** | Use +2 instead of -2 when isolating 3/(4x+3) |
| `REARRANGING-020` | C | `-12+12/(1/y-2)` | **RED_FLAG** | Exactly 16 times the intended x expression; a plausible one-step division error is not established |
| `REARRANGING-020` | D | `-3/4+3/[4(y-2)]` | **POSSIBLE** | Replace reciprocal 1/y with y when clearing the equation |
| `REARRANGING-020` | E | `3/4+3/[4(1/y-2)]` | **POSSIBLE** | Wrong sign for subtracting 3 while isolating 4x |
| `REARRANGING-020` | F | `-9/4+3/(4y)` | **UNEXPLAINED** | Unclear algebraic pathway; not currently diagnostic |
| `STANDARD_FORM-017` | A | `3×10^3` | **POSSIBLE** | Correct mantissa with one too many powers of ten |
| `STANDARD_FORM-017` | B | `2×10^2` | **TRACEABLE** | Remove 50% (rather than 25%) from the initial 6×10^4 g; remaining 3×10^4/150=200 |
| `STANDARD_FORM-017` | D | `5×10^2` | **UNEXPLAINED** | Value 500 has no clearly reconstructed percentage/mass/volume mistake |
| `STANDARD_FORM-017` | E | `9×10^2` | **UNEXPLAINED** | Value 900 has no clearly reconstructed single error mechanism |
| `STANDARD_FORM-017` | F | `4×10^2` | **TRACEABLE** | Ignore the 25% filtration and divide original 6×10^4 g by 150 cm³ |
| `INDICES-037` | A | `0` | **POSSIBLE** | Evaluate n²−2n for n=2 instead of n²−n |
| `INDICES-037` | B | `5/2` | **UNEXPLAINED** | No specific error in exponent-equating or final evaluation has yet been derived |
| `INDICES-037` | C | `4` | **TRACEABLE** | Use n² and omit subtraction of n when n=2 |
| `INDICES-037` | D | `-3` | **RED_FLAG** | For real n, n²−n≥−1/4; -3 cannot be the requested expression for any real n. Suggest test a genuine sign mistake n²+n=6 as candidate replacement, not silently edit source |
| `INDICES-037` | E | `1` | **POSSIBLE** | Evaluate n−1 rather than n²−n for n=2 |
| `SIMULTANEOUS-013` | A | `6` | **UNEXPLAINED** | Copies a coefficient from the second equation; not a demonstrated no-solution misconception |
| `SIMULTANEOUS-013` | B | `5` | **UNEXPLAINED** | Nearby value 5 without reconstructed parallel-line reasoning |
| `SIMULTANEOUS-013` | D | `-4` | **POSSIBLE** | Sign error while establishing equal coefficient ratios |
| `SIMULTANEOUS-013` | E | `2` | **POSSIBLE** | Copy original x coefficient rather than double it |
| `SIMULTANEOUS-013` | F | `3` | **UNEXPLAINED** | Copy first y coefficient, not a distinct demonstrated error |
| `GRAPHS-039` | A | `14` | **POSSIBLE** | Twice the correct coordinate sum 7, but method must be reconstructed |
| `GRAPHS-039` | B | `2` | **UNEXPLAINED** | No clear link between value 2 and the midpoint, bisector, or intersection stages |
| `GRAPHS-039` | C | `1/7` | **POSSIBLE** | Take reciprocal of requested xP+yP; arguably a weak distractor for this stem |
| `GRAPHS-039` | D | `9` | **UNEXPLAINED** | No exact reconstructable path from line intersection to 9 |
| `GRAPHS-039` | E | `6` | **UNEXPLAINED** | Equals twice yP, but why student would double only y is unsupported |
| `SIMULTANEOUS-023` | A | `27` | **UNEXPLAINED** | No exact algebraic or evaluation pathway has been established |
| `SIMULTANEOUS-023` | B | `31` | **POSSIBLE** | Would use y=1 instead of 3 when evaluating 2·4²−y; source of y error unproven |
| `SIMULTANEOUS-023` | C | `29/2` | **UNEXPLAINED** | Half the correct final result without a realistic stage-specific misconception |
| `SIMULTANEOUS-023` | E | `26` | **POSSIBLE** | Subtract 2y instead of y, giving 2·16−2·3=26 |
| `SIMULTANEOUS-023` | F | `58` | **POSSIBLE** | Double final result 2(2x²−y), but not a demonstrated source mistake |

## Actual corrective actions
1. **Strong candidate**: `STANDARD_FORM-011` has **five different, traceable** wrong-answer calculations (no sharing; exponent ×10; add instead of subtract; ignore waste; exponent ÷10). Retain original choices pending individual grade-7 demand and taught confirmation.
2. **Critical option**: `INDICES-037` choice D `−3` is mathematically impossible for `n²−n` with real `n`; a source-specific candidate is `6` from wrongly substituting `n²+n` when n=2. **Do not modify the canonical 200-bank JSON** until the proposed distractor is independently marked, raw SHA updated and all six options reverified.
3. **Unclear/weak options**: `GRAPHS-028` has three unmotivated near-miss choices; `REARRANGING-023` includes several shifts of numerator constants without traceable working; `STANDARD_FORM-017` has 500 and 900 without a demonstrated one-step error; `SIMULTANEOUS-023` 27 and 29/2 are untraceable.
4. **Poor context**: `STANDARD_FORM-017` still requires correction to unrealistic physical density 300 g/cm³, independent of distractor quality.
5. **Curriculum quarantine**: `GRAPHS-039` is Spring perpendicular bisector and must not qualify for Autumn Daily credit absent proof it was already taught.

## Release gate
No sample earns `academicQA=approved`; the original published reviewer sample still has outdated `(1z−4)x` for `REARRANGING-023` while the separate V3.1.1 editorial source repairs it. Complete five **actual, not speculative** misconception rationales for each item, validate target grade against full AQA Higher demand and verify school-taught subskills. Original source and Live bank remain unchanged, and draft PR #306 remains unmerged.
