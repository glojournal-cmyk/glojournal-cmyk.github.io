# Standard Form Maths V3.1 — full 40-question / 200-distractor numeric and error-route Academic QA batch

**22 November 2026 · Draft PR #306 · Original source Q41–80 · Not academic-approved or released**

## Sources reopened and verification method

Source Q41–80 and their archived printed worked answers were re-opened through the source-preserving QA exports:
- [40 original student-question and worked-answer records](../qa-staging/math-v311-batch40-standard-form-source-qa-20261122.json), preserving PDF-extracted problem, source A–F starts, printed correct letter, original template ID and grade/scope HOLD flags
- [40 independent original mathematical recalculations](../qa-staging/math-v311-standard-form40-independent-calculation-20261122.json)
- [240 original A–F raw option snippets](../qa-staging/math-v311-standard-form-240-source-options-qa-ledger-20261122.json)

A dedicated **strict, newline-preserving scientific-notation parser** now verifies those source numbers rather than relying on the overly conservative integer-only safety screen. Each original one-line `a × 10k` source snippet is read as `a × 10^k`; it is tested numerically against the independently computed original answer. This is an **original PDF text calculation**, not independent visual proof that all mathematical superscripts and stacked fractions were typeset faithfully.

## 40/40 correct original numeric answers, 200 original distractor slots

| Source original scope | Verified in this batch | Still blocked |
|---|---:|---:|
| Forty original question IDs/printed correct letters/source worked arithmetic | **40/40 numerical match** | Grade7+ independent signoff, actual Year9 Autumn taught skills |
| Original single-line standard-form options | **216** interpretable source snippets | Original typeset PDF visual verification |
| Other original single-line decimal/integer options | **16** interpretable | Context and distractor credibility |
| Stacked fraction or multiline choices | **8 unresolved** | Exact visual option fidelity; do NOT delete newlines to manufacture numbers |
| Original wrong numeric options demonstrated unequal to correct value | **192/200** | This alone is NOT a realistic diagnosed mathematical misconception |
| Wrong numeric options matching an **explicit source-specific erroneous computation** | **107/200** | Independent teacher and pupil-error plausibility confirmation |
| Wrong numeric options with no reproduced mechanism from the systematic error-model set | **85/200** | Independent derivation or rewrite, not guessed explanations |

The missing eight are **exact original source choices Q61 B/C/D/E, Q63 E/F, and Q64 E/F**. An initial looser parser had incorrectly reported only four, because stripping PDF line breaks turned four fraction fragments into apparently valid integers. That bug was rejected and the report revised to **232 readable + 8 unsafe**.

See [all original 40×6 numeric results](../qa-staging/math-v311-standard-form40-source-240-option-numeric-review-20261122.json) and [200 original distractor arithmetic error-route attempts](../qa-staging/math-v311-standard-form40-original-200-distractor-operation-candidates-20261122.json).

## Source-specific error routes: matched by genuine arithmetic on the original operands

The error models use source coefficients, not arbitrary labels. The wrong result is recomputed from a specific plausible **mistaken operation** (not yet independently verified as a *common* pupil misconception). A choice can match more than one mistake; no unproved explanation is added merely to fill all five wrong-choice rationales.

