/**
 * License Manager - Front-end license key management
 * Handles license activation, validation, and status checking
 */

class LicenseManager {
  constructor() {
    this.apiBase = window.location.origin;
    this.licenseKey = this.getStoredLicense();
    this.instanceId = this.getInstanceId();
    this.init();
  }

  init() {
    // Check license status on load
    if (this.licenseKey) {
      this.checkLicenseStatus();
    } else {
      this.setTierFromLicense('free');
    }

    // Listen for license activation
    this.attachListeners();

    // Periodic license check (every 24 hours)
    setInterval(() => this.checkLicenseStatus(), 24 * 60 * 60 * 1000);
  }

  getInstanceId() {
    // Get or create unique instance ID
    let instanceId = localStorage.getItem('pinky_instance_id');
    if (!instanceId) {
      instanceId = 'inst_' + Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pinky_instance_id', instanceId);
    }
    return instanceId;
  }

  getStoredLicense() {
    return localStorage.getItem('pinky_license_key');
  }

  storeLicense(licenseKey) {
    if (licenseKey) {
      localStorage.setItem('pinky_license_key', licenseKey);
      this.licenseKey = licenseKey;
    } else {
      localStorage.removeItem('pinky_license_key');
      this.licenseKey = null;
    }
  }

  attachListeners() {
    // Listen for license activation button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="activate-license"]')) {
        e.preventDefault();
        this.showActivationModal();
      }

      if (e.target.matches('[data-action="manage-license"]')) {
        e.preventDefault();
        this.showLicenseDetails();
      }

