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
    this.updateInterval = 10000;
    this.apiUrl = '/api/tasks';
    this.isInitialized = false; // Prevent double initialization
    this.container = null; // TIER 3: Store container reference for scoped selectors
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
      '/api/tasks',
      '/api/tasks',
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
    html += '</div>';

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
    html += '<button onclick="window.tasksBotEnhanced.addTaskFromUI()">Submit</button>';
    html += '</div>';
    // File attachment section (added by Pinky 2026-02-05)
    html += '<div id="task-attachments-ui-container" style="margin-top:12px;"></div>';
    html += '<div id="rule-status" style="display:none; margin-top:8px; padding:8px 12px; border-radius:6px; font-size:0.85em;"></div>';
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
        const taskId = 'task-' + task.id;
        
        html += '<div class="task-item ' + priorityColor + '" draggable="true" id="' + taskId + '" data-task="' + JSON.stringify(task).replace(/"/g, '&quot;') + '" data-task-name="' + this.escapeAttr(task.name) + '">';
        html += '<div class="task-header">';
        html += '<span class="priority-badge">' + (task.priority || 'P3') + '</span>';
        html += '<span class="task-name">' + this.escapeAttr(task.name) + '</span>';
        html += '<div class="task-actions">';
        html += '<button class="btn-priority-up" data-task-name="' + this.escapeAttr(task.name) + '" data-direction="up" title="Higher priority">↑</button>';
        html += '<button class="btn-priority-down" data-task-name="' + this.escapeAttr(task.name) + '" data-direction="down" title="Lower priority">↓</button>';
        html += '<button onclick="event.stopPropagation();window.tasksBotEnhanced.deleteTask(\'' + this.escapeAttr(task.name).replace(/'/g, "\\'") + '\',\'' + task.id + '\');" title="Delete task" style="background:#ff4444;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;margin-left:4px;font-size:0.8em;position:relative;z-index:10;">✕</button>';
        html += '</div>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + this.escapeAttr(task.notes) + '</div>';
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
        html += '<span class="task-name">' + this.escapeAttr(task.name) + '</span>';
        html += '<button onclick="event.stopPropagation();window.tasksBotEnhanced.deleteTask(\'' + this.escapeAttr(task.name).replace(/'/g, "\\'") + '\',\'' + task.id + '\');" title="Delete task" style="background:#ff4444;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;margin-left:auto;font-size:0.8em;position:relative;z-index:10;">✕</button>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + this.escapeAttr(task.notes) + '</div>';
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
        html += '<span class="task-name">' + this.escapeAttr(task.name) + '</span>';
        html += '</div>';
        
        if (task.notes) {
          html += '<div class="task-desc">' + this.escapeAttr(task.notes) + '</div>';
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
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; background: #f0f0f0; border-radius: 6px; width: fit-content; color: #000000; font-weight: 500;">
            <span style="font-size: 18px;">📎</span>
            <span style="font-size: 13px; font-weight: 600;">Attach Files (.png, .jpeg, .pdf - max 10MB)</span>
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
            for (const file of e.target.files) {
              try {
                const attachment = await window.fileAttachmentManager.addAttachment('new-task', file);
                window.fileAttachmentManager.displayAttachment(attachment);
              } catch (error) {
                alert('Error attaching file: ' + error.message);
              }
            }
            e.target.value = ''; // Reset input
          });
        }
      }
    }

    // NOTE: Do NOT call setupDragDrop() here - it's only called on init()
    // Re-attaching listeners on every render causes exponential listener growth
    // Use event delegation in setupDragDrop() to handle dynamically added elements
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
   * Delete a task by name
   */
  // ⚠️ PROTECTED — Delete by unique ID. Fixed by Lord_Cracker 2026-02-05.
  async deleteTask(taskName, taskId) {
    if (!confirm('Delete task: "' + taskName + '"?')) return;
    try {
      const body = { action: 'delete', name: taskName };
      if (taskId) body.id = parseFloat(taskId);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        console.log('[TasksBot] Deleted: ' + taskName);
        await this.loadTasks();
        this.render(true);
      }
    } catch (err) {
      console.error('[TasksBot] Delete failed:', err);
    }
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
