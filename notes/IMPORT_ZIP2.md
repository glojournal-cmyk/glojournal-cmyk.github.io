# Zip2 image-notes import — 22 October 2026

User-supplied `Zip2.zip` contains **52 PDFs**, some PNG source images, and directories. After a PDF page-object and visual inspection:

- **25 revision Notes PDFs** retained, **116 pages**, 233,062,139 uncompressed PDF bytes.
- **25 test/practice/weakness PDFs excluded**.
- **2 older versions excluded:** `11_Aug_French_Complete_Notes.pdf` (keep `_Corrected`), and `17_Aug_Biology_Complete_Notes_ImageGenerated.pdf` (keep `_Corrected_ImageGenerated`).
- No original standalone PNGs are uploaded to Notes Library.
- **23/25** Notes matched existing catalogue titles (some stored with downloaded `(1)`/`(2)` suffixes); **2 new** Biology titles added.
- The full PDF collection was checked with PyMuPDF: no selectable-text layer, and each kept page has a single raster image covering at least 94% of the page.

## Upload the prepared R2 object exactly once

**File:** `gloria-summer-notes-zip2-20261022.zip`

**Bytes:** `233067053` (233.07 MB / 222.27 MiB)

**SHA-256:** `17ce551d7d9606d0dd000f1d5b755d6ddc1607b82aa59fac6f6cc37cefc60415`

This is a ZIP_STORED archive; **do not recompress, extract or rename**. Upload it to the root of R2 bucket `gloria-notes-library`, not to a folder. The existing public read-only Worker streams individual PDFs via R2 object byte-range requests, so the iPad downloads only the opened PDF (not the full 233 MB archive).

The worker checks that this exact filename with the expected byte length exists. Until upload actually succeeds, its 25 contents remain unavailable; the catalogue by itself does not mean files are uploaded. It also supports the separate Zip1 archive.

Original backup bucket and private study data stay untouched. No new billing plan or browser write endpoint is created.
