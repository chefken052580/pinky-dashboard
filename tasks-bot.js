/**
 * TasksBot - Pinky's Task Management System
 * 
 * Features:
 * - Completed tasks view
 * - To-do list (pending projects)
 * - Input field for new tasks
 * - Drag-and-drop tree structure for priority reordering
 */

class TasksBot {
  constructor() {
    this.tasks = [];
    this.completedTasks = [];
    this.draggedElement = null;
    this.init();
  }

  /**
   * Initialize TasksBot
   */
  async init() {
    console.log('[TasksBot] Initializing...');
    await this.loadTasks();
    this.setupEventListeners();
    this.render();
  }

  /**
   * Load tasks from memory (simulated - would fetch from API in production)
   */
  async loadTasks() {
    // This would fetch from the backend API which reads memory/projects.md
    // For now, we'll initialize empty and fetch when available
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      this.tasks = data.filter(t => t.status !== 'completed');
      this.completedTasks = data.filter(t => t.status === 'completed');
    } catch (error) {
      console.log('[TasksBot] No API available yet, using empty state');
      this.tasks = [];
      this.completedTasks = [];
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // New task input
    const inputField = document.getElementById('new-task-input');
    const addBtn = document.getElementById('add-task-btn');

    if (inputField && addBtn) {
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addTask();
      });
      addBtn.addEventListener('click', () => this.addTask());
    }

    // Drag and drop
    // DISABLED: Document-level drag handlers conflict with tasks-bot-enhanced.js
    // tasks-bot-enhanced.js uses container-scoped handlers instead
    // document.addEventListener('dragstart', (e) => this.onDragStart(e));
    // document.addEventListener('dragover', (e) => this.onDragOver(e));
    // document.addEventListener('drop', (e) => this.onDrop(e));
    // document.addEventListener('dragend', (e) => this.onDragEnd(e));
  }

  /**
   * Add new task
   */
  addTask() {
    const inputField = document.getElementById('new-task-input');
    const taskText = inputField.value.trim();

    if (!taskText) return;

    const newTask = {
      id: Date.now(),
      name: taskText,
      status: 'pending',
      assigned: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      notes: ''
    };

    this.tasks.unshift(newTask);
    inputField.value = '';
    this.saveAndRender();

    // Notify user
    console.log('[TasksBot] Task added:', newTask.name);
  }

  /**
   * Complete a task
   */
  completeTask(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = this.tasks[taskIndex];
      task.status = 'completed';
      task.updated = new Date().toISOString().split('T')[0];
      this.completedTasks.push(task);
      this.tasks.splice(taskIndex, 1);
      this.saveAndRender();
    }
  }

  /**
   * Delete a task
   */
  deleteTask(taskId, isCompleted = false) {
    if (isCompleted) {
      this.completedTasks = this.completedTasks.filter(t => t.id !== taskId);
    } else {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
    }
    this.saveAndRender();
  }

  /**
   * Reorder tasks by priority (drag and drop)
   */
  reorderTasks(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= this.tasks.length) return;
    
    const [moved] = this.tasks.splice(fromIndex, 1);
    this.tasks.splice(toIndex, 0, moved);
    this.saveAndRender();
  }

  /**
   * Drag start handler
   */
  onDragStart(e) {
    if (e.target.classList.contains('task-item')) {
      this.draggedElement = e.target;
      e.target.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  /**
   * Drag over handler
   */
  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (e.target.classList.contains('task-item') && e.target !== this.draggedElement) {
      const allItems = document.querySelectorAll('.task-item:not(.dragging)');
      const afterElement = this.getDragAfterElement(e.clientY);

      if (afterElement == null) {
        document.getElementById('to-do-list')?.appendChild(this.draggedElement);
      } else {
        document.getElementById('to-do-list')?.insertBefore(this.draggedElement, afterElement);
      }
    }
  }

  /**
   * Get drag after element
   */
  getDragAfterElement(y) {
    const items = [...document.querySelectorAll('.task-item:not(.dragging)')];
    return items.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /**
   * Drop handler
   */
  onDrop(e) {
    e.preventDefault();
    if (this.draggedElement && this.draggedElement.classList.contains('task-item')) {
      const taskItems = document.querySelectorAll('#to-do-list .task-item');
      const newOrder = Array.from(taskItems).map(item => {
        const taskId = parseInt(item.getAttribute('data-task-id'));
        return this.tasks.find(t => t.id === taskId);
      }).filter(t => t);

      this.tasks = newOrder;
      this.saveAndRender();
    }
  }

  /**
   * Drag end handler
   */
  onDragEnd(e) {
    if (this.draggedElement) {
      this.draggedElement.classList.remove('dragging');
      this.draggedElement = null;
    }
  }

  /**
   * Save and re-render
   */
  async saveAndRender() {
    // Save to backend/API
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: this.tasks,
          completed: this.completedTasks
        })
      });
    } catch (error) {
      console.log('[TasksBot] Local mode - changes not persisted to API');
    }

    this.render();
  }

  /**
   * Render the TasksBot UI
   */
  render() {
    const container = document.getElementById('tasksbot-container');
    if (!container) return;

    const pendingCount = this.tasks.length;
    const completedCount = this.completedTasks.length;

    container.innerHTML = `
      <div class="tasksbot-section">
        <h2>🎯 TasksBot - Project Management</h2>
        
        <!-- Stats -->
        <div class="tasksbot-stats">
          <div class="stat-card">
            <span class="stat-icon">⏳</span>
            <span class="stat-label">Pending Tasks</span>
            <span class="stat-value">${pendingCount}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">✅</span>
            <span class="stat-label">Completed</span>
            <span class="stat-value">${completedCount}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🚀</span>
            <span class="stat-label">Completion Rate</span>
            <span class="stat-value">${this.tasks.length + this.completedTasks.length > 0 ? Math.round((completedCount / (pendingCount + completedCount)) * 100) : 0}%</span>
          </div>
        </div>

        <!-- Input Section -->
        <div class="tasksbot-input-section">
          <h3>📝 Assign New Task</h3>
          <div class="input-group">
            <input 
              type="text" 
              id="new-task-input" 
              class="task-input" 
              placeholder="Type a task and press Enter (e.g., 'Fix navbar styling')"
              autocomplete="off"
            />
            <button id="add-task-btn" class="add-task-button">➕ Add Task</button>
          </div>
        </div>

        <!-- To-Do List (Drag-Drop) -->
        <div class="tasksbot-list-section">
          <h3>📋 To-Do List (Drag to reorder by priority)</h3>
          <div id="to-do-list" class="task-list">
            ${this.tasks.length > 0 ? this.tasks.map((task, index) => `
              <div class="task-item" data-task-id="${task.id}" draggable="true">
                <div class="task-drag-handle">⋮⋮</div>
                <div class="task-content">
                  <div class="task-title">${this.escapeHtml(task.name)}</div>
                  <div class="task-meta">
                    <span class="task-date">📅 ${task.assigned}</span>
                    <span class="task-status pending">⏳ ${task.status}</span>
                  </div>
                  ${task.notes ? `<div class="task-notes">${this.escapeHtml(task.notes)}</div>` : ''}
                </div>
                <div class="task-actions">
                  <button class="task-btn complete-btn" onclick="window.tasksBotInstance.completeTask(${task.id})" title="Mark complete">
                    ✓
                  </button>
                  <button class="task-btn delete-btn" onclick="window.tasksBotInstance.deleteTask(${task.id}, false)" title="Delete">
                    ✕
                  </button>
                </div>
              </div>
            `).join('') : '<p class="empty-state">No pending tasks! 🎉</p>'}
          </div>
        </div>

        <!-- Completed Tasks -->
        <div class="tasksbot-completed-section">
          <h3>✅ Completed Tasks (${completedCount})</h3>
          <div class="completed-list">
            ${this.completedTasks.length > 0 ? this.completedTasks.map(task => `
              <div class="completed-item">
                <div class="completed-content">
                  <div class="completed-title">✓ ${this.escapeHtml(task.name)}</div>
                  <div class="completed-meta">
                    <span class="completed-date">📅 Completed: ${task.updated}</span>
                  </div>
                </div>
                <button class="task-btn delete-btn" onclick="window.tasksBotInstance.deleteTask(${task.id}, true)" title="Remove">
                  ✕
                </button>
              </div>
            `).join('') : '<p class="empty-state">No completed tasks yet. Get working! 💪</p>'}
          </div>
        </div>
      </div>
    `;

    // Store instance globally for onclick handlers
    window.tasksBotInstance = this;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.tasksBot = new TasksBot();
  });
} else {
  window.tasksBot = new TasksBot();
}
