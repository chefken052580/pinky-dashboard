/**
 * ErrorPage - Pinky's Error Display System
 * Handles all error states with personality and functionality
 */

class ErrorPageManager {
  constructor() {
    this.errorPage = null;
    this.isVisible = false;
    this.lastFailedRequest = null;
    this.pinkyQuotes = [
      '"Gee, Brain, what do we do now?" — Pinky 🐭',
      '"Narf! That wasn\'t supposed to happen..." — Pinky',
      '"Poit! Something\'s not right in the Matrix!" — Pinky',
      '"Zort! Error 404: World Domination Plan" — Pinky',
      '"Don\'t worry, we\'ll figure this out! NARF!" — Pinky',
      '"This is just a temporary setback!" — Pinky',
      '"The Brain will know what to do..." — Pinky',
      '"Is it hot in here, or is it just me?" — Pinky',
    ];

    this.errorMessages = {
      'NETWORK_ERROR': 'Network connection failed. Pinky is waiting for the internet!',
      'API_ERROR': 'The backend API went off to world domination without us!',
      'TIMEOUT': 'The server is taking too long. Patience, Pinky!',
      'PARSE_ERROR': 'The data got scrambled in transmission. Zort!',
      'AUTH_ERROR': 'Access denied. You need proper credentials to take over the world!',
      'NOT_FOUND': 'That resource disappeared faster than Pinky after a failed scheme!',
      'SERVER_ERROR': 'The server had a minor explosion. Pretty lights! 💥',
      'UNKNOWN': 'An mysterious error occurred. Even Pinky doesn\'t know what went wrong!'
    };

    this.init();
  }

