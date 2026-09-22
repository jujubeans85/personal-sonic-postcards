# Postcard refinement — September 2026

## Contract

The same serializable composition project and renderer feed preview, PNG, sharing and PDF. Original gallery assets and routes are unchanged. Shared FONT_JUICE composition.js remains pinned byte-for-byte; postcard-specific image treatment and postal layout sit above it.

Photos, message, address and composition settings live in session memory. Only explicit project export embeds original photo bytes. No browser microphone is started; use iPad keyboard dictation in any text field, then edit the words and choose either captured handwriting font. OS dictation follows the device's own settings.

The separately saved link index uses one browser storage key, `juice-link-index-v1`, and an allowlisted JSON schema: profiles, URLs, titles, notes, categories and explicit per-profile send records. No postcard messages or photos are stored there. Save link / Mark sent / Remove / Import are the only persistence actions. Export and import JSON backups to keep records across devices or browser-data loss. This is on-device storage, not encrypted cloud sync. Backups contain personal link notes: keep them private. Preview/export never marks a link sent. Current records win when importing the same IDs. Unknown unassigned links default to Other; classification is explicit, not inferred by a remote model.

## Four treatment recipes

Original is a separate reset. The four choices are Deco, Urban, Floyd and Worn. Legacy style identifiers remain accepted in old projects but are no longer offered; use one of the four for the revised image treatments.

- Floyd: serpentine Floyd–Steinberg error diffusion, 0.30 mm dot pitch and 1.3 luminance contrast. At 100%, coarse black-and-white newsprint; strength blends from the untouched photo. No invented colour wash. This follows the recovered direction for Mimi/OBJ (harsh lo-fi B&W, thermal), but the exact approved image was not recovered and matching is not claimed.
- Urban: 1.85 luminance contrast, 12% retained chroma and deterministic grain. Strength blends photo to recipe.
- Deco: warm sepia, 1.22 contrast, with fine double framing clipped to the image.
- Worn: softened contrast, warm tones and deterministic grain.

Every recipe is local, deterministic and version controlled. A canonical 300-DPI image layer feeds both preview and export; Floyd dots retain their physical pitch. The slider responds to input events. Cached treatment layers and thumbnail invalidation avoid redrawing all thumbnails for every text/strength edit. Original bytes remain untouched.

To finalize the house style: supply one original and its approved Mimi/OBJ Floyd output, compare strengths 40/70/100 at actual print size, choose the winning tonal range/dot pitch, and repeat with one portrait and one dark/outdoor photo. Tune fixed constants in `shared/photo-treatments.mjs` and the Floyd grid in `shared/postcard-renderer.mjs`, then record a named revision with those reference proofs. Urban needs its own approved proof. Screen beauty alone is insufficient for thermal or recycled-paper output.

## Print and QR

New projects start with a 150 × 105 mm postal card, both sides, photo on front. Postal mode enforces landscape dimensions and recommended aspect ratio; other formats can disable it. The back reserves a stamp area, address block in standard type, optional return address, message area and 15 mm bottom/right clearance. Blank addresses produce light guide lines. QR is generated locally from HTTP(S) URLs and placed in the left message area above the bottom clear zone. A blank/invalid URL keeps the artwork visible but blocks export until corrected or QR is disabled.

Source: Australia Post Postcards fact sheet, August 2025, ordinary full-rate machine/hand-addressed layouts, accessed September 2026:
https://auspost.com.au/content/dam/auspost_corp/media/documents/postcards-fact-sheet.pdf

Postal stock guidance: 140–500 gsm, 0.18–1.5 mm, sufficient stiffness; 140 gsm alone does not establish suitability. Use white/light stock and correct postage. The template does not certify arbitrary stock or bulk-mail services.

All card background and fit padding stay transparent. Paper colour selection changes only the on-screen preview. PNG retains alpha; PDF leaves the paper unprinted. QR quiet zones also use the physical paper, so dark stock requires a light label/panel. Proof QR scanning and duplex alignment on the actual stock. NFC stickers can carry the same stable destination as the QR; no NFC writing integration is required.
