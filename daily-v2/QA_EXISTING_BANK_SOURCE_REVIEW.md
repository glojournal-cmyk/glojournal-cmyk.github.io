# Daily V2 — Existing question source audit, five subjects
Read-only source inspection: 2026-10-26. **Prioritization only — ZERO items independently certified to Daily V2.**

## Audit scope and direct evidence
Original catalog enabled Year 8 topics: Latin 65, French 30, Biology 37, Chemistry 8, Physics 13 = **153 topics**. Actual question JSON sampled/read across 59 topics (4885 enabled, non-preview question records). Full Chemistry (8/8) and Physics (13/13) were read; Latin 11/65, French 13/30, Biology 14/37 selected by potential depth and known weak areas.

Raw JSON question-level outputs with question IDs, prompt snippets, format, mark-point count and actual source blob SHA:
- `daily-v2/audit/existing-latin-y8-priority.json` (SHA 1f77f45d44c57d5317102f3c2d409e1cc133c3b8)
- `daily-v2/audit/existing-french-y8-top13.json` (SHA afcc86164ad5e6960e89fa2ceb6ef78786d8cd32)
- `daily-v2/audit/existing-biology-y8-top14.json` (SHA b64a7240d1a4e5289a2ac03b0c6266397465588f)
- `daily-v2/audit/existing-chemistry-y8.json` (SHA d07dcaea46407292fd7f536954002de1da2824fb)
- `daily-v2/audit/existing-physics-y8.json` (SHA ee8c492b999d07f7c4906b7ac274c5d5ae6248b4)

## Conservative source-metadata triage
A source-review indicator = original `difficulty >=3` AND a candidate higher-order format (`controlled_translation`, `mark_points`, `extended_response`, `practical_design`, `calculation`). **This does NOT assess independent challenge, mastery, answer validity, repetition, previous correct IDs, or student-taught status.**

| Subject | Item-level topics read | Enabled items read | Source review indicators | Indicators with ≥3 named mark points | Low-demand prompt indicators |
|---|---:|---:|---:|---:|---:|
| latin | 11 | 230 | 65 | 0 | 0 |
| french | 13 | 3313 | 0 | 0 | 0 |
| biology | 14 | 614 | 16 | 13 | 1 |
| chemistry | 8 | 280 | 132 | 31 | 7 |
| physics | 13 | 448 | 216 | 45 | 8 |
| **TOTAL** | **59** | **4885** | **429** | **89** | **16** |

**Do not aggregate these into "certified Mastery questions". Current independently validated count remains 0 in this read-only audit.** French source tags are often only 1–2 even for controlled translation and writing. Zero under THIS filter is not zero educational quality. Mark points >=3 is a rubric-length indicator, not actual Challenge proof.

## Specific educational QA findings
- **Latin:** set-text translation has 35 apparent review indicators, but repeating a generic `TRANSLATE` instruction across different source sentences is valid; the actual Latin stimulus must be reviewed. Low-depth core-verb form tables should NOT be counted as 6 independent Challenge items. Translation also requires acceptable Latin word-order variants.
- **French:** none of 13 prioritized files has a difficulty-3+ higher-format combination under the strict heuristic. Curriculum review of independent composition, tense and reflexive reasoning is essential; don't blindly downgrade existing meaningful written translations.
- **Biology:** only 16 candidates among 614 read records; `bio-y8-app-villus-explain` and denaturation evidence are promising for independent review, but not yet certified. Avoid single-definition questions masquerading as Challenge.
- **Chemistry:** all eight Year 8 topics inspected; source hints include basic items such as 'An unknown has pH 4. State its category ...' — a 2-mark question may be useful Application but it is not automatically 6-mark-level Challenge. Prefer multi-stage calculations, conservation reasoning and practical comparisons for stronger review.
- **Physics:** all thirteen Year 8 topics inspected; a tagged review hint 'Name the visible colours in order from red to violet' is fundamentally recall. Review actual force, graph, electrical and practical reasoning rather than accepting format tags.

## Prioritized substantive review candidates (manually verify)
### latin
Potentially deeper (PROMPT-ONLY triage, not certification):
- `la-y8-src-23aug-urbem-tr-01` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
- `la-y8-src-23aug-urbem-tr-02` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
- `la-y8-src-23aug-urbem-tr-03` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
- `la-y8-src-23aug-urbem-tr-04` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
- `la-y8-src-23aug-urbem-tr-05` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
- `la-y8-src-23aug-urbem-tr-06` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
- `la-y8-src-23aug-urbem-tr-07` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
- `la-y8-src-24aug-villam-tr-01` (`la-y8-set-text-translation`): TRANSLATE — Translate this set-text sentence into natural English.
Possible shortage in source topics (20+ nominal items, <6 Challenge format/level candidates):
- `la-y8-perfect-cues`: 116 items, 0 source indicators
- `la-y8-adjective-agreement`: 24 items, 0 source indicators

### french
Potentially deeper (PROMPT-ONLY triage, not certification):
- No candidates under this strictly defined signal.
Possible shortage in source topics (20+ nominal items, <6 Challenge format/level candidates):
- `fr-y8-s03-home-family-and-descriptions`: 343 items, 0 source indicators
- `fr-y8-s02-weather-activities-and-opinions`: 429 items, 0 source indicators
- `fr-y8-s30-supplementary-teacher-vocabulary`: 351 items, 0 source indicators
- `fr-y8-s11-master-vocabulary`: 390 items, 0 source indicators
- `fr-y8-s26-passe-compose-activity-bank`: 127 items, 0 source indicators
- `fr-y8-s08-expanded-past-participle-bank`: 365 items, 0 source indicators
- `fr-y8-s24-numbers-and-age`: 279 items, 0 source indicators
- `fr-y8-s18-school-descriptions`: 84 items, 0 source indicators
- `fr-y8-s25-classroom-objects`: 239 items, 0 source indicators

