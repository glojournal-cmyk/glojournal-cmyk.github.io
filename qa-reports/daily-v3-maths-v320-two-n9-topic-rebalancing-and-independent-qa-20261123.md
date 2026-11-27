# Maths Academic QA V3.2.0 — Two Standard Form questions repaired for N9 topic coverage

**23 November 2026 | Draft PR #306 | All release gates BLOCKED | 0/200 formal Maths Academic approvals**

## Directly inspected sources

- Original 200-question reviewed bank: `qa-staging/math-v311-reviewed-200.json`, exact Git blob `0655fbc1b796bff68f533c060a43339dff6664be`. **Unmodified, all 200 student Daily disabled.**
- [V318 three-question pack](../qa-staging/math-v318-three-lower-demand-indices-standard-replacements-20261123.json) at blob `8cc0e489be650f8445619d8e7f0b55b0cc996bef`, whose Indices worked-step statement about both separate perfect squares was repaired earlier.
- [V319 source-specific topic mismatch register](../qa-staging/math-v319-aqa-2024-higher-comparator-three-topic-content-audit-20261123.json) and official 2024 AQA Higher Q2 comparison.
- **New full V320 QA-only replacements**: [Standard Form 009 and 025](../qa-staging/math-v320-two-standard-form-n9-final-output-rebalanced-candidates-20261123.json). Each retains lineage to its exact original V311 revision *and* previous V318 candidate. No canonical source bank, learner progress or live scoring code was changed.

## Why the change was necessary

The real [AQA June 2024 Higher 8300/2H Q2](https://www.aqa.org.uk/files/sample-papers-and-mark-schemes.2024.June.AQA-83002H-QP-JUN24_PDF/8e8aa692e965f0ef83fc92b68d04e9d106e1b9e0.pdf) asks for an inverse percentage calculation with the **answer expressed in standard form**. The matching [official Q2 mark scheme](https://www.aqa.org.uk/files/sample-papers-and-mark-schemes.2024.June.AQA-83002H-MS-JUN24_PDF/58748640acbbc7d5de2e25fd8a300555474f7b01.pdf) separately recognises method and correct standard-form output (M1, M1dep, A1). Both source pages were visually inspected. This is a **real Higher question and official mark scheme, not a Grade7-specific exemplar**.

AQA [N9](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/subject-content/3.1-number) covers calculation with and interpretation of normalized standard form. Under V318 the Standard Form 009 answer was a plain monetary cost and two container counts; Standard Form 025 answered only a chamber volume coefficient and sealed-pack count. They made scientific notation *part of the question data* but did **not** require correctly normalized scientific notation in the *answer*. They also relied heavily on distinct A21/A22 modelling, percentages and integer feasibility skills.

## V320 candidate corrections

| Source ID | Core AO2/AO3 reasoning retained | **New N9 answer requirement** | Verified correct choice |
|---|---|---|---|
| `STANDARD_FORM-009` | Find feasible type A/B container mix with unequal safe headroom and minimum cost | In addition to count and cost, calculate unused **nominal** capacity in normalized standard form (not unused *safe* capacity): \(U=9\times10^4\) g | **D — (3,2,250,9×10⁴)** |
| `STANDARD_FORM-025` | Apply filtering, conservation and compression; choose greatest feasible chamber volume with integer whole packs | In addition to volume and pack number, calculate/normalize final total particle count: \(T=1.2\times10^7\) | **C — (2,3,1.2×10⁷)** |

### Strict answer and wrong-option Academic QA

**Standard Form 009:** Retained mass \(570000\) g, safe loading capacities \(102000\) g per A and \(135000\) g per B. Among at most five containers, minimum cost is **£250** for three A and two B. Their full nominal capacity is \(3(120000)+2(150000)=660000\) g, so unused **nominal** capacity is \(660000-570000=90000=9\times10^4\) g. 

The six options distinguish at least five independently meaningful errors: too-cheap but physically unsafe (4A+1B or 5A), confusing the **safe-capacity margin 6000 g** with the **unused nominal capacity 90000 g**, using **six containers**, or choosing a feasible but unnecessarily expensive mix. All final unused-capacity numerical responses are in valid normalized standard form.

**Standard Form 025:** Initial count \(10^7\) particles, retained after filtering \(7.5\times10^6\). With p whole packs, final count is \(7.5\times10^6+1.5\times10^6p\). Exact 6000 particles/cm³ at chamber volume \(v\times10^{-3}\) m³ gives \(v=1.25+0.25p\). Allowed p≤3 implies offered feasible (v,p) values (1.5,1),(1.75,2),(2,3). Maximum v=2, p=3 yields final count \(1.2\times10^7\) particles, correctly normalized. All six options carry source-recomputable final particle quantities; wrong ones fail the exact-concentration, pack-limit or *maximum volume* requirement.

## Test coverage

- **2 questions**, **12** A–F alternatives and **10** wrong-answer explanations, all candidate QA-only.
- Direct App offline MathML parsing tested **20/20** fields (stems, options, worked steps), no parsing exceptions.
- New [source-first V320 Node regression](../tests/daily-v3-maths-v320-two-standard-form-n9-topic-rebalance-20261123.test.mjs) recalculates source quantities, cost optimisation and exact particle conservation *without reading the chosen answer key*, checks all option tuples and requires final result coefficients between 1 and 10.
- Test also changes factory waste and chamber filter loss to prove that older keys cannot survive an altered source question without fresh calculation. It asserts every prior/canonical source revision, every full A–F option, and **zero academic release or learner credit permission**.
- The existing V318/V319 test now checks the [V319 written-only method-marking register](../qa-staging/math-v319-aqa-2024-higher-comparator-three-topic-content-audit-20261123.json). A first CI run found two test-evidence problems: terse rubric wording, and a test helper that mistakenly hardcoded the original waste quantity so it could not re-evaluate a mutated factory case. Both were repaired (the evaluator now reads its quantity from the current source stem). Do not call the follow-up CI green without verifying the completed run.

## Still **not** academically approved

The explicit standard-form answers **improve topical coverage**; they do not prove Grade7+ challenge, actual TGS taught-subskill coverage, independent concept distinctness or real pupil error frequency. The applied optimization/concentration tasks may still overweight A21/A22 versus N9. Their long text requires real iPad readability review. The paper-style sample comparator shows only that N9 should be demonstrated; it does not assign a grade to an individual MCQ.

Both new V320 versions retain `academicQA:pending`, `dailyEligible:false`, `masteryEligible:false`, `grade7PlusCertified:false` and `scoringWritesAllowed:false`. Real iPad PWA acceptance remains unsigned; TGS curriculum PDF was intentionally skipped per parent instruction. **PR #306 is Draft, no import, no merge, no deployment, no student XP/MP/Mastery/Recovery writes, 0/200 formally approved.**
