# Food Tests PR #308 — 48 replacement MCQs, method and fairness second-pass (24 Nov 2026)

**Scope:** Draft QA branch only. **Release: BLOCKED.** **0/143** original questions, **0/99** structured candidate points, and **0/48** proposed duplicate replacements have an independent qualified academic approval. No merge, import, deployment or learner-score changes.

## What was actually reviewed

- Read all 48 candidate stems, their 192 choice strings, proposed keys and science rationales in `qa/food-tests-48-duplicate-replacements-draft-20261123.json` against the source topic's four-food-test meaning. This was a second **AI preliminary screen**, **not** independent school/teacher verification of each sole-correct answer and each distractor.
- Derived the answer to every one of the **64 original food-result case rows** from the iodine, heated Benedict, Biuret and ethanol-emulsion positive/negative signals instead of trusting the stored answer. **64/64 stored nutrient sets agree**, covering **16 distinct four-signal combinations exactly four times each**. This checks the basic mapping; it is not approval of pupil-facing question quality or formal scores.
- Found **32/64 original case prompts** using `green / yellow / orange / brick-red` as a slash-delimited set of potential positive Benedict outcomes rather than an actual single observed final colour. This is sufficient to imply a positive result but is an *imprecise sample observation*. If the 16 surviving exemplars are ever prepared for formal use, show a concrete observed final colour for each, verify the intended interpretation, and independently review the revised wording. The 64 originals remain unchanged in the source bank.

## Five revised candidates, no academic approval

| Draft source suffix | Reason | QA-only resolution |
|---|---|---|
| F3-04 | Original fair-comparison question did not specify endpoint; comparing time to first Benedict colour change could be a legitimate *different* experimental method, making a distractor arguable. | Stem now explicitly demands comparison of **final colour after the same five-minute water-bath interval**; keyed choice remains identical, no second acceptable final-colour control. |
| F2-07 | Pre-water cloudiness needs to be judged in the actual **two-stage ethanol extract then water** protocol. | Stem explicitly identifies the protocol. |
| F3-13 | Ethanol-extraction-then-water wording could be mistaken for the *only* school/GCSE permitted test sequence. | Positive-control question explicitly says it concerns a two-stage protocol. |
| F4-14 | Water dilution comparison is valid for a two-stage extraction protocol but depends on method. | Stem identifies two-stage protocol; use of different measured water volumes is still an unfair comparison. |
| F4-02 | Original correct option prescribed a particular ethanol/water order when the primary science objective was **no heating / flammability safety**. | Correct option now requires **no heating ethanol**, following the taught method, and avoiding ignition sources. The correct option position (A) and original ID are unchanged. |

The exact five changes were synchronized in the 48-row QA draft and 143-row held preview; no original source question was edited. All candidate source IDs, 48 unique keys and positions (**12 A / 12 B / 12 C / 12 D**), and academic-credit blocks remain preserved. Three new regression tests cover the fixed-time comparison, method-specific versus universal safety language, and original 64-row biochemical answer mapping.

## Reference boundary — do not confuse valid procedures

The official [AQA GCSE Biology Practical Handbook, Food tests, printed pp. 40–41](https://filestore.aqa.org.uk/resources/biology/AQA-8461-PRACTICALS-HB.PDF) describes Benedict's testing in a hot water bath (minimum 80 °C, around five minutes) and states that ethanol must be kept away from flames. Its example lipid practical combines food, water, then ethanol and shakes; the held QA draft contains some **two-stage** tests that first extract lipids into ethanol and then mix the extract with water. Their procedure order is not identical. Neither should be described as the single compulsory TGS-taught order without actual classroom-method confirmation.

**Academic consequences:** retain protocol context in method-specific questions. Do not penalise a scientifically valid alternative protocol in a question whose stem has not restricted the method. Do not mark a general safety question as testing a fixed reagent order. The exact TGS taught method, controls, and independent scientific sole-key review remain pending.

## Still unresolved

1. An independent qualified science reviewer must determine whether each of the **48 individual MCQs** has exactly one defensible correct answer and whether all **144** competing options are sound and plausible in context. This document is not that sign-off.
2. The source's **16 positive/negative exemplars** need student-facing observation-language improvements, not just mathematical validation.
3. The **99 structured MCQ marks** and the **52 original long-answer marks** have separate unresolved independence, duplication and fairness issues; automated content consistency does not approve them.
4. Real iPad PWA and Daily skill-selection/credit-path acceptance is not completed. Existing zero-credit gates stay closed.

**Decision:** PR #308 remains **Draft / DO NOT MERGE / DO NOT DEPLOY**, no Daily/MP/Mastery credit or alteration of learner records.

## Later same-day cross-pool continuation (24 Nov 2026)

- **F4-01** was substantively redundant with structured **point #93**: both asked for extinguishing a lit Bunsen burner before opening ethanol. The held F4-01 draft and 143-row QA preview now instead ask about a **still-uncapped ethanol bottle beside a warm water bath after the flame is already off**. Correct choice **B** requires capping and moving the bottle away from heat and ignition sources, not merely repeating flame extinction. This tests a distinct practical safety decision. It remains **unapproved**.
- Created [48 × 99 cross-pool skill-overlap review](food-tests-48x99-cross-pool-skill-overlap-second-pass-20261124.json): **17 candidate-to-structured-point overlap flags**, of which **13 HIGH_OVERLAP** and **4 RELATED**. These are preliminary concept-level duplicate/rotation flags, not proof that all flagged source marks should be deleted; no Daily selector was changed and no candidate has been released.
- In total **six** held replacement candidates received a scientific clarity or overlap-focused correction in this continuation: F3-04, F2-07, F3-13, F4-14, F4-02 and F4-01. All candidate keys and source identifiers are preserved; **48 draft-to-preview QA entries align** at the latest source-level preflight.
- The Node regression file includes five additional targeted tests for fixed-time Benedict's, ethanol protocol wording, 64 original result key derivations, the revised ethanol-storage decision, and the 17 flagged cross-pool references. **Source-level checks passed; GitHub Actions on the final head were queued/pending when this note was updated.** CI success is not claimed here.

**Still blocked:** 0/143 source approvals, 0/99 structured approvals, 0/48 duplicate-replacement approvals. No merge, deployment or saved-score changes.
