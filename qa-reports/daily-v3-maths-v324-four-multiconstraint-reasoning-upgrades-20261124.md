# Maths Academic QA V3.2.4 — Four source-specific Grade 7+ demand upgrades (QA drafts only)

**24 November 2026 | PR #306 Draft | Release BLOCKED | 0/200 formal Academic QA approvals**

## Exact state and why this is new work

Reopened the unchanged canonical [200-question source](../qa-staging/math-v311-reviewed-200.json) at Git blob `0655fbc1b796bff68f533c060a43339dff6664be`, the [200-row V323 holds](../qa-staging/math-v323-canonical200-all-topics-hold-dispositions-source-exact-20261124.json) and the [V322 17-pack version history](../qa-staging/math-v322-all-versioned-candidate-packs-200-source-dedup-and-credit-deny-20261124.json). Four source IDs had **zero full-question versions** in those previous staging packs. They have now been given **four distinct source-linked draft replacements**, without editing or importing the original bank:

[Four-question, 24-option QA staging pack](../qa-staging/math-v324-four-source-linked-multiconstraint-reasoning-candidates-20261124.json)

| Original source ID | Previously unresolved weakness | New reasoning demand | Independently derived draft key |
| --- | --- | --- | --- |
| `INDICES-013` | For-all-variable exponent matching was effectively routine; provisional G7 unsupported | Intersect perfect-square exponent, strict powers-of-two bounds and comparison with a second exponential sequence; sum two permitted integers | **B: 8** from n = 3, 5 |
| `STANDARD_FORM-001` | One-step density arithmetic and recycled granule context | Combine scientific-notation mass, two percentage changes and **minimum** extra buffer volume under a density inequality | **A: 2 × 10¹ cm³** |
| `GRAPHS-009` | Intersection followed by a routine parallel line intercept | Recover **both** lines through a point with positive-axis intercepts enclosing a prescribed area and add both gradients | **A: −10** from m = −1, −9 |
| `SIMULTANEOUS-014` | Single-parameter no-solution ratio check | Find **both** singular parameter values and prove that each is inconsistent, then sum them | **C: −14/3** from k = −4, −2/3 |

## Stem-first calculations and distractor QA

1. **INDICES-013:** `P(n)=2^(13−n)`, `Q(n)=2^(2n−3)`. Strict bounds force n in {3,4,5,6,7}; square power forces {3,5,7}; `P>Q` forces `n<16/3`. The exact intersection {3,5} sums to 8. Incorrect choices map to omission of a second valid integer, ignored second comparison, incorrect perfect-fourth-power restriction, omitted inequality, or testing parity of n rather than the exponent.
2. **STANDARD_FORM-001:** Initial mass = `3e11 × 4e−10 = 120g`, retained mass = 90g, compacted volume = 160cm³, required final volume `≥90/0.5=180cm³`; **minimum extra volume is 20cm³**, `2×10¹`. Wrong options target one-place exponent slip, failing both percentage transformations, missing mass removal, reporting total not extra volume and ignoring the safety limit.
3. **GRAPHS-009:** Original lines meet at P=(1,3). A line with gradient m and positive intercepts has area 8 when `m²+10m+9=0`. Both m=−1 and m=−9 satisfy positive intercepts and area 8, summing to −10. Distractors reflect missing either root, reversing signs, averaging rather than summing or subtracting the two valid slopes.
4. **SIMULTANEOUS-014:** The coefficient determinant is `(k−1)²−(2k+3)²=−(k+4)(3k+2)`, zero only at k=−4 and −2/3. For k=−4 the LHSs are identical but RHSs 7 and 14 differ; for k=−2/3 the LHSs are negatives but RHSs are not. Both systems are inconsistent; sum = −14/3. Wrong options isolate only one parameter branch, reverse signs, omit a divisor or assume there can be no parameter value producing an inconsistent system.

Every draft has **six unique A–F mathematical answers**, exactly one recomputed key, **five distinct source-specific error explanations**, a worked solution, and explicit absent teacher/independent-grade/empirical-distractor/concept/device approvals. These are **candidate mathematical/pedagogical redesigns**, **not independently certified GCSE Grade 7 items**. In particular, the area/quadratic and variable-parameter questions may exceed current taught subskills: no contrary claim is made because the parent instructed the team to skip the TGS Year 9 curriculum PDF.

## Version accounting: never credit question variants separately

The completed V322 snapshot recorded 17 complete candidate packs, 112 version records across 87 original source IDs, of which 45 had reasoning redesigns and 42 only editorial fixes. V324 adds **one** pack and **four previously absent IDs**, with no collisions with earlier V312–V320 versions. Hence the combined staged snapshot is **18 packs, 116 historical candidate versions, 91 distinct original IDs with at least one full-question draft, 49 source IDs with reasoning redesigns, 42 editorial-only, 109 without a full-question draft**.

These figures are **staging inventory**, not `116/200` or `91/200` approval. The V322 and V323 historical source-version ledgers are intentionally not rewritten, so their reported counts remain an accurate snapshot of their own audit versions. The V324 regression explicitly computes the updated totals without amending the underlying original source bank.

## QA and release gates

[New source-bound stem-first regression](../tests/daily-v3-maths-v324-four-reasoning-independent-20261124.test.mjs) independently recomputes all four answers and tests positive domain restrictions, exact six-option structure, replacement lineage, five wrong-answer explanations, and zero credit. A GitHub Actions `completed/success` outcome **must be observed** for the current branch before calling CI green; the report itself is not a passing run.

**Remaining blockers:** individual Grade 7+ external calibration, exact taught subskill verification, independent plausible-student-error review, independent distinct Mastery concept decisions, physical iPad PWA/score persistence, original PDF/MathML device fidelity, and full-bank academic signoff. All 200 original source IDs stay `dailyEligible:false`. No merge, deployment, Maths Daily/XP/MP/Mastery/Recovery awards or learner-state changes.
