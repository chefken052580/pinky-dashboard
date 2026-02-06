/**
 * AnalyticsBot - Token Allocation Chart Wiring
 * Fetches real API usage data and visualizes token allocation by category
 * Complexity: 4-5 (moderate - requires API integration and data transformation)
 */

class AnalyticsBot {
  constructor() {
    this.apiBase = 'http://192.168.254.4:3030';
    this.refreshInterval = 30000; // 30 seconds
    this.tokenData = {
      codeAnalysis: 0,
      documentation: 0,
      research: 0,
      taskManagement: 0,
      other: 0
    };
    this.activityHistory = [];
  }

  /**
   * Fetch real usage data from API
   */
  async fetchUsageData() {
    try {
      const response = await fetch(`${this.apiBase}/api/activity`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      return data.heartbeats || [];
    } catch (error) {
      console.error('AnalyticsBot: Failed to fetch usage data', error);
      return [];
    }
  }

  /**
   * Categorize activities and allocate tokens
   */
  categorizeActivity(activity) {
    const lower = activity.toLowerCase();
    
    if (lower.includes('code') || lower.includes('debug') || lower.includes('syntax')) {
      return 'codeAnalysis';
    } else if (lower.includes('doc') || lower.includes('readme') || lower.includes('memory')) {
      return 'documentation';
    } else if (lower.includes('search') || lower.includes('research') || lower.includes('web')) {
      return 'research';
    } else if (lower.includes('task') || lower.includes('heartbeat') || lower.includes('api')) {
      return 'taskManagement';
    } else {
      return 'other';
    }
  }

  /**
   * Parse tokens from activity entry
   */
  parseTokens(entry) {
    if (entry.tokens && typeof entry.tokens === 'number') {
      return entry.tokens;
    }
    return 0;
  }

  /**
   * Process activity history and allocate tokens
   */
  processActivityHistory(activities) {
    // Reset counters
    this.tokenData = {
      codeAnalysis: 0,
      documentation: 0,
      research: 0,
      taskManagement: 0,
      other: 0
    };
    
    activities.forEach(entry => {
      if (entry.activity && entry.tokens) {
        const category = this.categorizeActivity(entry.activity);
        this.tokenData[category] += this.parseTokens(entry);
      }
    });
    
    this.activityHistory = activities;
    return this.tokenData;
  }

  /**
   * Calculate distribution percentages
   */
  getDistribution() {
    const total = Object.values(this.tokenData).reduce((a, b) => a + b, 0);
    if (total === 0) return { total: 0, distribution: {} };
    
    const distribution = {};
    Object.entries(this.tokenData).forEach(([key, value]) => {
      distribution[key] = {
        tokens: value,
        percentage: ((value / total) * 100).toFixed(1)
      };
    });
    
    return { total, distribution };
  }

  /**
   * Update dashboard chart with real data
   */
  async updateDashboardChart() {
    try {
      const activities = await this.fetchUsageData();
      const tokenData = this.processActivityHistory(activities);
      const stats = this.getDistribution();
      
      const chartElement = document.getElementById('token-allocation-chart');
      if (chartElement) {
        this.renderChart(chartElement, stats);
      }
      
      const statsElement = document.getElementById('token-stats');
      if (statsElement) {
        this.renderStats(statsElement, stats);
      }
      
      return stats;
    } catch (error) {
      console.error('AnalyticsBot: Failed to update chart', error);
      return null;
    }
  }

  /**
   * Render Chart.js chart with token allocation
   */
  renderChart(container, stats) {
    if (typeof Chart === 'undefined') {
      console.warn('AnalyticsBot: Chart.js not loaded');
      return;
    }
    
    const ctx = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(ctx);
    
    const labels = Object.keys(stats.distribution).map(k => 
      k.replace(/([A-Z])/g, ' $1').trim()
    );
    const data = Object.values(stats.distribution).map(v => v.tokens);
    const colors = [
      '#667eea', // Code Analysis - blue
      '#764ba2', // Documentation - purple
      '#f093fb', // Research - pink
      '#4facfe', // Task Management - light blue
      '#00f2fe'  // Other - cyan
    ];
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${labels[ctx.dataIndex]}: ${ctx.raw} tokens`
            }
          }
        }
      }
    });
  }

  /**
   * Render stats text display
   */
  renderStats(container, stats) {
    container.innerHTML = `
      <div class="token-stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Tokens</div>
          <div class="stat-value">${stats.total.toLocaleString()}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Code Analysis</div>
          <div class="stat-value">${stats.distribution.codeAnalysis?.tokens || 0}</div>
          <div class="stat-percentage">${stats.distribution.codeAnalysis?.percentage || 0}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Documentation</div>
          <div class="stat-value">${stats.distribution.documentation?.tokens || 0}</div>
          <div class="stat-percentage">${stats.distribution.documentation?.percentage || 0}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Research</div>
          <div class="stat-value">${stats.distribution.research?.tokens || 0}</div>
          <div class="stat-percentage">${stats.distribution.research?.percentage || 0}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Task Management</div>
          <div class="stat-value">${stats.distribution.taskManagement?.tokens || 0}</div>
          <div class="stat-percentage">${stats.distribution.taskManagement?.percentage || 0}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Other</div>
          <div class="stat-value">${stats.distribution.other?.tokens || 0}</div>
          <div class="stat-percentage">${stats.distribution.other?.percentage || 0}%</div>
        </div>
      </div>
    `;
  }

  /**
   * Start auto-refresh of chart
   */
  startAutoRefresh() {
    // Initial update
    this.updateDashboardChart();
    
    // Refresh periodically
    this.refreshTimer = setInterval(() => {
      this.updateDashboardChart();
    }, this.refreshInterval);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  /**
   * Get token breakdown for current session
   */
  getTokenBreakdown() {
    return this.tokenData;
  }

  /**
   * Export stats as JSON
   */
  exportStats() {
    return {
      timestamp: new Date().toISOString(),
      tokenData: this.tokenData,
      distribution: this.getDistribution(),
      activityCount: this.activityHistory.length
    };
  }
}

// Auto-initialize AnalyticsBot when DOM is ready
let analyticsBot;
document.addEventListener('DOMContentLoaded', () => {
  analyticsBot = new AnalyticsBot();
  analyticsBot.startAutoRefresh();
});
