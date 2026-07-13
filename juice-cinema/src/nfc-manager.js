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
    return parseInt(localStorage.getItem(key) || '0', 10);
  }

  saveTapCount() {
    const key = `juice-nfc-taps-${this.profile}`;
    localStorage.setItem(key, this.tapCount);
  }

  updateTapCounterUI(elementId = 'nfcTapCounter') {
    const el = document.getElementById(elementId);
    if (el) el.textContent = this.tapCount;
  }

  async requestAuth(forRitual = false) {
    return new Promise((resolve, reject) => {
      if (!('NDEFReader' in window)) {
        // Simulation mode for desktop / unsupported devices
        const proceed = confirm('Web NFC not available. Simulate NFC tap for testing?');
        if (proceed) {
          const simulated = {
            serialNumber: 'SIM-' + Date.now().toString(36),
            shortSerial: 'SIM',
            presetFromCard: null,
            simulated: true,
            timestamp: Date.now()
          };
          this.lastSerial = simulated.serialNumber;
          if (forRitual) this.tapCount++;
          this.saveTapCount();
          resolve(simulated);
        } else {
          reject(new Error('NFC tap required'));
        }
        return;
      }

      const ndef = new NDEFReader();

      ndef.scan()
        .then(() => {
          ndef.onreading = (event) => {
            let presetFromCard = null;
            const serial = event.serialNumber || 'UNKNOWN';

            if (event.message && event.message.records) {
              for (const record of event.message.records) {
                if (record.recordType === 'text') {
                  try {
                    const text = new TextDecoder().decode(record.data);
                    if (text.startsWith('JUICE-ROOM:')) {
                      presetFromCard = text.split(':')[1];
                    }
                  } catch (e) {}
                }
              }
            }

            this.lastSerial = serial;
            if (forRitual) {
              this.tapCount++;
              this.saveTapCount();
            }

            resolve({
              serialNumber: serial,
              shortSerial: serial.length > 10 ? serial.slice(0, 8) + '...' : serial,
              presetFromCard,
              timestamp: Date.now()
            });
          };
        })
        .catch((err) => {
          reject(new Error('NFC scan failed: ' + (err.message || err)));
        });
    });
  }

  async writePreset(presetKey) {
    if (!('NDEFWriter' in window)) {
      alert('NFC writing requires Chrome on Android');
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