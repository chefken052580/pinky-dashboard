/**
 * TASKSBOT ENHANCED - Live Task Management with History
 * Loads tasks from projects.md via API
 * Supports drag-drop prioritization, task history, timestamps
 */

class TasksBotEnhanced {
  constructor() {
    this.allTasks = [];
    this.pendingTasks = [];
    this.runningTasks = [];
    this.completedTasks = [];
    this.updateInterval = 3000; // Refresh every 3 seconds
    this.apiUrl = 'http://localhost:3030/api/tasks';
    this.isInitialized = false; // Prevent double initialization
  }

  /**
   * Initialize TasksBot
   */
  async init() {
    // Prevent double initialization
    if (this.isInitialized) {
      console.log('[TasksBot] Already initialized, skipping');
      return;
    }
    this.isInitialized = true;
    
    console.log('[TasksBot] Initializing enhanced version');
    // Wait for initial task load
    await this.loadTasks();
    
    // Setup drag-drop handlers
    this.setupDragDrop();
    
    // Auto-refresh every 3 seconds
    setInterval(() => this.loadTasks(), this.updateInterval);
    
    console.log('[TasksBot] Initialization complete - ' + this.allTasks.length + ' tasks loaded');
  }

  /**
   * Load tasks from API (reads projects.md)
   */
  async loadTasks() {
    let tasks = [];
    
    // Try multiple sources for tasks
    const apiUrls = [
      'http://localhost:3030/api/tasks',
      'https://pinky-api.crackerbot.io/api/tasks',
      './tasks-data.json',
      '../bot-backend/tasks-data.json'
    ];
    
    for (const url of apiUrls) {
      try {
        console.log('[TasksBot] Trying to load from: ' + url);
        const response = await fetch(url, { cache: 'no-store', timeout: 3000 });
        
        if (!response.ok) {
          console.log('[TasksBot] ' + url + ' returned ' + response.status);
          continue;
        }
        
        const data = await response.json();
        
        // Handle both array and object responses
        tasks = Array.isArray(data) ? data : (data.tasks || []);
        
        if (tasks && tasks.length > 0) {
          console.log('[TasksBot] Loaded ' + tasks.length + ' tasks from: ' + url);
          break;
        }
      } catch (err) {
        console.log('[TasksBot] Failed to load from ' + url + ': ' + err.message);
        continue;
      }
    }
    
    if (!tasks || tasks.length === 0) {
      console.log('[TasksBot] No tasks found from any source');
    }

    // Sort tasks by status and priority
    this.allTasks = tasks;
    
    // Categorize tasks
    this.pendingTasks = tasks.filter(t => t.status === 'pending').sort((a, b) => {
      const priorityOrder = { P1: 0, P2: 1, P3: 2 };
      return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
    });
    
    this.runningTasks = tasks.filter(t => t.status === 'in-progress');
    
    this.completedTasks = tasks.filter(t => t.status === 'completed');

    this.render();
    this.saveToLocalStorage();
  }

  /**
   * Setup drag-drop functionality
   */
  setupDragDrop() {
    // Will attach to rendered elements
    setTimeout(() => {
      document.querySelectorAll('[draggable="true"]').forEach(el => {
        el.addEventListener('dragstart', (e) => this.onDragStart(e));
        el.addEventListener('dragend', (e) => this.onDragEnd(e));
      });

      document.querySelectorAll('[data-drop-zone]').forEach(zone => {
        zone.addEventListener('dragover', (e) => this.onDragOver(e));
        zone.addEventListener('drop', (e) => this.onDrop(e));
        zone.addEventListener('dragleave', (e) => this.onDragLeave(e));
      });
    }, 100);
  }

  /**
   * Drag start
   */
  onDragStart(e) {
    const task = JSON.parse(e.target.dataset.task || '{}');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
    e.target.classList.add('dragging');
  }

