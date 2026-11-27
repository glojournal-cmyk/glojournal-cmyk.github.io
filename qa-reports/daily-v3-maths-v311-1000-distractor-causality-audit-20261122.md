# Lux et Labor — Revised Maths V3.1.1: 1,000 wrong-choice mathematical causality QA

**22 November 2026 · Draft PR #306 · Source is staged \`qa-staging/math-v311-reviewed-200.json\` · NO MERGE / NO RELEASE / NO STUDENT CREDIT**

## Precise claim and audit boundary

This is a **source-derived mathematical reconstruction** of the five incorrect A–F answer choices for each of 200 **revised draft** Maths questions. The review separately calculates what happens if the specified erroneous step is applied to the **revised question's actual numerical or algebraic data**; it checks whether that miscalculation produces exactly the **printed incorrect option**.

This is **not** independent teacher approval that 1,000 wrong choices are *commonly selected by pupils*. It is not GCSE Grade 7+ standardisation, real TGS class-taught evidence, a browser/device approval or permission to grant Daily/XP/MP/Mastery. A mathematical misconception can be logically reproducible yet implausible, too artificial, too easy, or not a strong diagnostic item.

## Topic-level audit outcome

| Revised topic | Source candidate IDs | Wrong options with source-derived numeric / formula causal reconstruction | Special handling | Mathematical wrong-route discrepancies |
|---|---|---:|---|---:|
| **Indices** | 40 | **200/200** | 199 numerical and one symbolic identity, Q4 | 0 after reconstruction |
| **Standard Form** | 40 | **200/200** | Mass/density, speed, units, percentages, reversed losses, case-specific error-step formulas | 0 |
| **Changing the Subject** | 40 | **200/200** | 195 general inverse-error formula routes and five bespoke algebra errors in Q23, including principal roots and reciprocal/nested denominators | 0 |
| **Straight-Line Graphs** | 40 | **200/200** | 194 generic coordinate/slope mistakes and six individually verified alternative routes, including Q28 | 0 |
| **Simultaneous Equations** | 40 | **200/200** | 191 generic linear/arithmetic routes and nine bespoke/other routes; one explanatory mismatch repaired | **One originally, now repaired** |
| **Total** | **200** | **1,000/1,000** | **Mathematical cause → candidate option only** | **1 explanation repair** |

These totals refer to the actual revised-bank **200 × five incorrect options**. The independent stem-first correct-answer audit previously validated 200/200 candidate keys, six choices per question, and the Changing Subject 920 valid inverse probes. Those are **separate checks** from this 1,000-route QA.

### Confirmed actual source repair — Simultaneous Q11 option F
- **Exact candidate:** \`LUX-MATH-Y9-SIMULTANEOUS-011\`, wrong answer option **F = 29**.
- **Original question first equation:** \((4x+5y)/4=29/4\).
- **Incorrect earlier explanation:** “Give the first equation’s right-hand side.” This would yield \(29/4\), **not 29**.
- **Repaired error-path explanation:** “Clear the common denominator by multiplying the first equation by 4, obtaining \(4x+5y=29\); then report the new right-hand side 29 instead of the requested product \(xy\).”
- **Actual revised question stem, correct key D = 6, A–F values, revision ID and credit flag are all unchanged.** This remains a **draft unapproved** item. Regression must reject returning to the incorrect explanation.

## Reproducible GitHub tests added

All five source-bound causal-proof files have been committed under \`tests/\` and wired into the existing Daily V3 GitHub workflow's push/PR filters, syntax step and Node unit-test command.

| Test | Intended gate |
|---|---|
| \`daily-v3-maths-indices40-200-wrong-option-causality-20261122.test.mjs\` | 200 wrong exponent/power computations, symbolic Q4 |
| \`daily-v3-maths-standard-form40-200-wrong-option-causality-20261122.test.mjs\` | 200 wrong numerical methods on actual standard-form contexts |
| \`daily-v3-maths-changing-subject40-200-wrong-formula-causality-20261122.test.mjs\` | All 200 wrong inverse expressions compared across independent domain-valid \(x,y\) probes, including custom Q23 |
| \`daily-v3-maths-graphs40-200-wrong-option-causality-20261122.test.mjs\` | Actual coordinate/slope mistake ⇒ each of 200 wrong numbers |
| \`daily-v3-maths-simultaneous40-200-wrong-option-causality-20261122.test.mjs\` | Actual equation/misstep ⇒ each of 200 wrong numbers; includes Q11 repair guard |

**CI completion status:** Source-derived calculations above were checked in this QA session and each new test has been committed and referenced in the workflow. A fresh **completed-green** GitHub Actions run was **not independently observed**, so do **not** label the CI tests PASS until the run is inspected. Mathematical proof and CI runtime status are deliberately reported separately.

## Remaining full Academic QA blockers

**Mathematical causal plausibility alone is not educational signoff.** Every one of the 200 items still requires an appropriately independent human/specialist educational judgement of: (1) whether the five reproduced mistake paths are realistic, distinct and non-trivial at this age; (2) actual Grade 7+ Higher AO2/AO3 challenge, rather than a hard-looking but routine AO1 or parameter-rotated template; (3) its exact **TGS Year 9 Set 1 taught subskill** (not just the broad Autumn topic name); (4) worked-solution clarity and fully justified valid-domain requirements; and (5) production offline iPad WebKit/PWA, storage/reload, 10-MCQ selection and no unearned Daily/MP/Mastery/Recovery credit.

A prior first-pass family-level school/difficulty triage classified original source candidates into **79 upgrade-for-grade**, **17 context/duplicate rewrites**, **80 exact-taught-scope quarantines** and **24 potential external benchmarking candidates**. Those numbers were based on the *original source*, **not a substitute for individual reclassification of the newly rewritten candidate stems**. Prior coverage also found **393/1,000** descriptions drawn from just 20 phrases repeated ≥10 times. Repetition is a review risk and **is not, by itself, evidence that an answer is wrong or an independently valid pupil misconception**.

The original PDF's **507 typeset-dependent A–F slots** remain separately awaiting original-page spatial visual QA. These are NOT newly detected maths answer errors and should not be counted as failed calculations.

## Release disposition
- **Formal Academic QA accepted:** **0/200** (no independent specialist/class-taught/Grade7+ signoff).
- **Revised question credit eligibility:** **0/200**; every draft candidate remains \`dailyEligible:false\`.
- **Deployment / merging / student score writes:** **none**. PR #306 stays **Draft**. Preserve later independent Food Tests/numeric-marking changes on \`main\`.
- **Next priority** is a per-question, per-taught-subskill, independent educational **Grade and misconception realism** audit, not another answer-key-only or superficial string-repetition pass.
