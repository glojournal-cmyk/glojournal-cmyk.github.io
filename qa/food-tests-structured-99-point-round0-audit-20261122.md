# Food Tests — structured 52-question / 99-point candidate (Round 0, 22 Nov 2026)

**Decision: HOLD / DO NOT MERGE / DO NOT DEPLOY / 0 OF 143 ACADEMICALLY APPROVED.**

## Evidence and source control
- Original live baseline checked: `main 2e556ffcb48f6c7346b3b663f8058f57271b643d`.
- QA-only branch: `qa/p0-eligibility-2e556ff`, candidate created at `4ad09a94cca1600294291bbf3ec9cf9470422657`.
- Existing draft source: `qa/food-tests-structured-mark-points-draft-20261122.json` (blob `a2503fcf252e0f8f432dd83ebdf258025d7a2d59`).
- New reviewer **candidate, not an approved bank**: `qa/food-tests-structured-99-point-review-candidate-20261122.json`.
- The existing `content/topics/bio-y8-food-tests.json` and student history were not changed by this work.

## Round 0 coverage checks (read back from GitHub)
| Requirement | Observed | Decision |
|---|---:|---|
| Original source questions represented | 52 / 52 | Structural coverage yes |
| Original independent mark points preserved | 99 / 99 | Structural coverage yes |
| Four options per point | 99 / 99 (396 options total) | Structural coverage yes |
| Duplicate option IDs in same point | 0 | Structural coverage yes |
| Missing keyed options | 0 | Structural coverage yes |
| Correct-option position distribution | A 25 / B 25 / C 24 / D 25 | No position-only bias in draft |
| Candidate mark points individually approved | 0 / 99 | **HOLD** |
| Original Food Tests questions academically approved | 0 / 143 | **HOLD** |

## Explicit Academic QA defects / risks — not a pass
1. **Distractor plausibility NOT SIGNED OFF.** The reported count is DISPUTED: an independent follow-up reports **55/297**, while a reproducible read-back using `\\b(always|never|cannot|can't|automatically|guarantees?|impossible|only|all|every)\\b` (case-insensitive, testing each wrong option once) yields **65/297**; excluding the term `all` gives **54/297**. These are not reconcilable without the exact 55-count code or scope. The number is NOT a signoff metric. Absolutist wording may reveal wrong choices trivially. **19/297** wrong options have five or fewer words. Every distractor requires individual academic QA.
2. **Independent stem quality NOT SIGNED OFF.** In 44 source items, several mark points intentionally inherit the same scenario stem. Although the four choices differ, the exact sub-question focus and independence must be checked by a subject reviewer. The `concept` property is a **key**, and must never be rendered to pupils.
3. **Key verification incomplete.** The choice matching the source's `concept` is identifiable by schema, but this only establishes faithful transcription of the *draft concept*, not independent scientific adjudication. Four distractors may overlap semantically or depend on omitted lab conditions; each requires checking.
4. **Source curricula and actual taught sequence pending.** A generic Year 8 Food Tests topic label alone does not prove any particular class has been taught that subskill.
5. **Clinical safety / laboratory risk wording pending.** Ethanol is flammable and must not be heated over an open flame. Review that no distractor can be misconstrued as an endorsed instruction; only a reviewer-only draft exists now.
6. **Old free-text mismarking remains unresolved.** Previously recorded held-out tests matched 45/74 after adjustment of an ambiguous all-negative expectation, leaving 29 correct unseen paraphrases under-scored. Do not expand a global synonym matcher or silently award marks from this draft.
7. **Real iPad and live Daily/XP/MP/Mastery/Recovery tests not performed.** No player is enabled for these draft options, and formal credit gates remain closed.
8. **No independently qualified subject-reviewer signoff.** This report is authoring and structural QA, NOT independent Academic QA.

## Automatic test setup
- Test file: `tests/food-tests-99-point-candidate-qa-20261122.test.mjs`.
- Added to `.github/workflows/food-tests-qa-automatic-20261122.yml` on the QA branch (commit `f2d3e7bbde43be449fbbea80e1b3f19e8da49d97`).
- CI commands:
  - `node --test tests/food-tests-qa-credit-hold-20261122.test.mjs`
  - `node --test tests/food-tests-99-point-candidate-qa-20261122.test.mjs`
  - Existing Food Tests historical/unseen regressions remain in workflow.
- Initial no-deploy Food Tests workflow [run 45064824159](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45064824159) **succeeded technically**, but its unseen diagnostic ran with `--write` only; 29 known unseen paraphrase mismatches were not an exit-code failure. **DO NOT call unseen testing PASS.**
- Follow-up QA-branch CI changed to `--write --strict` at commit `34b03b632ee2725a43b1eb691bb08ac4f57b51dd`; with known unresolved mismatches the strict step is expected to fail. This is **not a production regression**: it explicitly exposes a pre-existing academic acceptance failure. New CI completion must be checked independently.
- `MERGEABLE` on GitHub means no merge conflict; it is NOT Academic QA signoff. The Draft PR must remain unmerged/unreleased. Passing or failing workflows are not a reliable merge barrier without enforceable branch protection / required checks.
- A Vercel combined commit status currently says failure with `upgradeToPro=build-rate-limit`; this is not evidence that the Node tests passed or failed.

## Next required reviewer actions
Per independent point, confirm: source stem → sole scientifically correct choice → three scientifically false yet plausible distractors → contextual conditions → correct marking policy → actual Year 8 taught status → accessible iPad option display. Reject or repair any ambiguity, repeat, trivial cue or source-key error. Add reviewer identity/date/evidence and a second round of adversarial tests. Keep every item off Daily credit until all gates pass.

**Release/credit decision: BLOCKED.** No main merge, no live deployment, no history mutation, and no question-bank import.
