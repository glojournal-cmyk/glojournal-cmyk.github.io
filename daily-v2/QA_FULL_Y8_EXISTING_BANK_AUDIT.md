# Daily V2 — FULL Year 8 existing-source inventory audit
Date: 2026-10-26. All five subjects, exact source JSON read-only and all 153 enabled Year 8 topic IDs checked against current `content/catalog.json`.

## Completion and limits
- **File-level source coverage:** 153 topic rows versus 153 enabled catalog topic IDs; distinct topic IDs 153. Duplicate audit topic IDs 0.
- **Source eligible question records:** 8918, counting individual `questions[]` with `status:'enabled'`, `preview!==true`, `formal!==false`, no `_repair`.
- **Original catalog enabled counts:** 8829. These are NOT interchangeable with source eligible counts.
- **Conservative review indicators:** 475 source difficulty >=3 AND format among `controlled_translation`, `mark_points`, `extended_response`, `practical_design`, `calculation`. This is NOT a Mastery certification, and does not include substantive evidence.
- **Independently certified Mastery from this audit:** ZERO (source review cannot certify pedagogy, student-taught status, or previous-correct eligibility). No student progress or live code changed.

| Subject | Topics actual/catalog | Source eligible question records | Catalog enabled | Format+level review indicators | Topics with >=6 such indicators |
|---|---:|---:|---:|---:|---:|
| latin | 65/65 | 2492 | 2492 | 65 | 5 |
| french | 30/30 | 4601 | 4601 | 21 | 2 |
| biology | 37/37 | 1097 | 1001 | 41 | 0 |
| chemistry | 8/8 | 280 | 280 | 132 | 8 |
| physics | 13/13 | 448 | 455 | 216 | 13 |
| **TOTAL** | **153/153** | **8918** | **8829** | **475** | **28** |

## Catalog/source disagreement — release blocker for confident preflight
**16** topic(s) differ between the catalog enabled count and the eligible question records in the corresponding actual topic file. Counts may differ legitimately due to preview/formal filters; the source/catalog discrepancy MUST be explained and fixed or preflight must use actual eligible loaded records, never nominal catalog totals.

Largest discrepancies:
- `bio-y8-food-tests` (biology): catalog 33, eligible source 143, delta +110
- `phys-y8-power-efficiency` (physics): catalog 35, eligible source 32, delta -3
- `bio-y8-leaf-structure` (biology): catalog 37, eligible source 35, delta -2
- `phys-y8-light-reflection-refraction` (physics): catalog 35, eligible source 33, delta -2
- `bio-y8-dna-structure` (biology): catalog 18, eligible source 16, delta -2
- `bio-y8-limiting-factors` (biology): catalog 20, eligible source 18, delta -2
- `bio-y8-digestion-absorption` (biology): catalog 48, eligible source 47, delta -1
- `bio-y8-enzymes-gut` (biology): catalog 41, eligible source 40, delta -1
- `bio-y8-food-chains-webs` (biology): catalog 32, eligible source 31, delta -1
- `phys-y8-circuits-current-voltage` (physics): catalog 35, eligible source 34, delta -1
- `phys-y8-speed-time-graphs` (physics): catalog 35, eligible source 34, delta -1
- `bio-y8-continuous-variation` (biology): catalog 13, eligible source 12, delta -1
- `bio-y8-correlation` (biology): catalog 13, eligible source 12, delta -1
- `bio-y8-predator-prey-adaptations` (biology): catalog 27, eligible source 26, delta -1
- `bio-y8-punnett-squares` (biology): catalog 17, eligible source 16, delta -1
- `bio-y8-pyramids-energy` (biology): catalog 23, eligible source 22, delta -1

## Important educational distinctions
- Latin appears high in the original word/vocab corpus, but high-level format indicators are concentrated in 35 set-text translation items plus other small translation groups; source difficulty 4 `servus laborat` is still Foundation recall/translation.
- French format+level indicator counts do NOT cover demanding written tasks tagged difficulty 1–2 or typed formats. Zero/low under this filter is not proof of no strong French content; independently review longer writing and controlled translation.
- Biology has few format+level indicators relative to its source count, even when some 3-mark explanation items are valuable Application.
- Chemistry and Physics each have many mixed mark-point items. pH category recall and a list of visible colours are **not** high-cognitive Challenge even with difficulty 3 or 4 labels. Multi-step calculations, experiment controls, unknown-context reasoning are better review candidates.
- **Do not award full Mastery credits on partial mark-point hits.** Existing `src/rubric-review.js` supports 0/1 per criterion **manually reviewed staging-only** records; no automated fair semantic scoring has yet passed validation.
- The 200 new authored Mastery questions across 10 topics remain unapproved drafts, not included in the original catalog, and have no human-approved certifications. Personal fresh-question supply after learner history and Year 9 taught evidence is still unknown.

## Needed action before release
1. Resolve catalog/source mismatches; true planner bank preflight MUST rely on loaded eligible Question IDs, not catalog totals.
2. Individually evaluate likely candidates and assign actual cognitive level, alternate acceptable answer and independent-review provenance/source fingerprints; don't blanket-promote all 475 candidates.
3. Review unfinished curricula/Year 9 teaching evidence and protected student progress; check duplicates, correct IDs and alternate acceptable grammar/mark schemes.
4. Implement independently validated partial-credit marking (including negative answer traps), test real Safari durable storage and rerun 30-day **actual student-informed** simulation before controlled release approval.

## Audit source artifacts (topic-by-topic question IDs and immutable blob SHA)
- `daily-v2/audit/existing-latin-y8-priority.json` (snapshot blob 1f77f45d44c57d5317102f3c2d409e1cc133c3b8)
- `daily-v2/audit/existing-french-y8-top13.json` (snapshot blob afcc86164ad5e6960e89fa2ceb6ef78786d8cd32)
- `daily-v2/audit/existing-biology-y8-top14.json` (snapshot blob b64a7240d1a4e5289a2ac03b0c6266397465588f)
- `daily-v2/audit/existing-chemistry-y8.json` (snapshot blob d07dcaea46407292fd7f536954002de1da2824fb)
- `daily-v2/audit/existing-physics-y8.json` (snapshot blob ee8c492b999d07f7c4906b7ac274c5d5ae6248b4)
- `daily-v2/audit/existing-latin-y8-rest-1.json` (snapshot blob 37c210f28b1bb1f3a91bcd12e8c28d170c0a9db0)
- `daily-v2/audit/existing-latin-y8-rest-2.json` (snapshot blob 221701d642deb059202e34dd4de655a97573b14f)
- `daily-v2/audit/existing-latin-y8-rest-3.json` (snapshot blob 256ca02bf5b3dc1492b96552dd880bce6d024bb5)
- `daily-v2/audit/existing-latin-y8-rest-4.json` (snapshot blob eee43d64517c2019e21e2fe29165fb7ed1baf580)
- `daily-v2/audit/existing-latin-y8-rest-5.json` (snapshot blob f3fb20319ab7199ee5f8f39031672bcafab462ca)
- `daily-v2/audit/existing-french-y8-rest-1.json` (snapshot blob ee9a1b3085584ddd7f23afc581a9eb13b710faa3)
- `daily-v2/audit/existing-french-y8-rest-2.json` (snapshot blob 490451199dd07ae5d15f9f629e3ebd961691a6c6)
- `daily-v2/audit/existing-biology-y8-rest-1.json` (snapshot blob b7686d5ec5034e556aea58f496bad64d08c8d32d)
- `daily-v2/audit/existing-biology-y8-rest-2.json` (snapshot blob 1f15eafcd1fb54bd1f3a4604d931774d55c0985b)
