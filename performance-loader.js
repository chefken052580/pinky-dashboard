/**
 * Performance Loader - Lazy load non-critical features
 * Ensures dashboard loads in under 3 seconds
 * 
 * Strategy:
 * 1. Load critical CSS/JS immediately (core UI)
 * 2. Defer bot-specific modules until bot is activated
 * 3. Lazy load widgets only when visible
 * 4. Bundle and minify resources
 */

class PerformanceLoader {
    constructor() {
        this.loadedModules = new Set();
        this.pendingLoads = new Map();
        this.criticalResources = [
            'styles.css',
            'mobile-responsive.css',
            'renderer.js',
            'theme-manager.js',
            'loading-manager.js'
        ];
        
        // Track load performance
        this.metrics = {
            startTime: performance.now(),
            deferredModules: 0,
            lazyLoadedResources: 0
        };
    }

    /**
     * Load CSS asynchronously with callback
     */
    loadCSS(href, critical = false) {
        if (this.loadedModules.has(href)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            if (!critical) {
                link.media = 'print';
                link.onload = () => {
                    link.media = 'all';
                    this.loadedModules.add(href);
                    resolve();
                };
            } else {
                link.onload = () => {
                    this.loadedModules.add(href);
                    resolve();
                };
            }
            
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Load JavaScript asynchronously
     */
    loadJS(src, defer = true) {
        if (this.loadedModules.has(src)) {
            return Promise.resolve();
        }

        // Check if already loading
        if (this.pendingLoads.has(src)) {
            return this.pendingLoads.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            if (defer) script.defer = true;
            
            script.onload = () => {
                this.loadedModules.add(src);
                this.pendingLoads.delete(src);
                this.metrics.lazyLoadedResources++;
                resolve();
            };
            
            script.onerror = () => {
                this.pendingLoads.delete(src);
                reject(new Error(`Failed to load: ${src}`));
            };
            
            document.body.appendChild(script);
        });

        this.pendingLoads.set(src, promise);
        return promise;
    }

    /**
     * Load bot-specific modules on demand
     */
    async loadBotModule(botName) {
        const moduleMap = {
            'tasks': ['tasks-bot-enhanced.js', 'task-analytics.js', 'task-history-chart.js', 'task-statistics.js'],
            'chat': ['pinky-chat.js', 'pinky-chat.css'],
            'filesystem': ['filesystem-bot-llm.js'],
            'social': ['social-bot-ui.js', 'social-api-connectors.js', 'wordpress-page-maker.js'],
            'settings': ['settings-page.js', 'settings.css'],
            'analytics': ['analytics-advanced.js', 'token-allocation-widget.js'],
            'health': ['system-health-widget.js', 'system-monitor-ui.js'],
            'export': ['export-package.js', 'export-package-ui.js', 'export-package.css']
        };

        const modules = moduleMap[botName] || [];
        const loadPromises = modules.map(module => {
            if (module.endsWith('.css')) {
                return this.loadCSS(module);
            } else {
                return this.loadJS(module);
            }
        });

        await Promise.all(loadPromises);
        console.log(`✅ Loaded ${botName} modules:`, modules.length);
    }

    /**
     * Load widget only when it enters viewport (Intersection Observer)
     */
    lazyLoadWidget(widgetElement, jsFiles = [], cssFiles = []) {
        const observer = new IntersectionObserver(async (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    // Load resources
                    const promises = [
                        ...jsFiles.map(f => this.loadJS(f)),
                        ...cssFiles.map(f => this.loadCSS(f))
                    ];
                    
                    try {
                        await Promise.all(promises);
                        widgetElement.classList.add('loaded');
                    } catch (err) {
                        console.error('Widget load failed:', err);
                    }
                    
                    observer.unobserve(widgetElement);
                }
            }
        }, { rootMargin: '50px' });

        observer.observe(widgetElement);
    }

    /**
     * Defer non-critical CSS
     */
    deferNonCriticalCSS() {
        const nonCriticalCSS = [
            'task-statistics.css',
            'task-history-chart.css',
            'task-timer.css',
            'settings.css',
            'export-package.css',
            'system-health-widget.css',
            'changelog-widget.css',
            'error-page-pinky.css',
            'notification-sounds.css',
            'task-analytics.css',
            'tooltip-system.css',
            'about-page.css',
            'wordpress-page-maker.css',
            'approval-queue.css',
            'token-allocation-widget.css',
            'task-search-filter.css',
            'keyboard-shortcuts.css',
            'file-attachment-module.css'
        ];

        nonCriticalCSS.forEach(css => this.loadCSS(css, false));
        this.metrics.deferredModules += nonCriticalCSS.length;
    }

    /**
     * Defer non-critical JavaScript
     */
    deferNonCriticalJS() {
        const nonCriticalJS = [
            'file-attachment-manager.js',
            'file-attachment-module.js',
            'task-timer.js',
            'task-queue-integration.js',
            'metrics-persistence.js',
            'health-dashboard.js',
            'changelog-widget.js',
            'loading-animation.js',
            'error-page-pinky.js',
            'notification-sounds.js',
            'tooltip-system.js',
            'about-page.js',
            'keyboard-shortcuts.js',
            'company-manager.js',
            'wordpress-bot-framework.js',
            'research-bot-framework.js'
        ];

        // Load after initial render
        requestIdleCallback(() => {
            nonCriticalJS.forEach(js => {
                this.loadJS(js, true).catch(err => {
                    console.warn(`Deferred load failed: ${js}`, err);
                });
            });
            this.metrics.deferredModules += nonCriticalJS.length;
        }, { timeout: 2000 });
    }

    /**
     * Preload critical resources with <link rel="preload">
     */
    preloadCriticalResources() {
        const critical = [
            { href: 'styles.css', as: 'style' },
            { href: 'mobile-responsive.css', as: 'style' },
            { href: 'renderer.js', as: 'script' }
        ];

        critical.forEach(({ href, as }) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = href;
            link.as = as;
            document.head.appendChild(link);
        });
    }

    /**
     * Report performance metrics
     */
    getMetrics() {
        const loadTime = performance.now() - this.metrics.startTime;
        
        return {
            loadTime: `${(loadTime / 1000).toFixed(2)}s`,
            deferredModules: this.metrics.deferredModules,
            lazyLoadedResources: this.metrics.lazyLoadedResources,
            totalModulesLoaded: this.loadedModules.size,
            navigationTiming: performance.getEntriesByType('navigation')[0]
        };
    }

    /**
     * Initialize performance optimizations
     */
    init() {
        console.log('⚡ PerformanceLoader: Initializing...');
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Defer non-critical resources after page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.deferNonCriticalCSS();
                this.deferNonCriticalJS();
            });
        } else {
            this.deferNonCriticalCSS();
            this.deferNonCriticalJS();
        }
        
        // Log performance after 3 seconds
        setTimeout(() => {
            const metrics = this.getMetrics();
            console.log('⚡ Performance Metrics:', metrics);
            
            // Visual feedback in console
            if (parseFloat(metrics.loadTime) < 3.0) {
                console.log('✅ GOAL MET: Dashboard loaded in under 3 seconds!');
            } else {
                console.warn('⚠️ GOAL MISSED: Dashboard took longer than 3 seconds');
            }
        }, 3000);
    }
}

// Global instance
window.performanceLoader = new PerformanceLoader();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceLoader.init();
    });
} else {
    window.performanceLoader.init();
}
