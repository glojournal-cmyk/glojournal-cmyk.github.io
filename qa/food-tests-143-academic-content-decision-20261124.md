# Lux et Labor — Scholar’s Garden: Food Tests Academic Content QA Decision

**Date:** 24 November 2026  
**Source:** `content/topics/bio-y8-food-tests.json`, Year 8 Food Tests.  
**QA PR:** #308, branch `qa/p0-eligibility-2e556ff`. Base `main` is `2e556ffcb48f`.  
**Purpose:** Make explicit item-level Academic QA decisions *now*, rather than only counting automated checks or leaving every item undocumented.

## Full 143-source-item decision (AI academic content QA)

The evidence-backed 143-row source register is `qa/food-tests-143-source-academic-dispositions-20261124.json`. It links every original question ID and source prompt to a specific academic verdict and the relevant detailed item/option review.

| Academic content decision on the original source | Source questions | Action |
|---|---:|---|
| **Science content suitable as written** | **25** | 8 basic recall MCQs; 14 bounded typed responses; 3 matching question pair maps. These **do not** yet have teacher, taught-scope, or player release approval. |
| **Revise original question wording** | **17** | 1 *brick-red* item: “strong positive” alone is potentially ambiguous because other Benedict colours can be positive; explicitly require the strongest common endpoint. 16 retained four-test cases: replace slash-separated possible observations with **one actually observed colour** per test and specify the **complete detected nutrient set** in the question demand. |
| **Revise accepted answer marking scheme** | **1** | The negative iodine typed item accepts four absolute “starch is absent/not present” statements. These go beyond what a negative test proves; retain the observed **not detected** candidates while a qualified school-marker independently adjudicates whether conventional Year 8 shorthand should still receive credit. No unilateral deletion of previously accepted student responses. |
| **Replace repeated result MCQs** | **48** | Four repeats of 16 four-test patterns created 48 redundant originals. The **48 QA-only replacement MCQs** have been separately checked for science keys and **144 individual distractor explanations**; they are not imported or independently approved. |
| **Replace unsafe free-English auto-marking for formal scores** | **52** | These source long-answer questions contain **99** separate rubric points; actual scorer holdouts still exhibit **35 under-credit candidate responses and 3 provisional over-credit cases** out of 104. Keep as **unmarked practice**, not Daily/MP/Mastery. The 99 separately keyed MCQ alternatives are AI science-content reviewed, but remain unapproved for scoring, curriculum and skill independence. |
| **Total** | **143** | Every original question has a particular science, marking and editorial action, rather than generic “review pending.” |

## Separate candidate content judgments already recorded

- **First 25 MCQ originals:** `qa/food-tests-25-source-mcq-content-adjudication-20261124.json`. All 25 proposed science keys align with the observed reagent evidence. Eight original recall stems pass as written, one needs more exact Benedict wording, and 16 concrete-observation/complete-set revised stems pass provisional single-best-answer science review. All **100 options**, including **75 non-key alternatives**, have explanations.
- **All 15 typed and 3 matching originals:** `qa/food-tests-15-typed-3-matching-content-adjudication-20261124.json`. Fifteen science targets verified; one accepted-answer list requires correction. Three four-pair mapping keys are science-consistent. Direct execution of both QuizSession scorers confirmed **30/30 matching score tests**, covering scores 0–4 for all three matching questions in both bundles.
- **48 replacement candidate MCQs:** `qa/food-tests-48-replacement-content-adjudication-20261124.json`. All **48 keys** and **144 distractor options** have individual contextual scientific justification and AI content PASS under their stated stems. **27 replacements** still have possible cross-pool skill overlap; no inference that unflagged questions are uniquely mastered skills.
- **99 structured candidate mark points:** `qa/food-tests-99-structured-content-adjudication-20261124.json`. All **99 keys** and **297 non-key alternatives** have source-concept-linked science evidence and AI provisional content PASS. **79 point IDs** occur in at least one exact-answer, semantic, or cross-pool potential duplicate-skill risk category. These risks require independent Daily/Mastery skill mapping before any scoring import.

## Scientific source boundaries

- [AQA GCSE Biology food tests required practical scope](https://filestore.aqa.org.uk/resources/biology/AQA-8461-PRACTICALS.PDF) specifies Benedict’s, iodine and Biuret core tests.
- [Food Tests revision note, Save My Exams, updated 27 October 2026](https://www.savemyexams.com/gcse/biology/aqa/18/revision-notes/2-organisation/2-1-organisation-digestion/2-1-7-required-practical-food-tests/) distinguishes standard colour endpoints, negative observations and an **additional** ethanol lipid procedure. The presence of a method in a revision note or AQA sample protocol does **not** prove precisely which procedure TGS taught Year 8.
- [Required Practical overview](https://www.sciencedepartment.co.uk/templates/practemplate.php?pagename=rp03food) covers correct reagent targets, observable endpoints, control variables and safe procedures. These cross-checks are not individual teacher signature.

## Which approvals can and cannot truthfully be granted?

**Completed:** AI-led Academic *content* QA dispositions on **143/143 source questions**, with a defensible result for each item. Provisional scientific best-answer review completed for the **48 alternative MCQs and 99 structured MCQ mark points**, with individually explained distractors. Candidate source-wording repairs are documented without changing the live question bank.

**NOT completed:** Independent qualified science-teacher signoff, independent school marking-scheme acceptance, verification of TGS Year 8 taught scope, approved Daily skill deduplication and physical iPad PWA assessment. These are independent gates; a second run of our own programmatic tests cannot honestly count as outside academic approval.

**Formal academic/release approvals remain 0/143 original, 0/99 structured, and 0/48 replacement**; PR #308 and PR #310 must stay Draft. No merge, deployment, formal scoring, score migration, or changes to student history. The release gate is not lifted by the AI content-PASS counts.

## QA regressions

Source-bound automatic checks now validate the 143/143 disposition register, 25 MCQ option judgments, all 15 typed and 3 matching source keys, 48 replacement keys/foils, and the 99 structured parts plus 297 individual distractor explanations. Matching marks are checked on both actual quiz bundles. Source changes or candidate changes must invalidate stale findings rather than silently reuse the content verdict.

**Result:** Source Academic QA classification completed; content correction/import and independent formal approval remain separate release decisions.
