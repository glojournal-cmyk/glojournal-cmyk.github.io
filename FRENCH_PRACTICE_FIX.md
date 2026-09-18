# French practice regression repair — 18 September 2026

## Confirmed on the published site

At `/study/french/practise`, submitting a correct answer changes the prompt while retaining the submitted answer and feedback. Submitting question 2 resets the displayed counter to question 1. Choosing `1` for `un` is marked wrong despite the explanation saying that `un` means `1`.

## Causes and changes

- The practice route creates a new topic catalog array on every store update. Its question-selection memo depends on that array, so recording an attempt reranks the questions. The quiz effect sees new items and resets the question index. Memoize the catalog by subject, study year and catalog readiness. Mount a separate session when year/topic/mode changes, and replace an invalid selected topic after a year change.
- All 1,734 French multiple-choice records lacked `answer.accepted`. The scorer compares against an empty list and rejects every selection. Restore the keys from explicit translation pairs and reviewed explanations, with manual grammar review for the remaining cases. `tests/french-choice-repairs.json` records each restored answer and its basis. Do not infer correct answers from option position at runtime.
- French dictation's boolean completion variable shadows the normalizer named `N`, producing `TypeError: N is not a function`. Give the normalizer a descriptive name.
- Dictation recalculates its word list whenever an answer updates `spellingDue`. Freeze the selected words for the active session; scheduling still updates the store for future sessions.
- Correct the reading-tense explanations: phrases such as `suis au`, `est l’histoire` and `a un` are present tense in their passages, not passé composé. `a fini` remains passé composé. Replace three valid future-tense distractors with unambiguously incorrect conjugations so these remain single-answer questions.

## Verification

Run `node --test tests/french-practice-regression.mjs`.

Four regression tests pass against the fix and fail against commit `4ed009ddfd3d5b65479d298912a5f332be5cfb19` (set `REGRESSION_BASELINE=1`; the baseline commit must be present).

Coverage: `trois → 3`, rejection of wrong numbers and numeral-only answers when French spelling is requested, all options across 1,734 French MC records, a complete 10-question session during parent/store rerenders with a 10/10 result, and French dictation with accent folding and review scheduling. The component tests execute the deployed component functions with a deterministic hook/store harness; they are not an iPad browser certification.

## Scope and release

Prepared as a reviewable patch, not a production deployment. The repository contains compiled application bundles rather than the original route/component sources; the fix changes those deployed bundles directly. Keep these fixes when rebuilding from the original application source.

No learner storage is cleared, and historical scores are not rewritten. Existing wrong-answer records cannot safely be reconstructed from the repository alone. The live browser reproduction used a separate test browser, not the learner’s iPad.

A schema scan also found MC records without accepted answers in Latin (986), Physics (426), Biology (270), and Chemistry (80). Those answer keys have not been repaired or academically audited in this French-focused patch. This is not a complete certification of the entire site's question bank. The shared practice-session stability fix applies to all subjects using that route.
