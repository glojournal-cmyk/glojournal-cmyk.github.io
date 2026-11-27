# Maths Academic QA V3.2.2 — Global candidate-version audit and genuine Standard Form answer discrimination

**Date:** 24 November 2026  
**Repository:** `glojournal-cmyk/glojournal-cmyk.github.io`  
**Scope:** Draft PR [#306](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/pull/306), QA-only branch `feature/daily-tasks-v3-20261122`  
**Release:** **BLOCKED. 0/200 canonical Maths questions formally academically approved. No merge, deployment, live import or XP/MP/Mastery/Recovery changes.**

## 1. Reopen and independently verify the exact source state

The full [original revised 200-item Maths bank](../qa-staging/math-v311-reviewed-200.json) remains at Git blob `0655fbc1b796bff68f533c060a43339dff6664be`; all 200 canonical entries remain `dailyEligible:false`. No original source bank or app runtime has been modified in V322.

The V320 and V321 GitHub Actions runs that were **queued** at the last report were reopened, rather than presumed successful:

- [GitHub Actions 45265882559](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45265882559): **SUCCESS**, V320 post-repair test commit.
- [GitHub Actions 45266602429](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45266602429): **SUCCESS**, V321 dedup audit at head `cfe66314`.

These are **technical** gate results only and do not constitute examiner approval, verified actual teaching or physical iPad PWA acceptance.

## 2. A real academic distractor repair: N9 must affect the choice

The earlier [V320 two Standard Form candidates](../qa-staging/math-v320-two-standard-form-n9-final-output-rebalanced-candidates-20261123.json) requested a final normalized standard-form quantity, but **STANDARD_FORM-025 did not force the student to check that number**: only option C had the correct largest feasible volume v=2 and pack count p=3. A student could choose C purely by the `(v,p)` values without verifying the last numerical coordinate `T`. This defeated the purpose of testing N9.

The revised QA-only STANDARD_FORM-025 now has two options sharing the same correct physical configuration:

| Option | Chamber coefficient v | Whole packs p | Final count T | Evaluation |
|---|---:|---:|---|---|
| **C (key)** | 2 | 3 | \(1.2\times10^7\) | Correct model **and** correct normalized particle count |
| **F (distractor)** | 2 | 3 | \(1.2\times10^6\) | **Incorrect**: normalize \(12\times10^6\) by shifting 12 to 1.2 but forgetting to raise the exponent to 7, making the total ten times too small |

The remaining four alternatives test either a physically invalid concentration, too many sealed packs or a feasible but smaller volume. Recalculation confirms **only C** satisfies *all* constraints. V320 STANDARD_FORM-009 already had the analogous comparison: **C** and **D** share the same feasible cheapest container mix \((a,b,C)=(3,2,250)\), but C incorrectly reports the spare **safe** loading margin \(6\times10^3\) g instead of unused **nominal** capacity \(9\times10^4\) g; **D is the key**.

**Instructional significance:** in both questions, the non-Standard-Form model alone is now insufficient to discriminate the correct answer. The learner must at least evaluate the extra stated quantity; this improves topic alignment. However, choosing among preformatted alternatives only shows **recognition**, not handwritten production of correct standard form, and cannot automatically earn the full reasoning or Mastery score.

The [V320 Node tests](../tests/daily-v3-maths-v320-two-standard-form-n9-topic-rebalance-20261123.test.mjs) now enforce pairs of options sharing the correct underlying model but differing in N9 numerical value. The previous broad assertion that all six wrong options must carry the physically consistent particle count has been refined to **expect and reject** the explicit factor-ten misnormalization in option F. Six choices, one exact correct key, all `dailyEligible:false`.

## 3. Global staging audit: versioned QA records are not 112 independent questions

The earlier V321 supersession register protected **three** original source IDs. A repo-wide read of all currently staged question-bearing files has now produced the [V322 source-exact, Git-blob-pinned registry](../qa-staging/math-v322-all-versioned-candidate-packs-200-source-dedup-and-credit-deny-20261124.json). It includes all **17** V312–V320 staging files that actually contain `questions[]` rows. Earlier V311 **patch suggestions**, Q/A risk ledgers and non-question evidence files were not silently counted as complete MCQs.

| Full V322 tally | Exact count |
|---|---:|
| Canonical source bank (unchanged, held) | **200** |
| Complete QA-only candidate files | **17** |
| Candidate version records across these files | **112** |
| Distinct original source IDs represented | **87** |
| Different original IDs with more than one version | **20** |
| Full reasoning or topic-redesign candidate versions | **58** |
| Original-stem **editorial wrong-answer explanation** versions | **54** |
| Source IDs with both a redesign and a separate editorial repair | **12** |
| Source IDs with at least one redesign | **45** |
| Source IDs having only an original-option editorial repair | **42** |
| Ambiguous highest-version reasoning candidates | **0** |
| **Approved Academic QA / Daily / Mastery counts** | **0 / 0 / 0** |

**112 versions do not equal 112 newly acceptable questions**, and **87 distinct source IDs do not equal 87 academically signed-off questions**. The remaining 113 source IDs have no *full question candidate* in these 17 packs; this does not imply that they lack earlier arithmetic QA, since separate source QA tests already cover Maths topics.

### Source collision and scoring safety

- A **reasoning redesign** replaces the original stem and may replace correct key, all alternatives and worked solution.
- An **editorial correction** keeps the exact original stem, original A–F mathematical alternatives and original correct key, changing only the wrong-option explanations.
- There are **12 source IDs with both types**. Original-answer editorial reasons **must not be copied into newer reasoning alternatives** without recalculating from the *new* stem and alternative. The global registry marks each as `editorialMustNotBeMergedIntoReasoningWithoutNewSourceSpecificQA:true`.
- The most recent *version number* for a reasoning draft is marked `LATEST_REVIEW_ONLY_NOT_IMPORTABLE`, **not** academic approval. Older reasoning variants remain `OLDER_OR_ALTERNATE_DRAFT_NOT_IMPORTABLE`, and original-stem editorial variants remain `ORIGINAL_STEM_EDIT_ONLY_NO_AUTOMATIC_TRANSFER`. Do not infer separate Mastery concepts from revisions.
- For the previously reviewed original IDs INDICES-025, STANDARD_FORM-009 and STANDARD_FORM-025, the older [V321 source-specific registry](../qa-staging/math-v321-v315-v318-v320-three-question-candidate-supersession-manifest-20261123.json) remains consistent; its V320 Git blob pointer has been updated to match the repaired option F.

## 4. Source-immutable release tests

The [V322 regression](../tests/daily-v3-maths-v322-source-candidate-global-registry-20261124.test.mjs) now:

1. Re-reads the canonical 200 and every one of the 17 candidate files, **recalculates actual Git blob SHA-1** and rejects any silent file change compared with the registry.
2. Checks all 112 records have the same original topic ID, six mathematically distinct A–F expressions, exactly one stored key, actual explained wrong options and explicit pending/zero-credit metadata.
3. Checks all 54 editorial versions preserve the **exact original stem, key and option mathematics**.
4. Reconstructs all 87 source-ID histories and requires the 20 multi-version and 12 mixed-editorial collisions to remain properly quarantined.
5. Requires both STANDARD_FORM-009 and STANDARD_FORM-025 to contain **two** choices sharing the correct underlying context-model values but differing in their final Standard Form quantity.
6. Deliberately mutates answer credit and scientific-notation values to prove that unsafe changes are detectable.

The test is included in both push and pull-request triggers and the Daily V3 Node test runner. A passing GitHub Actions workflow is required before claiming this version has passed **Technical QA**. **Even a green CI does not provide the missing independent Academic QA evidence.**

## 5. Next release work, not waived

The most productive remaining reviews are **independent GCSE Higher demand and exact Year 9 taught-subskill approval**, especially the 45 source IDs with distinct draft stems and any original source IDs whose current questions remain overly procedural. AQA AO1 multi-step calculation can be routine, while AO2/AO3 require reasoning/interpretation; the revised N9 final quantities are an improvement, **not a certified individual Grade 7**. The parent explicitly chose to **skip the TGS Year 9 curriculum PDF**; consequently the exact taught-skill gate must be stated **unverified**, not invented.

The student should ultimately have **10 Maths MCQs per Daily set, six choices each** only after academic approval and scoring isolation. Neither revised candidates nor editorial repair files may earn Daily/MP/Mastery credit before independent signoff. Physical iPad PWA rendering, offline state/persistence, scoring and Daily credit still require actual device acceptance.

**Release status remains BLOCKED: original 200/200 held, 0/200 academically approved, PR #306 Draft, no deployment.**
