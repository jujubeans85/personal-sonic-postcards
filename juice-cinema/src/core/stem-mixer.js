/**
 * stem-mixer.js
 * Character Engine + future True Stem support for Juice Cinema
 *
 * Phase 1 Goal: Pro iPad-friendly standard
 * - Preserves and makes intentional the Character Engine behaviour
 *   (parallel full-mix processing + offset second playhead)
 * - Exposes explicit Sync / Drift / Free modes
 * - Clear zero points and easy reset
 * - Flexible foundation for adding real stem separation later
 * - Touch-friendly, performant design
 */

export class StemMixer {
  constructor(audioEngine, originalBuffer, processedBuffer = null) {
    this.audioEngine = audioEngine;
    this.originalBuffer = originalBuffer;
    this.processedBuffer = processedBuffer;

    this.ctx = null;
    this.sources = {};
    this.gains = {};
    this.masterGain = null;

    this.isPlaying = false;
    this.playheadMode = 'drift'; // 'sync' | 'drift' | 'free'  (Character Engine behaviour)
    this.driftAmount = 0.8;      // seconds of intentional offset in 'drift' mode

    this.defaultMuted = true;

    // Character parameters (honest naming - frequency/character regions)
    this.character = {
      texture: 0,
      movement: 0,
      width: 0,
      air: 0,
      intensity: 0.7
    };

    this.stems = this._createDefaultStems(); // placeholder for future True Stem Engine
  }

  _createDefaultStems() {
    // These are currently full-mix character paths, not true separated stems.
    // We keep the structure so we can evolve into real stems later.
    return {
      texture:   { active: !this.defaultMuted, value: 0 },
      movement:  { active: !this.defaultMuted, value: 0 },
      width:     { active: !this.defaultMuted, value: 0 },
      air:       { active: !this.defaultMuted, value: 0 }
    };
  }

  // ============================================
  // Playback with Character Engine support
  // ============================================

  play(mode = null) {
    if (mode) this.setPlayheadMode(mode);

    if (this.isPlaying) this.stop();

    const ctx = this.audioEngine.getContext();
    this.ctx = ctx;

    try {
      // Original
      const origSource = ctx.createBufferSource();
      origSource.buffer = this.originalBuffer;
      const origGain = ctx.createGain();
      origGain.gain.value = 0.85;

      this.sources.original = origSource;
      this.gains.original = origGain;

      // Processed / Character path
      let processedSource = null;
      let processedGain = null;

      if (this.processedBuffer) {
        processedSource = ctx.createBufferSource();
        processedSource.buffer = this.processedBuffer;
        processedGain = ctx.createGain();
        processedGain.gain.value = 0.85;

        this.sources.processed = processedSource;
        this.gains.processed = processedGain;
      }

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.92;

      // Routing
      origSource.connect(origGain);
      origGain.connect(this.masterGain);

      if (processedSource) {
        processedSource.connect(processedGain);
        processedGain.connect(this.masterGain);
      }

      this.masterGain.connect(ctx.destination);

      const startTime = ctx.currentTime;

      // === Character Engine: Intentional offset behaviour ===
      origSource.start(startTime);

      if (processedSource) {
        let processedStart = startTime;

        if (this.playheadMode === 'drift') {
          processedStart = startTime + this.driftAmount;
        } else if (this.playheadMode === 'free') {
          processedStart = startTime + (Math.random() * 1.5 + 0.3);
        }
        // 'sync' starts together

        processedSource.start(processedStart);
      }

      this.isPlaying = true;

      const self = this;
      const cleanup = () => { self.isPlaying = false; };
      origSource.onended = cleanup;
      if (processedSource) processedSource.onended = cleanup;

    } catch (err) {
      console.error('[StemMixer] Playback error:', err);
      this.stop();
    }
  }

  stop() {
    Object.values(this.sources).forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    this.sources = {};
    this.gains = {};
    this.isPlaying = false;
  }

  setPlayheadMode(mode) {
    const valid = ['sync', 'drift', 'free'];
    if (valid.includes(mode)) {
      this.playheadMode = mode;
    }
  }

  setDriftAmount(seconds) {
    this.driftAmount = Math.max(0, Math.min(3, seconds));
  }

  // ============================================
  // Character Parameters (honest naming)
  // ============================================

  updateCharacterParam(name, value) {
    if (name in this.character) {
      this.character[name] = Math.max(-1, Math.min(1, value));
      // Future: apply to audio graph nodes
    }
  }

  resetCharacter() {
    this.character = { texture: 0, movement: 0, width: 0, air: 0, intensity: 0.7 };
  }

  // ============================================
  // Future True Stem support (placeholder)
  // ============================================

  updateStemParameter(stemName, param, value) {
    if (this.stems[stemName]) {
      this.stems[stemName].value = Math.max(-1, Math.min(1, value));
    }
  }

  setStemActive(stemName, active) {
    if (this.stems[stemName]) this.stems[stemName].active = active;
  }

  soloStem(stemName) {
    Object.keys(this.stems).forEach(name => {
      this.stems[name].active = (name === stemName);
    });
  }

  resetAll() {
    this.resetCharacter();
    Object.keys(this.stems).forEach(name => {
      this.stems[name].value = 0;
      this.stems[name].active = !this.defaultMuted;
    });
  }

  // ============================================
  // State
  // ============================================

  getCurrentState() {
    return {
      playheadMode: this.playheadMode,
      driftAmount: this.driftAmount,
      character: { ...this.character },
      stems: JSON.parse(JSON.stringify(this.stems)),
      isPlaying: this.isPlaying
    };
  }

  destroy() {
    this.stop();
    this.audioEngine = null;
    this.originalBuffer = null;
    this.processedBuffer = null;
  }
}