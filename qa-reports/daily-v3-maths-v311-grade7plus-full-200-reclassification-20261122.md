# Maths V3.1 — Grade 7–9 challenge recalibration and 200-question triage
**22 November 2026 | PR #306 Draft only | Academic QA approved 0/200 | DO NOT MERGE OR AWARD CREDIT**

## What was actually verified
- Reopened the original `Lux_Maths_V3_1_Formal_Academic_QA_Register_20261122.csv`: **200 unique original IDs**, 5 topics × 40, source option letter and actual source template on each row. Reopened the original printed student/answer PDFs and existing 50-family pedagogical screen. The programmatically produced [200-row source triage](../qa-staging/math-v311-200-item-grade-demand-triage-20261122.json) maps each exact source ID to one provisional action, while preserving its original G7/G8/G8–9 label separately.
- The screening evaluation was **at 50 source-family level**, using representative original problems, prior source-specific per-option investigations and documented duplicate/context issues. This is **NOT 200 separately solved new exams, 200 independent GCSE question-grade comparisons, or 1,000 independently certified distractors**.
- Official [Tiffin Girls' Year 9 Maths 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10161919/Year-9-Maths-2026-2027.pdf) p.1 lists Autumn **indices incl. negative powers, Standard Form, rearranging formulae, linear graphs, simultaneous equations**; pp.2–3 put perpendicular bisectors, reverse/compound percentages in Spring, and the algebraic-fractions unit in Summer. A whole-topic heading alone cannot confirm whether a teacher has already taught more advanced subskills.
- [AQA 8300 scheme of assessment](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment) explicitly includes **routine multi-step solutions under AO1**. AO2 = mathematical reasoning; AO3 = problem-solving/connections. There is no valid simple mapping from a source's G8 label or number of arithmetic steps to a certified question Grade 8.

## Formal four-way screening (not official grades)
| Proposed treatment | Number of original IDs | Review decision |
|---|---:|---|
| **UPGRADE_STEM_FOR_G7PLUS** | **79** | Existing format often routine AO1, or same technique recurs at allegedly higher grade; build a genuinely different multistage reasoning problem before grading |
| **REWRITE_CONTEXT_OR_DUPLICATE** | **17** | Implausible density, repeated source equation systems, scaled duplicate answers or similarly weak independent diagnostic content |
| **QUARANTINE_TAUGHT_SCOPE** | **80** | Spring/Summer scope or exact sophisticated radical/rational subskill is not shown as already taught in the classroom; neither challenge nor credit approved |
| **RETAIN_FOR_EXTERNAL_BENCHMARK** | **24** | May have authentic AO2/AO3 demand. **Retained for inspection ONLY**; not certified G7+ and not released |
| **Total** | **200** | **0/200 approved; 0/200 credit eligible** |

### By Year 9 source topic
| Topic | Upgrade | Rewrite | Scope quarantine | Retain for benchmark | Total |
|---|---:|---:|---:|---:|---:|
| Indices | 28 | 0 | 12 | 0 | 40 |
| Standard Form | 20 | 12 | 8 | 0 | 40 |
| Changing the Subject | 0 | 0 | 40 | 0 | 40 |
| Straight-line Graphs | 4 | 0 | 20 | 16 | 40 |
| Simultaneous Equations | 27 | 5 | 0 | 8 | 40 |

**Supply implication:** the 24 "retain" candidates all belong to **Graphs (16) or Simultaneous Equations (8)**. Indices, Standard Form and Changing the Subject have *no* as-is source family classified as ready for independent G7+ benchmark without a major review first. This makes it impossible to safely fulfil a five-topic, 10 MCQ daily selection from only original reviewed candidate IDs. There are also zero formally teacher-approved candidates across all five topics. **Do not invent filler**.

## Highest-priority per-question academic decisions

1. **SIMULTANEOUS-013..016 (Q173–176)**: original no-solution test is essentially one-step proportionality + constant check, so provisional G7 demand unproven. Source-specific `SIMULTANEOUS-013` now has a versioned harder candidate with coefficient depending on `k` in both terms and distinct-parallel proof; this candidate is staged under a separate ID/version, not imported. Keep the whole family `UPGRADE_STEM_FOR_G7PLUS`.
2. **SIMULTANEOUS-021..024 and -029..032 (Q181–184/Q189–192)**: solve 2×2 equations then substitute into a fixed expression, often routine AO1. Q183's new five mathematically reproducible distractors do **not** cure an easy stem. Q189 repeats the *exact source pair of linear equations* from Q161 and Q169; override as `REWRITE_CONTEXT_OR_DUPLICATE` despite its source template's generic grade flag.
3. **STANDARD_FORM-033..036 (Q73–76)**: all original four answers are 1.116×10⁵ g, because source inputs and packet counts are scaled together. The four fully rewritten math candidates are staged only. Candidate Q75 uses *reverse percentage* and Q76 *successive percentage loss*, which the official school outline places under Spring; hold them until actually taught.
4. **STANDARD_FORM-001..004 and -017..020 (Q41–44, Q57–60)**: original density outputs of hundreds of g/cm³ are misleading for ordinary school bulk materials, while Q57/Q59 and Q58/Q60 repeat outputs and core working. Revised plausible-context alternatives remain QA-only; changing numeric data requires rechecking each option and grade demand.
5. **GRAPHS-005..008, -017..020, -037..040 (12 items)**: perpendicular bisectors are explicitly Spring. Quarantine all twelve from Autumn regardless of how difficult the algebra might look.
6. **REARRANGING rational/surd families (40 items)**: Autumn lists rearranging formulae broadly, but some source questions explicitly rely on rational algebra, reciprocals, nested surds and exclusions; a separate Summer algebraic-fractions unit exists. These are *exact taught-subskill checks*, not a finding that all 40 were definitely unlearned. Hold until teacher/school notes show the exact technique was covered.
7. **INDICES-029..040 (12 items)**: radical and fractional-power use needs exact prior teaching proof. INDICES-037's challenging-looking radical reduces to the same `2n+5` simplification as earlier source family; the extra `n²−n` stage does not justify source G8–9 label alone.
8. **GRAPHS-009..016, -025..028, -033..036**: intersection/parallel/perpendicular techniques require multiple transformations, so potentially worth independent benchmarking; but the higher-labelled families overlap with G7 counterparts. Never award two separate concept credits for parameter-only variations.
9. **SIMULTANEOUS-037..040**: both coefficients in one equation depend on a parameter; checking *parallel but not coincident* may be meaningful AO2 reasoning. Still no independent Grade8–9 benchmark or teacher sign-off.

## Fifty source-family decisions (all four source variants inherit a first-pass family decision; documented ID exceptions override)
| Source template | Original provisional band | Triage | Source-based reason |
|---|---|---|---|
| `V2-INDICES-1` | G7 | UPGRADE_STEM_FOR_G7PLUS | Negative-power conversions and a linear exponent equation; G7 is provisional, not benchmarked. |
| `V2-INDICES-2` | G7 | UPGRADE_STEM_FOR_G7PLUS | Huge wrong numeric choice (e.g. 65536 for a 16 answer in -005) may be implausible without a real mistake path; review each variant. |
| `V2-INDICES-3` | G7 | UPGRADE_STEM_FOR_G7PLUS | Two-variable negative powers and substitution; ensure the four variants differ in reasoning, not only numbers. |
| `V2-INDICES-4` | G7 | UPGRADE_STEM_FOR_G7PLUS | Match independent exponents in an identity; very similar reasoning to G8 family V3-IND-G8-TWO-BASE-IDENTITY. |
| `V3-IND-G8-FACTOR-EXP` | G8 | UPGRADE_STEM_FOR_G7PLUS | Factor a common power to solve n; G8 cannot be inferred from using an index equation alone. |
| `V3-IND-G8-TWO-BASE-IDENTITY` | G8 | UPGRADE_STEM_FOR_G7PLUS | Same independent-exponent comparison as G7 V2-INDICES-4; demand-level distinction requires evidence. |
| `V3-IND-G8-QUOTIENT-PARAMETER` | G8 | UPGRADE_STEM_FOR_G7PLUS | Convert bases and evaluate a follow-up polynomial; grade depends on genuinely non-routine reasoning. |
| `V3-IND-G8-SQRT-QUOTIENT` | G8 | QUARANTINE_TAUGHT_SCOPE | Roots treated as fractional powers; verify exactly taught beyond Autumn outline's generic all laws. |
| `V3-IND-G89-FRACTIONAL-IDENTITY` | G8-9 | QUARANTINE_TAUGHT_SCOPE | Fractional-power two-variable identities; four IDs -033 to -036 need explicit teacher confirmation. |
| `V3-IND-G89-EXPONENT-THEN-EXPRESSION` | G8-9 | QUARANTINE_TAUGHT_SCOPE | Very similar exponent reduction to G8 SQRT-QUOTIENT plus an easy final substitution; G8-9 not established. |
| `V2-STANDARD-FORM-1` | G7 | REWRITE_CONTEXT_OR_DUPLICATE | Density contexts can yield hundreds of g/cm³; use physically meaningful quantities or declare hypothetical. |
| `V2-STANDARD-FORM-2` | G7 | UPGRADE_STEM_FOR_G7PLUS | Add two journeys and divide by time; G7 demand needs benchmark against true Higher questions. |
| `V2-STANDARD-FORM-3` | G7 | UPGRADE_STEM_FOR_G7PLUS | Subtract a waste amount then divide among containers, standard arithmetic; G7 not automatically justified. |
| `V2-STANDARD-FORM-4` | G7 | UPGRADE_STEM_FOR_G7PLUS | Standard-form subtraction then division; difficulty calibration must look beyond operation count. |
| `V3-SF-G8-FILTER-DENSITY` | G8 | REWRITE_CONTEXT_OR_DUPLICATE | Sample -017 gives 300 g/cm³ after 25% filtering; pedagogically distracting physical quantity, despite correct arithmetic. |
| `V3-SF-G8-RELATIVE-PERCENTAGE` | G8 | QUARANTINE_TAUGHT_SCOPE | Percentage adjustment then relative increase; G8 may be inflated without added problem-solving demand. |
| `V3-SF-G8-UNITS-AND-PARTICLE-COUNT` | G8 | UPGRADE_STEM_FOR_G7PLUS | Given m³-to-cm³ conversion followed by multiplication; verify G8 challenge is genuine. |
| `V3-SF-G8-COMBINE-THREE-TERMS` | G8 | UPGRADE_STEM_FOR_G7PLUS | Combine three powers and divide; normal multistep arithmetic may not warrant G8. |
| `V3-SF-G89-TRANSFER-LOSS-QUANTITY` | G8-9 | REWRITE_CONTEXT_OR_DUPLICATE | Physical mass context with a negative answer option in sample -033; check impossible negative distractors and G8-9 demand. |
| `V3-SF-G89-INVERSE-BALANCE` | G8-9 | QUARANTINE_TAUGHT_SCOPE | Reverse a percentage loss and solve batch count; substantive multistep task, still lacks external G8-9 calibration. |
| `V2-SUBJECT-1` | G7 | QUARANTINE_TAUGHT_SCOPE | Cross-multiply a rational formula; Autumn 'rearranging formulae' broad, algebraic fractions receive a separate Summer unit. |
| `V2-SUBJECT-2` | G7 | QUARANTINE_TAUGHT_SCOPE | Root isolation and squaring; check branch restrictions and expression-defined conditions for each variant. |
| `V2-SUBJECT-3` | G7 | QUARANTINE_TAUGHT_SCOPE | Shift a rational function then solve x; same strategy as G8 shifted-rational family. |
| `V3-REAR-G8-SHIFT-RECIPROCAL` | G8 | QUARANTINE_TAUGHT_SCOPE | One reciprocal after additive shift; compare with G7 V2-SUBJECT-4 to establish real extra demand. |
| `V3-REAR-G8-SHIFTED-RATIONAL` | G8 | QUARANTINE_TAUGHT_SCOPE | Near-identical strategy to G7 V2-SUBJECT-3; editorial V3.1.1 repairs -016 and -023 must be used, and excluded-value wording reviewed. |
| `V2-SUBJECT-4` | G7 | QUARANTINE_TAUGHT_SCOPE | Reciprocal rearrangement with 1/y; near G8 reciprocal-shift family and depends on domain restrictions. |
| `V3-REAR-G8-RECIPROCAL-SURD` | G8 | QUARANTINE_TAUGHT_SCOPE | Nested root and reciprocal with y>1; specialist grade and domain audit plus teacher evidence. |
| `V3-REAR-G8-FACTOR-FRACTION` | G8 | QUARANTINE_TAUGHT_SCOPE | Rational cross-multiplication structurally resembles G7 V2-SUBJECT-1. |
| `V3-REAR-G89-NESTED-DENOMINATOR` | G8-9 | QUARANTINE_TAUGHT_SCOPE | Nested denominators and inverse operation layers; exact domain and taught content check. |
| `V3-REAR-G89-SURD-FRACTION` | G8-9 | QUARANTINE_TAUGHT_SCOPE | Square root of rational expression; enforce branch and denominator restrictions, full worked-solution editorial QA. |
| `V2-GRAPHS-1` | G7 | QUARANTINE_TAUGHT_SCOPE | Perpendicular-gradient inference beyond simple graph-from-two-points outline; verify taught. |
| `V2-GRAPHS-2` | G7 | QUARANTINE_TAUGHT_SCOPE | Perpendicular bisector midpoint/gradient; 4 IDs -005..008 sit in Spring construction/loci. |
| `V2-GRAPHS-3` | G7 | RETAIN_FOR_EXTERNAL_BENCHMARK | Line intersection then parallel line intercept; near-identical strategy to G8 intersection-parallel family. |
| `V2-GRAPHS-4` | G7 | RETAIN_FOR_EXTERNAL_BENCHMARK | Find line intersection then perpendicular x-intercept; same strategy as G8-9 INTERSECTION-PERP-AXIS. |
| `V3-GRAPH-G8-BISECTOR-LINE-INTERSECTION` | G8 | QUARANTINE_TAUGHT_SCOPE | Perpendicular bisector then intersection; 4 IDs -017..020 are Spring content unless taught early. |
| `V3-GRAPH-G8-INTERCEPT-MIDPOINT-NORMAL` | G8 | QUARANTINE_TAUGHT_SCOPE | Intercepts, midpoint, normal line; verify midpoint/perpendicular skills and genuinely higher reasoning. |
| `V3-GRAPH-G8-INTERSECT-PARALLEL-INTERCEPT` | G8 | RETAIN_FOR_EXTERNAL_BENCHMARK | Line intersection and parallel intercept; compare G7 V2-GRAPHS-3 before rating G8. |
| `V3-GRAPH-G8-PARAMETER-PERPENDICULAR` | G8 | UPGRADE_STEM_FOR_G7PLUS | Single perpendicular gradient equality and linear solve; G8 target appears at risk of overlabelling. |
| `V3-GRAPH-G89-INTERSECTION-PERP-AXIS` | G8-9 | RETAIN_FOR_EXTERNAL_BENCHMARK | Same intersection/perpendicular-axis method as G7 V2-GRAPHS-4; G8-9 target requires evidence. |
| `V3-GRAPH-G89-BISECTOR-INTERSECTION-SUM` | G8-9 | QUARANTINE_TAUGHT_SCOPE | Perpendicular bisector with second line intersection; 4 IDs -037..040 are Spring content. |
| `V3-SIM-G7-SOLVE-DERIVED` | G7 | UPGRADE_STEM_FOR_G7PLUS | Solve 2×2 linear system and calculate x²+y; near G8 SOLVE-THEN-NONLINEAR. |
| `V3-SIM-G7-NEW-TICKET-COMBINATION` | G7 | RETAIN_FOR_EXTERNAL_BENCHMARK | Solve two ticket prices then price new mix; same model as G8 TICKET-NEW-COMBO, different numbers. |
| `V2-SIMULTANEOUS-3` | G7 | REWRITE_CONTEXT_OR_DUPLICATE | Solve 2×2 linear equations and evaluate xy; same concept as G7/G8 derived-value families. |
| `V2-SIMULTANEOUS-4` | G7 | UPGRADE_STEM_FOR_G7PLUS | No-solution case from parallel coefficient ratios; assess whether one coefficient recognition is really G7. |
| `V3-SIM-G8-TICKET-NEW-COMBO` | G8 | UPGRADE_STEM_FOR_G7PLUS | Identical ticket-equation structure to G7 ticket family; grade inflation unless deeper modelling shown. |
| `V3-SIM-G8-SOLVE-THEN-NONLINEAR` | G8 | UPGRADE_STEM_FOR_G7PLUS | Solve a system then calculate 2x²−y; structurally same as G7 system + x²+y. |
| `V3-SIM-G8-MASS-DIFFERENCE` | G8 | UPGRADE_STEM_FOR_G7PLUS | Two mass equations then subtract; not clearly harder than G7 two-ticket system. |
| `V3-SIM-G8-DERIVED-COMBINATION` | G8 | UPGRADE_STEM_FOR_G7PLUS | Solve equations then evaluate 4x+5y; similar or simpler than G7 derived-value family. |
| `V3-SIM-G89-UNKNOWN-COEFFICIENT` | G8-9 | UPGRADE_STEM_FOR_G7PLUS | Given x=2y+1, solve one equation then substitute for k; G8-9 seems unsubstantiated. |
| `V3-SIM-G89-COEFFICIENTS-BOTH-DEPEND-ON-K` | G8-9 | RETAIN_FOR_EXTERNAL_BENCHMARK | Both line coefficients depend on k; no-solution requires parallel-but-distinct check. Potential higher-demand but unsignable without benchmark. |

## Actual software safeguard implemented in Draft branch

A new immutable [original grade-demand gate](../assets/math-study/math-v311-grade-demand-gate.js) is compiled from the exact 200-row triage. It recognises original `LUX-MATH-Y9-` source IDs and operates as follows:

- **176 original IDs** in Upgrade/Rewrite/Quarantine are rejected regardless of a question's self-reported `academicQA='approved'` or fake grade labels. These original IDs must be versioned/reissued after independent redesign.
- **24 review-potential IDs** remain rejected **until** an independent `VERIFIED_G7_PLUS` decision, Grade-demand benchmark, reviewer and calibrated flag are provided *in addition* to the other existing source/teaching/distractor/renderer QA requirements. These 24 are **not currently signed**.
- The gate is applied at original-bank **intake**, Daily **selector**, **planner question validation**, and **formal submission verifier**. `mathsEvidence` now explicitly fails closed for **all original V3.1 ID prefixes** in restored/previously pinned daily assignments: there is no bank-hash-bound, reviewed grade proof in historic task receipts. A future actual release requires a new source-version-aware grade-evidence snapshot, not a blind toggle.
- [Grade-demand regression test](../tests/daily-v3-maths-grade-demand-200-triage-20261122.test.mjs) verifies all **200 source IDs** and actions, 176 cannot be forged as approved, 24 require independent evidence, real selector/formal assignment refusal, and no Daily completion from a restored 10/10 "perfect" but unsigned source assignment.
- Synthetic original Daily V3 contract tests remain in CI, separate from real source academic permissions; no synthetic teacher proof is mistaken for actual teacher sign-off.

## Next production-safe repair sequence

1. Reconstruct **new truly Grade 7+ AO2/AO3 source stems** in the already-taught Autumn topics, starting with Simultaneous Q173–176, standard form easy fraction/percentage families and index laws, using age-appropriate genuine reasoning rather than extra mechanical arithmetic. Exactly 6 answer options with **five independent wrong working pathways**, no near-neighbour filler.
2. Independently compare a representative revised item from each family with genuine AQA Higher exam-style marked examples; document reasoning demand, accessibility and why an alternative is *wrong*, instead of asserting an exam board assigned a specific grade.
3. Confirm exact class-taught subskills with TGS lesson book, teacher email or school learning resources; explicitly quarantine Spring/Summer topics until evidence of early teaching.
4. Bind newly approved questions to **new canonical IDs and independently computed raw bank digest**; rerun Daily original-versus-revised anti-duplicate, first-attempt immutable grading, Maths 9/10 threshold, failed IndexedDB/QuotaExceeded recovery, XP/MP/Mastery and physical iPad PWA reload QA before any merger.

**Formal verdict:** No QA category is an academic approval. **0/200 Maths formally approved**, PR Draft; main, live app and learner records unchanged.
