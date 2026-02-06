/**
 * TASK STATISTICS - Task Completion Metrics & Trend Analysis
 * Displays task completion data with trend indicators and performance metrics
 */

class TaskStatistics {
  constructor() {
    this.apiBase = ''; // Use relative paths for cross-origin compatibility
    this.updateInterval = 10000; // 10 seconds
    this.tasks = [];
    this.history = [];
    this.rawStats = null; // Store raw API stats for accurate calculations
    this.initialized = false;
  }

  /**
   * Initialize task statistics widget
   */
  async init() {
    console.log('[TaskStatistics] Init called, document ready:', document.readyState);
    const container = document.getElementById('task-statistics-container');
    if (!container) {
      console.error('[TaskStatistics] Container not found. Retrying in 500ms...');
      setTimeout(() => this.init(), 500);
      return;
    }

    console.log('[TaskStatistics] Container found, fetching initial data...');
    this.initialized = true;
    this.render(); // Show initial state
    await this.update(); // Fetch real data

    // Auto-update every 10 seconds
    setInterval(() => this.update(), this.updateInterval);
    console.log('[TaskStatistics] Initialization complete');
  }

  /**
   * Fetch task stats from API with robust error handling
   */
  async fetchTasks() {
    try {
      const res = await fetch(this.apiBase + '/api/tasks/stats', { timeout: 5000 });
      console.log('[TaskStatistics] Fetch response status:', res.status, 'OK:', res.ok);
      
      if (!res.ok) {
        console.error('[TaskStatistics] API error:', res.status, res.statusText);
        return false;
      }

      // Check content type before parsing JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[TaskStatistics] Invalid content type:', contentType);
        return false;
      }

      const data = await res.json();
      if (data.success && data.stats) {
        // Map API stats format to internal format
        this.tasks = [
          { status: 'completed', count: data.stats.completed },
          { status: 'pending', count: data.stats.pending },
          { status: 'in-progress', count: data.stats.inProgress },
          { status: 'analysis-ready', count: data.stats.analysisReady }
        ];
        this.rawStats = data.stats; // Store raw stats for direct access
        console.log('[TaskStatistics] Fetched stats:', data.stats);
        return true;
      } else {
        console.error('[TaskStatistics] Invalid response format:', data);
        return false;
      }
    } catch (err) {
      console.error('[TaskStatistics] Fetch error:', err.message);
      return false;
    }
  }

  /**
   * Calculate task statistics with debug logging
   */
  calculateStats() {
    let stats;
    
    // Use raw stats from API if available (more accurate)
    if (this.rawStats) {
      const total = this.rawStats.total || 0;
      const completed = this.rawStats.completed || 0;
      const parseRate = (rateStr) => {
        if (typeof rateStr === 'string' && rateStr.includes('%')) {
          return parseInt(rateStr);
        }
        return typeof rateStr === 'number' ? rateStr : 0;
      };
      
      stats = {
        total: total,
        completed: completed,
        inProgress: this.rawStats.inProgress || 0,
        blocked: this.rawStats.analysisReady || 0,
        pending: this.rawStats.pending || 0,
        completionRate: parseRate(this.rawStats.completionRate),
        trend: 'stable',
        avgTasksPerHeartbeat: 0
      };
    } else {
      // Fallback to calculating from tasks array
      stats = {
        total: this.tasks.length,
        completed: this.tasks.filter(t => t.status === 'completed').length,
        inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
        blocked: this.tasks.filter(t => t.status === 'analysis-ready').length,
        pending: this.tasks.filter(t => t.status === 'pending').length,
        completionRate: 0,
        trend: 'stable',
        avgTasksPerHeartbeat: 0
      };

      // Calculate completion rate for fallback
      if (stats.total > 0) {
        stats.completionRate = Math.round((stats.completed / stats.total) * 100);
      }
    }

    console.log('[TaskStatistics] Stats calculated:', stats);

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
    // Fetch heartbeat count from activity API
    try {
      const actRes = await fetch("/api/activity");
      if (actRes.ok) {
        const actData = await actRes.json();
        const hbCount = actData.heartbeatCount || 0;
        if (hbCount > 0 && stats.completed > 0) {
          stats.avgTasksPerHeartbeat = (stats.completed / hbCount).toFixed(1);
        }
      }
    } catch (e) {
      console.log("[TaskStatistics] Activity API unavailable:", e.message);
    }
    }

    return stats;
  }

  /**
   * Update statistics display with error status
   */
  async update() {
    const statusEl = document.getElementById('task-stats-status');
    if (statusEl) {
      statusEl.textContent = '⏳ Loading...';
    }

    const success = await this.fetchTasks();
    if (!success) {
      console.error('[TaskStatistics] Update failed - API unavailable');
      if (statusEl) {
        statusEl.textContent = '⚠️ API Error';
        statusEl.style.color = '#ff6644';
      }
      return;
    }

    const stats = this.calculateStats();
    console.log('[TaskStatistics] Rendering with stats:', stats);
    this.render(stats);

    if (statusEl) {
      statusEl.textContent = '✅ Live';
      statusEl.style.color = 'inherit';
    }
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

// Initialize on page load with better timing
console.log('[TaskStatistics] Script loaded, document state:', document.readyState);

function initTaskStatistics() {
  console.log('[TaskStatistics] Attempting to initialize...');
  window.taskStatistics = new TaskStatistics();
  window.taskStatistics.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTaskStatistics);
} else if (document.readyState === 'interactive') {
  setTimeout(initTaskStatistics, 100); // Small delay for DOM to fully settle
} else {
  initTaskStatistics();
}
