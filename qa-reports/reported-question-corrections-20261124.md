# Corrections to the November question audit

The attached 23 November coverage register identified 762 unique questions with a reported issue and 1,097 with a partial review. The comparison uses the report’s source commit `2e556ffcb48f6c7346b3b663f8058f57271b643d`. The [question register](reported-question-corrections-20261124.csv) records the original finding, source location, changed fields and outcome for each of the 1,859 IDs.

| Subject | Reported issue revised | Partial review revised | Other partial review findings |
|---|---:|---:|---|
| Biology | 74 | 128 | |
| Chemistry | 249 | 90 | |
| French | 177 | 443 | |
| Latin | 37 | 192 | |
| Physics | 225 | 86 | 10 already have embedded diagrams |
| English | 0 | 0 | 148 await individual academic review |
| Total | 762 | 939 | 158 |

## What changed

- Corrected worked answers, including the density of a 540 g sample occupying 200 cm³. The scorer accepts 2.7 g/cm³ and its equivalent in kg/m³, including when a pupil shows working.
- Broadened accepted scientific vocabulary and language equivalents. The chemistry equation checker supports reordered substances on the same side and preserves element case and coefficients.
- Added 34 referenced diagrams across Biology, Chemistry and Physics. The ten Physics Mastery findings use eight existing built-in diagrams. All 42 SVG images rendered in an offline check.
- Revised correction tasks and part marks so the pupil can demonstrate the scientific idea without having to repeat the instruction that a claim is wrong. Open French writing can show criteria and a model without awarding a formal score.
- Corrected numeric handling on both quiz routes and tightened English short-answer marking so incidental mentions of the key word do not earn credit. The 148 English entries are still individually pending.

## Verification

From the repository root run `node tests/reported-question-corrections-20261124.mjs` for 11,772 checks covering 1,711 IDs. It reads the actual question files, including the compressed school bank. It runs the two practice markers and the separate assessment markers where applicable. Cases include model answers, alternatives, specific misconception checks and unrelated responses. Many cases exercise a stored key and do not independently establish its academic validity.

The food/numeric regression now tests both practice bundles, with additional controls for algebraic signs, dimensional units, equation coefficients, chemical case and English substring matches. The Biology November, Chemistry answer-bank and prose, Latin October, French practice, Physics November, and Daily progression regression suites were also run.

Independent academic sign-off and physical iPad PWA acceptance are outstanding. These revisions do not resolve the wider report’s catalogue and Daily preview-policy discrepancies. The report’s 1,166 unreviewed IDs fall outside this correction register.