| Original family (4 questions each) | Wrong options with an arithmetic error route | Illustrative reproduced source mistake |
|---|---:|---|
| Q41–44: particle bulk density | 16/20 | Q41 A `3 × 10^4`: use volume `2 × 10^-1` instead of `2 × 10^1` cm³ |
| Q45–48: summed standard-form quantity / division | 14/20 | Q45 B `2.8 × 10^3`: incorrectly count both positive numerator contributions twice |
| Q49–52: difference and division | 10/20 | Q49 F `3.15 × 10^5`: add `6 × 10^5` and `3 × 10^4`, instead of subtracting |
| Q53–56: standard-form quotient | 13/20 | Q53 C `1.14 × 10^15`: multiply the difference `5.7 × 10^8` by denominator `2 × 10^6` instead of dividing |
| Q57–60: filter and density | 13/20 | Q57 F `4 × 10^2`: omit the 25% mass loss from filtering |
| Q61–64: relative percentage | 1/20 | Q62 D `-26`: reverse old and new in the percentage change numerator; 8 of the 20 are PDF-layout unresolved |
| Q65–68: m³-to-cm³ and particle count | 14/20 | Q65 D `1 × 10^6`: use conversion factor `10^5` rather than `10^6` |
| Q69–72: three-term quantity and quotient | 11/20 | Q69 D `-4.1 × 10^2`: reverse the sign of the correctly combined numerator |
| Q73–76: process loss and packets | 10/20 | Q73 D `5.58 × 10^4`: divide by twice the specified packet count |
| Q77–80: reverse percentage / remaining balance | 5/20 | Q77 D `1.5 × 10^4`: use twice the given packet count |

**Across all 40 questions: 107 numeric error-path matches; 85 numeric wrong choices without a modeled operation; eight visually unresolved source values. Thirty-seven of forty originals have at least one reproducible wrong-operation candidate. Independent wrong-answer pedagogy signoff = ZERO.**

## Student-learning quality and concrete source repairs

1. **Q41–44 original densities:** independently computed at 300, 400, 500, 600 g/cm³. These can be arithmetically valid but are not scientifically plausible ordinary bulk densities. The four [source-specific staged repairs](../qa-staging/math-v311-standard-form-density-7-repairs-20261122.json) include much more plausible ranges, but still need all teaching/Grade7+ and exam calibration gates; never overwrite source records in place.
2. **Q57–60 original filtered densities:** 300, 30, 300, 30 g/cm³; two repeated pairs and questionable material conditions. Existing [7 repair candidates](../qa-staging/math-v311-standard-form-density-7-repairs-20261122.json) cover source Q41–44 and Q58–60; original Q57 has a separate candidate in `math-v311-pedagogical-repair-candidates-20261122.json`. They are still QA-only.
3. **Q73–76 top-band same-answer issue:** all four original questions result in `1.116 × 10^5`. There are [four distinct-source repair candidates](../qa-staging/math-v311-standard-form-033-036-distinct-replacements-20261122.json) whose five wrong-choice arithmetic routes have separate automated checks. **Two involve Spring reverse/compound percentage content**, and must not silently enter Autumn Year9 Daily without exact taught evidence.
4. **Q61–64 and Q77–80 percentage scope:** exact teaching status should not be inferred merely from the Autumn `Standard Form` unit title. The eight source option fractions and Grade7+ reasoning demand are still held.
5. **Repeated method ≠ four separate Mastery skills:** all ten source template families have four variants, but independent AO2/AO3 mathematical demand is not certified by merely changing exponent sizes, particle counts, or units.

## Software evidence, and what has not been certified

The [new Node regression test](../tests/daily-v3-maths-standard-form40-240-options-107-operations-20261122.test.mjs) independently re-parses all 240 original option snippets, checks all forty correct original numeric values and 192 distinct wrong numbers against the source's independent worked computation, proves **eight** structurally unsafe stacked fractions, checks 107 arithmetic models against their original wrong choice values, and independently reconstructs a wrong-choice calculation from **each of the ten source families**. It also asserts both existing repair candidate groups are **not imported or credit-enabled**, including explicit Spring exclusions.

**Academic meaning:** A wrong numerical alternative with a mathematically reproducible erroneous operation is only *candidate diagnostic evidence*; we have not established that a pupil would reasonably make that mistake, nor that the source original is GCSE Higher Grade 7–9, taught, non-repeated and fair.

**Formal approvals: 0/40 original Standard Form and 0/200 full original Maths bank.** No new versioned canonical question IDs approved, original student quiz records untouched, no XP, MP, Mastery or Recovery credit, PR #306 stays Draft and Live remains on main. An independently signed review of every six choices and external taught/grade evidence are required before deployment.
