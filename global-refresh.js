/**
 * Global Refresh Manager - ONE API call cycle for all widgets
 * Replaces 28+ independent setIntervals with a single coordinated loop
 */
class GlobalRefresh {
  constructor() {
    this.listeners = {};
    this.cache = {};
    this.interval = 15000; // 10s default (reduced from 30s for HB#278 task auto-refresh)
    this.endpoints = [
      { key: 'tasks', url: '/api/tasks' },
      { key: 'stats', url: '/api/tasks/stats' },
      { key: 'activity', url: '/api/activity' },
      { key: 'health', url: '/api/health' },
      { key: 'usage', url: '/api/usage' }
    ];
    this.running = false;
  }

  // Widgets subscribe: GlobalRefresh.on('tasks', (data) => { ... })
  on(key, callback) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
  }

  notify(key, data) {
    (this.listeners[key] || []).forEach(cb => {
      try { cb(data); } catch(e) { console.warn('[GlobalRefresh] Widget error on', key, e.message); }
    });
  }

  async fetchAll() {
    for (const ep of this.endpoints) {
      try {
        const res = await fetch(ep.url);
        if (res.ok) {
          const data = await res.json();
          this.cache[ep.key] = data;
          this.notify(ep.key, data);
        }
      } catch(e) {
        console.warn('[GlobalRefresh] Failed:', ep.key, e.message);
      }
    }
  }

  start(intervalMs) {
    if (this.running) return;
    this.running = true;
    this.interval = intervalMs || this.interval;
    // Initial fetch
    this.fetchAll();
    // Single global loop
    setInterval(() => this.fetchAll(), this.interval);
    console.log('[GlobalRefresh] Started — ' + this.endpoints.length + ' endpoints, ' + this.interval + 'ms cycle');
  }

  // Get cached data immediately (no fetch)
  get(key) { return this.cache[key] || null; }
}

window.GlobalRefresh = new GlobalRefresh();

// === LIVE PUSH: Instant dashboard updates via WebSocket ===
(function() {
  var script = document.createElement('script');
  script.src = '/socket.io/socket.io.js';
  script.onload = function() {
    var socket = io();
    socket.on('connect', function() {
      console.log('[LivePush] Connected to WebSocket');
    });
    socket.on('task-update', function() {
      console.log('[LivePush] Task changed — refreshing NOW');
      window.GlobalRefresh.fetchAll();
    });
    socket.on('disconnect', function() {
      console.log('[LivePush] Disconnected, polling fallback active');
    });
  };
  document.head.appendChild(script);
})();
