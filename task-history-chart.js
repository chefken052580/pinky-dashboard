/**
 * Task History Chart - Completed tasks per day over last 30 days
 * Displays a visual chart showing task completion trends
 */

class TaskHistoryChart {
  constructor() {
    this.apiBase = '';
    this.updateInterval = 300000; // 5 minutes
    this.initialized = false;
    this.chartData = [];
    this.chartElement = null;
  }

  async init() {
    console.log('[TaskHistoryChart] Initializing...');
    
    // Wait for container to be ready
    this.chartElement = document.getElementById('task-history-chart-container');
    if (!this.chartElement) {
      console.error('[TaskHistoryChart] Container not found');
      setTimeout(() => this.init(), 500);
      return;
    }

    // Initial render with loading state
    this.renderLoading();
    
    // Fetch data
    await this.fetchTaskHistory();
    
    // Set up auto-refresh
    setInterval(() => this.fetchTaskHistory(), this.updateInterval);
    
    this.initialized = true;
    console.log('[TaskHistoryChart] Initialized');
  }

  renderLoading() {
    this.chartElement.innerHTML = `
      <div class="task-history-header">
        <h3>📈 Task History - Last 30 Days</h3>
        <span class="update-status">⏳ Loading...</span>
      </div>
      <div style="padding: 20px; text-align: center; color: #999;">Loading task completion data...</div>
    `;
  }

  async fetchTaskHistory() {
    try {
      console.log('[TaskHistoryChart] Fetching from:', this.apiBase + '/api/tasks');
      const response = await fetch(this.apiBase + '/api/tasks');
      if (!response.ok) {
        console.error('[TaskHistoryChart] API error:', response.status);
        this.renderError('API error ' + response.status);
        return false;
      }

      const tasks = await response.json();
      console.log('[TaskHistoryChart] Received ' + tasks.length + ' tasks');
      if (!Array.isArray(tasks)) {
        console.error('[TaskHistoryChart] Invalid response - not an array');
        this.renderError('Invalid response format');
        return false;
      }

      // Filter completed tasks
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      console.log('[TaskHistoryChart] Completed tasks: ' + completedCount);

      // Process task completion history
      const historyData = this.processTaskData(tasks);
      console.log('[TaskHistoryChart] Processed ' + historyData.length + ' days of data');
      this.chartData = historyData;
      
      this.render();
      console.log('[TaskHistoryChart] Data fetched and rendered');
      return true;
    } catch (error) {
      console.error('[TaskHistoryChart] Fetch error:', error);
      this.renderError(error.message);
      return false;
    }
  }

  processTaskData(tasks) {
    // Group completed tasks by day (last 30 days, including today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    // Create a map of dates to counts
    const dailyCounts = {};
    
    // Initialize all dates with 0 (31 days to ensure today is included)
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }

    console.log('[TaskHistoryChart] Date range: ' + Object.keys(dailyCounts).sort()[0] + ' to ' + Object.keys(dailyCounts).sort().reverse()[0]);

    // Count completed tasks by date
    let processedCount = 0;
    tasks.forEach(task => {
      if (task.status === 'completed' && task.updated) {
        // Normalize date to YYYY-MM-DD format
        let taskDate = task.updated;
        if (taskDate.includes('T')) {
          taskDate = taskDate.split('T')[0];
        }
        // Check if this date is in our range
        if (dailyCounts.hasOwnProperty(taskDate)) {
          dailyCounts[taskDate]++;
          processedCount++;
        } else {
          console.log('[TaskHistoryChart] Task date out of range: ' + taskDate + ' (task: ' + task.name.substring(0, 30) + ')');
        }
      }
    });
    
    console.log('[TaskHistoryChart] Processed ' + processedCount + ' completed tasks');

    // Convert to sorted array
    const result = Object.keys(dailyCounts)
      .sort()
      .map(date => ({
        date: date,
        count: dailyCounts[date],
        label: this.formatDateLabel(date)
      }));

    return result;
  }

  formatDateLabel(dateStr) {
    // Parse date string safely
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  render() {
    if (!this.chartElement) {
      console.error('[TaskHistoryChart] No chart element found');
      return;
    }
    
    if (!this.chartData || this.chartData.length === 0) {
      console.warn('[TaskHistoryChart] No chart data available');
      this.renderError('No data available');
      return;
    }

    // Calculate stats
    const totalCompleted = this.chartData.reduce((sum, day) => sum + day.count, 0);
    const allCounts = this.chartData.map(d => d.count);
    const maxDaily = Math.max(...allCounts, 1);
    const avgDaily = totalCompleted > 0 ? (totalCompleted / this.chartData.length).toFixed(1) : 0;
    const todayCount = this.chartData[this.chartData.length - 1]?.count || 0;
    
    console.log('[TaskHistoryChart] Stats - Total: ' + totalCompleted + ', Max: ' + maxDaily + ', Avg: ' + avgDaily + ', Today: ' + todayCount + ', Days: ' + this.chartData.length);
    
    console.log('[TaskHistoryChart] Rendering: total=' + totalCompleted + ', max=' + maxDaily + ', avg=' + avgDaily + ', today=' + todayCount);

    // Create bar chart HTML
    const bars = this.chartData.map((day, idx) => {
      // Calculate height as percentage, minimum 2% for visibility
      const barHeightPercent = day.count > 0 ? Math.max((day.count / maxDaily) * 100, 2) : 0;
      const isToday = idx === this.chartData.length - 1;
      const barColor = isToday ? '#44ff44' : '#4488ff';
      
      return `
        <div class="chart-bar-container" title="${day.date}: ${day.count} tasks">
          <div class="chart-bar" style="
            height: ${barHeightPercent}%;
            background: ${barColor};
            opacity: ${isToday ? '1' : '0.8'};
          "></div>
          <div class="chart-label">${day.label}</div>
          <div class="chart-value">${day.count}</div>
        </div>
      `;
    }).join('');

    this.chartElement.innerHTML = `
      <div class="task-history-header">
        <h3>📈 Task History - Last 30 Days</h3>
        <span class="update-status" style="color: #44ff44;">✓ Live</span>
      </div>
      
      <div class="task-history-stats">
        <div class="history-stat">
          <span class="stat-label">Total Completed</span>
          <span class="stat-value">${totalCompleted}</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">Daily Average</span>
          <span class="stat-value">${avgDaily}</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">Peak Daily</span>
          <span class="stat-value">${maxDaily}</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">Today</span>
          <span class="stat-value">${todayCount}</span>
        </div>
      </div>

      <div class="task-history-chart">
        <div class="chart-bars">
          ${bars}
        </div>
      </div>

      <div class="task-history-legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #44ff44;"></div>
          <span>Today</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #4488ff;"></div>
          <span>Previous Days</span>
        </div>
      </div>
    `;
  }

  renderError(message) {
    this.chartElement.innerHTML = `
      <div class="task-history-header">
        <h3>📈 Task History</h3>
        <span class="update-status" style="color: #ff4444;">✗ Error</span>
      </div>
      <div style="padding: 20px; text-align: center; color: #ff4444;">
        Error loading task history: ${message}
      </div>
    `;
  }

  destroy() {
    this.initialized = false;
    console.log('[TaskHistoryChart] Destroyed');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.taskHistoryChart = new TaskHistoryChart();
    window.taskHistoryChart.init();
  });
} else {
  window.taskHistoryChart = new TaskHistoryChart();
  window.taskHistoryChart.init();
}
