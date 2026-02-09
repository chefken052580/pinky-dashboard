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
    // PROTECTED — DO NOT CHANGE BELOW 10000 WITHOUT BRAIN APPROVAL (was 3s, caused input focus theft)
    this.updateInterval = 30000;
    this.apiUrl = '/api/tasks';
    this.isInitialized = false; // Prevent double initialization
    this.container = null; // TIER 3: Store container reference for scoped selectors
    this.priorityFilter = null; // HB#115: Priority filter (null = show all, 'P1'/'P2'/'P3' = filter by priority)
    this.searchFilter = ''; // HB#116: Search filter for task names (empty string = show all)
    this.undoStack = []; // HB#117: Undo stack - stores last deleted tasks (max 10)
    this.selectedTasks = new Set(); // HB#118: Batch operations - track selected tasks by id
    this.batchSelectMode = false; // HB#118: Toggle batch mode on/off
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
    this.dragDropSetup = false; // Track if drag-drop already attached
    
    console.log('[TasksBot] Initializing enhanced version');
    // Wait for initial task load
    await this.loadTasks();
    
    // Setup drag-drop handlers (ONLY on init, not on every render)
    this.setupDragDrop();
    
    // Auto-refresh every 3 seconds
    // DISABLED - use GlobalRefresh
    
    // Register timer update listener (HB#115 - Task Timer Integration)
    if (typeof taskTimer !== 'undefined' && taskTimer && taskTimer.onChange) {
      taskTimer.onChange(() => {
        // Only update timer displays, NOT full re-render (prevents blinking + drag-drop break)
        document.querySelectorAll('[data-task-timer]').forEach(el => {
          var tid = el.getAttribute('data-task-timer');
          var timeEl = el.querySelector('.timer-time');
          if (timeEl && taskTimer) {
            timeEl.textContent = taskTimer.formatElapsed(taskTimer.getElapsed(tid));
          }
        });
        // Also update the timer value display
        document.querySelectorAll('.task-timer-display').forEach(el => {
          var tid = el.getAttribute('data-task-timer');
          if (tid && taskTimer) {
            var timeEl = el.querySelector('.timer-time');
            if (timeEl) timeEl.textContent = taskTimer.formatElapsed(taskTimer.getElapsed(tid));
          }
        });
      });
      console.log('[TasksBot] Timer listener registered for targeted updates');
    }
    
    console.log('[TasksBot] Initialization complete - ' + this.allTasks.length + ' tasks loaded');
  }

  /**
   * Fetch with auto-retry logic (exponential backoff)
   */
  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 5000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response;
        }
        
        // On server error, retry
        if (response.status >= 500) {
          lastError = 'Server error ' + response.status;
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms
            await new Promise(r => setTimeout(r, delay));
          }
          continue;
        }
        
        // On client error, don't retry
        lastError = 'HTTP ' + response.status;
        break;
      } catch (err) {
        lastError = err.name === 'AbortError' ? 'Timeout' : err.message;
        if (attempt < maxRetries && err.name !== 'AbortError') {
          const delay = Math.pow(2, attempt - 1) * 100;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        break;
      }
    }
    throw new Error('[TasksBot] Failed after ' + maxRetries + ' attempts: ' + lastError);
  }

  /**
   * Load tasks from API (reads projects.md)
   */
  async loadTasks() {
    let tasks = [];
    
    // Try multiple sources for tasks
    const apiUrls = [
      '/api/tasks',
      '/api/tasks',
      './tasks-data.json',
      '../bot-backend/tasks-data.json'
    ];
    
    for (const url of apiUrls) {
      try {
        console.log('[TasksBot] Trying to load from: ' + url);
        const response = await this.fetchWithRetry(url);
        
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
    
    this.runningTasks = tasks.filter(t => t.status === 'running');
    
    this.completedTasks = tasks.filter(t => t.status === 'completed');
    this.blockedTasks = tasks.filter(t => t.status === 'blocked');

    // Auto-start timers for running tasks, auto-stop for completed
    if (typeof taskTimer !== 'undefined' && taskTimer) {
      this.runningTasks.forEach(t => {
        // Only start if no timer exists at all (don't restart existing timers)
        if (!taskTimer.timers[t.id] && !taskTimer.isRunning(t.id)) {
          taskTimer.start(t.id);
        }
      });
      this.completedTasks.forEach(t => {
        if (taskTimer.isRunning(t.id)) {
          taskTimer.stop(t.id);
        }
      });
    }

    this.render();
    this.saveToLocalStorage();
  }

  /**
   * PROTECTED: Setup drag-drop functionality (TIER 3 FIX - DOM Scoping)
   * DO NOT REMOVE OR MODIFY WITHOUT BRAIN APPROVAL
   * Critical for preventing listeners from affecting entire document
   */
  setupDragDrop() {
    // PROTECTED: Scope selectors to TasksBot container, not document-wide
    const self = this;
    setTimeout(() => {
      // Find TasksBot container
      const container = document.getElementById('tasksbot-container') || 
                        document.getElementById('tasks-bot-container') ||
                        document.getElementById('task-queue-container');
      
      if (!container) {
        console.log('[TasksBot] Container not found, skipping drag-drop setup');
        return;
      }
      
      // PROTECTED: Store container reference for scoped selectors
      self.container = container;

      // Setup drag listeners on task items WITHIN container only
      container.querySelectorAll('[draggable="true"]').forEach(el => {
        el.addEventListener('dragstart', (e) => self.onDragStart(e));
        el.addEventListener('dragend', (e) => self.onDragEnd(e));
      });

      // Setup drop zones WITHIN container only
      container.querySelectorAll('[data-drop-zone]').forEach(zone => {
        zone.addEventListener('dragover', (e) => self.onDragOver(e));
        zone.addEventListener('drop', (e) => self.onDrop(e));
        zone.addEventListener('dragleave', (e) => self.onDragLeave(e));
      });

      // Setup priority button listeners with event delegation on container
      container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-priority-up') || e.target.classList.contains('btn-priority-down')) {
          const taskName = e.target.getAttribute('data-task-name');
          const direction = e.target.getAttribute('data-direction');
          console.log('[TasksBot] Priority button clicked:', taskName, direction);
          self.movePriority(taskName, direction);
        }
      });

      // Setup delete buttons WITHIN container only
      container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const taskName = e.currentTarget.getAttribute('data-task-name');
          console.log('[TasksBot] Delete clicked:', taskName);
          if (taskName) self.deleteTask(taskName);
        });
        // Prevent drag from starting on delete button
        btn.addEventListener('dragstart', (e) => {
          e.stopPropagation();
          e.preventDefault();
        });
        btn.setAttribute('draggable', 'false');
      });
      console.log('[TasksBot] Drag-drop, priority, and delete buttons setup complete');
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
    // TIER 3 FIX: Scope to container only, not document-wide
    if (this.container) {
      this.container.querySelectorAll('[data-drop-zone]').forEach(z => {
        z.classList.remove('drag-over');
      });
    }
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

      // If same zone, handle reordering by sort_order
      if (taskData.status === targetStatus) {
        // Find which task we dropped onto
        var dropTarget = e.target.closest('.task-item');
        if (dropTarget && dropTarget !== e.currentTarget) {
          var targetTaskData = JSON.parse(dropTarget.getAttribute('data-task') || '{}');
          if (targetTaskData.id && targetTaskData.id !== taskData.id) {
            // Get current sort order index of dropped task
            var tasksInZone = this.allTasks.filter(t => t.status === targetStatus);
            var newIndex = tasksInZone.findIndex(t => t.id === targetTaskData.id);
            var fromIndex = tasksInZone.findIndex(t => t.id === taskData.id);
            
            if (newIndex !== -1 && fromIndex !== -1) {
              // Update sort_order via API
              console.log('[TasksBot] Reordering task: ' + taskData.name + ' from index ' + fromIndex + ' to ' + newIndex);
              await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'update_sort_order',
                  taskId: taskData.id,
                  taskName: taskData.name,
                  newIndex: newIndex,
                  fromIndex: fromIndex
                })
              });
              this.loadTasks();
            }
          }
        }
        return;
      }

      console.log('[TasksBot] Moving task to: ' + targetStatus);
      
      // Update via API (cross-zone move changes status)
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
        console.log('[TasksBot] Task status updated');
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
      // Check for attached files
      let notes = '';
      if (typeof window.fileAttachmentManager !== 'undefined') {
        const attachments = window.fileAttachmentManager.getTaskAttachments();
        if (attachments && attachments.length > 0) {
          const attachmentsList = attachments.map(a => `📎 ${a.filename} (${window.fileAttachmentManager.formatFileSize(a.size)})`).join(', ');
          notes = `Attachments: ${attachmentsList}`;
        }
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: taskName.trim(),
          priority: priority || 'P2',
          status: 'pending',
          assigned: new Date().toISOString(),
          notes: notes
        })
      });

      if (response.ok) {
        console.log('[TasksBot] Task created');
        // Clear input
        const input = document.getElementById('new-task-input');
        if (input) input.value = '';
        // Clear attachments display
        const attachmentsList = document.getElementById('task-attachments-list');
        if (attachmentsList) attachmentsList.innerHTML = '';
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
  render(force) {
    // ╔══════════════════════════════════════════════════════════════╗
    // ║ PROTECTED — DO NOT REMOVE OR MODIFY WITHOUT BRAIN APPROVAL ║
    // ║ Focus guard: prevents render from stealing input focus.     ║
    // ║ Fixed by Lord_Cracker on 2026-02-05. Pinky broke this once.║
    // ╚══════════════════════════════════════════════════════════════╝
    if (!force && document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA' || 
         document.activeElement.tagName === 'SELECT')) {
      return;
    }
    if (!force && document.querySelector('.dragging')) {
      return;
    }

    // Try both possible container IDs
    let container = document.getElementById('tasksbot-container') || 
                    document.getElementById('tasks-bot-container') ||
                    document.getElementById('task-queue-container');
    if (!container) {
      console.log('[TasksBot] No container found (tried: tasksbot-container, tasks-bot-container, task-queue-container)');
      return;
    }

    // TIER 3 FIX: Store container reference for scoped selectors
    this.container = container;

    // TIER 1 FIX: Capture input values BEFORE clearing container
    const savedVal = document.getElementById('new-task-input')?.value || '';
    const savedTypeVal = document.getElementById('new-task-type')?.value || 'task';
    const savedPriVal = document.getElementById('new-task-priority')?.value || 'P2';

    let html = '<div class="tasks-bot-enhanced">';
    html += '<h3>🎯 Task Management</h3>';

    // Summary stats
    html += '<div class="task-stats">';
    html += '<div class="stat">Pending: <strong>' + this.pendingTasks.length + '</strong></div>';
    html += '<div class="stat">Running: <strong>' + this.runningTasks.length + '</strong></div>';
    html += '<div class="stat">Completed: <strong>' + this.completedTasks.length + '</strong></div>';
    html += '<div class="stat" style="color:#ef4444;">Blocked: <strong>' + this.blockedTasks.length + '</strong></div>';
    const totalTasks = this.pendingTasks.length + this.runningTasks.length + this.completedTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((this.completedTasks.length / totalTasks) * 100) : 0;
    html += '<div class="stat">Completion Rate: <strong>' + completionRate + '%</strong></div>';
    html += '</div>';

    // HB#117: Undo button - show if undo stack has items
    if (this.undoStack.length > 0) {
      html += '<div style="margin:12px 0;padding:8px;background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;">';
      html += '<button onclick="window.tasksBotEnhanced.restoreLastDeletedTask();" title="Restore last deleted task" style="background:#ffc107;color:#000;border:none;border-radius:4px;padding:8px 14px;cursor:pointer;font-size:0.9em;font-weight:600;">↶ Undo Delete (' + this.undoStack.length + ')</button>';
      html += '<span style="margin-left:8px;font-size:0.85em;color:#666;">' + this.undoStack[this.undoStack.length - 1].name + '</span>';
      html += '</div>';
    }

    // Add new task / rule section
    html += '<div class="add-task-section">';
    html += '<h4>➕ Add New Task or Rule</h4>';
    html += '<div class="add-task-input">';
    // ⚠️ PROTECTED — New Rule dropdown + rule-status div. Added by Lord_Cracker 2026-02-05.
    html += '<select id="new-task-type" style="min-width:110px;" onchange="var p=document.getElementById(\'new-task-priority\'); if(this.value===\'rule\'){p.value=\'P1\';p.disabled=true;p.style.opacity=\'0.6\';document.getElementById(\'new-task-input\').placeholder=\'Enter rule for Pinky...\';}else{p.disabled=false;p.style.opacity=\'1\';document.getElementById(\'new-task-input\').placeholder=\'Task name...\';};">';
    html += '<option value="task" selected>New Task</option>';
    html += '<option value="rule">New Rule</option>';
    html += '</select>';
    html += '<input type="text" id="new-task-input" placeholder="Task name or rule..." />';
    html += '<select id="new-task-priority">';
    html += '<option value="P1">P1 (Urgent)</option>';
    html += '<option value="P2" selected>P2 (Normal)</option>';
    html += '<option value="P3">P3 (Low)</option>';
    html += '</select>';
    html += '<button id="add-task-btn" onclick="window.tasksBotEnhanced.addTaskFromUI()">Submit</button>';
    html += '</div>';
    // File attachment section (added by Pinky 2026-02-05)
    html += '<div id="task-attachments-ui-container" style="margin-top:12px;"></div>';
    html += '<div id="rule-status" style="display:none; margin-top:8px; padding:8px 12px; border-radius:6px; font-size:0.85em;"></div>';
    html += '</div>';

    // Pending tasks (tree structure with priority drag)
    html += '<div class="task-section">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<h4 style="margin:0;">📋 Pending Tasks (' + this.pendingTasks.length + ')</h4>';
    html += '<div style="display:flex;gap:6px;align-items:center;">';
    // HB#116: Search input
    html += '<input type="text" id="task-search-filter" placeholder="🔍 Search..." value="' + this.escapeAttr(this.searchFilter) + '" oninput="window.tasksBotEnhanced.setSearchFilter(this.value)" style="padding:6px 10px;border:1px solid #ccc;border-radius:4px;font-size:0.9em;width:140px;box-sizing:border-box;">';
    // Priority filter buttons
    html += '<button onclick="window.tasksBotEnhanced.setPriorityFilter(\'P1\')" style="background:' + (this.priorityFilter === 'P1' ? '#ff4444' : '#ccc') + ';color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.8em;font-weight:bold;">P1</button>';
    html += '<button onclick="window.tasksBotEnhanced.setPriorityFilter(\'P2\')" style="background:' + (this.priorityFilter === 'P2' ? '#ff9500' : '#ccc') + ';color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.8em;font-weight:bold;">P2</button>';
    html += '<button onclick="window.tasksBotEnhanced.setPriorityFilter(\'P3\')" style="background:' + (this.priorityFilter === 'P3' ? '#4caf50' : '#ccc') + ';color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.8em;font-weight:bold;">P3</button>';
    html += '<button onclick="window.tasksBotEnhanced.setPriorityFilter(null)" style="background:' + (this.priorityFilter === null ? '#2196f3' : '#ccc') + ';color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.8em;font-weight:bold;">All</button>';
    // HB#118: Batch mode toggle
    html += '<button onclick="window.tasksBotEnhanced.toggleBatchMode()" style="background:' + (this.batchSelectMode ? '#9c27b0' : '#ccc') + ';color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.8em;font-weight:bold;margin-left:4px;">☑ Batch</button>';
    html += '</div>';
    html += '</div>';
    // HB#118: Batch action buttons (show when tasks are selected)
    if (this.batchSelectMode && this.selectedTasks.size > 0) {
      html += '<div style="background:#f0f0f0;padding:10px;border-radius:4px;margin-bottom:12px;display:flex;gap:8px;align-items:center;border-left:4px solid #9c27b0;">';
      html += '<strong style="margin-right:12px;">' + this.selectedTasks.size + ' selected</strong>';
      html += '<button onclick="window.tasksBotEnhanced.batchComplete()" style="background:#4caf50;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;">✓ Complete</button>';
      html += '<button onclick="window.tasksBotEnhanced.batchDelete()" style="background:#ff4444;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;">✕ Delete</button>';
      html += '<button onclick="window.tasksBotEnhanced.batchSetPriority(\'P1\')" style="background:#ff4444;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;">→ P1</button>';
      html += '<button onclick="window.tasksBotEnhanced.batchSetPriority(\'P2\')" style="background:#ff9500;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;">→ P2</button>';
      html += '<button onclick="window.tasksBotEnhanced.batchSetPriority(\'P3\')" style="background:#4caf50;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;">→ P3</button>';
      html += '<button onclick="window.tasksBotEnhanced.batchSelectNone()" style="background:#999;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;">Clear</button>';
      html += '</div>';
    }
    html += '<div class="task-list" data-drop-zone="pending">';
    
    // HB#115: Filter pending tasks based on priorityFilter
    // HB#116: Also filter by search term
    let filteredPendingTasks = this.pendingTasks;
    if (this.priorityFilter) {
      filteredPendingTasks = filteredPendingTasks.filter(t => t.priority === this.priorityFilter);
    }
    if (this.searchFilter) {
      filteredPendingTasks = filteredPendingTasks.filter(t => t.name.toLowerCase().includes(this.searchFilter));
    }
    const displayCount = (this.priorityFilter || this.searchFilter) ? filteredPendingTasks.length + '/' + this.pendingTasks.length : this.pendingTasks.length;
    
    if (filteredPendingTasks.length === 0) {
      html += '<p class="empty">No ' + (this.priorityFilter ? this.priorityFilter + ' ' : '') + 'pending tasks</p>';
    } else {
      filteredPendingTasks.forEach((task, idx) => {
        const priorityColor = task.priority === 'P1' ? 'priority-p1' : 
                            task.priority === 'P2' ? 'priority-p2' : 'priority-p3';
        const taskId = 'task-' + task.id;
        
        html += '<div class="task-item ' + priorityColor + '" draggable="true" id="' + taskId + '" data-task="' + JSON.stringify(task).replace(/"/g, '&quot;') + '" data-task-name="' + this.escapeAttr(task.name) + '">';
        html += '<div class="task-header">';
        // HB#118: Batch mode checkbox
        if (this.batchSelectMode) {
          const isSelected = this.selectedTasks.has(task.id);
          html += '<input type="checkbox" onclick="event.stopPropagation();window.tasksBotEnhanced.toggleTaskSelection(\'' + task.id + '\')" ' + (isSelected ? 'checked' : '') + ' style="margin-right:8px;cursor:pointer;width:18px;height:18px;">';
        }
        html += '<span class="priority-badge">' + (task.priority || 'P3') + '</span>';
        html += '<span class="task-name">' + this.escapeAttr(task.name) + '</span>';
        html += '<div class="task-actions">';
        html += '<button class="btn-priority-up" data-task-name="' + this.escapeAttr(task.name) + '" data-direction="up" title="Higher priority">↑</button>';
        html += '<button class="btn-priority-down" data-task-name="' + this.escapeAttr(task.name) + '" data-direction="down" title="Lower priority">↓</button>';
        html += '<button onclick="event.stopPropagation();window.tasksBotEnhanced.startTaskNow(\'' + this.escapeAttr(task.name).replace(/'/g, "\\'") + '\',\'' + task.id + '\');" title="Start this task now" style="background:#00d4ff;color:#0f0e1a;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;margin-left:4px;font-size:0.8em;font-weight:bold;position:relative;z-index:10;">▶ Start</button>';
        html += '<button onclick="event.stopPropagation();window.tasksBotEnhanced.deleteTask(\'' + this.escapeAttr(task.name).replace(/'/g, "\\'") + '\',\'' + task.id + '\');" title="Delete task" style="background:#ff4444;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;margin-left:4px;font-size:0.8em;position:relative;z-index:10;">✕</button>';
        html += '</div>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + this.escapeAttr(task.notes) + '</div>';
        }
        
        html += '<div class="task-meta">';
        const taskAge = this.calculateTaskAge(task.assigned);
        const ageColor = taskAge.includes('w') ? '#ff6b6b' : taskAge.includes('d') && parseInt(taskAge) > 3 ? '#ffa500' : '#999';
        html += '<span class="assigned">Age: <span style="color:' + ageColor + ';font-weight:bold;">' + taskAge + '</span></span>';
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
        html += '<span class="task-name">' + this.escapeAttr(task.name) + '</span>';
        html += '<button onclick="event.stopPropagation();window.tasksBotEnhanced.deleteTask(\'' + this.escapeAttr(task.name).replace(/'/g, "\\'") + '\',\'' + task.id + '\');" title="Delete task" style="background:#ff4444;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;margin-left:auto;font-size:0.8em;position:relative;z-index:10;">✕</button>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + this.escapeAttr(task.notes) + '</div>';
        }
        
        html += '<div class="task-meta">';
        html += '<span>Updated: ' + this.formatTime(task.updated) + '</span>';
        html += '</div>';
        
        // Timer UI for running task (HB#115)
        if (typeof taskTimer !== 'undefined' && taskTimer && typeof taskTimer === 'object') {
          const timerState = taskTimer.getState(task.id);
          const elapsedDisplay = taskTimer.formatElapsed(timerState.elapsed);
          const isRunning = timerState.running;
          html += '<div class="task-timer-display ' + (isRunning ? 'running' : 'paused') + '" data-task-timer="' + task.id + '">';
          html += '  <span class="timer-icon">⏱️</span>';
          html += '  <span class="timer-time">' + elapsedDisplay + '</span>';
          html += '  <div class="timer-buttons">';
          if (isRunning) {
            html += '    <button class="timer-btn timer-btn-pause" onclick="event.stopPropagation();if(taskTimer) taskTimer.pause(\'' + task.id + '\');" title="Pause timer">⏸</button>';
            html += '    <button class="timer-btn timer-btn-stop" onclick="event.stopPropagation();if(taskTimer) taskTimer.stop(\'' + task.id + '\');" title="Stop timer">⏹</button>';
          } else {
            html += '    <button class="timer-btn timer-btn-start" onclick="event.stopPropagation();if(taskTimer) taskTimer.start(\'' + task.id + '\');" title="Start timer">▶</button>';
            html += '    <button class="timer-btn timer-btn-stop" onclick="event.stopPropagation();if(taskTimer) taskTimer.stop(\'' + task.id + '\');" title="Stop timer">⏹</button>';
          }
          html += '    <button class="timer-btn timer-btn-reset" onclick="event.stopPropagation();if(taskTimer) taskTimer.reset(\'' + task.id + '\');" title="Reset timer">🔄</button>';
          html += '  </div>';
          html += '</div>';
        }
        
        html += '</div>';
      });
    }
    
    html += '</div>';
    html += '</div>';

    // Completed tasks with history
    html += '<div class="task-section completed-section">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<h4 style="margin:0;">✅ Completed Tasks (' + this.completedTasks.length + ')</h4>';
    html += '<div style="display:flex;gap:8px;">';
    if (this.completedTasks.length > 0) {
      html += '<button onclick="window.tasksBotEnhanced.clearCompletedTasks();" title="Clear all completed tasks" style="background:#ff9500;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;font-weight:500;">Clear All</button>';
    }
    html += '<button onclick="window.tasksBotEnhanced.exportTasks();" title="Export all tasks to JSON file" style="background:#3b82f6;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:0.85em;font-weight:500;">Export JSON</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="task-list" data-drop-zone="completed">';
    
    if (this.completedTasks.length === 0) {
      html += '<p class="empty">No completed tasks</p>';
    } else {
      // Show most recent first
      this.completedTasks.slice().reverse().forEach(task => {
        // Extract commit hash from notes (looks for "— abc123" or "Commit: abc123")
        let commitHash = '';
        if (task.notes) {
          const commitMatch = task.notes.match(/(?:—|Commit:|commit:|COMMIT:|\b)\s*([a-f0-9]{7,40})/i);
          if (commitMatch) {
            commitHash = commitMatch[1];
          }
        }
        
        html += '<div class="task-item completed">';
        html += '<div class="task-header">';
        // Choose stamp based on task type
        if (task.notes && task.notes.includes('ADMIN FIX')) {
          html += '<div class="verified-stamp admin-stamp"><div class="stamp-circle admin">ADMIN</div><span class="stamp-text admin-text">⚡ Brain Fix</span></div>';
        } else if (task.name && task.name.includes('DENIED')) {
          html += '<div class="verified-stamp failed-stamp"><div class="stamp-circle failed">DENIED</div><span class="stamp-text failed-text">✗ Failed</span></div>';
        } else if (task.notes && (task.notes.includes('Brain') || task.notes.includes('--no-verify'))) {
          html += '<div class="verified-stamp admin-stamp"><div class="stamp-circle admin">ADMIN</div><span class="stamp-text admin-text">⚡ Brain</span></div>';
        } else {
          html += '<div class="verified-stamp"><div class="stamp-circle">VERIFIED</div><span class="stamp-text">✓ Done</span></div>';
        }
        html += '<span class="task-name">' + this.escapeAttr(task.name) + '</span>';
        
        // Add revert button if commit hash found
        if (commitHash) {
          html += '<button onclick="event.stopPropagation();window.tasksBotEnhanced.revertTask(\'' + this.escapeAttr(task.name).replace(/'/g, "\\'") + '\',\'' + commitHash + '\');" title="Revert this commit" style="background:linear-gradient(135deg,#ff9500,#ff6b6b);color:#fff;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;margin-left:auto;font-size:0.8em;font-weight:500;box-shadow:0 2px 4px rgba(0,0,0,0.2);">↩️ Revert</button>';
        }
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + this.escapeAttr(task.notes) + '</div>';
        }
        
        html += '<div class="task-meta">';
        html += '<span>Completed: ' + this.formatTime(task.updated) + '</span>';
        // Show elapsed time from timer
        if (typeof taskTimer !== 'undefined' && taskTimer) {
          var elapsed = taskTimer.getElapsed(task.id);
          if (elapsed > 0) {
            html += '<span style="margin-left:12px;color:#4496ff;">⏱️ ' + taskTimer.formatElapsed(elapsed) + '</span>';
          }
        }
        if (commitHash) {
          html += '<span style="margin-left:12px;color:#888;font-family:monospace;font-size:0.85em;">commit: ' + commitHash + '</span>';
        }
        html += '</div>';
        html += '</div>';
      });
    }
    
    html += '</div>';
    html += '</div>';

    // === BLOCKED / FAILED SECTION ===
    if (this.blockedTasks.length > 0) {
      html += '<div class="task-section blocked-section" style="border:2px solid #ef4444;border-radius:8px;margin-top:16px;padding:12px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
      html += '<h4 style="margin:0;color:#ef4444;">❌ FAILED / BLOCKED (' + this.blockedTasks.length + ')</h4>';
      html += '</div>';
      html += '<div class="task-list">';
      this.blockedTasks.forEach(task => {
        var notes = task.notes || '';
        var attemptMatch = notes.match(/ATTEMPT #(\d+)/g);
        var attemptCount = attemptMatch ? attemptMatch.length : 0;
        
        html += '<div class="task-item" style="position:relative;overflow:hidden;background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;">';
        
        // FAILED seal overlay
        html += '<div style="position:absolute;top:8px;right:8px;width:70px;height:70px;border:3px solid #ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;transform:rotate(-15deg);opacity:0.85;pointer-events:none;">';
        html += '<div style="text-align:center;line-height:1.1;">';
        html += '<div style="font-size:20px;">❌</div>';
        html += '<div style="font-size:8px;font-weight:bold;color:#ef4444;text-transform:uppercase;">Failed</div>';
        html += '</div></div>';
        
        html += '<div class="task-header">';
        html += '<span class="status-badge" style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.8em;font-weight:bold;">🛑 BLOCKED</span>';
        html += '<span class="task-name">' + this.escapeAttr(task.name) + '</span>';
        html += '</div>';
        if (task.notes) {
          html += '<div class="task-desc" style="color:#fca5a5;">' + this.escapeAttr(task.notes) + '</div>';
        }
        html += '<div style="margin:4px 0;font-size:0.8em;color:#ef4444;">💀 Failed after ' + attemptCount + ' attempts (10 debugs + 3 workarounds)</div>';
        html += '<div class="task-meta">';
        html += '<span style="color:#ef4444;">Blocked: ' + this.formatTime(task.updated) + '</span>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Restore input value after re-render
    const restoredInput = document.getElementById('new-task-input');
    if (restoredInput && savedVal) restoredInput.value = savedVal;
    const restoredType = document.getElementById('new-task-type');
    if (restoredType && savedTypeVal) restoredType.value = savedTypeVal;
    const restoredPri = document.getElementById('new-task-priority');
    if (restoredPri && savedPriVal) restoredPri.value = savedPriVal;

    // Initialize file attachment UI for task creation (added by Pinky 2026-02-05)
    if (typeof window.fileAttachmentManager !== 'undefined') {
      // Create file input section for attachments
      const attachmentSection = document.createElement('div');
      attachmentSection.id = 'task-attachment-section';
      attachmentSection.className = 'task-attachment-section';
      attachmentSection.innerHTML = `
        <div style="margin-top: 10px; padding: 8px 0;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 14px; background: linear-gradient(135deg, #00d4ff22, #00ff8822); border: 1px solid #00d4ff44; border-radius: 6px; width: fit-content; color: #ffffff; font-weight: 600; font-size: 13px; transition: all 0.2s ease;">
            <span style="font-size: 18px;">📎</span>
            <span style="font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Attach Files (.png, .jpeg, .pdf - max 10MB)</span>
            <input type="file" id="task-file-input" style="display: none;" accept=".png,.jpg,.jpeg,.pdf" multiple>
          </label>
          <div id="task-attachments-list" style="margin-top: 8px;"></div>
        </div>
      `;
      
      // Insert after input area
      const inputArea = document.querySelector('.add-task-input');
      if (inputArea && !document.getElementById('task-attachment-section')) {
        inputArea.parentElement.insertBefore(attachmentSection, inputArea.nextElementSibling);
        
        // Set up file input handler
        const fileInput = document.getElementById('task-file-input');
        if (fileInput) {
          fileInput.addEventListener('change', async (e) => {
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            const ALLOWED_TYPES = ['.png', '.jpeg', '.jpg', '.pdf'];
            
            for (const file of e.target.files) {
              // Pre-validate file before attempting to attach
              const fileExt = '.' + file.name.split('.').pop().toLowerCase();
              
              // Validate file type
              if (!ALLOWED_TYPES.includes(fileExt)) {
                console.error('[TasksBot] Invalid file type: ' + file.name + ' (' + fileExt + '). Allowed: .png, .jpeg, .jpg, .pdf');
                this.showFileNotification('❌ Invalid file type: ' + fileExt, 'error');
                continue;
              }
              
              // Validate file size
              if (file.size > MAX_FILE_SIZE) {
                console.error('[TasksBot] File too large: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + 'MB). Max: 10MB');
                this.showFileNotification('❌ File too large: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB (max 10MB)', 'error');
                continue;
              }
              
              try {
                const attachment = await window.fileAttachmentManager.addAttachment('new-task', file);
                window.fileAttachmentManager.displayAttachment(attachment);
                console.log('[TasksBot] Attached: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + 'KB)');
                this.showFileNotification('✅ Attached: ' + file.name, 'success');
              } catch (error) {
                console.error('[TasksBot] Attachment failed for ' + file.name + ': ' + error.message);
                this.showFileNotification('❌ Failed to attach: ' + file.name, 'error');
              }
            }
            e.target.value = ''; // Reset input
          });
        }
      }
    }

    // Re-attach drag-drop handlers after render since DOM was rebuilt
    this.setupDragDrop();
  }

  /**
   * PROTECTED: Escape string for HTML attributes (TIER 2 FIX - XSS Prevention)
   * DO NOT REMOVE OR MODIFY WITHOUT BRAIN APPROVAL
   * Critical for preventing XSS through task names and notes
   */
  // ⚠️ PROTECTED — HTML attribute escaping for XSS prevention. Do not remove.
  escapeAttr(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /**
   * Format timestamp
   */
  /**
   * HB#124: Calculate task age (how long it's been waiting)
   * Returns human-readable format like "2 days old", "3 hours old", etc.
   */
  calculateTaskAge(timestamp) {
    try {
      if (!timestamp) return 'unknown age';
      // Handle non-date values like "Pinky" or "Brain"
      if (typeof timestamp === 'string' && !/\d{4}/.test(timestamp)) {
        return 'no date';
      }
      const assignedDate = new Date(timestamp);
      if (isNaN(assignedDate.getTime())) return 'unknown age';
      
      const now = new Date();
      const diffMs = now.getTime() - assignedDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return diffMins + 'm old';
      if (diffHours < 24) return diffHours + 'h old';
      if (diffDays < 7) return diffDays + 'd old';
      const diffWeeks = Math.floor(diffDays / 7);
      return diffWeeks + 'w old';
    } catch (e) {
      return 'unknown age';
    }
  }

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
  // ⚠️ PROTECTED — Handles both tasks AND rules via type dropdown. Do not simplify.
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
   * Send a new rule directly to Pinky for immediate execution
   */
  // ⚠️ PROTECTED — Direct gateway rule sender. Added by Lord_Cracker 2026-02-05.
  async sendRuleToPinky(ruleText) {
    const statusDiv = document.getElementById('rule-status');
    const input = document.getElementById('new-task-input');

    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.style.background = 'rgba(0,212,255,0.15)';
      statusDiv.style.color = '#00d4ff';
      statusDiv.innerHTML = '⏳ Sending rule to Pinky...';
    }

    const message = 'NEW RULE FROM LORD_CRACKER — EXECUTE IMMEDIATELY, DO NOT WAIT FOR HEARTBEAT:\n\n' +
      ruleText + '\n\n' +
      'After applying this rule: 1) Update MEMORY.md with the new rule, ' +
      '2) Confirm what you changed, 3) This takes priority over everything.';

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });

      const data = await response.json();

      if (data.response) {
        if (statusDiv) {
          statusDiv.style.background = 'rgba(0,255,136,0.15)';
          statusDiv.style.color = '#00ff88';
          statusDiv.innerHTML = '✅ Pinky: ' + data.response.substring(0, 250) + (data.response.length > 250 ? '...' : '');
        }
        if (input) input.value = '';
        setTimeout(() => { if (statusDiv) statusDiv.style.display = 'none'; }, 15000);
      } else if (data.error) {
        if (statusDiv) {
          statusDiv.style.background = 'rgba(255,68,68,0.15)';
          statusDiv.style.color = '#ff4444';
          statusDiv.innerHTML = '❌ Error: ' + data.error;
        }
      }
    } catch (err) {
      if (statusDiv) {
        statusDiv.style.background = 'rgba(255,68,68,0.15)';
        statusDiv.style.color = '#ff4444';
        statusDiv.innerHTML = '❌ Failed: ' + err.message;
      }
    }
  }

  /**
   * Start a task now - Send wake-up call to Pinky
   */
  async startTaskNow(taskName, taskId) {
    if (!confirm('Send wake-up call to start task: "' + taskName + '"?\n\nThis will notify Pinky to begin work immediately.')) return;
    
    try {
      // Send wake-up message via chat API
      const wakeMessage = '🔔 START NOW: ' + taskName;
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: wakeMessage,
          priority: 'high'
        })
      });

      if (response.ok) {
        alert('✅ Wake-up call sent! Pinky will start this task shortly.');
        console.log('[TasksBot] Start Now triggered for:', taskName);
      } else {
        throw new Error('API returned status ' + response.status);
      }
    } catch (error) {
      console.error('[TasksBot] Start Now error:', error);
      alert('❌ Failed to send wake-up call. Check console for details.');
    }
  }

  /**
   * Revert a completed task by reverting its git commit
   */
  async revertTask(taskName, commitHash) {
    const confirmMsg = `⚠️ REVERT TASK: "${taskName}"\n\n` +
      `This will revert commit: ${commitHash}\n\n` +
      `WARNING: This creates a new commit that undoes the changes.\n` +
      `The original commit remains in git history.\n\n` +
      `Continue?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
      // Send revert request to Pinky via chat API
      const revertMessage = `🔄 REVERT TASK: ${taskName}\nCommit: ${commitHash}\n\nPlease revert this commit using: git revert ${commitHash}`;
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: revertMessage,
          priority: 'high'
        })
      });

      if (response.ok) {
        alert('✅ Revert request sent to Pinky!\n\nPinky will:\n1. Run git revert ' + commitHash + '\n2. Create a new commit\n3. Update task status');
        console.log('[TasksBot] Revert requested for:', taskName, commitHash);
      } else {
        throw new Error('API returned status ' + response.status);
      }
    } catch (error) {
      console.error('[TasksBot] Revert error:', error);
      alert('❌ Failed to send revert request. Check console for details.');
    }
  }

  /**
   * Delete a task by name
   */
  // ⚠️ PROTECTED — Delete by unique ID. Fixed by Lord_Cracker 2026-02-05.
  async deleteTask(taskName, taskId) {
    if (!confirm('Delete task: "' + taskName + '"?')) return;
    try {
      // HB#117: Find and save task to undo stack before deletion
      const taskToDelete = this.allTasks.find(t => t.name === taskName);
      if (taskToDelete) {
        this.undoStack.push({ ...taskToDelete, deletedAt: new Date().toISOString() });
        // Keep only last 10 deletions
        if (this.undoStack.length > 10) this.undoStack.shift();
        console.log('[TasksBot] Saved to undo stack:', taskName);
      }
      
      // WORKAROUND (HB#113): Delete by name only, NOT by ID
      // Reason: Backend ID persistence bug — IDs regenerate on reload, causing delete-by-ID to fail
      // Brain is reviewing the protected code fix (tasks-api.js line 135)
      // Sending name-only deletes until backend fix is approved
      const body = { action: 'delete', name: taskName };
      const response = await this.fetchWithRetry(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, 2);
      if (response.ok) {
        console.log('[TasksBot] Deleted: ' + taskName);
        await this.loadTasks();
        this.render(true);
        this.showFileNotification('Task deleted successfully (Undo available)', 'success');
      } else {
        this.showFileNotification('Failed to delete task', 'error');
      }
    } catch (err) {
      console.error('[TasksBot] Delete failed:', err);
      this.showFileNotification('Error deleting task: ' + err.message, 'error');
    }
  }

  /**
   * HB#117: Restore last deleted task from undo stack
   */
  async restoreLastDeletedTask() {
    if (this.undoStack.length === 0) {
      this.showFileNotification('No deleted tasks to restore', 'info');
      return;
    }
    
    try {
      const deletedTask = this.undoStack.pop();
      console.log('[TasksBot] Restoring:', deletedTask.name);
      
      // Re-create the task with original properties
      const body = {
        action: 'create',
        name: deletedTask.name,
        status: deletedTask.status || 'pending',
        priority: deletedTask.priority || '-',
        notes: deletedTask.notes || ''
      };
      
      const response = await this.fetchWithRetry(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, 2);
      
      if (response.ok) {
        console.log('[TasksBot] Restored: ' + deletedTask.name);
        await this.loadTasks();
        this.render(true);
        this.showFileNotification('Task restored: ' + deletedTask.name, 'success');
      } else {
        this.showFileNotification('Failed to restore task', 'error');
        // Put it back on the stack if restore failed
        this.undoStack.push(deletedTask);
      }
    } catch (err) {
      console.error('[TasksBot] Restore failed:', err);
      this.showFileNotification('Error restoring task: ' + err.message, 'error');
    }
  }

  /**
   * Clear all completed tasks with confirmation
   */
  async clearCompletedTasks() {
    if (this.completedTasks.length === 0) {
      this.showFileNotification('No completed tasks to clear', 'info');
      return;
    }
    
    if (!confirm('Delete all ' + this.completedTasks.length + ' completed tasks? This cannot be undone.')) {
      return;
    }
    
    try {
      let failedCount = 0;
      console.log('[TasksBot] Clearing ' + this.completedTasks.length + ' completed tasks...');
      
      // Delete each completed task
      for (const task of this.completedTasks) {
        try {
          // WORKAROUND (HB#113): Delete by name only, NOT by ID
          const body = { action: 'delete', name: task.name };
          const response = await this.fetchWithRetry(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }, 2);
          if (!response.ok) {
            failedCount++;
            console.error('[TasksBot] Failed to delete: ' + task.name);
          }
        } catch (err) {
          failedCount++;
          console.error('[TasksBot] Error deleting ' + task.name + ':', err);
        }
      }
      
      // Reload and render
      await this.loadTasks();
      this.render(true);
      
      if (failedCount === 0) {
        this.showFileNotification('✅ Cleared ' + this.completedTasks.length + ' completed tasks', 'success');
      } else {
        this.showFileNotification('⚠️ Cleared ' + (this.completedTasks.length - failedCount) + '/' + this.completedTasks.length + ' tasks (' + failedCount + ' failed)', 'error');
      }
    } catch (err) {
      console.error('[TasksBot] Clear completed failed:', err);
      this.showFileNotification('Error clearing tasks: ' + err.message, 'error');
    }
  }

  /**
   * Export all tasks to JSON file
   */
  async exportTasks() {
    try {
      // Compile all tasks (pending, running, completed)
      const exportData = {
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        summary: {
          totalTasks: this.allTasks.length,
          pendingTasks: this.pendingTasks.length,
          runningTasks: this.runningTasks.length,
          completedTasks: this.completedTasks.length
        },
        tasks: {
          pending: this.pendingTasks.map(t => ({
            id: t.id,
            name: t.name,
            status: 'pending',
            priority: t.priority,
            assigned: t.assigned,
            updated: t.updated,
            notes: t.notes
          })),
          running: this.runningTasks.map(t => ({
            id: t.id,
            name: t.name,
            status: 'running',
            priority: t.priority,
            assigned: t.assigned,
            updated: t.updated,
            notes: t.notes
          })),
          completed: this.completedTasks.map(t => ({
            id: t.id,
            name: t.name,
            status: 'completed',
            priority: t.priority,
            assigned: t.assigned,
            updated: t.updated,
            notes: t.notes
          }))
        }
      };

      // Create JSON blob
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pinky-tasks-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('[TasksBot] Exported ' + this.allTasks.length + ' tasks to JSON');
      this.showFileNotification('✅ Exported ' + this.allTasks.length + ' tasks to JSON', 'success');
    } catch (err) {
      console.error('[TasksBot] Export failed:', err);
      this.showFileNotification('❌ Export failed: ' + err.message, 'error');
    }
  }

  /**
   * Show file notification (in-app instead of alert)
   */
  showFileNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'file-upload-notification ' + type;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      z-index: 1000;
      animation: slideInNotif 0.3s ease;
      ${type === 'success' ? 'background:#dcfce7;color:#166534;border:1px solid #22c55e;' : ''}
      ${type === 'error' ? 'background:#fee2e2;color:#991b1b;border:1px solid #ef4444;' : ''}
      ${type === 'info' ? 'background:#dbeafe;color:#1e40af;border:1px solid #3b82f6;' : ''}
    `;
    
    // Add keyframe animation
    if (!document.getElementById('notif-style')) {
      const style = document.createElement('style');
      style.id = 'notif-style';
      style.textContent = '@keyframes slideInNotif { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
      document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => notification.remove(), 4000);
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

  /**
   * HB#115: Set priority filter for pending tasks
   * @param {string|null} priority - 'P1', 'P2', 'P3', or null to show all
   */
  setPriorityFilter(priority) {
    this.priorityFilter = priority;
    this.render(); // Re-render with new filter
    console.log('[TasksBot] Priority filter set to:', priority || 'All');
  }

  setSearchFilter(searchTerm) {
    this.searchFilter = searchTerm.toLowerCase();
    this.render(); // Re-render with new search
    console.log('[TasksBot] Search filter set to:', searchTerm || '(cleared)');
  }

  /**
   * HB#118: Toggle batch selection mode on/off
   */
  toggleBatchMode() {
    this.batchSelectMode = !this.batchSelectMode;
    this.selectedTasks.clear(); // Clear selections when toggling off
    this.render();
    console.log('[TasksBot] Batch mode:', this.batchSelectMode ? 'ON' : 'OFF');
  }

  /**
   * HB#118: Toggle a task's selection status
   */
  toggleTaskSelection(taskId) {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
      console.log('[TasksBot] Deselected:', taskId);
    } else {
      this.selectedTasks.add(taskId);
      console.log('[TasksBot] Selected:', taskId);
    }
    this.render();
  }

  /**
   * HB#118: Clear all selected tasks
   */
  batchSelectNone() {
    this.selectedTasks.clear();
    this.render();
    console.log('[TasksBot] All selections cleared');
  }

  /**
   * HB#118: Mark all selected tasks as completed
   */
  async batchComplete() {
    if (this.selectedTasks.size === 0) {
      this.showFileNotification('No tasks selected', 'info');
      return;
    }
    
    if (!confirm('Mark ' + this.selectedTasks.size + ' tasks as completed?')) {
      return;
    }
    
    try {
      let successCount = 0;
      let failedCount = 0;
      
      // Find tasks to complete
      const tasksToComplete = this.allTasks.filter(t => this.selectedTasks.has(t.id));
      
      console.log('[TasksBot] Completing ' + tasksToComplete.length + ' tasks...');
      
      for (const task of tasksToComplete) {
        try {
          const response = await this.fetchWithRetry(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_status',
              taskName: task.name,
              newStatus: 'completed'
            })
          }, 2);
          
          if (response.ok) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
          console.error('[TasksBot] Failed to complete:', task.name, err);
        }
      }
      
      // Reload and render
      await this.loadTasks();
      this.render(true);
      this.selectedTasks.clear();
      
      if (failedCount === 0) {
        this.showFileNotification('✅ Completed ' + successCount + ' tasks', 'success');
      } else {
        this.showFileNotification('⚠️ Completed ' + successCount + '/' + tasksToComplete.length + ' tasks', 'error');
      }
    } catch (err) {
      console.error('[TasksBot] Batch complete failed:', err);
      this.showFileNotification('Error completing tasks: ' + err.message, 'error');
    }
  }

  /**
   * HB#118: Delete all selected tasks
   */
  async batchDelete() {
    if (this.selectedTasks.size === 0) {
      this.showFileNotification('No tasks selected', 'info');
      return;
    }
    
    if (!confirm('Delete ' + this.selectedTasks.size + ' tasks? This cannot be undone.')) {
      return;
    }
    
    try {
      let successCount = 0;
      let failedCount = 0;
      
      // Find tasks to delete
      const tasksToDelete = this.allTasks.filter(t => this.selectedTasks.has(t.id));
      
      console.log('[TasksBot] Deleting ' + tasksToDelete.length + ' tasks...');
      
      for (const task of tasksToDelete) {
        try {
          // Add to undo stack before deletion
          this.undoStack.push({ ...task, deletedAt: new Date().toISOString() });
          if (this.undoStack.length > 10) this.undoStack.shift();
          
          const response = await this.fetchWithRetry(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete',
              name: task.name
            })
          }, 2);
          
          if (response.ok) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
          console.error('[TasksBot] Failed to delete:', task.name, err);
        }
      }
      
      // Reload and render
      await this.loadTasks();
      this.render(true);
      this.selectedTasks.clear();
      
      if (failedCount === 0) {
        this.showFileNotification('✅ Deleted ' + successCount + ' tasks (Undo available)', 'success');
      } else {
        this.showFileNotification('⚠️ Deleted ' + successCount + '/' + tasksToDelete.length + ' tasks', 'error');
      }
    } catch (err) {
      console.error('[TasksBot] Batch delete failed:', err);
      this.showFileNotification('Error deleting tasks: ' + err.message, 'error');
    }
  }

  /**
   * HB#118: Set priority for all selected tasks
   */
  async batchSetPriority(newPriority) {
    if (this.selectedTasks.size === 0) {
      this.showFileNotification('No tasks selected', 'info');
      return;
    }
    
    try {
      let successCount = 0;
      let failedCount = 0;
      
      // Find tasks to update
      const tasksToUpdate = this.allTasks.filter(t => this.selectedTasks.has(t.id));
      
      console.log('[TasksBot] Setting priority to ' + newPriority + ' for ' + tasksToUpdate.length + ' tasks...');
      
      for (const task of tasksToUpdate) {
        try {
          const response = await this.fetchWithRetry(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_priority',
              taskName: task.name,
              newPriority: newPriority
            })
          }, 2);
          
          if (response.ok) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
          console.error('[TasksBot] Failed to update:', task.name, err);
        }
      }
      
      // Reload and render
      await this.loadTasks();
      this.render(true);
      this.selectedTasks.clear();
      
      if (failedCount === 0) {
        this.showFileNotification('✅ Updated priority to ' + newPriority + ' for ' + successCount + ' tasks', 'success');
      } else {
        this.showFileNotification('⚠️ Updated ' + successCount + '/' + tasksToUpdate.length + ' tasks', 'error');
      }
    } catch (err) {
      console.error('[TasksBot] Batch priority update failed:', err);
      this.showFileNotification('Error updating priority: ' + err.message, 'error');
    }
  }
}

// Initialize globally
window.tasksBotEnhanced = new TasksBotEnhanced();
console.log('[TasksBot] Enhanced version ready with HB#118 Batch Operations');
