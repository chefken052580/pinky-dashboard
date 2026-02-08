/**
 * Lazy Loader for PinkyBot Dashboard
 * Dynamically loads view-specific scripts only when needed
 * Improves initial page load by deferring non-critical JS
 */

class LazyLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.loadingPromises = new Map();
    
    // Define which scripts are needed for each view
    this.viewScripts = {
      'wordpress': [
        'wordpress-page-maker.js',
        'api-config.js'
      ],
      'export': [
        'export-package-ui.js'
      ],
      'about': [
        'about-page.js'
      ],
      'social-media': [
        'social-api-connectors.js',
        'company-manager.js'
      ]
    };
    
    console.log('[LazyLoader] Initialized with', Object.keys(this.viewScripts).length, 'view definitions');
  }
  
  /**
   * Load a script dynamically
   * @param {string} src - Script source path
   * @returns {Promise} Resolves when script loads
   */
  loadScript(src) {
    // Check if already loaded
    if (this.loadedScripts.has(src)) {
      console.log('[LazyLoader] Script already loaded:', src);
      return Promise.resolve();
    }
    
    // Check if currently loading
    if (this.loadingPromises.has(src)) {
      console.log('[LazyLoader] Script already loading:', src);
      return this.loadingPromises.get(src);
    }
    
    // Create new script element
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      
      script.onload = () => {
        this.loadedScripts.add(src);
        this.loadingPromises.delete(src);
        console.log('[LazyLoader] ✅ Loaded:', src);
        resolve();
      };
      
      script.onerror = () => {
        this.loadingPromises.delete(src);
        console.error('[LazyLoader] ❌ Failed to load:', src);
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      document.body.appendChild(script);
      console.log('[LazyLoader] 🔄 Loading:', src);
    });
    
    this.loadingPromises.set(src, promise);
    return promise;
  }
  
  /**
   * Load all scripts for a specific view
   * @param {string} viewName - View name (e.g., 'wordpress', 'export')
   * @returns {Promise} Resolves when all view scripts load
   */
  async loadViewScripts(viewName) {
    const scripts = this.viewScripts[viewName];
    
    if (!scripts || scripts.length === 0) {
      console.log('[LazyLoader] No scripts defined for view:', viewName);
      return;
    }
    
    console.log('[LazyLoader] Loading', scripts.length, 'scripts for view:', viewName);
    
    try {
      await Promise.all(scripts.map(src => this.loadScript(src)));
      console.log('[LazyLoader] ✅ All scripts loaded for:', viewName);
    } catch (err) {
      console.error('[LazyLoader] ❌ Error loading scripts for:', viewName, err);
      throw err;
    }
  }
  
  /**
   * Preload scripts in the background (low priority)
   * Useful for warming up likely-to-be-used views
   * @param {string} viewName - View name to preload
   */
  preloadView(viewName) {
    setTimeout(() => {
      this.loadViewScripts(viewName).catch(err => {
        console.log('[LazyLoader] Preload failed for:', viewName, err.message);
      });
    }, 2000); // Preload after 2 seconds of idle
  }
  
  /**
   * Get list of views that can be lazy-loaded
   * @returns {Array<string>} View names
   */
  getAvailableViews() {
    return Object.keys(this.viewScripts);
  }
  
  /**
   * Check if a view's scripts are loaded
   * @param {string} viewName - View name
   * @returns {boolean} True if loaded
   */
  isViewLoaded(viewName) {
    const scripts = this.viewScripts[viewName];
    if (!scripts) return false;
    
    return scripts.every(src => this.loadedScripts.has(src));
  }
}

// Initialize global lazy loader
window.lazyLoader = new LazyLoader();

// Intercept view switching to lazy-load scripts
const originalSwitchToView = window.switchToView;

if (typeof originalSwitchToView === 'function') {
  window.switchToView = function(viewName) {
    console.log('[LazyLoader] Intercepted switchToView:', viewName);
    
    // Check if this view needs lazy-loaded scripts
    if (window.lazyLoader.viewScripts[viewName]) {
      // Load scripts first, then switch view
      window.lazyLoader.loadViewScripts(viewName)
        .then(() => {
          originalSwitchToView.call(this, viewName);
        })
        .catch(err => {
          console.error('[LazyLoader] Failed to load view:', viewName, err);
          // Still try to switch view even if scripts fail
          originalSwitchToView.call(this, viewName);
        });
    } else {
      // No lazy loading needed, switch immediately
      originalSwitchToView.call(this, viewName);
    }
  };
  
  console.log('[LazyLoader] View switch interceptor installed');
}

// Preload likely-to-be-used views after page idle
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Preload Settings and Export (commonly accessed)
    window.lazyLoader.preloadView('export');
    console.log('[LazyLoader] Background preload initiated');
  }, 3000);
});

console.log('[LazyLoader] Ready. Available views:', window.lazyLoader.getAvailableViews().join(', '));
