# Year 9 November Latin — Unseen MC academic quality audit

**Date:** 14 November 2026  
**Material:** five original Latin unseen reading passages and fifty four-option MC items in `unseen-passages.js`  
**Review status:** assistant academic-content review completed; regression / publication status is reported separately by GitHub Actions. This is **not** endorsement or moderation by the school or OCR.

## Source hierarchy and boundaries

1. **School's exact teaching source**: *Year 9 November Latin Assessment: Revision Guide* (provided file: `Y9 November 2026 revision guide.docx`). Examination week commencing 23 November 2026, 50 minutes, A English→Latin 11 marks, B Latin reading comprehension 14 marks, C Latin→English passage translation 50 marks. For reading/comprehension: Taylor Chapters 1–3; 1st/2nd-declension nouns; regular present/imperfect/perfect/infinitive/imperative; present/imperfect/infinitives of `sum`/`possum`; 2-1-2 adjectives; chapter prepositions and cases; special city forms; accusative of duration.
2. **School vocabulary in this project**: `assets/latin-vocabulary-booklet-20261023.js` provides the 130 basic headword entries across Taylor Chapters 1–3. Every Latin word in the five passages was reconciled to an inflected form of one of these headwords.
3. **External assessment reference**: [OCR Latin J282/01 official overview](https://www.ocr.org.uk/qualifications/gcse/latin-j282-from-2016/specification-at-a-glance/). The actual GCSE language component examines unseen reading comprehension and translation, not these specific MC questions. Thus these exercises are **GCSE-inspired skill practice adapted to MC**, not actual or predicted official GCSE questions.

## Full passage and question audit

| Passage | Latin words | MC answer key | Tested skills | Content review |
|---|---:|---:|---|---|
| 1. The missing letter | 66 | 10/10 | location, dative, infinitive, negation, detail, tense, case, roles, sequence | Reviewed |
| 2. The horse at the forum | 79 | 10/10 | roles, tense, preposition, movement, sequence, comprehension, syntax, negation, detail | Reviewed |
| 3. A journey to the island | 73 | 10/10 | city, detail, inference, duration, genitive, roles, dative | Reviewed |
| 4. Danger at the temple | 75 | 10/10 | detail, roles, dative, comprehension, imperative, movement, genitive, negation, tense | Reviewed |
| 5. The alarm at the market | 86 | 10/10 | detail, roles, reported speech, tense, inference, sequence, adjective, preposition | Reviewed |

**Scope:** 137 distinct Latin surface forms across the 5 passages; **137/137 explicitly mapped** to Taylor Chapter 1–3 dictionary headwords; **0 unreviewed/out-of-scope forms** in the audited passages. This is an exhaustive check against this school's uploaded vocabulary booklet, not a general Latin parser. Cases and conjugations were also checked in context.

**Key integrity:** 50/50 correct-answer texts independently approved against questions and source passages; every MC contains four distinct options and an exact extract from the Latin supporting the intended answer. Generated correct-answer slots are balanced in the source; student-facing A/B/C/D choices are reshuffled once per attempt and remain fixed throughout that attempt.

## Additional independent second-pass correction (14 November)

- **Island passage, unambiguous possession:** changed `amicus Romanus in insula parva habitabat` to `amicus Romani in insula parva habitabat`. The nominative adjective `Romanus` means a Roman friend and does **not** mean *Romanus's friend*; the genitive `Romani` is needed to support the question asking where Romanus's friend lived. This is within the school-listed second-declension cases and Taylor Chapters 1–3 vocabulary. The academic morphology whitelist and dedicated regression assertion were updated.

## Substantive corrections made in the live question bank

- **Passage 4 (temple), construction:** made the object of the command explicit, `dominus servos templum custodire iussit`.
- **Passage 5 (market), construction:** replaced an awkward omitted-argument command with directly quoted `'serve, pecuniam ad villam porta!'`, whose meaning and vocative can be read unambiguously.
- **Passage 5 Q10, competing readings:** changed the inherently ambiguous isolated form `dominae` (dative/genitive) to contextually explicit `ad dominam` (preposition + accusative). Only one option is now defensible.
- **Grammar coverage:** included plural imperative `custodite!` in Passage 4 and singular imperative `porta!` with vocative `serve` in Passage 5, keeping all passage grammar within the school guide.
- **Passage 4 Q6:** now directly assesses recognition of the plural imperative rather than duplicating a general 'what did he order?' detail question.
- **Student-facing answer positions:** the previous simple repeated option-index cycle was predictable. It is now shuffled by question per sitting; canonical answer IDs remain unchanged for accurate marking.

## Grammar coverage by multiple-choice unseen practice

| School-specified topic | Evidence present |
|---|---|
| First / second-declension cases | `domina`, `ancilla`, `servum`, `servis`, `amico`, `villam amici`, `templi` |
| Present, imperfect and perfect | `festinant`, `habitabat`, `laborabant`, `scripsit`, `cucurrit`, `custodiverunt` |
| Infinitives | `portare debebat`, `equum quaerere iussit`, `templum custodire iussit` |
| Imperatives and vocative | `custodite!` addressed to `servi`; `porta!` addressed to `serve` |
| `sum`, `possum` | `est`, `erat`, `erant`, `non poterat` + infinitive |
| 2-1-2 adjectives | `parva`, `magna`, `bonum`, `irati`, `laeta`, `novum` |
| Prepositions and required cases | `per portam`, `in horto`, `in villam`, `ad forum`, `cum amicis`, `de bello` |
| City-name forms | `Romae`, `Romam`, `Roma discessit` |
| Duration accusative | `multas horas navigabant`, `multas horas laborabant` |

## QA and limitations

The regression file `tests/latin-november-2026-unseen-academic-qa.test.mjs` enforces the allowed-form inventory and the independently reviewed answer text for **every one of the fifty MC questions**, in addition to the existing interactive/end-only-marking and whole-exam tests.

**What this audit supports:** these five exercises are suitable as **supplementary school-scope Year 9 reading and grammar MC practice**; their answer choices, passages and explanations have been academically reviewed and materially ambiguous constructions corrected.

**What this audit does not establish:** formal difficulty equating to a real Tiffin Girls' assessment or OCR GCSE; official endorsement; live iPad acceptance; suitability of MC alone for the school's 14-mark written reading comprehension and 50-mark free translation components. Students must also practise full written translation and explanation.

**Reviewer:** ChatGPT content and code audit, cross-checked against school-provided guide and existing Latin booklet; no claim of teacher / examination-board review.
