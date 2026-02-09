/**
 * Unified Wallet Manager - Consolidates Phantom (Solana) + Metamask (EVM) wallets
 * Provides single dashboard for multi-chain portfolio management
 */

class UnifiedWalletManager {
  constructor() {
    this.phantomWallet = null;
    this.metamaskWallet = null;
    this.totalTokenBalance = 0;
    this.discountEligible = false;
    this.activeWallets = [];
    
    this.init();
  }

  async init() {
    // Wait for wallet connectors to load
    this.waitForWalletConnectors();
    
    // Set up periodic refresh (every 30 seconds)
    setInterval(() => this.refreshAllBalances(), 30000);
  }

  waitForWalletConnectors() {
    // Check if wallet connectors are loaded
    const checkInterval = setInterval(() => {
      if (window.DashboardWalletConnect && window.DashboardMetamaskConnect) {
        clearInterval(checkInterval);
        this.phantomWallet = window.DashboardWalletConnect;
        this.metamaskWallet = window.DashboardMetamaskConnect;
        
        // Initial update
        this.updateUnifiedUI();
        
        // Set up event listeners
        this.setupEventListeners();
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
  }

  setupEventListeners() {
    // Listen for wallet connection/disconnection events
    // We'll poll for changes every 5 seconds as a fallback
    setInterval(() => {
      this.updateUnifiedUI();
    }, 5000);
  }

  updateUnifiedUI() {
    // Calculate active wallets
    this.activeWallets = [];
    this.totalTokenBalance = 0;
    
    if (this.phantomWallet && this.phantomWallet.isConnected()) {
      this.activeWallets.push({
        name: 'Phantom (Solana)',
        address: this.phantomWallet.walletAddress,
        balance: this.phantomWallet.tokenBalance || 0,
        nativeBalance: this.phantomWallet.solBalance || 0,
        nativeCurrency: 'SOL',
        chain: 'Solana',
        icon: '👻'
      });
      this.totalTokenBalance += (this.phantomWallet.tokenBalance || 0);
    }
    
    if (this.metamaskWallet && this.metamaskWallet.isConnected()) {
      this.activeWallets.push({
        name: 'Metamask (EVM)',
        address: this.metamaskWallet.walletAddress,
        balance: this.metamaskWallet.tokenBalance || 0,
        nativeBalance: this.metamaskWallet.ethBalance || 0,
        nativeCurrency: 'ETH',
        chain: this.metamaskWallet.chainName || 'Ethereum',
        icon: '🦊'
      });
      this.totalTokenBalance += (this.metamaskWallet.tokenBalance || 0);
    }
    
    // Check discount eligibility (10K tokens across ALL wallets)
    this.discountEligible = this.totalTokenBalance >= 10000;
    
    // Update UI components
    this.renderPortfolioSummary();
    this.renderWalletCards();
    this.renderDiscountStatus();
  }

  renderPortfolioSummary() {
    const summaryEl = document.getElementById('portfolio-summary');
    if (!summaryEl) return;
    
    const connectedCount = this.activeWallets.length;
    const totalWallets = 2; // Phantom + Metamask
    
    summaryEl.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div class="portfolio-stat">
          <div class="stat-label">Connected Wallets</div>
          <div class="stat-value">${connectedCount} / ${totalWallets}</div>
        </div>
        
        <div class="portfolio-stat">
          <div class="stat-label">Total PINKY Balance</div>
          <div class="stat-value">${this.totalTokenBalance.toLocaleString()}</div>
        </div>
        
        <div class="portfolio-stat">
          <div class="stat-label">Chains</div>
          <div class="stat-value">${this.getUniqueChains().join(', ') || 'None'}</div>
        </div>
        
        <div class="portfolio-stat">
          <div class="stat-label">Discount Status</div>
          <div class="stat-value ${this.discountEligible ? 'eligible' : 'not-eligible'}">
            ${this.discountEligible ? '✅ Active' : '❌ Inactive'}
          </div>
        </div>
      </div>
    `;
  }

  renderWalletCards() {
    const cardsContainer = document.getElementById('wallet-cards-container');
    if (!cardsContainer) return;
    
    if (this.activeWallets.length === 0) {
      cardsContainer.innerHTML = `
        <div class="no-wallets-message">
          <p style="text-align: center; color: #999; padding: 40px;">
            No wallets connected. Connect Phantom or Metamask below to get started.
          </p>
        </div>
      `;
      return;
    }
    
    cardsContainer.innerHTML = this.activeWallets.map(wallet => `
      <div class="unified-wallet-card">
        <div class="wallet-card-header">
          <span class="wallet-icon">${wallet.icon}</span>
          <span class="wallet-name">${wallet.name}</span>
        </div>
        
        <div class="wallet-card-body">
          <div class="wallet-address">
            ${this.formatAddress(wallet.address)}
          </div>
          
          <div class="wallet-chain-badge">
            ${wallet.chain}
          </div>
          
          <div class="wallet-balances">
            <div class="balance-row">
              <span class="balance-label">PINKY:</span>
              <span class="balance-value">${wallet.balance.toLocaleString()}</span>
            </div>
            <div class="balance-row">
              <span class="balance-label">${wallet.nativeCurrency}:</span>
              <span class="balance-value">${wallet.nativeBalance.toFixed(4)}</span>
            </div>
          </div>
          
          <div class="wallet-progress">
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${Math.min((wallet.balance / 10000) * 100, 100)}%"></div>
            </div>
            <div class="progress-text">
              ${wallet.balance >= 10000 ? '✅ Discount eligible' : `${(10000 - wallet.balance).toLocaleString()} more needed`}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderDiscountStatus() {
    const discountEl = document.getElementById('unified-discount-status');
    if (!discountEl) return;
    
    if (this.discountEligible) {
      discountEl.innerHTML = `
        <div class="discount-active-banner">
          <div class="banner-icon">✅</div>
          <div class="banner-content">
            <div class="banner-title">20% Discount Active!</div>
            <div class="banner-description">
              You have ${this.totalTokenBalance.toLocaleString()} PINKY tokens across your wallets.
              Your discount is automatically applied to Pro subscriptions.
            </div>
          </div>
        </div>
      `;
    } else {
      const needed = 10000 - this.totalTokenBalance;
      discountEl.innerHTML = `
        <div class="discount-inactive-banner">
          <div class="banner-icon">⚠️</div>
          <div class="banner-content">
            <div class="banner-title">Discount Not Active</div>
            <div class="banner-description">
              You need ${needed.toLocaleString()} more PINKY tokens to unlock 20% discount.
              Current balance: ${this.totalTokenBalance.toLocaleString()} / 10,000
            </div>
            <a href="https://raydium.io" target="_blank" class="buy-tokens-btn">
              Buy PINKY Tokens
            </a>
          </div>
        </div>
      `;
    }
  }

  formatAddress(address) {
    if (!address) return 'Unknown';
    return address.slice(0, 6) + '...' + address.slice(-4);
  }

  getUniqueChains() {
    const chains = new Set();
    this.activeWallets.forEach(wallet => {
      if (wallet.chain) chains.add(wallet.chain);
    });
    return Array.from(chains);
  }

  async refreshAllBalances() {
    console.log('🔄 Refreshing all wallet balances...');
    
    const promises = [];
    
    if (this.phantomWallet && this.phantomWallet.isConnected()) {
      promises.push(this.phantomWallet.refreshBalance());
    }
    
    if (this.metamaskWallet && this.metamaskWallet.isConnected()) {
      promises.push(this.metamaskWallet.refreshBalance());
    }
    
    await Promise.all(promises);
    
    this.updateUnifiedUI();
  }

  // Public API
  getTotalBalance() {
    return this.totalTokenBalance;
  }

  isDiscountEligible() {
    return this.discountEligible;
  }

  getActiveWallets() {
    return this.activeWallets;
  }

  getConnectedCount() {
    return this.activeWallets.length;
  }
}

// Initialize on page load
let unifiedWalletManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    unifiedWalletManager = new UnifiedWalletManager();
    window.UnifiedWalletManager = unifiedWalletManager;
  });
} else {
  unifiedWalletManager = new UnifiedWalletManager();
  window.UnifiedWalletManager = unifiedWalletManager;
}

// Expose class
window.UnifiedWalletManagerClass = UnifiedWalletManager;
