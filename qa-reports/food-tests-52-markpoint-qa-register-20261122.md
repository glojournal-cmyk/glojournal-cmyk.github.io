# Food Tests — 52-Question Academic QA / Scoring Fairness Register

**Reviewed: 22 November 2026** | **Draft PR #306 only** | **Independent academic signoff: NOT GRANTED**

Source: `content/topics/bio-y8-food-tests.json`, exact Git blob `3607ed7a0dcf4bc184b807e379356954cd3c7cc9`. Reviewer staging manifest `qa-staging/food-tests-46-markpoint-evidence-draft-20261122.json`.

## Verified source-level coverage (not a teacher approval)

- **52/52 short-answer questions; 98/98 mark-point slots** now each have explicitly stored `markPointEvidence` and `markPointAlternatives`, scoped exclusively to this Food Tests topic in the actual QuizSession scorer. Existing 6 guarded questions (12 marks) + this continuation's 46 questions (86 marks).
- All **52/52 model responses** award their intended total marks.
- The 46 new questions pass **86/86 independently authored short correct-alternative checks**, **86/86 whole-proposition negation checks**, and **598/598 curated wrong-science inputs** (13 incorrect statements across each of the 46 questions). Those are bounded acceptance checks, not comprehensive language understanding.
- **7 previously revised rubrics plus `fair-amount`**: the latter now demands (1) controlled bread sample mass and (2) the consequence of unequal masses for the observed iodine result. A reviewed concise explanation obtains its own one mark; 'make it fair' alone earns none.
- Scientific denial of an entire proposition and explicit contradictory reagent claims cannot gain accidental marks through generic phrase similarity. Precisely documented full-response alternatives are permitted only with the specific scientific evidence rule present. Missing Food Tests evidence **fails closed** without changing other subject marking.
- **12/12 direct source-level QA test groups passed**: the academic food/numeric suite (1), old 52-markpoint suite (4), and new 46-adversarial suite (7). **No latest GitHub Actions run or physical iPad approval is implied by this isolated pass**.
- All 52 carry `SOURCE_LEVEL_SCREENED_INDEPENDENT_SIGNOFF_PENDING` and **0/52** have independent taught/grade/marking signoff; original 143 Food Tests questions' normal enabled status was not newly promoted into the Daily V3 whitelist.

## Per-question review register

