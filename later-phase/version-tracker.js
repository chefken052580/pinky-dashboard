/**
 * Version Tracking and Update Analytics
 */
class VersionTracker {
  constructor() {
    this.currentVersion = '1.0.0'; // Updated by build process
    this.events = [];
    this.init();
  }
  init() {
    this.currentVersion = localStorage.getItem('pinky_version') || '1.0.0';
    this.events = JSON.parse(localStorage.getItem('pinky_update_events') || '[]');
  }
  setVersion(version) {
    localStorage.setItem('pinky_version', version);
    this.currentVersion = version;
  }
  logEvent(event, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      version: this.currentVersion,
      metadata
    };
    this.events.push(entry);
    localStorage.setItem('pinky_update_events', JSON.stringify(this.events.slice(-50)));
    // Send to backend
    if (window.fetch) {
      fetch('/api/updates/log', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(entry)
      }).catch(err => console.error('[VersionTracker] Log failed:', err));
    }
  }
  getVersion() {
    return this.currentVersion;
  }
  getEvents(limit = 10) {
    return this.events.slice(-limit);
  }
  clearEvents() {
    this.events = [];
    localStorage.removeItem('pinky_update_events');
  }
}
const versionTracker = new VersionTracker();
if (typeof window !== 'undefined') {
  window.versionTracker = versionTracker;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VersionTracker;
}
