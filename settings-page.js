/**
 * Persistent Settings Page for Pinky Bot Dashboard
 * Handles user preferences, API configuration, bot settings, and UI customization
 */

class SettingsManager {
    constructor() {
        this.storageKey = 'pinkyDashboardSettings';
        this.defaultSettings = {
            // API Configuration
            api: {
                baseUrl: (typeof API_BASE !== 'undefined' ? API_BASE : ''),
                timeout: 5000,
                retryAttempts: 3
            },
            // UI Preferences
            ui: {
                theme: 'dark',
                layout: 'compact',
                soundEnabled: false,
                notificationBadges: true,
                autoRefresh: true,
                refreshInterval: 5000
            },
            // Bot Preferences
            bots: {
                favoriteBots: ['dashboard', 'chat', 'tasks'],
                defaultBot: 'dashboard',
                showInactiveTaskCounts: false
            },
            // Notification Settings
            notifications: {
                taskAlerts: true,
                errorAlerts: true,
                completionChimes: false,
                desktopNotifications: false
            },
            // Dashboard Display
            dashboard: {
                showHeartbeatWidget: true,
                showSystemMonitor: true,
                showActivityFeed: true,
                showTaskStatistics: true,
                compactMode: false
            }
        };
        
        this.settings = this.loadSettings();
    }

    /**
     * Load settings from localStorage or use defaults
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new settings added in updates
                return this.deepMerge(this.defaultSettings, parsed);
            }
        } catch (e) {
            console.error('[Settings] Error loading settings:', e);
        }
        return JSON.parse(JSON.stringify(this.defaultSettings));
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            console.log('[Settings] Saved successfully');
            return true;
        } catch (e) {
            console.error('[Settings] Error saving settings:', e);
            return false;
        }
    }

    /**
     * Deep merge objects for settings updates
     */
    deepMerge(target, source) {
        const result = JSON.parse(JSON.stringify(target));
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    /**
     * Update a specific setting
     */
    updateSetting(path, value) {
        const keys = path.split('.');
        let current = this.settings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        this.saveSettings();
        return true;
    }

    /**
     * Get a specific setting
     */
    getSetting(path) {
        const keys = path.split('.');
        let current = this.settings;
        
        for (const key of keys) {
            if (current && typeof current === 'object') {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }

    /**
     * Reset all settings to defaults
     */
    resetToDefaults() {
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        this.saveSettings();
        return true;
    }

    /**
     * Export settings as JSON file
     */
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pinky-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import settings from JSON file
     */
    importSettings(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    this.settings = this.deepMerge(this.defaultSettings, imported);
                    this.saveSettings();
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsText(file);
        });
    }
}

/**
 * Settings Page UI Renderer
 */
class SettingsPageUI {
    constructor(settingsManager) {
        this.settings = settingsManager;
        this.container = null;
    }

    /**
     * Initialize the settings page
     */
    init() {
        this.container = document.getElementById('settings-view');
        if (!this.container) {
            console.error('[SettingsPage] Container not found');
            return;
        }
        
        this.render();
        this.attachEventListeners();
    }

    /**
     * Main render function
     */
    render() {
        this.container.innerHTML = `
            <div class="settings-container">
                <div class="settings-header">
                    <h2>⚙️ Dashboard Settings</h2>
                    <p>Customize your Pinky Bot experience</p>
                </div>
                
                <div class="settings-tabs">
                    <button class="settings-tab-btn active" data-tab="general">General</button>
                    <button class="settings-tab-btn" data-tab="api">API Config</button>
                    <button class="settings-tab-btn" data-tab="notifications">Notifications</button>
                    <button class="settings-tab-btn" data-tab="dashboard">Dashboard</button>
                    <button class="settings-tab-btn" data-tab="data">Data</button>
                </div>
                
                <div class="settings-content">
                    <!-- General Tab -->
                    <div class="settings-tab active" id="general-tab">
                        ${this.renderGeneralTab()}
                    </div>
                    
                    <!-- API Config Tab -->
                    <div class="settings-tab" id="api-tab">
                        ${this.renderApiTab()}
                    </div>
                    
                    <!-- Notifications Tab -->
                    <div class="settings-tab" id="notifications-tab">
                        ${this.renderNotificationsTab()}
                    </div>
                    
                    <!-- Dashboard Tab -->
                    <div class="settings-tab" id="dashboard-tab">
                        ${this.renderDashboardTab()}
                    </div>
                    
                    <!-- Data Tab -->
                    <div class="settings-tab" id="data-tab">
                        ${this.renderDataTab()}
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="btn btn-secondary" id="reset-settings-btn">🔄 Reset to Defaults</button>
                    <button class="btn btn-primary" id="save-settings-btn">✅ Save Changes</button>
                </div>
                
                <div id="settings-message" class="settings-message hidden"></div>
            </div>
        `;
    }

