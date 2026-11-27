# Lux et Labor — 23 November Maths QA continuation: 30 revised alternatives + REARRANGING 025–040 source audit

**PR #306 · Draft branch `feature/daily-tasks-v3-20261122` · Academic approval 0/200 · DO NOT MERGE OR DEPLOY**

## Scope and evidence

I reopened the branch's actual `math-v311-reviewed-200.json`, the full 30-row candidate register, each of its eight source packs (original question stems, all A–F statements and answer explanations), and the unredesigned original REARRANGING-025–040. The 30 candidates are **separate alternatives**, not extra published questions: 30/30 pending, 0/30 approved. The unchanged revised bank contains 200 unique source items, all `dailyEligible:false`, 0/200 academically approved.

The source-independent mathematical validations previously committed are not an independent teacher's GCSE Grade 7+ benchmarking, nor proof of frequency of a wrong answer in real pupils. The official school outline PDF remains **SKIPPED per the parent's instruction**, not a prerequisite to continuing staging QA. Exact taught subskills remain unconfirmed; do not assert that they are untaught.

## Two staging candidate corrections, including a substantive physical-plausibility repair

- **STANDARD_FORM-013** — Six possible costs were already mathematically consistent. The written solution's comparison stopped after 0–4 B-drives, leaving a formal proof gap. It now explicitly handles all B-drive counts **b≥5**: those alone cost at least £275, exceeding the feasible **£174** with two A and two B. This establishes a global minimum rather than a mere enumerated minimum.
- **STANDARD_FORM-014** — The original candidate mass **3.7×10⁵ g** and volume **8.0×10² cm³** imply an implausible solid-sample density of roughly **463 g/cm³**, far above even osmium (~22.6 g/cm³; [Royal Society of Chemistry](https://periodic-table.rsc.org/element/76/)). The **QA-only mineral candidate** has therefore been substantively corrected to mass **3.7×10³ g** (2 s.f.), volume **8.0×10² cm³** (2 s.f.), and all six A–F values were scaled, recalculated and rechecked. The mass upper endpoint **3750 g** is excluded, volume lower bound **795 cm³** is included, and the limiting upper density is **3750/795 ≈ 4.716981 g/cm³**, expressed as **4.72×10⁰ g/cm³ (option E)** to 3 s.f. The stem and worked explanation explicitly distinguish an *unattained supremum* from an attained maximum.

These source/wording/physical-context corrections were made to the independent QA-only pack; the 30-row ledger now pins its Git blob SHA `740c7a7605bcf608851d7d9ebaaf0f4a70a55f50`. Its historical 26-row snapshot stays anchored to the earlier blob. Nothing was changed in the 200-question student source, course progress, answer records, XP/MP/Mastery or release policy.

## Provisional grade demand and misconception follow-up for all 30

This is a **reviewer triage**, not certified grades. Eight items are flagged for a probable routine-algebra challenge deficit requiring rewritten demand or an explicit independent benchmark. Six receive an additional focused taught-subskill check. The number of concept-overlap flags comes from the saved 17-pair review register, and **does not** automatically mean two questions are mathematically equivalent.

| Candidate exact source suffix | Current key | Pending challenge / scope action | Overlap alerts |
|---|:---:|---|---:|
| INDICES-005 | A | Benchmark pending | 0 |
| INDICES-006 | C | **Grade-demand concern** | 0 |
| INDICES-007 | B | Benchmark pending | 0 |
| INDICES-008 | D | Benchmark pending | 1 |
| STANDARD_FORM-013 | B | Benchmark pending | 1 |
| STANDARD_FORM-014 | E | Benchmark pending | 0 |
| STANDARD_FORM-015 | A | Benchmark pending + taught-subskill check | 0 |
| STANDARD_FORM-016 | E | Benchmark pending | 1 |
| REARRANGING-009 | C | **Grade-demand concern** | 1 |
| REARRANGING-010 | C | Benchmark pending | 1 |
| REARRANGING-011 | D | Benchmark pending | 1 |
| REARRANGING-017 | D | **Grade-demand concern** | 0 |
| REARRANGING-012 | A | **Grade-demand concern** | 2 |
| REARRANGING-013 | A | Benchmark pending | 2 |
| REARRANGING-014 | A | **Grade-demand concern** | 4 |
| REARRANGING-015 | D | Benchmark pending | 1 |
| REARRANGING-018 | D | Benchmark pending | 1 |
| REARRANGING-024 | E | Benchmark pending + taught-subskill check | 2 |
| REARRANGING-001 | A | **Grade-demand concern** | 2 |
| REARRANGING-002 | B | Benchmark pending | 1 |
| REARRANGING-003 | C | **Grade-demand concern** | 2 |
| REARRANGING-004 | D | Benchmark pending | 1 |
| REARRANGING-005 | B | Benchmark pending + taught-subskill check | 1 |
| REARRANGING-006 | D | Benchmark pending + taught-subskill check | 2 |
| REARRANGING-007 | F | Benchmark pending | 1 |
| REARRANGING-008 | B | Benchmark pending | 1 |
| REARRANGING-019 | F | **Grade-demand concern** | 2 |
| REARRANGING-020 | E | Benchmark pending + taught-subskill check | 1 |
| REARRANGING-021 | A | Benchmark pending + taught-subskill check | 1 |
| REARRANGING-022 | F | Benchmark pending | 1 |

### High-priority challenge-deficit flags

- **INDICES-006**: Integer bounds plus square-parity is fairly mechanical; demand Grade 7+ benchmark before claiming challenge.
- **REARRANGING-001**: Same rational inverse plus endpoint as Q012/019; potentially routine, concept reuse.
- **REARRANGING-003**: Simplify a square-root quotient then square; possible AO1-only despite its context.
- **REARRANGING-009**: One linear-fractional inversion and a pole; possible lower-demand Higher item.
- **REARRANGING-012**: Routine reciprocal inversion and endpoints; overlaps Q001 and Q010.
- **REARRANGING-014**: Simple single-square inversion x>=3; likely not sufficient evidence of Grade 7+.
- **REARRANGING-017**: Cancellation then record removable hole; short AO1/2 task, Grade 7+ not established.
- **REARRANGING-019**: Extra y restriction adds a real step, but its inverse and interval strongly resemble Q001 and Q012.

### Specific teaching-scope flags (no new school PDF retrieval)

- **STANDARD_FORM-015**: Uses reverse percentages; separate Spring sequence flagged. Confirm prior teaching without fetching TGS PDF.
- **REARRANGING-020**: Composite rational-function inverse; explicit class coverage needed.
- **REARRANGING-021**: Uses unattained asymptote to infer a parameter; exact classroom exposure needed.
- **REARRANGING-024**: General-parameter quadratic-formula inversion; exact class coverage needed.
- **REARRANGING-006**: Quadratic substitution and radical branch selection; exact classroom exposure needed.
- **REARRANGING-005**: Two-radical inverse with squaring and spurious branch; exact class coverage needed.

The other candidates are not “passed”. Independently graded demand, option-by-option *authentic* pupil error prevalence, full original printed PDF fidelity and physical iPad PWA evidence remain unapproved. At least 17 pairwise overlap alerts across 24 candidates still need a Mastery concept equivalence decision.

## New individual source register: REARRANGING-025–040 (16 IDs)

A new source-identity-locked [16-row register](../qa-staging/math-v311-rearranging025-040-16-source-exact-pedagogical-holds-20261123.json) records the actual source stems, source keys, old revision IDs and explicit educational HOLD for every item. The exact Q025–040 items are divided into these four numeric-substitution families:

| Exact IDs | Four-question family | Academic QA finding / required correction |
|---|---|---|
| 025–028 | `y=a+b/√(cx+d)` | Four versions of isolate reciprocal, square and solve. Need explicit positive denominator/domain and a task requiring additional reasoning, not another coefficient change |
| 029–032 | `y=a+b(x+c)/(dx+e)` | Four versions of shifted rational inversion; poles must be explained and a unique independent AO2/AO3 demand added |
| 033–036 | `y=a+b/(b+c/(x+a))` | Nested fraction variants. Worked solutions must exclude **two unavailable outputs**, `y=a` and `y=a+1`; no four separate Mastery concepts merely for different coefficients |
| 037–040 | `y=a+√((bx+c)/(dx+e))` | Four radical-rational variants, including two syntactic subforms with denominator `x+constant` and two with `2x+constant`. The source's radicand domain and excluded asymptotic output `y=a+√(b/d)` must be taught and assessed |

The 16 items are **not new approved questions**; it is not legitimate to convert them to Daily merely because their existing correct keys were verified earlier. The new two-test regression compares all 16 exact IDs, original keys and revisions, insists on zero eligibility and detects the **1,1,1,2** numeric-neutral patterns across four technique groups. It is wired into the existing Draft PR's workflow; a completed green GitHub Actions run is **not yet asserted**.

## Next repair priority

1. Redesign the eight flagged routine-risk candidate tasks, not just distractor wording.
2. Consolidate each same-technique Q025–040 family or replace four members with distinctly demanding reasoning tasks, each with six plausible A–F statements and independently checked keys.
3. Audit Grade 7+ challenge and taught-scope of remaining Graphs/Simultaneous source families; preserve Autumn vs Spring quarantines.
4. Only after actual educational certification and device scoring proof should a new release gate review be proposed.

**Current release gate: 0/200 original Maths approvals, 0/30 revised alternative approvals, 200/200 original source credit blocked; PR Draft only. NO LIVE IMPORT, NO MERGE, NO DEPLOY, NO learner reward/state writes.**
