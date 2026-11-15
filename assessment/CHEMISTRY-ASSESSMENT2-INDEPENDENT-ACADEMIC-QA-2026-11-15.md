# Chemistry Assessment 2 — Independent Academic QA (15 November 2026)

**Scope:** Tiffin Girls' Year 9 Chemistry Assessment 2, week beginning 16 November 2026. Teacher-confirmed content: chemical formulae, chemical equations, Chapter 1.5 history of the atom and Chapter 1.6 structure of the atom. Maximum assessment time: **20 minutes**. The school's precise mark total has **not** been confirmed; our 20-mark school-style mocks are an approximation.

**Academic disposition after repairs:** **Reviewed and corrected; no remaining known erroneous answer keys in the reviewed scope.** This is source-based, independent academic QA, **not** AQA moderation, teacher approval, a guarantee of identical school format, or a claim that automated tests can prove every interpretive explanation.

## Exact materials examined

- **Revision Bank: 134 examinable questions** across 4 topics: history (22), atomic structure (28), chemical formulae (32), balancing/equations (52).
- **Excluded extensions: 16** (isotopes, ion-electron counts, electron arrangements, relative atomic mass and other later-chapter material) remain available for historical records but must **not** enter newly generated Assessment 2 revision sets. This exclusion list is explicit and was rechecked.
- **School Mocks A/B/C: 13 questions each, 20 marks each, 20-minute timer**, yielding another **39** original items across all four subjects. In each mock the section totals are history 4, atomic 5, formulae 5, equations 6.
- **Total current Assessment 2 question records reviewed: 173** (134 plus 39), with independent inspection of stems, stated answers, written-response mark points and linked diagrams.

## Checks and evidence

1. **Scientific meaning and curriculum fit:** Model progression Dalton → Thomson → Rutherford → Bohr, neutron discovery by Chadwick, interpretation of alpha scattering, protons/neutrons/electrons, mass number and neutral charge were checked against the subject content in AQA GCSE Chemistry 8462 §4.1.1.3–5.
2. **Numerical keys and chemical syntax:** Independently parsed and checked **36 complete typed balanced-equation answer keys** for atom conservation (30 revision keys + 6 mock keys), including brackets and polyatomic groups. Independently recalculated the atom ratios and charge-neutrality of **14 ionic formula revision keys**. Additional free-response balancing explanations, sample calculations, formula subscript/bracket use, and answer options were inspected for scientific meaning.
3. **Question-bank integrity:** Recomputed 134/39 counts, category distributions, distinct answer options and expected mark-point counts. Detected no absent answers, out-of-scope selections, or mismatched number of rubric criteria after correction.
4. **Figures:** Reviewed the three school-mock SVG diagrams and their intended scientific meanings. The Rutherford and atomic-model figures match the related questions. **Atom X** was corrected: two inner-shell electrons and six outer-shell electrons, **all positioned on their drawn shells**, eight electron marks in total, with nucleus labelled **8 protons and 9 neutrons** (mass number 17; neutral oxygen-17).
5. **Fair marking:** Objective questions accept the stored correct answers and reject the known incorrect examples in dedicated regression tests. Each explanatory question is evaluated using **distinct, point-by-point self-review after submission**. The app does **not** claim reliable automatic grading of open-text chemistry explanations; a pupil or teacher must judge equivalently valid scientific wording.

## Academic issues corrected on 15 November 2026

| Item | Issue | Repair | Status |
|---|---|---|---|
| `chem-nov16-2026-history-applied-02` | The previous prompt only supplied the observation that most alpha particles pass through the foil, but the two-point rubric also demanded a small nucleus without explicitly supplying the rare, large-angle-scattering evidence. The two marking points risked overlapping. | Now supplies both scattering observations and awards one mark for **mostly empty space**, a separate mark for a **tiny, dense positively charged nucleus**. Stem, stimulus, model answer, marking points, explanation and common-error note were synchronised. | Corrected |
| `content/diagrams/chem-nov16-atom-x-20261114.svg` | Electron dots were visually off their drawn orbit/shell lines; high risk of an inaccurate diagram even though the counted total was eight. | Redrawn two inner and six outer electrons with exact geometrical shell checks. Both question display and answer-review images have refreshed URLs to avoid stale browser cache. | Corrected |
| `chem-y9-c7-nov16-2026-formula-01` | The `MgO` accepted answer string was duplicated. This did **not** cause incorrect marking but was needless. | Removed repeated `MgO`; updated the objective-answer count regression. | Corrected |

**Regression coverage added:** The school-mock test now counts visible electrons, verifies a 2+6 placement and checks nuclei labels. The exam-revision test verifies both independent Rutherford observations and two separate marking points. Existing Chemistry mock and revision QA suites check exact length, counts, scoring, formulae, equation coefficients and persisted states.

## Known boundaries and separate technical QA

- This review does not assert that the actual teacher's next paper is 20 **marks**. Only its **maximum duration** of 20 minutes and the stated content were supplied.
- The later textbook sections C1.7/C1.8 are excluded **for this school-specific set**, even though some content is legitimate AQA GCSE Chemistry overall.
- Multiple-mark written explanations are **self-marked** using correct model points: a student can award an inaccurate mark. High-stakes interpretation still benefits from a human review of the pupil's own wording.
- Passing GitHub Actions regression tests is **Technical QA**, not proof of academic quality. Production iPad performance, final successful Pages deployment and complete Whole Site QA must be checked **separately**. Do not mark these as complete until their specific runs are confirmed.

**Reference:** [AQA GCSE Chemistry 8462 — Atomic structure and the periodic table](https://www.aqa.org.uk/subjects/chemistry/gcse/chemistry-8462/specification/subject-content/atomic-structure-and-the-periodic-table) and [AQA GCSE Chemistry 8462 — Quantitative chemistry](https://www.aqa.org.uk/subjects/chemistry/gcse/chemistry-8462/specification/subject-content/quantitative-chemistry).
