# Gloria backup Worker
This is a source snapshot of the user-supplied Cloudflare Worker code for code review and controlled deployment.

## Safety
Deployment is **manual only** via GitHub Actions (workflow_dispatch), with a protected GitHub environment called `cloudflare-backup`. The workflow does not set or replace existing Cloudflare Worker secrets: BACKUP_TOKEN_SHA256, GOOGLE_APPS_SCRIPT_URL, GOOGLE_APPS_SCRIPT_HMAC_SECRET. It does not upload learners' data by itself. The R2 binding is `BACKUPS` pointed at `gloria-private-encrypted-backups`; cron is `10 20 * * *` UTC.

Add GitHub Actions environment secrets `CLOUDFLARE_API_TOKEN` (least-privilege Workers Scripts edit) and `CLOUDFLARE_ACCOUNT_ID`. Never commit credentials. Configure required reviewer protection if available; review Worker source and test staging before clicking Run workflow.

**Important:** the cron calls `sendDailyEmail` only. With no encrypted client uploads, the R2 bucket remains empty. Fix and verify client-side encrypted upload separately before relying on automatic backups. The email bridge must already be configured in Cloudflare.
