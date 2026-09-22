# Lettering and touch pass — 22 September 2026

User acceptance feedback: controls too fiddly on iPad, unreliable back preview, and heavy generic-looking solid lettering.

- Main controls have 58px minimum height, preview side buttons 64px, 34px slider thumbs and larger gaps. Native font selector remains large; finish choices use four direct buttons.
- Front/Back buttons replace the small side menu. Rendering is staged. A text/layout error no longer clears an already rendered face. The editor names an invalid other face, labels the retained preview and disables exports until corrected. Selecting Back while its text is invalid explicitly says which prior face is still shown. No stale preview is presented as export-ready.
- New projects start with Outline. Older saved projects without a lettering field retain Original. Four settings: Original, Outline, Inflated outline and Worn/aged. Real transparent hollows and deterministic missing ink are derived from either genuine handwriting capture or preset typography. Warm brown artistic ink; B&W mode remains available.
- Decorative effects use a canonical 300-DPI text mask shared by preview and exports. Inflated expands the mask edge; it does not replace the user's handwriting with an unrelated bubble font. No claimed printer ink-cost percentage. Addresses, stamp area and QR stay unaffected by decorative finishes.
- Mask cache is session memory and cleared on pagehide. Photos and card text are not persisted or uploaded.
- Uses the original train image from `jujubeans85/chlomim/studio/assets/IMG_0511.jpeg` (source git blob `a982869c9460b9121fb520c89d698798fa49382c`). It is copied into this consumer so it works without a cross-site request. Cans copper/glass palette and Marker Felt / Chalkboard SE font stack are centralized in brand.css; headings fall back to the platform cursive font when those Apple fonts are absent. Brighter background, unrotated controls. Interface background never enters print output.
- Bright copper postcard/J placeholder icon supplied as SVG and 180px Apple touch PNG. Existing installed Home Screen icons may need removing/re-adding to refresh their cached icon.
- `collections/maker/lettering-proof.html` is a live four-finish proof using the actual rendering code and Capture 03, with screen-only kraft paper.

Validation: Node mask tests verify hollow centres, deterministic wear, original preservation and project validation. Browser tests cover all four appearances, invariant QR, front/back switching, overflow recovery, large side controls, mobile layout and proof rendering. Existing original-asset checksums, project-byte roundtrip, PNG pixel parity, PDF geometry and metadata-only link persistence tests remain in place. Actual iPad touch feel and printed line/ink quality remain user acceptance checks.

Print-provider, paid-postage and measured CD sleeve work remain separate queued tasks; this pass does not claim to implement fulfilment.
