# Maths V3.1.1 — revised 80-item independent stem-first mathematics QA

**22 November 2026 · Draft PR #306 only · academic approval remains 0/200 · do not merge**

## New direct mathematical evidence, separate from prior original-PDF proof
Reopened the **revised candidate** bank \`qa-staging/math-v311-reviewed-200.json\`. This audit recalculates from the **actual revised question stems** rather than trusting the candidate key, source worked solution, stored \`correctOptionId\`, or the previous V3.1 *original* source proofs. It is not an external GCSE difficulty benchmark or school teacher confirmation.

| Revised topic | Question IDs | Independent calculation | All A–F choices | Outcome |
|---|---|---:|---:|---|
| Straight-Line Graphs | \`LUX-MATH-Y9-GRAPHS-001..040\` | 40 | 240 | 40 correct computed keys; six pairwise numerically distinct options per question; one correct per item |
| Simultaneous Equations | \`LUX-MATH-Y9-SIMULTANEOUS-001..040\` | 40 | 240 | 40 correct computed keys; six pairwise numerically distinct options per question; one correct per item |
| **Total** | **80 distinct revised items** | **80/80** | **480/480** | **No mathematical key or repeated numerical-choice errors in this pass** |

### What was calculated for the graph questions
The checker reads the actual coordinates and equations from each stem (not \`workedSolutionSteps\`). It independently calculates gradient, negative reciprocal, midpoint/bisector, pairwise intersection, axis intercept, segment-parallel gradient, squared distance, area, signed displacement and origin-to-point gradient. The ten source-pattern families each contain four variant questions. The check compares each independent result to all **six actual candidate choices**, not merely the answer key.

**Taught-scope hold:** 12 perpendicular-bisector items — \`GRAPHS-005..008\`, \`017..020\`, \`037..040\` — remain quarantined because the TGS Autumn outline does not itself establish that Spring construction/loci content is already taught. **A mathematically correct answer does not remove that hold.**

### What was calculated for simultaneous equations
The checker independently derives coefficients from each actual two-equation TeX system, solves 2×2 systems, evaluates target expressions, calculates venue and museum ticket prices and crate/box masses from the **word problem numbers**, solves the parameter-\`k\` constrained systems, and verifies **eight** no-solution parameter questions represent *parallel distinct* rather than coincident lines. Each computed result is compared to six candidate numerical choices with tolerance and unique-answer assertions.

### New executable CI safeguards
- \`tests/daily-v3-maths-revised40-graphs-stem-first-geometry-20261122.test.mjs\`: source-to-result geometry solver, 40 stem keys, 240 options, Spring bisector holds, credit embargo.
- \`tests/daily-v3-maths-revised40-simultaneous-stem-first-20261122.test.mjs\`: source-to-result algebra/application solver, eight separate parallel-not-coincident conditions, 40 stem keys, 240 options, credit embargo.
- Both have been added to \`.github/workflows/daily-v3-contract-20261122.yml\` under syntax, push/PR paths, and the Node unit-test command.

The independent direct JS audits were run within this QA review and reported 40/40 for each topic with no failures. **A fresh completed-green GitHub Actions result has NOT yet been verified.** A source-level mathematical result must not be advertised as a browser, WebKit, or iPad QA pass.

## Persistent academic release blockers
This pass does not certify the five *student-realistic* incorrect-reasoning paths per question, the true Grade 7–9 AO2/AO3 demand, individual TGS class-taught subskills, original PDF formatting-dependent options, or final physical iPad PWA save/restart/Recovery behavior. Earlier full-bank scan also flagged 393 wrong-choice rationales belonging to descriptions reused ≥10 times — repetition merits individual misconception audit but is **not in itself a proven mistake**.

All examined revised entries remain \`dailyEligible: false\`. **Formal Maths approval 0/200; no live import or XP/MP/Mastery awarded.** The separate \`main\` Food Tests/numeric fixes must be preserved at any later integration. PR #306 stays Draft.
