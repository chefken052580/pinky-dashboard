/**
 * Task History Chart - Enhanced with real live data plots
 * Displays completed tasks per day with trend analysis and hourly breakdown
 */

class TaskHistoryChart {
  constructor() {
    this.apiBase = '';
    this.updateInterval = 60000; // Update every minute for live feel
    this.initialized = false;
    this.chartData = [];
    this.chartElement = null;
    this.animationFrame = null;
  }

  async init() {
    console.log('[TaskHistoryChart] Initializing enhanced version...');
    
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
    console.log('[TaskHistoryChart] Enhanced version initialized');
  }

  renderLoading() {
    this.chartElement.innerHTML = `
      <div class="task-history-header">
        <h3>📈 Task History - Last 30 Days</h3>
        <span class="update-status">⏳ Loading live data...</span>
      </div>
      <div style="padding: 20px; text-align: center; color: #999;">
        <div class="loading-spinner"></div>
        Fetching task completion data...
      </div>
    `;
  }

  async fetchTaskHistory() {
    try {
      console.log('[TaskHistoryChart] Fetching live data from:', this.apiBase + '/api/tasks');
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

      // Filter completed tasks with timestamps
      const completedTasks = tasks.filter(t => t.status === 'completed' && t.updated);
      console.log('[TaskHistoryChart] Processing ' + completedTasks.length + ' completed tasks');

      // Process task completion history
      const historyData = this.processTaskData(completedTasks);
      const todayHourly = this.processTodayHourlyData(completedTasks);
      
      console.log('[TaskHistoryChart] Processed ' + historyData.length + ' days of data');
      this.chartData = historyData;
      this.todayHourlyData = todayHourly;
      
      this.render();
      console.log('[TaskHistoryChart] Live data rendered successfully');
      return true;
    } catch (error) {
      console.error('[TaskHistoryChart] Fetch error:', error);
      this.renderError(error.message);
      return false;
    }
  }

