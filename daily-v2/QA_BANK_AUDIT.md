# Daily V2 — initial Year 8 bank coverage audit
Snapshot: GitHub `content/catalog.json` default branch, 2026-10-26.
Read-only metadata audit, NOT a proof that a topic contains 20 quality Mastery questions.

| Subject | Enabled topics | Topics with >=20 enabled questions | Of those, >=5 questions with potentially higher-order formats | Total enabled question records |
|---|---:|---:|---:|---:|
| latin | 65 | 29 | 1 | 2492 |
| french | 30 | 30 | 26 | 4601 |
| biology | 37 | 27 | 27 | 1001 |
| chemistry | 8 | 8 | 8 | 280 |
| physics | 13 | 13 | 13 | 455 |

Heuristic higher-order formats: `mark_points`, `extended_response`, `practical_design`, `calculation`, `controlled_translation`, `unordered_set`. They are **not automatically Mastery quality**: a Biology `mark_points` item can be a simple definition, while a Latin `typed_exact` item may require grammar reasoning.

## Important findings
- Latin has many large vocab/case tables but almost no topics with five explicitly higher-order-format items. Set-text translation is promising; grammar and passage analysis need independent educational audit.
- French has ample items, but an irregular verb controlled translation or typed equivalent answer is not automatically deep application. Writing and mixed tense quality must be checked.
- Biology frequently has named mark-point questions at difficulty 1–2; depth should be verified.
- Chemistry and Physics topic counts look structurally sufficient but each topic must be filtered against previous correct Question IDs, student taught status and duplicate prompts.
- Year 9 bank supply and user-specific already-correct depletion are NOT audited in these totals.
- Actual Daily V2 planner requires `roles` and explicit reviewed `depthBand`/skill labels. Existing catalog metadata does not provide certification automatically. Until adapter + educational review are completed, the strict planner is expected to block many real-bank assignments rather than hand out weak substitutes.

## Next required audit before integration
1. Load real question JSON topic-by-topic in a staging audit script; validate unique IDs and accepted marking schemes.
2. Map topic learning evidence, Y9 taught topics and legacy correct IDs.
3. Independently mark every Mastery candidate as foundation/application/challenge, retaining the source question ID and rubric.
4. Simulate 30-day allocation against representative and actual safe-copy historical progress.
5. Record per-task shortage errors and author only genuinely missing high-quality questions.
