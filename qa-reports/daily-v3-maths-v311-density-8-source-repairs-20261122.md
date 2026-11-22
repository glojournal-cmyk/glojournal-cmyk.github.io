# Maths V3.1.1 — Standard Form density Q41–44 and Q57–60 differentiated Academic QA candidates

**22 November 2026 | PR #306 Draft | NO ORIGINAL BANK ALTERATION | 0/200 formal Academic QA approvals**

## Exact source and separation of evidence
The original `Lux_Maths_Y9_V3_All_200_Student.pdf` and `Lux_Maths_Y9_V3_All_200_Answers.pdf` source Q41–44 and Q57–60 were rechecked by indexed source excerpts. These are the original V3.1 source answer records, **not** newly repaired answers:

| Original paper Q | Canonical ID suffix | Source correct option | Source answer | Source structure |
|---|---|:---:|---:|---|
| 41 | STANDARD_FORM-001 | F | 300 g/cm³ | Particle count × mass / volume |
| 42 | STANDARD_FORM-002 | E | 400 g/cm³ | Same core format, rescaled |
| 43 | STANDARD_FORM-003 | C | 500 g/cm³ | Same core format, rescaled |
| 44 | STANDARD_FORM-004 | A | 600 g/cm³ | Same core format, rescaled |
| 57 | STANDARD_FORM-017 | C | 300 g/cm³ | 25% mass lost before density |
| 58 | STANDARD_FORM-018 | B | 30 g/cm³ | Same core format with different exponents |
| 59 | STANDARD_FORM-019 | C | 300 g/cm³ | Identical final density as Q57 |
| 60 | STANDARD_FORM-020 | A | 30 g/cm³ | Identical final density as Q58 |

The arithmetic in those original values is correct. Concerns are **implausible context for ordinary school material**, inflated nominal difficulty and repeated mathematical operations/results. Whether individual newly authored questions are actual G7/G8 rather than routine manipulations remains to be **externally calibrated**, and taught coverage must be independently evidenced at school level.

## Seven new fully specified QA-only alternatives

The new [7-candidate JSON manifest](../qa-staging/math-v311-standard-form-density-7-repairs-20261122.json) contains the exact proposed stem, A–F options, preserved source correct-option *letter*, the worked solution and five individually described **arithmetically reconstructable hypothetical wrong workings** per item. The formerly staged [STANDARD_FORM-017 candidate](../qa-staging/math-v311-pedagogical-repair-candidates-20261122.json) remains separately in place and is **not silently overwritten**.

| Source Q | Original key | New task | Candidate correct result | Pedagogical distinction |
|---|:---:|---|---:|---|
| Q41 / 001 | F | Bulk density of counted microgranules | 0.3 g/cm³ | Single group, powers of ten and units |
| Q42 / 002 | E | Combine *two* granule groups and their occupied volumes | 0.4 g/cm³ | Combine independent contributions before dividing |
| Q43 / 003 | C | Remove 20% of mass before finding density | 0.8 g/cm³ | Percentage reduction with standard form |
| Q44 / 004 | A | Calculate **count of granules** from density, bulk volume and individual mass | 5×10¹⁴ granules | Reverse the formula, instead of another rote density |
| Q57 / 017 | C | Existing separate filter candidate | 0.3 g/cm³ | Same original QA staging, no duplicate patch |
| Q58 / 018 | B | Mix powders with unequal particle masses then lose 20% | 0.32 g/cm³ | Two distinct contributions and filtering |
| Q59 / 019 | C | Remove 25% then compact to a new volume | 0.375 g/cm³ | Distinguish original and *final* volume |
| Q60 / 020 | A | Find **additional mass** needed to reach target bulk density after filtering | 45 g extra | Reverse density using target minus retained mass |

The word **bulk** and inclusion of spaces between granules in Q41 matters; the revised sample values are intended as plausible *bulk* densities, not statements about true atomic densities. The new Q44 and Q60 explicitly ask different quantities; their numerical results must **not** be treated as densities. Current source answer-letter identity is preserved only as a migration compatibility property, not as academic approval.

## Independent arithmetic regression (not a teacher observation)
[New Node tests](../tests/daily-v3-maths-standard-form-density-7-repairs-20261122.test.mjs) recalculate **7×6=42** new source-specific A–F expressions from the described erroneous operations, check **35 specific wrong-answer candidate paths**, ensure exactly one correct letter and six distinct values in each question, confirm original 300/400/500/600 and 300/30/300/30 formulas still hold historically, and confirm the existing Q57 candidate is not silently replaced. Tests are included in the Draft branch's [Daily V3 GitHub Actions workflow](../.github/workflows/daily-v3-contract-20261122.yml).

This is strictly **mathematical traceability**, not evidence that a Year9 pupil *actually* makes all 35 errors or that these variants reach genuine Grade 7+ reasoning. Independent human academic reviewer and exam-style calibration are still mandatory.

## Remaining non-negotiable blockers
- Acquire the **exact whole source-bank raw JSON + independently computed SHA256** before any source migration, rather than editing a PDF-only record and presenting it as canonical.
- Independently verify each new topic subskill **has already been taught at TGS** and its challenge meets the parent's **true GCSE Higher Grade 7+** target.
- Audit all five wrong choices for *educational diagnostic authenticity*, not merely calculated different results. The new exercises range in cognitive load and can still be too routine for the target.
- Complete source-specific grading, independent critic QA and native MathML/iPad PWA rendering/IndexedDB fault and first-attempt persistence tests; no XP/MP/Mastery/Recovery until verified durable evidence.
- Keep **Maths formally approved 0/200**, unmerged PR #306 and Live learner data untouched.

**Verdict:** 7 new candidate alternatives + 1 prior Q57 candidate = **8 density-family QA-only proposals**, all with explicit worked alternative paths. This is **not 8 questions released**.