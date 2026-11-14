# Academic Content QA — All new/revised Scholar's Garden material, 14 November 2026

**Reviewed scope:** substantive content introduced or expanded today in the public repository `glojournal-cmyk/glojournal-cmyk.github.io` — Latin, Chemistry, Physics, Biology and French. Source version includes November 14 changes through the 200-question Physics expansion. This report distinguishes a human-readable content audit and deterministic regression checks from official teacher / awarding-body approval. **This is not an independent school exam moderation or a prediction of exam questions.**

## Source hierarchy

1. **Uploaded Tiffin Girls' Year 9 Latin guide:** *Year 9 November Latin Assessment: Revision Guide*, week beginning 23 Nov 2026; Taylor Ch. 1–3; prescribed grammar; 50 min; A/B/C = 11/14/50 marks. Actual school examination is translation/comprehension, not solely MC.
2. **Uploaded Year 9 Physics teacher revision slides:** *Y9_Physics_Revision (1).pptx*, topics particles, density, conduction only, RP2 insulation and RP5 density; explicitly excludes convection and radiation.
3. **Chemistry school scope as recorded in revision data:** assessment week beginning 16 Nov; C1.5 historical models, C1.6 atomic structure, chemical formulae and balancing equations. The connected bank explicitly excludes C1.7 isotopes/ions and C1.8 electron arrangements from the assessed draw. The original school email was not independently read in this review; scope is based on the repository's teacher notice text.
4. **Biology school target and AQA GCSE Biology 8461 §4.1.1:** eukaryotic and prokaryotic cells, animal/plant cells, specialisation, differentiation, microscopy/RP1, culturing microorganisms/RP2. Test week beginning 16 Nov.
5. **Uploaded French *Vocabulaire de la dictée* PowerPoint:** the teacher's dictated expressions. The separate French assessment practice uses tense sentences and AQA GCSE French 8652 Higher 150-word writing; these are practice materials, not verified copies of the teacher's whole paper.

**Awarding-body references:**
- Biology AQA 8461: https://www.aqa.org.uk/subjects/biology/gcse/biology-8461/specification
- Chemistry AQA 8462: https://www.aqa.org.uk/subjects/chemistry/gcse/chemistry-8462/specification
- Physics AQA 8463: https://www.aqa.org.uk/subjects/physics/gcse/physics-8463/specification
- French AQA 8652: https://www.aqa.org.uk/subjects/french/gcse/french-8652/specification
- OCR Latin J282 is a comparison of *reading skills* only, not the school's announced Latin specification: https://www.ocr.org.uk/qualifications/gcse/latin-j282-from-2016/

## Reviewed banks

| Subject | Today's work / current available bank | Academic content checks | Restrictions |
|---|---|---|---|
| Latin | 130 Taylor Ch.1–3 vocabulary entries; 74 grammar-recall items; 50-minute 75-mark written mock; 5 original passages ×10 MC = 50 MC | 137 distinct passage surface forms explicitly mapped to chapter headwords; 50/50 independent approved answers; grammar/construction ambiguity, end-only marking and shuffled options checked | Written A/B/C marks 11/14/50; MC practice supplementary only |
| Chemistry | 88 newly authored applied items: history 14, atomic/calc 34, formula 18, balancing 22. Main C7 concept bank: 90 formatted questions | All four-answer MC keys structurally unique; marking criteria present; formula/ion ratios and 14 balanced symbol equations read and independently atom-count checked; C7 pair-matching schema tested | 12 of 88 new atomic items purposely excluded as C1.7/C1.8; 4 earlier exclusions retained; 134 eligible questions across the combined school revision bank |
| Physics | 200 questions, 40 per topic, including original 65 and 135 subsequently added today; objective and written rubrics | Density/units and sample worked figures cross-checked with school slides, thermal-conduction theory, RP2 data/readings, RP5 methods, 200/200 answer schemas and scoring marks tested | Convection and radiation not taught for this test and not selected in bank |
| Biology | 144 core bank questions (72 older + 72 added today), 12 new per each of six AQA 4.1.1 subsections; 156 questions in accompanying static revision guide (144 core + 12 extended) | 72 new answers and rubric point counts inspected; 17 sets of independent numeric result assertions; 6×12 new subsection distribution; 2/3 mark balance; static guide and bank consistency | Avoid 4.1.2 or 4.1.3 in 4.1.1 school-only practice |
| French | 49 teacher dictation vocabulary pairs, 25 complete future/perfect sentence models, four 150-word Higher-style prompts; optional 10-minute Daily booster | Teacher phrase coverage compared with actual dictation PowerPoint; full model list checked; AO2 15 + AO3 range 5 + AO3 accuracy 5 and one-bullet cap asserted; accents accepted only in practice recall, not relaxed for real writing | Written French responses use holistic self-marking; Daily booster does not add XP/MP |

