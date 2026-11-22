# Maths V3.1 — Indices Q2–Q3 new AO2-style candidates and full source QA

**22 November 2026 · Draft PR #306 · 0/200 formal Academic QA approved · NO canonical bank or Live change**

## Original sources directly rechecked

Original sources: `Lux_Maths_Y9_V3_All_200_Student.pdf` page 1 and `Lux_Maths_Y9_V3_All_200_Answers.pdf` page 1. Both source stems and their printed correct keys were reopened before editing.

| Printed original | Mathematical source stem | Source key and value | Concern |
|---|---|---|---|
| Q2 `INDICES-002` | `4^(n+3) × 8^(4−n) / 2³ = 2¹²` | **C = 3** | Source operation is only `2^(15−n)=2¹²`, solve a linear exponent |
| Q3 `INDICES-003` | `4^(n+4) × 8^(5−n) / 2⁴ = 2¹⁵` | **E = 4** | Source operation is only `2^(19−n)=2¹⁵`, same method as Q1/Q2/Q4 |

The prior report already demonstrated Q1–Q4 are scaled repeats. Their source answer keys were correct, but the source four-question family does **not** demonstrate four independent Grade 7+ concepts. The new candidate stems and values below are **not** presented as original school content.

## Candidate Q2 — compare two changing index expressions, first integer crossing

[Full candidate source, exact A–F and workings](../qa-staging/math-v311-indices-002-003-ao2-cross-topic-redesign-20261122.json).

For non-negative integer n:
- `A(n)=4^(n+3)·8^(4−n)/2³=2^(15−n)`.
- `B(n)=4^(n−2)·2⁵=2^(2n+1)`.
- Find the **smallest** n for which **B(n) > A(n)**.

Compare powers of the same base: `2n+1>15−n` so `3n>14`; hence smallest integer **n=5 (new candidate option C)**. Verify the sharp threshold: at n=4, B=2⁹ and A=2¹¹ (not enough), while at n=5 B=2¹¹>A=2¹⁰.

| New option | Value | Mathematically reproducible hypothetical wrong working |
|---|---:|---|
| A | 3 | Read base 4 in A as base 2, giving incorrect exponent `12−2n`, then solve `4n>11` |
| B | 4 | Derive `n>14/3` correctly but round down to 4 |
| **C** | **5** | **Correct; first strict crossover** |
| D | 6 | Drop +1 in B's exponent, obtaining `3n>15` |
| E | 7 | Convert B's 4-power as a 2-power with unchanged exponent, yielding `n>6` |
| F | 9 | Replace 4 with 8 in A, giving false constant exponent 18, then solve `2n+1>18` |

**Academic concern:** This adds conceptual comparison/strict inequality and a boundary check, but a good pupil may solve it as a short linear inequality once the powers are reduced. It must **not** be labelled independently Grade 7 just because it has contextual letters or two expressions. The teacher's exact Autumn teaching of exponent-inequalities is unverified.

## Candidate Q3 — reconstruct a parameter from HCF and LCM of powers of 2

For integer n in **3 to 19**, let:
- `P(n)=4^(n+4)·8^(5−n)/2⁴=2^(19−n)`, and
- `Q(n)=4^(n−3)=2^(2n−6)`.

Both are positive integers in the specified range. Their **HCF** is `2⁸` and **LCM** is `2¹⁶`. Find n satisfying **both**.

For two positive integers, `HCF×LCM=P×Q`. Therefore `2^(8+16)=2^[(19−n)+(2n−6)]=2^(13+n)`, so **n=11 (new candidate option E)**. At n=11 the exponents are indeed 8 and 16, confirming HCF 2⁸ and LCM 2¹⁶.

| New option | Value | Mathematically reproducible hypothetical wrong working | Actual HCF/LCM exponents |
|---|---:|---|---|
| A | 3 | Solve only `P=2¹⁶` (LCM), ignoring Q | 0 / 16 |
| B | 7 | Solve only `Q=2⁸` (HCF), ignoring P | 8 / 12 |
| C | 9 | Mistakenly expand `2(n−3)` as `2n−4` when using HCF×LCM | 10 / 12 |
| D | 15 | Omit division by `2⁴` in P and equate its wrong result to HCF | 4 / 24 |
| **E** | **11** | **Correct** | **8 / 16** |
| F | 19 | Mistakenly convert `4^(n−3)` as `2^(n−3)`; solve only Q=LCM | 0 / 32 |

Here HCF/LCM is part of the reasoning, rather than another one-line `2^(constant−n)=2^K` exercise. **Nevertheless**, HCF/LCM of expressions and reconstructing a parameter must be independently checked against actual TGS taught content; the source school guide's broad *Indices* heading is **not** evidence that this subskill was taught.

## Four now DISTINCT candidate concepts from the previous repetitive family

| Printed source | New **candidate-only** mathematical demand | Source unchanged |
|---|---|---|
| Q1 | Perfect cube exponents plus strict interval and integer enumeration | Yes |
| Q2 | Two exponential expressions, strict inequality, first crossover | Yes |
| Q3 | HCF/LCM of parameterised powers, number-structure reconstruction | Yes |
| Q4 | General all-integer identity/invariance under n→n+3 | Yes |

This comparison describes mathematical **differences** between new candidate questions. It does **not** certify that four belong to different school-required Mastery concepts, all lie within taught Year 9 Autumn skills, or all reach GCSE Grade 7–9. Those are separate uncompleted independent Academic QA gates.

### Independent automated calculation and blocked release

The new [Q2–Q3 arithmetic regression](../tests/daily-v3-maths-indices-002-003-ao2-rewrite-20261122.test.mjs) recalculates source power identities and Q2 threshold for multiple nonnegative n, rederives **all six wrong/correct choices**, enumerates **every** n=3..19 for Q3's HCF/LCM and proves no five distractor choices satisfy both conditions; it also checks both new candidate IDs are distinct, six options unique, answer-letter compatibility, and **every release/credit flag remains false**. The test is included in the scoped Daily V3 CI.

**Successful CI:** [GitHub Actions #45063616130](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45063616130) at code commit `e57de89e59ab110d09285830707488ba562bc1b1`. Suites **131/131 + 59/59 + 37/37 passed**. This is reproducible arithmetic and guardrail evidence, *not* externally signed AQA grade band or observed student misconception frequency.

**Verdict:** Both new candidates remain **HOLD / QA-ONLY**. Original Maths bank still **0/200** formally academic-approved, and no candidate may be imported using the original ID: solution numbers differ (Q2 original 3→candidate 5, Q3 original 4→candidate 11). Assign new versioned canonical IDs and independently hashed original source only after external Grade 7+ benchmarking and exact taught-course evidence. Physical iPad install, offline restart, failed IndexedDB/QuotaExceeded writes and full first-attempt score integrity remain separate outstanding technical QA. PR #306 stays Draft; no Live App, Maths Daily or XP/MP release.
