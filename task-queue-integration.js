/**
 * TASK QUEUE INTEGRATION
 * Real-time task logging during heartbeats
 * Minimal token usage (logs are written, not processed)
 */

class TaskQueueManager {
  constructor() {
    this.tasks = [];
    this.completedTasks = [];
    this.activeTask = null;
  }

  /**
   * Log a task start (minimal logging)
   */
  logTaskStart(taskName, type = 'task') {
    const task = {
      id: Date.now(),
      name: taskName,
      type: type, // 'task', 'project', 'heartbeat', 'fix', 'feature'
      status: 'running',
      started: new Date().toISOString(),
      duration: 0
    };
    this.activeTask = task;
    this.tasks.unshift(task);
    this.saveToLocalStorage();
    return task;
  }

  /**
   * Log a task complete (minimal logging)
   */
  logTaskComplete(taskId, notes = '') {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completed = new Date().toISOString();
      task.duration = Math.round((new Date(task.completed) - new Date(task.started)) / 1000);
      task.notes = notes;
      
      this.completedTasks.push(task);
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.activeTask = null;
      this.saveToLocalStorage();
      
      // Post to activity API (no processing, just log)
      this.postToActivity(task);
    }
  }

  /**
   * Post completed task to activity system (minimal token usage)
   */
  postToActivity(task) {
    const message = '[' + task.type.toUpperCase() + '] ' + task.name + ' (' + task.duration + 's)';
    
    fetch('http://localhost:3030/api/activity/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity: message,
        lagMs: 0,
        tokens: 0,
        exec: 0
      })
    }).catch(function() {
      // Graceful fail if API unavailable
    });
  }

  /**
   * Save to localStorage (no token cost)
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('pinky-tasks', JSON.stringify({
        active: this.activeTask,
        running: this.tasks.slice(0, 50), // Keep last 50
        completed: this.completedTasks.slice(0, 100) // Keep last 100
      }));
    } catch (e) {
      console.log('[TaskQueue] localStorage unavailable');
    }
  }

  /**
   * Load from localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('pinky-tasks');
      if (stored) {
        const data = JSON.parse(stored);
        this.activeTask = data.active;
        this.tasks = data.running || [];
        this.completedTasks = data.completed || [];
      }
    } catch (e) {
      console.log('[TaskQueue] Error loading from storage');
    }
  }

  /**
   * Render task queue UI in TasksBot
   */
  renderUI() {
    const container = document.getElementById('task-queue-container');
    if (!container) return;

    let html = '<div class="task-queue-section">';
    html += '<h3>📋 Task Queue & History</h3>';
    
    // Active task
    if (this.activeTask) {
      const now = new Date();
      const started = new Date(this.activeTask.started);
      const elapsed = Math.round((now - started) / 1000);
      html += '<div class="active-task">';
      html += '<div class="task-status running">⏳ Running</div>';
      html += '<div class="task-title">' + this.activeTask.name + '</div>';
      html += '<div class="task-time">' + elapsed + 's elapsed</div>';
      html += '</div>';
    }

    // Running tasks
    html += '<div class="running-tasks">';
    html += '<h4>Running (' + this.tasks.length + ')</h4>';
    if (this.tasks.length === 0) {
      html += '<p class="empty">No tasks running</p>';
    } else {
      this.tasks.slice(0, 10).forEach(task => {
        const elapsed = Math.round((new Date() - new Date(task.started)) / 1000);
        html += '<div class="task-item">';
        html += '<span class="task-type">[' + task.type.toUpperCase() + ']</span> ';
        html += '<span class="task-name">' + task.name + '</span> ';
        html += '<span class="task-time">(' + elapsed + 's)</span>';
        html += '<button class="task-complete-btn" onclick="window.taskQueueManager.logTaskComplete(' + task.id + ', \'' + task.name + '\')">✓ Done</button>';
        html += '</div>';
      });
    }
    html += '</div>';

    // Completed tasks
    html += '<div class="completed-tasks">';
    html += '<h4>Completed Today (' + this.completedTasks.length + ')</h4>';
    if (this.completedTasks.length === 0) {
      html += '<p class="empty">No completed tasks</p>';
    } else {
      this.completedTasks.slice(0, 15).forEach(task => {
        html += '<div class="completed-item">';
        html += '<span class="completed-check">✓</span>';
        html += '<span class="completed-title">' + task.name + '</span>';
        html += '<span class="completed-time">' + task.duration + 's</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }
}

// Initialize globally
window.taskQueueManager = new TaskQueueManager();
window.taskQueueManager.loadFromLocalStorage();

console.log('[TaskQueue] Initialized');
