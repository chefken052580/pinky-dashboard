/**
 * Task Search & Filter Module
 * Adds search and filter capabilities to TasksBot
 * Integrates with existing tasks-bot-enhanced.js
 */

class TaskSearchFilter {
  constructor() {
    this.searchQuery = '';
    this.priorityFilter = 'all';
    this.statusFilter = 'all';
    this.initialized = false;
    console.log('[TaskSearchFilter] Module created');
  }

  init(tasksBotInstance) {
    if (this.initialized) return;
    
    this.tasksBot = tasksBotInstance;
    this.createUI();
    this.attachEventListeners();
    
    this.initialized = true;
    console.log('[TaskSearchFilter] Initialized');
  }

  createUI() {
    // Find the tasks container
    const container = document.getElementById('tasksbot-pro-container');
    if (!container) {
      console.error('[TaskSearchFilter] TasksBot container not found');
      return;
    }

    // Check if filter UI already exists
    if (document.getElementById('task-search-filter-controls')) {
      return; // Already created
    }

    // Create search and filter controls
    const controlsHTML = `
      <div id="task-search-filter-controls" class="task-search-filter-controls">
        <div class="search-filter-header">
          <h3>🔍 Search & Filter</h3>
        </div>
        
        <div class="search-filter-grid">
          <!-- Search Input -->
          <div class="search-control">
            <label for="task-search-input">Search Tasks</label>
            <input 
              type="text" 
              id="task-search-input" 
              class="task-search-input"
              placeholder="Search by name... (type to search)"
              autocomplete="off"
            />
            <span class="search-hint">Search as you type</span>
          </div>

          <!-- Priority Filter -->
          <div class="filter-control">
            <label for="task-priority-filter">Priority</label>
            <select id="task-priority-filter" class="task-filter-select">
              <option value="all">All Priorities</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
              <option value="-">No Priority</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="filter-control">
            <label for="task-status-filter">Status</label>
            <select id="task-status-filter" class="task-filter-select">
              <option value="all">All Statuses</option>
              <option value="completed">Completed ✅</option>
              <option value="pending">Pending ⏳</option>
              <option value="running">Running 🔄</option>
              <option value="analysis-ready">Analysis Ready 🔬</option>
            </select>
          </div>

          <!-- Clear Filters Button -->
          <div class="filter-control">
            <label>&nbsp;</label>
            <button id="task-clear-filters-btn" class="clear-filters-btn" title="Reset all filters">
              🔄 Clear Filters
            </button>
          </div>
        </div>

        <!-- Filter Status -->
        <div id="task-filter-status" class="task-filter-status">
          <span>📊 Showing all tasks</span>
        </div>
      </div>
    `;

    // Insert controls before the task list
    const tasksListContainer = container.querySelector('.tasks-list-container');
    if (tasksListContainer) {
      tasksListContainer.insertAdjacentHTML('beforebegin', controlsHTML);
    } else {
      container.insertAdjacentHTML('afterbegin', controlsHTML);
    }

    console.log('[TaskSearchFilter] UI created');
  }

