# Daily V2 — Real bank Mastery triage: eight authentic topics

Date: 2026-10-26. Read-only topic-file analysis. No student data or source questions changed.

The staging-only analyzer `src/mastery-audit.js` inspected eight authentic enabled Year 8 JSON topic bundles from `content/topics/`. It reports **potential source-format indicators**, not Mastery accreditation, learned topics, or real pupil eligibility.

| Topic | Eligible | Difficulty 3+ with advanced-format hints | Review priority |
|---|---:|---:|---|
| Latin Adjective Agreement | 24 | 0 | Urgent — write independent grammar/application questions |
| Latin Core Verbs | 98 | 0 | Urgent — don't substitute vocabulary/morphology repetitions |
| Latin Set-text Translation | 35 | 35 | Review 4/10/6 balance; many are difficulty 4, not an entire graded Mastery |
| French KS3 Extension Irregular Verbs | 126 | 0 | Review independent composition; source difficulty 3+ alone is not enough |
| Biology Balanced Diet | 39 | 0 | Urgent — strengthen reasoning and unfamiliar application |
| Biology Digestion and Absorption | 47 | 1 | Urgent — limited challenging concepts in current metadata |
| Chemistry Formulae and Valency | 35 | 17 | Promising but educational review still required |
| Physics Speed-time Graphs | 34 | 14 | Promising but educational review still required |

**Total: 438 eligible source records; 67 source higher-format/high-difficulty candidates; ZERO independently certified Mastery questions.** An additional 55 issue flags were emitted (duplicate content candidates or high-difficulty tags applied to low-demand formats); these require review and are not automatically proven errors.

Heuristic advanced formats: `controlled_translation`, `mark_points`, `extended_response`, `practical_design`, `calculation`, with source difficulty >=3. This is only a TRIAGE filter; no shortcut passes `bank-adapter.js` certification. For example, `typed_equivalent` difficulty 4 may be demanding in context but is not automatically tagged Challenge.

## Actions needed
1. Review original full question and mark scheme, not metadata only, against subject-appropriate rubrics.
2. Record per-item reviewed roles, skill, depthBand, independent response and source fingerprint. Changes invalidate prior source-bound review.
3. Assess Year 9 taught-topic evidence and actual student previously-correct depletion with a **read-only** backup copy.
4. Author additional authentic high-quality Mastery where no sufficient 4/10/6 distribution exists.
5. Once certification and backup mapping are complete, rerun 30 days on real pupil-safe test state; synthetic tests do not establish readiness.

## Data safety
No automated changes to live content, historical marks, mastery status, XP or GitHub main. Production sign-off is still blocked.
