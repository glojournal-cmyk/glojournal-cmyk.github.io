# Year 8 question supply preflight — 11 November 2026

Release commit: 1bc0ecf67664b04d36f2f755a9c16daaebefd31f (PR #267).

## Source and learner safety
- Source manifests group original enabled formal Year 8 questions by concept, not by question ID variants.
- Before new unstarted Year 8 Standard and Mastery assignments, the planner uses source-backed remaining-concept estimates and student correct-answer evidence.
- A 25% headroom preference selects a better stocked topic where possible; it does not invent questions or change the target.
- If no eligible bank exists, the task is visibly blocked rather than silently marked complete.
- Actual same-day assignments, dated Recovery answers, historical answer scores, XP/MP, Pet and outfits must not be changed by the read-only preflight.
- Source JSON drift is checked by the question-supply GitHub Actions workflow. To regenerate the manifest after editing source question banks: `node scripts/generate-year8-supply-manifest-20261111.mjs`.
- The Home Inspector displays a seven-day hypothetical all-correct stress warning, not a promise of future scores.

## Verification
31 of 31 PR GitHub Actions succeeded, including Whole site Chromium and WebKit, Daily Progress, Latin rotation, backup and Recovery regressions.

## Device acceptance
After the GitHub Pages job for the current main SHA succeeds, open the existing iPad app normally; do not clear Safari data. Check that the optional Home 'Question supply · 7-day outlook' is present and that any new Daily tasks use normal question and progress counts. Device-local learner data and historical marks cannot be independently inspected in GitHub CI.
