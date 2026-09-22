> Historical Batch 04 checks. Current image treatments, keyboard dictation and explicit link-index storage are documented in POSTCARD-REFINEMENT.md. Browser checks have been updated accordingly.

# Postcard audit — 22 September 2026

Starting branch: `feat/postcard-composition`, clean at `91bd9b817143769e0770c5664aa48d56dd9717dd`, matching draft PR #1. Read README, ARCHITECTURE and POSTCARD-COMPOSITION; no repository AGENTS.md was present.

## Focused changes

- Cancel browser speech on text-field focus/input across all targets, and again when an asynchronous project import commits. Late results cannot append to newly reopened text. The exact upstream speech helper is unchanged.
- Preserve explicit newlines with preset typography as well as captured handwriting. Reject back messages when the card/frame leaves insufficient vertical room instead of overlapping the signature area.
- Explain that browser and OS keyboard speech services may process speech remotely, separately from local photo handling.
- Resolve output-parent filesystem aliases in the existing media indexer. Its baseline Python test failed on macOS `/var` versus `/private/var`; a portable symlink regression now covers the fault.
- Add a reproducible ZIP builder and START_HERE.html with Safari launch instructions and device checklist.

## Automated evidence

- Node: **15 passed, 0 failed** (baseline 14 passed).
- Python: **3 passed, 0 failed** (baseline 1 passed, 1 errored on macOS path alias).
- Chromium / Playwright 1.62.1: existing suite passed, then expanded suite passed.
- Both authentic captures render; captured glyph rectangles stay within line boxes at preview/export scales. Unsupported characters surface an error and disable finished exports; preset selection restores rendering.
- Speech tests use a mock recogniser: explicit start, duplicate suppression, same-field edits, target focus changes, cancellation after delayed project loading, unsupported-browser guidance. These are not microphone tests.
- Actual PNG bytes equal an independently invoked shared renderer at 300 DPI using the saved project, decoded original photo and QR. Reopening restores the exact preview, text and font, and saved photo bytes equal the input file. PDFs parse as two A4 pages; custom bleed and A6 trim geometry pass.
- Fifteen treatments, undo, invalid replacement/import retention, QR URL validation, print view, narrow viewport, reload clearing and preserved gallery route checks pass. No external requests, storage writes or page errors observed in the instrumented maker/gallery run.
- All vendor checksums and all 47 preserved asset checksums pass. No vendored renderer, handwriting data, audio, recipient link or backend code changed.
- Exported handwriting PNG visually inspected for readable line placement and intact QR quiet zone. This is not a physical print proof.

The ZIP is verified after extraction using its SHA256SUMS.txt and the same Node, Python and browser suite against the extracted files on a separate loopback port. Local machine-specific evidence logs are delivered alongside the ZIP; hosted CI status is separate.

## Remaining acceptance gates

Real iPad Safari microphone permission/recognition, keyboard dictation, file sharing, Files download/reopen UX and performance require device testing. Physical size, stock, duplex alignment, label/printer behaviour and printed QR scans remain unverified. Desktop Chromium and mocks do not establish these results. PDF remains RGB raster artwork, not CMYK/PDF-X.

Unzip on a Mac/PC and serve the folder; open the LAN URL in iPad Safari. Files Quick Look is not proof of functioning JavaScript. LAN HTTP may lack speech/share APIs; test those on a trusted HTTPS origin when one is explicitly approved. No such origin was created. QR destinations using localhost/LAN work only where reachable, and do not publish artwork.

Merge and live publication remain pending explicit approval. Existing Netlify preview failures were reported on the starting PR; deployment repair is outside this patch.