## Academic issues actually corrected in source materials

**Additional independent self-mark audit:**
- Ran the complete published Physics model answers through the actual school-assessment marking function. A density-method answer initially earned 3/4, revealing that the subtraction-credit regex required the word 'filled' despite the equivalent phrase 'combined mass'. The accepted rubric pattern was corrected, and the point's canonical label was included among its accepted alternatives. The full independent all-subject marking QA subsequently passed.
- **Latin narrative ownership:** `amicus Romanus` could mean a Roman friend but did not explicitly mean **the Roman man's friend**. It was corrected to `amicus Romani` (genitive of Romanus), aligning the passage with its comprehension question.
- **Biology red blood cell:** Item `bio-cell-20261114-103` changed from an over-simple 'small size gives a short diffusion path' to a biconcave shape that increases area and shortens diffusion path; flexibility helps the cell pass narrow capillaries. The marking points were updated.

**Physics:**
- `phys-nov26-c13` — previously awarded an irrelevant third mark for choosing low-conductivity materials even though **the two walls are explicitly made of the same material**. Recalibrated the question and marks to thickness, thermal resistance/path length and temperature gradient (3 points).
- `phys-nov26-r05` — a 4-mark liquid-density method omitted the essential **filled-cylinder mass measurement**. Model now explicitly weighs empty and full cylinder, subtracts and divides by measured liquid volume with consistent units.
- Five new density question stems `phys-nov26-d30, d31, d33, d35, d37` had incorrect English indefinite articles; all fixed. Fixes re-applied after today's incoming 200-question expansion, not left on the obsolete 65-question snapshot.

**Biology:**
- `bio-cell-20261114-083` — clarified that bacterial main circular DNA is duplicated and distributed during binary fission, while individual plasmids **may**, but do not always, pass to daughter cells. Updated prompt, model answer and 3 marking points.
- Updated the matching printed `assessment/biology-cell-structure/index.html` item 83 so the static guide no longer shows the stale wording.

**Latin:**
- `dominae` (dative/genitive ambiguous) rephrased to unambiguous `ad dominam`, with explanation.
- Made `iubeo + accusative person + infinitive` constructions explicit, added in-scope singular/plural imperatives and vocative, and changed one MC to test actual imperative grammar.
- Repeated A/B/C/D fixed answer position cycle replaced with per-attempt shuffled options while preserving correct marking; independently checked 50 original MC answers and passage evidence.
- Formal Latin report: `study/latin/november-2026/ACADEMIC-QA-2026-11-14.md`.

**Chemistry and French:**
- No clear scientific balancing, formula, conjugation or marking-rule error detected in the directly reviewed new questions.
- Chemistry's C1.7/C1.8 entries remain stored for history but are excluded from the upcoming **C1.5/C1.6/formula/balancing** paper. Distinguish `88 new` from `134 eligible in combined bank`.
- French dictation slide spells *néammoins* in one place; the app correctly uses **néanmoins**. This is a source-slide typo corrected by the revision bank, not an error to reintroduce into the app.
- French writing criterion is based on a self-assessment adapted to AQA Higher; a human/teacher still needs to judge answers.

## Reproducible QA

