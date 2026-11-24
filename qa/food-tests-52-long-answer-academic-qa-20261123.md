# Food Tests — 52 original long-answer / 99 mark-point Academic QA gate

**Evidence date:** 23 November 2026  
**Scope:** `content/topics/bio-y8-food-tests.json` on Draft PR #308 (`qa/p0-eligibility-2e556ff`).  
**Release status:** **BLOCKED**. Academic Approval **0/143 source questions**; structured candidate approval **0/99 marks**. Nothing in this report authorises a release, merge, deployment or formal marks.

## Source-based test coverage

The source contains **143 Food Tests questions**, of which **52** are `mark_points` tasks worth **99** separately listed marks. Previous `qa/food-tests-37-unseen-probes.json` included two hold-out answers each for **37 questions (73 marks)**. The new `qa/food-tests-15-extra-unseen-20261123.json` completes the remaining **15 questions (26 marks)**, giving **104 responses** total. Every question now has one AI-authored plausible full-score paraphrase and one opposing/incorrect conclusion. Both kinds of proposed expectations **require independent teacher adjudication** and are not student scripts.

The exact source questions, source mark points, question IDs and student score data were **not modified**. Newly added coverage is checked by `tests/food-tests-52-coverage-20261123.test.mjs`. The diagnostic executes the actual `B()` and three Food Tests marking modules extracted from both QuizSession bundles; it is not a real browser/iPad session. `tests/food-tests-52-unseen-diagnostic-20261123.mjs` produces an inspectable **104-row** evidence file as a workflow artifact.

## Verified Node diagnostic, both scoring bundles agree

[GitHub Actions Food Tests QA evidence run #45257502268](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45257502268)

| QA expectation | Cases | Met | Mismatch |
|---|---:|---:|---:|
| Proposed scientifically valid full-score paraphrase | 52 | 17 | **35** |
| Proposed false/incorrect conclusion should score 0 | 52 | 49 | **3** |
| **Total** | **104** | **66** | **38** |

By source subset: original 37 items **30/74 mismatches** (29 under-credit, 1 provisional over-credit); newly covered 15 items **8/30 mismatches** (6 under-credit, 2 provisional over-credit). The earlier stored 37-run result was an older snapshot; these are measurements against the latest branch evaluator.

### Immediate academic escalations

- `bio-y8-food-tests-biuret-solution-explain`: a wrong claim that Biuret detects starch scored **1/1** in the diagnostic. The reagent–nutrient relationship is scientifically wrong.
- `bio-y8-food-tests-application-20261025-test-plan`: a response with incorrectly crossed iodine/Biuret/starch/lipid observations scored **1/2**. This indicates keyword matching does not necessarily verify the **pairing**.
- `bio-y8-food-tests-application-20261025-all-negative`: an answer that wrongly asserts four negative tests prove **no nutrients of any kind** scored **1/2**, but the disputed point could be interpreted as partial observational credit; the held-out fixture already marks this **partial-credit ambiguity** for independent adjudication. Do not classify it as a definitive erroneous mark without qualified review.
- **35 proposed legitimate responses** did not earn the expected full score, despite the source-concept intent recorded in the hold-out fixtures. These require rubric verification and alternative-answer fairness review.

The tests are **diagnostic, not green-grading acceptance tests**. A workflow PASS means the tests ran, coverage is complete, and the no-credit hold works. It does **not** mean all 104 pedagogical scoring expectations were met.

## Action and formal scoring rules

**Do not** chase more individual sentences through fuzzy free-English keyword logic or auto-award full credit to scaffolded responses. All 52 original `mark_points` questions remain **practice-only / unmarked** with no Daily, XP, MP, Mastery, or retroactive history award. Both QuizSession bundles must continue to present the unmarked pupil verdict.

The existing `qa/food-tests-structured-99-point-review-candidate-20261122.json` offers a separate one-question-per-mark concept-choice design as a potential scoring replacement. It is still **unapproved** and must be checked point-by-point for preservation of original concepts, a single scientifically correct choice, plausible but wrong distractors, lack of duplicated awards, TGS taught scope, source-key integrity, Daily skill tags, and real iPad/PWA scoring before import. The 48 independent MCQ duplicate replacements in the separate preview are also still unapproved.

**Release Gate: BLOCKED; PR #308 and PR #310 remain Draft; main unchanged.**
