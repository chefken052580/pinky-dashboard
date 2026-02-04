/**
 * SYSTEM MONITOR UI
 * Real-time resource display for analytics dashboard
 * Shows CPU, memory, disk, throttle state
 */

class SystemMonitorUI {
  constructor() {
    this.metrics = null;
    this.history = [];
    this.updateInterval = 10000; // 10 seconds
    this.isEnabled = true;
  }

  /**
   * Initialize system monitor UI
   */
  async init() {
    console.log('[SystemMonitor] Initializing UI');
    
    // Load initial metrics
    await this.loadMetrics();
    
    // Auto-update every 10 seconds
    setInterval(() => {
      if (this.isEnabled) {
        this.loadMetrics();
      }
    }, this.updateInterval);
  }

  /**
   * Load current metrics from API
   */
  async loadMetrics() {
    try {
      const response = await fetch('http://localhost:3030/api/system/metrics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.metrics = data.metrics;
          this.history.push(this.metrics);
          if (this.history.length > 60) {
            this.history.shift();
          }
          this.render();
        }
      }
    } catch (err) {
      console.log('[SystemMonitor] API error: ' + err.message);
    }
  }

  /**
   * Render system monitor UI
   */
  render() {
    const container = document.getElementById('system-monitor-container');
    if (!container || !this.metrics) return;

    let html = '<div class="system-monitor">';
    html += '<h3>System Resources</h3>';
    
    // Throttle state banner
    if (this.metrics.throttle) {
      const level = this.metrics.throttle.level;
      const levelClass = 'throttle-' + level;
      html += '<div class="throttle-state ' + levelClass + '">';
      html += '<span class="level-badge">' + level.toUpperCase() + '</span>';
      html += '<span class="reason">' + this.metrics.throttle.reason + '</span>';
      html += '</div>';
    }

    // Metrics grid
    html += '<div class="metrics-grid">';

    // CPU
    html += '<div class="metric-card">';
    html += '<div class="metric-header">CPU</div>';
    html += '<div class="metric-value ' + this.getColorClass(this.metrics.cpu.usage) + '">';
    html += this.metrics.cpu.usage + '%';
    html += '</div>';
    html += '<div class="metric-bar">';
    html += '<div class="metric-fill" style="width: ' + this.metrics.cpu.usage + '%"></div>';
    html += '</div>';
    html += '<div class="metric-details">';
    html += 'Cores: ' + this.metrics.cpu.cores + '<br/>';
    html += '1m: ' + this.metrics.cpu.loadAvg['1min'] + ' / ';
    html += '5m: ' + this.metrics.cpu.loadAvg['5min'];
    html += '</div>';
    html += '</div>';

    // Memory
    html += '<div class="metric-card">';
    html += '<div class="metric-header">Memory</div>';
    html += '<div class="metric-value ' + this.getColorClass(this.metrics.memory.usage) + '">';
    html += this.metrics.memory.usage + '%';
    html += '</div>';
    html += '<div class="metric-bar">';
    html += '<div class="metric-fill" style="width: ' + this.metrics.memory.usage + '%"></div>';
    html += '</div>';
    html += '<div class="metric-details">';
    html += this.metrics.memory.used + 'MB / ' + this.metrics.memory.total + 'MB<br/>';
    html += 'Free: ' + this.metrics.memory.free + 'MB';
    html += '</div>';
    html += '</div>';

    // Disk
    html += '<div class="metric-card">';
    html += '<div class="metric-header">Disk</div>';
    html += '<div class="metric-value ' + this.getColorClass(this.metrics.disk.usage || 0) + '">';
    html += (this.metrics.disk.usage || 0) + '%';
    html += '</div>';
    html += '<div class="metric-bar">';
    html += '<div class="metric-fill" style="width: ' + (this.metrics.disk.usage || 0) + '%"></div>';
    html += '</div>';
    html += '<div class="metric-details">';
    html += this.metrics.disk.path + '<br/>';
    html += 'Free: ' + (this.metrics.disk.free || 0) + 'MB';
    html += '</div>';
    html += '</div>';

    // Uptime
    html += '<div class="metric-card">';
    html += '<div class="metric-header">System Uptime</div>';
    html += '<div class="metric-value uptime">';
    html += this.formatUptime(this.metrics.uptime);
    html += '</div>';
    html += '<div class="metric-details">';
    html += this.metrics.uptime + ' seconds';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // Close metrics-grid

    // Throttle state explanation
    if (this.metrics.throttle) {
      html += '<div class="throttle-info">';
      html += '<strong>Bot Activity:</strong> ';
      
      if (this.metrics.throttle.level === 'critical') {
        html += '🛑 PAUSED - Waiting for system resources to free up';
      } else if (this.metrics.throttle.level === 'high') {
        html += '⚠️ SLOWED - Running with delays to preserve system resources';
      } else {
        html += '✅ NORMAL - Running at full capacity';
      }
      
      html += '<br/><strong>Actions:</strong> ';
      if (this.metrics.throttle.actions && this.metrics.throttle.actions.length > 0) {
        html += this.metrics.throttle.actions.join(', ');
      } else {
        html += 'none';
      }
      html += '</div>';
    }

    // Chart info
    html += '<div class="monitor-info">';
    html += 'Updating every 10 seconds | Last update: ' + this.formatTime(this.metrics.timestamp);
    html += '</div>';

    html += '</div>'; // Close system-monitor
    container.innerHTML = html;
  }

  /**
   * Get color class based on usage percentage
   */
  getColorClass(percent) {
    if (percent > 80) return 'critical';
    if (percent > 60) return 'high';
    if (percent > 40) return 'medium';
    return 'low';
  }

  /**
   * Format uptime in human-readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return days + 'd ' + hours + 'h ' + mins + 'm';
    } else if (hours > 0) {
      return hours + 'h ' + mins + 'm';
    } else {
      return mins + 'm';
    }
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  }

  /**
   * Get metrics summary
   */
  async getSummary() {
    try {
      const response = await fetch('http://localhost:3030/api/system/summary');
      if (response.ok) {
        const data = await response.json();
        return data.summary;
      }
    } catch (err) {
      console.log('[SystemMonitor] Summary error: ' + err.message);
    }
    return null;
  }

  /**
   * Get metrics history
   */
  async getHistory(limit) {
    try {
      const response = await fetch('http://localhost:3030/api/system/history?limit=' + (limit || 60));
      if (response.ok) {
        const data = await response.json();
        return data.history;
      }
    } catch (err) {
      console.log('[SystemMonitor] History error: ' + err.message);
    }
    return [];
  }
}

// Initialize globally
window.systemMonitorUI = new SystemMonitorUI();
console.log('[SystemMonitor] UI initialized');