### biology
Potentially deeper (PROMPT-ONLY triage, not certification):
- `bio-y8-app-denaturation-explain` (`bio-y8-enzymes-gut`): Explain why a very high temperature can stop an enzyme-controlled reaction.
- `bio-y8-app-indicator-caution` (`bio-y8-pollutants-indicators`): Explain why the absence of one indicator species is not enough to prove a single type of pollution.
- `bio-y8-app-key-quality` (`bio-y8-classification`): Explain why 'Does it have a wing longer than 5 cm?' is usually better in a branching key than 'Does it have a large wing?'.
Possible shortage in source topics (20+ nominal items, <6 Challenge format/level candidates):
- `bio-y8-digestion-absorption`: 47 items, 1 source indicators
- `bio-y8-drugs-alcohol`: 37 items, 1 source indicators
- `bio-y8-enzymes-gut`: 40 items, 1 source indicators
- `bio-y8-graphs-calculations`: 36 items, 0 source indicators
- `bio-y8-pollutants-indicators`: 39 items, 2 source indicators
- `bio-y8-balanced-diet`: 39 items, 0 source indicators
- `bio-y8-classification`: 37 items, 1 source indicators
- `bio-y8-energy-bmi`: 30 items, 1 source indicators
- `bio-y8-starch-evidence`: 36 items, 2 source indicators

### chemistry
Potentially deeper (PROMPT-ONLY triage, not certification):
- `chem-y8-acids-indicators-ph-alkali-base-apply` (`chem-y8-acids-indicators-ph`): Magnesium oxide neutralises acid but is not very soluble. Explain why it is a base but not necessarily an alkali.
- `chem-y8-acids-indicators-ph-indicator-purpose-apply` (`chem-y8-acids-indicators-ph`): Explain why indicator colour alone cannot identify an unknown chemical.
- `chem-y8-chemical-analysis-filtration-apply` (`chem-y8-chemical-analysis`): Explain why filtration separates sand from salt solution but not dissolved salt.
- `chem-y8-chemical-analysis-pure-point-apply` (`chem-y8-chemical-analysis`): Reference X melts at 63 C. A sample melts from 58-61 C. Evaluate whether it is pure X.
- `chem-y8-chemical-analysis-unknown-evidence-apply` (`chem-y8-chemical-analysis`): Two substances have the same colour. Explain why another test is needed.
- `chem-y8-conservation-equations-balanced-meaning-apply` (`chem-y8-conservation-equations`): Explain why H2 + O2 -> H2O is not balanced.
- `chem-y8-formulae-valency-symbol-case-apply` (`chem-y8-formulae-valency`): Explain why Co and CO cannot be interchanged.
- `chem-y8-formulae-valency-element-compound-apply` (`chem-y8-formulae-valency`): Classify O2 and CO2 as element or compound and justify both.
Possible shortage in source topics (20+ nominal items, <6 Challenge format/level candidates):
- None under this heuristic in audited subset.

### physics
Potentially deeper (PROMPT-ONLY triage, not certification):
- `phys-y8-circuits-current-voltage-current-apply` (`phys-y8-circuits-current-voltage`): Explain why current is zero in a circuit with an open switch.
- `phys-y8-circuits-current-voltage-ammeter-apply` (`phys-y8-circuits-current-voltage`): Explain why placing a low-resistance ammeter directly across a cell is unsafe or incorrect.
- `phys-y8-circuits-current-voltage-boss` (`phys-y8-circuits-current-voltage`): Compare current and potential difference in a two-lamp series circuit and a two-lamp parallel circuit connected to the same supply
- `phys-y8-circuits-current-voltage-challenge` (`phys-y8-circuits-current-voltage`): A 1.2 A current splits into three branches. Two carry 0.35 A and 0.48 A. Calculate the third branch current.
- `phys-y8-colour-eye-boss` (`phys-y8-colour-eye`): A student views a green leaf through a red filter under white light. Explain why it appears dark, tracing the light from source to
- `phys-y8-electromagnets-turns-apply` (`phys-y8-electromagnets`): Design a comparison of 20 and 40 turns.
- `phys-y8-electromagnets-switchable-apply` (`phys-y8-electromagnets`): Explain why a scrapyard crane uses an electromagnet rather than a permanent magnet.
- `phys-y8-electromagnets-boss` (`phys-y8-electromagnets`): Design a fair investigation of how coil turns affect electromagnet strength.
Possible shortage in source topics (20+ nominal items, <6 Challenge format/level candidates):
- None under this heuristic in audited subset.

## Next curriculum and marking gates
1. A genuinely independent content reviewer must assess each shortlisted question, not grant certificates based on source difficulty, mark count, or auto-generated draft reviewer labels.
2. Answer grading for `rubric_review` must not be determined by matching model-answer keywords or arbitrary word order. `src/rubric-review.js` now supports **staging-only** reviewer-recorded one-mark-per-point allocation with explanation and immutable source fingerprint.
3. Student-specific historical correct IDs, confirmed taught topics, same-day concept collision filtering and future question scarcity must be checked against a safe backup before claims of long-term supply.
4. Pending 200 Mastery drafts are **not** part of the original catalog and cannot auto-qualify to student Daily; 0/200 have independently reviewed source-bound certification.
5. Actual native Node, browser/iPad QA and validated fair free-response automatic marking are outstanding; no main-branch edits, student-data writes or production deployment.

## Unread source topics in this item-level audit
94 Year 8 topic files have catalog metadata but remain unread at the individual-question level here. Do not call this a complete all-file audit.
