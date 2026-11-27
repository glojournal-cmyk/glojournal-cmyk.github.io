# Maths Academic QA V3.1.5 — Indices and Standard Form (80 source questions)

**23 November 2026 · Draft PR #306 · canonical revised-200 source unchanged · academic release BLOCKED**

## Verified original sources

Reopened these exact Draft-branch files:
- `qa-staging/math-v311-reviewed-200.json` — canonical source bank, blob `0655fbc1b796bff68f533c060a43339dff6664be`.
- `qa-staging/math-v311-200-item-grade-demand-triage-20261122.json` — original classification and historical flags, blob `08cf0cd1d0c2db7d98e0e5baf89cfe8d7ebfb864`.
- `qa-staging/math-v311-revised200-template-reuse-review-20261123.json` — **numeric-neutral similarity**, not proven pedagogical equivalence.
- [New source-exact 80-row verification and stale-risk register](../qa-staging/math-v315-indices40-standardform40-source-exact-pedagogical-hold-and-12-risk-corrections-20261123.json).

The earlier [Indices 40 source-first regression](../tests/daily-v3-maths-revised40-indices-stem-first-20261122.test.mjs) and [Standard Form 40 source-first regression](../tests/daily-v3-maths-revised40-standard-form-stem-first-20261122.test.mjs) already derive source answers and check A–F key uniqueness. This continuation **does not** misrepresent those older automated checks as a newly completed independent expert Grade7+ signoff. The new V315 regression separately checks the source-exact risk statuses and four redesigns.

## Source-driven QA coverage and disposition

| Original academic triage | Indices | Standard Form | Combined |
|---|---:|---:|---:|
| Upgrade challenge for true Grade 7+ reasoning | 28 | 20 | 48 |
| Confirm actual taught subskill first | 12 | 8 | 20 |
| Rewrite context or review duplicate/history | 0 | 12 | 12 |
| **Total** | **40** | **40** | **80** |

All 80 reviewed source questions contain six A–F choices, one stored key, and currently have **Daily eligibility false**. The separate original mathematical source-first tests use the stems, not only the stored key, and cover all 80 questions and 480 answer options; no independent teaching or grade standard is signed off.

The numeric-neutral similarity register reports **14 Indices** and **19 Standard Form** candidate text-template groups: **33 groups** for 80 question IDs. **35/40 Indices** and **28/40 Standard Form** have at least one sibling under that syntactic grouping, meaning **63/80** show stem-pattern reuse. This is a duplication *signal*, not a proof of identical pupil learning or an independent Mastery concept count.

Of the 400 incorrect answers, **74 incorrect-option explanations** are less than 30 characters long, across both topics. These are marked for *causal reproducibility and pedagogical clarity* review, but **a short statement is not automatically wrong**. None of these short descriptions was silently rewritten into the canonical student bank.

## Academic QA correction: twelve stale or inaccurate old risk flags

Some earlier reports used general source-family warnings as if they were defects of today's specifically revised questions. A new 12-item source-specific correction register records actual values and revisions.

| Exact source ID | Historical risk flag | What the current revised question actually establishes |
|---|---|---|
| STANDARD_FORM-001 | Unrealistic density | Bulk density **0.3 g/cm³**, not hundreds |
| STANDARD_FORM-002 | Unrealistic density | Combined bulk density **0.4 g/cm³** |
| STANDARD_FORM-003 | Unrealistic density | Retained sample bulk density **0.8 g/cm³** |
| STANDARD_FORM-004 | Unrealistic density | Asked for **5×10¹⁴ particles**, not a density |
| STANDARD_FORM-017 | Sample claimed **300 g/cm³** | Actual output **0.3 g/cm³**, a factor of 1000 different from the old warning |
| STANDARD_FORM-018 | Same inherited impossible density flag | Actual bulk density **0.32 g/cm³** |
| STANDARD_FORM-019 | Same inherited impossible density flag | Actual bulk density **0.375 g/cm³** |
| STANDARD_FORM-020 | Same inherited impossible density flag | Asked for **45 g to add**, not an implausible density |
| STANDARD_FORM-033–036 | Historical negative-mass distractor and four identical original answers | **Current revised** six options per question are non-negative and numerically distinct, and the four revised correct answers differ |

