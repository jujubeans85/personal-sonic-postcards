/**
 * waveform-visualizer.js
 * Modular, future-proof waveform visualization component for Juice Cinema.
 *
 * Current capabilities (v1):
 * - Canvas-based real-time waveform rendering
 * - Designed for dual/overlaid view (original + manipulated)
 * - Lightweight and GPU-conscious
 * - Clear extension points for spectrum analysis, isolation highlighting, and peak meters
 *
 * Philosophy:
 * - Keep visualization decoupled from audio logic
 * - Make it easy to show the "difference" between original and processed audio
 * - Leave room for more advanced analysis later without major rewrites
 */

export class WaveformVisualizer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Colors (cinematic dark theme)
    this.colors = {
      background: options.backgroundColor || '#111113',
      original: options.originalColor || '#d4af37',      // Gold for original
      processed: options.processedColor || '#f59e0b',    // Brighter amber for processed
      grid: 'rgba(255,255,255,0.06)',
      highlight: '#22c55e'                         // Green for isolation highlight
    };

    this.lineWidth = options.lineWidth || 1.5;
    this.showGrid = options.showGrid !== false;

    // Data buffers (will be fed from AudioEngine analysers)
    this.originalData = null;
    this.processedData = null;

    // State
    this.isolationMode = false;
    this.isolatedStem = null;
  }

  /**
   * Update the visualizer with new waveform data.
   * In a full implementation, this would come from AnalyserNode.getFloatTimeDomainData()
   */
  updateData(originalData, processedData = null) {
    this.originalData = originalData;
    this.processedData = processedData;
    this.draw();
  }

  /**
   * Set isolation mode (when a stem is soloed)
   */
  setIsolationMode(active, stemName = null) {
    this.isolationMode = active;
    this.isolatedStem = stemName;
    this.draw();
  }

  /**
   * Main draw loop
   */
  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, w, h);

    if (this.showGrid) {
      this._drawGrid(ctx, w, h);
    }

    // Draw original waveform
    if (this.originalData) {
      ctx.strokeStyle = this.colors.original;
      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();
      this._drawWaveform(ctx, this.originalData, w, h, 0.5);
      ctx.stroke();
    }

    // Draw processed waveform (overlaid or faded in isolation mode)
    if (this.processedData) {
      if (this.isolationMode) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'; // Faded processed
        ctx.lineWidth = this.lineWidth * 0.8;
      } else {
        ctx.strokeStyle = this.colors.processed;
        ctx.lineWidth = this.lineWidth;
      }

      ctx.beginPath();
      this._drawWaveform(ctx, this.processedData, w, h, 0.5);
      ctx.stroke();

      // Highlight in isolation mode
      if (this.isolationMode) {
        ctx.strokeStyle = this.colors.highlight;
        ctx.lineWidth = this.lineWidth * 1.2;
        ctx.beginPath();
        this._drawWaveform(ctx, this.processedData, w, h, 0.5);
        ctx.stroke();
      }
    }

    // Optional label when in isolation mode
    if (this.isolationMode && this.isolatedStem) {
      ctx.fillStyle = this.colors.highlight;
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(`Isolated: ${this.isolatedStem}`, 12, 20);
    }
  }

  _drawWaveform(ctx, data, width, height, yCenterRatio = 0.5) {
    const len = data.length;
    const step = width / len;
    const centerY = height * yCenterRatio;

    for (let i = 0; i < len; i++) {
      const x = i * step;
      const y = centerY + (data[i] * centerY * 0.9);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  }

  _drawGrid(ctx, width, height) {
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Subtle vertical lines
    const divisions = 8;
    for (let i = 1; i < divisions; i++) {
      const x = (width / divisions) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  /**
   * Resize canvas (call on window resize or container change)
   */
  resize(newWidth, newHeight) {
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.width = newWidth;
    this.height = newHeight;
    this.draw();
  }

  /**
   * Clear the visualizer
   */
  clear() {
    this.originalData = null;
    this.processedData = null;
    this.isolationMode = false;
    this.isolatedStem = null;

    const ctx = this.ctx;
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}