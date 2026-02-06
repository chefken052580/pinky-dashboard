/**
 * Export Package Manager UI
 * Manages PinkyBot distribution package generation and downloads
 */

class ExportPackageManager {
  constructor() {
    this.apiBase = 'http://192.168.254.4:3030';
    this.packages = [];
    this.init();
  }

  async init() {
    console.log('[ExportPackage] Initializing...');
    
    try {
      // Render initial UI
      this.renderUI();
      
      // Load existing packages
      await this.loadPackages();
      
      console.log('[ExportPackage] Initialization complete');
    } catch (err) {
      console.error('[ExportPackage] Init error:', err);
      this.showNotification('❌ Failed to initialize export manager', 'error');
    }
  }

  /**
   * Render the export package manager UI
   */
  renderUI() {
    const container = document.getElementById('export-package-container');
    if (!container) {
      console.warn('[ExportPackage] Container not found');
      return;
    }

    container.innerHTML = `
      <div class="export-manager" style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <!-- Generation Section -->
        <div class="export-section" style="margin-bottom: 30px;">
          <h3 style="color: #333; margin-bottom: 15px;">📦 Generate New Export Package</h3>
          <p style="color: #666; margin-bottom: 15px; font-size: 0.95em;">
            Create a distributable ZIP package with all PinkyBot files, documentation, and setup guides.
          </p>
          
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="export-btn" id="generateExportBtn" onclick="window.exportManager.generateExport()">
              ⬇️ Generate Export Package
            </button>
            <button class="export-btn secondary" id="refreshListBtn" onclick="window.exportManager.loadPackages()">
              🔄 Refresh List
            </button>
            <button class="export-btn secondary" id="cleanupBtn" onclick="window.exportManager.cleanupOldPackages()">
              🗑️ Clean Up Old Packages
            </button>
          </div>
          
          <!-- Progress Bar -->
          <div id="exportProgress" style="display: none; margin-top: 15px;">
            <div style="background: #e0e0e0; border-radius: 4px; height: 20px; overflow: hidden;">
              <div class="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049); transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8em; font-weight: bold;"></div>
            </div>
            <p id="progressText" style="color: #666; margin-top: 8px; font-size: 0.9em;">Generating...</p>
          </div>
        </div>

        <!-- Packages List Section -->
        <div class="export-section">
          <h3 style="color: #333; margin-bottom: 15px;">📋 Available Packages</h3>
          <div id="packagesList" style="background: white; border-radius: 6px; padding: 15px; min-height: 200px;">
            <p style="color: #999; text-align: center; padding: 40px 20px;">Loading packages...</p>
          </div>
        </div>

        <!-- Statistics -->
        <div class="export-section" style="margin-top: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="stat-card" style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #4CAF50;">
              <div style="color: #999; font-size: 0.9em;">Total Packages</div>
              <div style="font-size: 1.8em; font-weight: bold; color: #333;" id="totalPackages">0</div>
            </div>
            <div class="stat-card" style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3;">
              <div style="color: #999; font-size: 0.9em;">Total Size</div>
              <div style="font-size: 1.8em; font-weight: bold; color: #333;" id="totalSize">0 B</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add CSS for export package manager
    this.addStyles();
  }

  /**
   * Add CSS styles for export manager
   */
  addStyles() {
    if (document.getElementById('export-package-styles')) return;

    const style = document.createElement('style');
    style.id = 'export-package-styles';
    style.textContent = `
      .export-manager {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      .export-section {
        background: white;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
      }

      .export-btn {
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.95em;
      }

      .export-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .export-btn:active {
        transform: translateY(0);
      }

      .export-btn.secondary {
        background: #e0e0e0;
        color: #333;
      }

      .export-btn.secondary:hover {
        background: #d0d0d0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .export-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .package-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        margin-bottom: 10px;
        background: #fafafa;
        transition: all 0.2s;
      }

      .package-item:hover {
        background: #f0f0f0;
        border-color: #e0e0e0;
      }

      .package-info {
        flex: 1;
      }

      .package-name {
        font-weight: 500;
        color: #333;
        font-size: 0.95em;
      }

      .package-meta {
        color: #999;
        font-size: 0.85em;
        margin-top: 4px;
      }

      .package-actions {
        display: flex;
        gap: 8px;
      }

      .download-btn {
        padding: 6px 12px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85em;
        transition: all 0.2s;
      }

      .download-btn:hover {
        background: #45a049;
      }

      .delete-btn {
        padding: 6px 12px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85em;
        transition: all 0.2s;
      }

      .delete-btn:hover {
        background: #da190b;
      }

      .no-packages {
        text-align: center;
        padding: 40px 20px;
        color: #999;
      }

      .progress-bar {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Generate a new export package
   */
  async generateExport() {
    const btn = document.getElementById('generateExportBtn');
    const progress = document.getElementById('exportProgress');
    
    try {
      btn.disabled = true;
      progress.style.display = 'block';
      
      const progressBar = progress.querySelector('.progress-bar');
      const progressText = document.getElementById('progressText');
      
      // Simulate progress
      let progress_val = 0;
      const progressInterval = setInterval(() => {
        if (progress_val < 90) {
          progress_val += Math.random() * 30;
          progressBar.style.width = Math.min(progress_val, 90) + '%';
        }
      }, 500);

      progressText.textContent = '📦 Generating export package...';

      // Call API
      const response = await fetch(`${this.apiBase}/api/export/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      clearInterval(progressInterval);
      progressBar.style.width = '100%';
      progressText.textContent = '✅ Export package generated successfully!';

      this.showNotification(`✅ Export package created: ${result.filename}`, 'success');

      // Reload packages list
      setTimeout(() => {
        progress.style.display = 'none';
        this.loadPackages();
      }, 1500);

    } catch (err) {
      console.error('[ExportPackage] Generation error:', err);
      this.showNotification(`❌ Failed to generate package: ${err.message}`, 'error');
      progress.style.display = 'none';
    } finally {
      btn.disabled = false;
    }
  }

  /**
   * Load and display available packages
   */
  async loadPackages() {
    const container = document.getElementById('packagesList');
    
    try {
      const response = await fetch(`${this.apiBase}/api/export/list`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.packages || result.packages.length === 0) {
        container.innerHTML = `
          <div class="no-packages">
            <p>📦 No export packages yet.</p>
            <p style="font-size: 0.9em; color: #bbb;">Click "Generate Export Package" to create one.</p>
          </div>
        `;
        document.getElementById('totalPackages').textContent = '0';
        document.getElementById('totalSize').textContent = '0 B';
        return;
      }

      // Sort by newest first
      const packages = result.packages.sort((a, b) => new Date(b.created) - new Date(a.created));

      // Calculate total size
      const totalSize = packages.reduce((sum, pkg) => sum + pkg.size, 0);
      document.getElementById('totalPackages').textContent = packages.length;
      document.getElementById('totalSize').textContent = this.formatBytes(totalSize);

      // Render packages
      container.innerHTML = packages.map(pkg => `
        <div class="package-item">
          <div class="package-info">
            <div class="package-name">📦 ${pkg.filename}</div>
            <div class="package-meta">
              Created: ${new Date(pkg.created).toLocaleString()} • 
              Size: ${this.formatBytes(pkg.size)}
            </div>
          </div>
          <div class="package-actions">
            <button class="download-btn" onclick="window.exportManager.downloadPackage('${pkg.filename.replace('.zip', '')}')">
              ⬇️ Download
            </button>
            <button class="delete-btn" onclick="window.exportManager.deletePackage('${pkg.filename}')">
              🗑️ Delete
            </button>
          </div>
        </div>
      `).join('');

      this.packages = packages;

    } catch (err) {
      console.error('[ExportPackage] Load error:', err);
      container.innerHTML = `
        <div class="no-packages">
          <p style="color: #f44336;">❌ Failed to load packages</p>
          <p style="font-size: 0.9em; color: #bbb;">${err.message}</p>
        </div>
      `;
    }
  }

  /**
   * Download a package
   */
  downloadPackage(filename) {
    const url = `${this.apiBase}/api/export/download/${filename}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinkybot-${filename}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    this.showNotification(`⬇️ Downloading ${filename}...`, 'info');
  }

  /**
   * Delete a package
   */
  async deletePackage(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      // Note: Delete endpoint not yet implemented in backend
      // For now, just refresh the list
      this.showNotification(`🗑️ Package deletion requires backend endpoint`, 'info');
      // await this.loadPackages();
    } catch (err) {
      this.showNotification(`❌ Failed to delete package`, 'error');
    }
  }

  /**
   * Cleanup old packages
   */
  async cleanupOldPackages() {
    try {
      const response = await fetch(`${this.apiBase}/api/export/cleanup`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.showNotification('✅ Cleanup completed - old packages removed', 'success');
      await this.loadPackages();

    } catch (err) {
      this.showNotification(`❌ Cleanup failed: ${err.message}`, 'error');
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.style.cssText = `
      padding: 12px 16px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 4px;
      margin-bottom: 10px;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.exportManager) {
      window.exportManager = new ExportPackageManager();
      console.log('[ExportPackage] Manager instantiated');
    }
  });
} else {
  if (!window.exportManager) {
    window.exportManager = new ExportPackageManager();
    console.log('[ExportPackage] Manager instantiated');
  }
}
