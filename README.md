# Personal Sonic Postcards

Structured repo for multiple users with different profiles.

## Structure
- `profiles/juice/celebration-penguin-postcard/` - Partner app (Celebration by Kool & The Gang, random witty penguin memes, interactive cinematic stems, URV5 workflow)
- `profiles/tam/root-river/` - Tam's wisdom app (nature-inspired deep wisdom, special boosts, submit own, read-aloud, URV5)
- `shared/` - Common components, URV5 instructions (evolves per iteration), stem audio engine

## Multi-User Profiles
Each app has a simple profile switcher (Juice / Partner / Tam / Custom). Data (favorites, submissions, stem presets) is saved per profile in localStorage.

## URV5 Workflow (Evolving)
**v1 (Current)**: 
- Draw / Listen / Play stems
- Reflect with the image/meme
- Share if it lands (at meeting or with partner)
- Use Cinematic Preset to transform any track

**Future iterations (v2+)**: Add shared real-time stem control between profiles, saved cinematic mixes, deeper reflection prompts tied to recovery/relationship themes, multi-device sync ideas.

## Interactive Stems (Comprehensive for Change in Feel)
Longer Vox (emotional breathy layer)
Complex Drum Patterns (rhythmic texture with LFO modulation)
Synth Melody (ethereal pads to leads)
Ground Noise + Harmony Strings (lush atmospheric swell)
Piano Riffs (melancholic or funky runs)

All layers are real-time editable with sliders/toggles. The Cinematic Preset applies a dramatic movie-like mix (boosted strings/vox for sweep, piano for emotion, subtle drums for tension). Change any parameter and hear the feel shift instantly.

## Auto Pushes & Iterate > Ready
- Push to `main` branch for auto-deploy (connect this repo to Netlify)
- Use feature branches + PRs for iteration
- Merge to main when ready for production

## Deployment
Each profile folder has its own `index.html` - deploy individually or use a root router.

Current live: https://bossjuice.netlify.app/ (partner app)

Made with love for Tam, partner, and evolving journeys.