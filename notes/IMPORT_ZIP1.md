# Gloria Notes Library — Zip1 image-based notes

The 25 qualifying documents in the user-supplied `Zip1.zip` were individually inspected:
- every PDF page is covered by a full-page image;
- original PDF byte lengths and ZIP contents were checked;
- tests, exams, answer sheets and five standalone PNGs were excluded;
- 19 of the 25 notes already had a catalogue entry; six additional Summer notes have been indexed.

**Status:** these PDF files are not uploaded to R2 just because their entries are in the catalogue. The Notes Worker deliberately hides missing objects. One existing French Future Tense PDF is already independently present in R2.

## Cloudflare dashboard — single-upload import (no API token)

1. Download the exact **`gloria-summer-notes-zip1-20261022.zip`** file created for this batch. It is a **ZIP_STORED** archive of 172,856,064 bytes (164.85 MiB). Do **not** use the smaller compressed/DEFLATED notes-only ZIP for this method.
2. Open the existing Cloudflare R2 bucket **`gloria-notes-library`**.
3. At the **root** of the bucket (not inside a folder), choose **Upload** and select the file. Keep its name **exactly** `gloria-summer-notes-zip1-20261022.zip`. Do not extract it.
4. Once the upload finishes, visit the existing **/notes/** page. Its Cloudflare read-only Worker checks the archive size, then exposes each of the 25 PDFs independently via R2 byte ranges.

Important: the ZIP is *one* R2 object. It is not extracted inside Cloudflare; the Worker streams individual PDF parts without loading the full ZIP to the iPad. Original encrypted backup bucket is never bound to this service. Uploading the archive again under the same name is unnecessary; it would overwrite that public Notes object.

ZIP SHA-256: `75c86cb750061cd943cc31463a8a8e991c96223d2e8fa2954e51264ba66690f3`.

GitHub Actions must not report 25 PDFs as uploaded until the actual archive object exists. The live /catalog lists available files only.