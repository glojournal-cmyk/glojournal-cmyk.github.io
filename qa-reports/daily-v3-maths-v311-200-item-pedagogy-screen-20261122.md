# Maths V3.1 / V3.1.1 — qualitative Academic QA continuation (22 Nov 2026)

**Important classification:** `PEDAGOGICAL SCREENING / NOT APPROVED FOR CREDIT`. This is a **new 50-template/200-item risk and scope review**, not a repeat of the previously completed 200/200 symbolic answer verification. It does **not** supply exam-board grades for individual MCQs, five option-specific misconception rationales, teacher-taught confirmation, or physical iPad signoff.

## Source control & method
- Exact archived student question paper: `Lux_Maths_Y9_V3_All_200_Student.pdf` (74 pages); worked-answer PDF `Lux_Maths_Y9_V3_All_200_Answers.pdf` (39 pages); formal indexed `Lux_Maths_V3_1_Formal_Academic_QA_Register_20261122.csv`.
- Read and parsed **200/200 Q-numbered student stems/options** and **200/200 Q-numbered worked-solution entries**, reconciling exactly with the **200 unique question IDs** in the formal register. The indexed PDF extraction can reorder superscripts/fraction layout; do not use its flattened text as a replacement for the original JSON or as visual iPad evidence.
- **50 template IDs × exactly four variants = 200 items**. One representative prompt/answer per family was examined for learning demand and known misinterpretation risks; individual per-option distractor mechanisms and proofread every formula *are not yet completed*. High-risk examples from the full ten-question original JSON reviewer sample were considered separately.
- Mathematical stem answers and unique keyed choices remain recorded **PASS 200/200 in the existing independent solver audit**. They were not rerun in this work. The maths result must not be confused with academic release clearance.
- School source: [Tiffin Girls Mathematics Year9 Curriculum Outline 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10161919/Year-9-Maths-2026-2027.pdf), p.1 Autumn and pp.2–3 Spring/Summer. Autumn lists index laws incl. negative powers, standard form, rearranging formulae, linear graphs and simultaneous equations. Spring explicitly covers perpendicular bisectors under Construction/Loci; **Summer** explicitly lists working with **Algebraic Fractions**. Broad Autumn rearranging does NOT certify every algebraic-fraction/surd variant already taught.
- Exam board: [AQA GCSE Mathematics 8300, specification at a glance](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/specification-at-a-glance), Higher covers **grades 4–9**; a question's *target* grade is not an independently calibrated exam grade.

## QA decision & counts
| Gate | Evidence | Status |
|---|---|---|
| 200 mathematical stems, unique six choices | Prior independent two-part mathematical checks | PASS 200/200, **not repeated** |
| PDF question/answer/ID/source-register reconciliation | All 200 Q labels and 200 ID records | **PASS 200/200 structural coverage** |
| Representative pedagogical demand screening | 50 distinct families, 4 variants each | **REVIEWED FOR RISK**, not grade-certified |
| Confirmed exact skill taught by TGS teacher | No class-level source evidence | **0/200 approved** |
| Individually benchmarked Grade 7–9 demand | Missing external question-level benchmark | **0/200 certified** |
| Five plausible, distinct, source-specific misconceptions per question | Missing option-by-option rationale (1,000 rationales) | **0/200 certified** |
| Complete worked explanation, renderer, PWA/persistence | Not all fully reviewed/tested | **BLOCKED** |
| Maths Daily XP/MP eligibility | Gate intentionally fail-closed | **0/200** |

Screening risk categories count **questions** (not newly discovered mathematical answer errors): GRADE_REVIEW=32; DISTRACTOR_RED_FLAG=8; CROSS_BAND_CONFLICT=68; OVERBAND_RISK=36; TEACHING_CHECK=16; CURRICULUM_GAP=28; UNREALISTIC_CONTEXT=8; DOMAIN_REVIEW=4.
Scope categories (overlap avoided by this primary family label): AUTUMN_BROAD=148; FRACTIONAL_INDEX_TAUGHT_UNVERIFIED=4; RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED=24; ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED=12; SPRING_BISECTOR_EXCLUDE=12. These labels are QA triage only, not a validated record of what has been taught.

## Highest-priority actual issues
1. **12 verified Spring bisector items** remain quarantined: `GRAPHS-005..008`, `GRAPHS-017..020`, `GRAPHS-037..040`; do not use in Autumn without evidence of advance teaching.
2. **4 fractional index** identities (`INDICES-033..036`) and **12 advanced changing-subject** items (`REARRANGING-025..028`, `-033..040`) require specific teacher-taught evidence, even though Autumn includes index laws and rearranging formulae generally.
3. **Cross-grade demand inconsistencies** (same technique under G7, G8 or G8–9): `SIMULTANEOUS-005..008` ↔ `SIMULTANEOUS-017..020` (ticket model); `SIMULTANEOUS-001..004` ↔ `SIMULTANEOUS-021..024` (solve system + expression); `GRAPHS-009..012` ↔ `GRAPHS-025..028` (intersection + parallel line); `GRAPHS-013..016` ↔ `GRAPHS-033..036` (intersection + perpendicular x-intercept); `REARRANGING-009..011,018` ↔ `REARRANGING-016..017,023..024` (shifted rational). Different variable values alone do not justify a higher GCSE difficulty label. Check cross-family concept suppression in daily rotation, not just matching `templateId`.
4. **Concrete option/context concerns** requiring individual checks: `INDICES-005` includes 65536 as an alternative to 16, with unclear error pathway; `STANDARD_FORM-017` gives **300 g/cm³** in a material-density story (physically implausible); sample standard-form transfer task `STANDARD_FORM-033` includes a **negative mass** option. These are pedagogical objections, *not incorrect arithmetic*. The density issue may recur in `STANDARD_FORM-001..004`; check each variant rather than infer.
5. **Domain/editorial checks**: `REARRANGING-016` and `-023` had redundant `1z` in original worked steps, already edited only in the staged V3.1.1 candidate; for rearranging fractions/roots validate excluded values, invertibility and branch restrictions in the worked explanation.
6. **Daily Tasks anti-repetition weakness**: 50 distinct template labels can overstate *genuine* conceptual diversity (examples above); review equivalent-concept groups before granting new mastery / daily credit. The separate 20-day zero-adjacent-template result is not yet a zero-adjacent-*concept* result.

