/**
 * stem-mixer.js
 * Real-time creative stem manipulation and blending layer for Juice Cinema
 *
 * Built on top of AudioEngine.
 * Supports:
 * - Dual-layer playback (Original + Processed)
 * - Sync mode as default
 * - Clear zero points (middle = original)
 * - Isolation mode (solo one stem over original)
 * - Default-muted stems for focused work
 * - Easy reset behavior
 * - Foundation for broader stems and future timing flexibility
 */

export class StemMixer {
  constructor(audioEngine, originalBuffer, processedBuffer = null) {
    this.audioEngine = audioEngine;
    this.originalBuffer = originalBuffer;
    this.processedBuffer = processedBuffer;

    this.ctx = null;
    this.originalSource = null;
    this.processedSource = null;
    this.originalGain = null;
    this.processedGain = null;
    this.masterGain = null;

    this.isPlaying = false;
    this.syncMode = !!processedBuffer; // Default to sync if processed buffer exists
    this.defaultMuted = true;          // Stems start muted by default

    // Stem state (broader set)
    this.stems = {
      drums: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      percussion: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      bass: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      piano: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      strings: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      guitar: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      woodwind: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      vox: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      harmonies: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      ambient: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      pads: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 },
      textures: { active: !this.defaultMuted, texture: 0, punch: 0, movement: 0, width: 0 }
    };

    this.currentMode = processedBuffer ? 'sync' : 'original';
  }

  // ============================================
  // Playback Control
  // ============================================

  play(mode = null) {
    if (mode) this.setMode(mode);

    if (this.isPlaying) this.stop();

    const ctx = this.audioEngine.getContext();
    this.ctx = ctx;

    try {
      // Original track
      this.originalSource = ctx.createBufferSource();
      this.originalSource.buffer = this.originalBuffer;

      this.originalGain = ctx.createGain();
      this.originalGain.gain.value = 0.8;

      // Processed track (if available)
      if (this.processedBuffer && (this.currentMode === 'sync' || this.currentMode === 'processed')) {
        this.processedSource = ctx.createBufferSource();
        this.processedSource.buffer = this.processedBuffer;

        this.processedGain = ctx.createGain();
        this.processedGain.gain.value = 0.8;
      }

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.95;

      // Routing
      this.originalSource.connect(this.originalGain);
      this.originalGain.connect(this.masterGain);

      if (this.processedSource) {
        this.processedSource.connect(this.processedGain);
        this.processedGain.connect(this.masterGain);
      }

      this.masterGain.connect(ctx.destination);

      const startTime = ctx.currentTime;
      this.originalSource.start(startTime);
      if (this.processedSource) {
        this.processedSource.start(startTime);
      }

      this.isPlaying = true;

      // Auto cleanup when sources end
      const cleanup = () => { this.isPlaying = false; };
      this.originalSource.onended = cleanup;
      if (this.processedSource) this.processedSource.onended = cleanup;

    } catch (err) {
      console.error('[StemMixer] Playback error:', err);
      this.stop();
    }
  }

  stop() {
    if (this.originalSource) {
      try { this.originalSource.stop(); } catch (e) {}
      this.originalSource = null;
    }
    if (this.processedSource) {
      try { this.processedSource.stop(); } catch (e) {}
      this.processedSource = null;
    }
    this.isPlaying = false;
  }

  setMode(mode) {
    const validModes = ['original', 'processed', 'sync'];
    if (!validModes.includes(mode)) return;

    this.currentMode = mode;
    this.syncMode = (mode === 'sync');

    if (this.isPlaying) {
      const wasPlaying = this.isPlaying;
      this.stop();
      if (wasPlaying) this.play();
    }
  }

  // ============================================
  // Volume & Blending
  // ============================================

  setOriginalVolume(value) {
    if (this.originalGain) {
      this.originalGain.gain.value = Math.max(0, Math.min(2, value));
    }
  }

  setProcessedVolume(value) {
    if (this.processedGain) {
      this.processedGain.gain.value = Math.max(0, Math.min(2, value));
    }
  }

  // ============================================
  // Stem Control
  // ============================================

  updateStemParameter(stemName, param, value) {
    if (!this.stems[stemName]) return;
    if (param in this.stems[stemName]) {
      // Clamp to reasonable range (-1 to 1 for most creative params)
      const clamped = Math.max(-1, Math.min(1, value));
      this.stems[stemName][param] = clamped;

      // Future: apply to actual audio graph
      // this._applyStemParameter(stemName, param, clamped);
    }
  }

  setStemActive(stemName, active) {
    if (this.stems[stemName]) {
      this.stems[stemName].active = active;
    }
  }

  soloStem(stemName) {
    Object.keys(this.stems).forEach(name => {
      this.stems[name].active = (name === stemName);
    });
    // Future: update audio graph to only process the soloed stem
  }

  unsoloAll() {
    Object.keys(this.stems).forEach(name => {
      this.stems[name].active = !this.defaultMuted;
    });
  }

  // ============================================
  // Reset
  // ============================================

  resetStem(stemName) {
    if (!this.stems[stemName]) return;

    const stem = this.stems[stemName];
    stem.texture = 0;
    stem.punch = 0;
    stem.movement = 0;
    stem.width = 0;

    // Future: reset actual audio parameters
  }

  resetAll() {
    Object.keys(this.stems).forEach(name => this.resetStem(name));
    this.setOriginalVolume(0.8);
    this.setProcessedVolume(0.8);
  }

  // ============================================
  // Gesture Triggers (Fills, Chops, Runs, Cuts)
  // ============================================

  triggerFill() {
    // Placeholder - will modulate relevant stems (drums, percussion, etc.)
    console.log('[StemMixer] Trigger: Fill');
  }

  triggerChop() {
    console.log('[StemMixer] Trigger: Chop');
  }

  triggerDynamicRun() {
    console.log('[StemMixer] Trigger: Dynamic Run');
  }

  triggerCut() {
    console.log('[StemMixer] Trigger: Cut');
  }

  // ============================================
  // State & Cleanup
  // ============================================

  getCurrentState() {
    return {
      mode: this.currentMode,
      stems: JSON.parse(JSON.stringify(this.stems)),
      originalVolume: this.originalGain?.gain.value ?? 0.8,
      processedVolume: this.processedGain?.gain.value ?? 0.8,
      syncMode: this.syncMode
    };
  }

  destroy() {
    this.stop();
    this.audioEngine = null;
    this.originalBuffer = null;
    this.processedBuffer = null;
    this.stems = null;
  }
}