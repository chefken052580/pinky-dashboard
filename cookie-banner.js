/**
 * Cookie Consent Banner (GDPR/CCPA Compliant)
 * Handles cookie consent management with granular controls
 * 
 * Features:
 * - Accept All / Reject All quick actions
 * - Granular consent settings modal (necessary/analytics/marketing)
 * - Persistent storage in localStorage
 * - Respects Do Not Track (DNT) browser signals
 * - GDPR Article 7 compliant (clear, affirmative consent)
 */

(function() {
  'use strict';

  // Cookie categories
  const COOKIE_CATEGORIES = {
    necessary: {
      name: 'Necessary Cookies',
      description: 'Required for the website to function. Cannot be disabled.',
      required: true,
      services: ['Session management', 'Authentication', 'Security (CSRF protection)']
    },
    analytics: {
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors use our website.',
      required: false,
      services: ['Google Analytics', 'PostHog']
    },
    marketing: {
      name: 'Marketing Cookies',
      description: 'Used to show you relevant ads and measure campaign effectiveness.',
      required: false,
      services: ['Facebook Pixel', 'LinkedIn Insight Tag']
    }
  };

  // Storage key
  const CONSENT_KEY = 'pinky_cookie_consent';

  // Check if user has already made a choice
  function hasConsent() {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      return consent !== null;
    } catch (e) {
      return false;
    }
  }

  // Get current consent preferences
  function getConsent() {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        return null;
      }
      return JSON.parse(consent);
    } catch (e) {
      return null;
    }
  }

  // Save consent preferences
  function saveConsent(preferences) {
    try {
      const consentData = {
        version: 1,
        timestamp: new Date().toISOString(),
        preferences: preferences
      };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
      return true;
    } catch (e) {
      console.error('Failed to save cookie consent:', e);
      return false;
    }
  }

  // Check if Do Not Track is enabled
  function isDNTEnabled() {
    return navigator.doNotTrack === '1' || 
           window.doNotTrack === '1' || 
           navigator.msDoNotTrack === '1';
  }

  // Initialize Google Analytics if consent given
  function initGoogleAnalytics() {
    const consent = getConsent();
    if (consent && consent.preferences.analytics) {
      // GA4 initialization
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX', {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
      console.log('✅ Google Analytics enabled');
    } else {
      console.log('⛔ Google Analytics disabled (no consent)');
    }
  }

  // Initialize PostHog if consent given
  function initPostHog() {
    const consent = getConsent();
    if (consent && consent.preferences.analytics) {
      // PostHog initialization (placeholder)
      console.log('✅ PostHog analytics enabled');
      // window.posthog.init('phc_...', { api_host: 'https://app.posthog.com' });
    } else {
      console.log('⛔ PostHog analytics disabled (no consent)');
    }
  }

  // Initialize marketing pixels if consent given
  function initMarketingPixels() {
    const consent = getConsent();
    if (consent && consent.preferences.marketing) {
      // Facebook Pixel (placeholder)
      console.log('✅ Facebook Pixel enabled');
      // !function(f,b,e,v,n,t,s){...}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      // fbq('init', 'YOUR_PIXEL_ID');
      
      // LinkedIn Insight Tag (placeholder)
      console.log('✅ LinkedIn Insight Tag enabled');
      // _linkedin_partner_id = "123456";
    } else {
      console.log('⛔ Marketing pixels disabled (no consent)');
    }
  }

  // Apply consent preferences
  function applyConsent() {
    initGoogleAnalytics();
    initPostHog();
    initMarketingPixels();

    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: getConsent()
    }));
  }

  // Show cookie banner
  function showBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.add('visible');
    }
  }

  // Hide cookie banner
  function hideBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.remove('visible');
    }
  }

  // Handle Accept All
  function acceptAll() {
    const preferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    saveConsent(preferences);
    applyConsent();
    hideBanner();
  }

  // Handle Reject All
  function rejectAll() {
    const preferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    saveConsent(preferences);
    applyConsent();
    hideBanner();
  }

  // Show settings modal
  function showSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
      // Pre-populate with current preferences
      const consent = getConsent();
      if (consent) {
        document.getElementById('consent-analytics').checked = consent.preferences.analytics;
        document.getElementById('consent-marketing').checked = consent.preferences.marketing;
      }
      modal.classList.add('visible');
    }
  }

  // Hide settings modal
  function hideSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  // Save custom preferences from modal
  function saveCustomPreferences() {
    const preferences = {
      necessary: true, // Always true
      analytics: document.getElementById('consent-analytics').checked,
      marketing: document.getElementById('consent-marketing').checked
    };
    saveConsent(preferences);
    applyConsent();
    hideSettings();
    hideBanner();
  }

  // Inject cookie banner HTML into page
  function injectBanner() {
    fetch('cookie-banner.html')
      .then(response => response.text())
      .then(html => {
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container.firstElementChild);

        // Add event listeners
        document.getElementById('cookie-accept-all').addEventListener('click', acceptAll);
        document.getElementById('cookie-reject-all').addEventListener('click', rejectAll);
        document.getElementById('cookie-settings-btn').addEventListener('click', showSettings);
        document.getElementById('cookie-settings-close').addEventListener('click', hideSettings);
        document.getElementById('cookie-settings-save').addEventListener('click', saveCustomPreferences);

        // Show banner if no consent yet
        if (!hasConsent()) {
          setTimeout(showBanner, 500); // Slight delay for better UX
        } else {
          applyConsent(); // Apply existing consent
        }
      })
      .catch(err => console.error('Failed to load cookie banner:', err));
  }

  // Expose global functions for footer link
  window.CookieBanner = {
    showSettings: showSettings,
    getConsent: getConsent,
    resetConsent: function() {
      localStorage.removeItem(CONSENT_KEY);
      location.reload();
    }
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBanner);
  } else {
    injectBanner();
  }

  // Respect DNT signal
  if (isDNTEnabled()) {
    console.log('🔒 Do Not Track enabled - analytics disabled by browser');
    const preferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    if (!hasConsent()) {
      saveConsent(preferences);
    }
  }

})();
