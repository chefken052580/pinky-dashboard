/**
 * Bug Status Widget for Mission Control
 * 
 * Displays bug tracking statistics on the main dashboard:
 * - Open/In Progress/Fixed counts
 * - Recent bug activity feed
 * - Top bug reporters leaderboard
 * - Average time-to-fix metric
 * 
 * Integrates with /api/bugs/stats endpoint
 */

class BugStatusWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.refreshInterval = null;
    this.refreshRate = 60000; // 60 seconds
  }

  async init() {
    if (!this.container) {
      console.error('Bug Status Widget: Container not found');
      return;
    }

    await this.render();
    this.startAutoRefresh();
  }

  async render() {
    this.container.innerHTML = this.getLoadingHTML();

    try {
      const stats = await this.fetchBugStats();
      this.container.innerHTML = this.renderWidget(stats);
      this.attachEventListeners();
    } catch (error) {
      console.error('Bug Status Widget error:', error);
      this.container.innerHTML = this.getErrorHTML(error.message);
    }
  }

  async fetchBugStats() {
    const response = await fetch('http://192.168.254.4:3030/api/bugs/stats');
    
    if (!response.ok) {
      throw new Error('Failed to fetch bug stats');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    return data.stats;
  }

  renderWidget(stats) {
    return `
      <div class="bug-status-widget">
        <div class="widget-header">
          <h3>🐛 Bug Tracker</h3>
          <button class="refresh-btn" onclick="bugStatusWidget.refresh()">
            <span class="refresh-icon">↻</span>
          </button>
        </div>

        <div class="bug-stats-grid">
          <div class="stat-card open">
            <div class="stat-icon">🔴</div>
            <div class="stat-value">${stats.open || 0}</div>
            <div class="stat-label">Open</div>
          </div>

          <div class="stat-card in-progress">
            <div class="stat-icon">🟡</div>
            <div class="stat-value">${stats.inProgress || 0}</div>
            <div class="stat-label">In Progress</div>
          </div>

          <div class="stat-card fixed">
            <div class="stat-icon">🟢</div>
            <div class="stat-value">${stats.fixed || 0}</div>
            <div class="stat-label">Fixed</div>
          </div>

          <div class="stat-card time-to-fix">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">${this.formatTimeToFix(stats.avgTimeToFix)}</div>
            <div class="stat-label">Avg Fix Time</div>
          </div>
        </div>

        <div class="bug-activity-feed">
          <h4>Recent Activity</h4>
          <div class="activity-list">
            ${this.renderActivityFeed(stats.recentActivity)}
          </div>
        </div>

        <div class="top-reporters">
          <h4>🏆 Top Bug Hunters</h4>
          <div class="reporter-list">
            ${this.renderTopReporters(stats.topReporters)}
          </div>
        </div>

        <div class="widget-footer">
          <button class="view-tracker-btn" onclick="bugStatusWidget.openBugTracker()">
            View Full Tracker →
          </button>
        </div>
      </div>
    `;
  }

  renderActivityFeed(activities) {
    if (!activities || activities.length === 0) {
      return '<div class="no-activity">No recent activity</div>';
    }

    return activities.map(activity => `
      <div class="activity-item">
        <span class="activity-status status-${activity.status}">${this.getStatusIcon(activity.status)}</span>
        <span class="activity-title">${activity.title}</span>
        <span class="activity-time">${this.formatRelativeTime(activity.timestamp)}</span>
      </div>
    `).join('');
  }

  renderTopReporters(reporters) {
    if (!reporters || reporters.length === 0) {
      return '<div class="no-reporters">No reporters yet</div>';
    }

    return reporters.slice(0, 5).map((reporter, index) => `
      <div class="reporter-item">
        <span class="reporter-rank">#${index + 1}</span>
        <span class="reporter-name">${this.maskEmail(reporter.email)}</span>
        <span class="reporter-count">${reporter.count} bugs</span>
        <span class="reporter-points">${reporter.points} pts</span>
      </div>
    `).join('');
  }

  getStatusIcon(status) {
    const icons = {
      'open': '🔴',
      'confirmed': '🟠',
      'in-progress': '🟡',
      'fixed': '🟢',
      'duplicate': '🔄',
      'invalid': '⚫'
    };
    return icons[status] || '⚪';
  }

  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  formatTimeToFix(milliseconds) {
    if (!milliseconds) return 'N/A';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  maskEmail(email) {
    if (!email) return 'Anonymous';
    
    const [username, domain] = email.split('@');
    
    if (!domain) return email;
    
    const maskedUsername = username.slice(0, 3) + '***';
    return `${maskedUsername}@${domain}`;
  }

  getLoadingHTML() {
    return `
      <div class="bug-status-widget loading">
        <div class="widget-header">
          <h3>🐛 Bug Tracker</h3>
        </div>
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading bug stats...</p>
        </div>
      </div>
    `;
  }

  getErrorHTML(message) {
    return `
      <div class="bug-status-widget error">
        <div class="widget-header">
          <h3>🐛 Bug Tracker</h3>
        </div>
        <div class="error-message">
          <p>⚠️ ${message}</p>
          <button onclick="bugStatusWidget.refresh()">Retry</button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Event listeners attached via onclick in HTML for simplicity
  }

  async refresh() {
    await this.render();
  }

  openBugTracker() {
    // Navigate to bug tracker page
    window.location.href = '/bug-tracker.html';
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, this.refreshRate);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  destroy() {
    this.stopAutoRefresh();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Auto-initialize when DOM is ready
let bugStatusWidget = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize widget if container exists
  if (document.getElementById('bug-status-widget')) {
    bugStatusWidget = new BugStatusWidget('bug-status-widget');
    bugStatusWidget.init();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BugStatusWidget;
}