## Family-by-family qualitative findings (50 concepts; four questions each)
| Template | Items | Last source ID | Broad scope | Screening finding | Specific teaching/grade/distractor observation |
|---|---:|---|---|---|---|
| `V2-INDICES-1` | 4 | `LUX-MATH-Y9-INDICES-004` | AUTUMN_BROAD | **GRADE_REVIEW** | Negative-power conversions and a linear exponent equation; G7 is provisional, not benchmarked. |
| `V2-INDICES-2` | 4 | `LUX-MATH-Y9-INDICES-008` | AUTUMN_BROAD | **DISTRACTOR_RED_FLAG** | Huge wrong numeric choice (e.g. 65536 for a 16 answer in -005) may be implausible without a real mistake path; review each variant. |
| `V2-INDICES-3` | 4 | `LUX-MATH-Y9-INDICES-012` | AUTUMN_BROAD | **GRADE_REVIEW** | Two-variable negative powers and substitution; ensure the four variants differ in reasoning, not only numbers. |
| `V2-INDICES-4` | 4 | `LUX-MATH-Y9-INDICES-016` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Match independent exponents in an identity; very similar reasoning to G8 family V3-IND-G8-TWO-BASE-IDENTITY. |
| `V3-IND-G8-FACTOR-EXP` | 4 | `LUX-MATH-Y9-INDICES-020` | AUTUMN_BROAD | **OVERBAND_RISK** | Factor a common power to solve n; G8 cannot be inferred from using an index equation alone. |
| `V3-IND-G8-TWO-BASE-IDENTITY` | 4 | `LUX-MATH-Y9-INDICES-024` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Same independent-exponent comparison as G7 V2-INDICES-4; demand-level distinction requires evidence. |
| `V3-IND-G8-QUOTIENT-PARAMETER` | 4 | `LUX-MATH-Y9-INDICES-028` | AUTUMN_BROAD | **GRADE_REVIEW** | Convert bases and evaluate a follow-up polynomial; grade depends on genuinely non-routine reasoning. |
| `V3-IND-G8-SQRT-QUOTIENT` | 4 | `LUX-MATH-Y9-INDICES-032` | AUTUMN_BROAD | **TEACHING_CHECK** | Roots treated as fractional powers; verify exactly taught beyond Autumn outline's generic all laws. |
| `V3-IND-G89-FRACTIONAL-IDENTITY` | 4 | `LUX-MATH-Y9-INDICES-036` | FRACTIONAL_INDEX_TAUGHT_UNVERIFIED | **CURRICULUM_GAP** | Fractional-power two-variable identities; four IDs -033 to -036 need explicit teacher confirmation. |
| `V3-IND-G89-EXPONENT-THEN-EXPRESSION` | 4 | `LUX-MATH-Y9-INDICES-040` | AUTUMN_BROAD | **OVERBAND_RISK** | Very similar exponent reduction to G8 SQRT-QUOTIENT plus an easy final substitution; G8-9 not established. |
| `V2-STANDARD-FORM-1` | 4 | `LUX-MATH-Y9-STANDARD_FORM-004` | AUTUMN_BROAD | **UNREALISTIC_CONTEXT** | Density contexts can yield hundreds of g/cm³; use physically meaningful quantities or declare hypothetical. |
| `V2-STANDARD-FORM-2` | 4 | `LUX-MATH-Y9-STANDARD_FORM-008` | AUTUMN_BROAD | **GRADE_REVIEW** | Add two journeys and divide by time; G7 demand needs benchmark against true Higher questions. |
| `V2-STANDARD-FORM-3` | 4 | `LUX-MATH-Y9-STANDARD_FORM-012` | AUTUMN_BROAD | **OVERBAND_RISK** | Subtract a waste amount then divide among containers, standard arithmetic; G7 not automatically justified. |
| `V2-STANDARD-FORM-4` | 4 | `LUX-MATH-Y9-STANDARD_FORM-016` | AUTUMN_BROAD | **GRADE_REVIEW** | Standard-form subtraction then division; difficulty calibration must look beyond operation count. |
| `V3-SF-G8-FILTER-DENSITY` | 4 | `LUX-MATH-Y9-STANDARD_FORM-020` | AUTUMN_BROAD | **UNREALISTIC_CONTEXT** | Sample -017 gives 300 g/cm³ after 25% filtering; pedagogically distracting physical quantity, despite correct arithmetic. |
| `V3-SF-G8-RELATIVE-PERCENTAGE` | 4 | `LUX-MATH-Y9-STANDARD_FORM-024` | AUTUMN_BROAD | **OVERBAND_RISK** | Percentage adjustment then relative increase; G8 may be inflated without added problem-solving demand. |
| `V3-SF-G8-UNITS-AND-PARTICLE-COUNT` | 4 | `LUX-MATH-Y9-STANDARD_FORM-028` | AUTUMN_BROAD | **OVERBAND_RISK** | Given m³-to-cm³ conversion followed by multiplication; verify G8 challenge is genuine. |
| `V3-SF-G8-COMBINE-THREE-TERMS` | 4 | `LUX-MATH-Y9-STANDARD_FORM-032` | AUTUMN_BROAD | **OVERBAND_RISK** | Combine three powers and divide; normal multistep arithmetic may not warrant G8. |
| `V3-SF-G89-TRANSFER-LOSS-QUANTITY` | 4 | `LUX-MATH-Y9-STANDARD_FORM-036` | AUTUMN_BROAD | **DISTRACTOR_RED_FLAG** | Physical mass context with a negative answer option in sample -033; check impossible negative distractors and G8-9 demand. |
| `V3-SF-G89-INVERSE-BALANCE` | 4 | `LUX-MATH-Y9-STANDARD_FORM-040` | AUTUMN_BROAD | **GRADE_REVIEW** | Reverse a percentage loss and solve batch count; substantive multistep task, still lacks external G8-9 calibration. |
| `V2-SUBJECT-1` | 4 | `LUX-MATH-Y9-REARRANGING-004` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | **TEACHING_CHECK** | Cross-multiply a rational formula; Autumn 'rearranging formulae' broad, algebraic fractions receive a separate Summer unit. |
| `V2-SUBJECT-2` | 4 | `LUX-MATH-Y9-REARRANGING-008` | AUTUMN_BROAD | **DOMAIN_REVIEW** | Root isolation and squaring; check branch restrictions and expression-defined conditions for each variant. |
| `V2-SUBJECT-3` | 4 | `LUX-MATH-Y9-REARRANGING-018` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | **CROSS_BAND_CONFLICT** | Shift a rational function then solve x; same strategy as G8 shifted-rational family. |
| `V3-REAR-G8-SHIFT-RECIPROCAL` | 4 | `LUX-MATH-Y9-REARRANGING-015` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | **CROSS_BAND_CONFLICT** | One reciprocal after additive shift; compare with G7 V2-SUBJECT-4 to establish real extra demand. |
| `V3-REAR-G8-SHIFTED-RATIONAL` | 4 | `LUX-MATH-Y9-REARRANGING-024` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | **CROSS_BAND_CONFLICT** | Near-identical strategy to G7 V2-SUBJECT-3; editorial V3.1.1 repairs -016 and -023 must be used, and excluded-value wording reviewed. |
| `V2-SUBJECT-4` | 4 | `LUX-MATH-Y9-REARRANGING-022` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | **CROSS_BAND_CONFLICT** | Reciprocal rearrangement with 1/y; near G8 reciprocal-shift family and depends on domain restrictions. |
| `V3-REAR-G8-RECIPROCAL-SURD` | 4 | `LUX-MATH-Y9-REARRANGING-028` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **CURRICULUM_GAP** | Nested root and reciprocal with y>1; specialist grade and domain audit plus teacher evidence. |
| `V3-REAR-G8-FACTOR-FRACTION` | 4 | `LUX-MATH-Y9-REARRANGING-032` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | **CROSS_BAND_CONFLICT** | Rational cross-multiplication structurally resembles G7 V2-SUBJECT-1. |
| `V3-REAR-G89-NESTED-DENOMINATOR` | 4 | `LUX-MATH-Y9-REARRANGING-036` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **CURRICULUM_GAP** | Nested denominators and inverse operation layers; exact domain and taught content check. |
| `V3-REAR-G89-SURD-FRACTION` | 4 | `LUX-MATH-Y9-REARRANGING-040` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **CURRICULUM_GAP** | Square root of rational expression; enforce branch and denominator restrictions, full worked-solution editorial QA. |
| `V2-GRAPHS-1` | 4 | `LUX-MATH-Y9-GRAPHS-004` | AUTUMN_BROAD | **TEACHING_CHECK** | Perpendicular-gradient inference beyond simple graph-from-two-points outline; verify taught. |
| `V2-GRAPHS-2` | 4 | `LUX-MATH-Y9-GRAPHS-008` | SPRING_BISECTOR_EXCLUDE | **CURRICULUM_GAP** | Perpendicular bisector midpoint/gradient; 4 IDs -005..008 sit in Spring construction/loci. |
| `V2-GRAPHS-3` | 4 | `LUX-MATH-Y9-GRAPHS-012` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Line intersection then parallel line intercept; near-identical strategy to G8 intersection-parallel family. |
| `V2-GRAPHS-4` | 4 | `LUX-MATH-Y9-GRAPHS-016` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Find line intersection then perpendicular x-intercept; same strategy as G8-9 INTERSECTION-PERP-AXIS. |
| `V3-GRAPH-G8-BISECTOR-LINE-INTERSECTION` | 4 | `LUX-MATH-Y9-GRAPHS-020` | SPRING_BISECTOR_EXCLUDE | **CURRICULUM_GAP** | Perpendicular bisector then intersection; 4 IDs -017..020 are Spring content unless taught early. |
| `V3-GRAPH-G8-INTERCEPT-MIDPOINT-NORMAL` | 4 | `LUX-MATH-Y9-GRAPHS-024` | AUTUMN_BROAD | **TEACHING_CHECK** | Intercepts, midpoint, normal line; verify midpoint/perpendicular skills and genuinely higher reasoning. |
| `V3-GRAPH-G8-INTERSECT-PARALLEL-INTERCEPT` | 4 | `LUX-MATH-Y9-GRAPHS-028` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Line intersection and parallel intercept; compare G7 V2-GRAPHS-3 before rating G8. |
| `V3-GRAPH-G8-PARAMETER-PERPENDICULAR` | 4 | `LUX-MATH-Y9-GRAPHS-032` | AUTUMN_BROAD | **OVERBAND_RISK** | Single perpendicular gradient equality and linear solve; G8 target appears at risk of overlabelling. |
| `V3-GRAPH-G89-INTERSECTION-PERP-AXIS` | 4 | `LUX-MATH-Y9-GRAPHS-036` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Same intersection/perpendicular-axis method as G7 V2-GRAPHS-4; G8-9 target requires evidence. |
| `V3-GRAPH-G89-BISECTOR-INTERSECTION-SUM` | 4 | `LUX-MATH-Y9-GRAPHS-040` | SPRING_BISECTOR_EXCLUDE | **CURRICULUM_GAP** | Perpendicular bisector with second line intersection; 4 IDs -037..040 are Spring content. |
| `V3-SIM-G7-SOLVE-DERIVED` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-004` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Solve 2×2 linear system and calculate x²+y; near G8 SOLVE-THEN-NONLINEAR. |
| `V3-SIM-G7-NEW-TICKET-COMBINATION` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-008` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Solve two ticket prices then price new mix; same model as G8 TICKET-NEW-COMBO, different numbers. |
| `V2-SIMULTANEOUS-3` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-012` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Solve 2×2 linear equations and evaluate xy; same concept as G7/G8 derived-value families. |
| `V2-SIMULTANEOUS-4` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-016` | AUTUMN_BROAD | **GRADE_REVIEW** | No-solution case from parallel coefficient ratios; assess whether one coefficient recognition is really G7. |
| `V3-SIM-G8-TICKET-NEW-COMBO` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-020` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Identical ticket-equation structure to G7 ticket family; grade inflation unless deeper modelling shown. |
| `V3-SIM-G8-SOLVE-THEN-NONLINEAR` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-024` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Solve a system then calculate 2x²−y; structurally same as G7 system + x²+y. |
| `V3-SIM-G8-MASS-DIFFERENCE` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-028` | AUTUMN_BROAD | **OVERBAND_RISK** | Two mass equations then subtract; not clearly harder than G7 two-ticket system. |
| `V3-SIM-G8-DERIVED-COMBINATION` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-032` | AUTUMN_BROAD | **CROSS_BAND_CONFLICT** | Solve equations then evaluate 4x+5y; similar or simpler than G7 derived-value family. |
| `V3-SIM-G89-UNKNOWN-COEFFICIENT` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-036` | AUTUMN_BROAD | **OVERBAND_RISK** | Given x=2y+1, solve one equation then substitute for k; G8-9 seems unsubstantiated. |
| `V3-SIM-G89-COEFFICIENTS-BOTH-DEPEND-ON-K` | 4 | `LUX-MATH-Y9-SIMULTANEOUS-040` | AUTUMN_BROAD | **GRADE_REVIEW** | Both line coefficients depend on k; no-solution requires parallel-but-distinct check. Potential higher-demand but unsignable without benchmark. |

## Per-question QA status register (200 entries)
Every row below records traceable coverage and a family-level risk for that exact question. **It is not an assertion that five options on that row have been individually pedagogically approved**. Original Grade targets are retained solely for comparison.

| PDF Q# | Exact ID | Subject area | Original grade target | Template | Course scope triage | Risk | Existing explicit source flag | Academic decision |
|---:|---|---|---|---|---|---|---|---|
| 1 | `LUX-MATH-Y9-INDICES-001` | Indices | G7 | `V2-INDICES-1` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 2 | `LUX-MATH-Y9-INDICES-002` | Indices | G7 | `V2-INDICES-1` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 3 | `LUX-MATH-Y9-INDICES-003` | Indices | G7 | `V2-INDICES-1` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 4 | `LUX-MATH-Y9-INDICES-004` | Indices | G7 | `V2-INDICES-1` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 5 | `LUX-MATH-Y9-INDICES-005` | Indices | G7 | `V2-INDICES-2` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 6 | `LUX-MATH-Y9-INDICES-006` | Indices | G7 | `V2-INDICES-2` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 7 | `LUX-MATH-Y9-INDICES-007` | Indices | G7 | `V2-INDICES-2` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 8 | `LUX-MATH-Y9-INDICES-008` | Indices | G7 | `V2-INDICES-2` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 9 | `LUX-MATH-Y9-INDICES-009` | Indices | G7 | `V2-INDICES-3` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 10 | `LUX-MATH-Y9-INDICES-010` | Indices | G7 | `V2-INDICES-3` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 11 | `LUX-MATH-Y9-INDICES-011` | Indices | G7 | `V2-INDICES-3` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 12 | `LUX-MATH-Y9-INDICES-012` | Indices | G7 | `V2-INDICES-3` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 13 | `LUX-MATH-Y9-INDICES-013` | Indices | G7 | `V2-INDICES-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 14 | `LUX-MATH-Y9-INDICES-014` | Indices | G7 | `V2-INDICES-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 15 | `LUX-MATH-Y9-INDICES-015` | Indices | G7 | `V2-INDICES-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 16 | `LUX-MATH-Y9-INDICES-016` | Indices | G7 | `V2-INDICES-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 17 | `LUX-MATH-Y9-INDICES-017` | Indices | G8 | `V3-IND-G8-FACTOR-EXP` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 18 | `LUX-MATH-Y9-INDICES-018` | Indices | G8 | `V3-IND-G8-FACTOR-EXP` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 19 | `LUX-MATH-Y9-INDICES-019` | Indices | G8 | `V3-IND-G8-FACTOR-EXP` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 20 | `LUX-MATH-Y9-INDICES-020` | Indices | G8 | `V3-IND-G8-FACTOR-EXP` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 21 | `LUX-MATH-Y9-INDICES-021` | Indices | G8 | `V3-IND-G8-TWO-BASE-IDENTITY` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 22 | `LUX-MATH-Y9-INDICES-022` | Indices | G8 | `V3-IND-G8-TWO-BASE-IDENTITY` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 23 | `LUX-MATH-Y9-INDICES-023` | Indices | G8 | `V3-IND-G8-TWO-BASE-IDENTITY` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 24 | `LUX-MATH-Y9-INDICES-024` | Indices | G8 | `V3-IND-G8-TWO-BASE-IDENTITY` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 25 | `LUX-MATH-Y9-INDICES-025` | Indices | G8 | `V3-IND-G8-QUOTIENT-PARAMETER` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 26 | `LUX-MATH-Y9-INDICES-026` | Indices | G8 | `V3-IND-G8-QUOTIENT-PARAMETER` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 27 | `LUX-MATH-Y9-INDICES-027` | Indices | G8 | `V3-IND-G8-QUOTIENT-PARAMETER` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 28 | `LUX-MATH-Y9-INDICES-028` | Indices | G8 | `V3-IND-G8-QUOTIENT-PARAMETER` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 29 | `LUX-MATH-Y9-INDICES-029` | Indices | G8 | `V3-IND-G8-SQRT-QUOTIENT` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 30 | `LUX-MATH-Y9-INDICES-030` | Indices | G8 | `V3-IND-G8-SQRT-QUOTIENT` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 31 | `LUX-MATH-Y9-INDICES-031` | Indices | G8 | `V3-IND-G8-SQRT-QUOTIENT` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 32 | `LUX-MATH-Y9-INDICES-032` | Indices | G8 | `V3-IND-G8-SQRT-QUOTIENT` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 33 | `LUX-MATH-Y9-INDICES-033` | Indices | G8-9 | `V3-IND-G89-FRACTIONAL-IDENTITY` | FRACTIONAL_INDEX_TAUGHT_UNVERIFIED | CURRICULUM_GAP | FRACTIONAL_INDICES_TAUGHT_UNVERIFIED | **HOLD** |
| 34 | `LUX-MATH-Y9-INDICES-034` | Indices | G8-9 | `V3-IND-G89-FRACTIONAL-IDENTITY` | FRACTIONAL_INDEX_TAUGHT_UNVERIFIED | CURRICULUM_GAP | FRACTIONAL_INDICES_TAUGHT_UNVERIFIED | **HOLD** |
| 35 | `LUX-MATH-Y9-INDICES-035` | Indices | G8-9 | `V3-IND-G89-FRACTIONAL-IDENTITY` | FRACTIONAL_INDEX_TAUGHT_UNVERIFIED | CURRICULUM_GAP | FRACTIONAL_INDICES_TAUGHT_UNVERIFIED | **HOLD** |
| 36 | `LUX-MATH-Y9-INDICES-036` | Indices | G8-9 | `V3-IND-G89-FRACTIONAL-IDENTITY` | FRACTIONAL_INDEX_TAUGHT_UNVERIFIED | CURRICULUM_GAP | FRACTIONAL_INDICES_TAUGHT_UNVERIFIED | **HOLD** |
| 37 | `LUX-MATH-Y9-INDICES-037` | Indices | G8-9 | `V3-IND-G89-EXPONENT-THEN-EXPRESSION` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 38 | `LUX-MATH-Y9-INDICES-038` | Indices | G8-9 | `V3-IND-G89-EXPONENT-THEN-EXPRESSION` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 39 | `LUX-MATH-Y9-INDICES-039` | Indices | G8-9 | `V3-IND-G89-EXPONENT-THEN-EXPRESSION` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 40 | `LUX-MATH-Y9-INDICES-040` | Indices | G8-9 | `V3-IND-G89-EXPONENT-THEN-EXPRESSION` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 41 | `LUX-MATH-Y9-STANDARD_FORM-001` | Standard form | G7 | `V2-STANDARD-FORM-1` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 42 | `LUX-MATH-Y9-STANDARD_FORM-002` | Standard form | G7 | `V2-STANDARD-FORM-1` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 43 | `LUX-MATH-Y9-STANDARD_FORM-003` | Standard form | G7 | `V2-STANDARD-FORM-1` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 44 | `LUX-MATH-Y9-STANDARD_FORM-004` | Standard form | G7 | `V2-STANDARD-FORM-1` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 45 | `LUX-MATH-Y9-STANDARD_FORM-005` | Standard form | G7 | `V2-STANDARD-FORM-2` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 46 | `LUX-MATH-Y9-STANDARD_FORM-006` | Standard form | G7 | `V2-STANDARD-FORM-2` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 47 | `LUX-MATH-Y9-STANDARD_FORM-007` | Standard form | G7 | `V2-STANDARD-FORM-2` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 48 | `LUX-MATH-Y9-STANDARD_FORM-008` | Standard form | G7 | `V2-STANDARD-FORM-2` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 49 | `LUX-MATH-Y9-STANDARD_FORM-009` | Standard form | G7 | `V2-STANDARD-FORM-3` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 50 | `LUX-MATH-Y9-STANDARD_FORM-010` | Standard form | G7 | `V2-STANDARD-FORM-3` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 51 | `LUX-MATH-Y9-STANDARD_FORM-011` | Standard form | G7 | `V2-STANDARD-FORM-3` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 52 | `LUX-MATH-Y9-STANDARD_FORM-012` | Standard form | G7 | `V2-STANDARD-FORM-3` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 53 | `LUX-MATH-Y9-STANDARD_FORM-013` | Standard form | G7 | `V2-STANDARD-FORM-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 54 | `LUX-MATH-Y9-STANDARD_FORM-014` | Standard form | G7 | `V2-STANDARD-FORM-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 55 | `LUX-MATH-Y9-STANDARD_FORM-015` | Standard form | G7 | `V2-STANDARD-FORM-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 56 | `LUX-MATH-Y9-STANDARD_FORM-016` | Standard form | G7 | `V2-STANDARD-FORM-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 57 | `LUX-MATH-Y9-STANDARD_FORM-017` | Standard form | G8 | `V3-SF-G8-FILTER-DENSITY` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 58 | `LUX-MATH-Y9-STANDARD_FORM-018` | Standard form | G8 | `V3-SF-G8-FILTER-DENSITY` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 59 | `LUX-MATH-Y9-STANDARD_FORM-019` | Standard form | G8 | `V3-SF-G8-FILTER-DENSITY` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 60 | `LUX-MATH-Y9-STANDARD_FORM-020` | Standard form | G8 | `V3-SF-G8-FILTER-DENSITY` | AUTUMN_BROAD | UNREALISTIC_CONTEXT | — | **HOLD** |
| 61 | `LUX-MATH-Y9-STANDARD_FORM-021` | Standard form | G8 | `V3-SF-G8-RELATIVE-PERCENTAGE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 62 | `LUX-MATH-Y9-STANDARD_FORM-022` | Standard form | G8 | `V3-SF-G8-RELATIVE-PERCENTAGE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 63 | `LUX-MATH-Y9-STANDARD_FORM-023` | Standard form | G8 | `V3-SF-G8-RELATIVE-PERCENTAGE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 64 | `LUX-MATH-Y9-STANDARD_FORM-024` | Standard form | G8 | `V3-SF-G8-RELATIVE-PERCENTAGE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 65 | `LUX-MATH-Y9-STANDARD_FORM-025` | Standard form | G8 | `V3-SF-G8-UNITS-AND-PARTICLE-COUNT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 66 | `LUX-MATH-Y9-STANDARD_FORM-026` | Standard form | G8 | `V3-SF-G8-UNITS-AND-PARTICLE-COUNT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 67 | `LUX-MATH-Y9-STANDARD_FORM-027` | Standard form | G8 | `V3-SF-G8-UNITS-AND-PARTICLE-COUNT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 68 | `LUX-MATH-Y9-STANDARD_FORM-028` | Standard form | G8 | `V3-SF-G8-UNITS-AND-PARTICLE-COUNT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 69 | `LUX-MATH-Y9-STANDARD_FORM-029` | Standard form | G8 | `V3-SF-G8-COMBINE-THREE-TERMS` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 70 | `LUX-MATH-Y9-STANDARD_FORM-030` | Standard form | G8 | `V3-SF-G8-COMBINE-THREE-TERMS` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 71 | `LUX-MATH-Y9-STANDARD_FORM-031` | Standard form | G8 | `V3-SF-G8-COMBINE-THREE-TERMS` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 72 | `LUX-MATH-Y9-STANDARD_FORM-032` | Standard form | G8 | `V3-SF-G8-COMBINE-THREE-TERMS` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 73 | `LUX-MATH-Y9-STANDARD_FORM-033` | Standard form | G8-9 | `V3-SF-G89-TRANSFER-LOSS-QUANTITY` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 74 | `LUX-MATH-Y9-STANDARD_FORM-034` | Standard form | G8-9 | `V3-SF-G89-TRANSFER-LOSS-QUANTITY` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 75 | `LUX-MATH-Y9-STANDARD_FORM-035` | Standard form | G8-9 | `V3-SF-G89-TRANSFER-LOSS-QUANTITY` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 76 | `LUX-MATH-Y9-STANDARD_FORM-036` | Standard form | G8-9 | `V3-SF-G89-TRANSFER-LOSS-QUANTITY` | AUTUMN_BROAD | DISTRACTOR_RED_FLAG | — | **HOLD** |
| 77 | `LUX-MATH-Y9-STANDARD_FORM-037` | Standard form | G8-9 | `V3-SF-G89-INVERSE-BALANCE` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 78 | `LUX-MATH-Y9-STANDARD_FORM-038` | Standard form | G8-9 | `V3-SF-G89-INVERSE-BALANCE` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 79 | `LUX-MATH-Y9-STANDARD_FORM-039` | Standard form | G8-9 | `V3-SF-G89-INVERSE-BALANCE` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 80 | `LUX-MATH-Y9-STANDARD_FORM-040` | Standard form | G8-9 | `V3-SF-G89-INVERSE-BALANCE` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 81 | `LUX-MATH-Y9-REARRANGING-001` | Changing the subject | G7 | `V2-SUBJECT-1` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | TEACHING_CHECK | — | **HOLD** |
| 82 | `LUX-MATH-Y9-REARRANGING-002` | Changing the subject | G7 | `V2-SUBJECT-1` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | TEACHING_CHECK | — | **HOLD** |
| 83 | `LUX-MATH-Y9-REARRANGING-003` | Changing the subject | G7 | `V2-SUBJECT-1` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | TEACHING_CHECK | — | **HOLD** |
| 84 | `LUX-MATH-Y9-REARRANGING-004` | Changing the subject | G7 | `V2-SUBJECT-1` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | TEACHING_CHECK | — | **HOLD** |
| 85 | `LUX-MATH-Y9-REARRANGING-005` | Changing the subject | G7 | `V2-SUBJECT-2` | AUTUMN_BROAD | DOMAIN_REVIEW | — | **HOLD** |
| 86 | `LUX-MATH-Y9-REARRANGING-006` | Changing the subject | G7 | `V2-SUBJECT-2` | AUTUMN_BROAD | DOMAIN_REVIEW | — | **HOLD** |
| 87 | `LUX-MATH-Y9-REARRANGING-007` | Changing the subject | G7 | `V2-SUBJECT-2` | AUTUMN_BROAD | DOMAIN_REVIEW | — | **HOLD** |
| 88 | `LUX-MATH-Y9-REARRANGING-008` | Changing the subject | G7 | `V2-SUBJECT-2` | AUTUMN_BROAD | DOMAIN_REVIEW | — | **HOLD** |
| 89 | `LUX-MATH-Y9-REARRANGING-009` | Changing the subject | G7 | `V2-SUBJECT-3` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 90 | `LUX-MATH-Y9-REARRANGING-010` | Changing the subject | G7 | `V2-SUBJECT-3` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 91 | `LUX-MATH-Y9-REARRANGING-011` | Changing the subject | G7 | `V2-SUBJECT-3` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 92 | `LUX-MATH-Y9-REARRANGING-012` | Changing the subject | G8 | `V3-REAR-G8-SHIFT-RECIPROCAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 93 | `LUX-MATH-Y9-REARRANGING-013` | Changing the subject | G8 | `V3-REAR-G8-SHIFT-RECIPROCAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 94 | `LUX-MATH-Y9-REARRANGING-014` | Changing the subject | G8 | `V3-REAR-G8-SHIFT-RECIPROCAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 95 | `LUX-MATH-Y9-REARRANGING-015` | Changing the subject | G8 | `V3-REAR-G8-SHIFT-RECIPROCAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 96 | `LUX-MATH-Y9-REARRANGING-016` | Changing the subject | G8 | `V3-REAR-G8-SHIFTED-RATIONAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 97 | `LUX-MATH-Y9-REARRANGING-017` | Changing the subject | G8 | `V3-REAR-G8-SHIFTED-RATIONAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 98 | `LUX-MATH-Y9-REARRANGING-018` | Changing the subject | G7 | `V2-SUBJECT-3` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 99 | `LUX-MATH-Y9-REARRANGING-019` | Changing the subject | G7 | `V2-SUBJECT-4` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 100 | `LUX-MATH-Y9-REARRANGING-020` | Changing the subject | G7 | `V2-SUBJECT-4` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 101 | `LUX-MATH-Y9-REARRANGING-021` | Changing the subject | G7 | `V2-SUBJECT-4` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 102 | `LUX-MATH-Y9-REARRANGING-022` | Changing the subject | G7 | `V2-SUBJECT-4` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 103 | `LUX-MATH-Y9-REARRANGING-023` | Changing the subject | G8 | `V3-REAR-G8-SHIFTED-RATIONAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 104 | `LUX-MATH-Y9-REARRANGING-024` | Changing the subject | G8 | `V3-REAR-G8-SHIFTED-RATIONAL` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 105 | `LUX-MATH-Y9-REARRANGING-025` | Changing the subject | G8 | `V3-REAR-G8-RECIPROCAL-SURD` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 106 | `LUX-MATH-Y9-REARRANGING-026` | Changing the subject | G8 | `V3-REAR-G8-RECIPROCAL-SURD` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 107 | `LUX-MATH-Y9-REARRANGING-027` | Changing the subject | G8 | `V3-REAR-G8-RECIPROCAL-SURD` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 108 | `LUX-MATH-Y9-REARRANGING-028` | Changing the subject | G8 | `V3-REAR-G8-RECIPROCAL-SURD` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 109 | `LUX-MATH-Y9-REARRANGING-029` | Changing the subject | G8 | `V3-REAR-G8-FACTOR-FRACTION` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 110 | `LUX-MATH-Y9-REARRANGING-030` | Changing the subject | G8 | `V3-REAR-G8-FACTOR-FRACTION` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 111 | `LUX-MATH-Y9-REARRANGING-031` | Changing the subject | G8 | `V3-REAR-G8-FACTOR-FRACTION` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 112 | `LUX-MATH-Y9-REARRANGING-032` | Changing the subject | G8 | `V3-REAR-G8-FACTOR-FRACTION` | RATIONAL_SUBSKILL_TAUGHT_UNVERIFIED | CROSS_BAND_CONFLICT | — | **HOLD** |
| 113 | `LUX-MATH-Y9-REARRANGING-033` | Changing the subject | G8-9 | `V3-REAR-G89-NESTED-DENOMINATOR` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 114 | `LUX-MATH-Y9-REARRANGING-034` | Changing the subject | G8-9 | `V3-REAR-G89-NESTED-DENOMINATOR` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 115 | `LUX-MATH-Y9-REARRANGING-035` | Changing the subject | G8-9 | `V3-REAR-G89-NESTED-DENOMINATOR` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 116 | `LUX-MATH-Y9-REARRANGING-036` | Changing the subject | G8-9 | `V3-REAR-G89-NESTED-DENOMINATOR` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 117 | `LUX-MATH-Y9-REARRANGING-037` | Changing the subject | G8-9 | `V3-REAR-G89-SURD-FRACTION` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 118 | `LUX-MATH-Y9-REARRANGING-038` | Changing the subject | G8-9 | `V3-REAR-G89-SURD-FRACTION` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 119 | `LUX-MATH-Y9-REARRANGING-039` | Changing the subject | G8-9 | `V3-REAR-G89-SURD-FRACTION` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 120 | `LUX-MATH-Y9-REARRANGING-040` | Changing the subject | G8-9 | `V3-REAR-G89-SURD-FRACTION` | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | CURRICULUM_GAP | ADVANCED_REARRANGEMENT_TAUGHT_UNVERIFIED | **HOLD** |
| 121 | `LUX-MATH-Y9-GRAPHS-001` | Straight-line graphs | G7 | `V2-GRAPHS-1` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 122 | `LUX-MATH-Y9-GRAPHS-002` | Straight-line graphs | G7 | `V2-GRAPHS-1` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 123 | `LUX-MATH-Y9-GRAPHS-003` | Straight-line graphs | G7 | `V2-GRAPHS-1` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 124 | `LUX-MATH-Y9-GRAPHS-004` | Straight-line graphs | G7 | `V2-GRAPHS-1` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 125 | `LUX-MATH-Y9-GRAPHS-005` | Straight-line graphs | G7 | `V2-GRAPHS-2` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 126 | `LUX-MATH-Y9-GRAPHS-006` | Straight-line graphs | G7 | `V2-GRAPHS-2` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 127 | `LUX-MATH-Y9-GRAPHS-007` | Straight-line graphs | G7 | `V2-GRAPHS-2` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 128 | `LUX-MATH-Y9-GRAPHS-008` | Straight-line graphs | G7 | `V2-GRAPHS-2` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 129 | `LUX-MATH-Y9-GRAPHS-009` | Straight-line graphs | G7 | `V2-GRAPHS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 130 | `LUX-MATH-Y9-GRAPHS-010` | Straight-line graphs | G7 | `V2-GRAPHS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 131 | `LUX-MATH-Y9-GRAPHS-011` | Straight-line graphs | G7 | `V2-GRAPHS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 132 | `LUX-MATH-Y9-GRAPHS-012` | Straight-line graphs | G7 | `V2-GRAPHS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 133 | `LUX-MATH-Y9-GRAPHS-013` | Straight-line graphs | G7 | `V2-GRAPHS-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 134 | `LUX-MATH-Y9-GRAPHS-014` | Straight-line graphs | G7 | `V2-GRAPHS-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 135 | `LUX-MATH-Y9-GRAPHS-015` | Straight-line graphs | G7 | `V2-GRAPHS-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 136 | `LUX-MATH-Y9-GRAPHS-016` | Straight-line graphs | G7 | `V2-GRAPHS-4` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 137 | `LUX-MATH-Y9-GRAPHS-017` | Straight-line graphs | G8 | `V3-GRAPH-G8-BISECTOR-LINE-INTERSECTION` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 138 | `LUX-MATH-Y9-GRAPHS-018` | Straight-line graphs | G8 | `V3-GRAPH-G8-BISECTOR-LINE-INTERSECTION` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 139 | `LUX-MATH-Y9-GRAPHS-019` | Straight-line graphs | G8 | `V3-GRAPH-G8-BISECTOR-LINE-INTERSECTION` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 140 | `LUX-MATH-Y9-GRAPHS-020` | Straight-line graphs | G8 | `V3-GRAPH-G8-BISECTOR-LINE-INTERSECTION` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 141 | `LUX-MATH-Y9-GRAPHS-021` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERCEPT-MIDPOINT-NORMAL` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 142 | `LUX-MATH-Y9-GRAPHS-022` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERCEPT-MIDPOINT-NORMAL` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 143 | `LUX-MATH-Y9-GRAPHS-023` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERCEPT-MIDPOINT-NORMAL` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 144 | `LUX-MATH-Y9-GRAPHS-024` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERCEPT-MIDPOINT-NORMAL` | AUTUMN_BROAD | TEACHING_CHECK | — | **HOLD** |
| 145 | `LUX-MATH-Y9-GRAPHS-025` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERSECT-PARALLEL-INTERCEPT` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 146 | `LUX-MATH-Y9-GRAPHS-026` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERSECT-PARALLEL-INTERCEPT` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 147 | `LUX-MATH-Y9-GRAPHS-027` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERSECT-PARALLEL-INTERCEPT` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 148 | `LUX-MATH-Y9-GRAPHS-028` | Straight-line graphs | G8 | `V3-GRAPH-G8-INTERSECT-PARALLEL-INTERCEPT` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 149 | `LUX-MATH-Y9-GRAPHS-029` | Straight-line graphs | G8 | `V3-GRAPH-G8-PARAMETER-PERPENDICULAR` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 150 | `LUX-MATH-Y9-GRAPHS-030` | Straight-line graphs | G8 | `V3-GRAPH-G8-PARAMETER-PERPENDICULAR` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 151 | `LUX-MATH-Y9-GRAPHS-031` | Straight-line graphs | G8 | `V3-GRAPH-G8-PARAMETER-PERPENDICULAR` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 152 | `LUX-MATH-Y9-GRAPHS-032` | Straight-line graphs | G8 | `V3-GRAPH-G8-PARAMETER-PERPENDICULAR` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 153 | `LUX-MATH-Y9-GRAPHS-033` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-INTERSECTION-PERP-AXIS` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 154 | `LUX-MATH-Y9-GRAPHS-034` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-INTERSECTION-PERP-AXIS` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 155 | `LUX-MATH-Y9-GRAPHS-035` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-INTERSECTION-PERP-AXIS` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 156 | `LUX-MATH-Y9-GRAPHS-036` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-INTERSECTION-PERP-AXIS` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 157 | `LUX-MATH-Y9-GRAPHS-037` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-BISECTOR-INTERSECTION-SUM` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 158 | `LUX-MATH-Y9-GRAPHS-038` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-BISECTOR-INTERSECTION-SUM` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 159 | `LUX-MATH-Y9-GRAPHS-039` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-BISECTOR-INTERSECTION-SUM` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 160 | `LUX-MATH-Y9-GRAPHS-040` | Straight-line graphs | G8-9 | `V3-GRAPH-G89-BISECTOR-INTERSECTION-SUM` | SPRING_BISECTOR_EXCLUDE | CURRICULUM_GAP | SPRING_TERM_BISECTOR_OUTSIDE_AUTUMN_SCOPE | **HOLD** |
| 161 | `LUX-MATH-Y9-SIMULTANEOUS-001` | Simultaneous equations | G7 | `V3-SIM-G7-SOLVE-DERIVED` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 162 | `LUX-MATH-Y9-SIMULTANEOUS-002` | Simultaneous equations | G7 | `V3-SIM-G7-SOLVE-DERIVED` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 163 | `LUX-MATH-Y9-SIMULTANEOUS-003` | Simultaneous equations | G7 | `V3-SIM-G7-SOLVE-DERIVED` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 164 | `LUX-MATH-Y9-SIMULTANEOUS-004` | Simultaneous equations | G7 | `V3-SIM-G7-SOLVE-DERIVED` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 165 | `LUX-MATH-Y9-SIMULTANEOUS-005` | Simultaneous equations | G7 | `V3-SIM-G7-NEW-TICKET-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 166 | `LUX-MATH-Y9-SIMULTANEOUS-006` | Simultaneous equations | G7 | `V3-SIM-G7-NEW-TICKET-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 167 | `LUX-MATH-Y9-SIMULTANEOUS-007` | Simultaneous equations | G7 | `V3-SIM-G7-NEW-TICKET-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 168 | `LUX-MATH-Y9-SIMULTANEOUS-008` | Simultaneous equations | G7 | `V3-SIM-G7-NEW-TICKET-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 169 | `LUX-MATH-Y9-SIMULTANEOUS-009` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 170 | `LUX-MATH-Y9-SIMULTANEOUS-010` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 171 | `LUX-MATH-Y9-SIMULTANEOUS-011` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 172 | `LUX-MATH-Y9-SIMULTANEOUS-012` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-3` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 173 | `LUX-MATH-Y9-SIMULTANEOUS-013` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 174 | `LUX-MATH-Y9-SIMULTANEOUS-014` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 175 | `LUX-MATH-Y9-SIMULTANEOUS-015` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 176 | `LUX-MATH-Y9-SIMULTANEOUS-016` | Simultaneous equations | G7 | `V2-SIMULTANEOUS-4` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 177 | `LUX-MATH-Y9-SIMULTANEOUS-017` | Simultaneous equations | G8 | `V3-SIM-G8-TICKET-NEW-COMBO` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 178 | `LUX-MATH-Y9-SIMULTANEOUS-018` | Simultaneous equations | G8 | `V3-SIM-G8-TICKET-NEW-COMBO` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 179 | `LUX-MATH-Y9-SIMULTANEOUS-019` | Simultaneous equations | G8 | `V3-SIM-G8-TICKET-NEW-COMBO` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 180 | `LUX-MATH-Y9-SIMULTANEOUS-020` | Simultaneous equations | G8 | `V3-SIM-G8-TICKET-NEW-COMBO` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 181 | `LUX-MATH-Y9-SIMULTANEOUS-021` | Simultaneous equations | G8 | `V3-SIM-G8-SOLVE-THEN-NONLINEAR` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 182 | `LUX-MATH-Y9-SIMULTANEOUS-022` | Simultaneous equations | G8 | `V3-SIM-G8-SOLVE-THEN-NONLINEAR` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 183 | `LUX-MATH-Y9-SIMULTANEOUS-023` | Simultaneous equations | G8 | `V3-SIM-G8-SOLVE-THEN-NONLINEAR` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 184 | `LUX-MATH-Y9-SIMULTANEOUS-024` | Simultaneous equations | G8 | `V3-SIM-G8-SOLVE-THEN-NONLINEAR` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 185 | `LUX-MATH-Y9-SIMULTANEOUS-025` | Simultaneous equations | G8 | `V3-SIM-G8-MASS-DIFFERENCE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 186 | `LUX-MATH-Y9-SIMULTANEOUS-026` | Simultaneous equations | G8 | `V3-SIM-G8-MASS-DIFFERENCE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 187 | `LUX-MATH-Y9-SIMULTANEOUS-027` | Simultaneous equations | G8 | `V3-SIM-G8-MASS-DIFFERENCE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 188 | `LUX-MATH-Y9-SIMULTANEOUS-028` | Simultaneous equations | G8 | `V3-SIM-G8-MASS-DIFFERENCE` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 189 | `LUX-MATH-Y9-SIMULTANEOUS-029` | Simultaneous equations | G8 | `V3-SIM-G8-DERIVED-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 190 | `LUX-MATH-Y9-SIMULTANEOUS-030` | Simultaneous equations | G8 | `V3-SIM-G8-DERIVED-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 191 | `LUX-MATH-Y9-SIMULTANEOUS-031` | Simultaneous equations | G8 | `V3-SIM-G8-DERIVED-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 192 | `LUX-MATH-Y9-SIMULTANEOUS-032` | Simultaneous equations | G8 | `V3-SIM-G8-DERIVED-COMBINATION` | AUTUMN_BROAD | CROSS_BAND_CONFLICT | — | **HOLD** |
| 193 | `LUX-MATH-Y9-SIMULTANEOUS-033` | Simultaneous equations | G8-9 | `V3-SIM-G89-UNKNOWN-COEFFICIENT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 194 | `LUX-MATH-Y9-SIMULTANEOUS-034` | Simultaneous equations | G8-9 | `V3-SIM-G89-UNKNOWN-COEFFICIENT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 195 | `LUX-MATH-Y9-SIMULTANEOUS-035` | Simultaneous equations | G8-9 | `V3-SIM-G89-UNKNOWN-COEFFICIENT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 196 | `LUX-MATH-Y9-SIMULTANEOUS-036` | Simultaneous equations | G8-9 | `V3-SIM-G89-UNKNOWN-COEFFICIENT` | AUTUMN_BROAD | OVERBAND_RISK | — | **HOLD** |
| 197 | `LUX-MATH-Y9-SIMULTANEOUS-037` | Simultaneous equations | G8-9 | `V3-SIM-G89-COEFFICIENTS-BOTH-DEPEND-ON-K` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 198 | `LUX-MATH-Y9-SIMULTANEOUS-038` | Simultaneous equations | G8-9 | `V3-SIM-G89-COEFFICIENTS-BOTH-DEPEND-ON-K` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 199 | `LUX-MATH-Y9-SIMULTANEOUS-039` | Simultaneous equations | G8-9 | `V3-SIM-G89-COEFFICIENTS-BOTH-DEPEND-ON-K` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |
| 200 | `LUX-MATH-Y9-SIMULTANEOUS-040` | Simultaneous equations | G8-9 | `V3-SIM-G89-COEFFICIENTS-BOTH-DEPEND-ON-K` | AUTUMN_BROAD | GRADE_REVIEW | — | **HOLD** |

## Release hold and next check
Do not mark any item `academicQA=approved` from this document. The next Academic QA increment is the **1,000 source-specific option-by-option misconception reviews** (all 5 wrong choices × 200), evidence-backed real GCSE demand benchmarking for potentially inflated families, teacher-taught subskills, and full worked-explanation domain checks. Do not add filler rationales. Only audited, genuinely Grade 7+ and taught questions can enter the approved Maths assignment pool, preserving 10 Maths MCQs/day, six A–F options and 9/10 success rule. Physical iPad QA and current CI remain separate release blockers.

**PR #306 stays Draft, 0/200 live-approved, no main or live learner data change.**
