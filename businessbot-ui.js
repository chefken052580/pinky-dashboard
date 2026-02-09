/**
 * BusinessBot UI - Business Metrics, Revenue Tracking, Client Management
 * Placeholder dashboard for business analytics and automation
 */

class BusinessBotUI {
  constructor() {
    this.apiBase = (typeof API_BASE !== 'undefined' ? API_BASE : '');
  }

  /**
   * Initialize BusinessBot UI
   */
  init() {
    const container = document.getElementById('businessbot-container');
    if (!container) return;

    // Remove coming-soon-container class if present
    container.classList.remove('coming-soon-container');

    container.innerHTML = `
      <div class="business-panel" style="max-width:1000px;margin:0 auto;color:var(--text-primary);">
        
        <!-- Business Metrics Overview -->
        <div class="stats-grid" style="margin-bottom:30px;background:var(--surface-1);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-value" style="color:#4ade80;">$0</div>
              <div class="stat-label">Monthly Revenue</div>
              <div style="font-size:0.75em;color:var(--text-secondary);margin-top:3px;">+0% from last month</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-value">0</div>
              <div class="stat-label">Active Clients</div>
              <div style="font-size:0.75em;color:var(--text-secondary);margin-top:3px;">0 new this month</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">0</div>
              <div class="stat-label">Projects</div>
              <div style="font-size:0.75em;color:var(--text-secondary);margin-top:3px;">0 in progress</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <div class="stat-value">0h</div>
              <div class="stat-label">Hours Tracked</div>
              <div style="font-size:0.75em;color:var(--text-secondary);margin-top:3px;">This week</div>
            </div>
          </div>
        </div>

        <!-- Revenue Tracking -->
        <div class="recent-activity" style="margin-bottom:30px;background:var(--surface-1);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;">
          <h3>💵 Revenue Tracking</h3>
          <div style="background:var(--surface-1);border:1px solid rgba(102,126,234,0.3);border-radius:12px;padding:25px;margin-top:15px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
              <div>
                <div style="color:var(--text-secondary);font-size:0.9em;margin-bottom:8px;">Quarterly Revenue</div>
                <div style="font-size:1.8em;font-weight:600;color:#4ade80;">$0</div>
                <div style="color:var(--text-secondary);font-size:0.85em;margin-top:5px;">Q1 2026</div>
              </div>
              <div>
                <div style="color:var(--text-secondary);font-size:0.9em;margin-bottom:8px;">Average Deal Size</div>
                <div style="font-size:1.8em;font-weight:600;color:var(--purple);">$0</div>
                <div style="color:var(--text-secondary);font-size:0.85em;margin-top:5px;">Per project</div>
              </div>
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">
              <div style="color:var(--text-secondary);font-size:0.85em;">
                📈 Connect your accounting software to track real revenue data
              </div>
            </div>
          </div>
        </div>

        <!-- Client Management -->
        <div class="recent-activity" style="margin-bottom:30px;background:var(--surface-1);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;">
          <h3>👥 Client Management</h3>
          <div class="stats-grid" style="margin-top:15px;">
            <div class="stat-card" style="cursor:pointer;" onclick="businessBot.showClientModal('add')">
              <div class="stat-icon">➕</div>
              <div class="stat-content">
                <div class="stat-label">Add New Client</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  Create client profile
                </div>
              </div>
            </div>

            <div class="stat-card" style="cursor:pointer;" onclick="businessBot.showClientModal('view')">
              <div class="stat-icon">👁️</div>
              <div class="stat-content">
                <div class="stat-label">View Clients</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  Browse all clients
                </div>
              </div>
            </div>

            <div class="stat-card" style="cursor:pointer;" onclick="businessBot.showClientModal('invoices')">
              <div class="stat-icon">💸</div>
              <div class="stat-content">
                <div class="stat-label">Invoices</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  0 pending
                </div>
              </div>
            </div>

            <div class="stat-card" style="cursor:pointer;" onclick="businessBot.showClientModal('reports')">
              <div class="stat-icon">📄</div>
              <div class="stat-content">
                <div class="stat-label">Reports</div>
                <div style="font-size:0.85em;color:var(--text-secondary);margin-top:5px;">
                  Generate reports
                </div>
              </div>
            </div>
          </div>

          <!-- Client List Placeholder -->
          <div id="business-client-list" style="margin-top:20px;">
            <div class="activity-feed">
              <div class="activity-item" style="text-align:center;padding:30px;color:var(--text-secondary);">
                <div style="font-size:2em;margin-bottom:10px;">👥</div>
                <div>No clients added yet</div>
                <button 
                  style="margin-top:15px;padding:10px 20px;background:var(--purple);border:none;border-radius:8px;color:var(--text-heading);cursor:pointer;font-size:0.9em;" 
                  onclick="businessBot.showClientModal('add')">
                  Add Your First Client
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Business Automation Tools -->
        <div class="recent-activity">
          <h3>🤖 Automation Tools</h3>
          <div class="activity-feed" style="margin-top:15px;">
            <div class="activity-item">
              <strong>Automated Invoicing:</strong> 
              <span style="color:var(--text-secondary);">Send invoices automatically when projects complete</span>
              <span style="float:right;color:#fbbf24;">Coming Soon</span>
            </div>
            <div class="activity-item">
              <strong>Payment Reminders:</strong> 
              <span style="color:var(--text-secondary);">Auto-remind clients about overdue invoices</span>
              <span style="float:right;color:#fbbf24;">Coming Soon</span>
            </div>
            <div class="activity-item">
              <strong>Expense Tracking:</strong> 
              <span style="color:var(--text-secondary);">Track business expenses and categorize automatically</span>
              <span style="float:right;color:#fbbf24;">Coming Soon</span>
            </div>
            <div class="activity-item">
              <strong>Reporting:</strong> 
              <span style="color:var(--text-secondary);">Generate profit/loss, tax reports, and financial summaries</span>
              <span style="float:right;color:#fbbf24;">Coming Soon</span>
            </div>
          </div>
        </div>

        <!-- Footer Info -->
        <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid var(--border-color);color:var(--text-secondary);font-size:0.9em;">
          <p>💡 <strong>Pro Tip:</strong> BusinessBot will integrate with QuickBooks, Stripe, and FreshBooks for real-time data sync.</p>
        </div>
      </div>
    `;

    console.log('[BusinessBot] UI initialized');
  }

  /**
   * Show client modal (placeholder for future implementation)
   */
  showClientModal(action) {
    const messages = {
      'add': 'Add New Client functionality coming soon!',
      'view': 'Client list view coming soon!',
      'invoices': 'Invoice management coming soon!',
      'reports': 'Report generation coming soon!'
    };

    alert(messages[action] || 'Feature coming soon!');
  }
}

// Initialize globally
let businessBot;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
  businessBot = new BusinessBotUI();
  
  // Watch for business view becoming visible
  const businessView = document.getElementById('business-view');
  if (businessView) {
    const observer = new MutationObserver(() => {
      if (businessView.style.display !== 'none' && !businessView.classList.contains('hidden')) {
        businessBot.init();
      }
    });
    
    observer.observe(businessView, { 
      attributes: true, 
      attributeFilter: ['style', 'class'] 
    });
    
    // Initialize immediately if already visible
    if (businessView.style.display !== 'none') {
      businessBot.init();
    }
  }
});
} else {
  // DOMContentLoaded already fired, init now
  (function() {
  })();
}