  attachEventListeners() {
    // Search input
    const searchInput = document.getElementById('task-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilters();
      });
    }

    // Priority filter
    const prioritySelect = document.getElementById('task-priority-filter');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        this.priorityFilter = e.target.value;
        this.applyFilters();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('task-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.applyFilters();
      });
    }

    // Clear filters button
    const clearBtn = document.getElementById('task-clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }

    console.log('[TaskSearchFilter] Event listeners attached');
  }

  applyFilters() {
    const taskElements = document.querySelectorAll('.task-item');
    let visibleCount = 0;

    taskElements.forEach(taskEl => {
      const taskName = taskEl.getAttribute('data-task-name')?.toLowerCase() || '';
      const priority = taskEl.getAttribute('data-priority') || '';
      const status = taskEl.getAttribute('data-status') || '';

      // Check search match
      const searchMatch = this.searchQuery === '' || taskName.includes(this.searchQuery);

      // Check priority match
      const priorityMatch = this.priorityFilter === 'all' || priority === this.priorityFilter;

      // Check status match
      const statusMatch = this.statusFilter === 'all' || status === this.statusFilter;

      // Apply visibility
      const shouldShow = searchMatch && priorityMatch && statusMatch;
      taskEl.style.display = shouldShow ? 'block' : 'none';

      if (shouldShow) {
        visibleCount++;
      }
    });

    // Update status message
    this.updateFilterStatus(visibleCount, taskElements.length);

    console.log(`[TaskSearchFilter] Filters applied: ${visibleCount}/${taskElements.length} tasks shown`);
  }

  updateFilterStatus(visibleCount, totalCount) {
    const statusEl = document.getElementById('task-filter-status');
    if (!statusEl) return;

    let statusText = '';
    const activeFilters = [];

    if (this.searchQuery) activeFilters.push(`"${this.searchQuery}"`);
    if (this.priorityFilter !== 'all') activeFilters.push(`Priority: ${this.priorityFilter}`);
    if (this.statusFilter !== 'all') activeFilters.push(`Status: ${this.statusFilter}`);

    if (activeFilters.length === 0) {
      statusText = `📊 Showing all ${totalCount} tasks`;
    } else {
      statusText = `🔍 Showing ${visibleCount} of ${totalCount} tasks (${activeFilters.join(' | ')})`;
    }

    statusEl.textContent = statusText;
  }

  clearFilters() {
    // Clear search input
    const searchInput = document.getElementById('task-search-input');
    if (searchInput) searchInput.value = '';

    // Reset selects
    const prioritySelect = document.getElementById('task-priority-filter');
    if (prioritySelect) prioritySelect.value = 'all';

    const statusSelect = document.getElementById('task-status-filter');
    if (statusSelect) statusSelect.value = 'all';

    // Clear state
    this.searchQuery = '';
    this.priorityFilter = 'all';
    this.statusFilter = 'all';

    // Apply (show all)
    this.applyFilters();
    console.log('[TaskSearchFilter] Filters cleared');
  }

  // Public method to integrate with TasksBot - should be called when tasks are rendered
  enhanceTaskElements() {
    const taskElements = document.querySelectorAll('.task-item');
    
    taskElements.forEach(taskEl => {
      // Get task info from the element
      const nameEl = taskEl.querySelector('.task-name');
      const taskName = nameEl?.textContent || '';

      // Try to extract priority from priority badge
      let priority = '';
      const priorityEl = taskEl.querySelector('[class*="priority"]');
      if (priorityEl) {
        const text = priorityEl.textContent;
        if (text.includes('P1')) priority = 'P1';
        else if (text.includes('P2')) priority = 'P2';
        else if (text.includes('P3')) priority = 'P3';
      }

      // Try to extract status from status badges
      let status = '';
      if (taskEl.querySelector('[class*="status-completed"]') || taskEl.textContent.includes('✅')) {
        status = 'completed';
      } else if (taskEl.querySelector('[class*="status-pending"]') || taskEl.textContent.includes('⏳')) {
        status = 'pending';
      } else if (taskEl.querySelector('[class*="status-running"]') || taskEl.textContent.includes('🔄')) {
        status = 'running';
      } else if (taskEl.querySelector('[class*="status-analysis"]') || taskEl.textContent.includes('🔬')) {
        status = 'analysis-ready';
      }

      // Set data attributes for filtering
      taskEl.setAttribute('data-task-name', taskName);
      taskEl.setAttribute('data-priority', priority);
      taskEl.setAttribute('data-status', status);
    });

    console.log(`[TaskSearchFilter] Enhanced ${taskElements.length} task elements`);
  }

  destroy() {
    this.initialized = false;
    console.log('[TaskSearchFilter] Destroyed');
  }
}

// Create global instance
let taskSearchFilter = null;

// Export for use in other modules
window.TaskSearchFilter = TaskSearchFilter;

// Initialize when TasksBot is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!taskSearchFilter) {
    taskSearchFilter = new TaskSearchFilter();
    
    // Wait for TasksBot to be initialized
    const checkTasksBot = setInterval(() => {
      if (window.taskQueueManager && window.taskQueueManager.renderUI) {
        clearInterval(checkTasksBot);
        // Initialize after a small delay to let TasksBot render
        setTimeout(() => {
          taskSearchFilter.init(window.taskQueueManager);
          // Enhance existing task elements
          taskSearchFilter.enhanceTaskElements();
          console.log('[TaskSearchFilter] Integrated with TasksBot');
        }, 500);
      }
    }, 100);
  }
});

// Export global instance
window.taskSearchFilter = () => taskSearchFilter;
