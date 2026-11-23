# Food Tests — independent content review of all 143 source questions (23 November 2026)

**Round 2 status: THREE source fixes and FIVE draft option rewrites applied ONLY on PR #308; all still await independent academic sign-off. Academic approval 0/143. Do not merge or deploy.**

This is an AI-assisted item-by-item scientific and assessment-quality review, **not a qualified independent science teacher's sign-off**, not a confirmation of what TGS has taught, not a successful free-text marking acceptance test, and not physical iPad PWA acceptance. The original 143 item IDs and each of the 99 structured draft points were read directly from `qa/p0-eligibility-2e556ff`.

## Fully inspectable evidence

- [143-row source item QA register](food-tests-independent-academic-143-review-20261123.json) — each source ID, exact source stem/key or mark points, independent science-key determination where applicable, issue codes and proposed action; all `academicApproved:false`.
- [Proposed corrections with exact stems and four-option alternatives](food-tests-academic-correction-proposals-20261123.json) — QA draft only; none imported into the live bank.
- [Source 52-item / 99-point / 396-option structured candidate](food-tests-structured-99-point-review-candidate-20261122.json) — not learner-facing, 0 approved parts.
- Node regression: `node --test tests/food-tests-academic-143-review-20261123.test.mjs`. Node checks audit completeness and known scientific keys; it **cannot** sign off pedagogy, distractor quality or free-English semantic fairness.

## Exact 143 source items: academic findings

| Source group | Items | Evidence and disposition |
|---|---:|---|
| Reagent/result recall MC | 9 | All nine unique stored keys agree with independently checked iodine/starch, Benedict's/reducing sugar, Biuret/protein, ethanol/lipid, the four outcome terms and water bath. **Science key checked only; no release approval**. |
| Four-test results MC | 64 | Independently translated each of four observed reactions into the expected subset; **64/64** keys and single matching options agree. Only **16 distinct binary patterns**, each repeated four times: **48 repetitious items require removal or genuine redesign** before a scored bank. |
| Typed exact and typed short | 15 | Facts broadly agree with references, but the accepted-answer lists have **not** been proved complete or protected against contradictory responses. Proposal lists legitimate phrasings to test, including `hot water bath` and `Benedict's reagent`. **Hold formal credit**. |
| Pair matching | 3 | All three contain four nutrient/reagent/result associations. Per-pair scoring not validated. `bio-y8-app-food-test-match` originally promised **8 marks for four compound pairing clicks**. **Fixed in QA branch source to four marks (one for each complete pair)**; independently verify all 0–4 partial-credit cases in the actual scorer before any approval. |
| Free-text `mark_points` | 52 | **99 original marks**. Scientific content largely consistent, but open-English marking is not reliable enough for formal use. Earlier QA documented 29 unseen correct paraphrases undercredited; the 51-item probe reported **42 undercredit and 6 contradiction-overcredit out of 196 trials**. These diagnostics are historical: do not misreport as current fully repaired. Convert to independently reviewed discrete decisions, or retain as uncredited human-rubric practice. |
| **Total** | **143** | **0 formally approved**; 25 source MC items have individually checked science keys (9 recall + 16 non-repeating case exemplars), but remain subject to curriculum and release sign-off. |

## Specific curriculum, fairness and scientific issues requiring correction

