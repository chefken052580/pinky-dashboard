/**
 * Export Package UI Components
 * Integrates export/import functionality into the dashboard
 */

class ExportPackageUI {
    constructor() {
        this.manager = new ExportPackageManager();
        this.notificationDuration = 3000;
    }

    /**
     * Initialize export package UI in the dashboard
     */
    initializeUI() {
        // Add export section to settings or main dashboard
        this.createExportPanelHTML();
        this.attachEventListeners();
    }

    /**
     * Create the export package panel HTML
     */
    createExportPanelHTML() {
        // Create container
        const container = document.createElement('div');
        container.id = 'export-package-panel';
        container.className = 'export-package-container';
        container.innerHTML = `
            <div class="export-package-header">
                <h3>📦 Export & Import Package</h3>
                <p>Backup and share your Pinky Bot configuration</p>
            </div>

            <div class="export-package-section">
                <h4>📥 Export Options</h4>
                <div class="export-buttons">
                    <button id="export-json-btn" class="btn btn-export-json">
                        📄 Export as JSON
                    </button>
                    <button id="export-config-btn" class="btn btn-export-config">
                        ⚙️ Export as Config
                    </button>
                    <button id="export-summary-btn" class="btn btn-export-summary">
                        📊 Show Summary
                    </button>
                </div>
            </div>

            <div class="export-package-section">
                <h4>📤 Import Configuration</h4>
                <div class="import-area">
                    <input 
                        type="file" 
                        id="import-package-input" 
                        class="import-file-input"
                        accept=".json,.txt"
                        style="display: none;"
                    >
                    <button id="import-package-btn" class="btn btn-import-package">
                        📂 Choose File to Import
                    </button>
                    <p class="import-note">Select a previously exported Pinky package file to restore settings</p>
                </div>
            </div>

            <div class="export-package-section">
                <h4>ℹ️ Package Information</h4>
                <div id="package-info" class="package-info">
                    <p>No package loaded. Export to see details.</p>
                </div>
            </div>

            <div id="export-notifications" class="export-notifications"></div>
        `;

        // Try to add to settings panel if it exists, otherwise add to main container
        const exportView = document.getElementById('export-package-container') || document.querySelector('.settings-container');
        if (exportView) {
            exportView.appendChild(container);
        } else {
            const mainContainer = document.querySelector('.dashboard-main') || 
                                document.querySelector('body');
            mainContainer.appendChild(container);
        }
    }

    /**
     * Attach event listeners to export/import buttons
     */
    attachEventListeners() {
        // Export JSON
        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.handleExportJSON());
        }

        // Export Config
        const exportConfigBtn = document.getElementById('export-config-btn');
        if (exportConfigBtn) {
            exportConfigBtn.addEventListener('click', () => this.handleExportConfig());
        }

        // Show Summary
        const summaryBtn = document.getElementById('export-summary-btn');
        if (summaryBtn) {
            summaryBtn.addEventListener('click', () => this.handleShowSummary());
        }

        // Import Package
        const importBtn = document.getElementById('import-package-btn');
        const importInput = document.getElementById('import-package-input');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', (e) => this.handleImportPackage(e));
        }
    }

    /**
     * Handle export as JSON
     */
    async handleExportJSON() {
        try {
            this.showNotification('📦 Preparing export...', 'info');
            const result = await this.manager.downloadPackage('json');
            
            if (result.success) {
                this.showNotification(
                    `✅ Package exported: ${result.filename}`,
                    'success'
                );
            } else {
                this.showNotification(
                    `❌ Export failed: ${result.error}`,
                    'error'
                );
            }
        } catch (error) {
            this.showNotification(
                `❌ Error: ${error.message}`,
                'error'
            );
        }
    }

    /**
     * Handle export as config
     */
    async handleExportConfig() {
        try {
            this.showNotification('⚙️ Preparing config file...', 'info');
            const result = await this.manager.downloadPackage('config');
            
            if (result.success) {
                this.showNotification(
                    `✅ Config exported: ${result.filename}`,
                    'success'
                );
            } else {
                this.showNotification(
                    `❌ Export failed: ${result.error}`,
                    'error'
                );
            }
        } catch (error) {
            this.showNotification(
                `❌ Error: ${error.message}`,
                'error'
            );
        }
    }

    /**
     * Handle show package summary
     */
    async handleShowSummary() {
        try {
            this.showNotification('📊 Loading package summary...', 'info');
            const summary = await this.manager.getPackageSummary();
            
            const infoDiv = document.getElementById('package-info');
            if (infoDiv) {
                infoDiv.innerHTML = `
                    <div class="summary-details">
                        <p><strong>Package:</strong> ${summary.name} v${summary.version}</p>
                        <p><strong>Exported:</strong> ${new Date(summary.exported).toLocaleString()}</p>
                        <p><strong>Items Included:</strong></p>
                        <ul>
                            <li>Settings: ${summary.itemsIncluded.settings} items</li>
                            <li>Bot Configs: ${summary.itemsIncluded.bots} bots</li>
                            <li>Tasks: ${summary.itemsIncluded.tasks} tasks</li>
                            <li>Activities: ${summary.itemsIncluded.activities} logs</li>
                        </ul>
                        <p><strong>Features:</strong> ${Object.keys(summary.features).filter(k => summary.features[k]).join(', ')}</p>
                    </div>
                `;
            }
            
            this.showNotification('✅ Summary loaded', 'success');
        } catch (error) {
            this.showNotification(
                `❌ Error: ${error.message}`,
                'error'
            );
        }
    }

    /**
     * Handle import package file
     */
    async handleImportPackage(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            this.showNotification('📂 Importing package...', 'info');
            const result = await this.manager.importPackage(file);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                
                // Update info display
                const infoDiv = document.getElementById('package-info');
                if (infoDiv) {
                    infoDiv.innerHTML = `
                        <div class="import-success">
                            <p>${result.message}</p>
                            <p>Items restored: ${result.itemsRestored}</p>
                            <p><strong>⚠️ Please refresh the page to apply all changes.</strong></p>
                        </div>
                    `;
                }
                
                // Suggest refresh
                setTimeout(() => {
                    if (confirm('Refresh dashboard to apply imported settings?')) {
                        location.reload();
                    }
                }, 1000);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            this.showNotification(
                `❌ Import failed: ${error.message}`,
                'error'
            );
        }

        // Reset input
        event.target.value = '';
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('export-notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `export-notification notification-${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);

        // Auto-remove
        setTimeout(() => {
            notification.remove();
        }, this.notificationDuration);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof ExportPackageManager !== 'undefined') {
        const exportUI = new ExportPackageUI();
        exportUI.initializeUI();
    }
});
