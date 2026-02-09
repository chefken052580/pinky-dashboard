/**
 * Raydium Pools Viewer - Solana DEX liquidity pool monitoring
 * Displays LP pairs, TVL, APR, volume, and pool statistics
 */

class RaydiumPoolsViewer {
  constructor() {
    // Raydium API endpoints
    this.apiBase = 'https://api.raydium.io/v2';
    this.pools = [];
    this.topPools = [];
    this.refreshInterval = null;
    this.sortBy = 'tvl'; // default sort: tvl, volume, apr
    this.sortOrder = 'desc'; // desc or asc
    
    this.init();
  }

  async init() {
    console.log('💧 Raydium Pools Viewer initializing...');
    
    // Initial data fetch
    await this.refreshPools();
    
    // Auto-refresh every 45 seconds (Raydium data doesn't change as fast as DEX screener)
    this.refreshInterval = setInterval(() => this.refreshPools(), 45000);
    
    console.log('✅ Raydium Pools Viewer ready');
  }

  async refreshPools() {
    try {
      console.log('🔄 Fetching Raydium pools...');
      
      // Fetch pool data from Raydium API
      const response = await fetch(`${this.apiBase}/main/pairs`);
      
      if (!response.ok) {
        throw new Error(`Raydium API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process and filter pools
      this.pools = Object.values(data).filter(pool => {
        // Filter out pools with no liquidity or volume
        return pool.liquidity && pool.liquidity > 1000;
      });
      
      // Sort pools
      this.sortPools();
      
      // Get top 20 pools
      this.topPools = this.pools.slice(0, 20);
      
      console.log(`✅ Fetched ${this.pools.length} Raydium pools, showing top 20`);
      
      // Update UI
      this.renderPools();
      this.updateStats();
      this.updateLastRefresh();
      
    } catch (error) {
      console.error('Raydium pools refresh error:', error);
      this.showError('Failed to fetch Raydium pools. Using fallback data or check console.');
      
      // Show error state in UI
      const container = document.getElementById('raydium-pools-container');
      if (container) {
        container.innerHTML = `
          <div class="raydium-error">
            <p>❌ Unable to connect to Raydium API</p>
            <p style="font-size: 13px; color: #999; margin-top: 10px;">
              ${error.message}
            </p>
            <button onclick="window.RaydiumPoolsViewer.refreshPools()" style="margin-top: 15px; padding: 10px 20px; background: #00d4ff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
              Retry
            </button>
          </div>
        `;
      }
    }
  }

  sortPools() {
    const sortKey = this.sortBy;
    const order = this.sortOrder === 'desc' ? -1 : 1;
    
    this.pools.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      
      switch (sortKey) {
        case 'tvl':
          aVal = parseFloat(a.liquidity || 0);
          bVal = parseFloat(b.liquidity || 0);
          break;
        case 'volume':
          aVal = parseFloat(a.volume24h || 0);
          bVal = parseFloat(b.volume24h || 0);
          break;
        case 'apr':
          aVal = parseFloat(a.apr || 0);
          bVal = parseFloat(b.apr || 0);
          break;
        default:
          aVal = parseFloat(a.liquidity || 0);
          bVal = parseFloat(b.liquidity || 0);
      }
      
      return (bVal - aVal) * order;
    });
  }

  setSortBy(key) {
    if (this.sortBy === key) {
      // Toggle sort order
      this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      this.sortBy = key;
      this.sortOrder = 'desc';
    }
    
    // Update sort button UI
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.classList.remove('active', 'asc', 'desc');
    });
    const activeBtn = document.querySelector(`[data-sort="${key}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active', this.sortOrder);
    }
    
    this.sortPools();
    this.topPools = this.pools.slice(0, 20);
    this.renderPools();
  }

  renderPools() {
    const container = document.getElementById('raydium-pools-container');
    if (!container) return;
    
    if (this.topPools.length === 0) {
      container.innerHTML = `
        <div class="raydium-empty">
          <p>No Raydium pools found</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="raydium-table">
        <div class="raydium-table-header">
          <div class="pool-col-rank">#</div>
          <div class="pool-col-pair">Pair</div>
          <div class="pool-col-tvl">
            <button class="sort-btn ${this.sortBy === 'tvl' ? 'active ' + this.sortOrder : ''}" 
                    data-sort="tvl" 
                    onclick="window.RaydiumPoolsViewer.setSortBy('tvl')">
              TVL ${this.sortBy === 'tvl' ? (this.sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
          <div class="pool-col-volume">
            <button class="sort-btn ${this.sortBy === 'volume' ? 'active ' + this.sortOrder : ''}" 
                    data-sort="volume" 
                    onclick="window.RaydiumPoolsViewer.setSortBy('volume')">
              24h Volume ${this.sortBy === 'volume' ? (this.sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
          <div class="pool-col-apr">
            <button class="sort-btn ${this.sortBy === 'apr' ? 'active ' + this.sortOrder : ''}" 
                    data-sort="apr" 
                    onclick="window.RaydiumPoolsViewer.setSortBy('apr')">
              APR ${this.sortBy === 'apr' ? (this.sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
          <div class="pool-col-price">Price</div>
          <div class="pool-col-actions">Actions</div>
        </div>
        ${this.topPools.map((pool, index) => this.renderPoolRow(pool, index + 1)).join('')}
      </div>
    `;
  }

  renderPoolRow(pool, rank) {
    const tvl = parseFloat(pool.liquidity || 0);
    const volume = parseFloat(pool.volume24h || 0);
    const apr = parseFloat(pool.apr || 0);
    const price = parseFloat(pool.price || 0);
    
    const pairName = pool.name || `${pool.baseCurrency}/${pool.quoteCurrency}`;
    const poolAddress = pool.ammId || pool.id || '';
    
    return `
      <div class="raydium-table-row">
        <div class="pool-col-rank">${rank}</div>
        <div class="pool-col-pair">
          <div class="pool-pair-info">
            <div class="pool-pair-name">${this.escapeHtml(pairName)}</div>
            <div class="pool-pair-address">${this.shortenAddress(poolAddress)}</div>
          </div>
        </div>
        <div class="pool-col-tvl">$${this.formatNumber(tvl)}</div>
        <div class="pool-col-volume">$${this.formatNumber(volume)}</div>
        <div class="pool-col-apr ${apr > 100 ? 'high-apr' : apr > 50 ? 'medium-apr' : ''}">
          ${apr > 0 ? apr.toFixed(2) + '%' : 'N/A'}
        </div>
        <div class="pool-col-price">$${price.toFixed(price < 0.01 ? 6 : 4)}</div>
        <div class="pool-col-actions">
          <button class="pool-action-btn" onclick="window.RaydiumPoolsViewer.openPool('${poolAddress}')" title="View on Raydium">
            📊
          </button>
          <button class="pool-action-btn" onclick="window.RaydiumPoolsViewer.copyAddress('${poolAddress}')" title="Copy pool address">
            📋
          </button>
        </div>
      </div>
    `;
  }

  updateStats() {
    // Calculate total TVL across all pools
    const totalTVL = this.pools.reduce((sum, pool) => sum + parseFloat(pool.liquidity || 0), 0);
    const total24hVolume = this.pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h || 0), 0);
    const avgAPR = this.pools.reduce((sum, pool) => sum + parseFloat(pool.apr || 0), 0) / this.pools.length;
    
    // Update stat cards
    const tvlEl = document.getElementById('raydium-stat-tvl');
    if (tvlEl) {
      tvlEl.textContent = '$' + this.formatNumber(totalTVL);
    }
    
    const volumeEl = document.getElementById('raydium-stat-volume');
    if (volumeEl) {
      volumeEl.textContent = '$' + this.formatNumber(total24hVolume);
    }
    
    const aprEl = document.getElementById('raydium-stat-apr');
    if (aprEl) {
      aprEl.textContent = avgAPR.toFixed(2) + '%';
    }
    
    const poolsEl = document.getElementById('raydium-stat-pools');
    if (poolsEl) {
      poolsEl.textContent = this.pools.length.toLocaleString();
    }
  }

  openPool(poolAddress) {
    if (poolAddress) {
      // Open Raydium pool page
      window.open(`https://raydium.io/liquidity/increase/?pool_id=${poolAddress}`, '_blank');
    }
  }

  copyAddress(address) {
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        this.showSuccess('✅ Pool address copied to clipboard!');
      }).catch(err => {
        console.error('Copy failed:', err);
        this.showError('Failed to copy address');
      });
    }
  }

  updateLastRefresh() {
    const el = document.getElementById('raydium-last-refresh');
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

  shortenAddress(address) {
    if (!address || address.length < 10) return address || 'N/A';
    return address.slice(0, 4) + '...' + address.slice(-4);
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
    toast.className = `raydium-toast ${type}`;
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
let raydiumPoolsViewer;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    raydiumPoolsViewer = new RaydiumPoolsViewer();
    window.RaydiumPoolsViewer = raydiumPoolsViewer;
  });
} else {
  raydiumPoolsViewer = new RaydiumPoolsViewer();
  window.RaydiumPoolsViewer = raydiumPoolsViewer;
}
