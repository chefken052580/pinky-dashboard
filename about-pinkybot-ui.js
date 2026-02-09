/**
 * About PinkyBot UI - System Info, Version, Tech Stack, API Endpoints
 * Displays comprehensive system information and architecture details
 */

class AboutPinkyBotUI {
  constructor() {
    this.apiBase = (typeof API_BASE !== 'undefined' ? API_BASE : '');
    this.version = '1.0.0-beta';
    this.buildDate = '2026-02-09';
  }

  /**
   * Initialize About UI
   */
  init() {
    const container = document.getElementById('about-container');
    if (!container) return;

    container.innerHTML = `
      <div class="about-panel" style="max-width:1000px;margin:0 auto;">
        
        <!-- System Overview -->
        <div class="stats-grid" style="margin-bottom:30px;">
          <div class="stat-card">
            <div class="stat-icon">🤖</div>
            <div class="stat-content">
              <div class="stat-value">${this.version}</div>
              <div class="stat-label">Version</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-value" id="about-uptime">Loading...</div>
              <div class="stat-label">Uptime</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🚀</div>
            <div class="stat-content">
              <div class="stat-value">${this.buildDate}</div>
              <div class="stat-label">Build Date</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <div class="stat-value" id="about-status">Active</div>
              <div class="stat-label">Status</div>
            </div>
          </div>
        </div>

        <!-- Tech Stack -->
        <div class="recent-activity" style="margin-bottom:30px;">
          <h3>🛠️ Technology Stack</h3>
          <div class="stats-grid" style="margin-top:15px;">
            <div class="stat-card">
              <div class="stat-icon">🟦</div>
              <div class="stat-content">
                <div class="stat-label">Frontend</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  HTML5, CSS3, Vanilla JavaScript<br>
                  Chart.js, Flexbox/Grid
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">🟩</div>
              <div class="stat-content">
                <div class="stat-label">Backend</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  Node.js v23+<br>
                  Express.js, PM2
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">🟨</div>
              <div class="stat-content">
                <div class="stat-label">Storage</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  JSON file-based<br>
                  localStorage
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">🟧</div>
              <div class="stat-content">
                <div class="stat-label">AI Models</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  Claude Sonnet 4.5<br>
                  Grok/XAI integration
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Architecture Diagram -->
        <div class="recent-activity" style="margin-bottom:30px;">
          <h3>🏗️ System Architecture</h3>
          <div style="background:var(--surface-1);border:1px solid rgba(102,126,234,0.3);border-radius:12px;padding:30px;margin-top:15px;">
            <pre style="color:var(--text-primary);font-size:0.85em;line-height:1.8;font-family:monospace;margin:0;">
┌─────────────────┐
│ Web Dashboard   │  (pinky-dashboard/)
│   HTML/CSS/JS   │  • Task Manager
│   Chart.js UI   │  • Analytics Views
└────────┬────────┘  • Bot Controllers
         │
         ↓  HTTP/REST
┌─────────────────┐
│  Express Server │  (bot-backend/server.js)
│   Port 3030     │  • API Router
│   PM2 Managed   │  • CORS enabled
└────────┬────────┘  • JSON storage
         │
         ├──→ /api/tasks         (Task Management)
         ├──→ /api/activity      (Activity Logs)
         ├──→ /api/usage         (Token Tracking)
         ├──→ /api/codebot       (Git Stats)
         ├──→ /api/wordpress     (WP Integration)
         ├──→ /api/stripe        (Payments)
         ├──→ /api/license       (License Keys)
         └──→ /api/analytics     (Metrics)
            </pre>
          </div>
        </div>

        <!-- API Endpoints -->
        <div class="recent-activity">
          <h3>🔌 API Endpoints</h3>
          <div id="about-api-endpoints" class="activity-feed" style="margin-top:15px;max-height:400px;overflow-y:auto;">
            <div class="activity-item">Loading API endpoints...</div>
          </div>
        </div>

        <!-- Footer Info -->
        <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid var(--border-color);color:var(--text-secondary);font-size:0.9em;">
          <p>PinkyBot - Autonomous AI Task Management System</p>
          <p>Built with OpenClaw framework • Running on AMD Ryzen 9 7950X</p>
          <p>For support: <a href="https://github.com/pinkybot/pinkybot" style="color:var(--purple);">GitHub</a> | 
             <a href="https://discord.gg/pinkybot" style="color:var(--purple);">Discord</a></p>
        </div>
      </div>
    `;

    // Load dynamic data
    this.loadUptime();
    this.loadAPIEndpoints();

    console.log('[AboutPinkyBot] UI initialized');
  }