| Question ID | Marks | Actual mark points in current source | Verified-source score check | Next independent QA decision |
|---|---:|---|---|---|
| `bio-y8-food-tests-iodine-solution-explain` | 1 | 1) the reagent used to test for starch | Existing high-risk item: model + direct examples | **BLOCKED** |
| `bio-y8-food-tests-benedict-s-solution-explain` | 1 | 1) the reagent used to detect reducing sugar | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-biuret-solution-explain` | 1 | 1) the reagent used to test for protein | Existing high-risk item: model + direct examples | **BLOCKED** |
| `bio-y8-food-tests-ethanol-emulsion-test-explain` | 1 | 1) the lipid test in which ethanol is shaken with the sample before water is added | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-blue-black-explain` | 1 | 1) the positive colour for starch after iodine is added | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-brick-red-explain` | 1 | 1) a strong positive Benedict's result for reducing sugar after heating | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-lilac-or-purple-explain` | 1 | 1) the positive colour produced by protein in the Biuret test | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-cloudy-white-emulsion-explain` | 1 | 1) the positive result for lipid in the ethanol emulsion test | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-water-bath-explain` | 1 | 1) a safe, controlled method for heating Benedict's test mixture indirectly | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-app-benedicts-method` | 3 | 1) add Benedict's solution; 2) heat in a hot-water bath; 3) positive result changes from blue towards green, yellow, orange or brick-red | Existing high-risk item: model + direct examples | **BLOCKED** |
| `bio-y8-app-ethanol-safety` | 2 | 1) ethanol is highly flammable, so it must be kept away from naked flames; 2) heating is not needed for the ethanol emulsion test | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sample-separation` | 2 | 1) using separate portions prevents reagent from one test interfering with the other; 2) iodine and Benedict's tests use different reagents and conditions | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-iodine-repeat` | 2 | 1) repeat the tests using fresh samples; 2) use the same measured volume of sample and iodine | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-benedict-no-heat` | 2 | 1) Benedict's reducing-sugar test requires heating; 2) without heating the expected positive colour change may not occur | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-negative-sugar` | 2 | 1) Benedict's solution remains blue; 2) no reducing sugar was detected | Existing high-risk item: model + direct examples | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-positive-sugar` | 2 | 1) heated Benedict's solution changes from blue to orange; 2) reducing sugar is present | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-biuret-control` | 2 | 1) use water as a negative control; 2) it should stay blue to check for contamination | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-control` | 2 | 1) test a known starch solution; 2) iodine should turn blue-black | Existing high-risk item: model + direct examples | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-repeatability` | 2 | 1) use the same volume or mass of food extract; 2) keep the heating time or water bath temperature the same | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-cross-contamination` | 2 | 1) reagent or food from one sample could contaminate another; 2) contamination can cause a false positive or unreliable result | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-ethanol-emulsion-stages` | 2 | 1) shake the food sample with ethanol; 2) add water after shaking the sample with ethanol | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-ethanol-ventilation` | 2 | 1) keep ethanol away from naked flames because it is flammable; 2) wear safety goggles to protect eyes | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-benedict-hot-tube` | 2 | 1) the test tube and water can be hot and cause burns; 2) hot liquid could splash onto another person | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-protein-extraction` | 2 | 1) crushing breaks up the sample to expose substances; 2) mixing with water allows a testable extract to be produced | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-starch-extraction` | 2 | 1) crushing increases exposed surface area or releases starch; 2) iodine can contact the starch more easily | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-fair-amount` | 2 | 1) keep the mass of each bread sample the same; 2) unequal sample masses can affect the iodine result | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-fair-reagent` | 2 | 1) the reagent volume is not controlled; 2) any difference in result could be due to reagent volume rather than the samples | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-sugar-strength` | 2 | 1) brick-red suggests a greater amount of reducing sugar than green; 2) the colour test gives an approximate result rather than an exact concentration | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-cloudy-not-protein` | 2 | 1) cloudy white is evidence for lipid in the ethanol emulsion test; 2) protein needs a separate Biuret test | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-starch-vs-glucose` | 2 | 1) starch was detected in the sample; 2) reducing sugar was not detected | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-sugar-vs-starch` | 2 | 1) reducing sugar was detected; 2) starch was not detected | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-biuret-vs-sugar` | 2 | 1) protein was detected; 2) reducing sugar was not detected | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-lipid-vs-starch` | 2 | 1) lipid was detected; 2) starch was not detected | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-all-negative` | 2 | 1) none of starch reducing sugar protein or lipid were detected by these tests; 2) a negative test does not prove the food contains no nutrients of any kind | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-retest-ethanol` | 2 | 1) the sample or glassware may have been contaminated; 2) a valid result requires the correct ethanol then water procedure | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-glassware` | 2 | 1) labels prevent samples from being mixed up; 2) clean tubes avoid contamination that could change results | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-eyes` | 2 | 1) goggles reduce risk of chemicals reaching the eyes; 2) careful handling or pipetting reduces splashes | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-heat-variable` | 2 | 1) heating time is a variable that was changed; 2) the colour difference might be due to heating time not sugar concentration | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-no-taste` | 2 | 1) the sample may contain harmful or contaminated substances; 2) laboratory substances and chemicals must not be ingested | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-recording` | 2 | 1) record the reagent or type of test used; 2) record the observed colour change or appearance | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-inference` | 2 | 1) food tests identify some nutrient groups but not overall nutritional balance; 2) healthiness depends on amounts and other dietary factors | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-weak-blueblack` | 2 | 1) repeat the test with a clean sample or equipment; 2) compare the result with a known positive and negative control | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-temperature-safety` | 2 | 1) a water bath provides more even or controlled heating; 2) indirect heating lowers the risk of splashing or overheating | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-test-plan` | 2 | 1) iodine test for starch gives blue-black; 2) ethanol emulsion test for fat gives cloudy white | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-positive-protein-negative-fat` | 2 | 1) purple Biuret is a positive test for protein; 2) no cloudy emulsion means lipid was not detected | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-result-not-proof` | 2 | 1) the test did not detect reducing sugar under the test conditions; 2) sweetness does not prove that a reducing sugar is present | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-wrong-reagent` | 2 | 1) iodine tests for starch not protein; 2) Biuret reagent is required to test for protein | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-uncertain-emulsion` | 2 | 1) the control suggests contamination or a problem with reagents; 2) repeat using fresh clean equipment and reagents | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-iodine-no-heat` | 2 | 1) iodine starch testing does not require heating; 2) add iodine solution to the sample and observe whether it turns blue-black | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-safe-bunsen` | 2 | 1) ethanol vapour is flammable; 2) an open flame can ignite the ethanol causing fire | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |
| `bio-y8-food-tests-application-20261025-unknown-analysis` | 3 | 1) starch is present; 2) protein is present; 3) lipid was not detected | Existing high-risk item: model + direct examples | **BLOCKED** — high priority, expand legitimate alternatives |
| `bio-y8-food-tests-application-20261025-sugar-analysis` | 3 | 1) reducing sugar is present; 2) starch was not detected; 3) protein was not detected | 46-manifest: model + reviewed aliases + denial + 13 science traps | **BLOCKED** |

## Scientific-method sources and school-level limits

- [AQA GCSE Biology food-testing practical guidance](https://filestore.aqa.org.uk/resources/biology/AQA-8461-PRACTICALS.PDF) supports tests for Benedict's reducing sugars, iodine starch, Biuret protein, and hot-water-bath heating.
- [Philip Harris GCSE food-test reference](https://www.philipharris.co.uk/required-practicals/gcse/biology/food-tests) also describes lipid/emulsion testing; the school must confirm whether and how the ethanol test was taught.
- Distinguish **heated Benedict's test** and **unheated ethanol emulsion test**. Do not infer the TGS student's exact taught lessons from the general AQA specification alone.

## Open QA release blockers

1. **Human-independent Academic QA:** review class-specific Year 8 taught scope, reasonableness of every mark allocation, and teacher-acceptable student writing variations; none of the 52 has independent signoff.
2. **Open-ended questions:** 'two improvements', safety precautions and explanations may support other correct solutions than the listed alternatives. Expanded adversarial false negatives, ambiguous compound sentences and fair partial marks still require manual expert checks.
3. **Concept-level anti-repetition:** prevent duplicate wording/near-identical ideas from generating multiple Daily or Mastery credits.
4. **iPad PWA and persistence:** real daily selection, official first formal submission, multiple-question restore, offline save/reopen and XP/MP/Recovery boundaries still need a physical device acceptance test.
5. **Current GitHub CI:** requires a successful run against the exact latest Draft SHA, with Vercel build-rate-limit addressed separately.

Executable tests: `tests/academic-qa-food-numeric-20261122.test.mjs`, `tests/academic-qa-food-52-markpoints-20261122.test.mjs`, `tests/academic-qa-food-46-adversarial-20261122.test.mjs`.

**Decision: SOURCE-LEVEL SCREEN COMPLETE; NO INDEPENDENT ACADEMIC SIGNOFF; DO NOT MERGE OR ENABLE FORMAL DAILY CREDIT ON THIS EVIDENCE ALONE.**