1. **Marking inequity (P0):** 52 free-text prompts must not earn Daily, XP, MP, Mastery or formal scores while unseen paraphrases and contradictions are misclassified. Clear valid alternatives, wrong/negated answers, numeric tolerances and every mark point independently before any scoring proposal.
2. **Matching overclaim (P0):** Four on-screen compound pairs cannot honestly be presented as eight separately earned marks. Retain four independently justified marks or create eight separately answerable parts.
3. **Excessive duplication (P1):** Each of 16 patterns is recycled four times with lightly varied narratives; 48 near-duplicates should be replaced by real practical planning, controls, variables, observation quality or inference questions. Do not add unverified science questions to fill a number.
4. **Benedict quantitative inference (P1):** `bio-y8-food-tests-application-20261025-sugar-strength` originally did not specify equal sample/reagent volumes or heating conditions; the QA branch now explicitly fixes these conditions. Brick-red versus green is a **rough concentration indication only under comparable conditions**, never an exact concentration proof. Correction stem and cautious mark points drafted.
5. **All-negative inference (P1):** `bio-y8-food-tests-application-20261025-all-negative` now states that controls functioned; conclude *not detected*, not absolute absence of all nutrients.
6. **Distractor quality (P1):** The optional 99-part draft has clear scientific keys for each part, but independent sole-answer and distractor QA is **NOT complete**. Concrete weak/implausible original choices occurred in points **32, 39, 45, 72 and 75** (examples included glass magically converting starch to glucose and a notebook's location). **All five sets were rewritten on PR #308 QA candidate, but option-specific scientific uniqueness and plausibility tests remain pending; 0/99 approved.** Other short distractors are not automatically defective: a question asking for a reagent or colour may legitimately have one-word responses.
7. **Safety:** Keep ethanol away from naked flames; use a water bath for heating Benedict's; eye protection and safe hot-tube handling. Do not award safety marks to hazardous instructions merely because another part of the response is true.
8. **Teaching fit not independently confirmed:** AQA GCSE practical standards support these scientific statements, but do **not** establish exactly which Food Tests practical details this pupil has been taught at TGS (original topic identifier is Year 8). Passing subject-knowledge QA is not proof of lesson-sequence fit.

## Scientific comparison references

- AQA, [GCSE Biology Practical Handbook](https://filestore.aqa.org.uk/resources/biology/AQA-8461-PRACTICALS-HB.PDF), 'Food tests', pages 40–42: Benedict's reagent and heated water bath, iodine, ethanol flammability, Biuret solutions, safe handling and table of observations.
- AQA, [GCSE Biology practical assessment specification](https://www.aqa.org.uk/subjects/biology/gcse/biology-8461/specification/practical-assessment).
- CCEA, [GCSE Biology Unit 1.3 Food Tests factfile](https://ccea.org.uk/downloads/docs/Support/Factfile/2019/GCSE%20Biology%20Factfile%20Unit%201.3%20Food%20Tests.pdf) — standard positive colour/precipitate and emulsion reference.

## Independent release gates remain explicit

**PR #308** stays Draft and contains QA evidence / unapproved candidates. **PR #310** stays Draft and independently provides a practice-only formal-credit hold. **`main` is untouched.** Do not import the 99-option draft or the correction proposals, enable scoring, alter historic learner data, merge or deploy until all applicable Academic QA, Technical QA and real iPad PWA release evidence is explicitly accepted.

**Status: ACADEMIC QA INSPECTION COMPLETE FOR 143 SOURCE IDs; ACADEMIC APPROVAL 0/143; RELEASE BLOCKED.**

## Round 3 — replacement candidate for the 48 repeated case questions (QA draft only)

The 64 source MCQs with four observations currently show only **16 distinct positive/negative combinations**, each in four wordings. This was not a finding that their answer keys are wrong; it was a diversity and diagnostic-value defect.

A separate **48-question replacement candidate** has now been authored at [Food Tests 48 duplicate replacements](food-tests-48-duplicate-replacements-draft-20261123.json), using the exact IDs of the repeated F2/F3/F4 source items but leaving the source content and its student learning history **unchanged**. The existing F1 16-science-pattern exemplars remain source questions.

The replacements examine evidence limitations, positive and negative controls, contamination, independent variables, repeatability, safety, and justified inference rather than changing only sample identifiers. Each draft item has four answers, exactly one keyed option, a science rationale, and explicit `approved:false`. Key positions are deliberately balanced A/B/C/D **12 each**; that is a structural safeguard, **not proof of independent plausibility or scientific sole-correctness**. An initial distractor self-review rewrote 26 choice sets that were obviously implausible. The remaining distractors must also be checked by a separate subject reviewer, including every distractor's scientific truth, lab condition and taught scope.

**Status: 48/48 replacement drafts authored; 0/48 independently academically approved; 0/143 live source items formally approved.** Nothing imported to `content/topics` from this candidate and none enabled for Daily/MP/Mastery.

## Round 2 applied fixes (QA branch only)

- Source commit `0e5d1a6`: the 4-pair Food Tests matching item now advertises **4 marks**, and Benedict's comparison / all-negative conclusion have scientifically constrained stems and matching model points; original 143 IDs retained. App formal scoring remains held by PR #310 independently.
- 99-point candidate commit `21c437f`: options revised for five implausible-distractor sets, keeping stable option IDs and correct-key positions. The candidate remains a **non-imported, unapproved** QA artifact.
- Source 99-mark draft, 143-row register, correction proposals and negative release tests synchronized. Passing these checks only confirms the QA evidence matches these revised candidate bytes.
- AQA specifies Benedict's, iodine and Biuret in the GCSE required practical; ethanol emulsion is scientifically established, but its inclusion in *this student's actual taught scope* still requires a separate TGS determination.

**Still blocked:** 48 repetitive case MCQs, 15 typed-alternative fairness checks, 52 original free-English rubrics (99 points), and independent reviewer sign-off. No change to main or historical learner progress.

## Round 4 — 15 typed answers and adversarial negative tests (QA branch only)

The 15 source `typed_exact` and `typed_short` questions have **23 additional scientifically valid vocabulary/observation variants** added only to the Draft QA branch. Examples include `Benedict's reagent`, `violet` and `milky white emulsion`. The [15-row adversarial probe file](food-tests-typed-15-adversarial-probes-20261123.json) checks one valid alternative and one intentionally incorrect answer per item.

Direct execution of the actual `B(e,t,n,r)` scoring logic from both QuizSession bundles (using a deterministic QA text normaliser) showed **15/15 correct alternatives accepted, 15/15 incorrect alternatives rejected on each bundle**. The main scorer exposed a **double-negation over-credit**: `not no starch was detected` and `not no lipid detected` were previously treated as equivalent to negative conclusions. The current QA branch adds an explicit disallowance; both current and legacy scorers now reject the specific adversarial double negations and `not <accepted canonical answer>` probes in this test harness. These are bounded model-prepared tests, **not an independent unseen answer-set or real-browser marking sign-off**. No Daily, XP, MP or Mastery credit may be enabled.

## Round 5 — more substantive MCQ revisions (QA drafts only)

- The [48-source-ID case replacement draft](food-tests-48-duplicate-replacements-draft-20261123.json) now has **45/48 distractor sets rewritten**, favouring plausible laboratory errors, control failures, untested assumptions and misconstrued results instead of obviously nonsensical wrong answers. Three retained sets are still unapproved; all 48 require independent science and sole-key evaluation.
- Four candidate stems had ambiguity removed: equal-bread portions already assumed before asking to control sample mass; conflating one snack with a balanced diet; text implying that an unknown practical sample was tasted; and an unclear Biuret quantitative-inference question.
- Structured [99-point review candidate](food-tests-structured-99-point-review-candidate-20261122.json) point **#92**, on ethanol vapour and a nearby flame, originally permitted more than one safety-relevant answer under its vague wording. The stem now asks about the **direct ignition hazard**, and all three distractors are replaced. This and the five earlier rewritten point sets remain unapproved.
- [143-item QA preview](food-tests-143-revised-preview-20261123.json) retains all 143 original IDs, 48 candidate replacements and 95 non-replaced source items. Preview changes are isolated: **the 48 new MCQs remain absent from the live `content/topics` bank**.
- Structural completeness, test-key placement and scorer demonstration **do not** establish pupil-facing fairness or evidence of actual TGS teaching sequence.

**Current academic gate: 0/143 approved original questions, 0/48 approved replacement questions, 0/99 approved structured candidate points.** No merge, deployment or historical learner data modifications.

## Round 6 — independent-quality second-pass MCQ revision (QA draft; not sign-off)

A closer read of the [99 structured mark-point choices](food-tests-structured-99-point-review-candidate-20261122.json) found that **point 92** used a vague fire-safety stem in which two options could be relevant. It was tightened to explicitly ask about the ignition hazard of ethanol vapour. Ten further mark-point distractor sets **18, 21, 33, 40–43, 47, 62 and 63** were rewritten to target experiment contamination, independent repeats, extraction, Benedict's heating and emulsion endpoint reasoning. Together with the five earlier rewrites, **16/99 distinct structured candidate choice sets** have now undergone substantive corrections; all **99/99 points remain unapproved**.

The 48-case-replacement draft has likewise been independently reread as a candidate, and four ambiguous stems (F3-01, F4-13, F4-15, F4-16) were improved. **45/48 distractor sets** have undergone a rewrite; the remaining three retained source drafts and all newly rewritten choices still require separate, genuinely independent science answer-key adjudication. Balanced correct-option positions and a scoring test are not substitute evidence of sole-correctness.

The 15 typed variants have explicit 15 correct / 15 incorrect example probes on **both real QuizSession scoring functions**, plus two adversarial double-negation cases. These are bounded AI-authored tests, not a pupil-grade marking-validation sample. A separate cross-topic technical regression is needed before deploying any shared science-scorer change.

**Latest QA-only correction status: source science stems and some synonyms repaired; scoring/fairness sign-off pending, 0/143 Academic approvals, no live scoring or deployment.**
