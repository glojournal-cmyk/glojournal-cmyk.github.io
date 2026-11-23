# Maths Academic QA — 23 November 2026, continuation: eight Grade-demand redesigns and sixteen duplicate-source consolidation

**Repository:** `glojournal-cmyk/glojournal-cmyk.github.io` | **Draft PR:** [#306](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/pull/306) | **Live Maths release:** BLOCKED

## Source snapshots re-opened

- Revised canonical 200 Maths questions: `qa-staging/math-v311-reviewed-200.json`; Git blob `0655fbc1b796bff68f533c060a43339dff6664be`; 200/200 `dailyEligible:false`.
- Thirty older V3.1.2 alternatives and their 30-item ledger retained unchanged (0/30 independently signed off).
- Eight NEW V3.1.3 replacements: [source file](../qa-staging/math-v313-eight-grade-demand-redesign-candidates-20261123.json), Git blob `85ae5991c94fadfb09489dcdd8ef9f3f0a2b91a1`, superseding eight older V3.1.2 *candidate versions*, **not** importing or changing the 200 source.
- Sixteen source-exact original rearranging records: [four-group provisional concept disposition](../qa-staging/math-v313-rearranging025-040-concept-consolidation-no-credit-20261123.json), Git blob `0a1de4378b3c88198166e02934f9d556e56e313d`.
- Three source-linked distinct technique anchors: [029,033,037 alternatives](../qa-staging/math-v313-rearranging029-033-037-distinct-anchor-candidates-20261123.json), Git blob `c1f7f65a6d96453b3a4b418dfb1a7d083cbd393f`.

No user progress was read, overwritten, backdated, replayed or awarded. **NO MERGE / NO DEPLOY.** The Tiffin Girls Year 9 curriculum PDF was **intentionally NOT fetched**, following the parent's explicit instruction.

## Eight Grade-demand repairs (8 questions, 48 complete choices)

Previously all eight were flagged as possibly too routine to claim GCSE Higher Grade7+ independent demand. They now include additional genuinely assessable reasoning decisions. Their **grade classification remains provisional**; neither AO2/AO3 labels nor number of steps prove Grade7+.

| Exact source ID | Correct key | Rebuilt problem type / independently derived mathematics | Remaining educational gate |
|---|:---:|---|---|
| INDICES-006 | C | Perfect-cube exponents and perfect-square parity plus constrained integer optimisation; admissible pairs (6,3), (6,9), (12,3), maximum ab=54 | Realism of multivariate integer constraints; possible overlap with INDICES-008 |
| REARRANGING-001 | C | Invert rational function then enforce strict output bounds and count **five** valid integer inputs x=2..6 | Similar discrete-domain concepts to REARRANGING-019 |
| REARRANGING-003 | A | Rationalise two square roots, derive x in terms of y, exact output range, and solve x=16/9 for y=1/3 | Exact taught surd inversion and distinctness from REARRANGING-005 |
| REARRANGING-009 | C | Infer k=3 from an observation, make x the subject, determine attained/unattained range 4/5≤y<3/2 | Overlap with other calibration and rational-output tasks |
| REARRANGING-012 | D | Inverse rational function and a non-negative fixed point x=(2+√34)/3, with range 2<y≤5 | Actual taught quadratic formula and distinctness from 018 |
| REARRANGING-014 | D | Two inverse quadratic branches: exactly two allowed x values for 4<y≤13 | Distinctness from another two-branch radical question |
| REARRANGING-017 | D | Intersection of rational curve with quadratic; exclude original removable hole at x=5, leaving (-1,4) only | School coverage of algebraic-domain exclusion |
| REARRANGING-019 | C | Derive integer threshold x≥2 then maximise rational finite difference y(x+1)−y(x), result 3/65 | Likely more advanced rational-sequence subskill |

### Independent executable technical-maths evidence

The QA-only verifier [`math-v313-eight-grade-demand-verifier.js`](../assets/math-study/math-v313-eight-grade-demand-verifier.js) **derives answers again from the actual stem coefficients and conditions**, not from the supplied `correctOptionId`. The associated [Node regression](../tests/daily-v3-maths-v313-eight-stem-first-independent-and-credit-deny-20261123.test.mjs) tests pinned revision lineage, six distinct A–F strings, wrong-route descriptions, native MathML parsing, source-derived answers, and refusal to approve.

**Direct V8 execution evidence:** 8/8 source-derived keys verified, 80/80 native MathML fragments parsed, 23/23 adversarial test mutations rejected. These are 8 mathematical correct-key verifications plus structural checks; **they do not certify all 40 distractors as representative of independently observed student mistakes.** The GitHub Actions workflow has these unit tests wired into syntax + Node steps; consult the latest completed run before calling official CI passed.

### Recognised curriculum and assessment standard

AQA 8300 describes AO2 mathematical reasoning and AO3 problem-solving; see [AQA 8300 assessment objectives](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment). Official [Ofqual Mathematics grade descriptors](https://www.gov.uk/government/publications/grade-descriptors-for-gcses-graded-9-to-1/grade-descriptors-for-gcses-graded-9-to-1-mathematics) emphasise substantial chains of reasoning at higher performance. This does **not** establish an official numeric grade for an isolated MCQ. No school class record was used to certify exact subskills.

## REARRANGING-025–040: sixteen → four provisional method groups, all non-credit

| Source IDs | Source method family | Source-level disposition |
|---|---|---|
| 025–028 | shifted reciprocal square-root inversion | **HOLD four**. Existing redesigned radical tasks overlap. Do not create fabricated Grade7+ filler |
| 029–032 | shifted rational linear-fraction inversion | **HOLD four**. One newly staged anchor 029 uses symmetric rational function and non-negative-square global minimum |
| 033–036 | nested reciprocal cancellation | **HOLD four**. One new anchor 033 explicitly excludes original hole y=1 and asymptotic y=2 |
| 037–040 | radical of rational expression | **HOLD four**. One new anchor 037 proves source-domain split and excludes output y=1+√2 |

The exact 16-row [concept disposition file](../qa-staging/math-v313-rearranging025-040-concept-consolidation-no-credit-20261123.json) identifies 4 provisional anchors and **12 non-distinct numeric variants**, without claiming final pedagogical equivalence; an independent reviewer can later override a grouping with evidence.

Three anchor drafts contain 18 options and 15 error-route explanations. In direct source-derived checks, all three mathematical correct statements passed 31 numerical probes and **30/30** exact native offline-MathML fields parsed. 0/3 educational approval. Additional [CI test](../tests/daily-v3-maths-v313-16-family-consolidation-3-anchor-qa-20261123.test.mjs) checks all 16 exact source identities, four groups, zero credit, and these three new mathematical identities.

## Release gate — still BLOCKED

- Original revised bank: **200/200 Daily ineligible, 0/200 formal Academic approvals**.
- Older thirty alternatives: **0/30 formal approvals**.
- V313 eight superseding alternatives + three new anchors: **11/11 academic HOLD**, all `dailyEligible:false`, `masteryEligible:false`.
- Independent GCSE Higher Grade7+ benchmark, taught subskill confirmation, empirical student misconception realism, original source/PDF visual fidelity, physical iPad PWA reload/offline/storage persistence and live scoring isolation remain unapproved.
- A green technical workflow must **not** be counted as a pedagogical approval, a physical-device signoff, a merge permission, or an XP/MP/Mastery credit.
- Current `main` Food Tests and numeric marking repairs must be preserved. Do not force-merge the Draft PR.

**Next substantive QA wave:** independently calibrate grade demand for the 11 drafts, check conceptual overlap in the eight candidate group, and continue high-value Graphs and Simultaneous candidate improvement without assigning credit before evidence.
