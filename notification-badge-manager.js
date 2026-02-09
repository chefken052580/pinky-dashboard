/**
 * NOTIFICATION BADGE MANAGER
 * Shows badge counts on sidebar nav items
 */

class NotificationBadgeManager {
    constructor() {
        this.badgeMap = {
            'chat': { selector: '.chat-badge', source: 'chat-messages' },
            'tasks': { selector: '.tasks-badge', source: 'pending-tasks' },
            'filesystem': { selector: '.filesystem-badge', source: 'filesystem-events' },
            'docs': { selector: '.docs-badge', source: 'doc-updates' },
            'research': { selector: '.research-badge', source: 'research-results' },
            'code': { selector: '.code-badge', source: 'code-reviews' },
            'social': { selector: '.social-badge', source: 'social-notifications' },
            'business': { selector: '.business-badge', source: 'business-tasks' }
        };
        this.updateInterval = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        console.log('[NotificationBadges] Initializing...');
        
        // Initial update
        await this.updateAllBadges();
        
        // Set up periodic updates (every 30 seconds)
        // DISABLED this.updateInterval = setInterval(() => {
        //     this.updateAllBadges();
        // }, 30000);
        
        this.initialized = true;
        console.log('[NotificationBadges] Initialized');
    }

    /**
     * Update all badge counts
     */
    async updateAllBadges() {
        try {
            // Fetch pending tasks for Tasks badge
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const tasks = await response.json();
                if (Array.isArray(tasks)) {
                    const pendingCount = tasks.filter(t => t.status === 'pending').length;
                    this.updateBadge('tasks', pendingCount);
                }
            }
        } catch (error) {
            console.warn('[NotificationBadges] Error fetching task counts:', error);
        }

        // Update other badges with example logic
        this.updateBadgeFromStorage('chat', 'unread-messages');
        this.updateBadgeFromStorage('research', 'research-tasks');
        this.updateBadgeFromStorage('code', 'code-tasks');
        this.updateBadgeFromStorage('social', 'social-tasks');
        this.updateBadgeFromStorage('business', 'business-tasks');
        this.updateBadgeFromStorage('docs', 'doc-tasks');
        this.updateBadgeFromStorage('filesystem', 'filesystem-tasks');
    }

    /**
     * Update a single badge
     */
    updateBadge(botName, count) {
        const config = this.badgeMap[botName];
        if (!config) return;

        const badge = document.querySelector(config.selector);
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        console.log(`[NotificationBadges] Updated ${botName}: ${count}`);
    }

    /**
     * Update badge from localStorage (for custom counts)
     */
    updateBadgeFromStorage(botName, storageKey) {
        try {
            const count = parseInt(localStorage.getItem(storageKey) || '0');
            this.updateBadge(botName, count);
        } catch (e) {
            console.warn(`[NotificationBadges] Could not read ${storageKey}`);
        }
    }

    /**
     * Increment badge count (for realtime updates)
     */
    incrementBadge(botName) {
        const config = this.badgeMap[botName];
        if (!config) return;

        const badge = document.querySelector(config.selector);
        if (!badge) return;

        const current = parseInt(badge.textContent || '0');
        const newCount = current + 1;
        this.updateBadge(botName, newCount);
    }

    /**
     * Clear badge (set count to 0)
     */
    clearBadge(botName) {
        this.updateBadge(botName, 0);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.initialized = false;
    }
}

// Create global instance
let notificationBadgeManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!notificationBadgeManager) {
        notificationBadgeManager = new NotificationBadgeManager();
        notificationBadgeManager.init();
    }
});

// Expose to window
window.NotificationBadgeManager = NotificationBadgeManager;
window.notificationBadgeManager = () => notificationBadgeManager;
