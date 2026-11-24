# V325 — 12 source-linked Straight-Line Graphs reasoning redesigns

24 November 2026. Draft PR #306. **No formal academic approval, no learner credit, no merge or deployment.**

The canonical 200 bank at Git blob 0655fbc1b796bff68f533c060a43339dff6664be is unchanged. Twelve previously unrepresented graph source IDs now have new complete six-choice candidates: 001–008 and 010–013. The new [question pack](../qa-staging/math-v325-graphs12-reasoning-replacements-20261124.json) includes 72 choices, 60 specified wrong-choice reasoning paths and 12 worked solutions. Each was re-read after writing and its key recomputed independently using arithmetic, coordinate geometry, enumeration or linear equations. All 12 stored keys matched. This was a direct calculation and structure check, not a completed GitHub Actions run or external examiner approval.

| Source | Reasoning focus | Recomputed key |
|---|---|---|
| 001 | Perpendicular projection and reflection | (5,6) |
| 002 | Right-angle coordinate triangle area | 10 |
| 003 | Variable in both coordinates and perpendicular slope | 11/5 |
| 004 | Strict gradient inequality and integer interval | 35 |
| 005 | Equal squared distances to an axis point | 65/4 |
| 006 | Circumcentre from two equidistance constraints | 10 |
| 007 | Two valid distance-constraint parameter roots | -12 |
| 008 | Nearest-station inequality over an interval | 6 |
| 010 | Two linear cost constraints and integer count | 4 |
| 011 | Linear calibration and relative error | 40 |
| 012 | Piecewise distance-time model and valid segment | 40/3 |
| 013 | Area bisection with perpendicular line | 1 |

The provisional reasoning labels distinguish question demands, not independently approved Mastery learning objectives. In particular 005–008 share squared-distance/equidistance knowledge, 001 and 003 share perpendicular-slope knowledge, and 002/013 involve perpendicularity and area. Related objectives must be reviewed together and must not earn duplicate Mastery credit. 010 and 011 use linear modelling rather than routine gradient/intercept retrieval. Some choices use numerical shortcuts; these remain for independent pedagogical and difficulty review.

The [new regression](../tests/daily-v3-maths-v325-graphs12-source-and-reasoning-20261124.test.mjs) checks exact source identity, six distinct answer strings, five wrong explanations, all twelve key calculations, selected domain checks, and zero eligibility. It is wired into the existing Daily V3 CI workflow; its completed CI outcome is unverified at report creation.

Inventory based on V322/V323 + V324 + this new pack: 19 question-bearing packs; 128 candidate version records; 103 distinct source IDs with candidates; 61 with reasoning redesigns and 42 with editorial-only variants; 97 not represented. Graphs now 15/40 source IDs have complete candidates, 25 still need a complete variant or explicit consolidation decision. The original 200 and historical V322/V323 snapshots remain unchanged. Candidate counts are not formal approvals.

**Release remains blocked at 0/200.** Taught subskill confirmation, independent GCSE Grade 7+ calibration, plausible distractor assessment, concept credit approval and physical iPad PWA testing remain open. No student progress, Daily, MP, XP, Mastery or Recovery changes.
