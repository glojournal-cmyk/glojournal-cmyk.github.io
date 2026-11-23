# Lux et Labor — Revised Standard Form Q013–Q016: independent mathematical and academic QA

**23 November 2026 · PR #306 Draft · new QA candidates only · NO LIVE IMPORT · Formal Academic QA approvals 0/200**

## What was reopened

Reopened the **actual current** revised 200-question source:
\`qa-staging/math-v311-reviewed-200.json\`, items \`LUX-MATH-Y9-STANDARD_FORM-013..016\`. All four original stems are only numerical variations on the same formula:

\[
\frac{(a\times10^m)-(b\times10^{m-1})}{c\times10^{m-2}}
\]

Their original keys are mathematically valid, but four parameter permutations do **not** demonstrate four independent Grade7+ AO2/AO3 tasks. The original revised-bank file itself is **unchanged**.

## Four separate new versioned candidates

New standalone source:
\`qa-staging/math-v312-standard-form013-016-reasoning-replacement-candidates-20261123.json\`.
These are **proposals** keyed by existing source IDs with separate \`V312-REASONING-CANDIDATE\` revision IDs, not a promotion of the old revision. They remain isolated from the learner's 200-item Daily supply.

| Candidate ID | Distinct test objective | Correct answer | Key | Main reasoning demand |
|---|---|---|---|---|
| **STANDARD_FORM-013** | Compressed data in scientific notation; choose **cheapest mix** of two different-capacity, differently priced drives | **£174** (2 A + 2 B drives) | **B** | Discrete optimisation with a capacity inequality, justify minimal total cost |
| **STANDARD_FORM-014** | Mass/volume each stated to two significant figures; **upper bound** of density to 3 sf | **\(4.72\times10^2\) g/cm³** | **E** | Distinguish upper numerator/lower denominator bounds and round correctly |
| **STANDARD_FORM-015** | Material A loses 20%, material B loses 10%; reverse a two-part **mass balance** | **\(4.5\times10^8\) g** | **A** | Model two distinct retained proportions; undo only B's percentage loss |
| **STANDARD_FORM-016** | A square is scaled up; original side in mm, new area in cm²; find **length scale factor** | **\(2.5\times10^1\)** | **E** | Square scaling, unit conversion, positive square root |

Q013 was strengthened again after initial draft review: counting the number of drives alone was too close to routine multi-step AO1. The updated version needs integer resource allocation and minimisation; 2 A-drives plus 2 B-drives give capacity \(2.6\times10^9\) bytes for £174, the smallest cost among feasible nonnegative integral combinations. A tempting £160 option using 5 A-drives has only \(2.5\times10^9\) bytes capacity and **cannot** hold the \(2.52\times10^9\) bytes.

Q015 was also strengthened after review: a single 15% inverse percentage task did not adequately distinguish methods. Now \(.8(3.2\times10^8)+.9x=6.61\times10^8\), so \(x=(6.61-2.56)\times10^8/.9=4.5\times10^8\) g. The two percentages **must not** be applied uniformly.

### Independently reconstructed math and negative tests

The versioned Node test:
\`tests/daily-v3-maths-standard-form013-016-v312-grade-reasoning-candidates-20261123.test.mjs\`

1. Parses **the actual current question stems** and derives Q013 by integer A/B enumeration, Q014 from the actual mantissas/rounding precisions, Q015 by separately applying the two stated retention rates, and Q016 by converting lengths, comparing square areas, then solving for the scale factor.
2. Calculates **4/4 correct answers** and matches **20/20 incorrect option results** to their specific mathematically reproducible wrong paths; verifies exactly six distinct choices per question.
3. Renders **all four stems, 24 answer options and twelve written explanation steps** through the real native offline MathML functions. In the first independent render pass, a \`\ldots\` command in a Q014 worked line was unsupported by the renderer; this was **repaired in the staged explanation**, without changing the mathematics.
4. Rejects deliberate corruptions: incorrect stored key, incorrect wrong-option value, changed stem parameters, and an attempted \`dailyEligible:true\` forge — **all 4 negative mutation classes tested on all four questions**.
5. Checks the archived 200-row revised Maths bank remains unchanged and \`dailyEligible:false\` across all 200 entries.

**Independent JS V8 execution:** 2/2 test cases PASS after the updated Q013 integer optimisation and Q015 two-material reverse-percentage revision. These cases internally check all 4 correct answers, 20 wrong paths, 24 MathML options and source mutation safeguards. The test is committed and wired into existing GitHub Actions push/PR path filters, syntax checker and Node unit command. **A completed-green official GitHub Actions run has NOT been independently retrieved**, nor has a physical iPad WebKit/PWA reload been certified. Do not call these tests an official CI or end-user PASS.

## Independent educational standards — separate HOLD

[AQA Mathematics 8300, scheme of assessment](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment): routine multi-step techniques are AO1; AO2 requires actual reasoning/deduction and AO3 requires formulating or connecting maths to solve a problem. **More steps and six plausible options do not establish Grade7+ by themselves**.

Provisional challenge judgement:
- **Q013:** promising AO3 resource allocation/feasibility/optimisation, but requires authentic Higher question difficulty calibration, not merely a correctly solved context.
- **Q014:** upper bound quotient is appropriate reasoning beyond plain scientific arithmetic, but the student's current **bounds teaching** is not independently verified.
- **Q015:** the two different losses require modelling, but may still be relatively routine for a strong Higher learner; **Grade7+ level is not established**.
- **Q016:** scale factor/unit-area link is useful cross-topic reasoning, but may be routine depending on year group; actual similarity topic timing must be checked.

[The Tiffin Girls' School Mathematics Department](https://www.tiffingirls.org/academic/subject-departments/mathematics/) links a *Year 9 2026–27 Curriculum Outline*. Its exact PDF at \`Year-9-Maths-2026-2027.pdf\` returned a cache miss on direct retrieval; this review cannot assert actual current Year9 Set1 coverage of **bounds, integer optimisation, reverse percentages or similarity**. The fact that the pupil studies Year 9 Standard Form does **not** demonstrate these adjacent subskills have been taught.

No actual Year9 pupil response statistics or independent pedagogical reviewer supports calling all 20 wrong-route methods authentic, likely misconceptions. The errors are mathematically reproducible **candidate distractors**, not certified diagnostic mistakes.

## Formal release disposition

- Source revised **200-item bank: unchanged**, formally accepted **0/200**.
- Four proposed Standard Form replacements: **0/4 independently educationally approved**, **0/4 Daily/MP/Mastery eligible**.
- Four separate earlier Indices reasoning candidates are also still staged and unapproved; these eight candidate alternatives **do not** expand or overwrite the current 200-row source.
- PR #306 remains Draft. **No merge, deployment or student XP/MP/Mastery/Recovery write.**
- Required next: independent AQA Higher Grade7+ calibration, exact taught-subskill evidence, misconception realism review, official CI and real iPad PWA integrity before any promotion.