      if (e.target.matches('[data-action="deactivate-license"]')) {
        e.preventDefault();
        this.deactivateLicense();
      }
    });
  }

  async showActivationModal() {
    const modal = document.createElement('div');
    modal.className = 'license-activation-modal';
    modal.innerHTML = `
      <div class="license-modal-overlay"></div>
      <div class="license-modal-content">
        <button class="license-modal-close">✕</button>
        <div class="license-modal-header">
          <h2>🔑 Activate License</h2>
          <p>Enter your PinkyBot license key to unlock Pro features</p>
        </div>
        <div class="license-modal-body">
          <form id="license-activation-form">
            <div class="license-form-group">
              <label for="license-key-input">License Key</label>
              <textarea 
                id="license-key-input"
                placeholder="PINKYBOT-xxxx-xxxxxxxxxxxx"
                rows="3"
                required
              ></textarea>
              <p class="license-help-text">
                Format: PINKYBOT-{signature}-{payload}
              </p>
            </div>
            <div class="license-form-actions">
              <button type="submit" class="license-btn-primary">
                <span class="btn-text">Activate License</span>
                <span class="btn-loader" style="display: none;">⏳ Validating...</span>
              </button>
            </div>
          </form>
          <div class="license-info-box">
            <h3>Need a license?</h3>
            <p>Purchase a license at <a href="https://pinkybot.io/pricing" target="_blank">pinkybot.io/pricing</a></p>
            <p>Or subscribe via <button class="link-button" data-action="upgrade-to-pro">Stripe checkout</button></p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('.license-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.license-modal-overlay').addEventListener('click', () => modal.remove());

    // Form submission
    const form = modal.querySelector('#license-activation-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.activateLicense(modal);
    });

    // ESC to close
    const escHandler = (e) => {
      if (e.key === 'Escape' && modal.parentElement) {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  async activateLicense(modal) {
    const input = document.getElementById('license-key-input');
    const btn = modal.querySelector('.license-btn-primary');
    const licenseKey = input.value.trim();

    if (!licenseKey) {
      this.showError('Please enter a license key');
      return;
    }

    // Show loading
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline';

    try {
      // First validate the key
      const validateResponse = await fetch(`${this.apiBase}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      const validateData = await validateResponse.json();

      if (!validateData.valid) {
        throw new Error(validateData.error || 'Invalid license key');
      }

      // Activate for this instance
      const activateResponse = await fetch(`${this.apiBase}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          instanceId: this.instanceId,
          instanceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hostname: window.location.hostname,
            activatedAt: new Date().toISOString()
          }
        })
      });

      const activateData = await activateResponse.json();

      if (!activateData.activated) {
        throw new Error(activateData.error || 'Activation failed');
      }

      // Store license
      this.storeLicense(licenseKey);

      // Update tier
      this.setTierFromLicense(activateData.tier);

      // Fire event for tier resolver
      window.dispatchEvent(new Event('licenseActivated'));

      // Show success
      this.showSuccess(`License activated! You now have ${activateData.tier.toUpperCase()} access.`);

      // Close modal
      setTimeout(() => modal.remove(), 1500);

      // Refresh page to apply new tier
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('[License Manager] Activation error:', error);
      this.showError(error.message);

      // Reset button
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loader').style.display = 'none';
    }
  }

  async checkLicenseStatus() {
    if (!this.licenseKey) {
      this.setTierFromLicense('free');
      return;
    }

    try {
      const response = await fetch(
        `${this.apiBase}/api/license/status?licenseKey=${encodeURIComponent(this.licenseKey)}&instanceId=${this.instanceId}`
      );

      const data = await response.json();

      if (data.status === 'active') {
        this.setTierFromLicense(data.tier);
        
        // Check expiration warning (30 days)
        if (data.daysRemaining && data.daysRemaining <= 30) {
          this.showExpirationWarning(data.daysRemaining);
        }
      } else {
        // License inactive or expired
        this.setTierFromLicense('free');
        if (data.error) {
          this.showWarning('License issue: ' + data.error);
        }
      }

    } catch (error) {
      console.error('[License Manager] Status check error:', error);
      // Don't change tier on network errors
    }
  }

  async deactivateLicense() {
    if (!confirm('Are you sure you want to deactivate this license? You will lose Pro access.')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: this.licenseKey,
          instanceId: this.instanceId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Deactivation failed');
      }

      // Clear stored license
      this.storeLicense(null);
      this.setTierFromLicense('free');

      this.showSuccess('License deactivated. Reverting to Free tier.');

      // Refresh page
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('[License Manager] Deactivation error:', error);
      this.showError(error.message);
    }
  }

  showLicenseDetails() {
    if (!this.licenseKey) {
      this.showActivationModal();
      return;
    }

    this.checkLicenseStatus().then(() => {
      const tier = localStorage.getItem('pinky_tier') || 'free';
      alert(`License Status:\nTier: ${tier.toUpperCase()}\nInstance ID: ${this.instanceId}\n\nUse Settings to manage your license.`);
    });
  }

  setTierFromLicense(tier) {
    localStorage.setItem('pinky_tier', tier);
    localStorage.setItem('pinky_tier_source', tier === 'free' ? 'default' : 'license');

    // Notify feature gating
    if (window.featureGating) {
      window.featureGating.setTier(tier);
    }

    console.log('[License Manager] Tier set to:', tier);
  }

  showExpirationWarning(daysRemaining) {
    const message = `Your license expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew at pinkybot.io`;
    this.showWarning(message);
  }

  showError(message) {
    if (window.dashboard && window.dashboard.showToast) {
      window.dashboard.showToast(message, 'error');
    } else {
      alert('Error: ' + message);
    }
  }

  showSuccess(message) {
    if (window.dashboard && window.dashboard.showToast) {
      window.dashboard.showToast(message, 'success');
    } else {
      alert(message);
    }
  }

  showWarning(message) {
    if (window.dashboard && window.dashboard.showToast) {
      window.dashboard.showToast(message, 'warning');
    } else {
      console.warn('[License Manager]', message);
    }
  }

  // Admin: Generate license (for internal use)
  static async generateLicense(options) {
    try {
      const response = await fetch(`${window.location.origin}/api/license/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      console.log('[License Manager] Generated license:', data.license);
      return data.license;

    } catch (error) {
      console.error('[License Manager] Generation error:', error);
      throw error;
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.licenseManager = new LicenseManager();
  console.log('[License Manager] Initialized');
});
