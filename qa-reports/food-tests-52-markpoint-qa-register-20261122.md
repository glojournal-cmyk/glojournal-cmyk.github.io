# Food Tests — source-level Academic QA / marking fairness register

**Review date:** 22 November 2026  
**Repo / branch:** `glojournal-cmyk/glojournal-cmyk.github.io` / `feature/daily-tasks-v3-20261122`  
**Exact source:** `content/topics/bio-y8-food-tests.json` · Git blob `c35fabad5dbe7edf5b81901af01bc29eab39d178`  
**Decision:** **ALL 52 SOURCE-SCREENED, ZERO INDEPENDENTLY ACADEMIC APPROVED**. PR #306 remains Draft/unmerged. This is tested scoring engineering and source-level academic scrutiny, not curriculum/teacher signing.

## Coverage & scoring evidence

- Exactly **52 short-response mark_points items / 98 separately defined mark points** in a total Food Tests bank of **143** questions.
- The first **6 high-risk questions / 12 points** retain previously implemented question-specific scientific-evidence constraints and alternative answers. This continuation adds **46 questions / 86 points** from `qa-staging/food-tests-46-markpoint-evidence-draft-20261122.json`.
- **All 52 questions** now contain `answer.markPointEvidence` and `answer.markPointAlternatives` for each mark, and `answer.markPointQAStatus=SOURCE_LEVEL_SCREENED_INDEPENDENT_SIGNOFF_PENDING`. **None are marked `academicQA: approved`.**
- The actual `assets/quiz-session-rWAnuDVj.js` scorer retains the general semantic matcher but requires the **item-specific science evidence** to be present before an audited point may be credited.
- Direct source-level V8 tests, using the actual fetched current QuizSession scorer: **52/52 full model answers score correctly**, **86/86 newly documented shorter correct alternatives score their own mark only**, **86/86 full-proposition denials do not score that point**, and **598/598 specified false-science challenges produce no marks for the new 46-item bank**. The pre-existing six-item positive/negative acceptance suite and the 64 Food Tests case-key/numeric tests also pass.
- The 598 checks cover **13 fixed known-wrong sentences per question**; they do **not** prove that all possible misconceptions or misleading responses are rejected.
- In the preceding editing wave, **7 rubrics / 8 mark-point definitions** were clarified. This wave additionally rewrote `fair-amount` into two separately creditable demands: identify equal mass as the control variable, and explain the risk of interpreting unequal sample masses.

## Source-specific QA register (all 52)