- `tests/academic-all-today-20261114.test.mjs`: ten cross-subject regression suites on current complete banks.
- `tests/academic-content-cross-subject-20261114.test.mjs`: independent exam marking-path test, including **model response earns full credit / clearly wrong response earns zero** for each of the 200 Physics and 144 Biology model answers.
- `.github/workflows/academic-all-today-20261114.yml`: run cross-subject QA on subsequent relevant content edits.
- `tests/latin-november-2026-unseen-academic-qa.test.mjs`: exact source-form whitelist and all 50 independent approved MC keys.
- Physics dedicated tests `tests/physics-nov26-*.test.mjs`; Biology `tests/biology-nov16-school-alignment-20261114.test.mjs`; Chemistry `tests/chemistry-*.test.mjs` plus released question/marking validators.

**Deterministic scope of checks:** IDs, schemas, question counts, numerical model answers, equation conservation, topic inclusion/exclusion and known answer keys. A passing automated test cannot alone certify the soundness or difficulty equivalence of an individual original question. Manual review of prompts, marking guidance, pitfalls and the uploaded teacher sources was therefore part of the review.

## Final academic judgement and remaining limitations

The audited content is usable as **source-aligned supplementary Year 9 assessment preparation** after the changes above. It is not the teacher's official paper, may not match the school's actual depth/format, and is not externally moderated by teachers or AQA/OCR. For Latin, continue free written unseen translation and comprehension beyond MC; for Science, check any open-ended automated rubric awards against the scientific reasoning; for French, have the extended essay read by a human. iPad end-to-end runtime QA and site-wide workflows are distinct technical tests and should not be inferred from academic tests. Check latest CI/Pages status independently.

## Supplemental academic corrections (follow-up review on 14 November)

Further source-by-source checks of the final **200-item Physics** and **144-item Biology** banks identified points which basic answer-key and regex tests could not detect. These changes were rebased selectively on the latest main branch to preserve concurrent Latin, Biology and Physics fixes.

- **Physics `phys-nov26-i12` (4 marks):** request **all three** cooling temperature falls (no insulation 26.9°C, newspaper 19.7°C, bubble wrap 11.6°C), followed by a justified best-insulator choice. Previous question wording only requested two falls yet allocated three calculation marks.
- **Physics `phys-nov26-c02` (2 marks):** the first marking point now addresses the hot *metal handle* mechanism instead of only saying the pan conducts heat *into food*. The second point explains the low conductivity of plastic reducing energy transfer to the hand.
- **Physics `phys-nov26-c05` (2 marks):** ordinary double glazing is explained using a trapped **air/argon gas gap**; vacuum glazing is a separate specialist design. Both scoring points and accepted model were updated together.
- **Biology `bio-cell-20261114-135` (2 marks):** prompt now explicitly asks why the inoculating loop is **flamed and allowed to cool**, matching two distinct rubric points, rather than asking only about cooling but awarding a sterilisation mark. The static printable guide is synchronised.
- **Biology `bio-cell-20261114-079` (3 marks):** question now asks for structural features expected *if* the smaller cell is a bacterium; cell size alone does not determine bacterial identity. The 48/1.2 = 40 calculation and scoring remain unchanged; printed guide synchronised.
- **Chemistry `chem-nov16-2026-history-applied-01` (3 marks):** three distinct Thomson/Rutherford differences are now separately awarded: positive charge distribution, electron placement, and largely empty atomic volume. Previously the first two criteria both rewarded describing the nucleus.

**Known non-blocking quality concern:** Existing Physics IDs `d06`/`d12` use the same 2×3×5 cm, 8 g/cm³ cuboid; `d09`/`r06` also reuse the same displacement scenario. The arithmetic is correct but repeated numbers reduce practice variety. These historical question IDs were left untouched to avoid silently invalidating saved answers; future question-bank additions can use genuinely different data.

**Tests:** `tests/academic-all-today-20261114.test.mjs` now includes explicit checks of the six corrected items and guide consistency. Detailed dedicated subject CI is also required; no school-/awarding-body moderation has been claimed.
