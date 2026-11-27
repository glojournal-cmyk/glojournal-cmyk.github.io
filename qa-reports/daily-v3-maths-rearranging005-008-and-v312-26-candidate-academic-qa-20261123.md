# Lux et Labor — Changing the Subject Q005–Q008: radical inverse and domain Academic QA

**23 November 2026 · Draft PR #306 · source 200-row bank unchanged · no formal Academic QA approval**

## Exact source reopened

The revised 200-question bank, \`qa-staging/math-v311-reviewed-200.json\` from the current QA branch, was reopened and original \`REARRANGING-005..008\` reviewed individually. All four asked essentially the same method: make x the subject of \(y=a\sqrt{bx+c}-d\) given \(y\ge-d\), with just numerical coefficients changing. Their historical mathematically correct keys are not evidence of **four independent challenging Grade7+ reasoning concepts**.

The user explicitly instructed to **skip retrieving/verifying the TGS Year 9 Maths Curriculum Outline PDF**. It was not requested and is not a procedural blocker for this QA. This does not amount to verifying which individual subskills have been taught.

## Four newly staged, mathematically different draft questions

The following are **standalone QA alternative versions, not changes to the actual 200-question source**:

\`qa-staging/math-v312-rearranging005-008-radical-inverse-reasoning-candidates-20261123.json\`

| Source ID | Reasoning requirement and recovered x | Key | Domain requirement and teaching risk |
|---|---|---|---|
| **REARRANGING-005** | \(y=\sqrt{x+4}+\sqrt{x}\), \(x\ge0\). Isolate remaining root after first squaring to find \(\displaystyle x=\frac{(y^2-4)^2}{4y^2}\) | **B** | **\(y\ge2\)**, attained at x=0. Squaring an inadmissible y below 2 gives extraneous solutions; must check the *unsquared* sign constraint |
| **REARRANGING-006** | \(y=\sqrt{x+1}+\frac4{\sqrt{x+1}}\), \(x\ge3\). Put \(t=\sqrt{x+1}\), solve \(t^2-yt+4=0\), then \(\displaystyle x=\frac{(y+\sqrt{y^2-16})^2}{4}-1\) | **D** | **\(y\ge4\)**. The smaller t root is below 2 for y>4 and violates x≥3; demonstrate using \((t-2)^2/t\ge0\). More complex inverse and domain proof |
| **REARRANGING-007** | \(y=\frac{\sqrt{x+2}-1}{\sqrt{x+2}+1}\), \(x\ge-1\). Invert the fractional relation \(u=(1+y)/(1-y)\) and then square to get \(\displaystyle x=\frac{(1+y)^2}{(1-y)^2}-2\) | **F** | **\(0\le y<1\)**. Zero is attained at x=-1, one is a non-attained limit, and reciprocal mistakes produce a different formula |
| **REARRANGING-008** | \(y=\sqrt{(x-3)^2}=|x-3|\), \(x\ge0\), under the question's \(y>0\). Two algebraic branches \(x=3\pm y\) | **B** | **Both branches give distinct permitted nonnegative solutions precisely for \(0<y\le3\)**. At y=3 the second solution x=0 is allowed; for y>3 it becomes negative; y=0 gives one repeated solution |

Each new source record is versioned against the exact old \`revisionId\`, contains 6 A–F options, 5 mathematically described false formula/domain/error methods, 3 explanatory steps, and **\`academicQA:'pending'\`, \`dailyEligible:false\`, \`masteryEligible:false\`, \`independentGradeCalibrated:false\`, \`independentStudentMisconceptionCertified:false\`**.

## Actual corrections and independent tests

The independent test is:
\`tests/daily-v3-maths-rearranging005-008-v312-radical-inverse-qa-20261123.test.mjs\`

- It parses the **candidate stem coefficients and declared input restrictions**, derives the inverse/fixed subexpression independently, evaluates all **24 complete A–F formula-and-domain claims**, and independently reconstructs the five intentionally wrong paths for each problem.
- It checks exact boundary points and multiple representative values, including Q005's y=2, Q006's y=4, Q007's y=0, Q008's y=3 and y values larger than 3. Q008 checks whether two valid nonnegative distinct branches exist, not merely whether both algebraic expressions are written down.
- It confirms 4/4 source-derived keys, 20/20 incorrectly computed formula/constraint options, six unique choices per question, and the exact old-to-new revision lineage.
- The first actual offline rendering check discovered **24 illegal escaped-space separators in A–F options** (the native MathML parser did not accept \`\\ \`) and **two unbraced \`\\frac4t\` macros** in Q006 worked solutions. The QA pack was repaired to supported TeX notation. A **second full rendering of 4 stems + 24 options + 12 worked lines = 40/40 MathML components PASS**.
- Deliberately changed source coefficients, original question/key metadata, wrong answer latex, full-answer domain conditions, invented causal rationales and forged Daily permission all result in fail-closed test assertions.
- Both (2/2) test suites actually ran using the current GitHub-hosted candidate/old-bank/renderer source in an independent JavaScript V8 harness and **PASSED**. This is not a verified completed-green official GitHub Actions run or a real physical iPad/PWA QA result.

The test has been added to CI for both PR/push source paths, \`node --check\`, and the actual \`node --test\` command.

## Cross-pack Academic QA: 26 staged candidates, not 26 approved concepts

New versioned snapshot:
\`qa-staging/math-v312-26-candidate-academic-review-ledger-20261123.json\`

Independent integrity regression:
\`tests/daily-v3-maths-v312-26-candidate-crosspack-academic-hold-20261123.test.mjs\`

The previous **22-item ledger snapshot is preserved**, and the 4 new root candidates extend total staging to **26 candidate revisions / 156 A–F choices / 130 stated wrong routes across 7 separate candidate packs**. Formal educational approval remains **0/26**, and student credit permission is **0/26**.

Four additional conceptual-overlap *review flags* now bring the tally to **13 paired related-skill groups involving 19 distinct candidates**:
- Q005/Q006: two-radical versus radical-reciprocal inversions, overlapping but with distinct mathematical derivations;
- Q006/Q024: parameter-dependent quadratic-root branch selection versus physical-domain quadratic inversion;
- Q007/Q003: nested-radical fractional inverse versus simpler radical inverse, overlapping in endpoint reasoning;
- Q008/Q014: multiple inverse branches and domain exclusion versus principal branch restriction.

These are **risk indicators**, not proof that two different items are educationally identical. Neither distinct source IDs nor multiple mathematically correct keys automatically produce independent Mastery credit. **2/2 cross-pack integrity suites PASS in the independent V8 harness**, retaining all 22 prior candidates, provenance, 26 educational HOLD states, and the exact 13 overlap groups.

## Educational Grade 7+ review (not certified)

The redesigned prompts require more than purely substituting numbers into the original square-root inverse formula, but difficulty and question quality must still be moderated against actual GCSE Higher Grade7+ exemplars or real student performance. Specifically:
- Q005 introduces multiple radical isolation and extraneous-solution detection: promising higher reasoning.
- Q006 involves a substitution, nonlinear inverse, quadratic branches and a domain proof: promising, but a similar two-branch test exists elsewhere in the candidate packs.
- Q007's inversion is reasonably multi-step but may be accessible at a lower GCSE Higher grade; **do not assert Grade7+ automatically**.
- Q008 intentionally tests subtle solution counts at the positive endpoint. Its Grade7+ challenge needs independent calibration.

No independent evidence that the 20 wrong pathways are **common** errors of Year 9 Set 1 learners is present. The code proves mathematical causality, not misconception frequency or an external reviewer's academic signoff.

## Release gate

- Exact original revised \`math-v311-reviewed-200.json\` **unchanged, 200/200 \`dailyEligible:false\`**, formal independent academic approvals **0/200**.
- The **26 new versioned alternatives remain separately staged**, all Academic HOLD, none integrated into Daily/MP/Mastery.
- PR #306 **Draft, not merged**. No deployment, actual pupil activity/history changes, XP, MP or Recovery credit.
- Completed-green official GitHub Actions result and physical iPad PWA acceptance have not been independently obtained.
- As the parent instructed, **no TGS curriculum PDF verification requirement** for this work.
