# Daily Tasks V3 — Academic QA Report
**Review date:** 22 November 2026  
**Status:** **BLOCKED FOR ACADEMIC SIGN-OFF; DO NOT DEPLOY**  
**Repository:** `glojournal-cmyk/glojournal-cmyk.github.io`  
**Scope:** existing Year 8 / Year 9 structured banks, vocabulary taught-source eligibility, proposed composite Languages Standard, Year 9 Standard B, Due Review, GCSE Higher Maths.  
**Evidence:** `scripts/daily-v3-bank-audit-20261122.mjs` run in GitHub Actions, source `content/topics/*.json`; `tests/daily-v3-contract-20261122.test.mjs`, `tests/daily-v3-vocab-20261122.test.mjs`.

## Terminology and conclusions
- **Raw** = number of question records currently stored; **not** number taught, usable or correct.
- **Structural candidate** = enabled, non-preview, non-draft, formal, non-repair item passing a *mechanical* filter only. **Not Academic-QA-accepted.**
- **Distinct candidate concepts** = unique `conceptId` (or `id` when absent) across structural candidates; concept identity is not proof of independent assessability.
- **QA accepted: 0. QA rejected: 0. QA pending: all inventoried records** *within this V3 review*. Previously performed QA on unrelated versions is not invalidated; there is simply no independently verified V3 acceptance manifest with taught-source evidence. Pending is not a declaration that a question is incorrect.

## Read-only source inventory (all are academic QA pending)
| Subject/year | Topic files | Raw | Preview | Structural candidates | Distinct candidate concept IDs |
|:--|--:|--:|--:|--:|--:|
| Biology Y8 | 37 | 1,111 | 0 | 1,097 | 563 |
| Biology Y9 | 22 | 992 | 923 | 65 | 60 |
| Chemistry Y8 | 10 | 368 | 70 | 298 | 90 |
| Chemistry Y9 | 17 | 1,222 | 1,014 | 134 | 134 |
| English Y9 | 8 | 148 | 0 | 139 | 139 |
| French Y8 | 32 | 5,635 | 171 | 4,601 | 1,754 |
| French Y9 | 23 | 814 | 0 | 814 | 676 |
| Latin Y8 | 65 | 2,502 | 0 | 2,502 | 847 |
| Latin Y9 | 9 | 1,365 | 1,359 | 6 | 6 |
| Physics Y8 | 13 | 465 | 0 | 458 | 127 |
| Physics Y9 | 18 | 1,066 | 1,062 | 0 | 0 |

**Total:** 254 topic files. A structurally zero-issue run is **not** a content or curriculum sign-off. It does not verify that answer keys are correct or questions match Tiffin Girls' School's actually covered topics.

### Examples of possible Year 9 supply, NOT approved
- French `fr-y9-oct17-future-tense-holidays-vocabulary`: 137 distinct mechanical candidates; vocabulary questions must not automatically be repurposed as independent grammar/application concepts.
- French `fr-y9-oct17-future-tense-holidays`: 98 candidate concepts.
- Chemistry `chem-y9-c7`: 44 candidate concepts.
- French `fr-y9-u4-five-tense-synthesis`: 43 candidate concepts.
- French `fr-y9-a1-five-tense-checkpoint`: 40 candidate concepts.
- Physics Y9: 0 eligible formal candidate concepts under the strict preview filter.
- Latin Y9: 6 candidate concepts under the strict preview filter.

These findings are **supply triage**, not claims of educational suitability, grade level, school coverage, or correctness.

## Taught vocabulary: blocked until source-matched
The existing `assets/daily-vocab-y9-20261021.js` has built-in Year 9 entries (and Latin booklet sources). Existence in the code is **not** confirmation a word was taught. V3's `V3_APPROVED.year9Vocabulary` is intentionally empty until each word is linked to teacher-taught, checked material and its headword/meaning/accepted forms are reviewed. Result: **20 Year 7–8 + up to 10 accepted Y9 words when available; otherwise use 7–8 words for the shortfall.** On this branch's *current empty manifest*, the safe fallback is **30 Y7–8** in each language. Earlier days' 27+3 plan remains historical.

## Language Standard: blocked until two independently approved pools exist
Required acceptance: 5 Latin and 5 French **grammar/application** concepts, teacher-taught, age-appropriate, with each answer and alternatives validated. The V3 planner refuses to present a ready card until both 5-concept groups are approved. The shared card must not complete from ten Latin answers or five Latin answers alone. Structural tests verify independent buckets, but not independent academic correctness or actual iPad scoring.

## Standard B Y9: blocked until verified ten *distinct independently assessable* taught concepts
Planner refuses a Year 8 substitute. It tests true 0, 5, 9, 10, 15, 20 candidate-concept counts in artificial controlled fixtures, including variant collapse, but **does not prove** any live Y9 topic has ten reviewed, fresh, unassisted concepts. Each accepted group needs correct marking, alternative answer checks, topic-specific teaching evidence, and proof 10 can be selected from real saved state without double-credit.

## Mastery and Due Review
Original Year 8 85% Mastery / Day 2 and 7 recall logic is intentionally reused, not rewritten. V3 supports a Year 9 Due source only where each selected concept has actually saved `reviews[id].due <= day` and a separate Y9 QA manifest. Actual learning-history + same-day overlap, Recovery, assignment continuation, and post-answer scoring require regression with real device snapshots. Consolidation must never be called genuinely due. Guided or scaffolded questions are not academically accepted for full unassisted mastery credit.

## GCSE Higher Maths — BLOCKED (no bank supplied)
No separate Maths question bank was provided in this request. **0 academic questions accepted / 0 genuine question difficulties verified.** V3 checks the intended 4 Grade 7 + 4 Grade 8 + 2 Grade 8–9 metadata bands and six distinct non-empty option IDs and texts, one correct-option ID, distractor rationales, worked solution presence and QA provenance in *synthetic unit tests*. Such a validator **cannot establish** mathematical uniqueness, equivalent symbolic solutions, appropriate grade difficulty, accurate working, plausible misconceptions, good LaTeX rendering, or fair mark schemes. These require independent specialist checking of the actual supplied bank. No random filler is allowed.

## Sign-off checklist / blockers
1. Obtain the actual teacher materials for all proposed Y9 vocabulary and Y9 Standard B; per-topic line-by-line taught-source match. Preview/question existence is not evidence.
2. Independently verify each selected question's curriculum fit, wording, unique correct answer, alternate acceptable responses, format, answer feedback and misconception traps. Count by **concept**, not item ID, and separate rejected from pending.
3. Confirm Language Standard pools: Latin 5 + French 5 genuine applied questions; verify production marking, no partial cross-credit.
4. Obtain user-supplied Maths bank. Audit every question for GCSE Higher 7–9 challenge, six mathematically unique options, correctly worked methods, readable iPad maths, repetition and spaced reattempt fairness.
5. Check actual Year 8/9 Due evidence, Mastery Day2/7, 85% pass rules, and exclusion of scaffolded or guided full-credit answers.
6. Run independent academic QA on real selected daily sets and source revisions before merge.

**Academic disposition: BLOCKED FOR LIVE IMPORT / NOT APPROVED.**
