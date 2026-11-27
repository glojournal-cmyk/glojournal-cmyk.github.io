# Maths Daily V3.1 — continuation QA evidence: 22 November 2026

**Release verdict: BLOCKED FOR LIVE IMPORT.** The uploaded source bank is academically and technically unapproved for live Maths Daily and must earn zero learner XP/MP or Recovery credit.

## Original verified source
- Full user source: `Lux_Maths_Y9_200_MC_V3_1_Second_Round_QA_Pack(1).zip`
- Original 200-question JSON **SHA256**: `6fa88943a4233be04fc6be9f43f2079ffb008906c155d018913541852bb94268`
- 200 fixed original question IDs, 5 topics of 40 each, 50 templates × four numerical variants. Original mathematics second pass is *self-reported*; only 10 sample stems have independently re-derived answers in this review.

## Full mathematical-display source scan
**The actual native offline MathML renderer committed in this branch was copied to a local Node test harness and the Git blob SHA was checked for an exact match:** `eee4d1adf40b2da214b692ad1259e4e74c192087`.

All original 200 question records were read from the user ZIP, and every content-bearing field was parsed using that same renderer:
| Source field | Examined | Parsed | Errors |
|---|---:|---:|---:|
| Question stems (including prose-only tickets) | 200 | 200 | 0 |
| Six A–F answer choices per question | 1,200 | 1,200 | 0 |
| Two worked-solution steps per question | 400 | 400 | 0 |
| **Total** | **1,800** | **1,800** | **0** |

First run found and fixed **8 actual currency display failures**: 8 ticket word problems have `£` *inside a math delimiter* in the worked solution; the offline MathML engine now emits native `<mtext>£</mtext>` for them. Another 8 pure prose ticket stems were correctly recognised as valid text-only questions (no MathML markup required). Source also uses `cm$^3$` and `m$^3$`; the renderer treats these as semantic units (`cm³`, `m³`) and supports all source macros (`\\frac`, `\\dfrac`, `\\times`, `\\left/right`, `\\sqrt`, `\\begin{cases}`, `\\ne`, `\\ge`, `\\mathrm`, `\\div`).

**This is a deterministic source-conversion test only. It is NOT a visual screenshot review on iPad Safari, offline PWA reopening test, or independent mathematical re-solution of all 200 stems.** The Chromium/WebKit device workflows must finish before those parts can pass.

## Academic QA editorial repairs
Two awkward pieces of symbolic working were repaired in an **offline V3.1.1 candidate** (no live source replacement or signoff):
- `LUX-MATH-Y9-REARRANGING-016`: `(1z-2)x` → `(z-2)x`
- `LUX-MATH-Y9-REARRANGING-023`: `(1z-4)x` → `(z-4)x`

Exactly two worked-step lines changed; original question IDs, question text, answer choices and keys are identical. Corrected candidate SHA256: `cb26ea0dd961228dd95e47c29b5ce210f7261e9cb06eadb7b9c6a4824f2419ae`. Specific non-live patch instructions appear in `qa-staging/math-v31-editorial-source-patches-20261122.json`. The revised candidate SHA is intentionally **not** silently substituted for the original authorised intake SHA.

## Formal admission safeguards
- `assets/daily-maths-v31-intake-gate-20261122.js` now also **requires independently computed raw-source bytes SHA256**, original source maths QA flags, exact A–F option IDs, per-question teacher subskill evidence, worked-answer checker, independently calibrated GCSE Higher band, five documented misconception distractors, and **offline iPad native MathML approval**.
- Missing any proof keeps `academicQA:'pending'`, `mathDailyEnabled:false`; uploaded self-declared `mathSecondPassVerified` cannot autoapprove.
- The real V3 planner's source manifest remains Maths `[]`, so all **200** items are still blocked for counted Daily.
- Full original 20-day selection remains read-only simulation; the original source has no individual teaching, Grade 7–9 difficulty or classroom signoff.

## Outstanding stop conditions
1. Signed teacher taught-subskill evidence (12 perpendicular-bisector items align to Spring construction/loci rather than Autumn topics; 4 fractional index and 12 radical rearranging items need specific confirmation).
2. Per-item independent GCSE Higher Grade 7–9 difficulty and misconception rationales, plus worked-method academic proof (prior 10 representative independent stem checks are not 200 proofs).
3. Current **reviewer-only** page is not the live Maths player. Actual real-card scoring through the app persistence API, iPad keyboard/touch, lesson resume, stale PWA, backup recovery and physical-device QA still to be completed.
4. GitHub Actions run to completion and latest `main` Food Tests/numeric marking fixes reconciled; **never overwrite production fixes**.

**PR #306 stays Draft, unmerged, and has not changed real learner data.**
