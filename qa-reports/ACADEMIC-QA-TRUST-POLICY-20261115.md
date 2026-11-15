# Scholar's Garden — independent academic review evidence gate (15 Nov 2026)

## Why this exists
Psyche needs reliable explanations and fair marking. Green CI, a complete question bank or a model answer scoring full marks is **not proof** that individual questions are academically correct or that alternative scientifically valid answers receive fair credit.

Existing tests for question schemas, internal consistency, answer marking and coverage have value, but they cannot replace independent content review against school requirements and authoritative subject references.

## Separate two kinds of evidence
- **Technical QA:** syntax, routing, saved state, iPad/WebKit browser checks, progress counting, question availability and regressions. Report the exact workflow revision, tests and platform.
- **Academic QA:** individual questions' curriculum fit, scientific/linguistic truth, correct answer, defensible alternatives, fair mark allocation and rejection of false answers, meaningful explanations and school scope. Record sources, reviewers and inspected question IDs.

## New review-evidence gate
For additions or revisions to JSON question banks in assessment, content/topics, content/exam-revision, content/exam-practice or study, the gate fingerprints learner-facing and marking-bearing fields. CI searches for an evidence record matching the exact path, ID and fingerprint in qa-reports/academic-review-ledger-20261115.json.

Each record must specify file, id, fingerprint, reviewer, reviewDate, sourceReference and reviewNotes. All five checks must be recorded true: curriculumFit, scientificOrLinguisticAccuracy, answerAndReasonableAlternatives, markingFairness, explanationQuality.

**Never auto-fill review records from question-bank content merely to pass CI.** Independently check the actual source and test sensible correct and incorrect answers. Review evidence is not official school or exam-board certification.

The gate produces a JSON report of gaps. It has been prepared in a **draft, non-deployed PR**, not on the live site.

## Explicit limitations
1. Existing unchanged questions are NOT independently re-reviewed by the gate.
2. JS, HTML and PDF question content is not covered by JSON fingerprinting.
3. The gate checks whether attributable evidence is recorded, not whether the underlying reviewer is factually correct.
4. Self-grading model-answer tests are internal consistency checks, NOT independent scientific or language verification.
5. Green CI is not proof that real device-local iPad learning records or XP/MP have been reviewed, or that teachers have moderated the content.
6. Do not promote technical test pass to an app-wide Academic QA complete claim.

## Next checks
First inspect Year 9 Physics Density, conduction and practical questions for correct explanations and scientifically correct alternative answers, including plausible but wrong or negated responses. Then November Biology 4.1.1 and Chemistry school syllabus. Preserve saved grades, progress, Daily assignments, MP/XP and learner history. A future Challenge This Answer feature must preserve evidence and allow review, not automatically discard student reasoning.

**Release rule:** Claim Academic QA complete only for specified reviewed question IDs and sources, with actual evidence. Claim Technical QA passed only for the exact completed CI revision and supported device/browser scope.
