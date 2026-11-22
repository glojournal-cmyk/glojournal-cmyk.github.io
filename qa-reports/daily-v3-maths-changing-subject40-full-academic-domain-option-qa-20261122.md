# Maths Academic QA — Changing the Subject: full original Q81–120 batch

**22 November 2026 · Draft PR #306 only · Source-backed first-pass academic/technical QA · Formal academic approval 0/40**

## What was checked in the original 40-question source

Reopened **all forty actual original** questions, original printed answer-key letter, stored A–F source text, and the previously independently transcribed rearranged formulas. The original PDF extraction keeps multiline, vertically stacked fractions but **does not preserve mathematical option coordinates**. The user-uploaded raw PDF was requested for direct spatial reconstruction but did not have an authorized raw-byte materialization path; therefore this batch does **not** claim to have visually verified each original correct option or any of the 200 original wrong-option calculations.

The source's original grade targets were provisional (**G7: 16, G8: 16, G8–9: 8**) and must not be interpreted as independently benchmarked AQA challenge levels. The original ten Template IDs contain exactly four originals each, but four variants are not four independent Mastery concepts.

| Independent mathematical audit | Result | Formal release meaning |
|---|---|---|
| Original source question IDs / printed answer key letters / six original option labels | **40/40 / 240 source option labels** | Source tracing PASS, not true original option typeset math PASS |
| Source equation symbolic inverse identities and four prior numerical probes per question | **40/40; 160 positive-domain probes** | Independently re-derived x expressions, not teacher Grade signoff |
| Extended positive and negative valid-domain numerical checks | Included in CI | Catch sign, root, reciprocal and excluded-domain errors |
| Independent restriction/uniqueness review | **40/40** | Identify forbidden x and unattainable y |
| Principal root branches | **12** | Reject extraneous solutions created by indiscriminate squaring |
| Finite y exclusion/asymptote questions | **32** | Dividing by zero or assigning unattainable y must not be permitted |
| Every original printed option's mathematical expression | **0/240 visually certified** | Source extraction is multilined for all 240 |
| Five original wrong-choice misconception paths per question | **0/200 independently certified** | Do not invent rationales based on incomplete typeset sources |
| Actual TGS Autumn class-taught scope | **0/40 signed** | Potential algebraic-fraction / summer mismatch |
| Independent AQA Grade 7+ calibration | **0/40 signed** | Source Grade targets unverified |

## Important conceptual QA discovery: 28 of 40 share a fractional-linear core

**Twenty-eight** apparently varied rearrangements across **seven original Template IDs** reduce to

`y=(A*x+B)/(C*x+D)`, with nonzero determinant `A*D-B*C`.

They are not literally identical worked questions: shifting, reciprocating, factoring and nesting can require different step orders and domain awareness. However, they are **mathematically members of the same fractional-linear inverse family**, so seven different source template names are insufficient proof of seven genuinely independent high-grade Mastery skills.

The remaining **twelve** use a principal square-root branch and must be judged separately. Specifically 4 affine square roots, 4 square roots of reciprocals, and 4 square roots of rational expressions.

**Crucial additional flaw when simplifying:** In **eight** of the 28 fractional-linear questions, algebraic reduction silently removes an original undefined input. Source **Q99–102** use `1/y=s+a/(b*x+c)`: x=−c/b is forbidden in the original even though the simplified fractional-linear expression would yield y=0 there. Source **Q113–116** use `y=s+a/(b+c/(x+d))`: x=−d is forbidden in the original nested denominator even though the simplified rational extension yields y=s there. The original holes **must be retained after cancellation**, or an otherwise plausible algebraic answer becomes wrong for those x/y values.

[Proof register for all 28 fractional-linear forms, four-variant source templates and eight lost holes](../qa-staging/math-v311-changing-subject40-shared-mobius-28-source-core-20261122.json)

## Domain-restriction and marking risks

