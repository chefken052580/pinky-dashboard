/**
 * DEX Screener - Real-time DeFi monitoring for Solana and EVM chains
 * Displays trending tokens, new pairs, volume, and price changes
 */

class DEXScreener {
  constructor() {
    this.apiBase = 'https://api.dexscreener.com/latest';
    this.trendingTokens = [];
    this.newPairs = [];
    this.refreshInterval = null;
    this.selectedChain = 'solana'; // default to Solana
    
    this.chains = {
      solana: { name: 'Solana', icon: '◎', color: '#14F195' },
      ethereum: { name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
      bsc: { name: 'BSC', icon: '🔶', color: '#F3BA2F' },
      polygon: { name: 'Polygon', icon: '🟣', color: '#8247E5' },
      arbitrum: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0' },
      base: { name: 'Base', icon: '🔵', color: '#0052FF' }
    };
    
    this.init();
  }

  async init() {
    console.log('🔥 DEX Screener initializing...');
    
    // Initial data fetch
    await this.refreshData();
    
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => this.refreshData(), 30000);
    
    console.log('✅ DEX Screener ready');
  }

  async refreshData() {
    try {
      console.log(`🔄 Fetching DEX data for ${this.selectedChain}...`);
      
      // Fetch trending tokens
      await this.fetchTrendingTokens();
      
      // Fetch new pairs
      await this.fetchNewPairs();
      
      // Update UI
      this.renderTrendingTokens();
      this.renderNewPairs();
      this.updateLastRefresh();
      
    } catch (error) {
      console.error('DEX Screener refresh error:', error);
      this.showError('Failed to fetch DEX data. Check console for details.');
    }
  }

