# Personal Sonic Postcards

**Structured repo for multiple user profiles** with auto-deploy ready via Netlify.

## Profiles
- `profiles/juice/celebration-penguin-postcard/index.html` — Partner app (Celebration by Kool & The Gang). Features: Juice's name in header, random witty penguin meme, **Cinematic Preset** button to transform **any track she chooses**, fully editable comprehensive stems, custom shareable penguin icon, NFC-ready with URL params.
- `profiles/tam/root-river/index.html` — Tam's wisdom app (nature-inspired deep wisdom, special boosts, submit own wisdom, calm read-aloud, NFC support).

## URV5 Workflow Instructions (Inside Both Web Apps + Evolves with Each Iteration)
**v1 (Current - Live in both apps)**:
- Tap the NFC card or open the link.
- Play stems or hit Cinematic Preset on any track.
- Laugh at the random witty penguin meme (or draw wisdom).
- Let the longer Vox, complex drum patterns, synth melody, ground noise harmony strings, and piano riffs change the emotional feel in real time.
- Reflect and share if it lands (with partner or at a meeting).

**This guidance evolves with each iteration**.
Future versions (v2+) will add:
- Shared real-time stem control between profiles (Juice + partner sync a cinematic mix).
- Saved cinematic presets per profile.
- Deeper reflection prompts tied to celebration, belonging, or recovery themes.
- Tap counters and NFC ritual tracking.

## Interactive Stems (More Comprehensive for Change in Feel)
All stems are real-time Web Audio layers with modulation. Sliders and toggles give **immediate, noticeable changes**:
- **Longer Vox**: Breathy, emotional, slow-moving layer (boost for soulful depth).
- **Complex Drum Patterns**: Rhythmic noise bursts + LFO-modulated pulses (adds groovy tension or rain-like texture).
- **Synth Melody**: Ethereal pads that can lead into melodic lines (cinematic sweep).
- **Ground Noise + Harmony Strings**: Low drone + swelling lush harmonics (wide atmospheric feel).
- **Piano Riffs**: Soft decaying notes with occasional runs (intimate sparkle or funky energy).

The **Cinematic Preset** applies a dramatic movie-like starting mix (high strings + vox for emotion, moderate drums for movement, piano for intimacy). Everything remains fully editable afterward.

## Multi-User Profiles
Simple switcher in both apps. Data (favorites, submissions, saved mixes) is isolated per profile using localStorage.
URL params: `?profile=juice&mode=cinematic` or `?profile=tam`.

## NFC Card Integration
Write URL like:
`https://bossjuice.netlify.app/?profile=juice&mode=cinematic`
+ Title record: "From Juice • Tap for Celebration"

## Auto Pushes = Iterate > Ready
- Work on feature branch.
- PR and merge to `main` when ready.
- Netlify auto-deploys on push to main.

Made with love for evolving journeys.