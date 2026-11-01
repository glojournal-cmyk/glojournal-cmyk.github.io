# Daily V2 — isolated browser QA page

**NOT THE STUDENT APP.** No curriculum grading, real user profile, XP, legacy data, production storage, or main-branch deployment. This QA view is intentionally disconnected from all original Scholar's Garden UI.

## Source
- \`staging/qa.html\`: independent interface, accessible controls and status messages.
- \`staging/qa.css\`: compact responsive interface (including iPad-style widths).
- \`staging/qa.js\`: DOM bindings, injected one-write failure, persisted readback, input controls.
- \`staging/qa-fixture.js\`: fully synthetic 163-question bank and seeded synthetic historical Retention.
- \`staging/qa-controller.js\`: controller calling genuine V2 planner, frozen plan, CAS readback and verified Home projector.
- \`tests/qa-controller.test.js\`: scenario persistence/marking/shortage regression tests.

## How to inspect staging from checked-out feature branch
From the **repository root** after checking out the feature branch:

\`\`\`bash
python3 -m http.server 8000
\`\`\`

Then use \`http://localhost:8000/daily-v2/staging/\` on a local browser. Do not open \`file://\` directly (module/CORS storage limitations). This is **not published** to the live website. To use another device, supply an intentionally isolated authorized test host or dev preview; do not expose private backup data or merge into main.

## Manual smoke test
1. Select **Complete 10 tasks** and create QA day. Check 0/163 and 0/10 with a READY QA badge.
2. Open French Vocab. Enter \`WRONG\` and save. Expect verified write but **0/30** credit; the same assigned question remains.
3. Enter \`QA_OK\` and save. Expect 1/30. Refresh view, reload tab, restart browser; expect 1/30 (same plan/question list).
4. Click **Fail next save once**; attempt another \`QA_OK\`. Expect explicit save-failed message; no optimistic credit. Click Save again for same answer, expect exactly one additional credit (2/30).
5. Open GCSE Exam Skills; record three questions with 1/1, 2/2, 2/3. Expect **3/3 marked** and **5/6 exam marks**. The page should then offer a retry of the original 3-mark question. Save **3/3** on that same question and verify **3/3 question credits still**, now **6/6 exam marks**. Reload again; neither total may regress and no fourth question credit may appear.
6. Select **One shortage: 9 tasks** scenario. Create separate QA day. Expect 0/163, 1 unavailable task (GCSE), 9 available tasks totaling 160. Full-day reward NEVER becomes eligible when this partial day completes.
7. Refresh view, navigate between tasks, reload; do not see unearned XP, phantom tasks or re-rolled daily assignments.
8. Click **Clear QA-only database** to remove only the chosen scenario's \`scholar-daily-v2-staging-ui-<scenario>\` database. No real app storage keys should be touched.
9. On actual iPad Safari, also test private browsing, low-storage/quota conditions, home-screen PWA reopening, interrupted writes, device restart and duplicated tabs. Browser/desktop QA cannot substitute for iPad hardware verification.

## Precautions and release blockers
- Do not treat \`QA_OK\` as a real educational mark. The page tests durable score mechanics, not French/Latin/GCSE marking.
- The whole page uses only fake IDs starting \`qa-\`; the 10 seeded historical practice records are likewise synthetic.
- This page is *not* a replacement for Home, Study or Recovery; it demonstrates the new shared backend in isolation.
- A staging-only \`partial\` plan is permitted only through explicit \`allowPartial:true\`. Missing task counts, explicit shortage labels and no full-day reward are mandatory.
- The IndexedDB adapter has fake-backed tests only. Real Safari validation is pending; quota/transaction interruption needs real browser evidence.
- The old user's emergency-backup binary could not be materialized for audit, and real student ID migration is not verified.
- Real Year 8/9 question banks are not yet independently depth-certified; 163 simulated items do not prove sufficient real questions.
- **Do not merge/deploy to main or modify student progress without explicit approval and complete QA.**
