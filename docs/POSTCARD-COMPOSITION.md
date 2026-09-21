# Postcard composition: second consumer

## Source of truth

`shared/postcard-project.mjs` defines the versioned `juice-postcard/1` model. The maker's preview, PNG, share, and PDF paths all call `shared/postcard-renderer.mjs` with that same model. An image is decoded in memory and its original Blob is held separately; explicit `.juicecard` save embeds those original bytes plus the model. Reopening validates both before replacing current work. No autosave, upload, API, analytics, localStorage or IndexedDB is used by the maker. Page exit clears working references and canvas contents; reload starts empty. Explicit exports are files under the user's control.

## Shared renderer ownership

FONT_JUICE is canonical for `composition.js`, pinned at `ef4ef609794062e44ff4b403ef7da8f640a6ce7e` (merged PR #4). `shared/vendor/composition.js` is byte-identical, not an independently edited fork. `shared/vendor/manifest.json` records its SHA-256, upstream commit, and dependency integrity. The postcard adapter calls `JuiceComposition.drawBackground` for page paper and image placement. UI, crop preparation, effects, text, QR and output sizing belong to the consumer; FONT_JUICE's slot persistence is never invoked.

To update: obtain the intended FONT_JUICE commit, copy its exact `composition.js`, update the commit and SHA-256 in the manifest and matching pin assertion, review its contract, and rerun the suite. Do not edit the vendored module or import a moving cross-origin script. Runtime stays self-contained on the existing Pages origin.

## User flow

Open `collections/maker/` through the collection's maker link. Select a local photo, choose one of 15 recognisable-photo treatments and intensity, choose physical dimensions/front/back, crop/rotate/zoom/reposition, optionally add recipient/message/signature and an HTTP(S) QR destination, then export.

Preset labels are initial local colour/texture/frame/type treatments, not AI repaints or claims of exact artist/style reproduction. `Floyde`, `Dahli`, and `Picasso` are editable product directions expressed here as colour treatments. Original and Realistic intentionally retain natural photo colour. Blank text and blank cards are supported. GIF renders a still frame. HEIC is not silently accepted: convert to JPEG first. Input: 12 MiB, 24 MP decoded; project: 18 MiB; output: 13 MP. The decoded pixel cap cannot prevent the browser's transient allocation during decoding.

Undo covers settings, not photo replacement. Invalid image replacement or project import retains the prior usable work. Choosing Clear removes the in-memory image. Visual preview thumbnails use the same rendering path.

## QR and links

QR encoding is local using pinned qrcode-generator 1.4.4 with UTF-8 and medium error correction. Rendered codes retain four-module white quiet zones and solid black modules; the code is drawn after treatments. Export rejects a code that cannot fit the chosen dimensions at the minimum module size. A URL never uploads or hosts a local composition. “Use current collection link” retains the chosen existing vintage slug. Gallery catalogue/shareURL functions and all historical paths remain intact. The maker link is additive.

## Print boundaries

PNG exports the shown side at nominal 300-DPI pixel dimensions; use PDF for exact physical sizing. `pdf-lib` 1.17.1 is vendored with its licence. A4 PDF centres each selected side on its own sheet, with optional cut marks. Card PDF uses custom page size, configurable 0–5 mm bleed, and a trim box. The frame's paper colour extends into bleed; this is a framed-photo layout, not a full-bleed photograph. Label PDF uses chosen dimensions; driver/media matching is still required. Browser Print prints the shown side on A4; PDF is the route for paired or custom-page printing.

PDF is RGB raster artwork, not PDF/X or a managed CMYK proof. Printer-specific bleed, stock, ink behaviour, label dithering, duplex flips/alignment and final QR scanning require physical proof. Recycled stock option is a warm printed effect, explicitly labelled; it cannot simulate actual paper. B/W renders neutral photo pixels plus neutral frame, type and QR.

## Preservation and rollback

Baseline: `7110f9ede1e0b3eee0c42d697854422bdcdb8d5a`. All 47 Batch 03 copied assets retain their source SHA-256s. Original gallery photo preview, print links, eight audio/front/back pairs, catalogue semantics, Cinema/NFC, retained backend and legacy routes remain untouched apart from the additive maker link. No deployment/hosting change, backend activation, or legacy retirement is part of this PR. Revert this branch's merge commit normally; never reset or force-push main.

## Validation

- `npm test`: 14 checks across Batch 02, Batch 03, composition contract, vendor pins, URL/geometry validation and static privacy constraints.
- `python3 tests/test_library_index.py`: 2 checks.
- `npm run test:browser` against a local server on 8765: photo import, 15 presets, shared rendering, undo, front/back, QR, PNG/PDF, original-byte project round-trip, corrupt replacement/import retention, bad URL rejection, narrow viewport, reload clearing, preserved gallery routing. Storage writes are instrumented to fail and external requests recorded: none observed.
- Local Chromium browser pass used a packaged Chromium executable after the standard download failed. No JS page errors. Desktop/mobile screenshots visually inspected.
- Exported QR decoded independently with jsQR to the exact intended vintage URL. Exported PDF parsed independently: two A4 pages, each with an A6 trim box.
- CI workflow runs the node/Python/browser gates; its hosted run is separate evidence.
- Physical iPhone/iPad Safari share/print, actual printer/label output, commercial-service acceptance and Mac hardware remain unverified.
