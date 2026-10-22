# Gloria backup: agreed scope, access controls and verification

## Scope and policy
- Learning content (app code, GitHub-tracked images, topic/question banks and PDF notes) may be publicly shareable.
- Browser/device progress (XP, answers, mastery, achievements, outfits, pets, daily logs) must remain protected from unauthorized writes. Public-read permission does not imply public-write permission.
- Do not place Cloudflare admin API tokens, Worker bearer credentials, or recovery passphrases in public GitHub Pages JS.
- A scheduled server-only job can back up GitHub-tracked files independently of a browser; it CANNOT read offline iPad IndexedDB/localStorage. Browser progress uploading requires an authenticated client or a user-approved enrollment/login scheme.

## What currently works
1. GitHub retains versions of committed site files; a scheduled inventory workflow hashes every tracked file and provides a 30-day downloadable audit artifact.
2. Worker accepts authenticated encrypted snapshot uploads and has a daily trigger to email the newest **already uploaded** snapshot. This is NOT a full unattended end-to-end backup.
3. Optional /cloud-backup.html allows owner-supplied upload token + passphrase. Encryption happens client-side, with optional read-only cloud decrypt verification.

## Not yet achieved
- Unattended, zero-prompt device progress upload. Requires initial authenticated enrollment and an R2-scoped upload design; must avoid anonymous write endpoints and embedded secrets.
- True bulk backup of externally hosted/unuploaded notes PDFs. R2 content and GitHub content must be inventoried separately.
- Verified full restore of iPad records, nightly encrypted snapshot in R2, email receipt and periodic recovery drill.
- Automated R2 copy of static files. This inventory does not itself copy files to R2.

## End-to-end acceptance checklist
- Enroll the intended device securely *once* (a server-authorized flow), then verify automatic subsequent progress updates.
- Server signs/validates authorized upload and isolates writes by device/account; rate and size limit and retain immutable versions.
- Compare R2 stored ciphertext digest to successful receipt and download it back.
- Test decrypt and full restore on a separate test browser/profile, without writing over original iPad progress.
- Verify daily scheduled email receipt, and show actual last-successful-backup timestamp in app UI.
- Confirm all desired PDF files are actually uploaded and included in manifest.

No existing Safari data should be cleared during this rollout.
