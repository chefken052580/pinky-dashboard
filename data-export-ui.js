/**
 * Data Export UI - Task History, Activity Logs, Screenshots
 * Simple export functionality for dashboard data
 */

class DataExportUI {
  constructor() {
    this.apiBase = (typeof API_BASE !== 'undefined' ? API_BASE : '');
  }

  /**
   * Initialize export UI in the export-package-container
   */
  init() {
    const container = document.getElementById('export-package-container');
    if (!container) return;

    container.innerHTML = `
      <div class="export-panel" style="max-width:900px;margin:0 auto;">
        <p style="color:var(--text-secondary);margin-bottom:30px;">
          Download your PinkyBot data for backups, analysis, or sharing.
        </p>

        <!-- Export Options Grid -->
        <div class="stats-grid" style="margin-bottom:30px;">
          <div class="stat-card" style="cursor:pointer;" onclick="dataExport.exportTaskHistory()">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-label">Task History</div>
              <div class="stat-value" style="font-size:0.9em;color:var(--text-secondary);">Export as JSON</div>
            </div>
          </div>

          <div class="stat-card" style="cursor:pointer;" onclick="dataExport.exportActivityLogs()">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">Activity Logs</div>
              <div class="stat-value" style="font-size:0.9em;color:var(--text-secondary);">Export as CSV</div>
            </div>
          </div>

          <div class="stat-card" style="cursor:pointer;" onclick="dataExport.captureScreenshot()">
            <div class="stat-icon">📸</div>
            <div class="stat-content">
              <div class="stat-label">Dashboard Screenshot</div>
              <div class="stat-value" style="font-size:0.9em;color:var(--text-secondary);">Capture PNG</div>
            </div>
          </div>

          <div class="stat-card" style="cursor:pointer;" onclick="dataExport.exportUsageStats()">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-label">Usage & Costs</div>
              <div class="stat-value" style="font-size:0.9em;color:var(--text-secondary);">Export as JSON</div>
            </div>
          </div>
        </div>

        <!-- Export Status -->
        <div id="export-status" class="recent-activity" style="display:none;">
          <h3 id="export-status-title">Export Status</h3>
          <div id="export-status-content" class="activity-feed"></div>
        </div>

        <!-- Recent Exports -->
        <div class="recent-activity" style="margin-top:30px;">
          <h3>📂 Quick Export Guide</h3>
          <div class="activity-feed" style="font-size:0.9em;color:var(--text-secondary);">
            <div class="activity-item">
              <strong>Task History:</strong> Complete list of all tasks (pending, running, completed) in JSON format
            </div>
            <div class="activity-item">
              <strong>Activity Logs:</strong> All heartbeat activities and actions in spreadsheet-friendly CSV format
            </div>
            <div class="activity-item">
              <strong>Screenshot:</strong> Visual snapshot of the current dashboard view (uses browser screenshot API)
            </div>
            <div class="activity-item">
              <strong>Usage & Costs:</strong> Token usage, costs by model, and API call statistics
            </div>
          </div>
        </div>
      </div>
    `;

    console.log('[DataExport] UI initialized');
  }

  /**
   * Export task history as JSON
   */
  async exportTaskHistory() {
    this.showStatus('📋 Fetching task history...', 'info');

    try {
      const response = await fetch(`${this.apiBase}/api/tasks`);
      const tasks = await response.json();

      // Create downloadable JSON
      const data = {
        exported: new Date().toISOString(),
        exportType: 'taskHistory',
        totalTasks: tasks.length,
        tasksByStatus: {
          completed: tasks.filter(t => t.status === 'completed').length,
          running: tasks.filter(t => t.status === 'running').length,
          pending: tasks.filter(t => t.status === 'pending').length
        },
        tasks: tasks
      };

      this.downloadFile(
        JSON.stringify(data, null, 2),
        `pinkybot-tasks-${this.getDateStamp()}.json`,
        'application/json'
      );

      this.showStatus(`✅ Exported ${tasks.length} tasks successfully`, 'success');
    } catch (error) {
      this.showStatus(`❌ Export failed: ${error.message}`, 'error');
    }
  }

