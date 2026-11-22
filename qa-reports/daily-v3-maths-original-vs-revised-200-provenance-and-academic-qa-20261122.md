# Lux et Labor Maths V3.1 — ORIGINAL versus REVISED 200 source reconciliation

**22 November 2026 | Draft PR #306 | No production import and no student credit**

## Critical provenance distinction fixed

There are two separate bodies of questions in this Draft PR:

1. The user-supplied **original** `Lux_Maths_Y9_V3_All_200_Student.pdf` and original worked-answer PDF, indexed as five × 40 source question/answer packs. The original-PDF A–F text extraction can misread stacked fractions, so the historical 507 **original source** formatted-option holds, 111 source wrong-operation hypotheses and provisional 79/17/80/24 source question triage apply **to the original version only**.
2. The **revised 200-question bank**, `qa-staging/math-v311-reviewed-200.json` (Git blob `776a2354d6949a7a6dc65e70d8c5d4fb49404f04` when checked). The revision bank has source digest `cb26ea0dd961228dd95e47c29b5ce210f7261e9cb06eadb7b9c6a4824f2419ae`, 200 unique original source IDs, 200 distinct revision IDs, **40 questions in each of five topics**, precisely **six options each**, **1,000 proposed error-path explanation strings**, and **648 worked-solution steps**. These proposed mathematical explanations are **not automatically independent pupil-misconception plausibility approvals**.

The existing [revised content-review report](maths-200-revised-content-review.md) records 36 source-to-revised stem changes, 21 earlier staged-candidate integrations and changed explanations for all 200. Those are the report's editorial counts; exact complete source PDF glyph-to-revision comparisons should not be imputed from PDF plain-text.

## App QA preview, not student Daily

The draft `study/maths/daily/index.html` has a `?qa=1&bank=revised` **reviewer preview** that loads the revised bank through `assets/math-study/daily-v31-qa-preview.js`. The draft preview is isolated from Scholar storage, declares QA-only review, has `dailyEligible:false` on **all 200**, and never writes XP/MP/Mastery/Recovery. **PR is Draft, main SHA `2e556ffcb48f6c7346b3b663f8058f57271b643d` when checked, and the Live App is unchanged.** A working branch preview is not a deployed Daily implementation.

[Chromium/WebKit offline browser run #45068923190](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45068923190) passed all 200 revised cards in each emulator, alternating 100 correct and 100 wrong choices per browser. This tests rendering, deterministic letter comparison and localStorage nonmutation; it does **not** establish GCSE difficulty, exact teacher-taught content, real-world alternative-answer reasoning or physical iPad PWA/persistence safety.

## Additional independent regression performed this turn on the REVISED mathematics

The previous source-only algebraic checks alone are insufficient where revised stem formulas were changed. Specifically the editorial revisions **Q105–Q108** change the original source mathematical form `y=s+sqrt(a/(bx+c))` into the mathematically different `y=s+a/sqrt(bx+c)`. Both are legitimate formulas; **an answer to the revised version cannot be graded against the source version's inverse**.

A new independent [forty-question revised-subject numeric inversion and 200-wrong-option test](../tests/daily-v3-maths-revised40-changing-subject-independent-inverse-20261122.test.mjs) evaluates the actual **revised Q81–120 source equations**, including Q105–108's changed square-root placement, at numerous positive and negative valid points. It confirms the revised correct `x(y)` keys reproduce the original sampled (x) and each of the **200 revised Changing-the-Subject wrong alternatives** has at least one independently computed counterexample on a valid revised-source point. This is stronger than merely checking that a wrong option text exists, while still **not** proving that every written error rationale models a plausible mistake.

The new test passed in [Daily contract CI #45070533426](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45070533426): **168/168 + 59/59 + 37/37 = 264/264 Node tests PASS**.

**CI coverage hole corrected:** The Maths browser workflow previously did **not** monitor changes to `qa-staging/math-v311-reviewed-200.json`, even though its browser script consumes that file. It now watches the revised 200 bank, so any change to actual revised questions will trigger Chromium and WebKit. [Browser CI #45070426544](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45070426544) succeeded after this workflow correction.

A separate recent all-original consolidated source QA regression failed on a mismatched field reference (`possibleSourceWrongOperationHypothesisLetters` instead of the actual `mathematicalWrongOperationCandidateChoices`). This was repaired without deleting the assertions. [Daily CI #45070219756](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45070219756) confirms green after the repair.

## Remaining formal blockers: DO NOT REMOVE

- Classroom exact **TGS Year 9 Autumn taught subskills for all 200 revised questions** (teacher/school evidence, especially perpendicular bisectors, percentages and advanced algebraic fractions).
- **Independent GCSE Higher Grade 7+ AO2/AO3 benchmarking per revised item**, not merely source template grade labels or several computation steps.
- **Independent mathematical credibility and educational diagnostic review of all 1,000 revised distractor error-path explanations**. Their existence is confirmed, but no formal independent signoff is implied.
- **Real physical iPad PWA** cold restart, offline storage failures, recovery and formal Daily first-attempt scoring end-to-end.

**Release result: revised original 200/200 remain `dailyEligible:false`, PR #306 Draft/unmerged; student credit remains 0/200.** This distinction must be maintained in future daily QA automation and reports.