- Original **Q85–88**: require the principal square-root branch, i.e. y≥−d and x≥−c/b; squaring without this constraint can yield an extraneous answer.
- Original **Q99–102**: prohibit finite y=0 and y=1/s in the original 1/y equation; a formula-only inverse can omit these.
- Original **Q105–108**: root of positive reciprocal requires y>s and x>−c/b; y=s is not an attainable finite output.
- Original **Q113–116**: original x=−d and x=−d−c/b are both forbidden; original y=s and y=s+a/b cannot be attained.
- Original **Q117–120**: principal root enforces y≥s; also exclude the unattainable asymptote y=s+√(a/c) and the original rational denominator's pole. The source says denominators nonzero, but an independent marking rubric should make the forbidden conditions explicit.

[All 40 exact structural domains and forward/inverse evidence](../qa-staging/math-v311-changing-subject40-inverse-domains-and-uniqueness-20261122.json)

## Original question-by-question academic disposition

All 40 still have `QUARANTINE_TAUGHT_SCOPE`: the broad Autumn `Changing the Subject` heading does **not** by itself certify that each student's actual class has already learned algebraic fractions, rationalised inverses, compound denominators and square-root fractions. Independent grade calibration and exact pupil/teacher-taught proof are required before any original source question can earn Daily/MP/Mastery.

