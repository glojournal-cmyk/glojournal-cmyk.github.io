# Daily V3 real-app iPad QA — previously unapproved French question, fixed

**22 November 2026 | Draft PR #306 | isolated Chromium/WebKit emulation | not a physical iPad test**

## Confirmed failure on the original Draft
GitHub [Run #45060396310](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45060396310) failed in the real-app browser test. The Practice page rendered **`fr-y8-src-frv3-06-0331-perdre-il-elle-on`** for a locked `languages-standard` French Daily. Reopened `assets/daily-v3-approved-content-20261122.js`; the ID is **NOT** one of the five individually QA-approved French assignment IDs. The test correctly rejected it.

### Source-specific cause
The actual rendered route is `assets/study._subject.practise-y8fix-20260920.js`. Its `resolveDailyAssignment` previously matched a dated task via `assignedSubject` or a practice route `href`, but the `languages-standard` parent has **neither**. Its authorized Latin/French topics and five source IDs live instead in `languageSplit[subject]`; parent `href` points to the combined Languages Standard page.

With the parent task unresolved, the legacy practice selection used adaptive topic questions and fallback helpers, not the **precise** signed Daily V3 question ID map. The older CI workflow watched an obsolete Practice bundle filename, so this branch's actual Practice UI was not being rechecked on changes.

## Actual fix
1. `assets/study._subject.practise-y8fix-20260920.js` now recognizes Language Standard via the exact saved `languageSplit[subject]`. It calls a pure gate before rendering.
2. New `assets/daily-v3-pinned-practice-20261122.js` checks the dated assignment's subject, Year 8/9, exact topic and **five** Latin or French pinned question IDs, or **ten** Year 9 Standard B pinned IDs; it supplies precisely those source questions, never unrelated extras. The caller uses the correct **five-per-language** quota. Missing/duplicated items fail closed.
3. New `tests/daily-v3-pinned-practice-20261122.test.mjs` checks Latin, French, Year9 Standard B, the unapproved `perdre` example, date/topic spoofing, missing/duplicate IDs, and isolation of free practice/Recovery.
4. `.github/workflows/daily-v3-ipad-browser-20261122.yml` now watches the actual Practice JS and the new gate, and the main Daily V3 contract CI runs the new tests.

## Actual confirmation
- [Daily V3 contract and safety gates #45062576115](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45062576115): **completed SUCCESS** after the assignment resolution fix.
- [Daily V3 real-app iPad emulation #45062576256](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45062576256): **completed SUCCESS** with both Chromium iPad and WebKit iPad emulation. The Browser opened Latin, French and Year9 Standard B from the allowed ID list; each first question persisted on page reload; opening tasks did not change XP/MP, dated historical Daily or Recovery.
- WebKit emitted **two warnings** about loading `/assessment/french-school-1.json` due to access-control checks; this is not a verified clean assessment network run, though the three Daily tasks and assertions passed.

## Limitations and gates
Browser emulation is **not a physical iPad** test; no physical PWA install/offline restart, quota/IndexedDB failed-save or 10/10 full first-attempt grading was completed. All previously established **0/200 Maths academic approvals** and no Maths XP/MP release stand; no original Maths bank was modified. Existing Live main and student save histories are untouched; PR #306 remains Draft and must not be merged before separate Academic and Technical signoff.