  async fetchTrendingTokens() {
    try {
      // DEXScreener API - get trending pairs for chain
      const response = await fetch(`${this.apiBase}/dex/search?q=${this.selectedChain}`);
      
      if (!response.ok) {
        throw new Error(`DEXScreener API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort by volume (highest first) and take top 10
      this.trendingTokens = (data.pairs || [])
        .filter(pair => pair.chainId === this.selectedChain)
        .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
        .slice(0, 10);
      
      console.log(`✅ Fetched ${this.trendingTokens.length} trending tokens for ${this.selectedChain}`);
      
    } catch (error) {
      console.error('Fetch trending tokens error:', error);
      this.trendingTokens = [];
    }
  }

  async fetchNewPairs() {
    try {
      // DEXScreener doesn't have a dedicated "new pairs" endpoint
      // So we'll fetch latest pairs and sort by pairCreatedAt
      const response = await fetch(`${this.apiBase}/dex/search?q=${this.selectedChain}`);
      
      if (!response.ok) {
        throw new Error(`DEXScreener API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter for pairs created in last 24h and sort by creation time
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      this.newPairs = (data.pairs || [])
        .filter(pair => {
          const createdAt = pair.pairCreatedAt ? new Date(pair.pairCreatedAt).getTime() : 0;
          return pair.chainId === this.selectedChain && createdAt > oneDayAgo;
        })
        .sort((a, b) => {
          const aTime = new Date(a.pairCreatedAt || 0).getTime();
          const bTime = new Date(b.pairCreatedAt || 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 10);
      
      console.log(`✅ Fetched ${this.newPairs.length} new pairs for ${this.selectedChain}`);
      
    } catch (error) {
      console.error('Fetch new pairs error:', error);
      this.newPairs = [];
    }
  }

  renderTrendingTokens() {
    const container = document.getElementById('dex-trending-container');
    if (!container) return;
    
    if (this.trendingTokens.length === 0) {
      container.innerHTML = `
        <div class="dex-empty-state">
          <p>No trending tokens found for ${this.chains[this.selectedChain]?.name || this.selectedChain}</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="dex-table">
        <div class="dex-table-header">
          <div class="dex-col-rank">#</div>
          <div class="dex-col-token">Token</div>
          <div class="dex-col-price">Price</div>
          <div class="dex-col-change">24h Change</div>
          <div class="dex-col-volume">24h Volume</div>
          <div class="dex-col-liquidity">Liquidity</div>
          <div class="dex-col-actions">Actions</div>
        </div>
        ${this.trendingTokens.map((pair, index) => this.renderTokenRow(pair, index + 1)).join('')}
      </div>
    `;
  }

  renderTokenRow(pair, rank) {
    const priceChange = parseFloat(pair.priceChange?.h24 || 0);
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeIcon = priceChange >= 0 ? '📈' : '📉';
    
    const price = parseFloat(pair.priceUsd || 0);
    const volume = parseFloat(pair.volume?.h24 || 0);
    const liquidity = parseFloat(pair.liquidity?.usd || 0);
    
    return `
      <div class="dex-table-row">
        <div class="dex-col-rank">${rank}</div>
        <div class="dex-col-token">
          <div class="token-info">
            <div class="token-name">${this.escapeHtml(pair.baseToken?.symbol || 'Unknown')}</div>
            <div class="token-pair">${this.escapeHtml(pair.baseToken?.symbol || '')}/${this.escapeHtml(pair.quoteToken?.symbol || '')}</div>
          </div>
        </div>
        <div class="dex-col-price">$${price.toFixed(price < 0.01 ? 6 : 4)}</div>
        <div class="dex-col-change ${changeClass}">
          ${changeIcon} ${priceChange.toFixed(2)}%
        </div>
        <div class="dex-col-volume">$${this.formatNumber(volume)}</div>
        <div class="dex-col-liquidity">$${this.formatNumber(liquidity)}</div>
        <div class="dex-col-actions">
          <button class="dex-action-btn" onclick="window.DEXScreener.openPair('${pair.url}')" title="View on DEXScreener">
            📊
          </button>
          <button class="dex-action-btn" onclick="window.DEXScreener.copyAddress('${pair.pairAddress}')" title="Copy pair address">
            📋
          </button>
        </div>
      </div>
    `;
  }

  renderNewPairs() {
    const container = document.getElementById('dex-newpairs-container');
    if (!container) return;
    
    if (this.newPairs.length === 0) {
      container.innerHTML = `
        <div class="dex-empty-state">
          <p>No new pairs found in last 24 hours for ${this.chains[this.selectedChain]?.name || this.selectedChain}</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="dex-pairs-grid">
        ${this.newPairs.map(pair => this.renderPairCard(pair)).join('')}
      </div>
    `;
  }

  renderPairCard(pair) {
    const priceChange = parseFloat(pair.priceChange?.h24 || 0);
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const price = parseFloat(pair.priceUsd || 0);
    const volume = parseFloat(pair.volume?.h24 || 0);
    
    const createdAt = pair.pairCreatedAt ? new Date(pair.pairCreatedAt) : null;
    const timeAgo = createdAt ? this.getTimeAgo(createdAt) : 'Unknown';
    
    return `
      <div class="dex-pair-card">
        <div class="pair-card-header">
          <div class="pair-tokens">
            ${this.escapeHtml(pair.baseToken?.symbol || 'Unknown')} / ${this.escapeHtml(pair.quoteToken?.symbol || 'Unknown')}
          </div>
          <div class="pair-age">${timeAgo}</div>
        </div>
        
        <div class="pair-card-body">
          <div class="pair-metric">
            <span class="metric-label">Price:</span>
            <span class="metric-value">$${price.toFixed(price < 0.01 ? 6 : 4)}</span>
          </div>
          <div class="pair-metric">
            <span class="metric-label">24h Change:</span>
            <span class="metric-value ${changeClass}">${priceChange.toFixed(2)}%</span>
          </div>
          <div class="pair-metric">
            <span class="metric-label">Volume:</span>
            <span class="metric-value">$${this.formatNumber(volume)}</span>
          </div>
        </div>
        
        <div class="pair-card-footer">
          <button class="dex-pair-btn" onclick="window.DEXScreener.openPair('${pair.url}')">
            View Chart
          </button>
          <button class="dex-pair-btn secondary" onclick="window.DEXScreener.copyAddress('${pair.pairAddress}')">
            Copy Address
          </button>
        </div>
      </div>
    `;
  }

  switchChain(chainId) {
    if (this.chains[chainId]) {
      this.selectedChain = chainId;
      console.log(`🔄 Switched to ${chainId}`);
      
      // Update active button
      document.querySelectorAll('.chain-selector-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.querySelector(`[data-chain="${chainId}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
      
      // Refresh data for new chain
      this.refreshData();
    }
  }

  openPair(url) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  copyAddress(address) {
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        this.showSuccess('✅ Pair address copied to clipboard!');
      }).catch(err => {
        console.error('Copy failed:', err);
        this.showError('Failed to copy address');
      });
    }
  }

  updateLastRefresh() {
    const el = document.getElementById('dex-last-refresh');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString();
    }
  }

  // Utility functions
  formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `dex-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 15px 25px;
      background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4444' : '#00d4ff'};
      color: #000;
      font-weight: bold;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Initialize on page load
let dexScreener;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dexScreener = new DEXScreener();
    window.DEXScreener = dexScreener;
  });
} else {
  dexScreener = new DEXScreener();
  window.DEXScreener = dexScreener;
}
