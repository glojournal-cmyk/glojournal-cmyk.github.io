# Latin Year 8 — micro-topic consolidation design & source QA (2026-11-01)

**Status: isolation/staging only; not live Practice, not Daily, no MP/XP/learner data changes.**

## School source
[Tiffin Girls' School Year 8 Classics Curriculum Outline 2026–27](https://fra1.digitaloceanspaces.com/tiffingirls.org/wp-content/uploads/2026/07/10161333/Classics-Curriculum-Outline-Y8-20226-7.pdf), pp. 1–3, sets out:
- Autumn Stages 8–10: accusative plurals, superlatives, dative, comparatives and present verb endings.
- Late autumn Stage 11: verbs with dative, interrogative particles, perfect tense formation.
- Spring Stage 12: perfect and imperfect, all of Book I revision; Cullen & Taylor Chapter 2 with nominal/accusative/dative/genitive noun forms.
- Summer: ablative, prepositions and governed cases, infinitives/principal parts/conjugations, expressing locations and time.
- Assessment emphasis: vocabulary, cases and grammatical terms, Latin-English passage translation, unseen comprehension, scaffolded English-Latin translation.

## Why not simply add 20 MCQs to every one-line topic?
The live Year 8 catalog contains 65 Latin topics and 34 of them have fewer than 15 questions, often because a legitimate subskill is represented by 1–14 questions only. Many short packs are multiple-choice recognition. Padding every pack to 20 recognition items could train memorisation rather than comprehension and distort Mastery.

## Safe, explicit source groupings
The source-bound manifest is `content/year8-latin-composites-20261101.json` and declares four **candidate only** practice composites. Grouping does not change the original topics, their files, their question IDs, their answers or the student's saved topic history:

1. Noun cases and grammar roles (accusative, genitive, case role, etc.)
2. Present/perfect/imperfect verb skills and finding the finite verb
3. Short sentence translation and basic comprehension (excluding uncertain historical set-text provenance)
4. Prepositions, cases governed and expressing location

All four groups explicitly demand **learner-taught-status validation** at actual assignment time. The later stages must not appear early simply because they fall somewhere within Year 8.

## No unsupported Year 9 or unseen material
`la-y8-pluperfect-recognition` is excluded because pluperfect is not listed in the 2026–27 Year 8 course outline (which explicitly identifies present, perfect and imperfect). Specific old set-text packs are omitted until passage and school-stage provenance is verified. We do not move any Year 9 Latin chapter content into Year 8, nor claim source topic names alone demonstrate teaching.

## QA machinery
`scripts/year8-latin-composite-audit-20261101.mjs` reads genuine existing original topic JSON and returns a **synthetic** preview of at most 15 references: `topicId`, original question `id`, original `conceptId`, `format`. It deduplicates source IDs, concepts and prompt/stimulus pairs and can exclude past-correct IDs and concepts. It reports a shortage when exhausted rather than fabricating completions. The sample is never scored or saved.

`tests/year8-latin-composite-20261101.mjs` checks all sources exist and are correctly marked Year 8, that composite topics do not overlap, that 15-question preview sets have no duplicate IDs/concepts, past correct content is excluded and a wholly exhausted bank returns `shortfall=15`. Source-only CI artifacts report each group's *real* volume.

### Release gates
- Independently check all proposed source terms/translation keys and accepted English alternatives in context, including case and tense ambiguity.
- Confirm with taught-stage and historical correct-answer evidence before adding to live Daily.
- Protect already locked assignments, 48-hour Recovery, XP/MP, Pet wardrobe, and legacy topic mastery IDs.
- Implement learner-aware global allocator plus fair grading and run actual browser/iPad QA before enabling any new composite in the product.

This is a **working grouping prototype**, not a production change or certified Mastery supply.