    /**
     * Render General tab
     */
    renderGeneralTab() {
        const theme = this.settings.getSetting('ui.theme');
        const layout = this.settings.getSetting('ui.layout');
        
        return `
            <div class="settings-section-header">
                <h3>✨ Subscription Tier</h3>
            </div>
            
            <div class="settings-group tier-management">
                <div class="current-tier-display">
                    <span class="tier-badge" id="current-tier-badge">Free Tier</span>
                    <p class="tier-description" id="tier-description">
                        You're on the Free tier with Dashboard, Chat, and TasksBot.
                    </p>
                </div>
                
                <div class="tier-actions">
                    <button class="btn btn-primary" id="toggle-tier-btn" onclick="window.featureGating.showUpgradePrompt('All Premium Features')">
                        Upgrade to Pro
                    </button>
                    <button class="btn btn-secondary" id="demo-tier-toggle" style="margin-left: 10px;">
                        🔄 Demo Tier Toggle
                    </button>
                </div>
                
                <div class="tier-info-box">
                    <strong>💡 Demo Mode:</strong> Use "Demo Tier Toggle" to test Free vs Pro tier restrictions.
                    In production, tier changes would go through payment processing.
                </div>
            </div>
            
            <div class="settings-section-header">
                <h3>🔑 License Key</h3>
            </div>
            
            <div class="settings-group license-key-section">
                <div class="license-key-status" id="license-key-status">
                    <p class="license-status-text" id="license-status-text">
                        No license key activated. Enter your license key below to unlock Pro or Enterprise features.
                    </p>
                    <div class="license-details hidden" id="license-details">
                        <div class="license-detail-row">
                            <span class="label">Tier:</span>
                            <span class="value" id="license-tier">-</span>
                        </div>
                        <div class="license-detail-row">
                            <span class="label">Expires:</span>
                            <span class="value" id="license-expiry">-</span>
                        </div>
                        <div class="license-detail-row">
                            <span class="label">Activations:</span>
                            <span class="value" id="license-activations">-</span>
                        </div>
                    </div>
                </div>
                
                <div class="license-key-input-group">
                    <input 
                        type="text" 
                        id="license-key-input" 
                        class="setting-input license-key-field" 
                        placeholder="PINKY-XXXX-XXXX-XXXX-XXXX"
                        maxlength="29"
                    >
                    <button class="btn btn-primary" id="activate-license-btn">
                        🔓 Activate License
                    </button>
                </div>
                
                <div class="license-message hidden" id="license-message"></div>
                
                <div class="license-actions hidden" id="license-actions">
                    <button class="btn btn-secondary" id="deactivate-license-btn">
                        🔒 Deactivate License
                    </button>
                </div>
            </div>
            
            <div class="settings-section-header">
                <h3>🎨 Appearance</h3>
            </div>
            
            <div class="settings-group">
                <label class="setting-label">
                    <span>🎨 Theme</span>
                    <select id="ui-theme" class="setting-input">
                        <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark Mode</option>
                        <option value="light" ${theme === 'light' ? 'selected' : ''}>Light Mode</option>
                        <option value="auto" ${theme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                    </select>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label">
                    <span>📐 Layout</span>
                    <select id="ui-layout" class="setting-input">
                        <option value="compact" ${layout === 'compact' ? 'selected' : ''}>Compact</option>
                        <option value="expanded" ${layout === 'expanded' ? 'selected' : ''}>Expanded</option>
                    </select>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="ui-sound" ${this.settings.getSetting('ui.soundEnabled') ? 'checked' : ''}>
                    <span>🔊 Enable Sound Effects</span>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="ui-notifications" ${this.settings.getSetting('ui.notificationBadges') ? 'checked' : ''}>
                    <span>🔔 Show Notification Badges</span>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="ui-autorefresh" ${this.settings.getSetting('ui.autoRefresh') ? 'checked' : ''}>
                    <span>🔄 Auto-Refresh Dashboard</span>
                </label>
                <input type="number" id="ui-refresh-interval" class="setting-input-small" 
                    value="${this.settings.getSetting('ui.refreshInterval')}" min="1000" step="1000">
                <span class="setting-hint">milliseconds</span>
            </div>
        `;
    }

