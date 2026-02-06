/**
 * Token Allocation Widget
 * Displays real token usage breakdown by category
 */

class TokenAllocationWidget {
  constructor() {
    this.containerId = 'token-allocation-widget';
    this.data = null;
    this.metrics = null;
  }

  async initialize() {
    this.createWidgetHTML();
    await this.loadData();
    this.startAutoRefresh();
  }

  createWidgetHTML() {
    const container = document.createElement('div');
    container.id = this.containerId;
    container.className = 'token-allocation-widget';
    container.innerHTML = `
      <div class="token-widget-header">
        <h3>🎯 Token Allocation</h3>
        <button id="token-refresh-btn" class="refresh-btn" title="Refresh data">⟳</button>
      </div>

      <div class="token-metric-cards">
        <div class="metric-card total">
          <div class="metric-label">Total Tokens</div>
          <div class="metric-value" id="total-tokens">0</div>
          <div class="metric-detail" id="total-tokens-detail"></div>
        </div>
        <div class="metric-card avg">
          <div class="metric-label">Avg per Heartbeat</div>
          <div class="metric-value" id="avg-tokens">0</div>
          <div class="metric-detail" id="avg-tokens-detail"></div>
        </div>
        <div class="metric-card efficiency">
          <div class="metric-label">Efficiency</div>
          <div class="metric-value" id="efficiency-rating">-</div>
          <div class="metric-detail" id="efficiency-detail"></div>
        </div>
      </div>

      <div class="token-breakdown">
        <h4>Token Usage by Category</h4>
        <div class="allocation-bars">
          <div class="allocation-item">
            <div class="allocation-label">
              <span class="category-name">💻 Code Analysis</span>
              <span class="percentage" id="code-pct">0%</span>
            </div>
            <div class="allocation-bar">
              <div class="allocation-fill code" id="code-bar" style="width: 0%">
                <span class="tokens-label" id="code-tokens">0</span>
              </div>
            </div>
          </div>

          <div class="allocation-item">
            <div class="allocation-label">
              <span class="category-name">📚 Documentation</span>
              <span class="percentage" id="docs-pct">0%</span>
            </div>
            <div class="allocation-bar">
              <div class="allocation-fill docs" id="docs-bar" style="width: 0%">
                <span class="tokens-label" id="docs-tokens">0</span>
              </div>
            </div>
          </div>

          <div class="allocation-item">
            <div class="allocation-label">
              <span class="category-name">🔍 Research</span>
              <span class="percentage" id="research-pct">0%</span>
            </div>
            <div class="allocation-bar">
              <div class="allocation-fill research" id="research-bar" style="width: 0%">
                <span class="tokens-label" id="research-tokens">0</span>
              </div>
            </div>
          </div>

          <div class="allocation-item">
            <div class="allocation-label">
              <span class="category-name">⚙️ Task Management</span>
              <span class="percentage" id="taskMgmt-pct">0%</span>
            </div>
            <div class="allocation-bar">
              <div class="allocation-fill taskMgmt" id="taskMgmt-bar" style="width: 0%">
                <span class="tokens-label" id="taskMgmt-tokens">0</span>
              </div>
            </div>
          </div>

          <div class="allocation-item">
            <div class="allocation-label">
              <span class="category-name">📦 Other</span>
              <span class="percentage" id="other-pct">0%</span>
            </div>
            <div class="allocation-bar">
              <div class="allocation-fill other" id="other-bar" style="width: 0%">
                <span class="tokens-label" id="other-tokens">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="heartbeat-metrics">
        <h4>Heartbeat Performance</h4>
        <div class="metrics-grid">
          <div class="metric-row">
            <span class="metric-name">Total Heartbeats:</span>
            <span class="metric-val" id="hb-count">0</span>
          </div>
          <div class="metric-row">
            <span class="metric-name">Avg Exec Time:</span>
            <span class="metric-val" id="hb-exec">0s</span>
          </div>
          <div class="metric-row">
            <span class="metric-name">Total Exec Time:</span>
            <span class="metric-val" id="hb-exec-total">0s</span>
          </div>
        </div>
      </div>

      <div class="widget-footer">
        <small id="last-updated">Last updated: -</small>
      </div>
    `;

    // Find the analytics view and append widget
    const analyticsView = document.getElementById('analytics-view');
    if (analyticsView) {
      analyticsView.insertBefore(container, analyticsView.firstChild);
    } else {
      document.body.appendChild(container);
    }

    // Add refresh button listener
    document.getElementById('token-refresh-btn')?.addEventListener('click', () => this.loadData());
  }

  async loadData() {
    try {
      const [allocationRes, metricsRes] = await Promise.all([
        fetch('http://192.168.254.4:3030/api/analytics/token-allocation'),
        fetch('http://192.168.254.4:3030/api/analytics/heartbeat-metrics')
      ]);

      if (!allocationRes.ok || !metricsRes.ok) {
        throw new Error('API error');
      }

      this.data = await allocationRes.json();
      this.metrics = await metricsRes.json();
      this.renderData();
    } catch (err) {
      console.error('[TokenAllocation] Error:', err.message);
    }
  }

  renderData() {
    if (!this.data || !this.metrics) return;

    // Total tokens
    const totalTokens = this.data.totalTokens || 0;
    document.getElementById('total-tokens').textContent = this.formatNumber(totalTokens);
    document.getElementById('total-tokens-detail').textContent = `${this.data.heartbeats} heartbeats`;

    // Average
    const avgTokens = this.metrics.averageTokensPerHeartbeat || 0;
    document.getElementById('avg-tokens').textContent = this.formatNumber(avgTokens);
    document.getElementById('avg-tokens-detail').textContent = `per heartbeat`;

    // Efficiency
    const efficiency = this.metrics.efficiency || 'unknown';
    const efficiencyEmoji = {
      'excellent': '⭐',
      'good': '✅',
      'fair': '⚠️',
      'poor': '❌'
    }[efficiency] || '❓';
    document.getElementById('efficiency-rating').textContent = `${efficiencyEmoji} ${efficiency}`;
    document.getElementById('efficiency-detail').textContent = `${this.metrics.averageTokensPerHeartbeat}/HB`;

    // Token allocation breakdown
    const categories = ['code', 'docs', 'research', 'taskMgmt', 'other'];
    for (const cat of categories) {
      const tokens = this.data[cat]?.tokens || 0;
      const pct = this.data[cat]?.percentage || 0;

      document.getElementById(`${cat}-pct`).textContent = `${pct}%`;
      document.getElementById(`${cat}-bar`).style.width = `${Math.min(pct, 100)}%`;
      document.getElementById(`${cat}-tokens`).textContent = this.formatNumber(tokens);
    }

    // Heartbeat metrics
    document.getElementById('hb-count').textContent = this.data.heartbeats || 0;
    document.getElementById('hb-exec').textContent = `${this.metrics.averageExecTimePerHeartbeat || 0}s`;
    document.getElementById('hb-exec-total').textContent = `${Math.round((this.metrics.totalExecTime || 0) / 60)}m`;

    // Last updated
    document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  startAutoRefresh() {
    setInterval(() => this.loadData(), 30000); // Refresh every 30 seconds
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.tokenAllocationWidget = new TokenAllocationWidget();
    window.tokenAllocationWidget.initialize();
  });
} else {
  window.tokenAllocationWidget = new TokenAllocationWidget();
  window.tokenAllocationWidget.initialize();
}
