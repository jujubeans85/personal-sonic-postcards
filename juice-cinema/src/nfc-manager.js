import '../../shared/nfc-transport.js';

// nfc-manager.js
// Clean, profile-aware NFC + Ritual management for Juice Cinema v3

export class NFCManager {
  constructor(profile = 'default') {
    this.profile = profile;
    this.tapCount = this.loadTapCount();
    this.lastSerial = null;
  }

  loadTapCount() {
    const key = `juice-nfc-taps-${this.profile}`;
    try {
      const count = Number(localStorage.getItem(key));
      return Number.isSafeInteger(count) && count >= 0 ? count : 0;
    } catch (_) { return 0; }
  }

  saveTapCount() {
    const key = `juice-nfc-taps-${this.profile}`;
    try { localStorage.setItem(key, this.tapCount); } catch (_) { /* Session count remains usable. */ }
  }

  updateTapCounterUI(elementId = 'nfcTapCounter') {
    const el = document.getElementById(elementId);
    if (el) el.textContent = this.tapCount;
  }

  async requestAuth(forRitual = false) {
    const result = await globalThis.JuiceNFCTransport.read({
      confirmSimulation: () => confirm('Web NFC not available. Simulate NFC tap for testing?')
    });
    this.lastSerial = result.serialNumber;
    if (forRitual) {
      this.tapCount++;
      this.saveTapCount();
    }
    return result;
  }

  async writePreset(presetKey) {
    try {
      return await globalThis.JuiceNFCTransport.writePreset(presetKey);
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async stampRitual({ text, preset, hasVoice = false }) {
    const nfcData = await this.requestAuth(true);

    return {
      id: Date.now(),
      timestamp: Date.now(),
      text: text || '(no text)',
      preset,
      profile: this.profile,
      nfcSerial: nfcData.shortSerial || nfcData.serialNumber,
      hasVoice,
      tapCount: this.tapCount
    };
  }
}
