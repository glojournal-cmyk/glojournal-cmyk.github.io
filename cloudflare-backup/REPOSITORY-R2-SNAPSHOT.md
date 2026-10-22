# Complete tracked-materials snapshot to R2

This optional **manually dispatched** workflow archives the complete checked-in GitHub Pages repository (including all tracked app code, pictures, vocabulary banks, question banks and PDFs) into an immutable commit-specific `.tar.gz`. It publishes an SHA-256 checksum and uploads the archive and checksum into the **existing private** Cloudflare R2 bucket under `static-site/<commit>.tar.gz`.

It also uploads a temporary 30-day artifact to GitHub Actions as fallback.

Run **Gloria full repository R2 snapshot** from GitHub Actions on `main`; the job requires the existing Repository Secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. The API token additionally needs permission to write to this R2 bucket. A success requires every step including R2 writes to finish green. No new Cloudflare Worker deployment needed.

Scope limitation: Git archives only committed files, not files absent from the repository, Cloudflare R2 separately-uploaded PDFs, GitHub project files, or the daughter's iPad localStorage / IndexedDB. **Do not mistake this for a progress backup or a tested restore.**

Safety: no public-write endpoint, no credential in Pages code, no bucket deletion, no overwrite of learning data, no change to the Worker, and no recurring large R2 upload until one manual execution is proven.
