# Gloria private encrypted cloud backup and automatic Gmail copy

STATUS: staging branch only. NOT DEPLOYED. NO EMAIL SENT OR IPAD PAIRED.

This approach requires **no purchased domain** and **no Resend account**.
The family already has Gmail. To receive automatic backup emails, the owner
must create a small Google Apps Script in their OWN Google account.
Encrypted cloud copies remain stored in private Cloudflare R2. The iPad
encrypts BEFORE uploading; neither Cloudflare nor Gmail has the decryption key.

## Account prerequisites (owner must complete, no secrets in GitHub/ChatGPT)

1. [Cloudflare signup](https://dash.cloudflare.com/sign-up) (free Workers plan).
   A Worker receives a free account-specific workers.dev subdomain, so
   purchasing a website domain is NOT required.
2. Cloudflare Dashboard -> Storage & databases -> R2 -> Overview -> activate R2.
   **R2 requires subscription/billing activation even when usage remains in
   the free tier.** Review the checkout and billing conditions; do not
   authorize unexpected fees. Create the PRIVATE Standard-class bucket
   gloria-private-encrypted-backups. Do not make it public.
3. Use the existing Google account associated with glo.journal@gmail.com.
   Visit https://script.google.com/ and create a standalone Apps Script
   project named Gloria Encrypted Backup Mailer. Copy
   cloud-backup/google-apps-script.gs into its editor.
4. In Apps Script Project Settings -> Script Properties, add
   GLORIA_BACKUP_HMAC_SECRET = a random high-entropy **shared secret** created
   on your own device. Never paste this secret into ChatGPT, GitHub or website.
   The same secret must also be configured as a Cloudflare Worker secret
   GOOGLE_APPS_SCRIPT_HMAC_SECRET (through the owner's dashboard/terminal).
5. Apps Script -> Deploy -> New deployment -> Web app.
   Execute as: Me. Who has access: Anyone (required for server-to-server
   Cloudflare Worker POST calls). Approve Google's requested send-only email
   permissions. This *does expose an endpoint to the internet*, but the
   HMAC-SHA256 secret plus a 5-minute timestamp validity window is mandatory
   before it can send a fixed-recipient encrypted attachment.
   Make sure the account receiving Gmail is yours.
6. Copy the Apps Script Web app URL ending in /exec into Cloudflare Worker
   secret GOOGLE_APPS_SCRIPT_URL, not into the public GitHub source.
7. Create a separate 32-byte random URL-safe device bearer token on your own
   device; put only its SHA256 *hex digest* into Cloudflare Worker secret
   BACKUP_TOKEN_SHA256, and enter the original private token using Gloria's
   parent setup screen. Keep it private.
8. Deploy the Worker from cloud-backup/wrangler.jsonc using Wrangler in
   the Cloudflare account that owns the R2 bucket (or equivalent dashboard
   deployment). The worker MUST be deployed behind HTTPS.
9. In Gloria Home -> Keep your progress -> Cloud backup, pair using the Worker
   HTTPS URL and bearer token. A 256-bit AES recovery key is generated.
   **Copy recovery key OFF this iPad** before enabling backup. Losing both
   the iPad and recovery key means cloud/email attachments cannot be read.
10. Complete the staging safety checklist: encrypted upload acknowledgment,
    Gmail with matching encrypted JSON attachment, backup decrypts with the
    recovery key on a second device, all XP/Daily/Mastery/Recovery/Pet data
    looks intact. Confirm this before approving production rollout.

## How it behaves

- GitHub Pages stays on the current domain; Vercel is not used.
- Automatic uploads occur at most once per UK calendar day while the learner uses Gloria and has network
  access; a fully closed/offline iPad PWA cannot upload in the background.
- Encrypted backup includes the primary Scholar Garden progress export, plus
  readable Practice drafts and the currently focused unfinished text when
  accessible. A previous local save failure cannot be reconstructed.
- Cloud copy only counts as saved after verified R2 write plus checksum ACK.
- Cloudflare daily cron (20:10 UTC) sends the **latest encrypted backup**
  to the Gmail Apps Script. No plaintext question data is transmitted
  to or from the email sender. Gmail attaches the encrypted JSON to
  glo.journal@gmail.com. A send API success is not guarantee of inbox receipt.
- Cloudflare Worker/Gmail bridge authentication uses HMAC-SHA256 over
  timestamp, SHA of ciphertext and exact base64 attachment.
  The Gmail bridge accepts timestamps within 5 minutes and sends to a
  FIXED account only. Script Properties tracks the last emailed digest
  and Worker R2 tracks the last acknowledged digest.
- If sending fails the R2 copy is retained and retried at the next scheduled
  run. There is a small risk of duplicate emails after an ambiguous timeout;
  the dedupe digest makes such events manageable.
- Automatic recovery never overwrites iPad local progress.
- No retention delete job is enabled; encrypted R2 backups accumulate until
  the owner approves a tested retention policy.
- The existing localStorage warning is NOT solved by cloud code alone.
  Use a separate emergency export before any reload if warning still appears.

## Testing

Run tests without live Google/Cloudflare credentials:

    node --test tests/gloria-cloud-email-backup.test.mjs
    node --test tests/gloria-google-apps-script.test.mjs
    node tests/gloria-cloud-ipad-browser.mjs

The iPad browser fixture needs Playwright Chromium and WebKit.

Known constraints: Cloudflare account+R2 subscription setup requires the
owner's action; a Google account authorization prompt must be handled only
by the owner. No tool in this chat has access to Cloudflare account admin
actions or can approve a Google Apps Script OAuth request on your behalf.
Pricing and account eligibility must be checked by the owner before billing.
