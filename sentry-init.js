/**
 * Sentry Frontend Initialization
 * 
 * Captures client-side errors, performance metrics, and user feedback.
 * 
 * Usage:
 * 1. Include in index.html: <script src="sentry-init.js"></script>
 * 2. Set SENTRY_DSN in .env or config
 * 3. Errors are automatically captured
 */

(function() {
  'use strict';

  // Get Sentry DSN from meta tag or config
  const sentryDsnMeta = document.querySelector('meta[name="sentry-dsn"]');
  const SENTRY_DSN = sentryDsnMeta 
    ? sentryDsnMeta.getAttribute('content') 
    : null;

  if (!SENTRY_DSN || SENTRY_DSN === 'YOUR_SENTRY_DSN_HERE') {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  // Initialize Sentry Browser SDK
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: window.location.hostname.includes('staging') ? 'staging' : 'production',
    release: document.querySelector('meta[name="version"]')?.getAttribute('content') || 'unknown',
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of page loads
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    
    integrations: [
      // Session Replay
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
      // Breadcrumbs for debugging
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          'pinkybot.io',
          'app.pinkybot.io',
          'staging.pinkybot.io',
          /^\//,
        ],
      }),
    ],

    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'AbortError',
      // Browser extension errors
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
    ],

    // Ignore errors from third-party scripts
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // Scrub sensitive data
    beforeSend(event, hint) {
      // Remove localStorage data (may contain tokens)
      if (event.contexts && event.contexts.state) {
        delete event.contexts.state;
      }

      // Remove cookies
      if (event.request && event.request.cookies) {
        delete event.request.cookies;
      }

      // Remove authorization headers
      if (event.request && event.request.headers) {
        delete event.request.headers['authorization'];
      }

      // Mask sensitive input values
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(crumb => {
          if (crumb.category === 'ui.input' && crumb.message) {
            const sensitiveFields = ['password', 'token', 'key', 'secret'];
            if (sensitiveFields.some(field => crumb.message.toLowerCase().includes(field))) {
              crumb.message = crumb.message.replace(/value=.+/, 'value=[REDACTED]');
            }
          }
          return crumb;
        });
      }

      return event;
    },

    // Custom error grouping
    beforeBreadcrumb(breadcrumb, hint) {
      // Don't log console.log messages (too noisy)
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },
  });

  // Set user context after login (call this from your auth system)
  window.sentrySetUser = function(user) {
    Sentry.setUser({
      id: user.id || user.userId,
      email: user.email,
      username: user.username || user.name,
    });
  };

  // Clear user context on logout
  window.sentryClearUser = function() {
    Sentry.setUser(null);
  };

  // Add custom context
  window.sentrySetContext = function(name, context) {
    Sentry.setContext(name, context);
  };

  // Capture custom error
  window.sentryCaptureError = function(error, context = {}) {
    Sentry.captureException(error, {
      contexts: { custom: context },
    });
  };

  // Capture message
  window.sentryCaptureMessage = function(message, level = 'info') {
    Sentry.captureMessage(message, level);
  };

  // Add tags
  window.sentrySetTag = function(key, value) {
    Sentry.setTag(key, value);
  };

  // Track page views
  window.sentryPageView = function(pageName) {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${pageName}`,
      level: 'info',
    });
  };

  // Global error handler (backup)
  window.addEventListener('error', (event) => {
    if (event.error) {
      Sentry.captureException(event.error);
    }
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });

  console.log('✅ Sentry initialized (Frontend)');
})();