| Question ID | Marks | Current independent mark points | Marking coverage | Independent QA release |
|---|---:|---|---|---|
| `bio-y8-food-tests-iodine-solution-explain` | 1 | 1. the reagent used to test for starch | Initial high-risk guard + 17 acceptance checks;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-benedict-s-solution-explain` | 1 | 1. the reagent used to detect reducing sugar | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-biuret-solution-explain` | 1 | 1. the reagent used to test for protein | Initial high-risk guard + 17 acceptance checks;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-ethanol-emulsion-test-explain` | 1 | 1. the lipid test in which ethanol is shaken with the sample before water is added | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-blue-black-explain` | 1 | 1. the positive colour for starch after iodine is added | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-brick-red-explain` | 1 | 1. a strong positive Benedict's result for reducing sugar after heating | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-lilac-or-purple-explain` | 1 | 1. the positive colour produced by protein in the Biuret test | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-cloudy-white-emulsion-explain` | 1 | 1. the positive result for lipid in the ethanol emulsion test | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-water-bath-explain` | 1 | 1. a safe, controlled method for heating Benedict's test mixture indirectly | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-app-benedicts-method` | 3 | 1. add Benedict's solution; 2. heat in a hot-water bath; 3. positive result changes from blue towards green, yellow, orange or brick-red | Initial high-risk guard + 17 acceptance checks;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-app-ethanol-safety` | 2 | 1. ethanol is highly flammable, so it must be kept away from naked flames; 2. heating is not needed for the ethanol emulsion test | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sample-separation` | 2 | 1. using separate portions prevents reagent from one test interfering with the other; 2. iodine and Benedict's tests use different reagents and conditions | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-repeat` | 2 | 1. repeat the tests using fresh samples; 2. use the same measured volume of sample and iodine | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-benedict-no-heat` | 2 | 1. Benedict's reducing-sugar test requires heating; 2. without heating the expected positive colour change may not occur | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-negative-sugar` | 2 | 1. Benedict's solution remains blue; 2. no reducing sugar was detected | Initial high-risk guard + 17 acceptance checks;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-positive-sugar` | 2 | 1. heated Benedict's solution changes from blue to orange; 2. reducing sugar is present | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-biuret-control` | 2 | 1. use water as a negative control; 2. it should stay blue to check for contamination | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-control` | 2 | 1. test a known starch solution; 2. iodine should turn blue-black | Initial high-risk guard + 17 acceptance checks;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-repeatability` | 2 | 1. use the same volume or mass of food extract; 2. keep the heating time or water bath temperature the same | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-cross-contamination` | 2 | 1. reagent or food from one sample could contaminate another; 2. contamination can cause a false positive or unreliable result | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-ethanol-emulsion-stages` | 2 | 1. shake the food sample with ethanol; 2. add water after shaking the sample with ethanol | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-ethanol-ventilation` | 2 | 1. keep ethanol away from naked flames because it is flammable; 2. wear safety goggles to protect eyes | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-benedict-hot-tube` | 2 | 1. the test tube and water can be hot and cause burns; 2. hot liquid could splash onto another person | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-protein-extraction` | 2 | 1. crushing breaks up the sample to expose substances; 2. mixing with water allows a testable extract to be produced | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-starch-extraction` | 2 | 1. crushing increases exposed surface area or releases starch; 2. iodine can contact the starch more easily | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-fair-amount` | 2 | 1. keep the mass of each bread sample the same; 2. unequal bread sample masses could cause a difference in the iodine result unrelated to whether starch was present | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-fair-reagent` | 2 | 1. the reagent volume is not controlled; 2. any difference in result could be due to reagent volume rather than the samples | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sugar-strength` | 2 | 1. brick-red suggests a greater amount of reducing sugar than green; 2. the colour test gives an approximate result rather than an exact concentration | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-cloudy-not-protein` | 2 | 1. cloudy white is evidence for lipid in the ethanol emulsion test; 2. protein needs a separate Biuret test | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-starch-vs-glucose` | 2 | 1. starch was detected in the sample; 2. reducing sugar was not detected | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sugar-vs-starch` | 2 | 1. reducing sugar was detected; 2. starch was not detected | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-biuret-vs-sugar` | 2 | 1. protein was detected; 2. reducing sugar was not detected | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-lipid-vs-starch` | 2 | 1. lipid was detected; 2. starch was not detected | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-all-negative` | 2 | 1. none of starch reducing sugar protein or lipid were detected by these tests; 2. a negative test does not prove the food contains no nutrients of any kind | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-retest-ethanol` | 2 | 1. the sample or glassware may have been contaminated; 2. a valid result requires the correct ethanol then water procedure | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-glassware` | 2 | 1. labels prevent samples from being mixed up; 2. clean tubes avoid contamination that could change results | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-eyes` | 2 | 1. goggles reduce risk of chemicals reaching the eyes; 2. careful handling or pipetting reduces splashes | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-heat-variable` | 2 | 1. heating time is a variable that was changed; 2. the colour difference might be due to heating time not sugar concentration | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-no-taste` | 2 | 1. the sample may contain harmful or contaminated substances; 2. laboratory substances and chemicals must not be ingested | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-recording` | 2 | 1. record the reagent or type of test used; 2. record the observed colour change or appearance | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-inference` | 2 | 1. food tests identify some nutrient groups but not overall nutritional balance; 2. healthiness depends on amounts and other dietary factors | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-weak-blueblack` | 2 | 1. repeat the test with a clean sample or equipment; 2. compare the result with a known positive and negative control | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-temperature-safety` | 2 | 1. a water bath provides more even or controlled heating; 2. indirect heating lowers the risk of splashing or overheating | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-test-plan` | 2 | 1. iodine test for starch gives blue-black; 2. ethanol emulsion test for fat gives cloudy white | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-positive-protein-negative-fat` | 2 | 1. purple Biuret is a positive test for protein; 2. no cloudy emulsion means lipid was not detected | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-result-not-proof` | 2 | 1. the test did not detect reducing sugar under the test conditions; 2. sweetness does not prove that a reducing sugar is present | 46-item evidence + 86-answer test;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-wrong-reagent` | 2 | 1. iodine tests for starch not protein; 2. Biuret reagent is required to test for protein | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-uncertain-emulsion` | 2 | 1. the control suggests contamination or a problem with reagents; 2. repeat using fresh clean equipment and reagents | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-no-heat` | 2 | 1. iodine starch testing does not require heating; 2. add iodine solution to the sample and observe whether it turns blue-black | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-safe-bunsen` | 2 | 1. ethanol vapour is flammable; 2. an open flame can ignite the ethanol causing fire | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-unknown-analysis` | 3 | 1. starch is present; 2. protein is present; 3. lipid was not detected | Initial high-risk guard + 17 acceptance checks;  **HIGH: more legitimate variants / rubric review** | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sugar-analysis` | 3 | 1. reducing sugar is present; 2. starch was not detected; 3. protein was not detected | 46-item evidence + 86-answer test;  More natural-language variants pending | **BLOCKED** |

