/**
 * Tooltip System - Enhanced UIBot Implementation
 * Provides helpful hints for new users on first visit
 * Features: First-time onboarding, hint management, progress tracking
 * Updated: 2026-02-06 HB#128 - Enhanced with better onboarding flow
 */

class TooltipSystem {
  constructor() {
    this.isFirstVisit = this.checkFirstVisit();
    this.isSecondVisit = this.checkSecondVisit();
    this.tooltips = this.defineTooltips();
    this.activeTooltips = new Set();
    this.dismissedTooltips = this.loadDismissed();
    this.shownTooltips = this.loadShownTooltips();
    this.showOnboarding = this.isFirstVisit;
  }

  checkFirstVisit() {
    const visited = localStorage.getItem('pinky_visited');
    if (!visited) {
      localStorage.setItem('pinky_visited', 'true');
      localStorage.setItem('pinky_visit_count', '1');
      return true;
    }
    return false;
  }

  checkSecondVisit() {
    const visited = localStorage.getItem('pinky_visited');
    const visitCount = parseInt(localStorage.getItem('pinky_visit_count') || '0');
    if (visited && visitCount === 1) {
      localStorage.setItem('pinky_visit_count', '2');
      return true;
    }
    return false;
  }

  loadShownTooltips() {
    const shown = localStorage.getItem('pinky_shown_tooltips');
    return shown ? JSON.parse(shown) : [];
  }

  saveShownTooltips() {
    localStorage.setItem('pinky_shown_tooltips', JSON.stringify(this.shownTooltips));
  }

  defineTooltips() {
    return {
      'tasks-nav': {
        title: '📋 Tasks',
        text: 'Manage your tasks here. Add, complete, and track progress.',
        position: 'right',
        showDelay: 1500,
        priority: 1
      },
      'settings-nav': {
        title: '⚙️ Settings',
        text: 'Configure API keys, themes, and notification preferences.',
        position: 'right',
        showDelay: 3000,
        priority: 2
      },
      'health-nav': {
        title: '🏥 System Health',
        text: 'Real-time CPU, memory, and disk usage monitoring.',
        position: 'right',
        showDelay: 4500,
        priority: 3
      },
      'add-task-btn': {
        title: '➕ Create Task',
        text: 'Click here to add a new task to your queue.',
        position: 'bottom',
        showDelay: 2500,
        priority: 2
      },
      'task-filters': {
        title: '🔍 Search & Filter',
        text: 'Search tasks by name and filter by priority or status.',
        position: 'bottom',
        showDelay: 5000,
        priority: 3
      },
      'drag-drop-hint': {
        title: '🖱️ Drag to Reorder',
        text: 'Drag tasks up or down to reorganize your queue.',
        position: 'left',
        showDelay: 6000,
        priority: 4
      },
      'analytics-view': {
        title: '📊 Analytics Dashboard',
        text: 'Track tasks completed, token usage, and heartbeat efficiency metrics.',
        position: 'right',
        showDelay: 7500,
        priority: 4
      },
      'chat-view': {
        title: '💬 Chat Workspace',
        text: 'Real-time chat with bots and session management. Start conversations here.',
        position: 'right',
        showDelay: 9000,
        priority: 5
      },
      'export-btn': {
        title: '📦 Export Configuration',
        text: 'Download your dashboard settings and task data as a package.',
        position: 'bottom',
        showDelay: 10500,
        priority: 5
      },
      'keyboard-hint': {
        title: '⌨️ Keyboard Shortcuts',
        text: 'Press ? to see all keyboard shortcuts. T=Tasks, S=Settings, H=Health',
        position: 'bottom',
        showDelay: 12000,
        priority: 6
      }
    };
  }

  loadDismissed() {
    const dismissed = localStorage.getItem('pinky_dismissed_tooltips');
    return dismissed ? JSON.parse(dismissed) : [];
  }

  saveDismissed() {
    localStorage.setItem('pinky_dismissed_tooltips', JSON.stringify(this.dismissedTooltips));
  }

  initialize() {
    // Show welcome modal on first visit
    if (this.isFirstVisit) {
      setTimeout(() => this.showWelcomeModal(), 500);
    }
    
    // Show tooltips on first or second visit
    if (this.isFirstVisit || this.isSecondVisit) {
      // Sort tooltips by priority and showDelay
      const sorted = Object.entries(this.tooltips)
        .sort((a, b) => a[1].priority - b[1].priority);

      sorted.forEach(([id, tooltip]) => {
        setTimeout(() => this.showTooltip(id, tooltip), tooltip.showDelay);
      });
    }
  }

