# Maths Academic QA V3.1.9 — Actual AQA Higher paper comparison & topic alignment

**23 November 2026 · Draft PR #306 · 0/200 canonical Maths academic approvals · NO MERGE / DEPLOY / LEARNER CREDIT**

## Provenance and exact inspected sources

Reopened the exact [V318 three-question pack](../qa-staging/math-v318-three-lower-demand-indices-standard-replacements-20261123.json), source blob `8cc0e489be650f8445619d8e7f0b55b0cc996bef` after a mathematically clarifying correction to the INDICES-025 worked solution. Compared source revision lineage to the original reviewed [V311 200-item bank](../qa-staging/math-v311-reviewed-200.json) at immutable Git blob `0655fbc1b796bff68f533c060a43339dff6664be`. The original bank and its Daily/XP/MP/Mastery restrictions remain unchanged.

External exam sources were opened **directly from AQA**, rather than treating previous assistant summaries as a verified past paper:

- [AQA GCSE Mathematics 8300 N7, N9 (Number specification)](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/subject-content/3.1-number). N7 includes integer indices; N9 requires calculation with and interpretation of standard form `A × 10^n`.
- [AQA A21 and A22 (Algebra)](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/subject-content/3.2-algebra) cover equation modelling and inequalities, subject to tier distinctions.
- [AQA AO1–AO3 specification](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment). AO1 includes routine multi-step methods; AO2 requires reasoning; AO3 includes selecting and interpreting models.
- **Real Higher benchmark:** [AQA June 2024 8300/2H question paper](https://www.aqa.org.uk/files/sample-papers-and-mark-schemes.2024.June.AQA-83002H-QP-JUN24_PDF/8e8aa692e965f0ef83fc92b68d04e9d106e1b9e0.pdf), printed page **3**, Q2: mass 2,200,000 kg after 12% reduction, recover original mass **and write the answer in standard form**, **3 marks**.
- The accompanying [official AQA June 2024 2H mark scheme](https://www.aqa.org.uk/files/sample-papers-and-mark-schemes.2024.June.AQA-83002H-MS-JUN24_PDF/58748640acbbc7d5de2e25fd8a300555474f7b01.pdf), printed page **5**, Q2, awards separate evidence for identifying the 88% remaining, applying the reverse percentage calculation, and arriving at **2.5 × 10^6 kg** in standard form (M1, M1dep, A1). The original question and marking page were both visually verified in their PDFs.
- The same Higher question paper, printed page **23**, Q24(b), also makes the student select an answer **and show supporting mathematical working**. Consequently, a correct MCQ selection cannot automatically be interpreted as documentary evidence of every reasoning link.

**Critical limitation:** AQA Higher-tier placement and three marks for that one actual question **do not assign an official Grade 7 difficulty to that question or to any of our drafts**. There is no claim that an independent examiner reviewed the new Maths questions.

## Source-exact academic outcomes on V318

| Candidate | Mathematical result, source-derived | AQA syllabus/topic alignment | Independent Grade 7 status |
|---|---|---|---|
| **INDICES-025** | Both square powers, product and ratio inequalities leave exactly (n,m)=(7,13),(9,11), so sum of m = **24** | **Strong** N7 integer-index connection; additional N4/N5 listing and A22 inequality, but linked two-integer work may exceed Year 9 taught content | **HOLD / unknown** |
| **STANDARD_FORM-009** | Safe mix **3 A + 2 B**, lowest cost £250 with 570,000 g retained | **Partial N9 only**: scientific notation is used in the given masses and capacities but the final test chiefly assesses integer capacity feasibility and cost optimisation. Does **not** require a correct normalized standard-form final answer | **HOLD / high topic-alignment risk** |
| **STANDARD_FORM-025** | **v=2**, 3 whole sealed packs, largest permitted compressed volume; exact target 6000 particles/cm³ | **Partial N9 only**: scientific notation and cubic-unit conversion are needed, but the key challenge is reverse concentration modelling, integer packs and finite volume choice. Final answer (v,p) does **not** require standard-form normalization | **HOLD / high topic-alignment risk** |

The source equation of INDICES-025 is `Q(t)=2^(t−3)` for integer t≥3. Its first worked step has been **repaired on the V318 QA-only draft** to say **both Q(n) and Q(m)** must each be an integer perfect square and the two exponents must be **even and non-negative**. The previous phrasing accidentally suggested the ratio of their values had to be a perfect square, which was not the stated constraint. The correct answer and option letters remain unchanged.

The [V319 source-exact academic QA register](../qa-staging/math-v319-aqa-2024-higher-comparator-three-topic-content-audit-20261123.json) records all three literal candidate stems, previous and current revision IDs, topic alignment, exact syllabus links, skills still to verify, and explicit **no credit/no approval** fields.

## Separate method-marking evidence — illustrative internal *written-paper* rubric, never Daily score

To make the difference between “chosen correct answer” and “proved intended reasoning” inspectable, V319 includes these internal-only **marking criteria** (not an AQA-authored mark scheme):

| Candidate | Internal illustrative written mark allocation | Key evidence |
|---|---:|---|
| INDICES-025 | **5** | correct index simplification; square conditions and sum relation; ratio bound; exhaustive two admissible integer pairs; sum 24 |
| STANDARD_FORM-009 | **6** | retained mass; usable capacities; joint constraints; four containers impossible; compare viable five-container mixes; minimum cost and check |
| STANDARD_FORM-025 | **5** | original/remaining particle count; model concentration with p and v; derive relation; test finite allowable pairs and reject excessive packs; greatest feasible volume |

**Total: 16 illustrative written marks**, for independent source and educational review only. Valid alternate written methods should be accepted. App MCQ **must not award those 16 method marks**, nor full standalone Mastery progress, solely on selection of a correct letter. The official 2024 AQA rubric separately awards method and accuracy marks; V319 merely proposes analogous transparent checks rather than claiming an official adopted scheme.

## QA decisions and release gate

- **Mathematics:** 3/3 solutions already verified in the source-derived V318 independent test; **30/30** native offline Maths fragments parsed. New V319 tests assert all three risk decisions, official comparator information, 16 written-only review criteria, exact source lineage and 200-item release locks.
- **Curriculum:** source of AQA GCSE content verified. **TGS Year 9 taught sequence NOT verified**: the school PDF remains skipped following the parent's explicit direction.
- **Grade benchmark:** the retrieved actual AQA Q2 is a factual Higher-paper comparator, not a per-question Grade 7 calibration. **0/3 independent Grade7 certificates**.
- **Content fit:** **2/2 V318 Standard Form drafts require topic-specific rebalancing or explicit independent approval before import**. An answer that solves the wider modelling problem need not show that N9 was mastered.
- **Empirical distractors:** 0/3 independently validated against actual student responses.
- **Paper vs Daily:** grade-appropriate proof steps belong in a separate optional written assessment, not automatic Daily/MP/Mastery.
- **Physical iPad PWA acceptance:** untested; WebKit/Actions success is not actual hardware proof.
- **Original canonical V311:** exactly **200 items, all ineligible for Daily**, unchanged. **Formal Academic QA 0/200. Draft PR #306 stays unmerged and undeployed**.

**Next high-value QA action:** rewrite the two Standard Form candidates such that a student must actually perform and demonstrate N9 standard-form calculation/normalization *as part of the required answer*, while retaining AO2/AO3 reasoning and source-key uniqueness. Do not add artificial number-theory or cost constraints merely to make the item longer.
