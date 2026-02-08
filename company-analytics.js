/**
 * Company Analytics Dashboard
 * Track per-company metrics: posts, engagement, growth, performance
 * Part of Phase 3.4 - Multi-Company Social Management
 */

class CompanyAnalytics {
  constructor() {
    this.currentCompanyId = null;
    this.charts = {};
    this.dateRange = '30d'; // Default: 30 days
    this.initialized = false;
  }

  async init(companyId) {
    if (!companyId) {
      console.warn('CompanyAnalytics: No company ID provided');
      return;
    }

    this.currentCompanyId = companyId;
    await this.loadAnalytics();
    this.setupEventListeners();
    this.initialized = true;
  }

  async loadAnalytics() {
    try {
      this.showLoading();

      const response = await fetch(`http://192.168.254.4:3030/api/analytics/company/${this.currentCompanyId}?range=${this.dateRange}`);
      
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      const data = await response.json();
      this.renderAnalytics(data);
    } catch (error) {
      console.error('Failed to load company analytics:', error);
      this.showError('Failed to load analytics. Please try again.');
    }
  }

  showLoading() {
    const container = document.getElementById('company-analytics-container');
    if (!container) return;

    container.innerHTML = `
      <div class="analytics-loading">
        <div class="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    `;
  }

  showError(message) {
    const container = document.getElementById('company-analytics-container');
    if (!container) return;

    container.innerHTML = `
      <div class="analytics-error">
        <p class="error-message">⚠️ ${message}</p>
        <button class="btn-retry" onclick="companyAnalytics.loadAnalytics()">Retry</button>
      </div>
    `;
  }

  renderAnalytics(data) {
    const container = document.getElementById('company-analytics-container');
    if (!container) return;

    container.innerHTML = `
      <div class="analytics-header">
        <h2>📊 Analytics for ${data.companyName || 'Company'}</h2>
        <div class="date-range-filters">
          <button class="range-btn ${this.dateRange === '7d' ? 'active' : ''}" data-range="7d">7 Days</button>
          <button class="range-btn ${this.dateRange === '30d' ? 'active' : ''}" data-range="30d">30 Days</button>
          <button class="range-btn ${this.dateRange === '90d' ? 'active' : ''}" data-range="90d">90 Days</button>
          <button class="range-btn ${this.dateRange === 'custom' ? 'active' : ''}" data-range="custom">Custom</button>
        </div>
      </div>

      <div class="analytics-summary">
        <div class="metric-card">
          <div class="metric-icon">📝</div>
          <div class="metric-value">${data.totalPosts || 0}</div>
          <div class="metric-label">Total Posts</div>
          <div class="metric-change ${data.postsChange >= 0 ? 'positive' : 'negative'}">
            ${data.postsChange >= 0 ? '↑' : '↓'} ${Math.abs(data.postsChange || 0)}%
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">❤️</div>
          <div class="metric-value">${this.formatNumber(data.totalEngagement || 0)}</div>
          <div class="metric-label">Total Engagement</div>
          <div class="metric-change ${data.engagementChange >= 0 ? 'positive' : 'negative'}">
            ${data.engagementChange >= 0 ? '↑' : '↓'} ${Math.abs(data.engagementChange || 0)}%
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">👥</div>
          <div class="metric-value">${this.formatNumber(data.totalFollowers || 0)}</div>
          <div class="metric-label">Total Followers</div>
          <div class="metric-change ${data.followersChange >= 0 ? 'positive' : 'negative'}">
            ${data.followersChange >= 0 ? '↑' : '↓'} ${Math.abs(data.followersChange || 0)}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">📈</div>
          <div class="metric-value">${data.avgEngagementRate || 0}%</div>
          <div class="metric-label">Avg Engagement Rate</div>
          <div class="metric-change ${data.rateChange >= 0 ? 'positive' : 'negative'}">
            ${data.rateChange >= 0 ? '↑' : '↓'} ${Math.abs(data.rateChange || 0)}%
          </div>
        </div>
      </div>

      <div class="analytics-charts">
        <div class="chart-container">
          <h3>📊 Follower Growth</h3>
          <canvas id="follower-growth-chart"></canvas>
        </div>

        <div class="chart-container">
          <h3>📱 Platform Comparison</h3>
          <canvas id="platform-comparison-chart"></canvas>
        </div>

        <div class="chart-container full-width">
          <h3>⏰ Best Posting Times (Engagement Heatmap)</h3>
          <div id="posting-times-heatmap"></div>
        </div>

        <div class="chart-container full-width">
          <h3>🏆 Top Performing Posts</h3>
          <div id="top-posts-list"></div>
        </div>
      </div>

      <div class="analytics-actions">
        <button class="btn-export" onclick="companyAnalytics.exportReport('csv')">📥 Export CSV</button>
        <button class="btn-export" onclick="companyAnalytics.exportReport('pdf')">📄 Export PDF</button>
      </div>
    `;

    // Render charts with data
    this.renderFollowerGrowthChart(data.followerGrowth || []);
    this.renderPlatformComparisonChart(data.platformStats || {});
    this.renderPostingTimesHeatmap(data.postingTimes || {});
    this.renderTopPosts(data.topPosts || []);
  }

