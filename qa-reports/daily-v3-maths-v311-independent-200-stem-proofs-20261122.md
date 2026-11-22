# Maths V3.1.1 — 200-of-200 Independent Stem Recalculation (22 Nov 2026)

**Independent mathematical result: PASS 200/200. Live integration: BLOCKED 0/200.**

## Source controls
- Exact editorial candidate: `Lux_Maths_Y9_200_MC_V3_1_1_Editorial_QA_PENDING.json`, SHA256 `cb26ea0dd961228dd95e47c29b5ce210f7261e9cb06eadb7b9c6a4824f2419ae`.
- Original V3.1 200 bank SHA256: `6fa88943a4233be04fc6be9f43f2079ffb008906c155d018913541852bb94268`.
- **Two editorial differences only** (`REARRANGING-016` / `REARRANGING-023`: removing redundant `1` before `z` in algebraic worked steps). IDs, stem texts, answer keys, and six choices were preserved.
- Verification code: `independent_stem_solver_v311.py` SHA256 `409b5de2bd8c68d941f5465d706872808328c14909f91ae9cf71ba7b228254e8` (available to the user in the generated evidence package).
- Per-question raw verification CSV SHA256 `4f1b8790a50907938a13cf3c5ed234053a600b1340238a7e4221a1d6e6b6619c`.
- 200-item human-readable Excel QA register SHA256 `4d11b2feeeefca8d0edb6a523a72d71fea12964204ae48b562d0aad18e2bdcd3`.

## Methodology
A new independent computational solver read **only each question's stem, template and stated symbols** to derive the mathematical result, then separately parsed and compared `correctAnswerLatex`. It did not derive the result from the answer option letter or worked solution. Each of the 50 template types was handled with an explicit mathematical operation and all four numerical variants were checked:
- **Indices (40/40)**: exponent equations in real n, powers/quotients, exponent identities by comparing both independently varying x/y powers, and follow-up expressions.
- **Standard form (40/40)**: exact arithmetic, density, speeds, percentage corrections, mass per container, volume conversion to cm³, inverse-balance calculation.
- **Changing the subject (40/40)**: algebraic inverse solutions for x including square root branches and rational denominators, independently simplified to the provided expression.
- **Straight line graphs (40/40)**: independent slopes, midpoint/perpendicular bisectors, intersections, parallel/perpendicular lines, intercepts and parameter constraints.
- **Simultaneous equations (40/40)**: symbolic linear systems, ticket/weight word problems, derived expressions, parallel-line no-solution and unknown coefficients.
- All 200 values matched, including exact rational/scientific-notation equivalences; zero genuine mathematical-key mismatches were found. A temporary intermediate checker reported non-matches due to floating-point number normalization and source TeX parser ambiguity, corrected using exact rational comparisons and explicit unambiguous multiplication.
- The computation does not constitute visual iPad acceptance, all worked-explanation pedagogical proofreading, or independent school curriculum signoff.

## Academic QA decisions remain separate
| Gate | Result |
|---|---|
| Independent stem-derived mathematical answer | **PASS 200/200** |
| Six mathematically distinct options, source key matching | **PASS 200/200** (prior independent option audit) |
| Five broad Maths Autumn topics | **Broadly in official outline**; not proof of taught details |
| Individual teacher taught-subskill confirmation | **0/200 signed** |
| Independent GCSE Higher Grade 7–9 level calibration | **0/200 signed** |
| Five misconception-based pedagogical distractors | **0/200 signed** |
| Worked explanation specialist editorial/rubric signoff | **Not completed for all 200**; two repairs held in staging |
| Verified offline iPad production grading and persistence | **Not passed** |
| Live permission/credit | **BLOCKED — 0/200** |

Known scope risks: **12** perpendicular-bisector items (school Construction/Loci is Spring); **4** fractional-index identities require taught-subskill evidence; **16** advanced changing-subject/surd items are marked for specific curriculum review (risk flags may overlap categories). The other source items are also subject to individual teaching and difficulty approval.

## Technical release constraints
The source manifest still sets Maths `[]` and production Maths Daily cannot award learner credit. Retain Draft PR #306 and all existing safety tests until a real offline 10-question player, 9/10 first-submit verified scoring, Recovery protection, iPad WebKit/Chromium / physical PWA data persistence, and explicit teacher/pedagogy signoff pass. GitHub Actions are not accepted as passing until confirmed green. Also preserve the independent `main` Food Tests/numeric marking update `2e556ffc...` when reconciling before any merge.

## Formal-answer persistence and first-attempt security extension (same Draft PR)
- A further source inspection uncovered that the real `assets/index-BLVOhKhN.js` `recordAttempt` wrapper **did not previously persist `selectedOptionId`** or explicit hint/assistance/scaffolding flags in the dated formal evidence it writes to the durable study backup and `formalAttemptLog`. Without that, the planned Maths 9/10 evidence verifier would correctly reject *all* real answers because the original A–F choice had been lost across reloads.
- Draft branch patch `fd669784...`: preserve `selectedOptionId` (one of A–F only), `assisted`, `hintUsed`, `scaffolded` alongside the existing attempt ID, question ID, date, subject/year/topic, repair, Recovery and original marking metadata; existing core XP/MP functions were not altered.
- Draft branch patch `99e0c2d0...`: `mathsEvidence` now reserves the **first formal attempt** for each assigned question ID even if the original payload lacks a selected option or is assisted. A later unassisted `correct:true` event can never replace that first malformed or wrong attempt. An earlier valid wrong answer remains wrong for Daily clearance.
- New `assets/math-study/daily-v31-formal-submission.js`: pure first-answer boundary that verifies the 10 pinned IDs, original A–F keys, distinct template IDs, exactly five topics × 2 and grade mix 4/4/2, plus individual academic/taught/checker/distractor metadata. Returns a dated formal answer record computed from the selected option; **does not write localStorage/IndexedDB, reward XP/MP or enable student sessions by itself**.
- Regression `tests/daily-v3-maths-formal-submission-20261122.test.mjs` and changes to `tests/daily-v3-contract-20261122.test.mjs` cover unapproved banks, duplicate retries, forged correct flags, hints, Recovery, wrong date, malformed first attempt and actual wrapper preservation. Direct JS smoke of current source returned: 9/10 = pass, 8/10 = fail, missing first option then correct repeat = zero marks for that question.
- **Still not a successful live integration test**: no end-to-end iPad/PWA production Maths session, no physical iPad, no green GitHub CI. As of the most recent query GitHub run `45024915004` remained queued; PR #306 is Draft/unmerged, and current `main` is separate `2e556ffc...` with Food Tests/numeric marking safety fixes. Avoid any merge that loses those updates.