    /**
     * Render API Config tab
     */
    renderApiTab() {
        const baseUrl = this.settings.getSetting('api.baseUrl');
        const timeout = this.settings.getSetting('api.timeout');
        const retryAttempts = this.settings.getSetting('api.retryAttempts');
        
        return `
            <div class="settings-group">
                <label class="setting-label">
                    <span>🌐 API Base URL</span>
                    <input type="text" id="api-baseurl" class="setting-input" value="${baseUrl}" placeholder="/api">
                </label>
                <span class="setting-hint">The base URL for all API calls</span>
            </div>
            
            <div class="settings-group">
                <label class="setting-label">
                    <span>⏱️ Request Timeout</span>
                    <input type="number" id="api-timeout" class="setting-input-small" value="${timeout}" min="1000" step="500">
                </label>
                <span class="setting-hint">milliseconds</span>
            </div>
            
            <div class="settings-group">
                <label class="setting-label">
                    <span>🔁 Retry Attempts</span>
                    <input type="number" id="api-retry" class="setting-input-small" value="${retryAttempts}" min="0" max="10">
                </label>
                <span class="setting-hint">Number of times to retry failed requests</span>
            </div>
            
            <div class="settings-group">
                <button class="btn btn-secondary" id="test-api-btn">🧪 Test API Connection</button>
            </div>
        `;
    }

    /**
     * Render Notifications tab
     */
    renderNotificationsTab() {
        return `
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="notif-task" ${this.settings.getSetting('notifications.taskAlerts') ? 'checked' : ''}>
                    <span>🎯 Task Alerts</span>
                </label>
                <span class="setting-hint">Get notified when tasks are assigned or updated</span>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="notif-error" ${this.settings.getSetting('notifications.errorAlerts') ? 'checked' : ''}>
                    <span>❌ Error Alerts</span>
                </label>
                <span class="setting-hint">Get notified when errors occur</span>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="notif-complete" ${this.settings.getSetting('notifications.completionChimes') ? 'checked' : ''}>
                    <span>🎉 Completion Chimes</span>
                </label>
                <span class="setting-hint">Play sound when tasks complete</span>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="notif-desktop" ${this.settings.getSetting('notifications.desktopNotifications') ? 'checked' : ''}>
                    <span>🖥️ Desktop Notifications</span>
                </label>
                <span class="setting-hint">Show browser notifications (requires permission)</span>
            </div>
        `;
    }

    /**
     * Render Dashboard tab
     */
    renderDashboardTab() {
        return `
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="dash-heartbeat" ${this.settings.getSetting('dashboard.showHeartbeatWidget') ? 'checked' : ''}>
                    <span>💓 Show Heartbeat Widget</span>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="dash-system" ${this.settings.getSetting('dashboard.showSystemMonitor') ? 'checked' : ''}>
                    <span>🖥️ Show System Monitor</span>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="dash-activity" ${this.settings.getSetting('dashboard.showActivityFeed') ? 'checked' : ''}>
                    <span>📺 Show Activity Feed</span>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="dash-stats" ${this.settings.getSetting('dashboard.showTaskStatistics') ? 'checked' : ''}>
                    <span>📊 Show Task Statistics</span>
                </label>
            </div>
            
            <div class="settings-group">
                <label class="setting-label checkbox">
                    <input type="checkbox" id="dash-compact" ${this.settings.getSetting('dashboard.compactMode') ? 'checked' : ''}>
                    <span>📦 Compact Mode (Less Spacing)</span>
                </label>
            </div>
        `;
    }

