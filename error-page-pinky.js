/**
 * 🐭 ERROR PAGE WITH PINKY PERSONALITY
 * Shows errors in a fun, engaging way that matches Pinky's character
 */

class PinkyErrorHandler {
  constructor() {
    this.isVisible = false;
    this.errorStack = [];
    this.autoHideTimer = null;
    this.createErrorContainer();
  }

  createErrorContainer() {
    if (document.getElementById('pinky-error-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'pinky-error-overlay';
    overlay.innerHTML = `
      <div class="pinky-error-modal">
        <div class="pinky-error-header">
          <span class="pinky-error-icon">🐭</span>
          <h2>Oops! Pinky's in a pickle!</h2>
          <button class="pinky-error-close" aria-label="Close error">×</button>
        </div>
        <div class="pinky-error-body">
          <div class="pinky-error-message"></div>
          <div class="pinky-error-details"></div>
          <div class="pinky-error-suggestion"></div>
        </div>
        <div class="pinky-error-footer">
          <button class="pinky-error-retry">Try Again</button>
          <button class="pinky-error-dismiss">Dismiss</button>
          <button class="pinky-error-report">Report Issue</button>
        </div>
        <div class="pinky-error-footer-note">
          *NARF!* — Pinky's having trouble, but Brain believes you can fix this!
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners with null checks
    const closeBtn = document.querySelector('.pinky-error-close');
    const dismissBtn = document.querySelector('.pinky-error-dismiss');
    const retryBtn = document.querySelector('.pinky-error-retry');
    const reportBtn = document.querySelector('.pinky-error-report');
    
    if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
    if (dismissBtn) dismissBtn.addEventListener('click', () => this.hide());
    if (retryBtn) retryBtn.addEventListener('click', () => this.retry());
    if (reportBtn) reportBtn.addEventListener('click', () => this.report());
  }

  show(errorData) {
    const {
      title = 'Something went wrong',
      message = 'Pinky encountered an unexpected problem',
      details = '',
      type = 'error', // error, warning, info
      suggestion = '',
      retryFn = null,
      autoHide = false,
      timeout = 8000,
    } = errorData;

    // Store error for potential retry
    this.currentError = { title, message, details, type, suggestion, retryFn };
    this.errorStack.push(errorData);

    const modal = document.querySelector('.pinky-error-modal');
    const overlay = document.getElementById('pinky-error-overlay');

    // Set type class
    modal.className = `pinky-error-modal pinky-error-${type}`;

    // Update header
    document.querySelector('.pinky-error-header h2').textContent = title;
    document.querySelector('.pinky-error-icon').textContent =
      type === 'warning' ? '⚠️' : type === 'info' ? 'ℹ️' : '🐭';

    // Update message
    const messageEl = document.querySelector('.pinky-error-message');
    messageEl.textContent = message;

    // Update details
    const detailsEl = document.querySelector('.pinky-error-details');
    if (details) {
      detailsEl.innerHTML = `<details><summary>Technical Details</summary><code>${this.escapeHtml(details)}</code></details>`;
      detailsEl.style.display = 'block';
    } else {
      detailsEl.style.display = 'none';
    }

    // Update suggestion
    const suggestionEl = document.querySelector('.pinky-error-suggestion');
    if (suggestion) {
      suggestionEl.innerHTML = `<p class="pinky-suggestion">💡 Try: ${suggestion}</p>`;
      suggestionEl.style.display = 'block';
    } else {
      suggestionEl.style.display = 'none';
    }

    // Update retry button
    const retryBtn = document.querySelector('.pinky-error-retry');
    retryBtn.style.display = retryFn ? 'inline-block' : 'none';

    // Show overlay
    overlay.classList.add('show');
    this.isVisible = true;

    // Auto-hide if requested
    if (autoHide) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = setTimeout(() => this.hide(), timeout);
    }
  }

  hide() {
    const overlay = document.getElementById('pinky-error-overlay');
    overlay.classList.remove('show');
    this.isVisible = false;
    clearTimeout(this.autoHideTimer);
  }

  retry() {
    if (this.currentError && this.currentError.retryFn) {
      this.hide();
      this.currentError.retryFn();
    }
  }

  report() {
    const errorData = JSON.stringify(this.currentError, null, 2);
    const timestamp = new Date().toISOString();
    const report = `Error Report — ${timestamp}\n\n${errorData}`;

    // Copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
      alert('Error report copied to clipboard! Share this with Pinky.');
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Specific error helpers for common scenarios
  apiError(endpoint, status, message) {
    this.show({
      title: '⚡ API Connection Failed',
      message: `Couldn't reach ${endpoint}`,
      details: `Status ${status}: ${message}`,
      type: 'error',
      suggestion: 'Check your internet connection and try again',
      autoHide: true,
      timeout: 10000,
    });
  }

  validationError(field, message) {
    this.show({
      title: '📝 Validation Error',
      message: `Something's wrong with your input`,
      details: `Field: ${field}\nError: ${message}`,
      type: 'warning',
      suggestion: `Check your ${field} and try again`,
    });
  }

  permissionError(resource) {
    this.show({
      title: '🔒 Permission Denied',
      message: `Pinky doesn't have permission to access this`,
      details: `Resource: ${resource}`,
      type: 'warning',
      suggestion: 'Ask Brain for access to this feature',
    });
  }

  notFoundError(resource) {
    this.show({
      title: '🔍 Not Found',
      message: `Pinky can't find ${resource}`,
      type: 'info',
      suggestion: 'It might have been deleted. Check your spelling?',
    });
  }

  timeoutError() {
    this.show({
      title: '⏱️ Request Timeout',
      message: 'The request took too long and timed out',
      type: 'warning',
      suggestion: 'Check your internet connection and try again',
      autoHide: true,
      timeout: 8000,
    });
  }

  parseError(data) {
    this.show({
      title: '❌ Data Parse Error',
      message: 'Pinky received unexpected data format',
      details: `Could not parse: ${typeof data}`,
      type: 'error',
      suggestion: 'The server might be having issues. Try refreshing the page',
    });
  }
}

// Create global instance
const pinkyErrorHandler = new PinkyErrorHandler();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PinkyErrorHandler;
}
