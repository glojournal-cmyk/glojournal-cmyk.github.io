# Garden V2 — Year 9 Mastery 990Q intake and QA (2026-10-27)

## Source intake
Two user-provided DOCX source drafts:
- Year9_Taught_Syllabus_Mastery_660Q_Draft(1).docx: 660 questions, source IDs xx.01–xx.20.
- Year9_Mastery_Additional_10Q_per_Topic.docx: 330 questions, source IDs xx.21–xx.30.
Together: **990 source questions; 33 topic blocks; six subjects** (Maths 5, Chemistry 6, Biology 6, Physics 7, French 7, Latin 2).

Source texts, exact IDs, answers and [1]+[1] mark rubrics were parsed into **a 33-file standalone staging JSON package** in the conversation deliverable Garden_V2_Year9_Mastery_990Q_STAGING.zip.

## Automated source QA
- Question IDs: all 990 unique, each block exactly 30.
- Every question has a prompt, paired answer and two [1] mark points.
- No structural/missing-answer errors.
- **74 identical-prompt groups** exist within the 990 questions: must NOT blindly activate all as distinct Daily / Mastery concepts.
- **189 near-duplicate pairs** at similarity >= 0.91; many are deliberate numeric variants and require deliberate family/dedup review, not an automatic mass deletion.
- Maths M4.29 in the 330Q supplement has a visibly unfinished model answer and incorrect x=3. Equations x+4y=13, 3x+y=11 require y=28/11, x=31/11. Explicitly BLOCK M4.29 pending academic signoff.
- All other questions remain 'needs_academic_review' and should not be used as auto-marked exact-string answers. User document provides two-point rubrics, sometimes method/working points.

## Safety / release gate
This document records the question intake; **the 990 question JSON package is not yet committed into GitHub**. No claim that the questions are live, question bank imported or academic QA passed. Don't activate V2 questions, and don't change any existing-app or learner records. The ZIP from this ChatGPT conversation is the import staging artifact; review duplicate families and mark rubrics before uploading them to the V2 staging directory and wiring V2 topic IDs.

## Next
1. Upload/commit vetted 33 staging JSON topic files onto V2-only branch.
2. Map source topic block codes to canonical V2 Year9 topic IDs; do not infer mapping to live current-app topics.
3. Flag concept families so repeat numeric variants do not inflate unique-question capacity.
4. Resolve academic flags, including M4.29, before enabling.
5. End-to-end tests for 2-mark method/partial-credit and French/Latin alternative correct translations.
