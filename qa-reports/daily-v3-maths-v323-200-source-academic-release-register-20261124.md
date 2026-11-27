# Maths Academic QA V3.2.3 — 200/200 exact canonical source register, not 200/200 approval

**24 November 2026 | Draft PR #306 | 0/200 formally academically approved | NO MERGE / NO DEPLOY / NO STUDENT SCORING**

## Source integrity and what “200/200” means

Reopened the canonical reviewed Maths question bank `qa-staging/math-v311-reviewed-200.json`, Git blob **`0655fbc1b796bff68f533c060a43339dff6664be`**, and its **source-exact 200-row V311 academic triage**. All 200 original source IDs, revision IDs, literal question stems, answer-option keys, correct-answer expressions and topic identifiers are unchanged. All 200 originals continue to have `dailyEligible:false`.

This wave **does not** declare any original item independently Grade 7+ certified or academically signed off. It **consolidates every individual canonical item’s existing unresolved educational gate**, so progress is no longer obscured by separate incomplete packs.

The new [V323 all-200 source audit register](../qa-staging/math-v323-canonical200-all-topics-hold-dispositions-source-exact-20261124.json) holds 200 source-exact rows with their original Grade label, triage action, any updated source-specific educational evidence, historical QA candidate availability, and explicit grade/teaching/student credit device blockers.

| Canonical source topic | Original source IDs held |
|---|---:|
| Indices | 40 |
| Standard Form | 40 |
| Changing the Subject | 40 |
| Straight-Line Graphs | 40 |
| Simultaneous Equations | 40 |
| **Total** | **200/200** |

The older **original academic triage categories**, all still with no formal approvals, are:

| Original source triage | Count | Unresolved decision |
|---|---:|---|
| `UPGRADE_STEM_FOR_G7PLUS` | **79** | Make the task genuinely require independent reasoning and secure educational benchmark |
| `QUARANTINE_TAUGHT_SCOPE` | **80** | Confirm each specific demanding technique was taught, not merely within broad Autumn topic |
| `REWRITE_CONTEXT_OR_DUPLICATE` | **17** | Redesign or distinguish actual method/diagnostic concept before any Mastery credit |
| `RETAIN_FOR_EXTERNAL_BENCHMARK` | **24** | Original “retain” meant review priority, not approval; V314 has already re-screened these |
| **Total** | **200** | **Formal approved = 0/200** |

Some original generalized warnings have later proved stale. The V323 register includes the **newer source-specific evidence**, rather than treating old family-level warnings as verified current defects:

- **24** Graphs/Simultaneous `RETAIN_FOR_EXTERNAL_BENCHMARK` items were re-screened under the AQA AO1/AO2/AO3 framework; 16 largely procedural Graphs examples, 4 ticket-model examples and 4 parameter-case reasoning examples still await independent Grade 7+ calibration.
- **12** Standard Form source rows have explicit retraction/qualification of misleading *historical* risk flags. These remain held for separate educational reasons.
- **16** Changing-the-Subject original IDs (025–040) have additional four-family numerical-variant/independent-Mastery concept holds, with provisional anchors rather than treating each coefficient change as its own concept.

These account for **52 source-specific review records**; they are not 52 independently approved questions, nor proof that 52 mathematical items were newly rechecked today.

## Full candidate-coverage cross-reference

The [global V322 version history](../qa-staging/math-v322-all-versioned-candidate-packs-200-source-dedup-and-credit-deny-20261124.json) was joined to each of the **200 source IDs**:

| Candidate presence across 17 versioned question packs | Count of original source IDs |
|---|---:|
| Has a true reasoning or topic-redesign candidate | **45** |
| Has only an original-stem editorial rationale repair | **42** |
| Has no complete `questions[]` candidate in those packs | **113** |
| **Total** | **200** |

The original bank nevertheless has topic-specific and earlier mathematical source QA tests. **No complete candidate file** must not be reinterpreted as **no previous academic review**. Conversely, an existing candidate still requires individual pedagogical Grade 7+ judgement, exact Year 9 taught-skill confirmation and independent wrong-answer plausibility before any student-facing import.

Do **not** import 112 candidate versions into 200 original slots: the 112 records represent only 87 distinct source IDs; 20 source IDs have more than one candidate version, and 12 combine incompatible original-wording and rebuilt-question variants. V322 correctly keeps all historical alternatives quarantined.

## Meaning of current Technical QA

A [new V323 canonical 200-row regression](../tests/daily-v3-maths-v323-200-canonical-source-academic-release-holds-20261124.test.mjs) now derives each exact source identity and release hold from the actual bank and the five existing evidence files, checks the original answer-key identity, reads all 200 question texts and verifies none has `dailyEligible:true`. It reconciles the 87/113 candidate presence and the 24/12/16 recent source-specific reviews. The [V322 global candidate test](../tests/daily-v3-maths-v322-source-candidate-global-registry-20261124.test.mjs) separately verifies 112 staged QA question versions across 17 exact Git SHA-pinned files, option uniqueness, original-stem editorial fidelity, and the repaired N9 false-answer shortcut.

**These are audit integrity and safety tests, not a substitute for solving, independently grade-calibrating and checking every actual question in a classroom or on paper.** The files are now wired to the Daily V3 GitHub Actions syntax/unit workflow. Do not call the latest V322 or V323 workflow successful without seeing a completed `success` status.

## Remaining acceptance barriers

1. **Actual school-taught skill confirmation** remains unknown. The Tiffin Girls Year 9 curriculum PDF was deliberately skipped at the parent's express request. The school’s exact taught sequence cannot therefore be asserted from broad GCSE subject coverage.
2. **Independent Grade 7+** calibration is absent. AQA GCSE 8300 identifies AO1 routine multi-step techniques separately from AO2 reasoning and AO3 problem-solving. A real AQA Higher paper comparison has been added for selected drafted questions, but **a Higher-tier exemplar does not itself assign Grade 7 to our MCQ**.
3. **Concept credit** must be decided at independent learning-objective level: coefficients, contexts, and historical candidate versions are not new Mastery concepts.
4. **Wrong-option plausible student error mechanisms** have source-derived arithmetic evidence for many errors, but they have not been independently validated against actual students.
5. **Physical iPad PWA acceptance** (display, offline handling, persistence, completion/score isolation) remains unsigned. Green Node or browser CI is not evidence of real-device acceptance.
6. **Daily app integration** is deliberately withheld: no draft earns automatic Daily/XP/MP/Mastery/Recovery credit, and 10-question six-option Maths Daily selection must await approval and separate scoring QA.

**Explicit decision: 200/200 canonical source items registered, 0/200 academically approved, source bank unchanged, PR #306 Draft, NO MERGE, NO DEPLOY, NO LIVE IMPORT OR SCORE WRITE.**
