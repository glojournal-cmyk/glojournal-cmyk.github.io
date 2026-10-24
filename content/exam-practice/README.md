# GCSE exam-practice expansion — 24 October 2026

60 original, independently addressed tasks (12 per subject), added as a separate Study practice bank. Existing topic JSON, catalogue counts, Daily selection, question IDs and progress keys are unchanged. The previous `review/aqa-science-exam-20261024` branch's 12 science items are not included in this count or merged by this change.

| Subject | Board | New tasks |
|---|---|---|
| Physics | AQA 8463 | 3 multistep calculations, 3 data/evaluation, 1 graph, 3 six-mark explanations/designs, 1 practical, 1 structured explanation |
| Chemistry | AQA 8462 | 3 calculations, 2 data/evaluation, 1 graph, 3 six-mark explanations/designs, 1 practical, 2 structured applications |
| Biology | AQA 8461 | 4 calculations, 2 data/evaluation, 1 graph, 3 six-mark explanations/designs, 1 biological drawing, 1 structured application |
| French | AQA 8652 | 2 × 90-word writing, 2 × 150-word writing, 2 reading, 2 extended translations, 2 dictations, 1 role-play, 1 reading-aloud task |
| Latin | OCR J282 | 2 connected passage translations, 2 comprehension, 4 grammar-in-context, 4 verse-analysis tasks |

## Assessment design

All marks are explicitly self/teacher reviewed, never auto-awarded through keyword hits or word counts. Science calculations show method and units, and independent method marks can survive arithmetic errors. Six-mark science responses use original best-fit level descriptors plus indicative content. These descriptors are formative guides, not copied official question-specific mark schemes.

French 90-word tasks use three bullets and a 10+5 allocation; 150-word tasks use two bullets and a 15+5+5 allocation. Translation has 15 explicit meaning units plus a language grid reference. Dictation uses 30+ words, hidden scripts and optional device speech; exact official vocabulary sampling and the two out-of-list words have NOT been certified. Speaking needs a listening adult; a typed answer is not pronunciation evidence. Normal vocabulary accent tolerance is not applied to these exam-skill reviews.

Latin has original Year 9 bridge passages with glosses and natural-English alternatives accepted. Short translation units use a formative rubric, not a claim to reproduce the complete OCR translation grid. Verse is Virgil Aeneid 7.461–466, checked against https://www.thelatinlibrary.com/vergil/aen7.shtml ; it is not claimed to be the pupil's 2029 prescribed set text.

Biological drawing requires a teacher-provided calibrated micrograph or microscope view. Graphs/drawings are completed on paper; the text box records accompanying calculations and reference. This release does not provide image-upload grading, recorded speaking assessment, photo-card pairs, full listening papers, all prose set texts, complete DVL/vocabulary coverage or a complete GCSE course.

## Access and persistence

Study → GCSE Exam Practice, or `/study/exam-practice/?subject=physics` (also chemistry, biology, french, latin). Direct subject pages include an entry link. Saved answers use only `scholar-gcse-exam-practice-v1`; exports/restores are separate from the general Scholar backup. Import fills empty entries and never replaces existing nonempty answers. Quota failures show an export instruction without clearing the text. Editing a reviewed answer clears its old self-awarded mark. Browser local storage is device-specific and not guaranteed cloud backup.

## Verification

- `node tests/gcse-exam-expansion-20261024.mjs`: schema, counts, unique tasks, correct board metadata, writing/dictation/read-aloud lengths, independent numerical calculations, Latin source correction and entry links.
- `node tests/gcse-exam-browser-20261024.mjs`: Chromium desktop plus WebKit tablet/phone, all 60 task renderings, responsive overflow, mark-scheme display, persistence, review invalidation, export/restore, invalid import, quota failure and unrelated-state isolation.
- Workflow: `.github/workflows/gcse-exam-expansion-qa.yml`.

Passing this focused suite does not certify the whole existing website or a physical iPad. Existing Daily/save/navigation issues require their own tests. Source guidance checked on 24 October 2026: AQA 8652 scheme of assessment; AQA 8461/8462/8463 specification and practical assessment; OCR J282 specification at a glance. The pupil's final 2029 exam-board/set-text choices remain subject to school confirmation.
