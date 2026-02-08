/**
 * Load Company Selector Component
 * Injects company-selector.html into the container
 */

(async function() {
    const container = document.getElementById('company-selector-container');
    
    if (!container) {
        console.warn('[Company Selector Loader] Container not found');
        return;
    }
    
    try {
        const response = await fetch('company-selector.html');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const html = await response.text();
        container.innerHTML = html;
        
        console.log('[Company Selector Loader] Component loaded successfully');
        // Init after HTML is ready
        if (window.CompanySelector) { CompanySelector.init(); }
    } catch (error) {
        console.error('[Company Selector Loader] Failed to load:', error);
        container.innerHTML = '<p style="color:#f87171;padding:20px;">Failed to load company selector. Please refresh the page.</p>';
    }
})();
