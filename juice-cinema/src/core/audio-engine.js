/**
 * audio-engine.js
 * Central Web Audio API manager - Phase 1 pro iPad standard
 *
 * Improvements:
 * - Better support for multiple simultaneous playback contexts (Character Engine offset playheads)
 * - Enhanced AnalyserNode management
 * - iPad performance & resume handling
 * - Clean, flexible API for future layers
 */
export class AudioEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.analysers = {};
    this.isInitialized = false;
    this.nfcTapHandlers = [];
    this.state = 'suspended';
  }

  getContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this._setupMasterChain();
      this.isInitialized = true;
      this.state = this.context.state;

      this.context.onstatechange = () => { this.state = this.context.state; };
    }
    return this.context;
  }

  _setupMasterChain() {
    if (!this.context) return;
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.92;
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

  // Multiple analysers supported (useful for original + processed paths)
  createAnalyser(name = 'main', fftSize = 2048) {
    const ctx = this.getContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    this.analysers[name] = analyser;
    return analyser;
  }

  getAnalyser(name = 'main') {
    return this.analysers[name] || null;
  }

  getWaveformData(name = 'main') {
    const analyser = this.getAnalyser(name);
    if (!analyser) return null;
    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatTimeDomainData(data);
    return data;
  }

  // NFC hooks
  onNFCTap(handler) {
    if (typeof handler === 'function') this.nfcTapHandlers.push(handler);
  }

  handleNFCTap(nfcData = {}) {
    this.resumeIfNeeded();
    this.nfcTapHandlers.forEach(h => { try { h(nfcData); } catch(e){} });
  }

  async triggerMagicTransform(options = {}) {
    await this.resumeIfNeeded();
  }

  // Node factories
  createGainNode(gain = 1) { const n = this.getContext().createGain(); n.gain.value = gain; return n; }
  createBiquadFilter(type='lowpass', freq=1000, Q=1) { const n = this.getContext().createBiquadFilter(); n.type=type; n.frequency.value=freq; n.Q.value=Q; return n; }
  createDelayNode(delay=0.03) { const n = this.getContext().createDelay(); n.delayTime.value=delay; return n; }
  createConvolverNode(buffer) { const n = this.getContext().createConvolver(); if(buffer) n.buffer=buffer; return n; }
  createDynamicsCompressor(th=-24, ratio=4) { const n = this.getContext().createDynamicsCompressor(); n.threshold.value=th; n.ratio.value=ratio; return n; }
  createOscillator(type='sine', freq=5) { const n = this.getContext().createOscillator(); n.type=type; n.frequency.value=freq; return n; }

  getState() { return this.state; }

  destroy() {
    if (this.context) {
      this.context.close().catch(()=>{});
      this.context = null;
      this.masterGain = null;
      this.analysers = {};
      this.nfcTapHandlers = [];
    }
  }
}