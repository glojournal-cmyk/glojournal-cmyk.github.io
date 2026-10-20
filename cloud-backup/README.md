# Gloria encrypted automatic cloud and email backup — staging

**Status: implementation only, NOT DEPLOYED, NOT CONNECTED TO THE STUDENT'S iPad.**

The static GitHub Pages application remains unchanged. The separate Cloudflare
Worker receives AES-256-GCM ciphertext, stores immutable versions in private R2,
and checks for new data daily at 20:10 UTC. If a new cloud copy is available it
uses Resend to send the **encrypted JSON attachment** to
glo.journal@gmail.com. Cron uses UTC, not London local time.

## Security and prerequisite setup

- Owner needs a Cloudflare account and private R2 bucket named
  gloria-private-encrypted-backups.
- Owner needs a Resend account and a verified sender domain. Gmail is the
  recipient, NOT the verified sending domain. Mail API credentials must never
  be embedded in the public site.
- Set Cloudflare Worker secrets BACKUP_TOKEN_SHA256 (64-character hexadecimal
  SHA-256 of a privately generated 32-byte URL-safe upload token),
  RESEND_API_KEY and RESEND_FROM (verified sender address).
- BACKUP_TO is configured as glo.journal@gmail.com in wrangler.jsonc.
- Owner must generate the token on their OWN computer, save the actual token
  privately, then enter it in the iPad pairing UI. Do not paste it in ChatGPT.
- iPad generates an AES-256 recovery key and stores a non-extractable CryptoKey
  locally in IndexedDB. **Copy recovery key off iPad BEFORE trusting backup**.
  The Worker/email provider does not know the key and cannot recover a lost key.
- Keep R2 bucket PRIVATE: no public R2 URLs, public domain, or bucket listing.
- Cloud Saved can display only AFTER a server-verified encrypted backup.
  An email provider 'accepted' response is not proof of inbox delivery.

## Deploy setup (not yet executed)

1. Open Cloudflare account with permission to deploy Workers and R2.
2. Create a bucket named gloria-private-encrypted-backups using Wrangler or
   the Cloudflare Dashboard.
3. Use Wrangler with cloud-backup/wrangler.jsonc to deploy the Worker.
4. Privately generate a high-entropy bearer token (32 random bytes,
   base64url encoded), compute its SHA-256 hexadecimal digest, and set
   BACKUP_TOKEN_SHA256 to that digest as a Worker secret.
5. Configure RESEND_API_KEY and RESEND_FROM through Cloudflare Worker
   secrets; verify the sender domain with Resend first.
6. Enter the exact Worker HTTPS URL and raw bearer token using the iPad
   setup flow. Copy the recovery key to a separate safe place.
7. Test upload, encrypted email attachment and decrypt/restore preview
   **before** enabling automatic upload for the learner.

Never commit passwords, tokens, API keys, recovery keys, student answers or
backup JSON. Do not share them in this chat.

## What's included

- The existing in-app exportProgress method captures primary study progress,
  XP, daily tasks, reviews, Mastery, Recovery, Pet/outfit data.
- The client ALSO tries to include readable Practice drafts stored separately
  in the lux-practice-drafts-v1 localStorage entry.
- The currently focused answer field can be captured as an ungraded emergency
  note. A previously failed local draft write cannot be recreated.
- AES-GCM encryption happens BEFORE upload. Server stores only ciphertext.
- Stored R2 objects are immutable and never overwritten/deleted by this code.
- Existing iPad records are untouched. This system does not auto-restore or
  auto-replace older records over a newer device.
- A daily scheduled task attempts to email the most recently uploaded
  encrypted copy, with a provider idempotency key to reduce duplicates.
  A failed email keeps the cloud copy and is retried on the next run.

## Recovery

Authenticated GET /v1/backups lists stored encrypted objects. Authenticated
GET /v1/download?key=<exact-object-key> retrieves one encrypted envelope.
Use decryptBackup(envelope, recoveryKey) to produce a non-mutating preview.
Inspect XP, Daily, Mastery, Pet, Recovery and assessment data against the
current device BEFORE a future approved manual restore. No automatic restore
endpoint exists in this staging implementation.

## Retention and cost

No deletions have been implemented. Backup storage will accumulate until an
audited lifecycle policy is configured with the owner's approval. Planned
retention is 30 daily and 12 weekly snapshots, preserving at least one oldest
known-good copy before pruning. Email quota and R2 cost depend on account plan.
Large encrypted attachments may be subject to the email service limits.

## Important limitation

GitHub Pages cannot execute code while the PWA is fully closed/asleep/offline.
Automatic uploads occur while Gloria runs and has connectivity. Daily email
can send only the latest VERIFIED cloud backup. Do not interpret an email from
yesterday as proof today's answers are saved. Current iPad storage failure is
an independent bug; adding cloud backup does not repair the failure.

## QA

Run: node --test tests/gloria-cloud-email-backup.test.mjs

No production deploy until Cloudflare and mail accounts are securely connected,
a sample backup decrypts on a second device, and the owner sees a real email
containing an encrypted attachment in their inbox.