| Printed Q | Original question ID | Provisional | Printed key | Core mathematical shape | Original excluded x / domain issue | QA |
|---:|---|---|:---:|---|---|---|
| 81 | `LUX-MATH-Y9-REARRANGING-001` | G7 | **C** | Fractional-linear | forbidden y values | HOLD |
| 82 | `LUX-MATH-Y9-REARRANGING-002` | G7 | **F** | Fractional-linear | forbidden y values | HOLD |
| 83 | `LUX-MATH-Y9-REARRANGING-003` | G7 | **D** | Fractional-linear | forbidden y values | HOLD |
| 84 | `LUX-MATH-Y9-REARRANGING-004` | G7 | **C** | Fractional-linear | forbidden y values | HOLD |
| 85 | `LUX-MATH-Y9-REARRANGING-005` | G7 | **E** | Square-root affine | principal root y ≥ -4 | HOLD |
| 86 | `LUX-MATH-Y9-REARRANGING-006` | G7 | **C** | Square-root affine | principal root y ≥ -5 | HOLD |
| 87 | `LUX-MATH-Y9-REARRANGING-007` | G7 | **F** | Square-root affine | principal root y ≥ -6 | HOLD |
| 88 | `LUX-MATH-Y9-REARRANGING-008` | G7 | **A** | Square-root affine | principal root y ≥ -7 | HOLD |
| 89 | `LUX-MATH-Y9-REARRANGING-009` | G7 | **E** | Fractional-linear | forbidden y values | HOLD |
| 90 | `LUX-MATH-Y9-REARRANGING-010` | G7 | **C** | Fractional-linear | forbidden y values | HOLD |
| 91 | `LUX-MATH-Y9-REARRANGING-011` | G7 | **A** | Fractional-linear | forbidden y values | HOLD |
| 92 | `LUX-MATH-Y9-REARRANGING-012` | G8 | **A** | Shifted reciprocal | forbidden y values | HOLD |
| 93 | `LUX-MATH-Y9-REARRANGING-013` | G8 | **E** | Shifted reciprocal | forbidden y values | HOLD |
| 94 | `LUX-MATH-Y9-REARRANGING-014` | G8 | **D** | Shifted reciprocal | forbidden y values | HOLD |
| 95 | `LUX-MATH-Y9-REARRANGING-015` | G8 | **A** | Shifted reciprocal | forbidden y values | HOLD |
| 96 | `LUX-MATH-Y9-REARRANGING-016` | G8 | **B** | Fractional-linear | forbidden y values | HOLD |
| 97 | `LUX-MATH-Y9-REARRANGING-017` | G8 | **B** | Fractional-linear | forbidden y values | HOLD |
| 98 | `LUX-MATH-Y9-REARRANGING-018` | G7 | **A** | Fractional-linear | forbidden y values | HOLD |
| 99 | `LUX-MATH-Y9-REARRANGING-019` | G7 | **D** | Reciprocal of y | forbidden y values; removable original hole | HOLD |
| 100 | `LUX-MATH-Y9-REARRANGING-020` | G7 | **B** | Reciprocal of y | forbidden y values; removable original hole | HOLD |
| 101 | `LUX-MATH-Y9-REARRANGING-021` | G7 | **D** | Reciprocal of y | forbidden y values; removable original hole | HOLD |
| 102 | `LUX-MATH-Y9-REARRANGING-022` | G7 | **E** | Reciprocal of y | forbidden y values; removable original hole | HOLD |
| 103 | `LUX-MATH-Y9-REARRANGING-023` | G8 | **D** | Fractional-linear | forbidden y values | HOLD |
| 104 | `LUX-MATH-Y9-REARRANGING-024` | G8 | **A** | Fractional-linear | forbidden y values | HOLD |
| 105 | `LUX-MATH-Y9-REARRANGING-025` | G8 | **B** | Square root of reciprocal | principal root y > 1 | HOLD |
| 106 | `LUX-MATH-Y9-REARRANGING-026` | G8 | **B** | Square root of reciprocal | principal root y > 2 | HOLD |
| 107 | `LUX-MATH-Y9-REARRANGING-027` | G8 | **F** | Square root of reciprocal | principal root y > 1 | HOLD |
| 108 | `LUX-MATH-Y9-REARRANGING-028` | G8 | **A** | Square root of reciprocal | principal root y > 2 | HOLD |
| 109 | `LUX-MATH-Y9-REARRANGING-029` | G8 | **F** | Factored fractional-linear | forbidden y values | HOLD |
| 110 | `LUX-MATH-Y9-REARRANGING-030` | G8 | **A** | Factored fractional-linear | forbidden y values | HOLD |
| 111 | `LUX-MATH-Y9-REARRANGING-031` | G8 | **E** | Factored fractional-linear | forbidden y values | HOLD |
| 112 | `LUX-MATH-Y9-REARRANGING-032` | G8 | **D** | Factored fractional-linear | forbidden y values | HOLD |
| 113 | `LUX-MATH-Y9-REARRANGING-033` | G8-9 | **A** | Nested denominator | forbidden y values; removable original hole | HOLD |
| 114 | `LUX-MATH-Y9-REARRANGING-034` | G8-9 | **B** | Nested denominator | forbidden y values; removable original hole | HOLD |
| 115 | `LUX-MATH-Y9-REARRANGING-035` | G8-9 | **B** | Nested denominator | forbidden y values; removable original hole | HOLD |
| 116 | `LUX-MATH-Y9-REARRANGING-036` | G8-9 | **F** | Nested denominator | forbidden y values; removable original hole | HOLD |
| 117 | `LUX-MATH-Y9-REARRANGING-037` | G8-9 | **A** | Square-root fraction | principal root y ≥ 1 | HOLD |
| 118 | `LUX-MATH-Y9-REARRANGING-038` | G8-9 | **F** | Square-root fraction | principal root y ≥ 2 | HOLD |
| 119 | `LUX-MATH-Y9-REARRANGING-039` | G8-9 | **F** | Square-root fraction | principal root y ≥ 1 | HOLD |
| 120 | `LUX-MATH-Y9-REARRANGING-040` | G8-9 | **E** | Square-root fraction | principal root y ≥ 2 | HOLD |

## Inspectable source evidence and CI

- [40 complete source-derived worked inverse models with domain notes](../qa-staging/math-v311-changing-subject40-full-worked-source-derivations-20261122.json)
- [40 source IDs, 240 original A–F raw option snippets, each unsafe without spatial PDF proof](../qa-staging/math-v311-changing-subject40-original-240-option-typeset-risk-20261122.json)
- [40-domain and 240-option regression](../tests/daily-v3-maths-changing-subject40-inverse-domains-240-options-20261122.test.mjs)
- [28 fractional-linear and eight removable-domain-hole regression](../tests/daily-v3-maths-changing-subject40-shared-mobius-core-20261122.test.mjs)

**Release decision: unchanged.** No original question is academically signed, no new canonical question bank import, no Daily/XP/MP/Mastery/Recovery credit, no PR merge, no main deployment. The next required review is original **rendered** PDF mathematical option fidelity, then five credible wrong-operation calculations per original source and external taught/Grade benchmarking. Cannot responsibly complete that by treating PDF text snippets as visually exact formulas.
