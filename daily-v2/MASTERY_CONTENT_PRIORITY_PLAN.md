# Daily V2 — Mastery educational review and next targeted authoring plan
Updated 2026-10-26. **Plan and read-only QA evidence**, not certification or production deployment.

## Evidence available now
- **Full original Year 8 source audit:** 153/153 enabled topic files, 8,918 raw eligible question records, 16 catalog-to-source count discrepancies. See `QA_FULL_Y8_EXISTING_BANK_AUDIT.md`.
- **475 preliminary high-format + source-difficulty review candidates**, explicitly NOT independently approved Mastery. Actual qualified count after academic review, taught-topic verification, answer audit and already-correct exclusion = **UNKNOWN**.
- **200 newly authored provisional Mastery questions** across 10 topics, with 4 Foundation / 10 Application / 6 Challenge per pack, still 0/200 independently accredited or safe for production. See `MASTERY_BANK_BATCH1_QA.md`, `MASTERY_BANK_BATCH2_QA.md`.
- **Rubric review implementation** can document explicit per-point awards including 2/4 in staging. It deliberately never auto-marks unknown free responses, never writes XP, and has not been connected to live Daily.

## Educational priority order
1. **French:** 21 source-format/level leads across 30 topics; many important high-effort writing questions are tagged level 1–2 and must be individually reviewed rather than dismissed. Prioritise unseen mixed-tenses composition, negatives, reflexives, agreement, meaningful English↔French translation, with alternate valid forms and clear AQA-aligned marking. Add new content only for demonstrated deficits.
2. **Latin:** 65 review leads across 65 original topics, concentrated in set-text or short controlled translation. Review stimulus complexity: `servus laborat` is foundation despite source difficulty 4. Prioritise unseen multi-clause translation, tense/case agreement explanations, acceptable Latin syntax alternatives; align with OCR board once school topic evidence is checked.
3. **Biology:** 41 source leads from 37 topics; focus unfamiliar-context reasoning, digestion and photosynthesis mechanisms, valid experimental control/limitations, data interpretation. Ensure simple one-word definitions remain Foundation; model alternative correct mechanisms carefully.
4. **Chemistry:** 132 review leads across all 8 sources; examine balanced equations, charge reasoning, multi-step calculation, variable/control scenarios. One-step pH classification is not Challenge merely because format is `mark_points`.
5. **Physics:** 216 leads across 13 sources; filter light spectrum recall and formula substitution from true multi-step graph/circuit/force reasoning, experimental uncertainty, units and causal explanation.

## Nonnegotiable content gates
- Real question IDs from loaded topic JSON; no duplicate logical prompt/stimulus/concept, no previous correctly credited question republished as novel Mastery.
- Two daily 20-item Mastery tasks each maintain genuine 4/10/6 demand distribution, with full correct-answer explanation, mark schemes and teaching evidence. Partially awarded marks must not silently become full mastery.
- Human subject review with traceable reviewer identity/date, exact source fingerprint and board-specific rule. An AI-generated draft or auto-grade cannot certify its own correctness.
- For open answers, use independent reviewed rubrics and equivalent variants; until reliable semantic correctness and negation safeguards are proven, keep grading pending rather than keyword-auto-credit.
- 30 days × 40 questions = **1,200 total distinct fresh Mastery assignments** in a pure all-correct/no-repeat stress case. Current 200 new drafts plus 475 review *leads* CANNOT be added as a trustworthy supply total. Genuine student-ready capacity remains unquantified.

## Engineering / data safety
- `src/catalog-integrity.js` checks actual source eligibility against catalog and returns `mayUseCatalogCountsForDailyPlanning:false` even when nominal counts align. Eight tests pass using 153 actual audited topic snapshots; 16 discrepancies explicitly flagged. Fix source metadata only after agreement on the authoritative generator, with tests and no student state reset.
- `src/rubric-review.js`: staging-only audited manual partial credit; 12 core + 5 authored-draft tests passed. Real external marking acceptance and iPad persistence are not verified.
- Do not merge this content to `main`, include unapproved draft topics in production catalog, or rewrite student backups/XP until all release acceptance gates are met.

## Next implementation unit
1. Curriculum reviewer shortlist with real full source content for highest-potential items, and precise rejected false Challenge IDs.
2. Separate approval manifest (not inferred from old difficulty labels), tested semantic rubrics, and Year 9 taught-topic evidence.
3. Real-student-safe 30-day depletion simulation and iPad storage/progress flow QA.