  /**
   * Drag end
   */
  onDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('[data-drop-zone]').forEach(z => {
      z.classList.remove('drag-over');
    });
  }

  /**
   * Drag over
   */
  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }

  /**
   * Drag leave
   */
  onDragLeave(e) {
    if (e.currentTarget === e.target) {
      e.currentTarget.classList.remove('drag-over');
    }
  }

  /**
   * Drop - reorder or mark complete
   */
  async onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    try {
      const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const dropZone = e.currentTarget;
      const targetStatus = dropZone.dataset.dropZone;

      // Don't move if dropping in same zone
      if (taskData.status === targetStatus) {
        return;
      }

      console.log('[TasksBot] Moving task to: ' + targetStatus);
      
      // Update via API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          taskName: taskData.name,
          newStatus: targetStatus
        })
      });

      if (response.ok) {
        console.log('[TasksBot] Task updated');
        this.loadTasks();
      }
    } catch (err) {
      console.log('[TasksBot] Drop error: ' + err.message);
    }
  }

  /**
   * Move task up in priority
   */
  async movePriority(taskName, direction) {
    const priorityOrder = ['P1', 'P2', 'P3'];
    const task = this.allTasks.find(t => t.name === taskName);
    if (!task) return;

    const currentIdx = priorityOrder.indexOf(task.priority || 'P2');
    const newIdx = direction === 'up' ? Math.max(0, currentIdx - 1) : Math.min(2, currentIdx + 1);
    const newPriority = priorityOrder[newIdx];

    console.log('[TasksBot] Changing priority: ' + task.priority + ' → ' + newPriority);

    // Update via API
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_priority',
          taskName: taskName,
          newPriority: newPriority
        })
      });

      this.loadTasks();
    } catch (err) {
      console.log('[TasksBot] Priority update error: ' + err.message);
    }
  }

  /**
   * Add new task
   */
  async addTask(taskName, priority) {
    if (!taskName || taskName.trim().length === 0) {
      alert('Task name cannot be empty');
      return;
    }

    console.log('[TasksBot] Adding task: ' + taskName);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: taskName.trim(),
          priority: priority || 'P2',
          status: 'pending',
          assigned: new Date().toISOString(),
          notes: ''
        })
      });

      if (response.ok) {
        console.log('[TasksBot] Task created');
        // Clear input
        const input = document.getElementById('new-task-input');
        if (input) input.value = '';
        // Reload tasks
        this.loadTasks();
      } else {
        alert('Failed to create task');
      }
    } catch (err) {
      console.log('[TasksBot] Create error: ' + err.message);
      alert('Error: ' + err.message);
    }
  }

  /**
   * Render TasksBot UI
   */
  render() {
    // Try both possible container IDs
    let container = document.getElementById('tasksbot-container') || 
                    document.getElementById('tasks-bot-container') ||
                    document.getElementById('task-queue-container');
    if (!container) {
      console.log('[TasksBot] No container found (tried: tasksbot-container, tasks-bot-container, task-queue-container)');
      return;
    }

    let html = '<div class="tasks-bot-enhanced">';
    html += '<h3>🎯 Task Management</h3>';

    // Summary stats
    html += '<div class="task-stats">';
    html += '<div class="stat">Pending: <strong>' + this.pendingTasks.length + '</strong></div>';
    html += '<div class="stat">Running: <strong>' + this.runningTasks.length + '</strong></div>';
    html += '<div class="stat">Completed: <strong>' + this.completedTasks.length + '</strong></div>';
    html += '</div>';

    // Add new task section
    html += '<div class="add-task-section">';
    html += '<h4>➕ Add New Task</h4>';
    html += '<div class="add-task-input">';
    html += '<input type="text" id="new-task-input" placeholder="Task name..." />';
    html += '<select id="new-task-priority">';
    html += '<option value="P1">P1 (Urgent)</option>';
    html += '<option value="P2" selected>P2 (Normal)</option>';
    html += '<option value="P3">P3 (Low)</option>';
    html += '</select>';
    html += '<button onclick="window.tasksBotEnhanced.addTaskFromUI()">Add Task</button>';
    html += '</div>';
    html += '</div>';

    // Pending tasks (tree structure with priority drag)
    html += '<div class="task-section">';
    html += '<h4>📋 Pending Tasks (' + this.pendingTasks.length + ')</h4>';
    html += '<div class="task-list" data-drop-zone="pending">';
    
    if (this.pendingTasks.length === 0) {
      html += '<p class="empty">No pending tasks</p>';
    } else {
      this.pendingTasks.forEach((task, idx) => {
        const priorityColor = task.priority === 'P1' ? 'priority-p1' : 
                            task.priority === 'P2' ? 'priority-p2' : 'priority-p3';
        
        html += '<div class="task-item ' + priorityColor + '" draggable="true" data-task="' + JSON.stringify(task).replace(/"/g, '&quot;') + '">';
        html += '<div class="task-header">';
        html += '<span class="priority-badge">' + (task.priority || 'P3') + '</span>';
        html += '<span class="task-name">' + task.name + '</span>';
        html += '<div class="task-actions">';
        html += '<button onclick="window.tasksBotEnhanced.movePriority(\'' + task.name + '\', \'up\')" title="Higher priority">↑</button>';
        html += '<button onclick="window.tasksBotEnhanced.movePriority(\'' + task.name + '\', \'down\')" title="Lower priority">↓</button>';
        html += '</div>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + task.notes + '</div>';
        }
        
        html += '<div class="task-meta">';
        html += '<span class="assigned">Assigned: ' + (task.assigned || 'unknown') + '</span>';
        html += '</div>';
        html += '</div>';
      });
    }
    
    html += '</div>';
    html += '</div>';

    // Running tasks
    html += '<div class="task-section">';
    html += '<h4>⏳ Running Tasks (' + this.runningTasks.length + ')</h4>';
    html += '<div class="task-list" data-drop-zone="in-progress">';
    
    if (this.runningTasks.length === 0) {
      html += '<p class="empty">No running tasks</p>';
    } else {
      this.runningTasks.forEach(task => {
        html += '<div class="task-item running" draggable="true" data-task="' + JSON.stringify(task).replace(/"/g, '&quot;') + '">';
        html += '<div class="task-header">';
        html += '<span class="status-badge running">⏳ IN PROGRESS</span>';
        html += '<span class="task-name">' + task.name + '</span>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + task.notes + '</div>';
        }
        
        html += '<div class="task-meta">';
        html += '<span>Updated: ' + this.formatTime(task.updated) + '</span>';
        html += '</div>';
        html += '</div>';
      });
    }
    
    html += '</div>';
    html += '</div>';

    // Completed tasks with history
    html += '<div class="task-section completed-section">';
    html += '<h4>✅ Completed Tasks (' + this.completedTasks.length + ')</h4>';
    html += '<div class="task-list" data-drop-zone="completed">';
    
    if (this.completedTasks.length === 0) {
      html += '<p class="empty">No completed tasks</p>';
    } else {
      // Show most recent first
      this.completedTasks.slice().reverse().forEach(task => {
        html += '<div class="task-item completed">';
        html += '<div class="task-header">';
        html += '<span class="status-badge completed">✓ DONE</span>';
        html += '<span class="task-name">' + task.name + '</span>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + task.notes + '</div>';
        }
        
        html += '<div class="task-meta">';
        html += '<span>Completed: ' + this.formatTime(task.updated) + '</span>';
        html += '</div>';
        html += '</div>';
      });
    }
    
    html += '</div>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;

    // Re-setup drag-drop after rendering
    this.setupDragDrop();
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    try {
      if (!timestamp) return 'unknown';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
    } catch (e) {
      return timestamp;
    }
  }

  /**
   * Add task from UI (called by button)
   */
  addTaskFromUI() {
    const input = document.getElementById('new-task-input');
    const priority = document.getElementById('new-task-priority');
    
    if (!input || !priority) {
      console.log('[TasksBot] UI elements not found');
      return;
    }

    const taskName = input.value;
    const taskPriority = priority.value;
    
    this.addTask(taskName, taskPriority);
  }

  /**
   * Save to localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('pinky-tasks-enhanced', JSON.stringify({
        pending: this.pendingTasks.length,
        running: this.runningTasks.length,
        completed: this.completedTasks.length,
        lastUpdate: new Date().toISOString()
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

// Initialize globally
window.tasksBotEnhanced = new TasksBotEnhanced();
console.log('[TasksBot] Enhanced version ready');
