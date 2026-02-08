/**
 * API Helpers - Centralized fetch wrapper with loading states and error handling
 * PinkyBot.io Dashboard
 */

/**
 * apiFetch - Wrapper for fetch() with loading spinner, retry logic, and error handling
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - fetch options (method, headers, body, etc.)
 * @param {HTMLElement} widgetElement - Optional widget container to show loading spinner on
 * @returns {Promise<object|null>} - Parsed JSON response or null on error
 */
async function apiFetch(url, options = {}, widgetElement = null) {
    const maxRetries = 2;
    const retryDelay = 2000; // 2 seconds
    let attempt = 0;
    let loadingOverlay = null;

    // Show loading spinner if widget element provided
    if (widgetElement) {
        loadingOverlay = showLoadingSpinner(widgetElement);
    }

    // Retry loop
    while (attempt <= maxRetries) {
        try {
            const fullUrl = (url.startsWith("http") ? url : (typeof API_BASE !== "undefined" ? API_BASE : "") + url);
            const response = await fetch(fullUrl, options);
            
            // Remove loading spinner on success
            if (loadingOverlay) {
                removeLoadingSpinner(loadingOverlay);
            }

            // Handle non-OK responses
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse JSON
            const data = await response.json();
            return data;

        } catch (error) {
            attempt++;
            
            // If we still have retries left, wait and try again
            if (attempt <= maxRetries) {
                console.warn(`API fetch failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${retryDelay}ms...`, error);
                await sleep(retryDelay);
                continue;
            }

            // All retries exhausted - show error
            if (loadingOverlay) {
                removeLoadingSpinner(loadingOverlay);
            }

            if (widgetElement) {
                showFriendlyError(widgetElement, error.message, url);
            }

            console.error('API fetch failed after all retries:', error);
            return null;
        }
    }

    return null;
}

/**
 * Show loading spinner overlay on a widget
 * @param {HTMLElement} widgetElement - Widget container
 * @returns {HTMLElement} - Loading overlay element
 */
function showLoadingSpinner(widgetElement) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'api-loading-overlay';
    overlay.innerHTML = `
        <div class="api-loading-spinner"></div>
        <div class="api-loading-text">Loading...</div>
    `;

    // Position relative to widget
    widgetElement.style.position = 'relative';
    widgetElement.appendChild(overlay);

    return overlay;
}

/**
 * Remove loading spinner overlay
 * @param {HTMLElement} overlay - Loading overlay element
 */
function removeLoadingSpinner(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

/**
 * Show friendly error message in widget
 * @param {HTMLElement} widgetElement - Widget container
 * @param {string} errorMessage - Error message
 * @param {string} url - Failed URL
 */
function showFriendlyError(widgetElement, errorMessage, url) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'api-error-message';
    errorDiv.innerHTML = `
        <div class="api-error-icon">⚠️</div>
        <div class="api-error-title">Connection Error</div>
        <div class="api-error-details">Unable to load data from API</div>
        <button class="api-error-retry" onclick="location.reload()">Retry</button>
    `;

    // Clear widget content and show error
    widgetElement.innerHTML = '';
    widgetElement.appendChild(errorDiv);
}

/**
 * Sleep utility for retry delay
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiFetch };
}
