// Shared browser transport. NFC tags carry data; they are not authentication.
(function (root) {
  'use strict';
  function read({ confirmSimulation = () => false, acceptPreset = () => true, timeoutMs = 30000 } = {}) {
    if (typeof root.NDEFReader !== 'function') {
      if (!confirmSimulation()) return Promise.reject(new Error('NFC unavailable; simulation cancelled.'));
      const serialNumber = 'SIM-' + Date.now().toString(36);
      return Promise.resolve({ serialNumber, shortSerial: 'SIM', presetFromCard: null, simulated: true, timestamp: Date.now() });
    }
    return new Promise((resolve, reject) => {
      const reader = new root.NDEFReader();
      const controller = new AbortController();
      let settled = false;
      const timer = setTimeout(() => finish(new Error('NFC scan timed out. Try again.')), timeoutMs);
      function finish(error, result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reader.onreading = null;
        reader.onreadingerror = null;
        controller.abort();
        if (error) reject(error); else resolve(result);
      }
      reader.onreadingerror = () => finish(new Error('Could not read NFC card. Try again.'));
      reader.onreading = event => {
        let presetFromCard = null;
        for (const record of event.message?.records || []) {
          if (record.recordType !== 'text') continue;
          try {
            const text = new TextDecoder(record.encoding || 'utf-8').decode(record.data);
            if (text.startsWith('JUICE-ROOM:')) {
              const preset = text.slice('JUICE-ROOM:'.length);
              if (preset && acceptPreset(preset)) presetFromCard = preset;
            }
          } catch (_) { /* Ignore malformed records; the remaining records may be valid. */ }
        }
        const serialNumber = event.serialNumber || 'UNKNOWN';
        finish(null, { serialNumber, shortSerial: serialNumber.slice(0, 8), presetFromCard, simulated: false, timestamp: Date.now() });
      };
      try {
        Promise.resolve(reader.scan({ signal: controller.signal })).catch(error => finish(error));
      } catch (error) { finish(error); }
    });
  }
  async function writePreset(preset, { timeoutMs = 30000 } = {}) {
    if (typeof root.NDEFReader !== 'function') throw new Error('Web NFC writing is unavailable in this browser.');
    if (typeof preset !== 'string' || !preset.trim()) throw new Error('Choose a preset first.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const reader = new root.NDEFReader();
      await reader.write({ records: [{ recordType: 'text', data: `JUICE-ROOM:${preset}` }] }, { signal: controller.signal });
      return true;
    } finally { clearTimeout(timer); }
  }
  root.JuiceNFCTransport = Object.freeze({ read, writePreset });
})(globalThis);
