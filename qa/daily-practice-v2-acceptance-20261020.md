# Daily Practice v2 — QA / acceptance criteria
Status: implementation prepared on preview branch only; NOT released.

## Behaviour that must stay unchanged
- MC single choice: original on-click evaluation, feedback, save and result credit.
- Word tiles: selection/reordering and the original Submit action.
- Text/spelling/short answers: keep real keyboard input and original mark rules.
- Extended GCSE responses: preserve rubrics and partially correct answers.
- Existing question bank, correct-answer synonyms, mastery, wrong-answer recovery, XP, offline save, daily task lock, history and resume.

## Layout acceptance on iPad landscape
- No blue top header or desktop sidebar during an active Practice question.
- Existing Study-style, seven-entry floating pill: Home / Study / Play / Garden / Pet / Assessment / Scholar; Study selected.
- No dedicated side column. Small pet icon and voice toggle near upper-right; no clipped tap targets.
- Prominent bold question, legible prompt (prefer >=28px), big input or 2 x 2 MC choices for short options.
- Large / wordy MC choices fall back to one full-width column.
- Short questions AND answer controls fit the iPad landscape viewport when practical.
- Long text, diagrams and image-heavy GCSE questions may scroll within the page; never crop text or buttons.
- iPad soft keyboard must not cover answer input or Submit; floating nav can hide while typing.
- Portrait/mobile fallback uses single-column options and scrollable seven-item navigation.

## QA checks to run before merging
1. iPad Safari landscape 1024x768 and 1366x1024; no clipped answer or competing bottom bars.
2. Practice MC: choose answer; confirm original immediate marking + progress.
3. Word tiles: choose / undo / submit and next; check wrong/correct paths.
4. Text/spelling input: typing, validation, submitted answers and mark keywords.
5. Multi-mark Chemistry, Physics and Biology with diagrams and long prompts.
6. Exit / reload / Continue from saved question (title and answers preserved).
7. Daily lock, XP, Study / Pet / Home / Study return navigation and keyboard safe area.
8. Keep previous answer records; compare pre/post (do not clear Safari storage).
9. Visual keyboard focus/Voice cheers/pet availability and error/recovery banners.
10. Accessibility: readable contrast, 44px tap targets, keyboard focus, reduced motion.

## Safety / rollback
- No saved-state changes in the UI module.
- Only activates on /study/{subject}/practise and with a currently rendered question.
- Add `?dailyUxPreview=0` to disable the new layout in any preview deployment.
- Keep PR as draft until full browser and iPad QA pass and user approves release.
