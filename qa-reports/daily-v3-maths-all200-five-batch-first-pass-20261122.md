# Lux et Labor — Maths 200/200 Source and Mathematics Batch QA

**22 November 2026 | Draft PR #306 only | Academic approvals 0/200 | Live app and student credit unchanged**

## Critical follow-up correction — option extraction safety

**Do not read '200/200 six A–F source choices checked' as 1,200 mathematically faithful option expressions.** On a subsequent source-format audit, the PDF plain-text extraction was found to bleed vertically stacked fraction numerators and denominators across answer-letter boundaries (e.g. original Indices Q5: `A. 16\n 1`, `B.\n 16` corresponds to nearby stacked 1/16 formatting, not two reliable integer values). The original Q1–200 key letters remain unchanged, but the exact printed numerical/symbolic contents of several A–F choices cannot be inferred safely from the line extraction.

**New [1,200-option extraction safety register](../qa-staging/math-v311-original-1200-option-layout-safety-20261122.json): 477 straightforward one-line integer snippets; 723 formatted or multiline items explicitly awaiting original-page visual QA.** This is not 477 signed distractors and not 723 wrong calculations. **[Full Indices Q1–40 / 200 wrong-choice screening](../qa-staging/math-v311-indices40-all200-wrong-options-math-triage-20261122.json)**: 4 mathematically reconstructable negative-index-sign wrong outcomes, 112 readable integers numerically unequal to correct results but without an independently demonstrated misconception, and 84 unresolved original PDF layouts. External teaching/Grade 7+ QA still **0/200**.

[See full evidence and independent test](daily-v3-maths-1200-option-layout-and-indices40-review-20261122.md).

## Standard Form second-pass completed as a full 40-question batch (Q41–80)

Following the preliminary 200/200 **source answer** audit, Standard Form now has an additional 240-choice **line-preserving scientific-notation numeric review** and a full **200-wrong-option source arithmetic operation comparison**, rather than a four-question sample. Strict parsing reads **216** source scientific-notation snippets and **16** plain one-line numbers, mathematically matches all **40** correct original choices and confirms **192** source wrong choices differ numerically from the correct result. **Eight** original relative-percentage fractions stay formatting-ambiguous: Q61 B/C/D/E, Q63 E/F, Q64 E/F. An initial erroneous newline-stripping parser had misreported only four; this was corrected before CI signoff.

**107/200 wrong options** have at least one **mathematically reproducible source-specific erroneous operation** (NOT independently teacher-endorsed misconception plausibility); **85/200** are numerically wrong but have no demonstrated wrong operation from the reviewed set; **8/200** are visually unresolved. **37/40** source questions have at least one such arithmetic candidate route. Source quality dispositions: **20 need harder/nonroutine stems**, **12 need context or duplicate rewrites**, **8 quarantined for exact taught percentage scope**. **0/40 independent Grade7+ or teacher Academic QA passes**.

