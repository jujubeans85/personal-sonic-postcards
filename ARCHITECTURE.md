# Juice Cinema + NFC + Sonic Postcards Architecture

**Status**: Early modular foundation (July 2026)

This document defines the overall direction, the separation of concerns, and how the different systems work together cohesively while remaining distinct.

---

## Vision

The goal is to create a system where:

- **Deep creative audio manipulation** is possible for the maker.
- **Simple, magical experiences** can be delivered to others via physical NFC cards.
- The act of tapping an NFC card can transform music in a meaningful, emotional, and surprising way.
- The original source remains recognizable while gaining new life, texture, and feeling.

The system should feel tactile and explorable for the creator, while feeling magical and low-friction for the recipient.

---

## Core Engines / Layers

We are building **cohesive but separate engines**:

### 1. Audio Engine (`src/core/audio-engine.js`)

**Purpose**: Own and manage all Web Audio API concerns.

**Responsibilities**:
- Single shared `AudioContext` with proper lifecycle and iOS resume handling
- Clean node factories (Gain, Filter, Delay, Convolver, Compressor, Oscillator)
- NFC tap integration hooks (`onNFCTap`, `handleNFCTap`, `triggerMagicTransform`)
- Master chain management
- Foundation for all real-time and offline audio processing

**Scope**: Low-level audio infrastructure. Does **not** contain stem logic or UI.

---

### 2. Stem Mixer (`src/core/stem-mixer.js`)

**Purpose**: Real-time creative manipulation and blending of audio.

**Responsibilities**:
- Dual-layer playback (Original + Processed)
- Sync mode as default (with future flexibility for elastic timing)
- Per-stem controls (Texture, Punch, Movement, Width, etc.)
- Macro / global controls
- Isolation mode (solo one stem's manipulation over the original)
- Clear zero points (middle = original)
- Easy reset behavior
- Gesture triggers (fills, chops, runs, cuts)
- Optional preset / character system

**Scope**: Creative control layer. Sits on top of the Audio Engine.

---

### 3. NFC Manager (`src/nfc-manager.js`)

**Purpose**: Handle all physical NFC interactions and ritual/gifting logic.

**Responsibilities**:
- NFC scanning and writing to cards
- Profile-aware data isolation
- Ritual stamping and reflection logging
- Storing preset/character IDs on physical cards
- Tap counting and history

**Scope**: Physical interaction + gifting/ritual layer. Does **not** contain audio processing logic.

---

### 4. Gifting / Experience Layer (Future)

**Purpose**: The "magic" recipient experience.

This layer sits above the others and defines how an NFC tap translates into a meaningful audio transformation for someone who receives a card.

Key characteristics:
- Recipient experience should feel simple and magical (just tap)
- Can be pre-curated by the maker (limited taps, specific transformations)
- Should respect the original music while transforming its feeling
- Analytics / feedback loop on what transformations resonate

This layer is currently emerging through the integration of NFC + Audio Engine.

---

## How They Work Together (Coupling)

| From              | To                    | Coupling Type     | Description |
|-------------------|-----------------------|-------------------|-----------|
| NFC Manager       | Audio Engine          | Event-driven      | NFC tap calls `audioEngine.handleNFCTap()` which can trigger `resumeIfNeeded()` + `triggerMagicTransform()` |
| Audio Engine      | Stem Mixer            | Composition       | Stem Mixer is given an `AudioEngine` instance and uses it to create real-time graphs |
| Stem Mixer        | Audio Engine          | Uses              | Requests context, creates nodes via the engine's factories |
| NFC Manager       | Gifting Experience    | Data              | NFC cards can carry preset/character IDs that shape the transformation |
| All layers        | Profile State         | Shared state      | Per-profile isolation for presets, logs, and settings |

**Design goal**: Keep coupling **loose but intentional**. Each engine can be developed and tested somewhat independently while still enabling powerful combined experiences.

---

## Current Build Status (July 2026)

- `src/core/audio-engine.js` — Created (AudioContext management + NFC hooks)
- `src/core/stem-mixer.js` — In progress
- `src/nfc-manager.js` — Exists (needs alignment with new Audio Engine)
- Single-file `juice-cinema.html` — Stable personal-use V3 (daily driver)
- Modular `src/` structure — Being established

---

## Design Principles

- **Neutral baseline** — Start with the original track. Presets and transformations are optional.
- **Clear zero points** — Every control has an obvious "this is the original" position.
- **Explorable + Resettable** — Fast to tweak, fast to return to a known state.
- **Dual experience modes**:
  - Deep creator mode (full control, tactile feel)
  - Magical gift mode (simple tap, curated transformation)
- **Future flexibility** — Especially around timing/sync and new stem types.
- **Physical + Digital cohesion** — NFC cards act as portable, limited keys to specific sonic experiences.

---

## Future Direction

- Complete Stem Mixer with broader stems and isolation mode
- Align NFC Manager with Audio Engine hooks
- Develop clearer "Character / Preset" system that can be written to NFC cards
- Explore recipient-side experience flows (minimal UI, strong feeling)
- Add analytics/feedback on what transformations work well across different tracks and people

---

*This document will evolve as the system grows.*