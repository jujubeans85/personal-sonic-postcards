# Juice Cinema Architecture v3 (July 2026)

**Status**: Updated with M4 Mini + iOS split strategy and clearer terminology

---

## Core Philosophy

- **Preserve the magic first** — The current offset/second-playhead behaviour is creatively valuable. It should be treated as a deliberate **Character Engine** feature rather than accidental behaviour.
- **Hybridity over purity** — Character Engine and True Stem Engine can coexist.
- **Creator power vs Recipient simplicity** — Heavy, high-quality work happens on powerful machines (M4 Mini / Mac Studio). Gift recipients get a lightweight, magical experience on iOS/iPadOS.
- **Flexible, future-proof modules** — All code should be easy to evolve without major rewrites.

---

## Terminology Clarification

| Old / Misleading Term     | Better Term                  | Description |
|---------------------------|------------------------------|-----------|
| Stem controls / Stem Mixer | Character Engine            | Parallel full-mix processing with intentional timing offsets |
| Future real stem work      | True Stem Engine            | Actual source-separated audio streams (Vocals, Drums, Bass, etc.) |

---

## Four-Layer Architecture + Hardware Split

### 1. Character Engine (Preserve & Evolve)

**Purpose**: The current creative magic. Processes full-mix copies through parallel character paths with intentional timing offsets.

**Key Features**:
- Parallel full-mix processing
- Intentional second playhead (Sync / Drift / Free modes)
- Macro + targeted character controls
- Reproducible random room/character generation

**Hardware**:
- Creator work can happen on M4 Mini for faster iteration and higher quality
- Gift recipients experience a lightweight version on iOS

**Status**: Exists in V3. Needs honest relabelling and explicit playhead mode controls.

---

### 2. True Stem Engine (Future Layer)

**Purpose**: Real source-separated stem processing for when precision is needed.

**Approach**:
- Built on the same AudioEngine foundation
- Can run alongside or instead of the Character Engine
- Best created on M4 Mini (more RAM/CPU for AI-assisted separation if used)
- Delivered results must still run well on iOS

**Status**: Not yet built. Planned for V4+.

---

### 3. Performance Capture Engine

**Purpose**: Record exactly what the user performs and hears (including live gestures and timing).

**Requirements**:
- Real-time master bus recording
- Capture of live parameter changes and playhead offsets
- Export WAV + session JSON
- Include limiter and metering

**Hardware Note**: Heavy capture can be done on M4 Mini. Playback must work on iOS.

**Status**: High priority for V4.

---

### 4. Gift / NFC Receiver Layer (iOS Optimised)

**Purpose**: Simple, magical experience for card recipients.

**Principles**:
- One tap → emotional transformation
- Lightweight and fast on iOS/iPadOS
- Minimal real-time processing on device
- Pre-rendered or lightly processed audio preferred
- Does **not** expose full creator controls

**Hardware Strategy**:
- Creator prepares rich experiences on M4 Mini
- Recipients get a curated, low-friction version on iOS

**Status**: Partially exists. Needs clean integration with the other layers.

---

## Hardware Split Strategy (M4 Mini + iOS)

| Layer                        | Primary Development Machine | Recipient Device | Notes |
|-----------------------------|-----------------------------|------------------|-------|
| Character Engine            | M4 Mini (recommended)       | iOS (light)      | Creator gets full power; recipients get smooth experience |
| True Stem Engine            | M4 Mini                     | iOS (light)      | Heavy separation/generation on Mac; results optimised for iOS |
| Performance Capture         | M4 Mini                     | iOS              | Capture rich performances on Mac; playback on iOS |
| Gift / NFC Layer            | M4 Mini (preparation)       | iOS (primary)    | Keep recipient experience simple and magical |

**Goal**: Give creators serious power during making, while ensuring recipients have a delightful, reliable experience on their devices.

---

## Current Modular Foundation

- `src/core/audio-engine.js` — Phase 1 complete (pro iPad standard)
- `src/core/stem-mixer.js` — Phase 1 complete (Character Engine foundation + explicit playhead modes)
- `src/ui/waveform-visualizer.js` — Phase 1 complete
- `src/nfc-manager.js` — Needs alignment with new model

All modules follow pro iPad-friendly standards while remaining highly flexible.

---

## Immediate Roadmap

**Phase 2 (Next)**
- Build working V4 with:
  - True Stem Engine (MVP)
  - Performance Capture Engine
  - Refined Gift / NFC Layer

**Phase 3**
- Expert M4 Mini + iOS split implementation
- Full testing, optimisation, and verification on both platforms

---

*This architecture balances creative power, recipient experience, and long-term flexibility.*