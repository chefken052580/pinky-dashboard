/**
 * KEYBOARD SHORTCUTS MANAGER
 * Global keyboard shortcuts for quick navigation
 * T = Tasks, S = Settings, A = Analytics, C = Chat, ESC = Close
 */

class KeyboardShortcuts {
    constructor() {
        this.enabled = true;
        this.shortcuts = {
            'T': { view: 'tasks', label: 'Tasks Bot' },
            'S': { view: 'settings', label: 'Settings' },
            'A': { view: 'analytics', label: 'Analytics' },
            'C': { view: 'chat', label: 'Chat' },
            'H': { view: 'about', label: 'About / Help' },
            'M': { view: 'social-media', label: 'Social Media' },
            'E': { view: 'export', label: 'Export' },
            '?': { action: 'showHelp', label: 'Show Shortcuts' },
            'Escape': { action: 'closePanel', label: 'Close Panel' }
        };
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        console.log('[KeyboardShortcuts] Initializing...');
        
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        this.initialized = true;
        console.log('[KeyboardShortcuts] Ready (Press ? for help)');
    }

    /**
     * Handle keydown events
     */
    handleKeydown(event) {
        if (!this.enabled) return;

        // Skip if user is typing in an input
        const targetTag = event.target.tagName.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea') {
            return;
        }

        const key = event.key.toUpperCase();
        const shortcut = this.shortcuts[key] || this.shortcuts[event.key];

        if (!shortcut) return;

        // Only proceed if Ctrl/Cmd is not pressed (avoid conflicts with browser shortcuts)
        if (event.ctrlKey || event.metaKey) return;

        event.preventDefault();

        if (shortcut.action) {
            this.executeAction(shortcut.action);
        } else if (shortcut.view) {
            this.navigateToView(shortcut.view);
        }
    }

    /**
     * Navigate to a specific view
     */
    navigateToView(viewName) {
        console.log(`[KeyboardShortcuts] Navigating to: ${viewName}`);
        
        // Find and click the corresponding view button
        const button = document.querySelector(`[data-view="${viewName}"], [data-bot="${viewName}"]`);
        if (button) {
            button.click();
            this.showNotification(`📌 Switched to ${viewName}`);
        } else {
            console.warn(`[KeyboardShortcuts] View not found: ${viewName}`);
        }
    }

    /**
     * Execute special actions
     */
    executeAction(action) {
        switch (action) {
            case 'showHelp':
                this.showHelpDialog();
                break;
            case 'closePanel':
                this.closeActivePanel();
                break;
            default:
                console.warn(`[KeyboardShortcuts] Unknown action: ${action}`);
        }
    }

    /**
     * Show help dialog with all shortcuts
     */
    showHelpDialog() {
        const shortcuts = [
            { key: 'T', action: 'Tasks Bot' },
            { key: 'S', action: 'Settings' },
            { key: 'A', action: 'Analytics' },
            { key: 'C', action: 'Chat' },
            { key: 'H', action: 'About / Help' },
            { key: 'M', action: 'Social Media' },
            { key: 'E', action: 'Export' },
            { key: '?', action: 'Show this help' },
            { key: 'ESC', action: 'Close Panel' }
        ];

        let html = `
            <div class="shortcuts-dialog">
                <div class="shortcuts-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button class="shortcuts-close" onclick="this.closest('.shortcuts-dialog').remove()">✕</button>
                </div>
                <div class="shortcuts-list">
        `;

        shortcuts.forEach(({ key, action }) => {
            html += `
                <div class="shortcut-item">
                    <kbd>${key}</kbd>
                    <span>${action}</span>
                </div>
            `;
        });

        html += `
                </div>
                <p class="shortcuts-hint">Press ESC or click ✕ to close</p>
            </div>
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'shortcuts-modal';
        modal.innerHTML = html;
        document.body.appendChild(modal);

        // Close on ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        console.log('[KeyboardShortcuts] Help dialog opened');
    }

    /**
     * Close active panels/dialogs
     */
    closeActivePanel() {
        // Close dropdowns
        const dropdowns = document.querySelectorAll('.dropdown.open, .hidden');
        dropdowns.forEach(el => {
            if (el.classList.contains('open')) {
                el.classList.remove('open');
            }
        });

        // Close modals
        const modals = document.querySelectorAll('.modal.open, .dialog.open');
        modals.forEach(el => el.remove());

        console.log('[KeyboardShortcuts] Closed active panels');
    }

    /**
     * Show temporary notification
     */
    showNotification(message) {
        const notif = document.createElement('div');
        notif.className = 'keyboard-shortcut-notification';
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.classList.add('show');
        }, 10);

        setTimeout(() => {
            notif.remove();
        }, 2000);
    }

    /**
     * Enable/disable shortcuts
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`[KeyboardShortcuts] ${enabled ? 'Enabled' : 'Disabled'}`);
    }

    /**
     * Get all shortcuts
     */
    getShortcuts() {
        return this.shortcuts;
    }

    destroy() {
        this.enabled = false;
        this.initialized = false;
    }
}

// Create global instance
let keyboardShortcuts = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!keyboardShortcuts) {
        keyboardShortcuts = new KeyboardShortcuts();
        keyboardShortcuts.init();
    }
});

// Expose to window
window.KeyboardShortcuts = KeyboardShortcuts;
window.keyboardShortcuts = () => keyboardShortcuts;
