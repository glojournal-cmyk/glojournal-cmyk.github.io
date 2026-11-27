# Lux et Labor — Changing the Subject Q009, Q010, Q011, Q017: independent mathematics and academic QA

**23 November 2026 · PR #306 Draft · original 200-question revised source unchanged · Academic approval 0/200**

## What was inspected and why

The current 200-question staged source \`qa-staging/math-v311-reviewed-200.json\` and the separate 200-row number-neutral template register were reopened from the **current QA branch**. Six original Changing-the-Subject candidates (\`REARRANGING-009,010,011,017,018,024\`) share a very similar number-neutral fractional-linear template. Four have been selected for targeted **reasoning redesign**; the other 2 are unchanged.

This pass obeys the parent's direction **not to reopen or require the TGS Year 9 curriculum PDF**. It does not claim the linked school PDF was checked, and no approval is blocked *solely* by the absence of that PDF. The challenge still needs independent Grade7+ and misconception-quality assessment, plus actual App/device acceptance before release.

Four **separate draft proposals**, not modifications to the 200-row bank, are now in:
\`qa-staging/math-v312-rearranging009-011-017-inverse-domain-reasoning-candidates-20261123.json\`.

| Replacement | Reasoning and mathematical evidence | Correct response | Academic risk |
|---|---|---|---|
| **REARRANGING-009** | From \(\displaystyle y=\frac{3x+4}{2x-5}\), obtain \(\displaystyle x=\frac{5y+4}{2y-3}\) and **exclude** \(y=\frac32\) | **C** | A formula alone is insufficient; exclusion of the unreachable output is integral to the answer |
| **REARRANGING-010** | For \(\displaystyle t=\frac{3p+12}{p+2}\) and \(p>0\), obtain \(\displaystyle p=\frac{12-2t}{t-3}\) and **strict range** \(3<t<6\) | **C** | Requires reasoning about positivity and limiting values, not only symbolic inversion |
| **REARRANGING-011** | For \(\displaystyle y=\frac{kx+6}{3x+k}\), find both parameter values making y independent of x: \(\displaystyle k=\pm3\sqrt2\) | **D** | Requires recognizing numerator/denominator proportionality and both square-root branches |
| **REARRANGING-017** | For \(\displaystyle y=\frac{x^2-25}{x-5}\), \(x\ne5\), factor, cancel and preserve the missing output \(y=10\): \(\displaystyle x=y-5\), \(y\ne10\) | **D** | Cancelling factors can hide a removable excluded point; full domain matters |

Each item has six A–F alternatives, five **specific erroneous algebra/domain routes**, and three written solution steps. The options in Q009, Q010 and Q017 deliberately include answers with a mathematically correct *formula but the wrong or missing output restriction*; their choice is not correct merely because one numerical substitution matches.

## Source-first independent mathematics QA

A dedicated test:
\`tests/daily-v3-maths-rearranging009-011-017-v312-domain-and-parameter-qa-20261123.test.mjs\`

- Parses the **stems** to recover source coefficients or the removable factor; derives the expected inverse and excluded-value conditions instead of trusting the keyed answer.
- Checks Q009's inverse across 9 representative x values and tests the excluded y from the source ratio of coefficients.
- Checks Q010's inverse for 8 different **strictly positive** p inputs and the endpoint exclusion of the exact range \(3<t<6\).
- Derives the Q011 discriminant/constant-function condition \(k^2=6\cdot3=18\); independently computes all six paired parameter alternatives and checks **both signs**. The true pair gives a constant ratio over sampled x; every wrong pair must produce a varying ratio.
- Factors Q017's source relationship with \(x^2-5^2\), proves the hole \(x=5\) maps to **excluded** \(y=10\), and checks the inverse against valid input samples.
- Reconstructs all **24 candidate options' formula/parameter and domain semantics**; enforces exactly one globally correct A–F statement in each of four questions. Checks wrong-rationale descriptions stay tied to their specified mathematical operation.
- Renders **four stems, 24 choices and 12 worked steps** with the actual offline native MathML functions.
- Tests adversarially modified source coefficients, incorrect correct-option IDs, wrong distractor expressions, forged exclusion values, unsupported misconception explanations and any attempted \`dailyEligible:true\` approval. These must fail closed.

The **two test suites were actually executed against the GitHub branch source and renderer in an independent JavaScript V8 harness** and both passed after repairing the test-only arithmetic parser to support \(3-t\) and \(12+2t\). The tests are now included under the normal Daily V3 GitHub Actions **push/PR path filters, syntax check and Node unit test command**.

**Do not equate this with a completed-green GitHub Actions run.** An independently verified official Actions result, browser tests and physical iPad PWA restart/storage validation are still outstanding.

## Educational review limits

- Original source had a six-member numeric-template family. New candidates have four **different mathematics goals**, but mathematical correctness and a plausible argument do **not** guarantee four independently Grade7+ benchmarked tasks.
- Q009/Q017 may be easier than true Grade7+ when taught as routine procedures; explicit domain reasoning is the intended depth, to be evaluated against actual Higher-tier exemplars.
- Q010 range reasoning may be appropriate AO2, but its precise difficulty and approachability for the learner are not externally calibrated.
- Q011 parameter degeneracy and branches are potentially demanding; the diagnostic value of each wrong parameter pair requires an independent pedagogy review.
- Each mathematical wrong route was reproduced, **not** observed as a frequent real-student misconception. Student-answer-based validation and independent teaching-review signatures have not occurred.
- The user explicitly permitted **skipping the TGS Year 9 curriculum PDF**, so it is not being sought as an acceptance prerequisite for this candidate revision. This does not create evidence that any specific advanced subskill has been taught.

## QA release disposition

- Main revised 200-question source: **unchanged**, **200/200 Daily-blocked**, **0/200 final academic approvals**.
- Candidate Q009/Q010/Q011/Q017: **four new proposals, zero formally educationally approved, zero Daily/MP/Mastery eligible**.
- Previously proposed Indices 4 and Standard Form 4 are also separate QA alternatives; **12 unapproved reasoning candidates staged in total**.
- PR #306 remains **Draft**; no merger into \`main\`, no deployment and no student XP/MP/Mastery/Recovery changes.
- Next: independently grade-calibrate the candidate reasoning, assess the educational plausibility of the distractors, and replace more repetitive original families only with genuinely distinct concepts after separate academic and technical QA.
