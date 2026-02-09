/**
 * Update Checker - Check for PinkyBot updates on GitHub
 * Displays notification banner when new version is available
 */

class UpdateChecker {
  constructor() {
    this.currentVersion = '1.0.0'; // Should match package.json
    this.githubRepo = 'chefken052580/pinky-workspace';
    this.checkInterval = 4 * 60 * 60 * 1000; // Check every 4 hours
    this.lastCheckTime = null;
    this.latestRelease = null;
  }

  /**
   * Initialize update checker
   */
  async init() {
    // Load last check time from localStorage
    const stored = localStorage.getItem('pinky_last_update_check');
    if (stored) {
      this.lastCheckTime = new Date(stored);
    }

    // Check on startup (if not checked recently)
    const timeSinceCheck = this.lastCheckTime 
      ? Date.now() - this.lastCheckTime.getTime()
      : this.checkInterval + 1;

    if (timeSinceCheck > this.checkInterval) {
      await this.checkForUpdates();
    }

    // Set up periodic checks
    setInterval(() => this.checkForUpdates(), this.checkInterval);
  }

  /**
   * Check for updates from GitHub Releases
   */
  async checkForUpdates() {
    try {
      console.log('Checking for PinkyBot updates...');

      const response = await fetch(
        `https://api.github.com/repos/${this.githubRepo}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        console.warn('Update check failed:', response.status);
        return;
      }

      const release = await response.json();
      this.latestRelease = release;
      this.lastCheckTime = new Date();
      localStorage.setItem('pinky_last_update_check', this.lastCheckTime.toISOString());

      // Parse version numbers
      const latest = this.parseVersion(release.tag_name);
      const current = this.parseVersion(this.currentVersion);

      // Compare versions
      if (this.isNewerVersion(latest, current)) {
        this.showUpdateNotification(release);
      } else {
        console.log('PinkyBot is up to date:', this.currentVersion);
      }

    } catch (error) {
      console.error('Update check error:', error);
    }
  }

  /**
   * Parse version string to comparable object
   */
  parseVersion(versionString) {
    // Remove 'v' prefix if present
    const clean = versionString.replace(/^v/, '');
    const parts = clean.split('.').map(num => parseInt(num) || 0);
    
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      raw: versionString
    };
  }

  /**
   * Check if version A is newer than version B
   */
  isNewerVersion(a, b) {
    if (a.major > b.major) return true;
    if (a.major < b.major) return false;
    
    if (a.minor > b.minor) return true;
    if (a.minor < b.minor) return false;
    
    if (a.patch > b.patch) return true;
    
    return false;
  }

  /**
   * Show update notification banner
   */
  showUpdateNotification(release) {
    // Check if user already dismissed this version
    const dismissed = localStorage.getItem('pinky_dismissed_update');
    if (dismissed === release.tag_name) {
      return;
    }

    // Remove existing notification if present
    this.hideUpdateNotification();

    // Create notification banner
    const banner = document.createElement('div');
    banner.id = 'update-notification-banner';
    banner.className = 'update-notification';
    banner.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🎉</div>
        <div class="update-text">
          <div class="update-title">
            <strong>New Version Available:</strong> ${release.tag_name}
          </div>
          <div class="update-subtitle">
            ${this.truncate(release.name || release.tag_name, 60)}
          </div>
        </div>
        <div class="update-actions">
          <button class="btn-update-view" onclick="updateChecker.viewRelease()">
            View Release Notes
          </button>
          <button class="btn-update-dismiss" onclick="updateChecker.dismissUpdate()">
            Dismiss
          </button>
        </div>
      </div>
    `;

    // Insert at top of body
    document.body.insertBefore(banner, document.body.firstChild);

    // Animate in
    setTimeout(() => {
      banner.classList.add('show');
    }, 100);

    console.log('Update available:', release.tag_name);
  }

  /**
   * Hide update notification
   */
  hideUpdateNotification() {
    const banner = document.getElementById('update-notification-banner');
    if (banner) {
      banner.remove();
    }
  }

  /**
   * View release on GitHub
   */
  viewRelease() {
    if (this.latestRelease) {
      window.open(this.latestRelease.html_url, '_blank');
    }
  }

  /**
   * Dismiss update notification
   */
  dismissUpdate() {
    if (this.latestRelease) {
      localStorage.setItem('pinky_dismissed_update', this.latestRelease.tag_name);
    }
    this.hideUpdateNotification();
  }

  /**
   * Force check for updates (manual trigger)
   */
  async forceCheck() {
    this.hideUpdateNotification();
    await this.checkForUpdates();
    
    if (!this.latestRelease) {
      alert('Unable to check for updates. Please try again later.');
      return;
    }

    const latest = this.parseVersion(this.latestRelease.tag_name);
    const current = this.parseVersion(this.currentVersion);

    if (this.isNewerVersion(latest, current)) {
      // Notification will be shown by checkForUpdates
    } else {
      alert(`PinkyBot is up to date! (v${this.currentVersion})`);
    }
  }

  /**
   * Truncate text
   */
  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Get current version
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * Set current version (for testing)
   */
  setCurrentVersion(version) {
    this.currentVersion = version;
  }
}

// Global instance
const updateChecker = new UpdateChecker();

// Make available globally
window.updateChecker = updateChecker;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => updateChecker.init());
} else {
  updateChecker.init();
}
