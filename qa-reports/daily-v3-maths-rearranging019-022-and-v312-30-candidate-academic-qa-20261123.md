# Lux et Labor — Changing the Subject Q019–Q022: source-first independent Academic QA

**23 November 2026 · Draft PR #306 · Original Maths revised-200 untouched · Formal independent Academic QA 0/200**

## Actual source reviewed

Reopened \`qa-staging/math-v311-reviewed-200.json\` from the current GitHub QA branch and inspected source records \`LUX-MATH-Y9-REARRANGING-019\`, \`-020\`, \`-021\`, \`-022\`, including their original A–F choices, keys and worked steps. All four were coefficient variants of exactly the same manoeuvre:

\[
\frac1y = k+\frac{a}{bx+c}.
\]

The original keys were consistent with these rearrangements, but repeating this algorithm four times does **not** by itself demonstrate four independent Grade7+ reasoning tasks or four Mastery concepts. Those original bank records are retained **unchanged** and \`dailyEligible:false\`.

**TGS Year9 Maths Curriculum Outline PDF** was deliberately **skipped** at the parent's explicit instruction and is not a procedural prerequisite for these staged design/math QA tasks. This is not evidence that each newly used subskill was taught.

## New four differently demanding QA-only candidates

Standalone versioned proposal:
\`qa-staging/math-v312-rearranging019-022-composite-reciprocal-reasoning-candidates-20261123.json\`.

| Source ID | Distinct revised task | Exact answer | Key |
|---|---|---|---|
| **REARRANGING-019** | \(\frac1y=1+\frac2{3x+2}\), \(x\ge0\), with additional requirement \(y\ge\frac45\): invert then **intersect conditions** | \(\displaystyle x=\frac{2(2y-1)}{3(1-y)},\quad\frac45\le y<1\) | **F** |
| **REARRANGING-020** | Given \(f(t)=\frac{4t+3}{8t+9}\), \(x\ge0\), recover x from **two-stage composite** \(z=f(f(x))\) and output range | \(\displaystyle z=\frac{40x+39}{104x+105};\quad x=\frac{105z-39}{40-104z},\quad\frac{13}{35}\le z<\frac5{13}\) | **E** |
| **REARRANGING-021** | Sensor \(\frac1y=\frac4{5x+4}+k,\ k>0\): infer unknown k from its **nonattained ceiling** y→1/2, then invert and determine range | \(\displaystyle k=2,\quad x=\frac{4(3y-1)}{5(1-2y)},\quad\frac13\le y<\frac12\) | **A** |
| **REARRANGING-022** | \(\frac1y=1+\frac5{x^2+4}\), \(x\ge0\): quadratic-denominator inversion, valid **non-negative root** and half-open range | \(\displaystyle x=\sqrt{\frac{9y-4}{1-y}},\quad\frac49\le y<1\) | **F** |

All candidates have six mathematically distinct A–F complete answer statements, five concretely described incorrect calculation/constraint pathways, three worked steps and explicit \`academicQA:'pending'\`, \`dailyEligible:false\`, \`masteryEligible:false\`, \`independentGradeCalibrated:false\`, \`independentStudentMisconceptionCertified:false\`.

### Mathematical reasoning and endpoint checks

- Q019: \(y=(3x+2)/(3x+4)\). Its original x≥0 image is \([1/2,1)\), but the *extra independent condition* y≥4/5 is equivalent to x≥2, so the **final answer must be \([4/5,1)\)**. A correctly inverted formula with the wrong lower endpoint is *still an incorrect complete MCQ option*.
- Q020: composing the original f with itself gives \((40x+39)/(104x+105)\). The output at x=0 is \(39/105=13/35\), an **attained** lower endpoint; the upper asymptote is \(40/104=5/13\), **not attained**. The reciprocal-of-inverse distractor also has a false pole at the permitted lower endpoint.
- Q021: as x tends to +infinity, \(1/y\to k\), so its limiting ceiling is \(1/k=1/2\), hence **k=2**. The source y at x=0 is **1/3**. An answer with k=1/2 or an incorrectly included y=1/2 cannot be considered correct.
- Q022: \( (1-y)(x^2+4)=5y\), hence \(x^2=(9y-4)/(1-y)\). Only the non-negative root respects x≥0, with attained lower endpoint \(y=4/9\). A reversed-sign denominator gives a nonreal square root at the admissible interior y, and a candidate allowing y=1 uses a zero denominator.

## Actual programmatic Academic/Technical QA

Dedicated executable source-first test:
\`tests/daily-v3-maths-rearranging019-022-v312-composite-reciprocal-qa-20261123.test.mjs\`.

- Parses actual changed source **coefficients, extra y condition, function composition f(t), unknown k and the quadratic denominator**, without trusting the stored correct option.
- Uses a restrictive TeX expression evaluator to independently calculate **all 24 A–F full statements** and reconstruct the five false formula/range pathways per question.
- Tests source substitutions at valid boundary and representative interior values, including x=0, x=2, x>2, and limits. Distinguishes invalid radical/false-pole choices from valid inverse functions.
- Confirms \`correctAnswerLatex\` matches only its one correct keyed option, six unique choices and source-bank revision provenance.
- All **4 stems + 24 options + 12 worked solutions = 40/40** MathML source chunks successfully render using the *actual native offline Maths renderer*.
- Initial render detected \`\\frac45\`, \`\\frac12\`, \`\\frac4{...}\` and other **unbraced fraction TeX macros** unsupported by the native renderer. The staged pack was repaired by bracing numerator/denominator; *question answers and algebra were not changed*. A subsequent full 40/40 render passed.
- Negative mutations of input coefficients/thresholds, correct keys, wrong option math, permitted output conditions, wrong errorPath and attempted \`dailyEligible:true\` are required to fail closed.

The actual current GitHub source tests were independently executed using JavaScript V8 with Node \`test/assert/fs\` imports emulated: **2/2 test suites PASS**. The test was added to existing GitHub Actions PR/push path triggers, Node syntax verification and Node test command. **This is not independent verification of an official completed-green GitHub Actions run or a physical iPad PWA test.**

### Cross-pack 30-candidate release ledger

The previous 26-candidate snapshot has been retained. New additive QA register:
\`qa-staging/math-v312-30-candidate-academic-review-ledger-20261123.json\`.

Matching source-linked release guard:
\`tests/daily-v3-maths-v312-30-candidate-crosspack-academic-hold-20261123.test.mjs\`.

Both cross-pack test cases pass against the actual GitHub sources in the V8 harness, verifying **30 candidates in 8 separate QA-only packs, 180 unique-position A–F answers, 150 explained distractor candidates, all 30 credit-blocked**, old 26 candidate identities preserved, and **17 related-concept risk pairs across 24 candidates**. The 4 newly added pairs flag Q019/Q021 reciprocal range reasoning, Q020/Q018 rational transformation work, Q022/Q014 positive root/domain selection, and Q019/Q001 rational inverse under extra input/output restrictions. **A related-topic flag is not proof that questions assess exactly the same mathematical skill.**

## Educational QA holds: mathematical accuracy is necessary, not sufficient

These four proposals add distinct steps to the source template, but formal **GCSE Higher Grade7+ calibration remains unperformed**. Particular risks:
- Q019 may still be accessible using fairly routine inverse and inequality steps; Grade7+ demand not established.
- Q020 is a promising multi-stage composition and inversion exercise, but its A–F options must be checked for readability and whether the arithmetic burden masks the intended reasoning.
- Q021 uses a limit to infer k; actual suitability and prior teaching of asymptotic reasoning must be assessed independently, without reinstating a TGS PDF requirement.
- Q022 uses standard quadratic-denominator inversion and correct branch selection, which may not independently achieve Grade7+ without extra reasoning.

The five incorrect methods in each MCQ are **mathematically reproducible**, not documented as frequent authentic mistakes by the student. A separate human/independent pedagogical reviewer, Higher-tier exemplar calibration, and eventual source-to-live Daily scoring and device checks remain outstanding.

## Release decision

- **Current source-bank 200 items** unchanged, \`dailyEligible:false\` for all **200/200**, formal Academic QA signoffs **0/200**.
- New **30 candidate alternatives** are separately staged, all \`academicQA:'pending'\` and **0/30 educationally approved**, no XP/MP/Mastery eligibility.
- PR #306 stays **DRAFT**, not merged or deployed. No student task assignments, completion records, score/Recovery or pet-game progress changed.
- Official GitHub Actions completed-green CI and physical iPad PWA integrity verification have **not** been obtained. No TGS curriculum PDF lookup will be required just to continue this agreed QA work.
