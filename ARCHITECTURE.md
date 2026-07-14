# Juice Cinema Architecture v2 (July 2026)

**Status**: Refactored direction after deep analysis

This document defines the long-term layered architecture for Juice Cinema, incorporating lessons from the initial V3 build.

---

## Core Philosophy

- **Preserve the magic first** — The current "accidental" offset/second-playhead behaviour has genuine creative value. It should be intentionally preserved and evolved as a **Character Engine** rather than cleaned up too early.
- **Hybridity over purity** — True stem separation and character-based processing can (and should) coexist.
- **Creator depth + Gift simplicity** — Deep, tactile control for the maker. Simple, magical one-tap experiences for recipients.
- **Flexible, pro iPad-friendly foundation** — All modules should be built to a high standard that works well on iPad while remaining easy to evolve.

---

## Four-Layer Architecture

### 1. Character Engine (Current Magic — Preserve & Evolve)

**Purpose**: The creative heart of the current system. Processes full-mix copies through parallel character paths with intentional timing offsets.

**Key Behaviours to Preserve**:
- Parallel full-mix processing paths (labelled as frequency/character regions rather than literal stems)
- Intentional second playhead / offset behaviour (Sync / Drift / Free modes)
- Random but reproducible room/character generation
- Macro + targeted controls that affect the whole character

**Future Naming**:
- Rename controls honestly (e.g. "Texture", "Movement", "Width", "Air" instead of claiming literal stem separation)
- Expose **Sync / Drift / Free** modes for the second playhead explicitly

**Status**: Currently exists in V3 (needs honest relabelling + intentional offset controls)

---

### 2. True Stem Engine (Future Layer)

**Purpose**: Actual source-separated stem processing (Vocals, Drums, Bass, Harmony/Instruments, Atmosphere/Other).

**Approach**:
- Built on top of the same AudioEngine infrastructure
- Can run alongside or instead of the Character Engine
- Allows precise per-stem manipulation when needed

**Status**: Not yet built. Planned for V4+

---

### 3. Performance Capture Engine

**Purpose**: Record exactly what the user hears and performs, including live slider moves, offsets, cuts, triggers, and gestures.

**Core Requirements**:
- Record master bus output in real time
- Capture all live parameter changes and timing
- Export WAV + small session JSON (for recall)
- Include output limiter + metering
- Support both creator performance capture and simple NFC gift recording

**Status**: Not yet built. High priority for V4

---

### 4. Gift / NFC Layer

**Purpose**: Simple, magical recipient experience.

**Principles**:
- One tap → emotional transformation
- Pre-curated or lightly customisable by creator
- Does **not** expose the full creator interface
- Can use either Character Engine or True Stem Engine under the hood

**Status**: Partially exists (NFC ritual logic). Needs clean integration with the above layers.

---

## Current Modular Foundation (Being Built)

- `src/core/audio-engine.js` — Central AudioContext + AnalyserNode management + NFC hooks
- `src/core/stem-mixer.js` — Real-time manipulation layer (initially focused on Character Engine behaviour)
- `src/ui/waveform-visualizer.js` — Live waveform + future spectrum support
- `src/nfc-manager.js` — Physical NFC + ritual logic

All modules are being brought to a **pro iPad-friendly standard** while remaining highly flexible for future evolution.

---

## Design Principles for All Modules

- **iPad-first performance & touch** — Smooth 60fps visuals, large touch targets, minimal jank
- **Flexible evolution** — Clear interfaces, minimal tight coupling, easy to extend or replace parts
- **Preserve creative signal** — Do not over-normalise interesting behaviour too early
- **Clear separation of concerns** — Audio infrastructure, creative processing, capture, and gifting layers stay distinct but composable
- **Offline / local-first** — Core functionality works without network (CDNs are acceptable for UI only)

---

## Immediate Next Steps

1. Update all current modules to pro iPad standard + fix known issues
2. Preserve and intentionally expose Character Engine behaviour (offset playhead, Sync/Drift modes)
3. Build V4 with:
   - True Stem Engine
   - Performance Capture Engine
   - Clean Gift / NFC Layer

---

*This architecture prioritises keeping the unique creative voice of Juice Cinema while building a solid, evolvable foundation.*