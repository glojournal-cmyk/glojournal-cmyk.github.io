# Gloria backup Worker

## Current policy (2026-10-23)
- Encrypted **learning progress only**: browser auto upload is due after 3 days since the last successful upload, when the enrolled iPad next opens/foregrounds Gloria or comes online. It does not run when Safari is closed or iPad is off.
- Cloudflare R2 retention: keep the five newest, integrity-verified progress snapshots under `backups/YYYY-MM-DD/...` only. A new saved snapshot is verified in R2 before any cleanup; every snapshot selected for retention must also pass integrity checks. Invalid, incomplete or stale R2 state means **delete nothing**.
- The backup Worker never deletes `static-site/**`, `meta/**`, unknown legacy keys, any notes bucket or PDF notes. The independent `gloria-notes-library` R2 bucket has **permanent** retention.
- Auto encryption verifies local decryptability before upload; server validates ciphertext digest, size and immutable object in R2. A full restored app state still requires a separate owner recovery drill.
- The scheduled Worker cron checks Gmail once daily for a *new* accepted digest and retries deferred retention; it does **not** create a daily backup or email identical copies every day.
- The separate full-site R2 snapshot workflow is manual only; it is not part of this rolling five-progress-backups policy.

## Deploy
GitHub Actions deploys the existing Worker on validated `main` changes under `cloudflare-backup/**` or via manual dispatch. The exact existing Worker name and R2 binding are pinned in `wrangler.jsonc`. Deploy secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must already exist in repository secrets. Production Worker secrets `BACKUP_TOKEN_SHA256`, `GOOGLE_APPS_SCRIPT_URL`, and `GOOGLE_APPS_SCRIPT_HMAC_SECRET` are **not** copied into GitHub, logged or overwritten.

## Safety and acceptance
- Test with `node --test cloudflare-backup/tests/*.test.mjs` and `node --test tests/gloria-auto-backup-20261022.test.mjs`.
- Verify Worker deploy succeeds, then verify next real enrolled-iPad upload and read-only decrypt/recovery check before claiming end-to-end live backup success.
- Never clear iPad Safari storage or delete external PDF notes during rollout.
