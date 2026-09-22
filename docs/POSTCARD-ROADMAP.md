# Postcard direction — 22 September 2026

## Current fixes
Postal selection opens the Back and sets the compatible 150 × 105 mm layout. QR selection opens its face. Text errors leave a clearly labelled draft with postal guides and a valid QR, while exports remain blocked. Direct print includes the sides selected under Make. Postal stamp rectangle is a placeholder: no paid postage or fulfilment integration exists.

## Later: crew mode (requested; not essential now)
Friends and family must be able to use the same composer with ordinary fonts, without Adam's handwriting or personal URL index. Keep owner-specific configuration separate; do not ship personal handwriting assets or index UI in the crew entry point. No copied address book, profiles, history or personal saved links. User photos remain session-only until explicit save/export. Optional own handwriting can follow later.

## Public identity and hosting
Crate Juice remains the intended brand name. 'Creatures' came from a transcription accident; the user likes it as a possible direction and explicitly wants the current concept page left unchanged for now. /discover/ is a promotional concept page, separate from the maker navigation. It is not an authentication barrier. The existing maker and browser source remain public. A future private editor needs actual access control; browser-delivered rendering code cannot be kept secret from its users. Keep GitHub as source control regardless of hosting. No domain, business name, ABN, hosting plan or postage has been purchased or registered.

## Next physical workflow
Preserve originals, collection links and one project feeding preview/export. Prioritise verified print output before further styling. Keep postal/address/QR ink undecorated. Proof QR on chosen stock after printing and handling; retain readable destination fallback. Future fulfilment requires provider quotes, confirmed sizes and stock, user review of address/destination/cost and explicit paid order submission. No fake paid-postage barcode. CD sleeve template needs measured flat dimensions, fold/glue tabs, double-sided registration and printer dieline; do not infer scale from a photograph.

## Public contact routes (future)
Separate contact forms for optional promotional collaborations (accepted at Adam's discretion) and community projects/campaigns where these small systems could help. Neither is an ordering form or promise of free work. Configure an approved receiving address and spam protection before activating submissions; do not silently choose a destination. Front CJ mark awaits supplied artwork; reserve space through the clear margin instead of inventing the final mark.

## Explicit project saving
Save now indexes the full project on this device using IndexedDB and downloads a .juicecard backup. No autosave or cloud sync. Saved project data includes the original photo only after explicit Save. Shelf supports reopen and removal. Title limit 100 characters/two lines; message input limit 800 characters. Rendering fits text down to 8 pt and blocks overflowing output; usable capacity varies by glyph widths, line breaks, layout and QR size.

## Next review: print and postage integration
User requested this as the next integration to review, after testing the engine. Keep the current concept and engine untouched while preparing it.

- Print service handoff: take front/back files from the same composition project; show dimensions, stock, finish, quantity, trim/bleed, destination and an itemised quote before submission. Compare short-run uncoated/recycled options and home-A4 proof output. Start with a reliable file handoff; add an API adapter only where a provider actually supports it.
- Postage service handoff: establish the correct service for a postcard versus a CD sleeve using finished dimensions, thickness, weight and destination. Integrate legitimately purchased postage or the printer's mailing service; never generate decorative barcodes that imply postage is paid.
- Review screen: front/back proof, QR destination and scan check, delivery/return addresses, print cost, postage cost and total. Keep Save separate from paid Send; Save + Send may combine them only after the same review.
- State and recovery: retain provider/order reference and real status; prevent duplicate paid submissions, and make failed handoffs recoverable without paying twice. No 'sent' status until the provider confirms acceptance.
- Privacy: local photos remain session-only except explicit Save/export. Sending artwork and recipient details to a chosen provider is a separate, visible action.
- Open decisions: actual provider capabilities and quotes, physical print proof, approved postage route, and CD sleeve measurements. No provider account, payment or live integration has been set up.