  showWelcomeModal() {
    const modal = document.createElement('div');
    modal.className = 'tooltip-welcome-modal';
    modal.innerHTML = `
      <div class="welcome-content">
        <h2>👋 Welcome to PinkyBot Dashboard!</h2>
        <p>We've prepared some helpful hints to get you started. You can dismiss any tooltip by clicking the ✕ button or waiting 8 seconds.</p>
        <div class="welcome-features">
          <div class="feature">
            <span class="feature-icon">📋</span>
            <span class="feature-name">Manage Tasks</span>
          </div>
          <div class="feature">
            <span class="feature-icon">⚙️</span>
            <span class="feature-name">Configure Settings</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📊</span>
            <span class="feature-name">Track Analytics</span>
          </div>
          <div class="feature">
            <span class="feature-icon">💬</span>
            <span class="feature-name">Chat with Bots</span>
          </div>
        </div>
        <div class="welcome-actions">
          <button id="welcome-start" class="btn-primary">Start Tour</button>
          <button id="welcome-skip" class="btn-secondary">Skip for Now</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('welcome-start')?.addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('welcome-skip')?.addEventListener('click', () => {
      modal.remove();
      this.dismissAll();
      localStorage.setItem('pinky_tooltips_disabled', 'true');
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (modal.parentElement) modal.remove();
    }, 10000);
  }

  showTooltip(id, tooltip) {
    if (this.dismissedTooltips.includes(id)) return;
    if (localStorage.getItem('pinky_tooltips_disabled')) return;
    
    const element = document.getElementById(id) || document.querySelector(`[data-tooltip="${id}"]`);
    if (!element) return;

    const tooltipEl = this.createTooltipElement(id, tooltip);
    document.body.appendChild(tooltipEl);
    this.activeTooltips.add(id);

    // Position tooltip relative to element
    this.positionTooltip(tooltipEl, element, tooltip.position);

    // Track shown tooltip
    this.shownTooltips.push(id);
    this.saveShownTooltips();

    // Auto-dismiss after 8 seconds or on click
    const autoDismiss = setTimeout(() => this.dismissTooltip(id), 8000);
    tooltipEl.addEventListener('click', () => {
      clearTimeout(autoDismiss);
      this.dismissTooltip(id);
    });
  }

  createTooltipElement(id, tooltip) {
    const el = document.createElement('div');
    el.className = 'pinky-tooltip';
    el.id = `tooltip-${id}`;
    el.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-title">${tooltip.title}</div>
        <div class="tooltip-text">${tooltip.text}</div>
        <button class="tooltip-close">✕</button>
      </div>
      <div class="tooltip-arrow"></div>
    `;
    
    el.querySelector('.tooltip-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismissTooltip(id);
    });

    return el;
  }

  positionTooltip(tooltipEl, targetEl, position) {
    const rect = targetEl.getBoundingClientRect();
    const offset = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const safeMargin = 10; // Minimum distance from viewport edges

    let left, top;

    switch (position) {
      case 'right':
        left = rect.right + offset;
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
      case 'left':
        left = rect.left - tooltipRect.width - offset;
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
      case 'bottom':
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        top = rect.bottom + offset;
        break;
      case 'top':
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        top = rect.top - tooltipRect.height - offset;
        break;
    }

    // Viewport boundary checks - prevent off-screen rendering
    // Check horizontal overflow
    if (left + tooltipRect.width > viewportWidth - safeMargin) {
      // Tooltip would go off right edge
      left = viewportWidth - tooltipRect.width - safeMargin;
    }
    if (left < safeMargin) {
      // Tooltip would go off left edge
      left = safeMargin;
    }

    // Check vertical overflow
    if (top + tooltipRect.height > viewportHeight - safeMargin) {
      // Tooltip would go off bottom edge
      top = viewportHeight - tooltipRect.height - safeMargin;
    }
    if (top < safeMargin) {
      // Tooltip would go off top edge
      top = safeMargin;
    }

    // Apply constrained positions
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  }

  dismissTooltip(id) {
    const el = document.getElementById(`tooltip-${id}`);
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }
    this.activeTooltips.delete(id);
    this.dismissedTooltips.push(id);
    this.saveDismissed();
  }

  dismissAll() {
    this.activeTooltips.forEach(id => this.dismissTooltip(id));
  }

  showManual(id) {
    if (this.tooltips[id]) {
      this.showTooltip(id, this.tooltips[id]);
    }
  }

  reset() {
    localStorage.removeItem('pinky_dismissed_tooltips');
    localStorage.removeItem('pinky_visited');
    this.dismissedTooltips = [];
    location.reload();
  }
}

// Auto-initialize on page load
let tooltipSystem;
document.addEventListener('DOMContentLoaded', () => {
  tooltipSystem = new TooltipSystem();
  tooltipSystem.initialize();
});
