/**
 * Task Activity Feed — Real-time state transitions
 * Shows pending → running → completed flow live
 */
class TaskActivityFeed {
  constructor() {
    this.container = null;
    this.feed = [];
  }

  init() {
    this.container = document.getElementById('task-activity-feed');
    if (!this.container) return;
    
    // Subscribe to GlobalRefresh
    if (window.GlobalRefresh) {
      window.GlobalRefresh.on('taskActivity', (data) => {
        if (data && data.activity) {
          this.feed = data.activity;
          this.render();
        }
      });
      
      // Add the endpoint to GlobalRefresh
      if (!window.GlobalRefresh.endpoints.find(e => e.key === 'taskActivity')) {
        window.GlobalRefresh.endpoints.push({ key: 'taskActivity', url: '/api/tasks/activity?limit=15' });
      }
    }
    
    // Initial load
    this.loadFeed();
  }

  async loadFeed() {
    try {
      const base = window.API_BASE || '';
      const res = await fetch(base + '/api/tasks/activity?limit=15');
      const data = await res.json();
      if (data.activity) {
        this.feed = data.activity;
        this.render();
      }
    } catch(e) { console.warn('[ActivityFeed] Load error:', e.message); }
  }

  getIcon(status) {
    const icons = {
      'pending': '⏳',
      'running': '🔨',
      'completed': '✅',
      'blocked': '🚫',
      'rejected': '❌',
      'none': '🆕'
    };
    return icons[status] || '📋';
  }

  getColor(to) {
    const colors = {
      'pending': '#f59e0b',
      'running': '#3b82f6',
      'completed': '#10b981',
      'blocked': '#ef4444',
      'rejected': '#ef4444'
    };
    return colors[to] || '#6b7280';
  }

  timeAgo(ts) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  render() {
    if (!this.container) return;
    if (this.feed.length === 0) {
      this.container.innerHTML = '<div style="text-align:center;color:#6b7280;padding:20px;">No activity yet</div>';
      return;
    }

    let html = '';
    this.feed.forEach((item, i) => {
      const color = this.getColor(item.to);
      const fromIcon = this.getIcon(item.from);
      const toIcon = this.getIcon(item.to);
      const isNew = i === 0 && (Date.now() - new Date(item.timestamp).getTime()) < 30000;
      const taskName = (item.task || '').length > 45 ? item.task.substring(0, 45) + '...' : item.task;
      
      html += `<div class="activity-item${isNew ? ' activity-new' : ''}" style="
        display: flex; align-items: center; gap: 10px; padding: 8px 12px;
        border-left: 3px solid ${color}; margin-bottom: 6px;
        background: rgba(255,255,255,0.03); border-radius: 0 6px 6px 0;
        ${isNew ? 'animation: activityPulse 2s ease-in-out;' : ''}
      ">
        <span style="font-size: 14px; white-space: nowrap;">${fromIcon} → ${toIcon}</span>
        <span style="flex: 1; font-size: 13px; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.task}">${taskName}</span>
        <span style="font-size: 11px; color: #6b7280; white-space: nowrap;">${this.timeAgo(item.timestamp)}</span>
      </div>`;
    });

    this.container.innerHTML = html;
  }
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  window.taskActivityFeed = new TaskActivityFeed();
  window.taskActivityFeed.init();
});
