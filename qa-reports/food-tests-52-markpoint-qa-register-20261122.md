# Food Tests — 52 short-answer Academic QA register (22 Nov 2026)

**Disposition: NOT FULLY ACADEMIC APPROVED.** Current Draft PR #306 only. This is a reproducible source inventory and first-pass scorer acceptance record, not teacher-level final clearance.

## Scope and proven evidence

- Exact branch source: `content/topics/bio-y8-food-tests.json` · GitHub source blob `06a69b0b9c54b390fc3533eb28d5d8cf7ab5392f`.
- Total source questions: **143**; short-answer `mark_points` questions **52** with **98** separately stored mark points.
- **52/52 original model responses** receive full marks when run through the actual production QuizSession scorer.
- **6 high-risk questions / 12 individual points** now have explicit scientific evidence rules + written accepted alternative forms. These rules are in the real scoring path; tests include wrong reagents, spurious observations, concise correct answers and scientific contrasts.
- **7 question rubrics / 8 individual point definitions** repaired for compounded requests or overlap.
- 64 separate food-test case MCQ keys and evidence combinations checked, but those 64 are **not part of the 52 mark-points register**.
- **15 scored acceptance checks plus 2 contrasting explanations (17 checks)** run against the production scorer in `tests/academic-qa-food-52-markpoints-20261122.test.mjs`. Other untested paraphrases and negations remain QA risk.
- A 52 × 15 adversarial *screen* yielded 15 partial-credit events **before targeted repair**; these are not 15 independent errors (some are genuinely correct partial statements). Confirmed false-credit cases are protected by the new six-item rules; avoid extrapolating this screen to total correctness.
- Full independent question-level taught-scope, rubric fair wording, student natural-language alternatives and negative controls: **0/52 formally signed**. A correct model answer and green automation do not equal that signoff.

## 52-item status register

