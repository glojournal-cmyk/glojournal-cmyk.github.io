# Lux et Labor — Revised Maths 200: educational challenge and actual-class-taught QA triage

**22 November 2026 · Draft PR #306 · 200 mathematically checked question keys · 1,000/1,000 wrong results causally reconstructable · 0/200 formally educationally approved**

## Direct source examined

Exact current revised draft \`qa-staging/math-v311-reviewed-200.json\`. A new **200-row individual register** was written to [educational-grade-and-taught-gates](../qa-staging/math-v311-revised200-educational-grade-and-taught-gates-20261122.json); it records each item's original ID, revision ID, topic, previous *original-source* triage, provisional demand/teaching risk, five mathematically reconstructable wrong alternatives, and explicit **HOLD** decision. This is a triage document, **not** independent benchmark certification.

External standards checked:
- [The Tiffin Girls' School — Mathematics Department](https://www.tiffingirls.org/academic/subject-departments/mathematics/) exposes the Year 9 Curriculum Outline and describes broader mathematical extension, but the **2026–27 Year 9 outline PDF could not be reopened during this pass** (web fetch cache miss). Previously recorded term-to-topic mapping remains *prior QA evidence*, not new proof that the pupil's Set 1 teacher has completed each subskill.
- [AQA 8300 — Scheme of assessment](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment) defines AO1 as standard techniques **including routine multi-step procedures**, AO2 as mathematical reasoning, and AO3 as problem-solving and connection-making. At Higher tier its overall assessment objective balance is **AO1 40%, AO2 30%, AO3 30%**. This is an **exam-level weighting, not a required distribution across our 200 questions**. There is no supported rule that a specified number of steps or the AO name by itself proves Grade7+.

## Revised candidate Year 9 teaching-scope attention queue (76 IDs)

| Topic | IDs requiring priority exact taught-subskill evidence | Why | Status |
|---|---|---|---|
| **Indices** | \`INDICES-029..040\` = **12** | Square-root / fractional-power and exponent follow-up, beyond proof from a generic indices heading | HOLD |
| **Standard Form** | \`STANDARD_FORM-021..024\`, \`033..040\` = **12** | Relative percentage, successive loss and reverse-percentage depth; exact term/class timing not shown | HOLD |
| **Changing the Subject** | \`REARRANGING-001..040\` = **40** | Rational, nested reciprocal, square-root rearrangement, domain restrictions and roots | HOLD |
| **Straight-Line Graphs** | \`GRAPHS-005..008\`, \`017..020\`, \`037..040\` = **12** | Perpendicular-bisector/loci-related subskill, previously mapped to Spring | HOLD |
| **Total** | **76 individual revised IDs** | **Prioritised** for specific class-taught evidence, not asserted to be untaught | **76 HOLD** |

The other **124/200** also require **individual exact classroom-taught evidence**, although their subskills have less conspicuous term-placement risk from the previously transcribed school plan. **No item is automatically eligible merely because the topic heading is Autumn.** A pupil could have covered some material early; this register does not assert otherwise.

## Difficulty and diagnosis: concrete concerns in the actual revised bank

- **Indices:** \`001..004\` contain more nonroutine thought (cube/strict bounds, inequality across exponential forms, HCF/LCM, general identity) and merit authentic AQA Higher item comparison. \`005..024\` mainly repeat numerical power laws, substitution and exponent matching; being multi-step or containing negative powers does not by itself establish Grade7+. \`029..040\` use more complicated roots but several reuse the same exponent reduction, so they cannot be counted as distinct Mastery concepts without evidence.
- **Standard Form:** \`001..004\`, \`017..020\`, \`033..040\` have revised realistic or explicit hypothetical contexts and several arithmetic stages, but some still reduce to a conventional density/percentage formula. \`005..016\` and \`029..032\` contain repeated structured arithmetic whose demandingness must be calibrated independently.
- **Changing the Subject:** twenty-eight original forms shared a fractional-linear mathematical core. The revised roots and reciprocal expressions need domain/branch proof, but five wrong-formula routes and a complicated printed fraction do not certify Grade7–9. Identify independent technique demand rather than giving four numerical variants four Mastery concepts.
- **Straight-Line Graphs:** intersection/parallel/perpendicular questions may combine techniques, whereas perpendicular-bisector source families pose scope risk. Some high-labelled variants share a common coordinate calculation. True AO2/AO3 demand must be shown against exemplar questions, not inferred from needing three lines of working.
- **Simultaneous Equations:** several \`001..012\`, \`017..032\` questions are elimination/substitution then a short expression, potentially routine AO1. \`013..016\` use a simple proportionality/parallel-not-coincident check. \`037..040\` have parameter \(k\) in both coefficients and are potentially more reasoning-demanding; these also need external calibration. Word problems \`005..008\`, \`017..020\`, \`025..028\` may involve AO3 formulation but repeated templates don't ensure independent challenge.

## Correct mathematical wrong result versus authentic pupil misconception

All 1,000 revised wrong-option numbers/formulas were reproduced by the stated erroneous operation (the single Q11-F explanation mismatch was repaired), but **the independent pupil-typical misconception evidence remains 0/1,000**. The earlier 393 repeated-rationale strings are a concentrated *pedagogy review risk*; reuse can also be legitimate for the same mistake across variants. Numeric causality alone does not establish how often a real student would select the wrong alternative or whether the selected misconception is diagnostic at Higher Grade7+.

Any eventual intake gate must require individually inspected source-specific challenge and taught evidence and an independent pedagogical second review. The supplied 200-item ledger contains **no fabricated reviewer names, Grade7+ approvals or assumed class progress**.

## Explicit next decisions
- **Correct answers and five wrong-maths pathways:** mathematically reconstructed in the staged revised bank (200/200 keys, 1,000/1,000 wrong choices).
- **Independent Grade7+ standardisation:** **0/200 approved**.
- **Actual TGS Year9 Set1 classroom-taught proof:** **0/200 signed off**.
- **Independent pupil-common misconception realism:** **0/1,000 signed off**.
- **Browser/real iPad PWA and progress writes:** not signed off; latest completed-green CI remains unverified.
- **Student credit:** **0/200**. PR #306 remains Draft, no merge, live import, XP/MP/Mastery/Recovery change.

This distinction must remain visible in PR review and daily-task intake so that successful mathematical regression testing can never silently unlock formal student credit.
