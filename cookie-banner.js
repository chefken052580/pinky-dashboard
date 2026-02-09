/**
 * PinkyBot Cookie Consent Banner - GDPR Compliant
 * Manages cookie consent preferences with granular control
 */

(function() {
  'use strict';

  // Cookie preferences key in localStorage
  const STORAGE_KEY = 'pinkybot_cookie_consent';

  // Cookie categories
  const COOKIE_CATEGORIES = {
    necessary: {
      name: 'Essential Cookies',
      description: 'Required for the website to function. Cannot be disabled.',
      required: true,
      examples: 'session_token, csrf_token, cookie_consent'
    },
    analytics: {
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with the platform by collecting and reporting information anonymously.',
      required: false,
      examples: '_ga, _gid (Google Analytics)'
    },
    marketing: {
      name: 'Marketing Cookies',
      description: 'Used to track visitors across websites to display relevant ads and measure campaign effectiveness.',
      required: false,
      examples: 'fbp (Facebook Pixel), _gcl_au (Google Ads)'
    },
    preferences: {
      name: 'Preference Cookies',
      description: 'Remember your settings and preferences for a personalized experience.',
      required: false,
      examples: 'theme, language, active_company'
    }
  };

  // Check if consent has been given
  function hasConsent() {
    const consent = localStorage.getItem(STORAGE_KEY);
    return consent !== null;
  }

  // Get current consent preferences
  function getConsent() {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      return null;
    }
    try {
      return JSON.parse(consent);
    } catch (e) {
      console.error('Failed to parse cookie consent:', e);
      return null;
    }
  }

  // Save consent preferences
  function saveConsent(preferences) {
    const consent = {
      timestamp: new Date().toISOString(),
      preferences: preferences
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));

    // Apply consent (enable/disable tracking scripts)
    applyConsent(preferences);

    // Hide banner
    hideBanner();
  }

  // Apply consent by enabling/disabling tracking scripts
  function applyConsent(preferences) {
    // Google Analytics
    if (preferences.analytics) {
      enableGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }

    // Facebook Pixel
    if (preferences.marketing) {
      enableFacebookPixel();
    } else {
      disableFacebookPixel();
    }

    // Preferences (always enabled if any consent given)
    // These are essential for user experience
  }

  // Enable Google Analytics
  function enableGoogleAnalytics() {
    // Check if GA is already loaded
    if (window.gtag) {
      console.log('[CookieBanner] Google Analytics already loaded');
      return;
    }

    // Load GA script
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // Replace with actual GA ID
    document.head.appendChild(gaScript);

    // Initialize GA
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX'); // Replace with actual GA ID

    console.log('[CookieBanner] Google Analytics enabled');
  }

  // Disable Google Analytics
  function disableGoogleAnalytics() {
    // Set GA opt-out flag
    window['ga-disable-G-XXXXXXXXXX'] = true; // Replace with actual GA ID
    console.log('[CookieBanner] Google Analytics disabled');
  }

  // Enable Facebook Pixel
  function enableFacebookPixel() {
    // Check if FB Pixel is already loaded
    if (window.fbq) {
      console.log('[CookieBanner] Facebook Pixel already loaded');
      return;
    }

    // Load FB Pixel script
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'XXXXXXXXX'); // Replace with actual FB Pixel ID
    fbq('track', 'PageView');

    console.log('[CookieBanner] Facebook Pixel enabled');
  }

  // Disable Facebook Pixel
  function disableFacebookPixel() {
    // Remove FB Pixel (can't fully disable after loaded, but we won't track new events)
    if (window.fbq) {
      // Stub fbq to prevent further tracking
      window.fbq = function() { console.log('[CookieBanner] FB Pixel tracking blocked'); };
    }
    console.log('[CookieBanner] Facebook Pixel disabled');
  }

  // Show banner
  function showBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.add('visible');
    }
  }

  // Hide banner
  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.remove('visible');
    }
  }

  // Show settings modal
  function showSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
      modal.classList.add('visible');
      populateSettingsForm();
    }
  }

  // Hide settings modal
  function hideSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  // Populate settings form with current preferences
  function populateSettingsForm() {
    const consent = getConsent();
    const preferences = consent ? consent.preferences : {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };

    // Set toggle states
    Object.keys(COOKIE_CATEGORIES).forEach(category => {
      const toggle = document.getElementById(`cookie-toggle-${category}`);
      if (toggle) {
        toggle.checked = preferences[category] || false;
      }
    });
  }

  // Get preferences from settings form
  function getSettingsFormPreferences() {
    const preferences = {};
    Object.keys(COOKIE_CATEGORIES).forEach(category => {
      const toggle = document.getElementById(`cookie-toggle-${category}`);
      preferences[category] = toggle ? toggle.checked : COOKIE_CATEGORIES[category].required;
    });
    return preferences;
  }

  // Accept all cookies
  function acceptAll() {
    const preferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    saveConsent(preferences);
  }

  // Reject all (except necessary)
  function rejectAll() {
    const preferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    saveConsent(preferences);
  }

  // Save settings from modal
  function saveSettings() {
    const preferences = getSettingsFormPreferences();
    saveConsent(preferences);
    hideSettings();
  }

  // Create banner HTML
  function createBannerHTML() {
    return `
      <div class="cookie-banner-content">
        <div class="cookie-banner-text">
          <h3>🍪 We use cookies</h3>
          <p>
            We use cookies to enhance your experience, analyze site usage, and personalize content. 
            By clicking "Accept All", you consent to our use of cookies. 
            <a href="/docs/PRIVACY-POLICY.md" target="_blank">Learn more</a>
          </p>
        </div>
        <div class="cookie-banner-actions">
          <button class="cookie-btn cookie-btn-accept" id="cookie-accept-all">Accept All</button>
          <button class="cookie-btn cookie-btn-reject" id="cookie-reject-all">Reject All</button>
          <button class="cookie-btn cookie-btn-settings" id="cookie-settings">Settings</button>
        </div>
      </div>
    `;
  }

  // Create settings modal HTML
  function createSettingsHTML() {
    let categoriesHTML = '';
    Object.keys(COOKIE_CATEGORIES).forEach(category => {
      const cat = COOKIE_CATEGORIES[category];
      categoriesHTML += `
        <div class="cookie-category">
          <div class="cookie-category-header">
            <h3>${cat.name}</h3>
            <label class="cookie-toggle">
              <input 
                type="checkbox" 
                id="cookie-toggle-${category}"
                ${cat.required ? 'checked disabled' : ''}
              >
              <span class="cookie-toggle-slider"></span>
            </label>
          </div>
          <div class="cookie-category-description">${cat.description}</div>
          <div class="cookie-category-examples">Examples: ${cat.examples}</div>
        </div>
      `;
    });

    return `
      <div class="cookie-modal-content">
        <div class="cookie-modal-header">
          <h2>Cookie Settings</h2>
          <button class="cookie-modal-close" id="cookie-modal-close">&times;</button>
        </div>
        <div class="cookie-modal-body">
          ${categoriesHTML}
        </div>
        <div class="cookie-modal-footer">
          <button class="cookie-modal-btn cookie-modal-btn-reject-all" id="cookie-modal-reject-all">Reject All</button>
          <button class="cookie-modal-btn cookie-modal-btn-accept-all" id="cookie-modal-accept-all">Accept All</button>
          <button class="cookie-modal-btn cookie-modal-btn-save" id="cookie-modal-save">Save Preferences</button>
        </div>
      </div>
    `;
  }

  // Initialize banner
  function init() {
    // Check if consent already given
    if (hasConsent()) {
      const consent = getConsent();
      if (consent && consent.preferences) {
        applyConsent(consent.preferences);
      }
      return;
    }

    // Create banner element
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = createBannerHTML();
    document.body.appendChild(banner);

    // Create settings modal
    const modal = document.createElement('div');
    modal.id = 'cookie-settings-modal';
    modal.innerHTML = createSettingsHTML();
    document.body.appendChild(modal);

    // Show banner after short delay (for better UX)
    setTimeout(() => {
      showBanner();
    }, 500);

    // Attach event listeners
    document.getElementById('cookie-accept-all').addEventListener('click', acceptAll);
    document.getElementById('cookie-reject-all').addEventListener('click', rejectAll);
    document.getElementById('cookie-settings').addEventListener('click', showSettings);

    // Modal event listeners
    document.getElementById('cookie-modal-close').addEventListener('click', hideSettings);
    document.getElementById('cookie-modal-accept-all').addEventListener('click', () => {
      acceptAll();
      hideSettings();
    });
    document.getElementById('cookie-modal-reject-all').addEventListener('click', () => {
      rejectAll();
      hideSettings();
    });
    document.getElementById('cookie-modal-save').addEventListener('click', saveSettings);

    // Close modal on backdrop click
    document.getElementById('cookie-settings-modal').addEventListener('click', (e) => {
      if (e.target.id === 'cookie-settings-modal') {
        hideSettings();
      }
    });
  }

  // Public API for programmatic access
  window.PinkybotCookies = {
    hasConsent: hasConsent,
    getConsent: getConsent,
    acceptAll: acceptAll,
    rejectAll: rejectAll,
    showSettings: showSettings,
    showBanner: showBanner
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