  /**
   * Calculate and display uptime
   */
  async loadUptime() {
    try {
      const response = await fetch(`${this.apiBase}/api/usage`);
      const data = await response.json();
      
      // Use lastUpdated as a proxy for uptime
      if (data.lastUpdated) {
        const start = new Date(data.lastUpdated);
        const now = new Date();
        const diffMs = now - start;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        const uptimeEl = document.getElementById('about-uptime');
        if (uptimeEl) {
          if (days > 0) {
            uptimeEl.textContent = `${days}d ${hours}h`;
          } else {
            uptimeEl.textContent = `${hours}h`;
          }
        }
      }
    } catch (error) {
      console.error('[AboutPinkyBot] Failed to load uptime:', error);
      const uptimeEl = document.getElementById('about-uptime');
      if (uptimeEl) uptimeEl.textContent = 'N/A';
    }
  }

  /**
   * Load and display available API endpoints
   */
  async loadAPIEndpoints() {
    const container = document.getElementById('about-api-endpoints');
    if (!container) return;

    // Define known endpoints
    const endpoints = [
      { method: 'GET', path: '/api/tasks', description: 'List all tasks' },
      { method: 'POST', path: '/api/tasks', description: 'Create new task' },
      { method: 'PATCH', path: '/api/tasks/:id', description: 'Update task status' },
      { method: 'GET', path: '/api/activity', description: 'Get activity log' },
      { method: 'GET', path: '/api/usage', description: 'Get token usage stats' },
      { method: 'GET', path: '/api/codebot/commits', description: 'Get git commit history' },
      { method: 'GET', path: '/api/codebot/stats', description: 'Get code statistics' },
      { method: 'GET', path: '/api/codebot/syntax-errors', description: 'Get syntax error log' },
      { method: 'GET', path: '/api/codebot/contributors', description: 'Get top contributors' },
      { method: 'GET', path: '/api/wordpress/connections', description: 'List WordPress sites' },
      { method: 'POST', path: '/api/wordpress/post', description: 'Create WordPress post' },
      { method: 'GET', path: '/api/stripe/checkout', description: 'Create payment session' },
      { method: 'GET', path: '/api/license/validate', description: 'Validate license key' },
      { method: 'GET', path: '/api/analytics/metrics', description: 'Get engagement metrics' },
      { method: 'POST', path: '/api/auth/login', description: 'User authentication' },
      { method: 'GET', path: '/api/tier', description: 'Get subscription tier' }
    ];

    let html = '';
    endpoints.forEach(endpoint => {
      const methodColor = endpoint.method === 'GET' ? '#4ade80' : 
                         endpoint.method === 'POST' ? '#60a5fa' : 
                         endpoint.method === 'PATCH' ? '#fbbf24' : 
                         '#f87171';
      
      html += `
        <div class="activity-item" style="display:flex;gap:15px;align-items:center;font-family:monospace;font-size:0.85em;">
          <span style="color:${methodColor};font-weight:600;width:60px;">${endpoint.method}</span>
          <span style="color:var(--purple);flex:1;">${endpoint.path}</span>
          <span style="color:var(--text-secondary);font-family:sans-serif;">${endpoint.description}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }
}

// Initialize globally
let aboutPinkyBot;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
  aboutPinkyBot = new AboutPinkyBotUI();
  
  // Watch for about view becoming visible
  const aboutView = document.getElementById('about-view');
  if (aboutView) {
    const observer = new MutationObserver(() => {
      if (aboutView.style.display !== 'none' && !aboutView.classList.contains('hidden')) {
        aboutPinkyBot.init();
      }
    });
    
    observer.observe(aboutView, { 
      attributes: true, 
      attributeFilter: ['style', 'class'] 
    });
    
    // Initialize immediately if already visible
    if (aboutView.style.display !== 'none') {
      aboutPinkyBot.init();
    }
  }
});
} else {
  // DOMContentLoaded already fired, init now
  (function() {
  })();
}