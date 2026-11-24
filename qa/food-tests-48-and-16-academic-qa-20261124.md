# Food Tests PR #308 — 48 replacement MCQs and 16 surviving result cases: source-grounded Academic QA, 24 November 2026

**Status: QA draft only. DO NOT IMPORT, MERGE, DEPLOY OR AWARD CREDIT.**

**Release conditions remain:** Academic Approval **0/143** original Food Tests questions, **0/99** structured candidate parts, **0/48** duplicate-replacement candidates. PR #308 Draft, separate PR #310 Draft. `main` remains `2e556ffcb48f`. No real-iPad PWA acceptance or TGS Year 8 taught-scope verification.

## 48 candidate MCQs — 144 contextual wrong-answer reasons, not independent signoff

The live-source-preserving candidate `qa/food-tests-48-duplicate-replacements-draft-20261123.json` contains 48 replacements for duplicate result interpretation items; each has four options (192 total). New QA-only artefact `qa/food-tests-48-144-foil-reasons-20261124.json` maps **all 192 answers** to their exact latest draft stems, answer positions and 143-item QA preview, with an **individual contextual scientific reason for each of the 144 non-key choices**. A distractor may be a **correct observation in a different context**, but not answer the requested question (for instance a correctly stated positive Biuret observation is not an unsupported claim in a question asking what goes *beyond* available evidence).

The linked automated test `tests/food-tests-48-144-foil-reasons-20261124.test.mjs` asserts all 48 keys and all 144 contextual rationales, that all 48 source IDs match their previews, and that `dailyConceptGroup` is null and Academic Approval is false for all candidates. This **does not constitute independent sole-correctness approval**. A qualified educator must verify each whole question, all 144 foils, taught protocol and conceptual difficulty.

## 16 still-retained F1 result examples — specific sample colours

The original source's 64 result-interpretation rows encode **16 underlying four-test positive/negative combinations**, repeated four times. 48 duplicate candidates are held as replacements; the remaining **16 first-set F1 examples** remain in the original 143-item source.

Their observation text still says e.g. `heated Benedict's green / yellow / orange / brick-red` and `Biuret lilac / purple`. These strings convey possible positive results but are **not a single recorded endpoint for a particular sample**. New `qa/food-tests-16-retained-case-concrete-observations-20261124.json` provides a source-linked, held alternative *single* colour for each positive test (green, yellow, orange, brick-red, or lilac/purple as appropriate). **12/16** original stems need clarification; 4 are already single-observation examples. Eight positives for Benedict and eight for Biuret are represented. The unimported revisions retain all 16 original source IDs, four answer choices and exact nutrient-positive/negative interpretations.

The regression `tests/food-tests-16-concrete-observation-proposals-20261124.test.mjs` recomputes detected nutrients from each concrete proposed observation and checks they agree with the **source's own keyed interpretation**, without overwriting the source or 143-item preview.

## Cross-pool Daily skill overlap — reconciliation rather than deleting questions

Two independent QA classification passes use different thresholds. The broad `qa/food-tests-48-vs-99-skill-overlap-20261124.json` now flags **27 of 48 replacement candidates**, intersecting **47 of 99** structured points, for *possible* repeated or adjacent knowledge. The tighter `qa/food-tests-48x99-cross-pool-skill-overlap-second-pass-20261124.json` lists **17 specific candidate-to-point comparisons**: 13 high-overlap pairs and 4 related subskills. The broad register now explicitly contains **all 17 tighter pairs** (previously missing F3-06/#76 iodine repeatability and F4-08/#67 related pipetting-safety).

These flags are **not approvals, not proof of exact duplicate marks, and not permission to discard any source mark**. Genuine distinct skills include mouth-pipetting avoidance versus dispensing reagent close to a tube's wall. The 21 unflagged replacements are **not certified unique**. QA regression checks the two registers against current source IDs and candidate answer text. The real Daily selector and scores are unchanged.

## AQA protocol evidence (not proof of TGS instruction)

Official AQA GCSE Biology Required Practical Handbook, Version 5.2 (November 2018), printed pp. 40–41: [AQA source](https://filestore.aqa.org.uk/resources/biology/AQA-8461-PRACTICALS-HB.PDF).

- Suggested Benedict's method uses a water bath **at least 80 °C, approximately five minutes**; this supports specifying fixed heating conditions for comparable final colours.
- Suggested lipid test lists adding **distilled water then ethanol** to food, with an explicit ethanol flammability warning. This differs from another legitimate **two-stage ethanol extraction then dilution with water** protocol described in parts of the draft. Do **not** silently treat either as the only possible school protocol.
- The handbook explicitly says its sample methods are **not compulsory**; teaching may adapt procedures while meeting apparatus/technique requirements. Neither protocol listing verifies the precise TGS Year 8 lesson sequence.

**Release remains BLOCKED.** All new explanations, redrafts, skills, answers and controls are AI QA artefacts awaiting qualified academic review. Tests confirm structural consistency, not scientific or classroom signoff. No learner credit, source import or deployment.
