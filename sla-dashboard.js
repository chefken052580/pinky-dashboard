/**
 * sla-dashboard.js — SLA Monitoring Dashboard Widget
 * 
 * Displays 99.9% uptime SLA metrics, incidents, and alerts
 */

class SLADashboard {
  constructor(containerId = 'sla-widget') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.refreshInterval = 30000; // 30 seconds
    this.data = {
      uptime: '100.000%',
      slaTarget: 99.9,
      status: 'healthy',
      incidents: [],
      alerts: []
    };
  }

  async init() {
    if (!this.container) {
      console.warn(`Container #${this.containerId} not found`);
      return;
    }

    this.render();
    await this.loadData();
    
    // Auto-refresh
    this.autoRefreshInterval = setInterval(() => {
      this.loadData();
    }, this.refreshInterval);
  }

  async loadData() {
    try {
      const response = await fetch('http://192.168.254.4:3030/api/sla/status');
      if (response.ok) {
        this.data = await response.json();
        this.update();
      }
    } catch (error) {
      console.warn('Failed to load SLA data:', error.message);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="sla-dashboard">
        <div class="sla-header">
          <h3>🛡️ SLA Monitoring</h3>
          <span class="sla-status-badge" id="sla-status">Loading...</span>
        </div>

        <div class="sla-metrics">
          <div class="sla-metric">
            <div class="metric-label">Current Uptime</div>
            <div class="metric-value" id="sla-uptime">---%</div>
            <div class="metric-subtext">Target: 99.9%</div>
          </div>

          <div class="sla-metric">
            <div class="metric-label">Status</div>
            <div class="metric-value status-indicator" id="sla-health">
              <span class="status-dot"></span>
              <span id="sla-health-text">--</span>
            </div>
          </div>

          <div class="sla-metric">
            <div class="metric-label">Last Check</div>
            <div class="metric-value" id="sla-lastcheck" style="font-size: 0.9em;">--</div>
          </div>
        </div>

        <div class="sla-incidents">
          <h4>Active Incidents</h4>
          <div id="sla-incidents-list">
            <p class="no-data">No active incidents</p>
          </div>
        </div>

        <div class="sla-alerts">
          <h4>Recent Alerts</h4>
          <div id="sla-alerts-list">
            <p class="no-data">No recent alerts</p>
          </div>
        </div>

        <div class="sla-actions">
          <button id="sla-refresh-btn" class="btn-sla-refresh">⟲ Refresh</button>
          <button id="sla-report-btn" class="btn-sla-report">📊 Full Report</button>
          <button id="sla-test-alert-btn" class="btn-sla-test">🔔 Test Alert</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  update() {
    // Update uptime display
    const uptimeEl = document.getElementById('sla-uptime');
    if (uptimeEl && this.data.uptime) {
      uptimeEl.textContent = this.data.uptime;
      
      // Color code based on SLA status
      const uptime = parseFloat(this.data.uptime);
      if (uptime >= 99.9) {
        uptimeEl.style.color = '#00ff00'; // Green
      } else if (uptime >= 99.0) {
        uptimeEl.style.color = '#ffaa00'; // Orange
      } else {
        uptimeEl.style.color = '#ff0000'; // Red
      }
    }

    // Update status
    const statusEl = document.getElementById('sla-status');
    if (statusEl) {
      const slaPass = parseFloat(this.data.uptime) >= 99.9;
      statusEl.textContent = slaPass ? '✅ SLA PASS' : '❌ SLA FAIL';
      statusEl.className = `sla-status-badge ${slaPass ? 'pass' : 'fail'}`;
    }

    // Update health indicator
    const healthEl = document.getElementById('sla-health');
    const healthTextEl = document.getElementById('sla-health-text');
    if (healthEl && healthTextEl) {
      const statusDot = healthEl.querySelector('.status-dot');
      const isHealthy = this.data.status === 'healthy';
      statusDot.className = `status-dot ${isHealthy ? 'healthy' : 'unhealthy'}`;
      healthTextEl.textContent = isHealthy ? '✅ Healthy' : '⚠️ Degraded';
    }

    // Update last check
    const lastCheckEl = document.getElementById('sla-lastcheck');
    if (lastCheckEl && this.data.lastCheck) {
      const checkTime = new Date(this.data.lastCheck);
      lastCheckEl.textContent = this.formatTime(checkTime);
    }

    // Update incidents
    this.updateIncidents();

    // Update alerts
    this.updateAlerts();
  }

  updateIncidents() {
    const incidentsListEl = document.getElementById('sla-incidents-list');
    if (!incidentsListEl) return;

    const incidents = this.data.currentIncident
      ? [this.data.currentIncident]
      : [];

    if (incidents.length === 0) {
      incidentsListEl.innerHTML = '<p class="no-data">No active incidents ✅</p>';
      return;
    }

    incidentsListEl.innerHTML = incidents.map(incident => `
      <div class="incident-card">
        <div class="incident-header">
          <strong>${incident.id}</strong>
          <span class="incident-severity ${incident.severity.toLowerCase()}">${incident.severity}</span>
        </div>
        <div class="incident-details">
          <p><strong>Reason:</strong> ${incident.reason}</p>
          <p><strong>Duration:</strong> ${incident.duration || 'ongoing'}</p>
        </div>
      </div>
    `).join('');
  }

  updateAlerts() {
    const alertsListEl = document.getElementById('sla-alerts-list');
    if (!alertsListEl || !this.data.recentAlerts) return;

    if (this.data.recentAlerts.length === 0) {
      alertsListEl.innerHTML = '<p class="no-data">No recent alerts</p>';
      return;
    }

    alertsListEl.innerHTML = this.data.recentAlerts
      .slice(0, 5)
      .map(alert => `
        <div class="alert-item">
          <span class="alert-type">${alert.type || 'ALERT'}</span>
          <span class="alert-message">${alert.message || '--'}</span>
          <span class="alert-time">${this.formatTime(new Date(alert.timestamp))}</span>
        </div>
      `).join('');
  }

  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  }

  attachEventListeners() {
    const refreshBtn = document.getElementById('sla-refresh-btn');
    const reportBtn = document.getElementById('sla-report-btn');
    const testAlertBtn = document.getElementById('sla-test-alert-btn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.textContent = '⟲ Refreshing...';
        this.loadData().then(() => {
          refreshBtn.textContent = '⟲ Refresh';
        });
      });
    }

    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        this.showFullReport();
      });
    }

    if (testAlertBtn) {
      testAlertBtn.addEventListener('click', () => {
        this.sendTestAlert();
      });
    }
  }

  async showFullReport() {
    try {
      const response = await fetch('http://192.168.254.4:3030/api/sla/report');
      const report = await response.json();

      const reportHtml = `
        <div class="sla-report-modal">
          <div class="modal-header">
            <h2>SLA Report</h2>
            <span class="close-btn">✕</span>
          </div>
          <div class="modal-body">
            <h3>SLA Compliance</h3>
            <p><strong>Target:</strong> ${report.slaTarget}</p>
            <p><strong>Current Uptime:</strong> ${report.currentUptime}</p>
            <p><strong>Status:</strong> ${report.slaStatus}</p>
            <p><strong>Total Checks:</strong> ${report.totalChecks}</p>
            <p><strong>Success Rate:</strong> ${report.successRate}</p>
            <p><strong>Downtime:</strong> ${report.downtime}</p>
            
            <h3>Incidents</h3>
            <p><strong>Total:</strong> ${report.incidents.total}</p>
            <p><strong>Open:</strong> ${report.incidents.open}</p>
            <p><strong>Resolved:</strong> ${report.incidents.resolved}</p>
          </div>
        </div>
      `;

      // Display modal (simplified - in production use proper modal library)
      alert(`SLA Report\n\nUptime: ${report.currentUptime}\nStatus: ${report.slaStatus}\nIncidents: ${report.incidents.total}\nDowntime: ${report.downtime}`);
    } catch (error) {
      console.error('Failed to load SLA report:', error);
      alert('Failed to load SLA report');
    }
  }

  async sendTestAlert() {
    try {
      const response = await fetch('http://192.168.254.4:3030/api/sla/test-alert', {
        method: 'POST'
      });

      if (response.ok) {
        alert('✅ Test alert sent successfully!');
      } else {
        alert('❌ Failed to send test alert');
      }
    } catch (error) {
      console.error('Failed to send test alert:', error);
      alert('Failed to send test alert');
    }
  }

  destroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sla-widget')) {
    const slaDashboard = new SLADashboard();
    slaDashboard.init();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SLADashboard;
}
