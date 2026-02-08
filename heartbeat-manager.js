/**
 * HEARTBEAT MANAGER
 * On each heartbeat: Check TasksBot for pending tasks
 * If empty, auto-create self-improvement tasks
 * Track detailed metrics efficiently (file storage, not tokens)
 */

class HeartbeatManager {
  constructor() {
    this.sessionStart = Date.now();
    this.metrics = {
      heartbeatsCompleted: 0,
      tasksCreatedToday: 0,
      totalTokensUsed: 0,
      totalExecCalls: 0,
      tasksCompletedToday: 0,
      averageTaskTime: 0
    };
    this.suggestedTasks = [
      { name: 'Review and update MEMORY.md', type: 'learning', priority: 'high' },
      { name: 'Check system resources and optimize', type: 'maintenance', priority: 'medium' },
      { name: 'Improve code documentation', type: 'improvement', priority: 'medium' },
      { name: 'Test dashboard features', type: 'testing', priority: 'high' },
      { name: 'Organize workspace files', type: 'maintenance', priority: 'low' },
      { name: 'Review git logs for improvements', type: 'learning', priority: 'medium' },
      { name: 'Update project tracking', type: 'admin', priority: 'high' },
      { name: 'Analyze performance metrics', type: 'analysis', priority: 'medium' },
      { name: 'Create helpful bot improvements', type: 'enhancement', priority: 'high' },
      { name: 'Write memory notes from today', type: 'learning', priority: 'medium' }
    ];
    this.loadMetrics();
  }

  /**
   * Load metrics from efficient storage AND sync with activity file
   */
  loadMetrics() {
    try {
      const stored = localStorage.getItem('pinky-metrics');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = Object.assign(this.metrics, data);
      }
      // Also sync with activity JSON for accurate counts
      fetch('pinky-activity.json?t=' + Date.now())
        .then(r => r.json())
        .then(data => {
          if (data.heartbeatCount) this.metrics.heartbeatsCompleted = data.heartbeatCount;
          // Fetch task counts from API
          fetch('/api/tasks')
            .then(r => r.json())
            .then(tasks => {
              const completed = tasks.filter(t => t.status === 'completed').length;
              const inProgress = tasks.filter(t => t.status === 'in-progress').length;
              this.taskCounts = { completed, inProgress, total: tasks.length }; console.log('[Heartbeat] Task counts:', this.taskCounts);
              this.renderUI();
            }).catch(e => {});
          if (data.usage?.tokens) this.metrics.totalTokensUsed = data.usage.tokens;
          this.saveMetrics();
          this.renderUI();
        })
        .catch(e => console.log('[Heartbeat] Could not sync with activity file'));
    } catch (e) {
      console.log('[Heartbeat] Using default metrics');
    }
  }

  /**
   * Save metrics efficiently (no token burn)
   */
  saveMetrics() {
    try {
      localStorage.setItem('pinky-metrics', JSON.stringify(this.metrics));
    } catch (e) {
      console.log('[Heartbeat] Could not save metrics');
    }
  }

  /**
   * Check tasks on heartbeat
   */
  checkTasks() {
    if (!window.taskQueueManager) return null;
    
    const runningCount = window.taskQueueManager.tasks.length;
    const completedCount = window.taskQueueManager.completedTasks.length;
    
    return {
      hasRunning: runningCount > 0,
      runningCount: runningCount,
      completedCount: completedCount,
      isEmpty: runningCount === 0
    };
  }

  /**
   * Auto-assign tasks if queue is empty
   */
  autoAssignTasks() {
    const taskStatus = this.checkTasks();
    
    if (taskStatus && taskStatus.isEmpty) {
      // Pick 1-2 random suggested tasks
      const count = Math.random() > 0.7 ? 2 : 1;
      const selected = [];
      
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * this.suggestedTasks.length);
        selected.push(this.suggestedTasks[idx]);
      }
      
      // Assign them
      selected.forEach(task => {
        if (window.taskQueueManager) {
          window.taskQueueManager.logTaskStart(task.name, task.type);
          this.metrics.tasksCreatedToday++;
        }
      });
      
      this.saveMetrics();
      console.log('[Heartbeat] Auto-assigned ' + selected.length + ' tasks');
      return selected;
    }
    
    return null;
  }

  /**
   * Record heartbeat completion
   */
  recordHeartbeat(tokensUsed, execCalls) {
    this.metrics.heartbeatsCompleted++;
    this.metrics.totalTokensUsed += tokensUsed || 0;
    this.metrics.totalExecCalls += execCalls || 0;
    
    this.saveMetrics();
    
    // Post to activity API
    fetch('/api/activity/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity: 'Heartbeat #' + this.metrics.heartbeatsCompleted + ' - Tasks: ' + 
                  (this.checkTasks()?.runningCount || 0) + ' running, ' + 
                  (this.checkTasks()?.completedCount || 0) + ' completed',
        lagMs: 0,
        tokens: tokensUsed || 0,
        exec: execCalls || 0
      })
    }).catch(function(err) { console.error('[HeartbeatManager] Activity log failed:', err.message); });
  }

  /**
   * Render heartbeat status
   */
  renderUI() {
    const container = document.getElementById('heartbeat-status-container');
    if (!container) return;

    const taskStatus = this.checkTasks();
    
    let html = '<div class="heartbeat-status">';
    html += '<h3>💓 Heartbeat Status</h3>';
    html += '<div class="heartbeat-grid">';
    
    html += '<div class="heartbeat-stat">';
    html += '<span class="stat-label">Heartbeats</span>';
    html += '<span class="stat-value">' + this.metrics.heartbeatsCompleted + '</span>';
    html += '</div>';
    
    html += '<div class="heartbeat-stat">';
    html += '<span class="stat-label">Tasks Today</span>';
    html += '<span class="stat-value">' + (this.taskCounts?.completed || 0) + '</span>';
    html += '</div>';
    
    html += '<div class="heartbeat-stat">';
    html += '<span class="stat-label">In Progress</span>';
    html += '<span class="stat-value">' + (this.taskCounts?.inProgress || 0) + '</span>';
    html += '</div>';
    
    html += '<div class="heartbeat-stat">';
    html += '<span class="stat-label">Tokens Used</span>';
    html += '<span class="stat-value">' + this.metrics.totalTokensUsed + '</span>';
    html += '</div>';
    
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
  }

  /**
   * Run full heartbeat routine
   */
  async runHeartbeat() {
    console.log('[Heartbeat] Starting routine...');
    
    // Check tasks
    const autoTasks = this.autoAssignTasks();
    if (autoTasks) {
      console.log('[Heartbeat] Auto-created ' + autoTasks.length + ' tasks');
    }
    
    // Record heartbeat
    this.recordHeartbeat(0, 0); // 0 tokens since just checking
    
    // Update UI
    this.renderUI();
    
    console.log('[Heartbeat] Complete');
  }
}

// Initialize globally
try {
  window.heartbeatManager = new HeartbeatManager();
  console.log('[Heartbeat] Manager initialized');
} catch (e) {
  console.error('[Heartbeat] Error:', e);
}
