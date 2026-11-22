# Daily Tasks V3 / Maths V3.1.1 — failed-CI triage and corrections
**Date:** 22 November 2026  
**Scope:** Draft PR #306 only; current branch `feature/daily-tasks-v3-20261122`  
**Disposition:** **CI RE-RUN PENDING, NOT A RELEASE APPROVAL.** No Live App, XP/MP, or saved student records changed.

## Source CI evidence, not guesses
At branch commit `d5cfb930c77afa9e1d2e6f109a65ae49df4c7437`, GitHub Actions finished 30 workflows, **25 successful and 5 failed**:
| Failed run | Direct log evidence | Finding | Draft correction |
|---|---|---|---|
| [Daily Tasks V3 contract and safety gates](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45028658783) | 67 pass / 1 fail: `actual Scholar recordAttempt wrapper ...` says `recoveryFor` token missing from a **1,700-character truncated** excerpt | Assertion sampled part of `const evidenceEntry={...}`; actual field is just beyond old truncation, present in complete record | Expand inspection to the bounded complete `evidenceEntry` ending at the independent persistence comment. Keep all flag assertions. |
| [Daily vocabulary complete-bank QA](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45028658759) | `latin exactly 3 Year 9 words: actual 0, expected 3` after 23 Nov | Old 27+3 test applied to future V3 dates; V3 deliberately **blocks unapproved Y9 words**, backfills 30 Y7–8 | Test correct date-dependent policy: **before 2026-11-23 = 27+3**; new date with zero individually approved Y9 words = **30 Y7–8 + 0 Y9**. Preserve lexical uniqueness/rotation checks. No faked Y9 QA. |
| [Progress and 48-hour recovery safety](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45028658853) | 67 pass / 1 fail; version test hardcoded `home-extras-restorer` cache stamp `20261026...`, while actual current HTML uses `20261115-school-assess2-nav1&history=20261030-ten-core3` | Stale fixed cache stamp, not evidence Recovery lost credit. Actual shell/restorer/continue imports share the later version | Assert actual common nonempty version across **HTML → restorer → continue → RPG**, preserve Recovery module/HTML-404 identity checks, no silent whitelist. |
| [Recovery dates and compact backup QA](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45028658938) | `route-shell-qa` falsely requires main Scholar module in isolated `study/languages/standard/index.html`, `study/maths/daily/index.html` and `notes/year9-latin-key-revision-20261120/index.html` | These routes deliberately **must not load full learner store**; only actual assets/standalone entrypoints should be checked | Register these exact paths in standalone-shell QA, retaining missing-local-asset checks. |
| [Whole site QA](https://github.com/glojournal-cmyk/glojournal-cmyk.github.io/actions/runs/45028658847) | `route-shell-qa` as above; `overall-app-qa` same isolated-page false positives + Latin notes lacks `viewport-fit=cover`; `daily-plan-rigor-qa` expects old `bumpDaily` expression | New runtime intentionally excludes composite `languages-standard` and Y9 scoped `y8-standard-b`/`due-review` from generic daily reward; older test did not | Add same standalone exceptions in whole-site QA; add missing notes mobile viewport; update test to explicitly assert **stronger composite/Y9 no-double-credit guard**, not the permissive former expression. |

## Source-backed spot checks performed after changes
- Bootstrap import cache strings from `index.html`, `assets/home-extras-restorer-20261023.js`, and `assets/home-continue-20261010.js`: **three exact matching stamps** `20261115-school-assess2-nav1&history=20261030-ten-core3`. Root HTML and 404 HTML remain identical.
- Parsed entire `const evidenceEntry={...}` region from `assets/index-BLVOhKhN.js`; required `selectedOptionId`, `assisted`, `hintUsed`, `scaffolded`, `recoveryFor` all present.
- Confirmed actual `assets/quiz-session-rWAnuDVj.js` contains the **source guard** preventing generic bump for `languages-standard`, Year9 scoped Standard B and Due Review, as required by revised `daily-plan-rigor-qa`.
- Confirmed both static route-audit files classify **only those three** new standalone pages properly, with an actual iPad viewport on the Latin notes page.

## Protect existing learning
These corrections **do not**:
- Revert the 23 November V3 academic whitelist, manufacture Year9 taught-word approval, or award question credit merely on answer-key maths PASS.
- Load a second Scholar store into independent notes/Maths preview/Language launcher.
- Change original 200 Maths question keys, grant any live Maths credit, alter XP/MP/Mastery/Recovery, or modify `main`.
- Prove the real physical iPad can save/load on storage failure. Device, graded Maths player and 1,000 distractor-by-distractor academic signoff remain outstanding.

**Further release gates:** Wait for *the new SHA's* Actions to complete and inspect any further failures; reconcile current `main` changes (Food Tests keys, index marking) before merge; verify physical iPad PWA. Do not infer 'CI PASS' from this documentation or from the previous commit's 25 successful workflows. Vercel `build-rate-limit` is an external deployment/account capacity issue, not automatically cured by these code/test corrections.

**Current release decision:** Draft/blocked; **0/200 Maths academic signoffs**.
