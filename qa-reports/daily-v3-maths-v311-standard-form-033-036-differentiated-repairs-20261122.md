# Maths V3.1.1 — Original Standard Form 033–036, differentiated replacement candidates

**22 November 2026 | Draft PR #306 | STAGING ONLY — DO NOT MERGE INTO BANK OR ENABLE CREDIT**

## Source and independent arithmetic evidence

The original student/answer PDFs `Lux_Maths_Y9_V3_All_200_Student.pdf`, Q73–76, and `Lux_Maths_Y9_V3_All_200_Answers.pdf`, Q73–76, all yield exactly **1.116×10^5 g**. The source scales both mass and packet counts together, so four distinct IDs do not provide four distinct opportunities to reason. Each original packet would weigh 111.6 kg — unlikely for an ordinary retail packet, even though the equation is arithmetically correct.

A QA-only source-specific [four-question candidate manifest](../qa-staging/math-v311-standard-form-033-036-distinct-replacements-20261122.json) now contains complete alternate stems, A–F responses, step-by-step solutions and 20 explicitly worked wrong-operation rationales. This is **not a patch against the unavailable full raw 200-question bank**. It cannot be imported without raw source digest, independent teacher/grade/pedagogy signoff and physical device QA.

## Key-preserving proposed replacements

| Original source ID | Original answer | Candidate correct option | Candidate result | Differentiated mathematical step |
|---|---:|:---:|---:|---|
| `STANDARD_FORM-033` (paper Q73) | 1.116×10^5 g | **B** | **1.116×10^2 g** | Combine masses, lose 10%, divide by a realistic larger packet count |
| `STANDARD_FORM-034` (Q74) | 1.116×10^5 g | **F** | **1.4375×10^2 g** | Lose 15%, **then** reserve a fixed quantity before packaging |
| `STANDARD_FORM-035` (Q75) | 1.116×10^5 g | **C** | **9×10^8 g** *(original starting mass)* | **Inverse percentage**: subtract a later addition and reverse 20% loss |
| `STANDARD_FORM-036` (Q76) | 1.116×10^5 g | **B** | **9×10^1 g** | Two **successive** percentage losses, not a combined percentage |

Source paper variants' correct option letters B/F/C/B have been preserved in staging, but the numerical answers and stems differ. Because Q75 asks a different quantity (initial mass), **do not compare candidate outputs as if all four were grams per packet**. Its proposed context and answer are explicitly changed; a curriculum reviewer must decide whether that differentiated inverse step is suitable for Year9 Standard Form.

### Reproducible wrong-operation evidence (candidate only)

- **033 / new key B:** A skips the 10% loss (124 g), C adds 10% (136.4 g), D omits the added stock (108 g), E uses removed 10% as remaining mass (12.4 g), F misreads packet exponent by one power of ten (1116 g).
- **034 / new key F:** A omits the testing reserve (148.75 g), B applies 15% loss twice (121.4375 g), C adds the reserve instead of subtracting (153.75 g), D reserves before rather than after loss (144.5 g), E retains 15% rather than 85% (21.25 g).
- **035 / new key C:** A omits reverse-percentage step (7.2×10^8 g), B divides by 20% instead of 80% (3.6×10^9 g), D adds rather than subtracts the top-up (1.2×10^9 g), E multiplies by 80% again (5.76×10^8 g), F forgets to subtract the top-up (1.05×10^9 g).
- **036 / new key B:** A incorrectly adds losses to 45% (82.5 g), C ignores initial 20% (112.5 g), D ignores second 25% (120 g), E treats 20% as retained (22.5 g), F treats 25% rejection as 25% increase (150 g).

The new [independent-calculation Node test](../tests/daily-v3-maths-standard-form-033-036-repair-20261122.test.mjs) checks all 24 candidate option values, 20 wrong arithmetic pathways, no duplicate A–F numerical options, preserved source key letters and the four original identical calculations.

## Academic QA limitations and release decision

**Maths academic release remains 0/200**, because a true Grade7+ target and precise school taught-scope are unverified; original full raw JSON/hash and all source migration/MathML/iPad error handling are still absent. These 20 alternatives are **reconstructable mathematical wrong paths**, not 20 separately teacher-observed common mistakes. A reviewer must independently evaluate authenticity and challenge — plausible arithmetic does not automatically make a strong GCSE Higher distractor.

**Status:** `QA_STAGING_NOT_APPROVED`. Original V3 bank unchanged; Maths Daily supply and XP/MP/Mastery/Recovery remain blocked. No merged source changes or Live learner effect.