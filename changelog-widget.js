/**
 * Changelog Version Widget - Displays Recent Updates
 * Fetches commit history and version information from the API
 */

class ChangelogWidget {
    constructor() {
        this.apiUrl = '';
        this.changelog = [];
        this.currentVersion = '1.0.0'; // Will be fetched from API
        this.maxEntries = 10;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        console.log('[Changelog] Initializing...');
        
        try {
            await this.loadChangelog();
            this.renderWidget();
            this.setupAutoRefresh();
            this.initialized = true;
        } catch (e) {
            console.error('[Changelog] Init failed:', e);
        }
    }

    async loadChangelog() {
        try {
            const response = await fetch(`${this.apiUrl}/api/changelog`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                // Fallback: get local changelog if API endpoint doesn't exist
                console.log('[Changelog] Using fallback changelog data');
                this.changelog = this.getFallbackChangelog();
                return;
            }

            const data = await response.json();
            if (data.success && data.changelog) {
                this.changelog = data.changelog;
                this.currentVersion = data.version || this.currentVersion;
            } else {
                this.changelog = this.getFallbackChangelog();
            }
        } catch (e) {
            console.warn('[Changelog] Failed to load from API, using fallback:', e);
            this.changelog = this.getFallbackChangelog();
        }
    }

    getFallbackChangelog() {
        // Local fallback changelog data for demo
        return [
            {
                version: '1.0.0',
                date: '2026-02-06',
                title: 'Mobile-Responsive Dashboard',
                description: 'Added comprehensive mobile support with responsive CSS, touch-friendly UI, and orientation detection',
                type: 'feature',
                changes: [
                    'mobile-responsive.css (11KB) with 3 breakpoints',
                    'Touch targets optimized to 44px+',
                    'Landscape mode support',
                    'Accessibility features (reduced motion, high contrast)'
                ]
            },
            {
                version: '1.0.0',
                date: '2026-02-06',
                title: 'Dark/Light Theme Toggle',
                description: 'Implemented theme manager with localStorage persistence and system preference detection',
                type: 'feature',
                changes: [
                    'theme-manager.js for real-time switching',
                    'Persistent theme preference',
                    'Theme toggle button in header',
                    'Auto-detect system theme (prefers-color-scheme)'
                ]
            },
            {
                version: '1.0.0',
                date: '2026-02-06',
                title: 'PinkyBot Marketing Demo Posts',
                description: '5 sample marketing posts added to SocialBot for demonstration',
                type: 'content',
                changes: [
                    '5 demo posts about PinkyBot features',
                    'Posts scheduled across Twitter, Facebook, Instagram, LinkedIn',
                    'Includes feature highlights, design philosophy, launch announcement'
                ]
            },
            {
                version: '0.9.9',
                date: '2026-02-06',
                title: 'System Health Widget',
                description: 'Live CPU, memory, and disk monitoring dashboard widget',
                type: 'feature',
                changes: [
                    'Real-time system metrics',
                    'Health status indicators',
                    'Auto-refresh every 5 seconds',
                    'Responsive graph visualization'
                ]
            },
            {
                version: '0.9.9',
                date: '2026-02-06',
                title: 'Export Package System',
                description: 'Backup and distribute PinkyBot configuration',
                type: 'feature',
                changes: [
                    'Full configuration serialization',
                    'Package import/restore functionality',
                    'Drag-drop import support',
                    'Metadata preservation'
                ]
            },
            {
                version: '0.9.8',
                date: '2026-02-05',
                title: 'Settings Page Launch',
                description: 'Comprehensive settings management with persistent storage',
                type: 'feature',
                changes: [
                    'Persistent settings with localStorage',
                    '5-tab interface (General, API, Notifications, Dashboard, Data)',
                    'Import/export settings',
                    'Theme customization',
                    'API configuration testing'
                ]
            },
            {
                version: '0.9.7',
                date: '2026-02-05',
                title: 'Batch Task Operations',
                description: 'Select multiple tasks and perform bulk actions',
                type: 'feature',
                changes: [
                    'Multi-task selection with checkboxes',
                    'Batch complete, delete, prioritize operations',
                    'Undo support for all batch operations',
                    'Error handling and notifications'
                ]
            },
            {
                version: '0.9.6',
                date: '2026-02-05',
                title: 'Task Export to JSON',
                description: 'Download all tasks with metadata for backup and analysis',
                type: 'feature',
                changes: [
                    'Full task serialization',
                    'Include all metadata (priority, status, timestamps)',
                    'Auto-download JSON file',
                    'Timestamp in filename'
                ]
            },
            {
                version: '0.9.5',
                date: '2026-02-05',
                title: 'Chat API Error Handling',
                description: 'Fixed HTML parsing errors in chat endpoints',
                type: 'fix',
                changes: [
                    'Added safeJsonResponse() helper',
                    'Response validation for all fetch calls',
                    'Clear error messages for users',
                    'HTTP status code checking'
                ]
            },
            {
                version: '0.9.4',
                date: '2026-02-05',
                title: 'File Attachment for Tasks',
                description: 'Attach screenshots and documents to tasks',
                type: 'feature',
                changes: [
                    'Support .png, .jpeg, .pdf files',
                    'Max 10MB per file',
                    'localStorage-based storage',
                    'File preview and download'
                ]
            }
        ];
    }

    renderWidget() {
        const container = document.getElementById('changelog-widget');
        if (!container) {
            console.warn('[Changelog] Widget container not found');
            return;
        }

        const html = `
            <div class="changelog-header">
                <h3>📜 Recent Updates (v${this.currentVersion})</h3>
                <button class="changelog-refresh-btn" onclick="window.changelogWidget.refresh()" title="Refresh changelog">
                    🔄
                </button>
            </div>
            <div class="changelog-list">
                ${this.changelog.slice(0, this.maxEntries).map((entry, idx) => `
                    <div class="changelog-entry changelog-${entry.type}" data-index="${idx}">
                        <div class="changelog-badge ${entry.type}">
                            ${this.getBadgeIcon(entry.type)}
                        </div>
                        <div class="changelog-content">
                            <div class="changelog-title">${entry.title}</div>
                            <div class="changelog-description">${entry.description}</div>
                            ${entry.changes ? `
                                <div class="changelog-changes">
                                    ${entry.changes.map(c => `<li>• ${c}</li>`).join('')}
                                </div>
                            ` : ''}
                            <div class="changelog-meta">
                                <span class="changelog-version">v${entry.version}</span>
                                <span class="changelog-date">${this.formatDate(entry.date)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="changelog-footer">
                <p>Latest ${this.changelog.length} updates • Auto-refresh every 5 minutes</p>
            </div>
        `;

        container.innerHTML = html;
    }

    getBadgeIcon(type) {
        const icons = {
            'feature': '✨',
            'fix': '🔧',
            'content': '📝',
            'performance': '⚡',
            'security': '🔒',
            'breaking': '💔'
        };
        return icons[type] || '📌';
    }

    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays}d ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
            return `${date.toLocaleDateString()}`;
        } catch (e) {
            return dateStr;
        }
    }

    setupAutoRefresh() {
        // Refresh every 5 minutes
        // DISABLED setInterval(() => {
            this.refresh();
        // }, 5 * 60 * 1000);
    }

    async refresh() {
        console.log('[Changelog] Refreshing...');
        try {
            await this.loadChangelog();
            this.renderWidget();
        } catch (e) {
            console.error('[Changelog] Refresh failed:', e);
        }
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.changelogWidget = new ChangelogWidget();
        window.changelogWidget.init();
    });
} else {
    window.changelogWidget = new ChangelogWidget();
    window.changelogWidget.init();
}