- [Full 40-question review and risk report](daily-v3-maths-standard-form40-240-choice-batch-and-repair-audit-20261122.md)
- [Strict original 240-option numeric QA](../qa-staging/math-v311-standard-form40-source-240-option-numeric-review-20261122.json)
- [200 distractor wrong-operation arithmetic candidates](../qa-staging/math-v311-standard-form40-original-200-distractor-operation-candidates-20261122.json)
- [All 40 original source decisions](../qa-staging/math-v311-standard-form40-academic-disposition-all-originals-20261122.json)
- [Independent executable source regression](../tests/daily-v3-maths-standard-form40-240-options-107-operations-20261122.test.mjs); code CI passed [Run #45068149297](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45068149297) **147/147 + 59/59 + 37/37**.

No source items or existing QA-only redrafts were imported; origin key letter and historical progress were not changed. Source maths, source-option interpretation, independent difficulty, curriculum scope, distractor pedagogy and app/device safety remain **separate signoff gates**.

## 1. Batch processing — all five subjects completed in this pass

The original user-uploaded 74-page **Lux_Maths_Y9_V3_All_200_Student.pdf**, 39-page **Lux_Maths_Y9_V3_All_200_Answers.pdf**, and **Lux_Maths_V3_1_Formal_Academic_QA_Register_20261122.csv** were reopened and all 200 numbered original questions, six original A–F option *labels* per question, and source answer letters rechecked. Reconstructing the actual formatted option expressions requires the separate follow-up visual QA noted above. Five source-preserving packs were created, each including exact PDF-extracted question content, original worked solution, source page, original answer letter, topic, template, preliminary curriculum and grade risk and all release HOLD flags.

| Topic | Numbered source and six A–F verified | Independent mathematical verification in this run | Remaining evidence |
|---|---:|---|---|
| **Indices** | 40/40 | 40 base/exponent, power quotient, fractional-index and identity results independently recalculated and compared to worked-answer numeric values | AQA G7+ demand; five signed distractor paths per question; taught radical/fractional-index subskills |
| **Standard Form** | 40/40 | 40 independently recalculated numerical answers compared against printed source worked answers | Physical credibility of density contexts; repeat answers; Spring percentage timing; five distractor paths and G7+ demand |
| **Changing the Subject** | 40/40 | 40 independently re-derived inverse formulas; 4 substitutions each = **160** successful forward-inverse checks | Numerator/denominator typography visually checked per option; rational/surd exact teaching; GCSE difficulty; wrong options |
| **Straight-line Graphs** | 40/40 | 40 independently recalculated gradient, intersection, normal/bisector and coordinate outputs | Visually verify printed fractional options; Spring bisector exclusions; grade classification; 200 distractors |
| **Simultaneous Equations** | 40/40 | 40 original equation systems, applied targets and no-solution coefficient conditions independently re-solved and numerically compared to worked source | Duplicate systems, simple AO1 over-grading, all five distractors each, real class taught scope |
| **Total** | **200/200** | **200/200 first-pass computations or inverse tests** | **NOT 200/200 formally approved** |

The source files are still authoritative. PDF text extraction can flatten roots, superscripts and stacked fractions, so the original typeset options—not only extracted text—must undergo independent visual cross-check before a formal signoff. For Changing the Subject and Graphs in particular, **this pass verifies the mathematics independently but does not establish that every printed answer option is visually identical to the derived expression**.

### Evidence: five complete original 40-question packets

- [Indices Q1–40](../qa-staging/math-v311-batch40-indices-source-qa-20261122.json)
- [Standard Form Q41–80](../qa-staging/math-v311-batch40-standard-form-source-qa-20261122.json)
- [Changing the Subject Q81–120](../qa-staging/math-v311-batch40-changing-subject-source-qa-20261122.json)
- [Straight-line Graphs Q121–160](../qa-staging/math-v311-batch40-straight-line-graphs-source-qa-20261122.json)
- [Simultaneous Equations Q161–200](../qa-staging/math-v311-batch40-simultaneous-equations-source-qa-20261122.json)

### Evidence: five independently computed source mathematics packets

- [Indices 40 results](../qa-staging/math-v311-indices40-independent-calculation-20261122.json)
- [Standard Form 40 arithmetic checks](../qa-staging/math-v311-standard-form40-independent-calculation-20261122.json)
- [Changing Subject 40 inverses, 160 probes](../qa-staging/math-v311-changing-subject40-independent-inverse-check-20261122.json)
- [Graphs 40 coordinate calculations](../qa-staging/math-v311-straight-line-graphs40-independent-geometry-20261122.json)
- [Simultaneous 40 systems and derived values](../qa-staging/math-v311-simultaneous40-independent-elimination-20261122.json)

## Original A–F choice corpus: 1,200 source options, 1,000 remaining diagnostic decisions

Five additional source-preserving option ledgers were generated from the actual archived student PDF: **240 option records per topic = 1,200 original A–F choices**, with **exactly 200 source correct-key slots** and **1,000 original wrong-answer distractor slots**. Every slot keeps its original question ID, source template, printed choice letter, extracted text, original key flag, and **independent misconception pedagogy approval = false**. These are **review worklists, NOT 1,000 verified wrong-operation paths**. Extracted vertically stacked fractions require original-PDF visual checking.

- [Indices: 240 original options / 200 wrong choices awaiting QA](../qa-staging/math-v311-indices-240-source-options-qa-ledger-20261122.json)
- [Standard Form: 240 / 200](../qa-staging/math-v311-standard-form-240-source-options-qa-ledger-20261122.json)
- [Changing the Subject: 240 / 200](../qa-staging/math-v311-changing-subject-240-source-options-qa-ledger-20261122.json)
- [Straight-line Graphs: 240 / 200](../qa-staging/math-v311-straight-line-graphs-240-source-options-qa-ledger-20261122.json)
- [Simultaneous Equations: 240 / 200](../qa-staging/math-v311-simultaneous-equations-240-source-options-qa-ledger-20261122.json)

The [regression check](../tests/daily-v3-maths-original-1200-options-review-pending-20261122.test.mjs) ensures 6/6 choice starts and exact 1+5 correct/wrong slots per each of the 200 source questions and specifically **forbids promotion** of any of the 1,000 still-unreviewed pedagogical rationales.

## 2. Specific substantive academic issues found or reconfirmed

**High-band sameness, even with correct answers:** original **Graphs Q157–160** all give **xP+yP=7**. Original **Simultaneous Q185–188** all give **crate − box = 5 kg**. Original **Standard Form Q73–76** all give **1.116 × 10^5 g/packet**. Such whole-family repetition needs actual redrafting; changing input numbers alone does not turn the family into independent Grade 8–9 concepts.

**Invalid scientific context:** density values of original **Standard Form Q41–44** are **3–6 × 10² g/cm³**, and **Q57–60** are either 3×10² or 3×10¹ g/cm³, unsuitable as ordinary bulk-material examples without special justification. Q57 and Q59 have the same answer; Q58 and Q60 likewise. Arithmetic PASS must not cancel physics-context HOLD.

**Duplicate original givens:** some Simultaneous questions use identical systems while changing only the requested expression, e.g. source Q161, Q169 and Q189. Cross-task anti-repeat and semantic concept grouping cannot rely just on different row IDs.

**Timing:** TGS Y9 official 2026–27 plan lists the broad five topics in Autumn but places perpendicular bisectors and reverse/compound percentages in Spring, and algebraic fractions in Summer. More sophisticated radical or rational manipulation cannot be marked "taught" just because the broad Autumn topic name exists. In the rearranging and graph families, exact taught evidence remains unverified.

**Grade inflation:** routine two-step expressions and scaled repeated templates are not automatically GCSE Higher Grade 7–9. Distinguish AQA AO1 multi-step arithmetic from AO2 reasoning and AO3 applied problem-solving. The earlier source-based family screening is **79 upgrade, 17 rewrite or deduplicate, 80 taught-scope holds, 24 potentially reviewable**. These are four provisional actions, not independently externally graded scores.

## 3. What 200/200 does and does not mean

Verified by this batch:
- 200 original question IDs and answer letters cross-checked against actual student and worked-answer PDF, all source items visibly have A–F starts
- Each of 50 source Template IDs has four originals, although some templates appear at non-consecutive question numbers
- Source mathematics independently re-evaluated at 200 numbered items, with the qualification above for printed math glyphs
- Source risk classification, grading gates and Daily credit HOLD unchanged

**Not verified; none can be auto-promoted from arithmetic correctness:**
- **1,000** original wrong-option misconception derivations independently certified
- 200 genuine Grade 7+ independent AQA exam-calibrated question assessments
- 200 exact TGS class-taught-subskill confirmations, including Spring exclusions
- independent teacher/editor signoff, complete original visually exact 6-option check
- complete iPad PWA install, offline restart, recovery after write failure and first-attempt XP/MP/Mastery/Recovery end-to-end on a physical device

## 4. Release protocol

No original Maths question or modified candidate was imported into the student's canonical quiz bank, and the 200 original source IDs remain fail-closed at Maths Daily selection/scoring. Draft PR #306 **must remain Draft, not merge to main or deploy** until all independent Academic QA and Technical QA gates are met.

The next work should be the **remaining full 1,000-choice semantic distractor certification and batch redrafting of the 96 source questions labelled Upgrade/Rewrite**, plus external grade and exact taught verification. A program cannot responsibly self-certify these steps by reusing its own worked solution.

**Verdict: complete 200/200 source and mathematical first-pass evidence, formal Academic QA approved 0/200.**