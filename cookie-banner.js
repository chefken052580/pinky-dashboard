/**
 * Cookie Consent Banner - EU GDPR Compliance
 * PinkyBot.io
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'pinky_cookie_consent';
  const CONSENT_VERSION = '1.0';

  // Cookie categories
  const COOKIE_CATEGORIES = {
    necessary: {
      name: 'Necessary Cookies',
      description: 'Essential for the website to function. Cannot be disabled.',
      required: true,
      default: true
    },
    analytics: {
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website by collecting anonymous data.',
      required: false,
      default: false
    },
    marketing: {
      name: 'Marketing Cookies',
      description: 'Used to track visitors across websites to display relevant ads.',
      required: false,
      default: false
    }
  };

  /**
   * Initialize cookie banner
   */
  function initCookieBanner() {
    // Check if consent already given
    const consent = getStoredConsent();
    if (consent && consent.version === CONSENT_VERSION) {
      // Consent already given, apply preferences
      applyConsent(consent);
      return;
    }

    // Show banner
    showBanner();
  }

  /**
   * Show cookie consent banner
   */
  function showBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.add('show');
    }
  }

  /**
   * Hide cookie consent banner
   */
  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.remove('show');
    }
  }

  /**
   * Get stored consent from localStorage
   */
  function getStoredConsent() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to read cookie consent:', e);
      return null;
    }
  }

  /**
   * Save consent to localStorage
   */
  function saveConsent(preferences) {
    const consent = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences: preferences
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      applyConsent(consent);
    } catch (e) {
      console.error('Failed to save cookie consent:', e);
    }
  }

  /**
   * Apply consent preferences
   */
  function applyConsent(consent) {
    const prefs = consent.preferences;

    // Always enable necessary cookies
    enableNecessaryCookies();

    // Apply analytics
    if (prefs.analytics) {
      enableAnalyticsCookies();
    } else {
      disableAnalyticsCookies();
    }

    // Apply marketing
    if (prefs.marketing) {
      enableMarketingCookies();
    } else {
      disableMarketingCookies();
    }

    console.log('Cookie preferences applied:', prefs);
  }

  /**
   * Enable necessary cookies (always on)
   */
  function enableNecessaryCookies() {
    // Necessary cookies are always enabled
    // These include session management, authentication, etc.
  }

  /**
   * Enable analytics cookies
   */
  function enableAnalyticsCookies() {
    // Enable Google Analytics, Plausible, etc.
    // Example: Initialize GA if consent given
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }

  /**
   * Disable analytics cookies
   */
  function disableAnalyticsCookies() {
    // Disable analytics tracking
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }

  /**
   * Enable marketing cookies
   */
  function enableMarketingCookies() {
    // Enable marketing pixels, ad tracking, etc.
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': 'granted'
      });
    }
  }

  /**
   * Disable marketing cookies
   */
  function disableMarketingCookies() {
    // Disable marketing tracking
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': 'denied'
      });
    }
  }

  /**
   * Accept all cookies
   */
  function acceptAll() {
    const preferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    saveConsent(preferences);
    hideBanner();
  }

  /**
   * Reject optional cookies
   */
  function rejectAll() {
    const preferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    saveConsent(preferences);
    hideBanner();
  }

  /**
   * Show settings modal
   */
  function showSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
      // Pre-fill current preferences
      const consent = getStoredConsent();
      if (consent) {
        document.getElementById('cookie-analytics').checked = consent.preferences.analytics;
        document.getElementById('cookie-marketing').checked = consent.preferences.marketing;
      } else {
        // Default values
        document.getElementById('cookie-analytics').checked = false;
        document.getElementById('cookie-marketing').checked = false;
      }
      
      modal.classList.add('show');
    }
  }

  /**
   * Hide settings modal
   */
  function hideSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  /**
   * Save custom preferences from settings modal
   */
  function saveCustomPreferences() {
    const preferences = {
      necessary: true, // Always true
      analytics: document.getElementById('cookie-analytics').checked,
      marketing: document.getElementById('cookie-marketing').checked
    };
    saveConsent(preferences);
    hideSettings();
    hideBanner();
  }

  /**
   * Render cookie banner HTML
   */
  function renderBanner() {
    const bannerHTML = `
      <div id="cookie-banner">
        <div class="cookie-banner-content">
          <div class="cookie-banner-text">
            <h3>🍪 We Value Your Privacy</h3>
            <p>
              We use cookies to enhance your experience, analyze site traffic, and provide personalized content. 
              You can customize your preferences or accept all cookies.
            </p>
          </div>
          <div class="cookie-banner-actions">
            <button class="cookie-btn cookie-btn-accept" onclick="window.cookieBanner.acceptAll()">
              Accept All
            </button>
            <button class="cookie-btn cookie-btn-reject" onclick="window.cookieBanner.rejectAll()">
              Reject Optional
            </button>
            <button class="cookie-btn cookie-btn-settings" onclick="window.cookieBanner.showSettings()">
              Customize
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHTML);
  }

  /**
   * Render settings modal HTML
   */
  function renderSettingsModal() {
    const modalHTML = `
      <div id="cookie-settings-modal">
        <div class="cookie-settings-content">
          <h2>Cookie Preferences</h2>
          
          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3>🔒 ${COOKIE_CATEGORIES.necessary.name}</h3>
              <label class="cookie-toggle">
                <input type="checkbox" checked disabled>
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <p class="cookie-category-description">${COOKIE_CATEGORIES.necessary.description}</p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3>📊 ${COOKIE_CATEGORIES.analytics.name}</h3>
              <label class="cookie-toggle">
                <input type="checkbox" id="cookie-analytics">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <p class="cookie-category-description">${COOKIE_CATEGORIES.analytics.description}</p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3>📢 ${COOKIE_CATEGORIES.marketing.name}</h3>
              <label class="cookie-toggle">
                <input type="checkbox" id="cookie-marketing">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <p class="cookie-category-description">${COOKIE_CATEGORIES.marketing.description}</p>
          </div>

          <div class="cookie-settings-actions">
            <button class="cookie-settings-btn cookie-settings-btn-cancel" onclick="window.cookieBanner.hideSettings()">
              Cancel
            </button>
            <button class="cookie-settings-btn cookie-settings-btn-save" onclick="window.cookieBanner.saveCustomPreferences()">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        renderBanner();
        renderSettingsModal();
        initCookieBanner();
      });
    } else {
      renderBanner();
      renderSettingsModal();
      initCookieBanner();
    }
  }

  // Expose public API
  window.cookieBanner = {
    acceptAll,
    rejectAll,
    showSettings,
    hideSettings,
    saveCustomPreferences,
    getStoredConsent
  };

  // Auto-initialize
  init();

})();