The correction **retracts the claim of current physically implausible density/negative options only**. For Q033–036 the historical original-bank allegation remains clearly labelled historical; it is not falsified for the earlier version, but it **must not be projected onto this revised bank** without rechecking. Repetition, question realism in the larger learning context, Grade7+ demand and exact teaching coverage are still **HOLD**. The older file stays unchanged as an audit record; the new source-exact register records the current correction and its calculation.

## Four further higher-reasoning candidates (versioned, standalone, credit denied)

The [V315 candidate pack](../qa-staging/math-v315-indices017-025-standard009-025-distinct-reasoning-candidates-20261123.json) stages four proposed alternatives, replacing **none** of the 200 original student questions.

| Source identity | New challenge, with independently testable answer | Correct key |
|---|---|:---:|
| INDICES-017 | Factor an exponential family, derive strict bounds on k², enforce divisible by 8 but not by 16, enumerate candidates k=24,40,56 and sum **120** | D |
| INDICES-025 | Simplify ratio to (2^{n-3}), intersect bound (2^4) to (2^9) with even exponent condition; n=7,9,11 gives sum **27** | E |
| STANDARD_FORM-009 | Packing **5.7×10⁵ g** into equal **1.2×10⁵ g** capacity containers while retaining at least 10% headroom: minimum **N=6**, unused **U=1.5×10⁵ g** | B |
| STANDARD_FORM-025 | Convert two chamber volumes and concentrations, remove 25%, change volume and calculate top-up needed to reach target: **4.5×10⁶ particles** | B |

Each draft has six distinct options, explanatory wrong choices and three worked steps. All four have `academicQA:pending`, `independentGCSEGrade7PlusCertified:false`, `teacherTaughtConfirmed:false`, `dailyEligible:false`, and `masteryEligible:false`. Proposed AO2/AO3 reasoning remains **provisional**; the label is not a certified GCSE Higher grade. The new [source-derived V315 Node regression](../tests/daily-v3-maths-v315-80-source-hold-and-four-distinct-reasoning-20261123.test.mjs) verifies the four numerical keys and 20 wrong-result derivations separately, plus **40/40** native offline MathML fragments after a detected unsupported ellipsis macro was repaired.

## Release and follow-up

- 200 original Maths questions remain in the QA-only reviewed bank unchanged and blocked from Daily, XP, MP, Mastery and Recovery credit.
- Current formal Maths Academic QA approval remains **0/200**, not 80/80 or four new approvals.
- Exact class-taught content not independently verified; TGS curriculum outline PDF retrieval is **SKIPPED per parent instruction**, not silently claimed verified.
- Remaining work: independently assess **educational realism** and student misconception frequency of the now numerically verified 74 error paths; Grade7+ benchmark/educational distinction across 33 syntax-template groups; independent taught-subskill confirmation; physical iPad PWA scoring/offline/persistence acceptance.
- **PR #306 remains Draft, no merge, no deployment.** A green technical CI run is technical evidence only.

The risk corrected here is **a false-positive academic QA finding**, which is as important to fix as an incorrect student answer. Never mark an item as educationally passed solely because a mistaken warning was withdrawn.

## Follow-up — all 74 short error-path descriptions now numerically reproduced

A new [74-row evidence register](../qa-staging/math-v315-indices-standard-74-source-recomputed-wrong-option-explanation-repairs-20261123.json) reopens the exact original source stems and recalculates the displayed wrong answers using the stated error operation. **74/74** generated values match their original A–F numerical choices: **34 Indices and 40 Standard Form, affecting 32 questions**. Every proposed wording now describes the faulty operation using the actual item numbers and contrasts the correct result; original answer keys are unchanged. All proposals remain educational **HOLD** because a numerically reproducible wrong calculation does not establish how often real pupils make it.

The [32-question full QA-only candidate pack](../qa-staging/math-v315-indices-standard-32-causal-rationale-repaired-candidates-20261123.json) materialises all 32 MCQs, keeping 192 original answer-option expressions, all source stems, correct keys and worked solutions unchanged, and replacing only the **74** short error-rationale fields. It has distinct revision IDs and all 32 candidates have `academicQA:pending`, `dailyEligible:false`, `masteryEligible:false`. The corresponding [V315 CI regression](../tests/daily-v3-maths-v315-80-source-hold-and-four-distinct-reasoning-20261123.test.mjs) compares the repair packs field-by-field to the exact canonical originals and verifies zero release permission.

No changes were applied to the canonical 200-question student bank. No independent Grade7+ approval was issued.
