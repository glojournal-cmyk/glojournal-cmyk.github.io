# Maths Academic QA V3.1.8 — Three former low-demand drafts rebuilt as constrained reasoning

**Date:** 23 November 2026  
**Draft PR:** [#306](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/pull/306)  
**Release decision:** **BLOCKED** — original 200 Maths questions still excluded from Daily; **0/200 formal Academic QA approvals**.

## Exact sources and unchanged student state

Reopened the original [V311 revised 200-question source bank](../qa-staging/math-v311-reviewed-200.json) at Git blob `0655fbc1b796bff68f533c060a43339dff6664be`, the existing [V315 candidate pack](../qa-staging/math-v315-indices017-025-standard009-025-distinct-reasoning-candidates-20261123.json) and the [V317 eight-question AO challenge screen](../qa-staging/math-v317-eight-candidate-grade-demand-and-six-concept-overlap-evidence-20261123.json). Source bank untouched. V315 candidates untouched as a historical audit trail. The three new source-linked versions live only in the [V318 QA-only candidate pack](../qa-staging/math-v318-three-lower-demand-indices-standard-replacements-20261123.json).

The original Maths bank remains `200/200 dailyEligible:false`. Neither user progress nor XP/MP/Mastery/Recovery data was read or written. This QA does not purport to have performed physical iPad PWA testing, teacher-led curriculum confirmation or independent Grade7 calibration. TGS curriculum PDF deliberately not retrieved, as requested.

## Why all three V315 versions needed replacing

The [AQA GCSE Mathematics 8300 assessment objectives](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment) make clear that **AO1 can include routine multi-step procedures**. AO2 requires mathematical deduction and communication; AO3 requires selecting models, making connections and interpreting results. AQA's [Inside Assessment mathematics marking explanation](https://www.aqa.org.uk/professional-development/inside-assessment/bringing-assessment-to-life/mathematics) emphasises awarding credit for valid method and intermediate mathematical reasoning. This supports MCQ as additional diagnostic practice, **not a substitute for an actual written GCSE answer**.

| Exact source ID | V315 risk | V318 repair: essential choice now required | Derived correct option |
|---|---|---|---|
| `INDICES-025` | Simplify one ratio and list n with even exponent, a narrow routine parity check | Solve simultaneous square-power **product** and **ratio** constraints on two distinct integers, then enumerate all admissible pairs and sum the second variable | **D — 24** |
| `STANDARD_FORM-009` | Obvious subtract-divide-ceiling sequence with one container type | Translate a mixed container-capacity, required headroom, maximum item count and **cost minimisation** into a feasible integer choice | **C — (3 A, 2 B, £250)** |
| `STANDARD_FORM-025` | Step-by-step volume conversion, percentage reduction and final adjustment | Invert a concentration model, match one of four available compressed volumes with **whole sealed particle packs**, enforce the three-pack cap and **maximise feasible volume** | **C — (v,p)=(2,3)** |

### Mathematically derived reasoning and answer uniqueness

**INDICES-025:** For integer t≥3, \(Q(t)=2^{3t-1}/4^{t+1}=2^{t-3}\). Each selected Q must be an integer square, so n and m are odd. \(Q(n)Q(m)=2^{14}\) gives n+m=20. \(Q(m)/Q(n)\le2^6\) gives m−n≤6, with n<m. Exactly (n,m)=(7,13) and (9,11) remain. The requested sum of m is **24**. Wrong choices reproduce omitting one valid pair, summing n rather than m, treating the ratio limit as 2¹⁰, or ignoring it entirely.

**STANDARD_FORM-009:** Retained material is 600,000−30,000=570,000 g. Usable A capacity is 85%×120,000=102,000 g at £40; usable B capacity is 90%×150,000=135,000 g at £65. Even four large B containers cannot hold the material (540,000 g); **five** are required. Feasible five-container combinations are (3A,2B) £250, (2A,3B) £275, (1A,4B) £300 and (0A,5B) £325. The correct minimum is **£250**. Other options violate safety capacity, the five-container limit or minimise cost incorrectly.

**STANDARD_FORM-025:** Initial count is (0.0025 m³)(10⁶ cm³/m³)(4000/cm³)=10,000,000 particles. After 25% filtering, 7,500,000 remain. p sealed packs add 1.5m particles each. Desired target concentration 6000/cm³ at chamber volume v×10⁻³ m³ gives \(7.5m+1.5m p=6m v\) and therefore \(v=1.25+0.25p\). With p=0,1,2,3, possible v are 1.25,1.5,1.75,2. The allowed volumes are 1.5,1.75,2,2.25. Largest feasible is **v=2** with **p=3**. Distractors include choosing a volume that needs too many packs, choosing a smaller feasible volume, and selecting a concentration that is mathematically wrong.

## Exact technical controls, independent calculations and limitations

- V318 has **three** source-linked but separately versioned QA candidate records, **18** unique A–F answer strings and **15** source-specific wrong-route explanations; old canonical stems, keys and topic IDs are retained in lineage.
- Directly exercised the App native offline renderer on the full set: **30/30 MathML fields parsed** (three stems + eighteen options + nine worked steps).
- [Five Node regression tests](../tests/daily-v3-maths-v318-three-constraint-transfer-independent-20261123.test.mjs) recompute solutions **from the current stem coefficients**, enumerate admissible integer pairs and container/particle configurations, and inspect all six options per item rather than accepting stored answer letters.
- Adversarial mutations tighten the ratio limit, change retained factory mass, or alter the chamber's filter loss, and require previously selected answers to fail the rederived constraints.
- Numeric reproducibility is **not empirical proof** that real students would choose a distractor; neither it nor a new multi-constraint setting establishes an official per-MCQ GCSE Grade 7+ rating. The intended AO2/AO3 demand still needs a genuinely independent education assessor and exact taught-curriculum evidence. Extra number-theory or integer-programming complexity should not be mistaken for automatically age-appropriate Higher content.

## Release gate

| Gate | Status |
|---|---|
| Original V311 200/200 | **unchanged**, all student Daily disabled |
| Three V318 rewritten drafts | QA-only, `academicQA:pending` |
| Six options and worked steps | complete; 30/30 native formula fields parsed |
| Grade 7+ independent calibration | **not certified** |
| TGS Year 9 exact taught skills | **not verified**; school PDF skipped per parent instruction |
| Empirical real-pupil distractor relevance | **not verified** |
| Physical iPad PWA, offline and score persistence | **not signed off** |
| Release approval | **0/200**; **NO MERGE / NO DEPLOY / NO XP / MP / Mastery / Recovery credit** |

**Further substantive Academic QA:** review whether the new integer constraints introduce taught-scope mismatch, check whether Standard Form modelling dominates actual standard-form fluency, and compare the stronger drafts to a representative set of Higher GCSE reasoning questions under a real examiner-style written mark scheme. Technical CI, even if green, does not satisfy these separate educational gates.