    /**
     * Render Data tab
     */
    renderDataTab() {
        return `
            <div class="settings-group">
                <h3>💾 Settings Management</h3>
            </div>
            
            <div class="settings-group">
                <button class="btn btn-secondary" id="export-settings-btn">📤 Export Settings</button>
                <span class="setting-hint">Download your settings as a JSON file</span>
            </div>
            
            <div class="settings-group">
                <button class="btn btn-secondary" id="import-settings-btn">📥 Import Settings</button>
                <input type="file" id="import-settings-file" class="hidden" accept=".json">
                <span class="setting-hint">Upload a previously exported settings file</span>
            </div>
            
            <div class="settings-group">
                <h3>📊 Dashboard Info</h3>
                <div class="info-box">
                    <p><strong>Settings Storage:</strong> Browser LocalStorage</p>
                    <p><strong>Auto-Save:</strong> Yes (when you click Save)</p>
                    <p><strong>Last Saved:</strong> <span id="last-saved-time">Never</span></p>
                    <p><strong>Settings Size:</strong> <span id="settings-size">Calculating...</span></p>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to form elements
     */
    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Save button
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveAllSettings();
        });
        
        // Reset button
        document.getElementById('reset-settings-btn').addEventListener('click', () => {
            if (confirm('Are you sure? This will reset ALL settings to defaults.')) {
                this.settings.resetToDefaults();
                this.init();
                this.showMessage('✅ Settings reset to defaults', 'success');
            }
        });
        
        // Export button
        document.getElementById('export-settings-btn')?.addEventListener('click', () => {
            this.settings.exportSettings();
            this.showMessage('✅ Settings exported', 'success');
        });
        
        // Import button
        document.getElementById('import-settings-btn')?.addEventListener('click', () => {
            document.getElementById('import-settings-file').click();
        });
        
        document.getElementById('import-settings-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.settings.importSettings(file)
                    .then(() => {
                        this.init();
                        this.showMessage('✅ Settings imported successfully', 'success');
                    })
                    .catch((err) => {
                        this.showMessage('❌ Failed to import settings: ' + err.message, 'error');
                    });
            }
        });
        
        // Test API button
        document.getElementById('test-api-btn')?.addEventListener('click', () => {
            this.testApiConnection();
        });
        
        // License key activation
        document.getElementById('activate-license-btn')?.addEventListener('click', () => {
            this.activateLicenseKey();
        });
        
        // License key deactivation
        document.getElementById('deactivate-license-btn')?.addEventListener('click', () => {
            this.deactivateLicenseKey();
        });
        
        // Load current license status
        this.loadLicenseStatus();
        
        // Update last saved time
        this.updateLastSavedTime();
        this.updateSettingsSize();
    }

    /**
     * Switch between settings tabs
     */
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName + '-tab')?.classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    }

    /**
     * Save all settings from form inputs
     */
    saveAllSettings() {
        try {
            // General tab
            const selectedTheme = document.getElementById('ui-theme').value;
            this.settings.updateSetting('ui.theme', selectedTheme);
            
            // Apply theme immediately via ThemeManager
            if (window.themeManager) {
                window.themeManager.setTheme(selectedTheme);
            }
            this.settings.updateSetting('ui.layout', document.getElementById('ui-layout').value);
            this.settings.updateSetting('ui.soundEnabled', document.getElementById('ui-sound').checked);
            this.settings.updateSetting('ui.notificationBadges', document.getElementById('ui-notifications').checked);
            this.settings.updateSetting('ui.autoRefresh', document.getElementById('ui-autorefresh').checked);
            this.settings.updateSetting('ui.refreshInterval', parseInt(document.getElementById('ui-refresh-interval').value));
            
            // API tab
            this.settings.updateSetting('api.baseUrl', document.getElementById('api-baseurl').value);
            this.settings.updateSetting('api.timeout', parseInt(document.getElementById('api-timeout').value));
            this.settings.updateSetting('api.retryAttempts', parseInt(document.getElementById('api-retry').value));
            
            // Notifications tab
            this.settings.updateSetting('notifications.taskAlerts', document.getElementById('notif-task').checked);
            this.settings.updateSetting('notifications.errorAlerts', document.getElementById('notif-error').checked);
            this.settings.updateSetting('notifications.completionChimes', document.getElementById('notif-complete').checked);
            this.settings.updateSetting('notifications.desktopNotifications', document.getElementById('notif-desktop').checked);
            
            // Dashboard tab
            this.settings.updateSetting('dashboard.showHeartbeatWidget', document.getElementById('dash-heartbeat').checked);
            this.settings.updateSetting('dashboard.showSystemMonitor', document.getElementById('dash-system').checked);
            this.settings.updateSetting('dashboard.showActivityFeed', document.getElementById('dash-activity').checked);
            this.settings.updateSetting('dashboard.showTaskStatistics', document.getElementById('dash-stats').checked);
            this.settings.updateSetting('dashboard.compactMode', document.getElementById('dash-compact').checked);
            
            this.updateLastSavedTime();
            this.showMessage('✅ Settings saved successfully', 'success');
            
        } catch (e) {
            console.error('[Settings] Error saving:', e);
            this.showMessage('❌ Error saving settings', 'error');
        }
    }

    /**
     * Test API connection
     */
    async testApiConnection() {
        const baseUrl = document.getElementById('api-baseurl').value;
        const testBtn = document.getElementById('test-api-btn');
        
        testBtn.disabled = true;
        testBtn.textContent = '⏳ Testing...';
        
        try {
            const response = await fetch(`${baseUrl}/api/health`, { 
                timeout: 5000 
            });
            const data = await response.json();
            
            if (data.status === 'online') {
                this.showMessage('✅ API connection successful! Status: ' + data.status, 'success');
            } else {
                this.showMessage('⚠️ API responded but status is: ' + data.status, 'warning');
            }
        } catch (e) {
            this.showMessage('❌ API connection failed: ' + e.message, 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = '🧪 Test API Connection';
        }
    }

    /**
     * Show message feedback
     */
    showMessage(text, type = 'info') {
        const msgEl = document.getElementById('settings-message');
        msgEl.textContent = text;
        msgEl.className = `settings-message ${type}`;
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, 4000);
    }

    /**
     * Update last saved timestamp
     */
    updateLastSavedTime() {
        const lastSaved = document.getElementById('last-saved-time');
        if (lastSaved) {
            lastSaved.textContent = new Date().toLocaleString();
        }
    }

    /**
     * Update settings file size display
     */
    updateSettingsSize() {
        const sizeEl = document.getElementById('settings-size');
        if (sizeEl) {
            const settingsStr = JSON.stringify(this.settings.settings);
            const bytes = new Blob([settingsStr]).size;
            const kb = (bytes / 1024).toFixed(2);
            sizeEl.textContent = `${kb} KB (${Object.keys(this.settings.settings).length} categories)`;
        }
    }
    
    /**
     * Load current license key status from localStorage
     */
    async loadLicenseStatus() {
        const licenseKey = localStorage.getItem('pinky_license_key');
        
        if (!licenseKey) {
            this.showLicenseStatus('inactive');
            return;
        }
        
        // Validate license key with backend
        try {
            const response = await fetch(`${API_BASE}/licenses/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey })
            });
            
            const data = await response.json();
            
            if (data.valid) {
                this.showLicenseStatus('active', data.license);
                document.getElementById('license-key-input').value = licenseKey;
            } else {
                // Invalid/expired license
                localStorage.removeItem('pinky_license_key');
                this.showLicenseStatus('inactive');
                this.showLicenseMessage(data.error || 'License key is invalid or expired', 'error');
            }
        } catch (error) {
            console.error('[License] Failed to validate license:', error);
            this.showLicenseStatus('inactive');
        }
    }
    
    /**
     * Activate license key
     */
    async activateLicenseKey() {
        const licenseKeyInput = document.getElementById('license-key-input');
        const licenseKey = licenseKeyInput.value.trim();
        
        if (!licenseKey) {
            this.showLicenseMessage('Please enter a license key', 'error');
            return;
        }
        
        // Format check (PINKY-XXXX-XXXX-XXXX-XXXX)
        if (!/^PINKY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(licenseKey)) {
            this.showLicenseMessage('Invalid license key format. Expected: PINKY-XXXX-XXXX-XXXX-XXXX', 'error');
            return;
        }
        
        const activateBtn = document.getElementById('activate-license-btn');
        activateBtn.disabled = true;
        activateBtn.textContent = '🔄 Validating...';
        
        try {
            const response = await fetch(`${API_BASE}/licenses/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey })
            });
            
            const data = await response.json();
            
            if (data.valid) {
                // Store in localStorage
                localStorage.setItem('pinky_license_key', licenseKey);
                
                // Update UI
                this.showLicenseStatus('active', data.license);
                this.showLicenseMessage(`✅ License activated! Tier: ${data.license.tier.toUpperCase()}`, 'success');
                
                // Trigger feature gating update
                if (window.featureGating) {
                    window.featureGating.updateTierFromLicense(data.license.tier);
                }
            } else {
                this.showLicenseMessage(data.error || 'License key is invalid or expired', 'error');
            }
        } catch (error) {
            console.error('[License] Activation failed:', error);
            this.showLicenseMessage('Failed to activate license: ' + error.message, 'error');
        } finally {
            activateBtn.disabled = false;
            activateBtn.textContent = '🔓 Activate License';
        }
    }
    
    /**
     * Deactivate license key
     */
    deactivateLicenseKey() {
        if (!confirm('Are you sure you want to deactivate this license key? You will lose access to Pro/Enterprise features.')) {
            return;
        }
        
        // Remove from localStorage
        localStorage.removeItem('pinky_license_key');
        
        // Reset UI
        this.showLicenseStatus('inactive');
        document.getElementById('license-key-input').value = '';
        this.showLicenseMessage('License key deactivated', 'info');
        
        // Trigger feature gating update
        if (window.featureGating) {
            window.featureGating.updateTierFromLicense('free');
        }
    }
    
    /**
     * Show license status UI
     */
    showLicenseStatus(status, license = null) {
        const statusText = document.getElementById('license-status-text');
        const details = document.getElementById('license-details');
        const actions = document.getElementById('license-actions');
        
        if (status === 'active' && license) {
            statusText.textContent = `✅ License key activated successfully!`;
            statusText.className = 'license-status-text active';
            
            // Show details
            document.getElementById('license-tier').textContent = license.tier.toUpperCase();
            document.getElementById('license-expiry').textContent = license.expiresAt 
                ? new Date(license.expiresAt).toLocaleDateString() 
                : 'Never';
            document.getElementById('license-activations').textContent = 
                `${license.activationCount || 1} / ${license.maxActivations || 'Unlimited'}`;
            
            details.classList.remove('hidden');
            actions.classList.remove('hidden');
        } else {
            statusText.textContent = 'No license key activated. Enter your license key below to unlock Pro or Enterprise features.';
            statusText.className = 'license-status-text inactive';
            
            details.classList.add('hidden');
            actions.classList.add('hidden');
        }
    }
    
    /**
     * Show license message feedback
     */
    showLicenseMessage(text, type = 'info') {
        const msgEl = document.getElementById('license-message');
        msgEl.textContent = text;
        msgEl.className = `license-message ${type}`;
        msgEl.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, 5000);
    }
}

// Initialize Settings when page loads
window.addEventListener('DOMContentLoaded', () => {
    if (!window.settingsManager) {
        window.settingsManager = new SettingsManager();
    }
    
    if (!window.settingsPageUI) {
        window.settingsPageUI = new SettingsPageUI(window.settingsManager);
        // Init will be called when switching to settings view
    }
});

// Make it accessible globally
window.initSettingsPage = function() {
    if (window.settingsPageUI) {
        window.settingsPageUI.init();
    }
};
