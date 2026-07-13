// NFCManager.js - Clean, profile-aware NFC handling for Juice Cinema v3
// Best practice modular approach for the personal-sonic-postcards repo

class NFCManager {
  constructor(profile = 'default') {
    this.profile = profile;
    this.tapCount = this.loadTapCount();
    this.ritualHistory = this.loadRitualHistory();
  }

  loadTapCount() {
    return parseInt(localStorage.getItem(`juice-nfc-taps-${this.profile}`) || '0');
  }

  saveTapCount() {
    localStorage.setItem(`juice-nfc-taps-${this.profile}`, this.tapCount);
  }

  loadRitualHistory() {
    const saved = localStorage.getItem(`juice-rituals-${this.profile}`);
    return saved ? JSON.parse(saved) : [];
  }

  saveRitualHistory() {
    localStorage.setItem(`juice-rituals-${this.profile}`, JSON.stringify(this.ritualHistory));
  }

  // Core: Request NFC auth (with simulation fallback)
  async requestAuth(forRitual = false) {
    return new Promise((resolve, reject) => {
      if (!('NDEFReader' in window)) {
        // Simulation mode for desktop / testing
        const proceed = confirm('Web NFC not available. Simulate NFC tap for testing?');
        if (proceed) {
          resolve({
            serialNumber: 'SIM-' + Date.now().toString(36),
            shortSerial: 'SIM-' + Date.now().toString(36).slice(-6),
            presetFromCard: null,
            timestamp: Date.now(),
            simulated: true
          });
        } else {
          reject(new Error('NFC required for this action'));
        }
        return;
      }

      const ndef = new NDEFReader();
      ndef.scan()
        .then(() => {
          ndef.onreading = (event) => {
            let presetFromCard = null;
            const serial = event.serialNumber || 'UNKNOWN';
            const shortSerial = serial.length > 12 ? serial.slice(0, 8) + '...' : serial;

            if (event.message && event.message.records) {
              for (const record of event.message.records) {
                if (record.recordType === 'text') {
                  try {
                    const text = new TextDecoder().decode(record.data);
                    if (text.startsWith('JUICE-ROOM:')) {
                      const presetId = text.split(':')[1];
                      if (roomPresets && roomPresets[presetId]) {
                        presetFromCard = presetId;
                      }
                    }
                  } catch (e) {}
                }
              }
            }

            resolve({ serialNumber: serial, shortSerial, presetFromCard, timestamp: Date.now() });
          };
        })
        .catch((err) => {
          reject(new Error('NFC scan failed: ' + (err.message || 'Check permissions')));
        });
    });
  }

  // Write preset ID to physical NFC card
  async writePreset(presetKey) {
    if (!('NDEFWriter' in window)) {
      alert('NFC writing requires Chrome on Android with NFC support.');
      return false;
    }
    try {
      const ndef = new NDEFWriter();
      await ndef.write({
        records: [{
          recordType: 'text',
          data: `JUICE-ROOM:${presetKey}`
        }]
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // High-level: Stamp a group reflection with NFC ritual
  async stampRitual(logData) {
    try {
      const nfcResult = await this.requestAuth(true);
      const entry = {
        id: Date.now(),
        timestamp: Date.now(),
        text: logData.text || '(no text)',
        preset: logData.preset || selectedPreset,
        profile: this.profile,
        nfcSerial: nfcResult.shortSerial,
        hasVoice: !!logData.hasVoice
      };
      this.ritualHistory.unshift(entry);
      this.tapCount++;
      this.saveRitualHistory();
      this.saveTapCount();
      return entry;
    } catch (e) {
      throw e;
    }
  }

  getTapCount() {
    return this.tapCount;
  }

  getHistory() {
    return [...this.ritualHistory];
    }

  // Update UI counter (call after changes)
  updateTapCounterUI(elementId = 'nfcTapCounter') {
    const el = document.getElementById(elementId);
    if (el) el.textContent = this.tapCount;
  }
}