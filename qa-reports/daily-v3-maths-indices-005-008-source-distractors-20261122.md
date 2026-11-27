# Maths V3.1 — exact source review of INDICES-005..008

**Status: PEDAGOGICAL REASONING REVIEW ONLY — NOT ACADEMIC QA APPROVED.** Source is the original archived `Lux_Maths_Y9_V3_All_200_Student.pdf`, pages 2–3, checked against `Lux_Maths_Y9_V3_All_200_Answers.pdf`, pages 1–2; the PDF displays are authoritative for option letters. The equations below reconstruct the same printed question family and do not silently edit the original source.

Each original problem has the structure `(4^a × 8^(-b))² / 2^(-c)`. The correct exponent is `2(2a − 3b) + c`. A student who **misreads 8^(-b) as 8^(+b)** obtains `2(2a + 3b) + c`; the large distractor in every variant matches this particular operation.

| Original question | Exponents (a,b,c) | Correct exponent and result | Wrong sign exponent and value | Printed wrong option |
|---|---|---|---|---|
| Q5 / `LUX-MATH-Y9-INDICES-005` | (2, 1, 2) | 4 → 16 | 16 → 65536 | D |
| Q6 / `LUX-MATH-Y9-INDICES-006` | (3, 2, 3) | 3 → 8 | 27 → 134217728 | D |
| Q7 / `LUX-MATH-Y9-INDICES-007` | (4, 3, 4) | 2 → 4 | 38 → 274877906944 | B |
| Q8 / `LUX-MATH-Y9-INDICES-008` | (5, 4, 5) | 1 → 2 | 49 → 562949953421312 | E |

**QA finding:** All **4/4 extremely large distractors are mathematically reproducible** from the same genuine negative-index misconception; a large numerical value alone is not grounds to delete the option. This does not show that four variants test different concepts, and no Grade 7 calibration, TGS individual-subskill confirmation, complete A–F choice review or teacher signoff has been established.

**Risk:** `INDICES-005..008` use one common idea and closely repeated template, so should be grouped by a single semantic concept family in anti-repetition selection; numerical variants alone must not mint four new Mastery concepts.

**App actions:** No source 200-bank JSON, answer key, student credit, XP, MP or Live app changed. Signoff stays blocked pending all six choices and whole-question curriculum review.

**Executable proof:** `tests/daily-v3-maths-indices-005-008-distractor-qa-20261122.test.mjs`.
