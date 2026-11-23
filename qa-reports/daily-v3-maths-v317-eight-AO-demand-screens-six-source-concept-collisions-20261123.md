# Maths Academic QA V3.1.7 — Eight reasoning drafts: AO demand screen and six source-exact Mastery overlaps

**23 November 2026 — Draft [PR #306](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/pull/306) — Release gate BLOCKED; 0/200 original Maths items formally approved.**

## What was independently inspected

- Reopened the exact canonical reviewed 200-question bank, Git blob `0655fbc1b796bff68f533c060a43339dff6664be`. All 200 originals remain `dailyEligible:false` and the canonical file has **not** been edited.
- Compared **all eight QA-only Indices/Standard Form redesigns** from [V315](../qa-staging/math-v315-indices017-025-standard009-025-distinct-reasoning-candidates-20261123.json) and [V316](../qa-staging/math-v316-indices009-037-standard029-021-four-distinct-reasoning-candidates-20261123.json), and reopened the actual source bank for every original source ID.
- Reviewed all six previously flagged technique collisions against the **literal original maths**, not only normalized question wording. See [eight-item/six-pair evidence](../qa-staging/math-v317-eight-candidate-grade-demand-and-six-concept-overlap-evidence-20261123.json) and [Node QA checks](../tests/daily-v3-maths-v317-eight-AO-grade-screens-six-source-collisions-20261123.test.mjs).
- AQA's [GCSE Mathematics 8300 assessment objectives](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment) are used as the public **AO1 / AO2 / AO3 classification framework**. Their descriptions **do not provide an official Grade 7 numerical rating for an individual standalone MCQ**. This report provides no fabricated grade calibration or independent teacher certification. The TGS Year 9 curriculum PDF remains intentionally skipped as instructed.

## Grade-demand screen — eight distinct, unanswered release gates

| Draft source | Specific mathematical decisions the student must make | Reviewer evidence-based verdict | Next gate |
|---|---|---|---|
| INDICES-017 (V315) | Factor an exponential sum, impose strict square bounds and intersect with divisibility by 8 but not 16 | **Intermediate priority** for benchmark; more than routine substitution, but enumeration may be rehearsed | Compare with exam Higher reasoning item |
| INDICES-025 (V315) | Simplify power ratio to \(2^{n-3}\), constrain exponent interval, require square exponent parity | **Lower priority**. After one manipulation, parity and small-range enumeration appear routine | Upgrade if aiming at independently certified Grade 7+ |
| STANDARD_FORM-009 (V315) | Subtract waste, require 10% empty capacity, find integer ceiling, calculate unused material | **Lower priority**. Multi-step numerical recipe is explicit | Independent AO3/Grade 7 challenge needed |
| STANDARD_FORM-025 (V315) | Convert volume units, count particles, apply percentage loss and a changed volume | **Lower priority**. Stem already supplies operation order; contextual arithmetic alone is not sufficient | Need a less-signposted decision |
| INDICES-009 (V316) | Equate two hidden powers, solve connected exponent constraints, evaluate a different target | **Higher priority** for independent benchmark; AO2 plausible | Check whether simultaneous exponent equations are within taught scope |
| INDICES-037 (V316) | Prove odd exponent cannot give a square while enumerating cube exponents under an integer interval | **Intermediate priority**. Real parity reasoning, but short familiar structure | Benchmark age-appropriate reasoning demand |
| STANDARD_FORM-029 (V316) | Derive 820 million particles, restrict equal-load integer N, reject 51–54 as non-divisors and find N=50 | **Higher priority** for independent benchmark; non-routine constraint exists | Check artificiality, exact divisibility teaching and concept distinctness |
| STANDARD_FORM-021 (V316) | Build inclusive double percentage inequality in integer p, solve and count p=10...16 | **Intermediate priority**; AO2/3 possible but may be standard compound-inequality work | Compare against Grade 6 and 7 Higher exemplars |

Counts: **2 higher benchmark priority; 3 intermediate; 3 lower; 0 independently certified Grade 7+**. These labels are **review priorities, not grades, not passes or automatic student credits**.

Each draft includes six A–F options and a three-step worked answer. V315/V316 had already confirmed all eight correct keys, and V316 independently re-derived and updated its 20 incorrect option computations. V317 verifies **80/80** offline MathML fields across all eight questions and exact source-revision linkage; the new test does not replace a teacher's independent curriculum and mark-scheme review.

## Six concept collisions — distinguish overlap from equivalence

The previous V316 32-family map was a **provisional operation grouping**, not a claim of 32 different Mastery objectives. V317 now provides concrete comparisons of the original source work:

| Original source pair | Relationship evidenced by the source | Provisional scoring treatment |
|---|---|---|
| INDICES-013 vs 021 | Both expand x/y powers, equate two exponents and derive one n. Negative exponents change representation, not the core method. | Shared exponent-matching core; **no separate full Mastery credit** until independent teaching judgement |
| INDICES-029 vs 037 | Both simplify the identical \(\sqrt{2^{2n+6}}16^{n-1}/8^{n-2}\) to \(2^{2n+5}\). Q037 adds a subsequent \(n^2-n\) calculation. | Shared index-method evidence; track final polynomial substitution separately, not as an independent index skill |
| STANDARD_FORM-009 vs 013 | Both calculate (first amount − second amount) ÷ divisor; one is factory context and one is an explicit fraction. | Shared AO1 computation, retain the possibility that interpreting context adds a skill to test |
| STANDARD_FORM-003 vs 017 | Both form mass=count×per-particle mass, retain a percentage, and divide by bulk volume. | Same compound-density core; distinguish case contexts before any separate Mastery |
| STANDARD_FORM-002 vs 018 | Both combine two batches, but Q018 adds filtration before dividing by volume. | **Partly overlapping**, not identical; preserve extra percentage decision without minting full independent mastery |
| STANDARD_FORM-033 vs 034 | Both factory mass/pack problems, but Q033 loses 10% of combined mass whereas Q034 loses 15% of initial mass then reserves an absolute amount. | **Partly overlapping**, different operation order/percentage base; do **not** auto-merge or auto-double credit |

Four pairs share a close mathematical core, two require preserving an **additional independent operation**. None of the six is psychometrically certified equivalent and **no released Mastery ID is changed**. The downstream daily selection/MP allocator must await a separate approved concept map and a test that repeated variants cannot farm the same Mastery credit.

## Remaining release gates — not relaxed

- Independent school-taught-subskill evidence (TGS PDF retrieval skipped by parent request).
- AQA GCSE Higher sample-item comparator and educational Grade 7+ calibration for each actual draft, not a blanket mark based on step count.
- Independent evidence on incorrect-option plausibility, including true pupil choices where available.
- Preservation of the source 200 and Daily 10-question, six-choice intended contract until verified academic import.
- Physical iPad PWA validation for rendering, offline reload, storage persistence and score isolation. Browser/WebKit CI does not count as real iPad acceptance.

**Outcome: QA analysis committed to the Draft branch. 0/200 formal approvals. No source bank or student score updates. No merge or deployment.**