  init() {
    // Create error page HTML
    this.createErrorPageElement();
    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  createErrorPageElement() {
    const container = document.createElement('div');
    container.id = 'error-page';
    container.className = 'error-page hidden';
    container.innerHTML = `
      <div class="error-container">
        <!-- Pinky ASCII Art -->
        <div class="pinky-art">
          <pre>   /\\_/\\
  ( o.o )  &lt;-- Oops!
   &gt; ^ &lt;
  /|   |\\
 (_|   |_)</pre>
        </div>

        <!-- Error Message -->
        <div class="error-content">
          <h1 class="error-title">Zort! Something went wrong...</h1>
          
          <div class="error-message">
            <p class="error-text" id="error-text">
              An unexpected error occurred. Pinky is scratching his head! 🐭
            </p>
          </div>

          <!-- Error Details (collapsible) -->
          <div class="error-details-wrapper">
            <button class="error-details-toggle" onclick="window.ErrorPageManager.toggleDetails()">
              📋 Show Technical Details
            </button>
            <pre class="error-details hidden" id="error-details"></pre>
          </div>

          <!-- Action Buttons -->
          <div class="error-actions">
            <button class="error-btn retry-btn" onclick="window.ErrorPageManager.retry()">
              🔄 Try Again
            </button>
            <button class="error-btn reload-btn" onclick="window.ErrorPageManager.reload()">
              🏠 Go Home
            </button>
            <button class="error-btn contact-btn" onclick="window.ErrorPageManager.report()">
              📧 Report Bug
            </button>
          </div>

          <!-- Error Code -->
          <div class="error-code">
            Error Code: <span id="error-code">UNKNOWN</span>
          </div>
        </div>

        <!-- Pinky Quotes (random) -->
        <div class="pinky-quote">
          <p id="pinky-quote-text"></p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.errorPage = container;
    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Error Page Styles */
      .error-page {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: white;
      }

      .error-page.hidden {
        display: none !important;
      }

      .error-container {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 60px 40px;
        max-width: 600px;
        width: 90%;
        text-align: center;
        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        border: 1px solid rgba(255, 255, 255, 0.18);
        animation: slideInDown 0.5s ease-out;
      }

      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .pinky-art {
        font-size: 24px;
        line-height: 1.2;
        margin-bottom: 30px;
        font-family: monospace;
        letter-spacing: -2px;
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .error-title {
        font-size: 32px;
        margin: 20px 0 15px;
        font-weight: 600;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        letter-spacing: 1px;
      }

      .error-message {
        background: rgba(255, 255, 255, 0.15);
        padding: 20px;
        border-radius: 12px;
        margin: 20px 0;
        border-left: 4px solid #ffeb3b;
      }

      .error-text {
        margin: 0;
        font-size: 16px;
        line-height: 1.6;
      }

      .error-details-wrapper {
        margin: 20px 0;
        text-align: left;
      }

      .error-details-toggle {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 10px 15px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.3s;
      }

      .error-details-toggle:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateX(5px);
      }

      .error-details {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px;
        border-radius: 6px;
        margin-top: 10px;
        font-size: 12px;
        max-height: 300px;
        overflow-y: auto;
        text-align: left;
        color: #ffeb3b;
        font-family: 'Courier New', monospace;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .error-details.hidden {
        display: none !important;
      }

      .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin: 30px 0;
      }

      .error-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .retry-btn {
        background: #4CAF50;
        color: white;
      }

      .retry-btn:hover {
        background: #45a049;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
      }

      .reload-btn {
        background: #2196F3;
        color: white;
      }

      .reload-btn:hover {
        background: #0b7dda;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
      }

      .contact-btn {
        background: #FF9800;
        color: white;
      }

      .contact-btn:hover {
        background: #e68900;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
      }

      .error-code {
        margin-top: 20px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        font-family: 'Courier New', monospace;
        letter-spacing: 2px;
      }

      .error-code span {
        background: rgba(0, 0, 0, 0.2);
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
      }

      .pinky-quote {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        font-style: italic;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
      }

      .pinky-quote p {
        margin: 0;
        animation: fadeIn 1s ease-in;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Responsive */
      @media (max-width: 600px) {
        .error-container {
          padding: 40px 20px;
        }

        .error-title {
          font-size: 24px;
        }

        .error-actions {
          flex-direction: column;
        }

        .error-btn {
          width: 100%;
        }

        .pinky-art {
          font-size: 18px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.show('RUNTIME_ERROR', event.error?.stack || event.message);
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.show('PROMISE_ERROR', event.reason?.stack || event.reason);
    });

    // Store reference globally
    window.ErrorPageManager = this;
  }

  show(errorCode = 'UNKNOWN', errorDetails = '', customMessage = null) {
    if (!this.errorPage) return;

    // Set error text
    const errorText = document.getElementById('error-text');
    if (errorText) {
      errorText.textContent = customMessage || (this.errorMessages[errorCode] || this.errorMessages['UNKNOWN']);
    }

    // Set error code
    const errorCodeEl = document.getElementById('error-code');
    if (errorCodeEl) {
      errorCodeEl.textContent = errorCode;
    }

    // Set error details if provided
    if (errorDetails) {
      const detailsEl = document.getElementById('error-details');
      if (detailsEl) {
        const detailText = typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2);
        detailsEl.textContent = detailText;
      }
    }

    // Set random Pinky quote
    const quoteText = document.getElementById('pinky-quote-text');
    if (quoteText) {
      quoteText.textContent = this.pinkyQuotes[Math.floor(Math.random() * this.pinkyQuotes.length)];
    }

    // Show the error page
    this.errorPage.classList.remove('hidden');
    this.isVisible = true;
  }

  hide() {
    if (this.errorPage) {
      this.errorPage.classList.add('hidden');
      this.isVisible = false;
    }
  }

  toggleDetails() {
    const details = document.getElementById('error-details');
    if (details) {
      details.classList.toggle('hidden');
      const btn = document.querySelector('.error-details-toggle');
      if (btn) {
        btn.textContent = details.classList.contains('hidden') ? '📋 Show Technical Details' : '📋 Hide Technical Details';
      }
    }
  }

  retry() {
    this.hide();
    if (this.lastFailedRequest) {
      this.lastFailedRequest();
    } else {
      location.reload();
    }
  }

  reload() {
    this.hide();
    location.href = '/';
  }

  report() {
    const errorCode = document.getElementById('error-code')?.textContent || 'UNKNOWN';
    const errorText = document.getElementById('error-text')?.textContent || '';
    const details = document.getElementById('error-details')?.textContent || '';

    const errorReport = `
Error Code: ${errorCode}
Message: ${errorText}
Details: ${details}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorReport).then(() => {
      alert('✅ Error report copied to clipboard! Please share it with Brain.');
    }).catch(() => {
      alert('Error report:\n\n' + errorReport);
    });
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ErrorPageManager = new ErrorPageManager();
  });
} else {
  window.ErrorPageManager = new ErrorPageManager();
}
