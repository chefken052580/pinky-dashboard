/**
 * Pinky Bot Export Package System
 * Creates distributable packages with all settings, configs, and state
 * Enables sharing/backup of entire bot configuration
 */

class ExportPackageManager {
    constructor() {
        this.packageVersion = '1.0.0';
        this.botName = 'PinkyBot';
        this.exportTimestamp = new Date().toISOString();
    }

    /**
     * Collect all exportable data from the dashboard
     * @returns {Object} Complete package data
     */
    async collectPackageData() {
        const packageData = {
            // Metadata
            metadata: {
                name: this.botName,
                version: this.packageVersion,
                exported: this.exportTimestamp,
                exportedFrom: 'Pinky Bot Dashboard v1.0',
            },
            
            // Settings (from localStorage)
            settings: this.getStorageData('pinkyDashboardSettings') || {},
            
            // Bot configurations
            bots: {
                socialbot: this.getStorageData('socialBotConfig') || {},
                filesystembot: this.getStorageData('fileSystemBotConfig') || {},
                tasksbot: this.getStorageData('tasksBotConfig') || {},
                chatbot: this.getStorageData('chatBotConfig') || {},
            },
            
            // Activity and history
            activity: this.getStorageData('pinkyActivity') || [],
            
            // Task data (from API)
            tasks: await this.fetchTaskData(),
            
            // Dashboard preferences
            dashboardPreferences: {
                theme: localStorage.getItem('dashboardTheme') || 'dark',
                layout: localStorage.getItem('dashboardLayout') || 'compact',
                soundEnabled: localStorage.getItem('soundEnabled') === 'true',
            },
            
            // API Configuration (for reference)
            apiConfig: {
                baseUrl: (typeof API_BASE !== 'undefined' ? API_BASE : ''),
                endpoints: [
                    '/api/health',
                    '/api/tasks',
                    '/api/activity',
                    '/api/bots',
                    '/api/notify'
                ]
            },
            
            // Feature flags and state
            features: {
                fileAttachmentEnabled: true,
                batchOperationsEnabled: true,
                persistentSettingsEnabled: true,
                taskStatisticsEnabled: true,
                activityTrackingEnabled: true,
            }
        };
        
        return packageData;
    }

    /**
     * Get data from localStorage safely
     * @param {String} key - Storage key
     * @returns {*} Stored data or null
     */
    getStorageData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn(`Error reading localStorage key "${key}":`, e);
            return null;
        }
    }

    /**
     * Fetch task data from API
     * @returns {Array} Task list
     */
    async fetchTaskData() {
        try {
            const response = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/tasks');
            if (!response.ok) return [];
            const tasks = await response.json();
            return tasks || [];
        } catch (e) {
            console.warn('Error fetching tasks:', e);
            return [];
        }
    }

    /**
     * Generate a distributable JSON package file
     * @returns {Blob} JSON blob ready for download
     */
    async generatePackageJSON() {
        const packageData = await this.collectPackageData();
        const jsonString = JSON.stringify(packageData, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
    }

    /**
     * Generate a configuration file for import
     * @returns {Blob} Config blob
     */
    async generateConfigurationFile() {
        const packageData = await this.collectPackageData();
        
        const configContent = `# Pinky Bot Configuration Package
# Generated: ${packageData.metadata.exported}
# Version: ${packageData.metadata.version}

## SETTINGS
${JSON.stringify(packageData.settings, null, 2)}

## BOT CONFIGURATIONS
${JSON.stringify(packageData.bots, null, 2)}

## DASHBOARD PREFERENCES
${JSON.stringify(packageData.dashboardPreferences, null, 2)}

## FEATURE FLAGS
${JSON.stringify(packageData.features, null, 2)}

## IMPORT INSTRUCTIONS
1. Open Pinky Bot Dashboard
2. Go to Settings > Import Package
3. Select this file
4. Click "Import Configuration"
5. Restart dashboard

All settings will be restored to this configuration state.
`;
        
        return new Blob([configContent], { type: 'text/plain' });
    }

    /**
     * Create a downloadable package file
     * @param {String} format - 'json' or 'config'
     * @returns {Promise<void>}
     */
    async downloadPackage(format = 'json') {
        try {
            let blob, filename;
            
            if (format === 'json') {
                blob = await this.generatePackageJSON();
                filename = `pinky-package-${new Date().toISOString().split('T')[0]}.json`;
            } else if (format === 'config') {
                blob = await this.generateConfigurationFile();
                filename = `pinky-config-${new Date().toISOString().split('T')[0]}.txt`;
            } else {
                throw new Error(`Unknown format: ${format}`);
            }
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`✅ Package exported: ${filename}`);
            return { success: true, filename };
        } catch (error) {
            console.error('Error downloading package:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Import a package file and restore configuration
     * @param {File} file - Uploaded package file
     * @returns {Promise<Object>} Import result
     */
    async importPackage(file) {
        try {
            const content = await file.text();
            const packageData = JSON.parse(content);
            
            // Validate package structure
            if (!packageData.metadata || !packageData.metadata.version) {
                throw new Error('Invalid package format: missing metadata');
            }
            
            // Restore settings
            if (packageData.settings) {
                localStorage.setItem('pinkyDashboardSettings', JSON.stringify(packageData.settings));
            }
            
            // Restore bot configurations
            if (packageData.bots) {
                Object.entries(packageData.bots).forEach(([botName, config]) => {
                    if (config && Object.keys(config).length > 0) {
                        localStorage.setItem(`${botName}Config`, JSON.stringify(config));
                    }
                });
            }
            
            // Restore dashboard preferences
            if (packageData.dashboardPreferences) {
                localStorage.setItem('dashboardTheme', packageData.dashboardPreferences.theme);
                localStorage.setItem('dashboardLayout', packageData.dashboardPreferences.layout);
                localStorage.setItem('soundEnabled', packageData.dashboardPreferences.soundEnabled);
            }
            
            return {
                success: true,
                message: `✅ Package imported successfully (v${packageData.metadata.version})`,
                itemsRestored: Object.keys(packageData.settings || {}).length + 
                               Object.keys(packageData.bots || {}).length + 3
            };
        } catch (error) {
            return {
                success: false,
                message: `❌ Import failed: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Create a shareable package URL for distribution
     * @returns {Promise<String>} Package as data URL
     */
    async generateShareableURL() {
        const blob = await this.generatePackageJSON();
        const url = URL.createObjectURL(blob);
        return url;
    }

    /**
     * Export package metadata summary
     * @returns {Object} Summary information
     */
    async getPackageSummary() {
        const packageData = await this.collectPackageData();
        
        return {
            name: packageData.metadata.name,
            version: packageData.metadata.version,
            exported: packageData.metadata.exported,
            itemsIncluded: {
                settings: Object.keys(packageData.settings).length,
                bots: Object.keys(packageData.bots).filter(k => 
                    packageData.bots[k] && Object.keys(packageData.bots[k]).length > 0
                ).length,
                tasks: packageData.tasks.length,
                activities: packageData.activity.length,
            },
            features: packageData.features,
        };
    }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportPackageManager;
}
