/**
 * 🔊 NOTIFICATION SOUNDS MANAGER
 * Provides sound effects for notifications with customizable presets
 * Stores preferences in localStorage for persistence
 */

class NotificationSoundsManager {
  constructor() {
    this.audioContext = null;
    this.isEnabled = this.loadSetting('soundEnabled', true);
    this.volume = this.loadSetting('soundVolume', 0.5);
    this.soundTheme = this.loadSetting('soundTheme', 'gentle');
    this.soundCache = {};
    this.initAudioContext();
  }

  initAudioContext() {
    if (typeof AudioContext !== 'undefined' && !this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[NotificationSounds] AudioContext not available:', e);
      }
    }
  }

  loadSetting(key, defaultValue) {
    try {
      const stored = localStorage.getItem(`pinky-sound-${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  saveSetting(key, value) {
    try {
      localStorage.setItem(`pinky-sound-${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('[NotificationSounds] Failed to save setting:', key, e);
    }
  }

  /**
   * Play a notification sound
   * @param {string} type - notification type: 'success', 'error', 'warning', 'info', 'task-complete'
   */
  play(type = 'info') {
    if (!this.isEnabled || !this.audioContext) return;

    const theme = this.soundTheme;
    const soundName = `${theme}-${type}`;

    // Use Web Audio API to generate sounds dynamically
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const notes = this.getSoundPattern(type, theme);
      gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

      // Play sound pattern
      notes.forEach((note, index) => {
        const startTime = this.audioContext.currentTime + index * 0.1;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(note.freq, startTime);
        gain.gain.setValueAtTime(this.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

        osc.start(startTime);
        osc.stop(startTime + note.duration);
      });
    } catch (e) {
      console.warn('[NotificationSounds] Failed to play sound:', e);
    }
  }

  /**
   * Get sound pattern for notification type
   */
  getSoundPattern(type, theme) {
    const patterns = {
      gentle: {
        success: [
          { freq: 523, duration: 0.15 }, // C5
          { freq: 659, duration: 0.15 }, // E5
          { freq: 784, duration: 0.2 },  // G5
        ],
        error: [
          { freq: 329, duration: 0.15 }, // E4
          { freq: 220, duration: 0.15 }, // A3
          { freq: 220, duration: 0.2 },  // A3
        ],
        warning: [
          { freq: 440, duration: 0.15 }, // A4
          { freq: 523, duration: 0.15 }, // C5
          { freq: 440, duration: 0.15 }, // A4
        ],
        info: [
          { freq: 523, duration: 0.1 },  // C5
          { freq: 587, duration: 0.1 },  // D5
        ],
        'task-complete': [
          { freq: 659, duration: 0.1 },  // E5
          { freq: 784, duration: 0.1 },  // G5
          { freq: 987, duration: 0.2 },  // B5
        ],
      },
      upbeat: {
        success: [
          { freq: 659, duration: 0.1 },  // E5
          { freq: 784, duration: 0.1 },  // G5
          { freq: 1047, duration: 0.15 }, // C6
          { freq: 1047, duration: 0.15 }, // C6
        ],
        error: [
          { freq: 261, duration: 0.2 },  // C4
          { freq: 195, duration: 0.2 },  // G3
        ],
        warning: [
          { freq: 554, duration: 0.1 },  // C#5
          { freq: 554, duration: 0.1 },  // C#5
          { freq: 659, duration: 0.15 }, // E5
        ],
        info: [
          { freq: 698, duration: 0.12 }, // F5
          { freq: 587, duration: 0.12 }, // D5
        ],
        'task-complete': [
          { freq: 784, duration: 0.08 },  // G5
          { freq: 987, duration: 0.08 },  // B5
          { freq: 1047, duration: 0.1 },  // C6
          { freq: 1175, duration: 0.2 },  // D6
        ],
      },
      classic: {
        success: [
          { freq: 800, duration: 0.1 },
          { freq: 1000, duration: 0.3 },
        ],
        error: [
          { freq: 400, duration: 0.3 },
        ],
        warning: [
          { freq: 600, duration: 0.15 },
          { freq: 600, duration: 0.15 },
        ],
        info: [
          { freq: 500, duration: 0.2 },
        ],
        'task-complete': [
          { freq: 900, duration: 0.1 },
          { freq: 1100, duration: 0.3 },
        ],
      },
      minimal: {
        success: [{ freq: 700, duration: 0.2 }],
        error: [{ freq: 300, duration: 0.2 }],
        warning: [{ freq: 500, duration: 0.15 }],
        info: [{ freq: 600, duration: 0.1 }],
        'task-complete': [
          { freq: 800, duration: 0.1 },
          { freq: 900, duration: 0.2 },
        ],
      },
    };

    return patterns[theme]?.[type] || patterns.gentle.info;
  }

  /**
   * Set if sounds are enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.saveSetting('soundEnabled', enabled);
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSetting('soundVolume', this.volume);
  }

  /**
   * Set sound theme
   */
  setSoundTheme(theme) {
    const validThemes = ['gentle', 'upbeat', 'classic', 'minimal'];
    if (validThemes.includes(theme)) {
      this.soundTheme = theme;
      this.saveSetting('soundTheme', theme);
    }
  }

  /**
   * Test all sounds for current theme
   */
  testAll() {
    const types = ['success', 'error', 'warning', 'info', 'task-complete'];
    types.forEach((type, index) => {
      setTimeout(() => this.play(type), index * 500);
    });
  }

  /**
   * Get current settings as object
   */
  getSettings() {
    return {
      enabled: this.isEnabled,
      volume: this.volume,
      theme: this.soundTheme,
    };
  }
}

// Create global instance
const notificationSounds = new NotificationSoundsManager();

// Integration with existing notification system
// When a notification is triggered, call: notificationSounds.play('success') etc.

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSoundsManager;
}
