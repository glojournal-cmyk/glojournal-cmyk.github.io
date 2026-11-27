# Mathematics V3.1.1 — revised 200-item renderer intake and misconception-evidence gap

**22 Nov 2026 · PR #306 Draft only · no Maths Daily academic approval · DO NOT MERGE**

## Source and review separation
The checked file is the **staged, rewritten candidate bank** `qa-staging/math-v311-reviewed-200.json`, not the original printed 200-item PDF. Its correctness must not be inferred merely from previous **original** source key checks, and no candidate is authorized for XP/MP/Mastery or a production learner route.

## New complete-bank read-only structural/lexical scan
The exact branch candidate JSON was reopened. It contains 200 distinct source IDs and distinct revision IDs, exactly 40 each of Indices, Standard Form, Changing the Subject, Straight-Line Graphs and Simultaneous Equations.

| Candidate evidence inspected | Observed | Scope |
|---|---:|---|
| Stems | 200 | Complete bank |
| A–F option cells | 1,200 | Six present per item, no duplicate **literal** option LaTeX per question |
| Stored worked solution steps | 648 | Count of draft step strings, **not** 648 independently proved mathematical steps |
| TeX fragments in stems, options and steps | 2,892 | Lexical macro scan; all macro names from the renderer's supported vocabulary |
| Missing/duplicate option IDs, blank error-path strings, mismatched printed candidate key text, absent worked steps | 0 observed | Structural consistency only; not algebraic equivalence/physics/classroom QA |
| Candidate questions marked `dailyEligible: true` | **0** | All 200 still embargoed |

A conservative literal-text scan also found no unpaired dollar delimiters, orphan unit exponents, known-unsupported TeX command names or unsupported Unicode radicals. **This is not a successful native MathML runtime/Chromium/WebKit visual verification.** To make the full runtime gate executable, the independent test `tests/daily-v3-maths-reviewed200-render-and-credit-deny-20261122.test.mjs` has been added to the existing Daily V3 GitHub Actions workflow. The test actually invokes `mathsRichTextHTML`, `mathsOptionHTML` and `latexMathML` for every candidate stem, option, correct formula and worked step. **At report writing, its new CI outcome is unverified; do not mark it PASS until a completed run is inspected.**

## Why five written error paths are not five independently certified misconceptions
Among the **1,000 candidate incorrect answers**, there are 248 distinct verbatim explanatory strings. **393/1,000 option explanations** belong to just **20 phrases reused at least 10 times each**. Examples: `Move the denominator constant across the equality without changing its sign.` appears 31 times; `Reverse the final division.` 31; `Give the known point’s x-coordinate.` 27; `Reverse the sign of the required gradient.` 26. This is a **repetition screening flag**, not proof that these candidate choices are mathematically wrong: the same conceptual slip can legitimately recur with different numbers. But a distinct numerical wrong result, a nonempty rationale, and one counterexample are insufficient evidence that a pupil would naturally make that precise mistake.

For **each individual** incorrect option, the next academic reviewer must derive the stated wrong step from the actual stem and show that it leads to the printed alternative, identify whether the error is plausible for Year9 Set1, and check all six options are pairwise mathematically distinct on their intended domain. Review Grade7+ AO2/AO3 challenge separately: 28 of the original 40 Changing Subject problems were fractional-linear forms, so four parameter variants or five generic mistakes should not count as separate higher-grade concepts without a genuine demand difference.

## Outstanding original-PDF problem
The original student and worked-answer PDFs were located by exact name in the personal file index and their **extracted page text** was read. Attempts to retrieve the raw PDF bytes for coordinate-accurate rendering were rejected by file access, and the page-image read was not returned successfully. This does **not** resolve the original 507 formatting-dependent A–F slots. Do not convert text-only formula fragments to certified original typeset distractors.

## Release gates unchanged
- No independently confirmed Grade7+ band on each candidate, no exact TGS taught-subskill proof and no student-specific misconception evidence for all 1,000 wrong choices.
- No original-PDF true-layout certification for the unresolved source slots, and no physical iPad offline/PWA reload, quota fallback, and live credit isolation signoff.
- Even if the 200-item render test passes, that establishes **technical display compatibility only**. It cannot turn 0/200 formal Academic QA approvals into 200/200.
- Keep PR #306 Draft and preserve independently updated `main` Food Tests/numeric fixes. No merge, deploy, learner-state writes or historical award changes were performed as part of this intake.

**Formal academic approved: 0/200. Student Maths Daily released: 0/200.**
