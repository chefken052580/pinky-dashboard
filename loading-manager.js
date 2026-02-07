/**
 * 🔄 Loading Manager - Centralized loading states and error handling
 * Ensures NO SILENT FAILURES across all API calls
 */

class LoadingManager {
  constructor() {
    this.activeRequests = new Map();
    this.requestCounter = 0;
    this.initStyles();
    this.initToastContainer();
  }

  /**
   * Initialize loading spinner styles
   */
  initStyles() {
    if (document.getElementById('loading-manager-styles')) return;

    const style = document.createElement('style');
    style.id = 'loading-manager-styles';
    style.textContent = `
      /* Global Loading Overlay */
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(26, 26, 46, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
      }

      .loading-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(102, 126, 234, 0.3);
        border-top: 4px solid #00d4ff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .loading-message {
        position: absolute;
        top: 60%;
        color: #00d4ff;
        font-size: 14px;
        font-weight: 500;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Toast Notifications */
      .toast-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      }

      .toast {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid;
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .toast-error {
        border-color: #e74c3c;
      }

      .toast-success {
        border-color: #2ecc71;
      }

      .toast-warning {
        border-color: #f39c12;
      }

      .toast-info {
        border-color: #00d4ff;
      }

      .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .toast-content {
        flex: 1;
      }

      .toast-title {
        font-weight: 600;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .toast-message {
        font-size: 13px;
        color: #aaa;
        line-height: 1.4;
      }

      .toast-close {
        background: none;
        border: none;
        color: #aaa;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .toast-close:hover {
        color: #00d4ff;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      .toast.removing {
        animation: slideOut 0.3s ease-in forwards;
      }

      /* Inline Loading States */
      .inline-loader {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(102, 126, 234, 0.3);
        border-top: 2px solid #00d4ff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        vertical-align: middle;
        margin-left: 8px;
      }

      .widget-loading {
        position: relative;
        opacity: 0.6;
        pointer-events: none;
      }

      .widget-loading::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        border: 3px solid rgba(102, 126, 234, 0.3);
        border-top: 3px solid #00d4ff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize toast container
   */
  initToastContainer() {
    if (document.querySelector('.toast-container')) return;

    const container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  /**
   * Show global loading overlay
   */
  showLoading(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'global-loading-overlay';
    overlay.innerHTML = `
      <div>
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Hide global loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Show widget-specific loading state
   */
  showWidgetLoading(element) {
    if (element && !element.classList.contains('widget-loading')) {
      element.classList.add('widget-loading');
    }
  }

  /**
   * Hide widget-specific loading state
   */
  hideWidgetLoading(element) {
    if (element) {
      element.classList.remove('widget-loading');
    }
  }

  /**
   * Show toast notification
   */
  showToast(type, title, message, duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      error: '❌',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  /**
   * Show error toast
   */
  error(title, message) {
    return this.showToast('error', title, message, 8000);
  }

  /**
   * Show success toast
   */
  success(title, message) {
    return this.showToast('success', title, message, 4000);
  }

  /**
   * Show warning toast
   */
  warning(title, message) {
    return this.showToast('warning', title, message, 6000);
  }

  /**
   * Show info toast
   */
  info(title, message) {
    return this.showToast('info', title, message, 5000);
  }

  /**
   * Enhanced fetch with automatic error handling and loading states
   */
  async fetch(url, options = {}, config = {}) {
    const {
      loadingMessage = 'Loading...',
      errorTitle = 'Request Failed',
      showGlobalLoader = false,
      widgetElement = null,
      silent = false,
      retries = 1,
      timeout = 30000
    } = config;

    const requestId = ++this.requestCounter;

    try {
      // Show loading state
      if (showGlobalLoader) {
        this.showLoading(loadingMessage);
      }
      if (widgetElement) {
        this.showWidgetLoading(widgetElement);
      }

      this.activeRequests.set(requestId, { url, startTime: Date.now() });

      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        ...options,
        signal: controller.signal
      };

      let lastError;
      let attempt = 0;

      // Retry logic
      while (attempt <= retries) {
        try {
          const response = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);

          // Check HTTP status
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          // Parse response
          const contentType = response.headers.get('content-type');
          let data;

          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          // Success!
          this.activeRequests.delete(requestId);

          return { success: true, data, response };

        } catch (err) {
          lastError = err;
          attempt++;

          if (attempt <= retries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      // All retries failed
      throw lastError;

    } catch (error) {
      this.activeRequests.delete(requestId);

      // User-friendly error messages
      let friendlyMessage = error.message;

      if (error.name === 'AbortError') {
        friendlyMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message.includes('Failed to fetch')) {
        friendlyMessage = 'Unable to reach server. Please check your internet connection.';
      } else if (error.message.includes('NetworkError')) {
        friendlyMessage = 'Network error occurred. Please try again.';
      } else if (error.message.includes('HTTP 404')) {
        friendlyMessage = 'Resource not found. The requested data may no longer exist.';
      } else if (error.message.includes('HTTP 500')) {
        friendlyMessage = 'Server error. Please try again in a few moments.';
      } else if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
        friendlyMessage = 'Authentication failed. Please check your credentials.';
      }

      // Show error notification (unless silent)
      if (!silent) {
        this.error(errorTitle, friendlyMessage);
      }

      // Log for debugging
      console.error('[LoadingManager] Fetch failed:', {
        url,
        error: error.message,
        stack: error.stack
      });

      return { success: false, error: friendlyMessage, originalError: error };

    } finally {
      // Always hide loading states
      if (showGlobalLoader) {
        this.hideLoading();
      }
      if (widgetElement) {
        this.hideWidgetLoading(widgetElement);
      }
    }
  }

  /**
   * Get active request count
   */
  getActiveRequestCount() {
    return this.activeRequests.size;
  }

  /**
   * Get all active requests
   */
  getActiveRequests() {
    return Array.from(this.activeRequests.values());
  }

  /**
   * Cancel all active requests
   */
  cancelAll() {
    this.activeRequests.clear();
    this.hideLoading();
  }
}

// Create global instance
window.loadingManager = new LoadingManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingManager;
}
