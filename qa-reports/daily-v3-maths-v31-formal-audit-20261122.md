# Daily Tasks V3 — Formal Academic & App Integration Addendum
**22 November 2026 | Decision: BLOCKED FOR LIVE DEPLOYMENT | PR #306 stays Draft**

## Evidence reviewed
- New user upload: `Lux_Maths_Y9_200_MC_V3_1_Second_Round_QA_Pack(1).zip`, canonical JSON SHA-256 `6fa88943a4233be04fc6be9f43f2079ffb008906c155d018913541852bb94268`.
- Exactly 200 Mathematics Y9 questions, five subjects (40 each), provisional G7 80/G8 80/G8-9 40; six A-F choices each; 50 templates (four numerical variants per template).
- Independent SymPy/LaTeX option comparison of all **200 displayed answer sets**: correct answer equivalent to exactly one displayed option; six mutually mathematically distinct options; `correctOptionId` points to it. **This does not independently re-solve all 200 stems or sign off worked methods or grade levels.**
- ZIP's own second-pass report claims independent re-solution 200/200; underlying oracle source was not supplied for replication.
- Official [Tiffin Girls' School 2026–27 Year 9 Maths curriculum](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10161919/Year-9-Maths-2026-2027.pdf) includes all five broad topics in Autumn; *perpendicular bisectors* appear in Spring Construction and Loci. **12** current questions contain bisector requirements; **four** contain fractional-index identity work not explicitly described in Autumn; **12** use advanced rearranging radicals/nested forms requiring teacher subskill confirmation.
- All `academicReview.confirmedTaught`, `gradeBandIndependentSignoff`, `qa.independentAcademicSignoff` and `visualRenderingVerifiedInApp` remain false in all 200. None can be treated as fully academically signed off.
- The 20-day simulation uses 200 unique IDs (10/day; 4/4/2 and 2/topic/day), but has **27 adjacent-day repeated template families** over 19 transitions (18 transitions affected), despite distinct templates within each day.

## Integration blockers confirmed (not assumptions)
1. App V3 metadata validator expects `grade`, canonical `topic` slug, `options[].text`, `workedSolution`, per-option `misconception`, and independent `academicQA/taughtVerified/sourceRef/qaReviewer`. The source JSON instead provides `difficultyTarget`, human-readable `topic`, `options[].latex`, `workedSolutionSteps`, with no per-distractor rationale and no source sign-off. **All 200 FAIL closed in the unmodified app validator.**
2. `study/maths/daily/index.html` does **not** exist on this branch; the referenced Maths player has no verified KaTeX/MathJax iPad UI, six-answer picker, actual response marking, stable assignment/resume or worked feedback.
3. Existing V3 evidence could have accepted ten arbitrary Maths attempt records without checking the assigned question IDs. Now patched on this Draft PR: Maths daily credit requires **ten pinned IDs, same day, formal unassisted first submissions, no repair/Recovery, verified Year 9 Maths task**, and a separate `mathsRuntimeReady=true` signoff. On current branch it remains **blocked with zero credit**.
4. Added `assets/daily-maths-v31-intake-gate-20261122.js` to map V3.1 fields into the V3 contract without rewriting original IDs or promoting self-declared mathematical PASS to `academicQA:'approved'`. Missing individual teaching, benchmarking, worked proof, distractor and iPad-render approvals force `eligible:false`.
5. Added `tests/daily-v3-maths-v31-intake-20261122.test.mjs`, and augmented `tests/daily-v3-contract-20261122.test.mjs` to reject artificial completion. Tests require fresh CI; no green claim before workflow completes.
6. Existing 40 selectively allowlisted Latin/French Y8 grammar and French Y9 question IDs remain in the prior QA register; they were not erased by Maths intake. Their actual browser marking/restart tests, app-level data preservation, mastery and 48-hour Recovery have not been independently signed off.

## Independent Academic QA gate results
| Gate | Decision |
|---|---|
| Supplied pack ID count and distribution | PASS (source integrity) |
| Printed maths answer, six mathematically unique options, correct option ID | PASS 200/200 (independent option comparison) |
| Stem mathematics independently re-derived in this audit | PARTIAL (source pack claims 200/200; external checker not reproduced) |
| Per-item curriculum taught confirmation | NOT PASSED (0/200 confirmed in source) |
| Per-item Grade 7–9 benchmark calibration | NOT PASSED (0/200) |
| Five distractor misconception explanations per item | NOT PASSED (0/200) |
| Distinct independently assessable concepts | 50 template families; 200 questions ≠ 200 concepts |
| Actual iPad WebKit grading and maths typography | NOT TESTED / NO PLAYER |
| Approved for live Maths Daily | **0/200** |

## Release rule
This remains **REVIEW/STAGING ONLY**; no live Maths bank, XP or MP. Do not merge until 200 or a duly approved subset have genuine curriculum/grade/distractor QA, a working maths runtime, full stored-evidence end-to-end QA, WebKit/PWA/QuotaExceeded backup safety, and independent reviewer signoff. Only then merge and verify GitHub Pages production. Current Draft PR is deliberately held.
