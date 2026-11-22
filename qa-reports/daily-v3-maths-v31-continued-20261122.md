# Maths V3.1 — Continued Academic QA and Staging Integration
**22 November 2026** — **RELEASE BLOCKED**. Do not merge PR #306 or award XP/MP.

## Maths worked-answer second reviewer sample (10 original source IDs)
Compared each sample question's mathematical stem with an independently constructed SymPy result; did not infer it from `correctOptionId`. Ten independent solutions match their supplied keys:

| Source ID | Derived result | Mathematical result | School-scope / editorial caution |
|---|---|---|---|
| GRAPHS-028 | x-intercept 33/2 | PASS | Parallel segment and multi-line intersection requires specific taught confirmation |
| REARRANGING-023 | x=(11-6y)/(y-5) | PASS | Nested rational changing-subject difficulty not signed off; worked solution says `(1z-4)x`, needs editorial cleanup |
| STANDARD_FORM-011 | 18,750,000 (1.875×10⁷) | PASS | Standard form taught-topic scope; grade band still not calibrated |
| INDICES-005 | 16 | PASS | Negative index law aligns to Autumn outline |
| REARRANGING-020 | -3(3y-1)/[4(2y-1)] | PASS | Rational denominators and exclusions need taught confirmation |
| STANDARD_FORM-017 | 300 (3×10²) | PASS | Standard form multi-step density scenario, grade not calibrated |
| INDICES-037 | n=2, n²-n=2 | PASS | Radical/fractional index reasoning not explicitly listed |
| SIMULTANEOUS-013 | k=4 | PASS | Distinct parallel/no-solution case needs taught confirmation |
| GRAPHS-039 | P=(4,3); x+y=7 | PASS | **Quarantine: perpendicular bisector is in the school's Spring Construction/Loci** |
| SIMULTANEOUS-023 | x=4,y=3, 2x²-y=29 | PASS | Nonlinear evaluation after linear solve, grade to confirm |

**10/10 mathematical stem solutions pass; 0/10 academic/live approvals.** Printed options 200/200 were separately checked in the prior independent option audit, but this 10-item proof does not establish all worked explanations are pedagogically complete.

**Teacher source:** [Tiffin Girls' School, Mathematics Year 9 Curriculum Outline 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10161919/Year-9-Maths-2026-2027.pdf), pp. 1–2 (Autumn index laws, standard form, formulae, linear graphs, simultaneous; Spring constructions/bisectors).

## Source-backed twenty-day daily selection QA
- Original V3.1 uploaded 200-question JSON SHA256 `6fa88943a4233be04fc6be9f43f2079ffb008906c155d018913541852bb94268`.
- `assets/math-study/daily-v31-selector.js` uses explicit school-topic slugs, exact 4 G7 / 4 G8 / 2 G8-9 per day, **two from each of five topics**, distinct template within a session and previous-day template avoidance.
- Read-only local simulation using the **actual original 200 questions**, with source approval flags changed only on an **in-memory test copy**, scheduled 20×10 = 200 distinct question IDs and **zero adjacent-day repeated templates** (original supplied simulation: 27 repeats). Day 21 has no fresh ID supply and must block.
- Independent synthetic CI test also exercises real planner across twenty days with receipt-based prior-day assignments. This is explicitly a fake approved fixture, not proof of any authentic teacher signoff.
- Source exhausted/QA-depleted → block; never substitute old Year8 or non-approved Maths content.

## Actual App integration on Draft PR
- `study/maths/daily/index.html`: added **safe locked page**, not an operating student Daily.
- `qa-staging/math-v31-original-sample10.json`: ten exact V3.1 sample records, labelled `QA_ONLY_NOT_APPROVED`.
- `assets/math-study/daily-v31-qa-preview.js`: isolated browser preview when explicitly using `?qa=1`; source IDs, six answer options shuffled, MathJax formula rendering, worked solutions, **no Scholar-store access, no localStorage or IndexedDB writes** and no credit.
- MathJax currently loaded **online** and only for preview; offline iPad PWA renderer and real production question UI remain unapproved.
- `tests/daily-v3-maths-ipad-browser-20261122.mjs` and `.github/workflows/daily-v3-maths-browser-20261122.yml` test Chromium/WebKit iPad emulation, actual typesetting, first answer, next, and zero learner writes. CI must run to completion; no green claims while queued.

## Required signoffs before live
1. Individual teacher-taught status for candidate subskills, removing the Spring bisectors and any unlearned fractional-index / rational-extension content.
2. Independent GCSE Higher Grade 7–9 difficulty calibration and five misconception-based distractors per approved item.
3. Working **local/offline maths renderer**, actual ten-question student session, reload/resume, first-submission scoring, saved date/XP/MP ledger, Recovery and PWA storage quota protection.
4. Full WebKit/Chromium automated tests and physical iPad acceptance. **No current student or Live Pages data was modified.**
