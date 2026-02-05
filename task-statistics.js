/**
 * TASK STATISTICS - Task Completion Metrics & Trend Analysis
 * Displays task completion data with trend indicators and performance metrics
 */

class TaskStatistics {
  constructor() {
    this.apiBase = 'http://192.168.254.4:3030';
    this.updateInterval = 10000; // 10 seconds
    this.tasks = [];
    this.history = [];
  }

  /**
   * Initialize task statistics widget
   */
  async init() {
    console.log('[TaskStatistics] Initializing');
    const container = document.getElementById('task-statistics-container');
    if (!container) {
      console.log('[TaskStatistics] Container not found');
      return;
    }

    this.render();
    await this.update();

    // Auto-update every 10 seconds
    setInterval(() => this.update(), this.updateInterval);
  }

  /**
   * Fetch tasks from API
   */
  async fetchTasks() {
    try {
      const res = await fetch(this.apiBase + '/api/tasks', { timeout: 5000 });
      if (res.ok) {
        this.tasks = await res.json();
        this.calculateStats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[TaskStatistics] Fetch error:', err.message);
      return false;
    }
  }

  /**
   * Calculate task statistics
   */
  calculateStats() {
    const stats = {
      total: this.tasks.length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      blocked: this.tasks.filter(t => t.status === 'analysis-ready').length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      completionRate: 0,
      trend: 'stable',
      avgTasksPerHeartbeat: 0
    };

    // Calculate completion rate
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    // Analyze trend (if we have history, compare recent vs older)
    if (this.history.length >= 2) {
      const recent = this.history[this.history.length - 1];
      const previous = this.history[this.history.length - 2];
      const completionDiff = recent.completionRate - previous.completionRate;
      
      if (completionDiff > 5) stats.trend = 'improving';
      else if (completionDiff < -5) stats.trend = 'declining';
      else stats.trend = 'stable';
    }

    // Calculate average (store history for trend analysis)
    this.history.push(stats);
    if (this.history.length > 24) {
      this.history.shift(); // Keep last 24 updates
    }

    // Average tasks per heartbeat from activity log
    if (window.pinkyActivity && window.pinkyActivity.length > 0) {
      const heartbeatCount = window.pinkyActivity.filter(a => a.type === 'heartbeat').length;
      const taskCount = window.pinkyActivity.filter(a => a.type === 'task').length;
      if (heartbeatCount > 0) {
        stats.avgTasksPerHeartbeat = (taskCount / heartbeatCount).toFixed(1);
      }
    }

    return stats;
  }

  /**
   * Update statistics display
   */
  async update() {
    const success = await this.fetchTasks();
    if (!success) {
      document.getElementById('task-stats-status').textContent = '⚠️ Offline';
      return;
    }

    const stats = this.calculateStats();
    this.render(stats);
  }

  /**
   * Render task statistics widget
   */
  render(stats = null) {
    const container = document.getElementById('task-statistics-container');
    if (!container) return;

    if (!stats) {
      stats = {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        blocked: 0,
        completionRate: 0,
        trend: 'stable',
        avgTasksPerHeartbeat: 0
      };
    }

    // Determine trend emoji
    const trendEmoji = {
      'improving': '📈',
      'declining': '📉',
      'stable': '➡️'
    }[stats.trend] || '➡️';

    // Color for completion rate
    let rateColor = '#ff4444'; // red
    if (stats.completionRate >= 90) rateColor = '#44ff44'; // green
    else if (stats.completionRate >= 75) rateColor = '#ffbb44'; // orange
    else if (stats.completionRate >= 50) rateColor = '#ffdd44'; // yellow

    container.innerHTML = `
      <div class="task-stats-header">
        <h3>📊 Task Statistics</h3>
        <span id="task-stats-status" style="font-size: 0.9em; opacity: 0.7;">✅ Live</span>
      </div>
      <div class="task-stats-grid">
        <!-- Completion Rate (Large) -->
        <div class="task-stat-box large">
          <div class="stat-number" style="color: ${rateColor}; font-size: 2.5em;">${stats.completionRate}%</div>
          <div class="stat-label">Completion Rate</div>
          <div class="stat-bar">
            <div class="stat-bar-fill" style="width: ${stats.completionRate}%; background: ${rateColor};"></div>
          </div>
        </div>

        <!-- Completed Tasks -->
        <div class="task-stat-box">
          <div class="stat-number" style="color: #44ff44;">✅ ${stats.completed}</div>
          <div class="stat-label">Completed</div>
          <div class="stat-small">of ${stats.total} total</div>
        </div>

        <!-- In Progress -->
        <div class="task-stat-box">
          <div class="stat-number" style="color: #ffbb44;">⚙️ ${stats.inProgress}</div>
          <div class="stat-label">In Progress</div>
          <div class="stat-small">active work</div>
        </div>

        <!-- Pending -->
        <div class="task-stat-box">
          <div class="stat-number" style="color: #ddddff;">⏳ ${stats.pending}</div>
          <div class="stat-label">Pending</div>
          <div class="stat-small">waiting</div>
        </div>

        <!-- Blocked -->
        <div class="task-stat-box">
          <div class="stat-number" style="color: #ff8844;">🚫 ${stats.blocked}</div>
          <div class="stat-label">Blocked</div>
          <div class="stat-small">needs approval</div>
        </div>

        <!-- Trend -->
        <div class="task-stat-box">
          <div class="stat-number" style="font-size: 2em;">${trendEmoji}</div>
          <div class="stat-label">Trend</div>
          <div class="stat-small">${stats.trend}</div>
        </div>

        <!-- Avg Tasks/HB -->
        <div class="task-stat-box">
          <div class="stat-number" style="color: #9999ff;">${stats.avgTasksPerHeartbeat}</div>
          <div class="stat-label">Avg/Heartbeat</div>
          <div class="stat-small">tasks per cycle</div>
        </div>
      </div>

      <!-- Performance Summary -->
      <div class="task-stats-summary">
        <div class="summary-line">
          <span>📈 Performance:</span>
          <strong>${stats.completionRate >= 80 ? '⭐ Excellent' : stats.completionRate >= 60 ? '✅ Good' : '⚠️ Needs Work'}</strong>
        </div>
        <div class="summary-line">
          <span>🎯 Focus:</span>
          <strong>${stats.inProgress > 0 ? `${stats.inProgress} active task${stats.inProgress !== 1 ? 's' : ''}` : 'All caught up'}</strong>
        </div>
        <div class="summary-line">
          <span>🔄 Throughput:</span>
          <strong>${stats.avgTasksPerHeartbeat > 0 ? `${stats.avgTasksPerHeartbeat} tasks/cycle` : 'Calculating...'}</strong>
        </div>
      </div>
    `;
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.taskStatistics = new TaskStatistics();
    window.taskStatistics.init();
  });
} else {
  window.taskStatistics = new TaskStatistics();
  window.taskStatistics.init();
}