| ID | Marks | Current source rubric | Source/marking action | Formal approval |
|---|---:|---|---|---|
| `bio-y8-food-tests-iodine-solution-explain` | 1 | the reagent used to test for starch | evidence + alternatives guarded | **BLOCKED** |
| `bio-y8-food-tests-benedict-s-solution-explain` | 1 | the reagent used to detect reducing sugar | rubric revised | **BLOCKED** |
| `bio-y8-food-tests-biuret-solution-explain` | 1 | the reagent used to test for protein | evidence + alternatives guarded | **BLOCKED** |
| `bio-y8-food-tests-ethanol-emulsion-test-explain` | 1 | the lipid test in which ethanol is shaken with the sample before water is added | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-blue-black-explain` | 1 | the positive colour for starch after iodine is added | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-brick-red-explain` | 1 | a strong positive Benedict's result for reducing sugar after heating | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-lilac-or-purple-explain` | 1 | the positive colour produced by protein in the Biuret test | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-cloudy-white-emulsion-explain` | 1 | the positive result for lipid in the ethanol emulsion test | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-water-bath-explain` | 1 | a safe, controlled method for heating Benedict's test mixture indirectly | rubric revised | **BLOCKED** |
| `bio-y8-app-benedicts-method` | 3 | add Benedict's solution / heat in a hot-water bath / positive result changes from blue towards green, yellow, orange or brick-red | evidence + alternatives guarded | **BLOCKED** |
| `bio-y8-app-ethanol-safety` | 2 | ethanol is highly flammable, so it must be kept away from naked flames / heating is not needed for the ethanol emulsion test | rubric revised | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sample-separation` | 2 | using separate portions prevents reagent from one test interfering with the other / iodine and Benedict's tests use different reagents and conditions | rubric revised | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-repeat` | 2 | repeat the tests using fresh samples / use the same measured volume of sample and iodine | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-benedict-no-heat` | 2 | Benedict's reducing-sugar test requires heating / without heating the expected positive colour change may not occur | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-negative-sugar` | 2 | Benedict's solution remains blue / no reducing sugar was detected | evidence + alternatives guarded | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-positive-sugar` | 2 | heated Benedict's solution changes from blue to orange / reducing sugar is present | rubric revised | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-biuret-control` | 2 | use water as a negative control / it should stay blue to check for contamination | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-control` | 2 | test a known starch solution / iodine should turn blue-black | evidence + alternatives guarded | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-repeatability` | 2 | use the same volume or mass of food extract / keep the heating time or water bath temperature the same | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-cross-contamination` | 2 | reagent or food from one sample could contaminate another / contamination can cause a false positive or unreliable result | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-ethanol-emulsion-stages` | 2 | shake the food sample with ethanol / add water after shaking the sample with ethanol | rubric revised | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-ethanol-ventilation` | 2 | keep ethanol away from naked flames because it is flammable / wear safety goggles to protect eyes | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-benedict-hot-tube` | 2 | the test tube and water can be hot and cause burns / hot liquid could splash onto another person | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-protein-extraction` | 2 | crushing breaks up the sample to expose substances / mixing with water allows a testable extract to be produced | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-starch-extraction` | 2 | crushing increases exposed surface area or releases starch / iodine can contact the starch more easily | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-fair-amount` | 2 | the amount of sample is a control variable / different masses could make the comparison unfair | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-fair-reagent` | 2 | the reagent volume is not controlled / any difference in result could be due to reagent volume rather than the samples | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sugar-strength` | 2 | brick-red suggests a greater amount of reducing sugar than green / the colour test gives an approximate result rather than an exact concentration | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-cloudy-not-protein` | 2 | cloudy white is evidence for lipid in the ethanol emulsion test / protein needs a separate Biuret test | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-starch-vs-glucose` | 2 | starch was detected in the sample / reducing sugar was not detected | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sugar-vs-starch` | 2 | reducing sugar was detected / starch was not detected | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-biuret-vs-sugar` | 2 | protein was detected / reducing sugar was not detected | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-lipid-vs-starch` | 2 | lipid was detected / starch was not detected | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-all-negative` | 2 | none of starch reducing sugar protein or lipid were detected by these tests / a negative test does not prove the food contains no nutrients of any kind | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-retest-ethanol` | 2 | the sample or glassware may have been contaminated / a valid result requires the correct ethanol then water procedure | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-glassware` | 2 | labels prevent samples from being mixed up / clean tubes avoid contamination that could change results | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-eyes` | 2 | goggles reduce risk of chemicals reaching the eyes / careful handling or pipetting reduces splashes | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-heat-variable` | 2 | heating time is a variable that was changed / the colour difference might be due to heating time not sugar concentration | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-no-taste` | 2 | the sample may contain harmful or contaminated substances / laboratory substances and chemicals must not be ingested | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-recording` | 2 | record the reagent or type of test used / record the observed colour change or appearance | rubric revised | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-inference` | 2 | food tests identify some nutrient groups but not overall nutritional balance / healthiness depends on amounts and other dietary factors | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-weak-blueblack` | 2 | repeat the test with a clean sample or equipment / compare the result with a known positive and negative control | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-temperature-safety` | 2 | a water bath provides more even or controlled heating / indirect heating lowers the risk of splashing or overheating | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-test-plan` | 2 | iodine test for starch gives blue-black / ethanol emulsion test for fat gives cloudy white | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-positive-protein-negative-fat` | 2 | purple Biuret is a positive test for protein / no cloudy emulsion means lipid was not detected | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-result-not-proof` | 2 | the test did not detect reducing sugar under the test conditions / sweetness does not prove that a reducing sugar is present | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-wrong-reagent` | 2 | iodine tests for starch not protein / Biuret reagent is required to test for protein | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-uncertain-emulsion` | 2 | the control suggests contamination or a problem with reagents / repeat using fresh clean equipment and reagents | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-no-heat` | 2 | iodine starch testing does not require heating / add iodine solution to the sample and observe whether it turns blue-black | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-safe-bunsen` | 2 | ethanol vapour is flammable / an open flame can ignite the ethanol causing fire | model test only; variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-unknown-analysis` | 3 | starch is present / protein is present / lipid was not detected | evidence + alternatives guarded | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sugar-analysis` | 3 | reducing sugar is present / starch was not detected / protein was not detected | model test only; variants pending | **BLOCKED** |

## Remaining release blockers

1. Manually validate equivalent English responses on all 52 items, including alternative wording, negatives, partial marks and contradictory statements; avoid treating high similarity as semantic correctness.
2. Validate distinct, independently creditable facts for two- and three-mark tasks and whether prompts fairly request them.
3. Review all science equipment and safety instructions against the school worksheet, with specific attention to unheated ethanol emulsion vs heated Benedict's.
4. Check question uniqueness/concept duplication in the daily bank and prevent `mark_points` self-practice or assisted answers from minting formal XP/MP.
5. Run final browser/iPad WebKit scorer acceptance and independent Academic QA before any Live import.

**Decision: keep PR Draft and all unapproved Academic QA gates closed.**
