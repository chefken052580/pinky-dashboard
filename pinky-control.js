// Pinky Start/Stop Control Widget
(function() {
  const btn = document.getElementById('pinky-power-btn');
  const statusDot = document.getElementById('pinky-status-dot');
  const statusText = document.getElementById('pinky-status-text');
  if (!btn) return;

  async function checkStatus() {
    try {
      const res = await fetch('/api/pinky/status');
      const data = await res.json();
      updateUI(data.running);
    } catch(e) { updateUI(false); }
  }

  function updateUI(running) {
    if (running) {
      btn.textContent = '⏹ Stop Pinky';
      btn.className = 'pinky-power-btn pinky-running';
      if (statusDot) statusDot.style.background = '#10b981';
      if (statusText) statusText.textContent = 'Pinky: Running';
    } else {
      btn.textContent = '▶ Start Pinky';
      btn.className = 'pinky-power-btn pinky-stopped';
      if (statusDot) statusDot.style.background = '#ef4444';
      if (statusText) statusText.textContent = 'Pinky: Stopped';
    }
  }

  btn.addEventListener('click', async () => {
    const isRunning = btn.classList.contains('pinky-running');
    btn.disabled = true;
    btn.textContent = isRunning ? '⏳ Stopping...' : '⏳ Starting...';
    try {
      const res = await fetch('/api/pinky/' + (isRunning ? 'stop' : 'start'), { method: 'POST' });
      const data = await res.json();
      setTimeout(checkStatus, 2000);
    } catch(e) { console.error('Pinky control error:', e); }
    setTimeout(() => { btn.disabled = false; }, 3000);
  });

  checkStatus();
  setInterval(checkStatus, 15000);
})();
