# Daily V2 — Real Bank Certification Workflow (no auto-upgrade)

## Input
Existing source JSON: `/content/topics/<topicId>.json`, each topic contains `subject,year,topicId,status,questions[]`.

An explicitly reviewed question-manifest entry is required for each question eligible for Daily V2. Source `difficulty`, `format`, `enabled` and `ordinary` are useful signals for REVIEW, not proof of pedagogical depth.

Example (for documentation ONLY, **not** approved live content):

```js
const certifications = {
  "real-question-id": {
    reviewed: true,
    reviewer: "curriculum-reviewer-id",
    reviewedAt: "2026-10-26",
    sourceFingerprint: fingerprintDailyV2Source(topic, sourceQuestion),
    roles: ["latin-standard"],
    skill: "translation"
  }
};
```

Roles allowed: `latin-vocab`, `french-vocab`, `latin-standard`, `french-standard`, `science-standard`, `mastery`, `retention-source`, `gcse`, `year9-progressive`.

Mastery requires `depthBand` (foundation/application/challenge) and a reviewed `masteryRubric:{reviewed:true,cognitiveDemand:"...",independentResponse:"..."}`. This means a 4/10/6 distribution must reflect genuine independent application and reasoning. **Do not classify a vocabulary MC as Challenge just to fill 20.**

Vocab requires `vocabConceptId` (stable lexical identity) and `lexicalUnitCertified:true`. Sentence or grammar transformations do not count as independent vocab concepts.

GCSE requires one exclusive `gcse` role, `gcseMarks` (1/2/3), exactly that many independent `gcseMarkScheme` points and `gcseOriginalityChecked:true`. The planner separately checks repeated original wording against all **loaded certified** questions; a comprehensive independent review must ALSO search noncertified source banks for duplicate originals.

Year 9 requires `depthBand` and teacher/school verified taught-topic evidence, converted using `certifiedTaughtTopicIds([...])`. A mere enabled Year 9 topic is NOT taught-topic proof.

## Certify against immutable source
After reviewing the **actual loaded** question and its mark scheme, calculate `fingerprintDailyV2Source(topic,sourceQuestion)` from the original topic/question JSON and include its unchanged result in each manifest entry. Fingerprint is a change detector, not an identity proof of a human reviewer. Re-review whenever an original answer, stimulus, options or wording changes. Stale/missing fingerprints block V2 eligibility.

## Normalization
```js
import {adaptCertifiedDailyV2Bank,certifiedTaughtTopicIds,fingerprintDailyV2Source} from "./src/bank-adapter.js";
import {planDailyV2} from "./src/planner.js";
const normalized=adaptCertifiedDailyV2Bank({topics,certifications});
const taughtTopicIds=certifiedTaughtTopicIds(taughtEvidence);
const plan=planDailyV2({day:"2026-10-26",questionBank:normalized.questionBank,
  priorAttempts:verifiedPriorAnswerEvents,taughtTopicIds});
```

If `normalized.errors.length>0`, stop and audit. If `plan.status==='blocked'`, do **not** save, publish or partially show a plan. Existing finished progress should stay preserved.

## Quality / test gaps
1. Scope loaded real banks and verify total certified supply before any real student test.
2. Prior correct filtering requires valid IDs and same-day concept evidence across all tasks.
3. Enforce mark schemes and meaningful feedback for science written answers, not just model text matching.
4. First audit Latin grammar/application and known passages; then French independent writing; then Biology multi-step reasoning.
5. The synthetic 30-day cross-day simulation passes; real certified-bank/student-history capacity simulation and actual backup schema review are still needed.
6. iPad Safari IndexedDB behavior cannot be inferred from isolated V8/IDB test double success.
