(function() {
  'use strict';
  var API = (typeof API_BASE !== 'undefined' ? API_BASE : '') ||
            (window.location.hostname === 'localhost' ? '' : 'https://pinky-api.crackerbot.io');
  var isOpen = false;
  var pinkyState = 'running'; // running, stopped, unknown

  async function fetchState() {
    try {
      var res = await fetch(API + '/api/heartbeat/state');
      var data = await res.json();
      var dot = document.getElementById('pinky-status-dot');
      var text = document.getElementById('pinky-status-text');
      var status = document.getElementById('pinky-control-status');
      var hbCount = document.getElementById('pinky-hb-count');
      var lastHb = document.getElementById('pinky-last-hb');
      var stopBtn = document.getElementById('pinky-stop-btn');
      var startBtn = document.getElementById('pinky-start-btn');

      if (data && data.heartbeatCount) {
        hbCount.textContent = data.heartbeatCount;
        if (data.lastRun) {
          var d = new Date(data.lastRun);
          var mins = Math.round((Date.now() - d.getTime()) / 60000);
          lastHb.textContent = mins < 60 ? mins + 'm ago' : Math.round(mins/60) + 'h ago';
        }
      }

      // Check if paused
      var paused = localStorage.getItem('pinky_paused') === 'true';
      if (paused) {
        pinkyState = 'stopped';
        dot.className = 'dot offline';
        text.textContent = 'Pinky Paused';
        status.textContent = 'Paused';
        status.className = 'pinky-control-status stopped';
        stopBtn.style.display = 'none';
        startBtn.style.display = '';
      } else {
        pinkyState = 'running';
        dot.className = 'dot online';
        text.textContent = 'System Online';
        status.textContent = 'Running';
        status.className = 'pinky-control-status running';
        stopBtn.style.display = '';
        startBtn.style.display = 'none';
      }
    } catch(e) {
      var dot2 = document.getElementById('pinky-status-dot');
      var text2 = document.getElementById('pinky-status-text');
      if (dot2) dot2.className = 'dot offline';
      if (text2) text2.textContent = 'Offline';
    }
  }

  window.PinkyControl = {
    toggle: function() {
      var dd = document.getElementById('pinky-control-dropdown');
      if (!dd) return;
      isOpen = !isOpen;
      dd.classList.toggle('visible', isOpen);
      if (isOpen) fetchState();
    },

    stop: async function(e) {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      localStorage.setItem('pinky_paused', 'true');
      try {
        await fetch(API + '/api/heartbeat/pause', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({paused: true, source: 'dashboard-control'}) });
      } catch(err) { console.log('[PinkyControl] Pause API not available, using localStorage flag'); }
      fetchState();
    },

    start: async function(e) {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      localStorage.removeItem('pinky_paused');
      try {
        await fetch(API + '/api/heartbeat/pause', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({paused: false, source: 'dashboard-control'}) });
      } catch(err) { console.log('[PinkyControl] Resume API not available, using localStorage flag'); }
      fetchState();
    },

    restart: async function(e) {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      localStorage.removeItem('pinky_paused');
      try { await fetch(API + '/api/heartbeat/restart', { method: 'POST' }); } catch(err) {}
      fetchState();
    }
  };

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    if (isOpen && !e.target.closest('.pinky-control')) {
      isOpen = false;
      var dd = document.getElementById('pinky-control-dropdown');
      if (dd) dd.classList.remove('visible');
    }
  });

  // Poll state every 30s
  setInterval(fetchState, 30000);
  setTimeout(fetchState, 1000);
})();
