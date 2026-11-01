# Daily V2 — Year 7–8 French/Latin lexical marking risk review (not certification)

Date: 2026-11-01. **Read-only human-review packet, not a release approval.**

## Actual Year 8 source example: grammatical number

Source: `content/topics/fr-y8-s25-classroom-objects.json`.

- `fr-y8-src-fr-25-1229-calculator-plural`: English `calculator (plural)` → French `des calculatrices`.
- `fr-y8-src-fr-25-1230-des-calculatrices`: French `des calculatrices` → English, source `accepted` includes both `calculator (plural)` and bare `calculator`.

The latter alternative may accept an answer that does not express the source's plural number. This is a **source-specific marking concern** for educational review, not permission to globally remove English singular answers: English mass nouns and invariant plurals may be valid in other contexts.

A qualified reviewer should determine whether to accept `calculators`, `some calculators`, or an explicitly marked plural, and whether bare `calculator` should be rejected. Review answer normalization, punctuation, accent and article rules separately. Maintain both original question IDs and learner history; any future correction must be accompanied by scoring regression tests and a source-bound fingerprint update.

## Automated triage added (all pending)

`daily-v2/scripts/build-vocab-review-queue.mjs` now flags:

1. `PLURAL_CUE_DROPPED_BY_ALTERNATIVE`: an explicit `(plural)` accepted form coexists with its bare equivalent in a source answer array. This is the mechanically verifiable pattern above; not necessarily an error for every lexeme.
2. `SAME_STIMULUS_DIFFERENT_CONCEPT_ANSWERS`: two different source concept IDs ask the same language-direction + stimulus but accept different answer sets. Possible unqualified ambiguity, synonym, or deliberate acceptable variant; requires context review.
3. `DUPLICATE_CONCEPT_FOR_SAME_PROMPT`: distinct concept IDs share the same directed stimulus and accepted-answer set. May inflate the unique-concept supply even though the formal IDs differ.

The generated human-review artifact `vocab-lexical-risk-review.csv` contains each flagged source row with subject, year, topic, source question/concept IDs, input stimulus, accepted answers, source fingerprints, and pending reviewer decisions.

## Required review and release decisions

- Check the original Year 7–8 taught scope, semantic meaning, grammatical gender/number, tense and natural English equivalents.
- Check forward/reverse translation pairs and whether duplicated semantic prompts could reappear as ostensibly distinct concepts.
- Provide source-specific alternative-answer decisions, reviewer and evidence, plus a tested marking implementation.
- Retain `approvedForDaily:false`, `lexicalUnitVerified:false`, and `curriculumDecision/scoringDecision: pending` until independently signed evidence exists.
- Never count flagged or unflagged rows as released Daily V2 supply based only on this automated audit; 163/day x 30 days and physical iPad restore remain separate acceptance gates.

No live question, answer, XP/MP, pet/wardrobe, Home, Recovery, storage or student record is changed by this packet.
