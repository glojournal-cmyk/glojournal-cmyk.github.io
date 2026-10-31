# Daily V2: genuine Year 8 question-file depth spot audit
Date: 2026-10-26. Read-only audit of existing default-branch content; no student records accessed.

## Method
Source: twelve individual `content/topics/<topicId>.json` files, fetched independently of the catalog. Only questions with `status:"enabled"`, not preview, and not `formal:false` were counted. The bank's numeric `difficulty` and formats are **descriptive source metadata**, not individually certified Foundation/Application/Challenge.

The composite distinctness count used `prompt + stimulus + accepted answer + options`; this is a diagnostic estimate and cannot replace the Daily V2 no-overlap review. One candidate ID `la-y8-cases-noun-endings` did not exist in repository; it was not counted or imputed.

| Subject | Topic | Eligible | Difficulty 3–4 | Potential higher-order formats | Comments |
|---|---|---:|---:|---:|---|
| Latin | la-y8-set-text-translation | 35 | 35 | 35 | All level 4 translations; does NOT by itself supply Foundation/Application/Challenge blend |
| Latin | la-y8-core-verbs | 98 | 24 | 0 | Plenty of vocabulary/form-recognition variants; not proof of advanced application |
| Latin | la-y8-adjective-agreement | 24 | **0** | 0 | Cannot claim six high challenge questions from existing metadata |
| French | fr-y8-s06-present-tense | 52 | **0** | 3 | Level 2 only |
| French | fr-y8-s10-accuracy-traps | 50 | **0** | 0 | Level 1–2 only |
| French | fr-y8-s12-ks3-extension-irregular-verbs | 126 | 27 | 13 | Stronger potential; must check whether typed items are truly independent writing |
| Biology | bio-y8-balanced-diet | 39 | **0** | 13 | Higher-order format labels mostly low difficulty |
| Biology | bio-y8-digestion-absorption | 47 | **1** | 15 | Does not contain six 3–4 difficulty items in current source |
| Biology | bio-y8-competition | 22 | **2** | 8 | 3–4 depth likely scarce |
| Chemistry | chem-y8-formulae-valency | 35 | 21 | 17 | Better structural potential; still require individual review |
| Physics | phys-y8-speed-time-graphs | 34 | 17 | 16 | Better structural potential |
| Physics | phys-y8-power-efficiency | 32 | 25 | 15 | Better structural potential |

**Total: 12 inspected topic files; 594 eligible question records.** This is a purposive sample, not all 282 catalog topics, nor a substitute for a verified student-progress-informed supply audit.

## Implications
- Mastery A/B currently require 4 Foundation + 10 Application + 6 Challenge from **one taught topic**. Many real topic files are explicitly inadequate under a strict same-topic difficulty interpretation, even when total rows >=20.
- Numeric difficulty >=3 is at best a *review candidate*, never automatic proof of a Challenge cognitive demand.
- Mastery selection must compute genuine questions still available AFTER prior-correct exclusions and other Daily assignments.
- The synthetic 30-day test confirms the planner will flag shortages and will not exhaust in a deliberately sufficient bank. It **does not** establish 30-day readiness using this authentic bank.
- Existing topic metadata are not automatically certified: `src/bank-adapter.js` now requires a per-question review-bound fingerprint, so revised questions invalidate earlier manifests.
- BEFORE live release, review whole question corpus; document missing high-quality items, author them with subject-appropriate rubrics, and run this student-specific read-only simulation against a protected backup copy.
- UX remains unresolved: the strict all-or-nothing preflight prevents a broken partial day but will **block the entire day's new V2 plan** if one task is short. A verified fallback policy is needed so this doesn't recreate 'cannot do any task'.

## Source topic blob SHAs (for repeatability)
- `la-y8-set-text-translation`: 626ab1c23c42ebfb10eadc20c3f4d19f5444c5d3
- `la-y8-core-verbs`: 50f4f28eca9e9db77e4bc79415010d8999fab3fc
- `la-y8-adjective-agreement`: 32c0839ccd4b6c71ef5e26d041f28229d37127d6
- `fr-y8-s06-present-tense`: 74a40125477bb9f5ac6ef9c9b7350807c8d70955
- `fr-y8-s10-accuracy-traps`: ea35c8eb46b3e59d0d4f6b73770551e7d289db59
- `fr-y8-s12-ks3-extension-irregular-verbs`: 2acc9a6f01a085b24ceeacfe0c56fc6dddf13852
- `bio-y8-balanced-diet`: 02269c2eb7c0853cdaefcb83e4abeb185c8b9a8b
- `bio-y8-digestion-absorption`: 431bd1cc86d38e981b7eee1265076407602b172f
- `bio-y8-competition`: e26331e73ccc1ca27152bcb5920bbc1a40235979
- `chem-y8-formulae-valency`: d99d412c69f6d75ba13f4bacc77cec6b49d16d8c
- `phys-y8-speed-time-graphs`: 7dbba5e7537c15761a4d49212064956a3f92893c
- `phys-y8-power-efficiency`: 9c3e26e6eaa604f9e7a7c37333b67c93995bfef
