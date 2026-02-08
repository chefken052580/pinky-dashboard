/**
 * HEALTH DASHBOARD - Real-time System Health Monitor
 * Shows bot-backend status, API health, tasks queue, and performance metrics
 */

class HealthDashboard {
  constructor() {
    this.apiBase = (typeof API_BASE !== 'undefined' ? API_BASE : '');
    this.updateInterval = 5000; // 5 seconds
    this.lastCheck = null;
    this.isOnline = false;
    this.history = [];
    this.maxHistory = 60;
  }

  /**
   * Initialize the health dashboard
   */
  async init() {
    console.log('[HealthDashboard] Initializing');
    const container = document.getElementById('health-dashboard-container');
    if (!container) {
      console.log('[HealthDashboard] Container not found');
      return;
    }

    this.render();
    await this.update();

    // Auto-update every 5 seconds
    setInterval(() => this.update(), this.updateInterval);
  }

  /**
   * Update health metrics with actual response time measurement
   */
  async update() {
    try {
      // Check API health with timing
      const healthStart = performance.now();
      const healthRes = await fetch(this.apiBase + '/api/health', { timeout: 3000 });
      const healthTime = Math.round(performance.now() - healthStart);
      
      // Record health endpoint metric
      if (window.metricsPersistence) {
        window.metricsPersistence.recordMetric('/api/health', healthTime, healthRes.ok ? 'success' : 'error');
      }
      
      if (healthRes.ok) {
        const health = await healthRes.json();
        this.isOnline = health.status === 'online';
        
        // Get task stats with timing
        const tasksStart = performance.now();
        const tasksRes = await fetch(this.apiBase + '/api/tasks', { timeout: 3000 });
        const tasksTime = Math.round(performance.now() - tasksStart);
        
        // Record tasks endpoint metric
        if (window.metricsPersistence) {
          window.metricsPersistence.recordMetric('/api/tasks', tasksTime, tasksRes.ok ? 'success' : 'error');
        }
        
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        
        const now = new Date();
        const avgResponseTime = (healthTime + tasksTime) / 2;
        const metric = {
          timestamp: now.toISOString(),
          online: this.isOnline,
          uptime: health.uptime || 0,
          model: health.model || 'unknown',
          wsClients: health.wsClients || 0,
          totalTasks: tasks.length,
          pendingTasks: tasks.filter(t => t.status === 'pending').length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          responseTime: avgResponseTime
        };

        this.history.push(metric);
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }
        this.lastCheck = metric;
        this.render();
      } else {
        this.isOnline = false;
        this.render();
      }
    } catch (err) {
      this.isOnline = false;
      console.log('[HealthDashboard] Update error:', err.message);
      
      // Record error metric
      if (window.metricsPersistence) {
        window.metricsPersistence.recordMetric('/api/health', 0, 'error');
      }
      
      this.render();
    }
  }

  /**
   * Render the health dashboard
   */
  render() {
    const container = document.getElementById('health-dashboard-container');
    if (!container || !this.lastCheck) return;

    const uptime = this.formatUptime(this.lastCheck.uptime);
    const statusColor = this.isOnline ? '#10b981' : '#ef4444';
    const statusText = this.isOnline ? 'ONLINE' : 'OFFLINE';

    let html = `
      <style>
        .health-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          padding: 20px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 12px;
          border: 1px solid #334155;
        }

        .health-card {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid #475569;
          border-radius: 8px;
          padding: 15px;
          transition: all 0.3s ease;
        }

        .health-card:hover {
          border-color: #64748b;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .health-card-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .health-card-value {
          font-size: 24px;
          font-weight: bold;
          color: #e2e8f0;
          margin-bottom: 4px;
        }

        .health-card-detail {
          font-size: 12px;
          color: #64748b;
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chart-mini {
          height: 40px;
          margin-top: 8px;
          background: rgba(71, 85, 105, 0.2);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          padding: 2px;
        }

        .chart-bar {
          flex: 1;
          background: linear-gradient(to top, #3b82f6, #60a5fa);
          border-radius: 2px;
        }
      </style>

      <div class="health-dashboard">
        <div class="health-card">
          <div class="health-card-label"><span class="status-dot" style="background: ${statusColor};"></span>Status</div>
          <div class="health-card-value">${statusText}</div>
          <div class="health-card-detail">Bot-Backend API</div>
        </div>

        <div class="health-card">
          <div class="health-card-label">⏱️ Uptime</div>
          <div class="health-card-value">${uptime}</div>
          <div class="health-card-detail">Running continuously</div>
        </div>

        <div class="health-card">
          <div class="health-card-label">📊 Total Tasks</div>
          <div class="health-card-value">${this.lastCheck.totalTasks}</div>
          <div class="health-card-detail">
            <span style="color: #fbbf24;">⏳ ${this.lastCheck.pendingTasks} pending</span> · 
            <span style="color: #10b981;">✅ ${this.lastCheck.completedTasks} done</span>
          </div>
        </div>

        <div class="health-card">
          <div class="health-card-label">👥 WebSocket Clients</div>
          <div class="health-card-value">${this.lastCheck.wsClients}</div>
          <div class="health-card-detail">Active connections</div>
        </div>

        <div class="health-card">
          <div class="health-card-label">⚡ Response Time</div>
          <div class="health-card-value">${Math.round(this.lastCheck.responseTime)}ms</div>
          <div class="health-card-detail">Average latency</div>
        </div>

        <div class="health-card">
          <div class="health-card-label">🤖 Model</div>
          <div class="health-card-value" style="font-size: 14px; word-break: break-all;">${this.truncate(this.lastCheck.model, 25)}</div>
          <div class="health-card-detail">Primary LLM</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Format uptime in human-readable format
   */
  formatUptime(seconds) {
    if (seconds < 60) return Math.round(seconds) + 's';
    if (seconds < 3600) return Math.round(seconds / 60) + 'm';
    if (seconds < 86400) return Math.round(seconds / 3600) + 'h';
    return Math.round(seconds / 86400) + 'd';
  }

  /**
   * Truncate long strings
   */
  truncate(str, max) {
    return str.length > max ? str.substr(0, max - 3) + '...' : str;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      online: this.isOnline,
      lastCheck: this.lastCheck,
      history: this.history
    };
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new HealthDashboard();
    window.healthDashboard = dashboard;
    dashboard.init();
  });
} else {
  const dashboard = new HealthDashboard();
  window.healthDashboard = dashboard;
  dashboard.init();
}

console.log('[HealthDashboard] Loaded - monitoring bot-backend health');
