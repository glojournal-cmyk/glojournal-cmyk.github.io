# Year 8 locked Mastery: source-bank shortage guard (2026-11-01)

Status: DRAFT; no deployment or state migration.

## Correctness bug
Before this fix, when an assigned Daily question set was empty but already had some partial progress, the Practice component wrote target=progress, done=true and cappedBecauseQuestionBankExhausted=true to daily task and dailyLog. That could falsely turn incomplete Mastery/Practice into completion, without 85% or required independent answers.

This false-completion side effect is removed. The original pinned target, student attempts, existing correct IDs, unfinished sessions and recovery receipts stay unchanged. Previous already-capped historical records are not rewritten automatically.

When a locked Year 8 Standard/Quick/Mastery/long set has fewer available unused questions than the required remaining target, the UI displays the shortage and blocks opening the undersized quiz. No auto-excuse or automatic credit.

For locked Year 8 Mastery only, the fallback selector now avoids issuing two question IDs with the same conceptId, excludes other variants of a credited concept in the loaded bank, and can exclude explicitly reserved IDs. It searches beyond the initial ranked 20 candidates to find distinct alternatives. Other practice modes retain their existing selection policy.

## Release limits
A bank with fewer than 20 fresh distinct concept families cannot offer a 20-item independent Mastery session. It must show the shortage rather than fabricate completion. The current Daily planner does not yet implement fully atomic same-day global reservation, or automatic reassignment for pinned unfinished tasks. The code does not install the Biology draft PR #245 or Latin composite PR #248.

## QA
Run node --test tests/year8-capacity-guard-20261101.mjs. Tests cover 30 IDs/15 concepts, 48 IDs/24 concepts, exclusion of credited and reserved IDs, no repeated concepts, legacy Standard behaviour, exhausted-bank behaviour and absence of false-completion side effects.

Before merge: actual browser + iPad recovery replay, old Daily pinned sessions and correct-answer receipts, 20 items/17 correct and 3 independent correct evidence, Day 2/7 retention checks, 48-hour Recovery and XP/MP/Pet safeguarding.
