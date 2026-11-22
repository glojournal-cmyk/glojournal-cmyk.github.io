# Maths 200 source A–F PDF layout QA — critical extraction repair and 40 Indices distractor triage

**22 November 2026 | Draft PR #306 | SOURCE-ONLY & PEDAGOGY STILL BLOCKED | 0/200 formally approved**

## Root issue, not a grading-key error

The initial 200-question source register proved that each printed original question exposes **A–F six option starts** and one printed keyed answer letter. **That did not prove 1,200 individual choice expressions were faithfully reconstructed from extracted PDF text.**

The PDFs contain stacked fractions, superscripts and multi-column aligned mathematics. The old [original option inventory](../qa-staging/math-v311-indices-240-source-options-qa-ledger-20261122.json) naively cut from one `A.` marker to the next `B.` marker. In source **Indices Q5**, `A. 16\n       1` appears because the **numerator 1 of adjacent B's 1/16** can be vertically displaced into A's text slot; `B.\n      16` on its own **does not mean integer 16**. The old extracts must never be used as faithfully parsed mathematical options.

This is a *source-extraction evidence flaw*, not proof the typeset student paper contains a wrong option. No original PDFs or underlying canonical questions were altered.

## Fixed: explicitly screened all 1,200 original option snippets for safe layout

[New cross-topic 1,200-row safety register](../qa-staging/math-v311-original-1200-option-layout-safety-20261122.json) retains the raw original extracted snippet but records whether its mathematical value is cautiously recoverable as a **single-line integer only**. Multiline, fractions, standard form, complex formulas, superscripts and other structured glyphs **fail closed** as **needs original-PDF visual inspection**. It never claims teacher misconception signoff or credit.

| Topic | Original A–F slots | Safely recognisable single-line integer slots | Unsafe to interpret as an integer without original-page visual checking |
|---|---:|---:|---:|
| Indices | 240 | **142** | **98** |
| Standard Form | 240 | **16** | **224** |
| Changing the Subject | 240 | **0** | **240** |
| Straight-line Graphs | 240 | **127** | **113** |
| Simultaneous Equations | 240 | **192** | **48** |
| **All five topics** | **1,200** | **477** | **723** |

**Meaning:** The 477 are **readable integer source snippets, not 477 pedagogically approved distractors**. The 723 are **formatting or layout unresolved**, not necessarily mathematical errors. A source key's PDF-extracted value is not automatically "verified" when that key sits inside the 723.

## One entire original topic reviewed: Indices Q1–40 and 200 wrong choice slots

[Full 40-question, 240-option/200-distractor triage](../qa-staging/math-v311-indices40-all200-wrong-options-math-triage-20261122.json) combines the original 40 sourced stems and worked answers, independent correct value calculations and this new per-option layout safety:

| Original Indices Q1–40 wrong-answer slot status | Count | Interpretation |
|---|---:|---|
| Wrong operation **mathematically reconstructed** | **4** | All Q5–8 very large answers correspond to the specific error `8^(-b) → 8^(+b)`; source numbers and derivation match |
| Readable integer and **numerically unequal** to independently computed correct value, but no verified misconception model | **112** | Not a correct-answer duplicate in the *readable* subset; **not independent pedagogy PASS** |
| Extracted math expression or stacked fraction unresolved | **84** | Cannot establish original option's exact value until checking original rendered PDF |
| **Total original wrong slots** | **200** | **0/200 independent pedagogical signoffs** |

The original forty correct answer slots are 28 one-line readable integers plus **12 still needing PDF glyph/layout checking**. The four Q5–8 outliers' wrong operations were derived independently and documented in [existing reproducible test and source QA](daily-v3-maths-indices-005-008-source-distractors-20261122.md), not invented from the current output:
- **Q5 D**: incorrect exponent +16 ⇒ **65,536** instead of 16
- **Q6 D**: incorrect exponent +27 ⇒ **134,217,728** instead of 8
- **Q7 B**: incorrect exponent +38 ⇒ **274,877,906,944** instead of 4
- **Q8 E**: incorrect exponent +49 ⇒ **562,949,953,421,312** instead of 2

The four extreme values are therefore **mathematically reproducible** from one real index-sign error; their magnitude alone is *not* grounds to label them nonsense. Their independent student-misconception *plausibility*, teacher approval, Grade7–9 band and semantic originality remain unverified.

Other original Indices values are **not** assigned plausible-sounding but unproved wrong working merely to fill five distractors per question.

## CI guard and safe next stage

[New regression](../tests/daily-v3-maths-source-option-layout-and-indices40-20261122.test.mjs) re-opens the five prior 240-choice original ledgers and checks *all 1,200* new safety classifications directly against raw snippets; it tests especially the dangerous Q5 A/B source layout cases and asserts no original option was promoted to independent QA approval. It also verifies that the 40 Indices original IDs have exactly five wrong-option slots each, only four with mathematically reproduced mechanisms, and all Maths credit flags remain false.

**Work required:** visual fidelity reconstruction of the actual typeset A–F mathematical expressions for the remaining 723 formatted slots (especially original Changing the Subject, Standard Form and graph fractions), then independent error-path proof and external teaching/difficulty evaluation. The source PDFs could be extracted as text in this environment; image-page rendering was unavailable on attempted Files image reads this turn, so **visual source certification has intentionally not been guessed**.

**Release:** The original 200 Maths questions and any new candidates stay unapproved. 0 source questions are allowed into Daily, XP, MP, Mastery or Recovery; there is no new deployment, PR merge, student-save write or alteration of original source keys.