  renderFollowerGrowthChart(growthData) {
    const ctx = document.getElementById('follower-growth-chart');
    if (!ctx) return;

    // Destroy existing chart if any
    if (this.charts.followerGrowth) {
      this.charts.followerGrowth.destroy();
    }

    this.charts.followerGrowth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: growthData.map(d => d.date),
        datasets: [{
          label: 'Followers',
          data: growthData.map(d => d.count),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y.toLocaleString()} followers`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatNumber(value)
            }
          }
        }
      }
    });
  }

  renderPlatformComparisonChart(platformStats) {
    const ctx = document.getElementById('platform-comparison-chart');
    if (!ctx) return;

    if (this.charts.platformComparison) {
      this.charts.platformComparison.destroy();
    }

    const platforms = Object.keys(platformStats);
    const engagementData = platforms.map(p => platformStats[p].engagement || 0);
    const postCounts = platforms.map(p => platformStats[p].posts || 0);

    this.charts.platformComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: platforms,
        datasets: [
          {
            label: 'Engagement',
            data: engagementData,
            backgroundColor: '#00d4ff',
            yAxisID: 'y'
          },
          {
            label: 'Posts',
            data: postCounts,
            backgroundColor: '#667eea',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Engagement' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Posts' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  renderPostingTimesHeatmap(postingTimes) {
    const container = document.getElementById('posting-times-heatmap');
    if (!container) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({length: 24}, (_, i) => i);

    let html = '<div class="heatmap-grid">';
    
    // Header row with hours
    html += '<div class="heatmap-row"><div class="heatmap-cell header"></div>';
    hours.forEach(hour => {
      html += `<div class="heatmap-cell header">${hour}:00</div>`;
    });
    html += '</div>';

    // Data rows for each day
    days.forEach((day, dayIndex) => {
      html += `<div class="heatmap-row"><div class="heatmap-cell header">${day}</div>`;
      hours.forEach(hour => {
        const key = `${dayIndex}_${hour}`;
        const engagement = postingTimes[key] || 0;
        const intensity = this.getHeatmapIntensity(engagement);
        html += `<div class="heatmap-cell" data-engagement="${engagement}" style="background: ${this.getHeatmapColor(intensity)}" title="${day} ${hour}:00 - ${engagement} engagement"></div>`;
      });
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  getHeatmapIntensity(value) {
    // Normalize engagement value to 0-1 scale
    const maxEngagement = 1000; // Adjust based on typical values
    return Math.min(value / maxEngagement, 1);
  }

  getHeatmapColor(intensity) {
    // Gradient from transparent to cyan/purple
    const r = Math.round(102 * (1 - intensity) + 0 * intensity);
    const g = Math.round(126 * (1 - intensity) + 212 * intensity);
    const b = Math.round(234 * (1 - intensity) + 255 * intensity);
    return `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`;
  }

  renderTopPosts(topPosts) {
    const container = document.getElementById('top-posts-list');
    if (!container) return;

    if (!topPosts || topPosts.length === 0) {
      container.innerHTML = '<p class="no-data">No posts found for this period.</p>';
      return;
    }

    let html = '<div class="top-posts-list">';
    topPosts.slice(0, 10).forEach((post, index) => {
      html += `
        <div class="top-post-item">
          <div class="post-rank">#${index + 1}</div>
          <div class="post-content">
            <div class="post-platform">${post.platform || 'Unknown'}</div>
            <div class="post-text">${this.truncate(post.content, 100)}</div>
            <div class="post-date">${this.formatDate(post.date)}</div>
          </div>
          <div class="post-metrics">
            <span class="metric">❤️ ${this.formatNumber(post.likes || 0)}</span>
            <span class="metric">🔄 ${this.formatNumber(post.shares || 0)}</span>
            <span class="metric">💬 ${this.formatNumber(post.comments || 0)}</span>
            <span class="metric">👁️ ${this.formatNumber(post.views || 0)}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  setupEventListeners() {
    // Date range filter buttons
    document.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const range = e.target.getAttribute('data-range');
        if (range === 'custom') {
          this.showCustomRangePicker();
        } else {
          this.dateRange = range;
          this.loadAnalytics();
        }
      });
    });
  }

  showCustomRangePicker() {
    // TODO: Implement custom date range picker modal
    alert('Custom date range picker coming soon!');
  }

  async exportReport(format) {
    try {
      const response = await fetch(`http://192.168.254.4:3030/api/analytics/export/${this.currentCompanyId}?format=${format}&range=${this.dateRange}`);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${this.currentCompanyId}_${this.dateRange}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
    }
  }

  // Utility functions
  formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  }

  // Public method to refresh analytics
  refresh() {
    if (this.currentCompanyId) {
      this.loadAnalytics();
    }
  }

  // Public method to change company
  setCompany(companyId) {
    this.currentCompanyId = companyId;
    this.loadAnalytics();
  }
}

// Global instance
window.companyAnalytics = new CompanyAnalytics();
