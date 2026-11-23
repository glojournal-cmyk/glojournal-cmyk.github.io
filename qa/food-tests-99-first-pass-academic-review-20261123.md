# Food Tests PR #308 — 99 candidate MCQ points, preliminary academic evidence (23 November 2026)

**Release gate:** BLOCKED. All **143 original Food Tests IDs** remain held; all **99 proposed structured MCQ parts** have `approved: false`; **0/143** original question approvals, **0/99** candidate approvals. The QA-only branch must **not** be merged, deployed, imported into Daily Tasks or used for student credit.

## Coverage and evidence

Read the actual source `qa/food-tests-structured-mark-points-draft-20261122.json` (**52 long-answer questions; 99 original marks**) against `qa/food-tests-structured-99-point-review-candidate-20261122.json` (**52 candidate question groups; 99 separate MCQs; 396 choices**). Every candidate point retains the exact source `pointId` and concept; answer IDs and chosen option strings match. Candidate answer positions A 25 / B 25 / C 24 / D 25.

A **first-pass AI science review** found no immediately evident wrong nutrient in the *keyed* option of these 99 candidate points, when interpreted according to the question stem and standard food-test procedures. This is **not independent sole-correctness verification**: it does not establish that all 297 distractors are uniquely wrong in context, appropriate to Year 8, or free of misleading wording.

The full 99-row inspectable register is `qa/food-tests-99-concept-collision-review-20261123.json` with immutable source-reference fields, all option texts, key IDs, risk flags and **zero formal approvals**. The independent QA workflow now runs `tests/food-tests-99-concept-collision-20261123.test.mjs` to prevent source/choice drift and misrepresentation of the approval state.

## Specific wording/scientific-interpretation corrections made in QA only

- **Point #31, fair Benedict's comparison:** the earlier open-ended "fair comparison" could include the valid design of heating all tubes to a *first colour-change endpoint* and comparing times, making a wrong-choice scenario insufficiently constrained. The revised question explicitly asks about comparing final Benedict's colours under matched conditions. Key remains **"Same bath temperature and same heating time."**
- **Point #45, qualitative iodine test:** avoided suggesting a different piece size can give an *accurate quantitative starch comparison by colour darkness*. The candidate now asks why different bread masses weaken test comparability; correct answer specifically calls for **equal measured masses**, not inferred exact starch concentrations.
- **Points #48–49:** green versus brick-red Benedict’s results provide at most a **rough concentration comparison under controlled sample/reagent/heating conditions**, not an exact concentration or glucose identity. Final school-level applicability of that inference remains to be verified by a qualified reviewer.
- **Points #60–61 and #83/#84/#96:** a negative food test means **not detected under the conditions**, not proof of total absence; the controls and limits matter.
- **Points #62–63 and #88–89:** an initially cloudy ethanol extract or a cloudy negative blank cannot independently establish food-derived lipid.

## Repeated evidence: exactly matching keyed answer texts

These **nine risk clusters affect 21/99 candidate parts** (the grouping is mechanical and requires semantic adjudication; it does not prove duplicates or authorise deleting original marks):

| Same keyed response (normalised) | Point indices |
|---|---|
| Starch | 1, 86 |
| Protein | 3, 82 |
| Reducing sugar was not detected | 23, 53, 57 |
| Reducing sugar was detected | 25, 54, 97 |
| Biuret reagent | 51, 87 |
| Starch was detected | 52, 94 |
| Starch was not detected | 55, 59, 98 |
| Protein was detected | 56, 95 |
| Lipid was not detected | 83, 96 |

**Provisional Daily recommendation:** do not present two questions sharing one of these answer-key clusters in a single formal Daily question set without independent evidence that they assess different skills or justify revisiting a weakness. Current QA pool remains ineligible for Daily entirely.

## Curriculum boundary and verification

The [AQA GCSE Biology practical guide](https://filestore.aqa.org.uk/resources/biology/AQA-8461-PRACTICALS.PDF) explicitly specifies Benedict’s, iodine and Biuret practical food tests. The [Save My Exams AQA food-tests note](https://www.savemyexams.com/gcse/biology/aqa/18/revision-notes/2-organisation/2-1-organisation-digestion/2-1-7-required-practical-food-tests/) identifies the ethanol emulsion test as **additional rather than mandatory within this AQA required practical**. This does **not** show that Tiffin Girls’ School has or has not taught ethanol testing; actual TGS Year 8 scope remains unverified. AQA standards support basic method review only, not local teacher marking approval.

Before sign-off: an independent educator must assess each stem, verify **all three incorrect options per MCQ**, adjudicate skill collisions, assess Year 8 taught scope, and verify student/player scoring and Daily-group allocation on a **physical iPad PWA**. Programmatic CI PASS is not a substitute.

**0/143 source approvals; 0/99 candidate approvals; PR #308 Draft; PR #310 separate Draft; main remains at `2e556ffcb48f`. No release, merge, deployment or learner history changes.**
