# Daily V2 — Signed grading and independent review protocol (STAGING)

**Zero real questions independently certified for Daily V2. No production signing key or authenticated grade authority exists in this repository. QA examples are not live approval.**

## Required separation of duties

1. Curriculum reviewer: independently verify question correctness, syllabus/year, taught-only Year 9, permitted answers, marks, difficulty and source provenance. Do not infer approval from metadata.
2. Scoring reviewer: test actual versioned marking logic against correct, wrong, partially correct, negative, alternative and adversarial answers; science working/method marks and subjective language replies need independent scrutiny or manual scoring.
3. Grade signer: hold the private signing key on a separately trusted and authenticated service, not in a static PWA or student-controlled bundle. Sign a fixed message binding learner scope, frozen plan, question source, actual response, result, scorer version, review and event.
4. Persistent authorisation: independently verify the receipt and atomically commit to a durable ledger, with replay detection and verified readback; only then may live progress/rewards be considered.

## Implemented staging test protocol, not a deployed service

The source module daily-v2/src/grade-receipt.js validates a strict versioned receipt and verifies externally signed ECDSA P-256 SHA-256 signatures using WebCrypto. It has NO signing/private-key function. A trusted external registry must provide a pinned public key and separately reviewed source/scorer manifest.

The signed fields are key ID, event ID, pseudonymous learner ledgerScope, day/task/question identity, source fingerprint, SHA-256 response and frozen plan digests, scorer ID/version, reviewer approval ID, marks and score timestamp. Signatures and review records cannot be inferred from student answers.

daily-v2/src/storage.js now offers commitSignedDailyV2AnswerForStaging exclusively for internally branded createMemoryDailyV2Repository test instances. It recomputes and checks the submitted score against the real source and its frozen assignment, checks the externally supplied reviewer manifest, pinned public key and signature, then performs an idempotent CAS write. A module-private token is needed to access the existing real-question source-bound write guard. It never updates live/student storage and returns stagingOnly=true, awardXP=false, awardMP=false and releaseGrade=false.

CI generates ephemeral QA key pairs and fabricated-for-tests review records only. These are *not* curriculum-approved real question certificates, trusted staff, learner identity verification, or secure production key provisioning.

**Limitations:** The existing FNV source fingerprint is a lightweight non-cryptographic change detector. SHA-256 is used for response and plan digests but it does not prove source provenance. Learner ledgerScope and public key pinning are injected by tests; in production they would have to originate from a separately authenticated system, not a student UI. Browser local data, even with signatures, is not proof of trusted user identity.

## Production release blockers

- Independently review every source question, grading rule, scorer version and role. None is currently approved.
- Resolve science method marks and French/Latin semantic marking; passing canonical answers on 191 objective questions is not proof of pedagogical acceptance or alternative-answer fairness.
- Design trusted signing key creation, rotation/revocation, authenticated learner binding, audit log and a real authoritative signing service. The static GitHub Pages app does not provide this.
- Implement separately authenticated, durable production storage and confirm offline, device restore, quota-error, cross-tab, 48-hour recovery and rollback behaviour on a real iPad.
- Prove 163 certified questions/day and safe 30-day real supply, investigate the 27 listed missing Year 9 sources, and get explicit cutover approval.

Never bypass the existing release gate because the sandbox passes crypto tests.