  /**
   * Export activity logs as CSV
   */
  async exportActivityLogs() {
    this.showStatus('📊 Fetching activity logs...', 'info');

    try {
      const response = await fetch(`${this.apiBase}/api/activity`);
      const data = await response.json();
      const activities = data.heartbeats || [];

      // Convert to CSV
      const headers = ['Timestamp', 'Date', 'Time', 'Activity', 'Tokens', 'Status'];
      const rows = activities.map(activity => {
        const date = new Date(activity.timestamp);
        return [
          activity.timestamp,
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          `"${(activity.activity || '').replace(/"/g, '""')}"`, // Escape quotes
          activity.tokens || 0,
          activity.status || 'completed'
        ];
      });

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      this.downloadFile(
        csv,
        `pinkybot-activity-${this.getDateStamp()}.csv`,
        'text/csv'
      );

      this.showStatus(`✅ Exported ${activities.length} activities as CSV`, 'success');
    } catch (error) {
      this.showStatus(`❌ Export failed: ${error.message}`, 'error');
    }
  }

  /**
   * Capture dashboard screenshot
   */
  async captureScreenshot() {
    this.showStatus('📸 Capturing screenshot...', 'info');

    try {
      // Use html2canvas if available, otherwise show instructions
      if (typeof html2canvas === 'function') {
        const dashboard = document.querySelector('.dashboard-container') || document.body;
        const canvas = await html2canvas(dashboard);
        
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pinkybot-dashboard-${this.getDateStamp()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          
          this.showStatus('✅ Screenshot saved successfully', 'success');
        });
      } else {
        // Fallback: Manual screenshot instructions
        this.showStatus(
          '📸 Manual screenshot: Press Ctrl+Shift+S (Windows/Linux) or Cmd+Shift+4 (Mac) to capture',
          'info'
        );
      }
    } catch (error) {
      this.showStatus(`❌ Screenshot failed: ${error.message}`, 'error');
    }
  }

  /**
   * Export usage and cost statistics
   */
  async exportUsageStats() {
    this.showStatus('💰 Fetching usage statistics...', 'info');

    try {
      const response = await fetch(`${this.apiBase}/api/usage`);
      const usage = await response.json();

      const data = {
        exported: new Date().toISOString(),
        exportType: 'usageStats',
        summary: {
          totalTokens: usage.totalTokens,
          inputTokens: usage.input,
          outputTokens: usage.output,
          cacheReadTokens: usage.cacheRead,
          cacheWriteTokens: usage.cacheWrite,
          totalCost: usage.totalCost,
          messages: usage.messages
        },
        costBreakdown: {
          input: usage.costInput,
          output: usage.costOutput,
          cacheRead: usage.costCacheRead,
          cacheWrite: usage.costCacheWrite
        },
        byModel: usage.byModel,
        lastUpdated: usage.lastUpdated
      };

      this.downloadFile(
        JSON.stringify(data, null, 2),
        `pinkybot-usage-${this.getDateStamp()}.json`,
        'application/json'
      );

      this.showStatus(`✅ Usage stats exported (${usage.messages} messages, $${usage.totalCost.toFixed(2)})`, 'success');
    } catch (error) {
      this.showStatus(`❌ Export failed: ${error.message}`, 'error');
    }
  }

  /**
   * Download file to user's system
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get date stamp for filenames (YYYY-MM-DD)
   */
  getDateStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Show export status message
   */
  showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('export-status');
    const contentDiv = document.getElementById('export-status-content');
    
    if (!statusDiv || !contentDiv) return;

    const color = type === 'success' ? '#4ade80' : 
                  type === 'error' ? '#f87171' : 
                  'var(--text-secondary)';

    contentDiv.innerHTML = `
      <div class="activity-item" style="color:${color};">
        ${message}
      </div>
    `;

    statusDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Initialize globally
let dataExport;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
  dataExport = new DataExportUI();
  
  // Watch for export view becoming visible
  const exportView = document.getElementById('export-view');
  if (exportView) {
    const observer = new MutationObserver(() => {
      if (exportView.style.display !== 'none' && !exportView.classList.contains('hidden')) {
        dataExport.init();
      }
    });
    
    observer.observe(exportView, { 
      attributes: true, 
      attributeFilter: ['style', 'class'] 
    });
    
    // Initialize immediately if already visible
    if (exportView.style.display !== 'none') {
      dataExport.init();
    }
  }
});
} else {
  // DOMContentLoaded already fired, init now
  (function() {
  })();
}