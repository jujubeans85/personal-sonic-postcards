/**
 * audio-engine.js
 * Central Web Audio API manager for Juice Cinema v3
 *
 * Now includes AnalyserNode support for real-time visualization.
 */

export class AudioEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.nfcTapHandlers = [];
    this.state = 'suspended';

    // Analysers for visualization
    this.analysers = {};
  }

  getContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this._setupMasterChain();
      this.isInitialized = true;
      this.state = this.context.state;

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
    this.masterGain.connect(this.context.destination);
  }

  async resumeIfNeeded() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        this.state = ctx.state;
        return true;
      } catch (err) {
        console.warn('[AudioEngine] Resume failed:', err);
        return false;
      }
    }
    return true;
  }

  // ==================== NFC Hooks ====================
  onNFCTap(handler) {
    if (typeof handler === 'function') this.nfcTapHandlers.push(handler);
  }

  handleNFCTap(nfcData = {}) {
    this.resumeIfNeeded();
    this.nfcTapHandlers.forEach(h => {
      try { h(nfcData); } catch(e) { console.error(e); }
    });
  }

  async triggerMagicTransform(options = {}) {
    await this.resumeIfNeeded();
    console.log('[AudioEngine] Magic transform triggered', options);
  }

  // ==================== Analyser Support ====================

  /**
   * Create and register an AnalyserNode.
   * Useful for waveform and spectrum visualization.
   */
  createAnalyser(name = 'default', fftSize = 2048) {
    const ctx = this.getContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    this.analysers[name] = analyser;
    return analyser;
  }

  getAnalyser(name = 'default') {
    return this.analysers[name] || null;
  }

  /**
   * Get current time-domain waveform data from an analyser.
   */
  getWaveformData(name = 'default') {
    const analyser = this.getAnalyser(name);
    if (!analyser) return null;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);
    return dataArray;
  }

  // ==================== Node Factories ====================

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

  getState() {
    return this.state;
  }

  destroy() {
    if (this.context) {
      this.context.close().catch(() => {});
      this.context = null;
      this.masterGain = null;
      this.analysers = {};
      this.isInitialized = false;
      this.nfcTapHandlers = [];
    }
  }
}