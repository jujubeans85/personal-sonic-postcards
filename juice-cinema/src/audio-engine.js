/**
 * audio-engine.js
 * Central Web Audio API manager for Juice Cinema v3
 *
 * Responsibilities:
 * - Single shared AudioContext with proper lifecycle management
 * - iOS / Safari resume handling
 * - Clean node factories
 * - NFC tap integration hooks (for magical tap experience)
 * - Foundation for reactive / character-driven transformations
 *
 * Designed to support both deep creator manipulation and simple magical NFC gift flows.
 */

export class AudioEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.nfcTapHandlers = [];
    this.state = 'suspended';
  }

  /**
   * Get (or lazily create) the AudioContext.
   * Automatically handles the initial creation.
   */
  getContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this._setupMasterChain();
      this.isInitialized = true;
      this.state = this.context.state;

      // Listen for context state changes (useful for debugging + future UI)
      this.context.onstatechange = () => {
        this.state = this.context.state;
      };
    }
    return this.context;
  }

  _setupMasterChain() {
    if (!this.context) return;

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.95;

    // Future: add limiter, EQ, or master effects here
    this.masterGain.connect(this.context.destination);
  }

  /**
   * Resume the AudioContext if it is suspended.
   * Critical for iOS / Safari where audio is blocked until user gesture.
   */
  async resumeIfNeeded() {
    const ctx = this.getContext();

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        this.state = ctx.state;
        return true;
      } catch (err) {
        console.warn('[AudioEngine] Failed to resume context:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Register a handler to be called when an NFC tap occurs.
   * This allows the audio system to react to physical NFC interactions
   * (e.g. apply a curated transformation, resume audio, load a character).
   */
  onNFCTap(handler) {
    if (typeof handler === 'function') {
      this.nfcTapHandlers.push(handler);
    }
  }

  /**
   * Called when an NFC tap is detected (usually from NFCManager).
   * Triggers all registered handlers and can perform audio-specific reactions.
   */
  handleNFCTap(nfcData = {}) {
    // Resume audio context immediately on tap (important for magic feel)
    this.resumeIfNeeded();

    // Notify all registered handlers
    this.nfcTapHandlers.forEach(handler => {
      try {
        handler(nfcData);
      } catch (err) {
        console.error('[AudioEngine] NFC tap handler error:', err);
      }
    });

    // Future: could trigger default behaviors here
    // e.g. this.triggerMagicTransform(nfcData);
  }

  /**
   * High-level method to trigger a "magical" transformation.
   * Intended for NFC gift flows where a tap should feel special and reactive.
   * This is a placeholder for now — will be expanded with StemMixer integration.
   */
  async triggerMagicTransform(options = {}) {
    await this.resumeIfNeeded();

    // Placeholder for future rich reactive behavior
    // e.g. load a curated character, start reactive modulation, etc.
    console.log('[AudioEngine] Magic transform triggered with options:', options);

    // Example future behavior:
    // if (options.preset) this.applyCharacterPreset(options.preset);
  }

  // ============================================
  // Node Factory Methods (clean creation + defaults)
  // ============================================

  createGainNode(gain = 1) {
    const node = this.getContext().createGain();
    node.gain.value = gain;
    return node;
  }

  createBiquadFilter(type = 'lowpass', frequency = 1000, Q = 1) {
    const node = this.getContext().createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = Q;
    return node;
  }

  createDelayNode(delayTime = 0.03) {
    const node = this.getContext().createDelay();
    node.delayTime.value = delayTime;
    return node;
  }

  createConvolverNode(buffer) {
    const node = this.getContext().createConvolver();
    if (buffer) node.buffer = buffer;
    return node;
  }

  createDynamicsCompressor(threshold = -24, ratio = 4) {
    const node = this.getContext().createDynamicsCompressor();
    node.threshold.value = threshold;
    node.ratio.value = ratio;
    return node;
  }

  createOscillator(type = 'sine', frequency = 5) {
    const node = this.getContext().createOscillator();
    node.type = type;
    node.frequency.value = frequency;
    return node;
  }

  /**
   * Get current AudioContext state ("running", "suspended", etc.)
   */
  getState() {
    return this.state;
  }

  /**
   * Clean up resources.
   * Call when the engine is no longer needed.
   */
  destroy() {
    if (this.context) {
      this.context.close().catch(() => {});
      this.context = null;
      this.masterGain = null;
      this.isInitialized = false;
      this.nfcTapHandlers = [];
    }
  }
}