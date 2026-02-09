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

      <div class="model-breakdown">
        <h4>Token Usage by Model</h4>
        <div id="model-allocation-bars" class="allocation-bars">
          <!-- Dynamically populated -->
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
      // Show loading state
      this.renderLoading();

      const [allocationRes, metricsRes, usageRes] = await Promise.all([
        fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/analytics/token-allocation'),
        fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/analytics/heartbeat-metrics'),
        fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/usage')
      ]);

      if (!allocationRes.ok || !metricsRes.ok || !usageRes.ok) {
        const status = !allocationRes.ok ? allocationRes.status : (!metricsRes.ok ? metricsRes.status : usageRes.status);
        throw new Error(`API returned status ${status}`);
      }

      this.data = await allocationRes.json();
      this.metrics = await metricsRes.json();
      this.usage = await usageRes.json();

      // Validate response data
      if (!this.data || !this.metrics || !this.usage) {
        throw new Error('Invalid or empty response data');
      }

      this.renderData();
    } catch (err) {
      console.error('[TokenAllocation] Error:', err.message);
      this.renderError(err.message);
    }
  }

  renderLoading() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    const headerHTML = container.querySelector('.token-widget-header')?.outerHTML || '';
    container.innerHTML = headerHTML + `
      <div style="padding: 40px; text-align: center; color: #999;">
        <div class="loading-spinner" style="margin: 0 auto 15px;"></div>
        <div>Loading token allocation data...</div>
      </div>
    `;
  }

  renderError(message) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const headerHTML = container.querySelector('.token-widget-header')?.outerHTML || '';
    container.innerHTML = headerHTML + `
      <div style="padding: 40px; text-align: center; color: #ff6b6b;">
        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">
          Unable to Load Token Data
        </div>
        <div style="font-size: 13px; color: #999; margin-bottom: 20px;">
          ${message || 'An error occurred while fetching data'}
        </div>
        <button onclick="window.tokenAllocationWidget.loadData()" 
                style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
          Try Again
        </button>
      </div>
    `;
  }

  renderData() {
    if (!this.data || !this.metrics) {
      this.renderError('No data available to display');
      return;
    }

    try {
      // Total tokens
      const totalTokens = this.data.totalTokens || 0;
      document.getElementById('total-tokens').textContent = this.formatNumber(totalTokens);
      document.getElementById('total-tokens-detail').textContent = `${this.data.heartbeats || 0} heartbeats`;

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
      document.getElementById('efficiency-detail').textContent = `${this.metrics.averageTokensPerHeartbeat || 0}/HB`;

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

      // Model breakdown
      this.renderModelBreakdown();

      // Last updated
      document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      console.error('[TokenAllocation] Render error:', err.message);
      this.renderError(`Failed to render data: ${err.message}`);
    }
  }

  renderModelBreakdown() {
    const container = document.getElementById('model-allocation-bars');
    if (!container || !this.usage || !this.usage.byModel) {
      return;
    }

    const byModel = this.usage.byModel;
    const totalTokens = this.usage.totalTokens || 1;
    
    // Clear existing content
    container.innerHTML = '';

    // If no models, show message
    if (Object.keys(byModel).length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No model usage data available</div>';
      return;
    }

    // Create bars for each model
    Object.entries(byModel).forEach(([modelName, modelData]) => {
      const tokens = modelData.tokens || 0;
      const percentage = totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;
      
      // Get short model name
      const shortName = this.getShortModelName(modelName);
      const emoji = this.getModelEmoji(modelName);

      const itemHTML = `
        <div class="allocation-item">
          <div class="allocation-label">
            <span class="category-name">${emoji} ${shortName}</span>
            <span class="percentage">${percentage}%</span>
          </div>
          <div class="allocation-bar">
            <div class="allocation-fill model-${this.getModelClass(modelName)}" style="width: ${Math.min(percentage, 100)}%">
              <span class="tokens-label">${this.formatNumber(tokens)}</span>
            </div>
          </div>
        </div>
      `;
      
      container.insertAdjacentHTML('beforeend', itemHTML);
    });
  }

  getShortModelName(fullName) {
    // Convert full model names to short readable versions
    if (fullName.includes('claude-sonnet')) return 'Claude Sonnet 4.5';
    if (fullName.includes('claude-haiku')) return 'Claude Haiku 4.5';
    if (fullName.includes('grok')) return 'Grok (xAI)';
    if (fullName.includes('gpt-4')) return 'GPT-4';
    if (fullName.includes('gpt-3.5')) return 'GPT-3.5';
    return fullName.substring(0, 20); // Fallback: truncate long names
  }

  getModelEmoji(modelName) {
    if (modelName.includes('claude-sonnet')) return '🧠';
    if (modelName.includes('claude-haiku')) return '⚡';
    if (modelName.includes('grok')) return '🤖';
    if (modelName.includes('gpt-4')) return '🔷';
    if (modelName.includes('gpt-3.5')) return '🔹';
    return '🤖';
  }

  getModelClass(modelName) {
    // Return CSS-safe class name
    return modelName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  startAutoRefresh() {
    // DISABLED - use GlobalRefresh // Refresh every 30 seconds
  }
}

// Lazy initialization with Intersection Observer (performance optimization)
// Only render when widget becomes visible in viewport
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTokenAllocationWidgetLazy();
  });
} else {
  initTokenAllocationWidgetLazy();
}

function initTokenAllocationWidgetLazy() {
  const widgetContainer = document.getElementById('token-allocation-widget');
  if (!widgetContainer) {
    console.log('[TokenAllocationWidget] Container not found, waiting...');
    setTimeout(initTokenAllocationWidgetLazy, 500);
    return;
  }
  
  // Use Intersection Observer for lazy rendering (only when visible)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !window.tokenAllocationWidget) {
        console.log('[TokenAllocationWidget] 🚀 Widget visible, initializing now...');
        window.tokenAllocationWidget = new TokenAllocationWidget();
        window.tokenAllocationWidget.initialize();
        observer.disconnect(); // Stop observing once initialized
      }
    });
  }, {
    rootMargin: '50px' // Start loading 50px before it enters viewport
  });
  
  observer.observe(widgetContainer);
  console.log('[TokenAllocationWidget] ⏸️ Deferred initialization (will load when visible)');
}
