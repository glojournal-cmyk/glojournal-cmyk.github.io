# Daily V2 — targeted educational QA of existing questions
Date: 2026-10-26. This is a **preliminary AI-assisted content assessment**, not independent teacher/board approval. No certification entries are written; no original question JSON edited.

## Priority review decisions, based on real prompt + stimulus + existing answer
| Subject | Source question ID | Preliminary educational disposition | Why / follow-up |
|---|---|---|---|
| Latin | `la-y8-src-23aug-urbem-tr-01` | Potential **Application / Challenge candidate**, **needs validation** | Multiple-clause sentence `nos urbem petivimus, quod valde timebamus` requires imperfect/perfect recognition and causal connective. Existing accepted equivalents/semantic groups useful; assess accuracy and partial marks independently |
| Latin | `la-y8-src-22aug-higher-1-l2e` | **Foundation, not Challenge** | Despite source difficulty 4, `servus laborat` is short present-tense recall/translation. Keep as foundation; don't count as sixth challenge |
| French | `fr-y8-gen-fv-26-0543-je-suis-entre-e-dans-un-musee-restore` | **Vocab/spelling practice, not Challenge** | Difficulty 4 label but task restores one taught phrase; does not test independent writing/transfer |
| Biology | `bio-y8-app-villus-explain` | **Application, review for 3-point rubric** | Requires explanatory relationships among surface area, capillaries and short diffusion path; verify accepted equivalent causal explanations |
| Chemistry | `chem-y8-acids-indicators-ph-acid-apply` | **Foundation/Application, not Challenge** | pH 4 acidic plus simple indicator observation; two marks do not establish high-order reasoning |
| Chemistry | `chem-y8-conservation-equations-atom-rearrangement-apply` | **Application candidate** | Requires conservation via atom rearrangement and closed system; 3-point rubric and possible valid wording must be reviewed |
| Physics | `phys-y8-colour-eye-white-spectrum-apply` | **Recall/Foundation, not Challenge** | Even though labelled difficulty 3, only listing spectrum order; 1 mark |
| Physics | `phys-y8-colour-eye-object-colour-apply` | **Application, possibly stretch** | Blue object under red-only illumination needs a causal prediction; 3 rubric points. Not automatically a genuine 6-Challenge item |
| Physics | `phys-y8-speed-time-graphs-horizontal-moving-apply` | **Foundation/Application** | Describe fixed 8 m/s speed over 15 s; no multi-step unfamiliar transfer |
| French | `fr-y8-s22-high-scoring-structures` | **Needs further assessment** | Promising source topic by name, but no level-3+ candidates under the strict source-filter; assess true independent writing in full rather than assuming none exists |

## Findings that affect completion
- Difficulty tags **must never be substituted for student-facing mastery accreditation**. Examples show explicitly why source `difficulty:4` can be ordinary recall/translation.
- Source `mark_points` count, even 3 or more, does not automatically demonstrate unfamiliar-transfer cognitive demand.
- Apparent new source supply across 59 audited topics: 429 **format/level review leads only**, not certified questions. Unread 94/153 original topic files remain for future item-level scan.
- Real learning status, historic answered IDs, concept overlap, GCSE board alignment, free response validation, and 30-day true supply remain unknown.
- `src/rubric-review.js` now records staging-only per-criterion reviewer awards (example 2/4), with a source fingerprint and separate explanations. It does **not** award live Daily credits or invent keyword match scores.

## Curriculum sign-off workflow
1. Confirm school-taught topic and exam board.
2. Inspect full content, alternate correct translations/answers, required cognitive operations and scientifically correct mark points.
3. Classify truly Foundation / Application / Challenge and write curriculum certificate bound to `fingerprintDailyV2Source`.
4. Exclude already-correct and duplicated-concept variants from today's 2×20 Mastery.
5. Only when sufficient approved content and verified marking are available should the V2 planner use these items; do not compromise 4/10/6.

**No curriculum certificate, release approval or production action was made in this audit.**
