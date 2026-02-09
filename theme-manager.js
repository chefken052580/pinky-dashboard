// Theme Manager - Dark/Light Mode Toggle
// Handles theme persistence and real-time switching

class ThemeManager {
    constructor() {
        this.storageKey = 'pinkybot-theme-preference';
        this.themeElement = document.documentElement; // html element
        // Ensure data-theme attribute is set
        this.init();
    }

    init() {
        // Load saved theme preference or use system preference
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        const themeToApply = savedTheme || systemTheme || 'dark';
        
        this.setTheme(themeToApply, false); // false = don't save yet (we're loading)
        console.log('[ThemeManager] Initialized with theme:', themeToApply);
    }

    // Get saved theme from localStorage
    getSavedTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (e) {
            console.warn('[ThemeManager] localStorage unavailable:', e);
            return null;
        }
    }

    // Get system preference (dark/light)
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Set and persist theme
    setTheme(theme, save = true) {
        if (!['dark', 'light', 'auto'].includes(theme)) {
            console.warn('[ThemeManager] Invalid theme:', theme);
            return;
        }

        let actualTheme = theme;
        if (theme === 'auto') {
            actualTheme = this.getSystemTheme();
        }

        // Apply theme to HTML element
        if (actualTheme === 'light') {
            this.themeElement.classList.add('light-mode');
        } else {
            this.themeElement.classList.remove('light-mode');
        }

        // Save preference
        if (save) {
            try {
                localStorage.setItem(this.storageKey, theme);
                console.log('[ThemeManager] Saved theme preference:', theme);
            } catch (e) {
                console.warn('[ThemeManager] Failed to save theme:', e);
            }
        }

        // Emit event for other components to react
        window.dispatchEvent(new CustomEvent('theme-changed', { 
            detail: { theme, actualTheme } 
        }));
    }

    // Get current theme (what's actually applied)
    getCurrentTheme() {
        return this.themeElement.classList.contains('light-mode') ? 'light' : 'dark';
    }

    // Toggle between dark and light
    toggleTheme() {
        const current = this.getCurrentTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
        return next;
    }

    // Create toggle button element
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'theme-toggle-button';
        button.className = 'theme-toggle-btn';
        button.title = 'Toggle Dark/Light Mode';
        button.innerHTML = this.getCurrentTheme() === 'dark' ? '☀️' : '🌙';
        
        button.addEventListener('click', () => {
            const newTheme = this.toggleTheme();
            button.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        });

        return button;
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}