## Confirmed scientific method and sources

The content distinguishes the **heated water-bath Benedict's reducing-sugar test** from the **unheated ethanol emulsion lipid test**. Check these against the school's *actual* taught method as part of the independent QA:
- [AQA GCSE Biology Food Tests practical guidance](https://filestore.aqa.org.uk/resources/biology/AQA-8461-PRACTICALS.PDF) (food tests: Benedict's, iodine, Biuret; practical equipment and control samples)
- [Philip Harris GCSE food test methods](https://www.philipharris.co.uk/required-practicals/gcse/biology/food-tests) (food tests including ethanol emulsion)

The test source itself must not be changed into a broader GCSE specification claim. Year 8 teacher/class coverage is not confirmed by this review.

## Outstanding academic quality gates — do NOT enable more formal scoring on this basis

1. **Teacher-taught and Year 8 fit:** independent confirmation with school teaching materials, with particular care that optional ethanol emulsion and safety detail are in the relevant taught subtopic.
2. **Fair open-ended scoring:** still enumerate other scientifically valid versions of 'suggest two actions / precautions' questions. A single documented synonym per mark is a starting point, **not an exhaustive answer universe**; risk of false-negative automated marking remains.
3. **Contradictions and partial credit:** execute additional natural pupil phrasing and compound sentence tests, especially mixed true/false statements, procedural ordering, non-exact spellings and negation across clauses. The 13 wrong-science patterns cannot guarantee zero false credit on arbitrary responses.
4. **Cross-mark independence:** independent reviewer to approve whether all 2/3-mark prompts genuinely require separately creditable content; no double credit from one repeated fact. `fair-amount` improved, but several causal/reliability prompts need a second subjective decision.
5. **Device/integration:** prove PWA selection and `first formal submission` rules, no assisted answers receiving XP/MP, durable save and reload, and scoring on an actual iPad WebKit before release. Verify the 52 existing `status:enabled` practice questions do not become newly certified Daily items merely because the rubric is improved.

## Automated regression entry points

- `node tests/academic-qa-food-numeric-20261122.test.mjs`
- `node --test tests/academic-qa-food-52-markpoints-20261122.test.mjs`
- `node --test tests/academic-qa-food-46-adversarial-20261122.test.mjs`
- GitHub workflow: `.github/workflows/academic-qa-food-numeric-20261122.yml`

**Final QA decision:** `SOURCE_LEVEL_SCREENED / INDEPENDENT_SIGNOFF_REQUIRED / NO LIVE IMPORT APPROVAL`. Reviewed answers and the scorer are improved in Draft only. Neither teacher approval nor production iPad usability is implied by passing these regression tests.
