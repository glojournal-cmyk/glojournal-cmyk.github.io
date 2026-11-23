# Lux et Labor — Changing the Subject Q018/Q024 and 18-candidate cross-pack QA

**23 November 2026 · PR #306 Draft · no merge, no deployment, 0/200 formal Academic QA approvals**

## Source reopening and why these exact two IDs were prioritised

Read the **latest** unmodified \`qa-staging/math-v311-reviewed-200.json\` on \`feature/daily-tasks-v3-20261122\`, original source IDs \`LUX-MATH-Y9-REARRANGING-018\` and \`LUX-MATH-Y9-REARRANGING-024\`.

Their actual question stems were the same routine fractional-linear algebra problem with different integer coefficients:

- Q018: \(\displaystyle y=4+\frac{5x+6}{5x+7}\).
- Q024: \(\displaystyle y=2+\frac{5x+6}{2x+7}\).

They complete the old **six-member arithmetic-template family** Q009/Q010/Q011/Q017/Q018/Q024. The other four IDs had already received separate candidate alternative designs; Q018 and Q024 were the remaining unmodified family members.

The current 200-question original revised bank is **not** changed. Parent asked to **skip the TGS Year 9 Maths Curriculum Outline PDF**: no PDF was requested, consulted or treated as a QA gate in this work.

## Two separate reasoning replacement proposals

Standalone candidate file:
\`qa-staging/math-v312-rearranging018-024-fixedpoint-quadratic-domain-candidates-20261123.json\`.

| ID | New mathematical objective | Exact correct answer | Letter | New reasoning |
|---|---|---|---|---|
| **REARRANGING-018** | For \(x\ge0\), invert \(\displaystyle y=\frac{4x+5}{x+2}\) and find a **non-negative fixed point** where \(x=y\) | \(\displaystyle x=\frac{2y-5}{4-y};\quad x_{\mathrm{fixed}}=1+\sqrt6\) | **D** | Solve the inverse, then derive a separate quadratic \(x^2-2x-5=0\); rule out the negative root \(1-\sqrt6\) |
| **REARRANGING-024** | For \(u,a>0,\ t\ge0\), invert \(\displaystyle s=ut+\frac12at^2\), keeping the physically meaningful quadratic root and exact output domain | \(\displaystyle t=\frac{\sqrt{u^2+2as}-u}{a},\quad s\ge0\) | **E** | Complete the quadratic inversion, reject the negative-time branch and preserve \(s=0\) (attained at \(t=0\)) |

Each new item has **6 A–F alternatives (1 correct + 5 wrong)** with a specific mathematical cause for each distractor and three worked solution steps. Both items remain \`academicQA:'pending'\`, \`dailyEligible:false\`, \`masteryEligible:false\`, \`independentGradeCalibrated:false\` and \`independentStudentMisconceptionCertified:false\`.

### Independent source-first math validation

Test file:
\`tests/daily-v3-maths-rearranging018-024-v312-fixedpoint-quadratic-qa-20261123.test.mjs\`.

- Parses the **actual stem** coefficients and variable-domain restrictions.
- For Q018, derives the inverse and fixed-point discriminant, evaluates the original Möbius source at several nonnegative values, checks each choice's inverse function and fixed-point value independently, and ensures **exactly one** complete answer satisfies the original. The incorrect reciprocal-of-inverse alternative has a **spurious singularity** at the valid input \(x=0\) and output \(y=5/2\); the test treats that as a genuine mathematically incorrect claim instead of aborting on Infinity.
- For Q024, reconstructs the quadratic coefficients and both possible quadratic roots from the source equation. It checks the **six displayed time formulas** at 15 distinct positive \((u,a)\) and \(t\ge0\) combinations, including \(t=0\). It independently reconstructs the missing factor of 2 in the discriminant, incorrect denominator, wrong-sign numerator, negative branch and wrong \(s>0\) output restriction.
- All **12 A–F statements** are individually examined; the correct answer is unique in each question. Corrupted keys, false alternatives, changed source coefficients and \`dailyEligible:true\` forged permission each fail closed.
- Renders **both stems, 12 options and six worked lines** successfully with the actual native offline MathML renderer, for **20 total renderable components**.
- Independently executed against the exact GitHub branch JS/JSON renderer and test sources in a separate V8 harness: **2/2 suites PASS**; Node imports are emulated, so **this is not an official completed-green GitHub Actions result**. The tests are committed to the existing CI path filters, syntax checks and Node unit test command.

### Further educational QA required

Mathematical uniqueness and causal distractors are demonstrated, but the following are **not** demonstrated:
- independent benchmarked GCSE Higher Grade7+ difficulty on the school's taught Year9 Set1 scope;
- actual learner error-frequency or independent human pedagogical review for each misconception;
- original source-PDF ambiguity/layout corrections outside these two stems;
- official completed-green GitHub Actions, physical iPad PWA, restored Daily storage and learner-score no-credit integration.

Q018's quadratic fixed-point task is a meaningful new reasoning goal; Q024's general quadratic inversion is distinct from routine fractional rearrangement, but its **positive/negative-root branch choice overlaps** with earlier candidate REARRANGING-014. These must not automatically receive separate full Mastery credit without concept-level review. No TGS PDF step is required merely to conduct this mathematical QA.

## Updated 18-candidate register

Created \`qa-staging/math-v312-18-candidate-academic-review-ledger-20261123.json\` and corresponding test \`tests/daily-v3-maths-v312-18-candidate-crosspack-academic-hold-20261123.test.mjs\`.

The new snapshot preserves the **previous 16-item snapshot** and all its revision/source traces, adding Q018 and Q024:

| Topic / draft candidate pack | Candidate questions |
|---|---:|
| Indices Q005–008 | 4 |
| Standard Form Q013–016 | 4 |
| Changing the Subject Q009–011, Q017 | 4 |
| Changing the Subject Q012–015 | 4 |
| Changing the Subject Q018 and Q024 | 2 |
| **TOTAL** | **18** |

The version-aware ledger records **18 question revisions / 108 options / 90 incorrect response explanations** and keeps **0 formal approvals and 0 credit permissions**. Five provisional related-concept flags (10 items) now include Q014/Q024 quadratic branch choices alongside earlier inverse-range, inverse-exclusion, exceptional-parameter and cross-topic integer-optimisation overlap pairs. They are **flags for educational review, not assertions that the question pairs are identical**.

The new two cross-pack validation cases test old/new source lineage, all candidate six-option schemas, 18 credit HOLD decisions, unchanged previous 16-row snapshot and five exact concept-overlap groups. They passed together with the Q018/Q024 mathematics cases: **4/4 suites PASS in the independent V8 harness**, not an official Node or iPad PASS. All added tests and the new ledger are wired into the GitHub Daily V3 workflow's PR/push filters and Node syntax/unit checks.

## Release position

- Original revised bank: **200 items unchanged**, all \`dailyEligible:false\`, **0/200** educational signoff.
- QA-only versioned alternatives: **18 newly designed candidates**, **0/18 independent Grade7+ educational signoff**, \`dailyEligible:false\` and \`masteryEligible:false\`.
- PR #306 remains **Draft**; **no merge, deploy, change to pupil Daily assignment, XP, MP, Mastery or Recovery**.
- No school curriculum PDF prerequisite: explicitly skipped at the parent's direction. Continue academic depth and repeated-template reviews, not an automatic numerical-question generation exercise.
