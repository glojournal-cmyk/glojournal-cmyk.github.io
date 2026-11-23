# Lux et Labor — Maths Revised200: Changing the Subject Q001–004 candidate redesign and cross-pack academic QA

**23 November 2026 · Draft PR #306 · Original source 200 questions unchanged · Formal Academic QA approvals 0/200**

## Actual source and original academic problem

Inspected the exact **current** QA branch \`qa-staging/math-v311-reviewed-200.json\`, source IDs \`LUX-MATH-Y9-REARRANGING-001..004\`. All four original stems have the identical fractional-linear kernel, changing only constants:

\[
y=\frac{a(x-b)}{ax+c}.
\]

The source keys and mistake calculations had previously been mathematically reconstructed, but four coefficient variations do **not** establish four independently demanding GCSE Higher Grade7+ reasoning opportunities, nor do they merit four distinct Mastery concept credits.

The user explicitly waived consulting the **TGS Year9 Curriculum Outline PDF**. No PDF retrieval or PDF-dependent blocking gate was attempted. This does not certify which topics the student has actually been taught.

## New, separately staged v3.1.2 Q001–004 alternatives

[QA staging source](../qa-staging/math-v312-rearranging001-004-inverse-model-reasoning-candidates-20261123.json): this is *not* part of the live or old 200-row bank.

| Source ID | New reasoning demand | Correct complete answer | A–F |
|---|---|---|---|
| **REARRANGING-001** | Invert rational function under \(x\ge0\), derive lower attained endpoint and upper asymptote | \(\displaystyle x=\frac{3y-7}{4-y},\;\frac73\le y<4\) | **A** |
| **REARRANGING-002** | Recover two unknown coefficients \(p,q\) from observed measurements, then invert and exclude output \(y=5\) | \(p=5,q=6,\quad\displaystyle x=\frac{2y-6}{5-y},\;y\ne5\) | **B** |
| **REARRANGING-003** | Simplify \(\sqrt{x+3}/(x+3)\) for \(x>-3\), reverse an inverse-square formula and give its entire strict positive output range | \(\displaystyle x=\frac1{y^2}-3,\quad y>0\) | **C** |
| **REARRANGING-004** | Model the region between concentric circles, cancel squared terms and rearrange area into a radius subject including the minimum attainable area | \(\displaystyle r=\frac{A-\pi d^2}{2\pi d},\quad A\ge\pi d^2\) | **D** |

- Q001: \(y=(4x+7)/(x+3)=4-5/(x+3)\); at \(x=0\), \(y=7/3\) is attained; \(y=4\) is never attained. A mathematically correct inverse paired with the wrong endpoint is a wrong MCQ *statement*.
- Q002: two records \((x,y)=(0,3),(2,4)\) imply \(q=6,p=5\); the source is not constant, and \(y=5\) is unattainable. The observed \(y=3,4\) are not excluded values.
- Q003: since \(x>-3\), the fraction equals \(1/\sqrt{x+3}\), strictly positive with no finite positive upper bound. The false option imposing \(x\ge0\) incorrectly restricts \(y\le1/\sqrt3\).
- Q004: \(A=\pi[(r+d)^2-r^2]=\pi(2rd+d^2)\), \(r\ge0,d>0\). The minimum \(A=\pi d^2\) is attained at \(r=0\). Accepting merely \(A\ge0\) allows nonphysical negative \(r\).

Each candidate contains six A–F choices, five *operation-specific* erroneous complete statements, and three explanatory worked steps. All carry \`academicQA:'pending'\`, \`dailyEligible:false\`, \`masteryEligible:false\`, \`independentGradeCalibrated:false\`, \`independentStudentMisconceptionCertified:false\`. They are not promoted to the source 200 items.

## Independent executable mathematics and negative QA

[Candidate tests](../tests/daily-v3-maths-rearranging001-004-v312-inverse-model-qa-20261123.test.mjs) use a small **restricted TeX arithmetic evaluator**, not the stored correct-option key, to parse and evaluate the actual candidate expression trees. For each source equation they independently determine coefficients, output restrictions and expected erroneous algebraic routes, then compare each of the 24 printed option *formula+domain* statements.

- **4/4 correct full-answer positions** and **20/20 separately derived wrong operation/constraint outcomes**, tested over multiple valid inputs including exact boundaries \(x=0,r=0\).
- Tests both true and **spurious** singularities: Q001's reciprocal-of-inverse distractor is undefined at a valid lower endpoint, and so cannot be accidentally considered a valid full answer.
- Tests all six choices in Q002 against two independently inferred source coefficients; Q003's strict positive image and faulty restriction; Q004's geometric minimum area and algebraic errors across multiple \(r,d\) pairs.
- Successfully renders **4 stems, 24 choices and 12 explanation steps** using the current offline native MathML renderer (**40/40** textual/maths source components generated).
- Deliberately mutates each answer key, one alternative, one domain statement, one actual input coefficient/measurement, the explanation \`errorPath\`, and an attempted \`dailyEligible:true\` flag. The test rejects all such corrupted candidates.

The submitted test was run against the actual GitHub staging source and renderer in a separate JavaScript V8 harness, with Node \`test/assert/fs\` imports emulated. **2/2 test suites PASS**. This is not the same as completed-green official GitHub Actions, browser or physical iPad PWA validation. The test and candidate pack were included in both workflow path filters, Node syntax check and unit test invocation.

## Educational demand review — numerical validity is not Grade7+ certification

This staging step does **not** independently certify any of the 4 candidates as Grade7+:
- **Q001:** reasoning about a rational endpoint and limit is a meaningful extension, but the actual inverse is routine. High-priority **difficulty review** before release; more work may be needed to meet Grade7+ rather than Grade5–6.
- **Q002:** model identification from two observations adds connected algebra. May still be routine for a strong Higher student; requires independent AO2/AO3 calibration and assessment of how challenging the two observations are.
- **Q003:** domain care is important, but the inverse-square algebra is itself standard; **Grade7+ is unproven**.
- **Q004:** geometric rearrangement, cancelled squared terms and feasible-region constraint are a more promising higher-demand modelling target, but still uncalibrated.

Deriving a numerical wrong route does **not** show that real pupils commonly make it. The question design should not be approved merely because tests pass. An independent pedagogical reviewer and representative GCSE Higher exemplars or pupil diagnostic data are required before promoting.

## 22-item cross-pack candidate tracking

Created an additive snapshot, preserving the previous 18-item source trace:

- [22-item academic HOLD ledger](../qa-staging/math-v312-22-candidate-academic-review-ledger-20261123.json)
- [Cross-pack integrity and overlap test](../tests/daily-v3-maths-v312-22-candidate-crosspack-academic-hold-20261123.test.mjs)

| Separate candidate batch | Count |
|---|---:|
| Indices Q005–008 | 4 |
| Standard Form Q013–016 | 4 |
| Changing the Subject Q009–011 & Q017 | 4 |
| Changing the Subject Q012–015 | 4 |
| Changing the Subject Q018 & Q024 | 2 |
| Changing the Subject Q001–004 | 4 |
| **Total** | **22** |

Complete snapshot records **22 question revisions / 132 A–F options / 110 incorrect response explanations**. The registry rejects duplicate source IDs, missing original revision linkage, altered prior HOLD results, malformed six-option choices, missing wrong-route explanations and unexpected permission/academic approvals. **2/2** ledger integrity suites PASS in the independent JavaScript harness. As above, official CI completion remains independently unverified.

Four new conceptual-overlap flags, on top of the previous five, make **nine pairs** involving **15 unique candidate questions**:
1. Q001 and earlier Q012 — rational inverse with restricted output range.
2. Q002 and earlier Q013 — infer coefficients from observations before inverting.
3. Q003 and earlier Q014 — radical inverse and domain/branch choice.
4. Q004 and Standard Form Q016 — geometric area and backwards reasoning, albeit different contexts.

Overlaps represent **academic-review flags, not proofs of identical mathematics**. A different source ID, topic or numerical variant should never by itself create an extra Mastery concept.

## Release position

- Original **200-row revised-bank JSON unchanged**; **200/200 \`dailyEligible:false\`**.
- Current independent formal Grade7+ academic approvals: **0/200** original, **0/22** separate replacement candidates.
- Tests added to existing CI configuration; **no completed-green official GitHub Actions run** has been observed.
- **Draft PR #306 only**. No merge, live deployment, no Daily task selection activation and no XP/MP/Mastery/Recovery writes.
- TGS Year 9 curriculum PDF verification omitted at the user's explicit request and is **not a procedural blocker** for this staging work.