  processTaskData(completedTasks) {
    // Group completed tasks by day (last 30 days, including today) in EST timezone
    const now = new Date();
    const todayEST = now.toLocaleDateString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // Convert MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = todayEST.split('/');
    const todayStr = `${year}-${month}-${day}`;
    
    // Create a map of dates to task counts
    const dailyCounts = {};
    
    // Initialize all dates with 0 (31 days to ensure today is included)
    const todayDate = new Date(year, month - 1, day);
    for (let i = 30; i >= 0; i--) {
      const date = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }

    console.log('[TaskHistoryChart] Date range (EST): ' + Object.keys(dailyCounts).sort()[0] + ' to ' + Object.keys(dailyCounts).sort().reverse()[0]);

    // Count completed tasks by date (convert UTC to EST)
    let processedCount = 0;
    completedTasks.forEach(task => {
      // Convert UTC timestamp to EST date
      const taskDateUTC = new Date(task.updated);
      const taskDateEST = taskDateUTC.toLocaleDateString('en-US', { 
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [m, d, y] = taskDateEST.split('/');
      const taskDate = `${y}-${m}-${d}`;
      
      // Check if this date is in our range
      if (dailyCounts.hasOwnProperty(taskDate)) {
        dailyCounts[taskDate]++;
        processedCount++;
      }
    });
    
    console.log('[TaskHistoryChart] Processed ' + processedCount + ' tasks with valid dates');

    // Convert to sorted array with trend data
    const result = Object.keys(dailyCounts)
      .sort()
      .map((date, idx, arr) => {
        const count = dailyCounts[date];
        // Calculate 3-day moving average for trend
        const prevDay1 = idx > 0 ? dailyCounts[arr[idx - 1]] : count;
        const prevDay2 = idx > 1 ? dailyCounts[arr[idx - 2]] : prevDay1;
        const movingAvg = ((count + prevDay1 + prevDay2) / 3).toFixed(1);
        
        return {
          date: date,
          count: count,
          movingAvg: parseFloat(movingAvg),
          label: this.formatDateLabel(date)
        };
      });

    return result;
  }

  processTodayHourlyData(completedTasks) {
    // Process today's tasks by hour (in EST timezone)
    const now = new Date();
    const todayEST = now.toLocaleDateString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [month, day, year] = todayEST.split('/');
    const todayStr = `${year}-${month}-${day}`;
    
    // Initialize 24 hours
    const hourlyCounts = Array(24).fill(0);
    
    completedTasks.forEach(task => {
      if (!task.updated || !task.updated.includes('T')) return;
      
      // Convert UTC timestamp to EST date and hour
      const taskDateUTC = new Date(task.updated);
      const taskDateEST = taskDateUTC.toLocaleDateString('en-US', { 
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [m, d, y] = taskDateEST.split('/');
      const taskDateStr = `${y}-${m}-${d}`;
      
      // Only count tasks from today (EST)
      if (taskDateStr === todayStr) {
        // Get the hour in EST
        const hourEST = parseInt(taskDateUTC.toLocaleTimeString('en-US', { 
          timeZone: 'America/New_York',
          hour12: false,
          hour: '2-digit'
        }));
        if (hourEST >= 0 && hourEST < 24) {
          hourlyCounts[hourEST]++;
        }
      }
    });
    
    return hourlyCounts;
  }

  formatDateLabel(dateStr) {
    // Parse date string safely
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  calculateTrend(data) {
    if (data.length < 7) return { direction: 'stable', percent: 0 };
    
    // Compare last 3 days to previous 3 days
    const recent = data.slice(-3).reduce((sum, d) => sum + d.count, 0) / 3;
    const previous = data.slice(-6, -3).reduce((sum, d) => sum + d.count, 0) / 3;
    
    if (previous === 0) return { direction: 'stable', percent: 0 };
    
    const percentChange = ((recent - previous) / previous * 100).toFixed(0);
    const direction = percentChange > 10 ? 'up' : percentChange < -10 ? 'down' : 'stable';
    
    return { direction, percent: Math.abs(percentChange) };
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

    // Calculate comprehensive stats
    const totalCompleted = this.chartData.reduce((sum, day) => sum + day.count, 0);
    const allCounts = this.chartData.map(d => d.count);
    const maxDaily = Math.max(...allCounts, 1);
    const avgDaily = totalCompleted > 0 ? (totalCompleted / this.chartData.length).toFixed(1) : 0;
    const todayCount = this.chartData[this.chartData.length - 1]?.count || 0;
    const yesterdayCount = this.chartData[this.chartData.length - 2]?.count || 0;
    const trend = this.calculateTrend(this.chartData);
    
    // Calculate streak
    let currentStreak = 0;
    for (let i = this.chartData.length - 1; i >= 0; i--) {
      if (this.chartData[i].count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    console.log('[TaskHistoryChart] Rendering: total=' + totalCompleted + ', max=' + maxDaily + ', avg=' + avgDaily + ', today=' + todayCount + ', trend=' + trend.direction);

    // Create bar chart HTML with animations
    const bars = this.chartData.map((day, idx) => {
      // Calculate height as percentage
      const barHeightPercent = day.count > 0 ? Math.max((day.count / maxDaily) * 100, 3) : 0;
      const movingAvgHeightPercent = Math.max((day.movingAvg / maxDaily) * 100, 1);
      const isToday = idx === this.chartData.length - 1;
      const isYesterday = idx === this.chartData.length - 2;
      
      // Color based on performance
      let barColor = '#4488ff'; // Default blue
      if (isToday) {
        barColor = '#44ff44'; // Green for today
      } else if (isYesterday) {
        barColor = '#66aaff'; // Light blue for yesterday
      } else if (day.count >= avgDaily) {
        barColor = '#5599ff'; // Above average
      }
      
      return `
        <div class="chart-bar-container" 
             title="${day.date}: ${day.count} tasks completed\nMoving Avg: ${day.movingAvg}"
             style="animation-delay: ${idx * 15}ms;">
          <div class="chart-bar-stack">
            <div class="chart-moving-avg" style="height: ${movingAvgHeightPercent}%;"></div>
            <div class="chart-bar" style="
              height: ${barHeightPercent}%;
              background: ${barColor};
              opacity: ${isToday ? '1' : '0.85'};
              animation: barGrow 0.6s ease-out ${idx * 15}ms both;
            "></div>
          </div>
          <div class="chart-value">${day.count}</div>
          <div class="chart-label">${day.label}</div>
        </div>
      `;
    }).join('');

    // Create hourly breakdown for today
    const currentHour = new Date().getHours();
    const hourlyBars = this.todayHourlyData.map((count, hour) => {
      const maxHourly = Math.max(...this.todayHourlyData, 1);
      const barHeightPercent = count > 0 ? Math.max((count / maxHourly) * 100, 3) : 0;
      const isPast = hour <= currentHour;
      const isCurrent = hour === currentHour;
      
      return `
        <div class="hourly-bar-container" title="${hour}:00 - ${count} tasks">
          <div class="hourly-bar" style="
            height: ${barHeightPercent}%;
            background: ${isCurrent ? '#44ff44' : isPast ? '#4488ff' : '#333'};
            opacity: ${isPast ? '1' : '0.3'};
          "></div>
          <div class="hourly-label">${hour}</div>
        </div>
      `;
    }).join('');

    // Trend indicator
    const trendIcon = trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️';
    const trendColor = trend.direction === 'up' ? '#44ff44' : trend.direction === 'down' ? '#ff4444' : '#ffaa44';
    const trendText = trend.direction === 'up' ? `+${trend.percent}%` : trend.direction === 'down' ? `-${trend.percent}%` : 'Stable';

    this.chartElement.innerHTML = `
      <div class="task-history-header">
        <h3>📈 Task History - Last 30 Days</h3>
        <span class="update-status live-indicator">
          <span class="pulse-dot"></span> LIVE
        </span>
      </div>
      
      <div class="task-history-stats">
        <div class="history-stat highlight">
          <span class="stat-label">Today</span>
          <span class="stat-value stat-large">${todayCount}</span>
          <span class="stat-change">${todayCount > yesterdayCount ? '↑' : todayCount < yesterdayCount ? '↓' : '→'} from yesterday (${yesterdayCount})</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">30-Day Total</span>
          <span class="stat-value">${totalCompleted}</span>
          <span class="stat-sublabel">${avgDaily} avg/day</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">Peak Day</span>
          <span class="stat-value">${maxDaily}</span>
          <span class="stat-sublabel">${Math.floor((maxDaily / avgDaily) * 100)}% above avg</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">3-Day Trend</span>
          <span class="stat-value" style="color: ${trendColor};">${trendIcon}</span>
          <span class="stat-sublabel" style="color: ${trendColor};">${trendText}</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">Active Streak</span>
          <span class="stat-value">${currentStreak}</span>
          <span class="stat-sublabel">${currentStreak === 1 ? 'day' : 'days'}</span>
        </div>
      </div>

      <div class="task-history-chart">
        <div class="chart-title">Daily Completions</div>
        <div class="chart-bars">
          ${bars}
        </div>
      </div>

      <div class="today-hourly-chart">
        <div class="chart-title">Today's Activity by Hour</div>
        <div class="hourly-bars">
          ${hourlyBars}
        </div>
        <div class="hourly-legend">
          <span style="color: #44ff44;">● Current Hour</span>
          <span style="color: #4488ff;">● Past Hours</span>
          <span style="color: #666;">○ Future Hours</span>
        </div>
      </div>

      <div class="task-history-legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #44ff44;"></div>
          <span>Today</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #66aaff;"></div>
          <span>Yesterday</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #5599ff;"></div>
          <span>Above Average</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #4488ff;"></div>
          <span>Below Average</span>
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

// Lazy initialization with Intersection Observer (performance optimization)
// Only render when chart becomes visible in viewport
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTaskHistoryChartLazy();
  });
} else {
  initTaskHistoryChartLazy();
}

function initTaskHistoryChartLazy() {
  const chartContainer = document.getElementById('task-history-chart-container');
  if (!chartContainer) {
    console.log('[TaskHistoryChart] Container not found, waiting...');
    setTimeout(initTaskHistoryChartLazy, 500);
    return;
  }
  
  // Use Intersection Observer for lazy rendering (only when visible)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !window.taskHistoryChart) {
        console.log('[TaskHistoryChart] 🚀 Chart visible, initializing now...');
        window.taskHistoryChart = new TaskHistoryChart();
        window.taskHistoryChart.init();
        observer.disconnect(); // Stop observing once initialized
      }
    });
  }, {
    rootMargin: '50px' // Start loading 50px before it enters viewport
  });
  
  observer.observe(chartContainer);
  console.log('[TaskHistoryChart] ⏸️ Deferred initialization (will load when visible)');
}
