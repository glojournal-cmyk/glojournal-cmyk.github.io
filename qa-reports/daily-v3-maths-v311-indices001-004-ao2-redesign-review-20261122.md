# Maths V3.1 Indices Q1–4: move beyond four scaled AO1 substitutions

**22 November 2026 | Draft PR #306 | NO CREDIT / NO SOURCE BANK OVERWRITE**

## Source inspection and teaching distinction
Re-opened original `Lux_Maths_Y9_V3_All_200_Student.pdf`, pp.1–2, and `Lux_Maths_Y9_V3_All_200_Answers.pdf`, p.1; checked original Q1–4 and source correct keys **B=2, C=3, E=4, D=5**. All four source questions use the same base-conversion method:

`(4^{n+(q+1)}·8^{(q+2)-n})/2^{q+1} = 2^{3q+6}`, for q=1,2,3,4.

Converting bases gives `2^{(4q+7)-n}=2^{3q+6}`, hence n=q+1 (2,3,4,5). Each original question changes only the exponents/constants; it does NOT offer independent Grade7 reasoning. The prior screen's `UPGRADE_STEM_FOR_G7PLUS` remains justified; **this is not a finding that the original answers were wrong**.

Two distinct *new candidate versions* for source Q1 and Q4 are staged with separate `newCandidateVersionId` strings in [QA-only JSON](../qa-staging/math-v311-indices-001-004-two-ao2-redesigns-20261122.json). These versions **do not replace original IDs**, and source Q2–3 are deliberately NOT relabelled as fixed.

## Candidate A — source Q1: integer solutions with perfect cube and strict exponent bounds

`A(n)=4^{n+2}8^{3-n}/2^2=2^{11-n}`, n integer. Find the sum of all n for which A(n) is a perfect cube and `2^5<A(n)<2^{12}`.

A power of two is a positive perfect cube if its nonnegative integer exponent is a multiple of 3. Strict bounds mean `5<11−n<12`; the cube exponents are **6 and 9**, giving **n=5 and n=2**, sum **7, option B**.

| Choice | Value | Recoverable incorrect operation |
|---|---:|---|
| A | 6 | Include prohibited strict upper boundary exponent 12 (n=−1), sum −1+2+5 |
| **B** | **7** | **Correct** |
| C | 15 | Include exponent 3 below lower bound, adding n=8 |
| D | 9 | Use the perfect-square condition (even exponents 6,8,10) rather than perfect cubes |
| E | 3 | Demand n itself be divisible by 3 (n=0,3) rather than 11−n |
| F | 5 | Find n=5 only; omit exponent 9 / n=2 |

This tests simultaneous mathematical **conditions** and interpretation, rather than another bare solve-for-n task. It can plausibly engage AO2, but **the precise TGS Autumn lesson evidence for cube/exponent constraints and inequalities, and independent Grade 7+ exam calibration, are still outstanding**.

## Candidate B — source Q4: prove a general index invariant, all integers

`F(n)=4^{n+5}8^{6-n}/2^5=2^{23-n}`. Which statement holds for **all integer n**?

`F(n+3)=2^{23-n-3}=2^{-3}F(n)=F(n)/8`, so the correct source-letter slot is **D**.

A second derivation from the original factors confirms this for arbitrary n: changing n by 3 multiplies the factor `4^{n+5}` by `4^3=64` and the factor `8^{6-n}` by `8^{-3}=1/512`; combined ratio **1/8**.

| Choice | Proposed ratio F(n+3)/F(n) | Recoverable wrong operation |
|---|---:|---|
| A | 8 | Sign of the overall n exponent reversed |
| B | 1/2 | Only apply one of the three n increments |
| C | 1 | Assume +n and −n cancel before converting 4 and 8 to base 2 |
| **D** | **1/8** | **Correct** |
| E | 64 | Keep only the change in the 4-power and omit the 8-power |
| F | 1/512 | Keep only the change in the 8-power and omit the 4-power |

This is a **different concept** from Candidate A — structural proof and invariance rather than enumeration under a perfect-power condition. The relationship holds for positive and negative n, without presuming F(n) is always an integer. Distinct six alternatives and the five explicit wrong mechanisms need **external pedagogical credibility review**; mathematical derivability is not an independent teacher endorsement.

## Validation and immutable release decision

The [new Node QA test](../tests/daily-v3-maths-indices-001-004-ao2-redesign-20261122.test.mjs) re-derives original Q1–4 answers from the archived source, enumerates Q1's valid n over a wider integer domain with strict boundaries, recomputes each wrong-value candidate and separately checks Q4's function identity for several negative/positive n and the five distinct wrong change ratios. It asserts explicit **0 academic approval / 0 student credit** and new ID/version requirements.

The new tests are included in [Daily V3 contract CI #45063000447](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45063000447), which completed **SUCCESS**. This is not an AQA question-grade certification.

**Required next review:** independently compare difficulty and actual Autumn teaching of perfect-power reasoning and algebraic generalisation against authentic TGS/GCSE Higher examples; ask pupil-level independent critic to review all ten wrong-option pathways. Decide whether to use the candidate stem or revise again, then assign separately versioned canonical IDs and source hashes. The other two scaled original family members (Q2–3) remain **UPGRADE_STEM_FOR_G7PLUS**.

**Formal Maths approved 0/200.** Draft PR is unmerged. No Live App, student XP/MP/Mastery, original 200 bank or device save data changed.
