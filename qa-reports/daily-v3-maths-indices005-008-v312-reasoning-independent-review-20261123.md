# Lux et Labor — Indices Q005–Q008: nonroutine reasoning redesign and mathematical QA

**23 November 2026 · PR #306 Draft · ORIGINAL REVISED BANK UNCHANGED · FORMAL APPROVAL 0/200**

## Source and reason for selecting the four questions

Direct source was the exact staged \`qa-staging/math-v311-reviewed-200.json\` (revision IDs \`INDICES-005..008-REVIEW-2\`). Each old stem used precisely the same algebraic routine
\[\frac{(4^a\cdot 8^{-b})^2}{2^{-c}}\]
and changed the numbers only. They had a valid calculated key and five numerically derived wrong values, but no independently benchmarked evidence of four distinct Year 9 Higher Grade7+ reasoning concepts. Merely making \`a,b,c\` larger would not fix that problem.

Four **separate versioned replacement candidates** are staged at:
\`qa-staging/math-v312-indices005-008-reasoning-replacement-candidates-20261123.json\`.
These files are **not** yet a revised 200-question release bank. They retain the original source IDs for traceability, use new \`revisionId\` values, and set \`academicQA:'pending'\`, \`dailyEligible:false\`, \`masteryEligible:false\`, \`independentGradeCalibrated:false\` and \`teacherTaughtConfirmed:false\`.

## Source-specific mathematical & pedagogical triage

| Source ID | New independent reasoning demand | Correct A–F choice | Mathematical answer | Distinct mathematical misconception outcomes |
|---|---|---:|---:|---|
| **INDICES-005** | Integer exponent, divisibility by 16, exclusion of multiples of 64, sum of allowed n | A | **7** | 3, 4, 9, 17, 2 |
| **INDICES-006** | Combined strict/weak bounds on powers of 2, perfect-square exponent condition, product | C | **8** | 6, 24, 0, 3, 12 |
| **INDICES-007** | Both prime exponents divisible by 3 for cubes; exclude both divisible by 6 | B | **33** | 57, 24, 3, 935, 81 |
| **INDICES-008** | Translate 2^p·8^q = 4^12 into p+3q=24, impose p≥q, maximize positive integer pq | D | **48** | 36, 21, 72, 144, 16 |

### Independent mathematics QA and adversarial proof

The committed executable test
\`tests/daily-v3-maths-indices005-008-v312-grade-reasoning-candidates-20261123.test.mjs\`:

- Parses the **actual staged stem parameters**, calculates allowed n independently by exhaustive small-integer enumeration for 005–007 and feasible (p,q) pairs for 008, and derives the exact mathematical answer.
- Independently reproduces every one of the **20 wrong-option results**, checks the causal erroneous-operation explanation belongs to that result, checks all A–F values are distinct and the stored key is unique.
- Renders the original 4 question stems, all 24 options and all 12 worked solution lines with the existing offline native MathML renderer; does not substitute image generation or external maths services for the required real MathML.
- Deliberately mutates each correct key and a wrong numeric option, and attempts forged \`dailyEligible:true\` admission; each mutation **must fail** validation.
- Has been run against the actual GitHub-hosted candidate bank and renderer in an independent JS V8 harness: **2/2 test suites PASS** (internally 4 source-derived mathematical checks and 20 wrong-route checks, plus adversarial mutations). **Official Node/GitHub Actions completed-green result has NOT been independently observed.**
- Has been added to the current GitHub Daily V3 workflow under both path filters, the syntax check and the Node tests.

### Educational QA and term-timing questions that remain open

AQA GCSE Mathematics 8300 explicitly lists routine multi-step procedures under AO1, separate from AO2 reasoning and AO3 problem solving. Reference: https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment. The replacements make students decide which conditions to impose, rather than only evaluate given powers. **That does not itself prove Grade 7+, AO2/AO3 weighting or authentic teacher-classroom fit.**

- 005 uses number theory/divisibility with negative exponents at some n: must confirm Year 9 Set 1 has taught exponent divisibility and integer domain checks.
- 006 uses perfect-square power exponents and inequalities with a strict endpoint: must check the **combined** subskills, not merely that indices appear on the topic map.
- 007 introduces **prime-factor exponents, cubes versus sixth powers, and congruence-class enumeration**. This is a serious **taught-content priority hold**; do not use it in Autumn Daily simply because it is mathematically correct.
- 008 is integer optimisation with inequality constraints and a possible completing-square solution; prove that Year 9 class has covered the necessary quadratic manipulation, or teach a valid alternative systematic finite search before assessing it.

Distractor causality is checked, but there is **no actual pupil response data or independent pedagogy reviewer** verifying that all the deliberately modelled errors are typical for TGS Set 1 at this stage. The questions must undergo external Grade7+ difficulty calibration and independent school teaching evidence before being promoted.

## Exact release decision

- Old 200-row draft remains unchanged and **0/200 approved**.
- Four new candidates are **additional staged alternatives only**, **0/4 independently educationally approved** and **0/4 eligible for Daily/MP/Mastery**.
- No source question, student record or production code was changed; PR #306 remains Draft, not merged/deployed.
- Do not change the original tests that validate the 200-row bank to force these replacements into it. Only after independent review and a fully rerun bank-level QA suite should a replacement ever be merged into an eventual 200-row release.
