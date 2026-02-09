/**
 * Dashboard Metamask Connect - EVM wallet integration for multi-chain support
 * Supports Ethereum, BSC, Polygon, Arbitrum, Optimism, and other EVM chains
 */

class DashboardMetamaskConnect {
  constructor() {
    this.provider = null;
    this.walletAddress = null;
    this.ethBalance = 0;
    this.tokenBalance = 0;
    this.chainId = null;
    this.chainName = '';
    this.discountEligible = false;
    
    // EVM Token Configuration
    // TODO: Replace with actual PINKY ERC-20 token address once deployed
    // Example format: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    this.TOKEN_ADDRESS = 'PINKY_ERC20_ADDRESS_HERE';
    this.DISCOUNT_THRESHOLD = 10000; // 10K tokens required for 20% discount
    
    // Supported chains
    this.CHAINS = {
      '0x1': 'Ethereum Mainnet',
      '0x38': 'BSC Mainnet',
      '0x89': 'Polygon Mainnet',
      '0xa4b1': 'Arbitrum One',
      '0xa': 'Optimism',
      '0x2105': 'Base'
    };
    
    this.init();
  }

  async init() {
    // Check if user already connected Metamask (localStorage persistence)
    const savedWallet = localStorage.getItem('pinky_metamask_address');
    const savedBalance = localStorage.getItem('pinky_erc20_balance');
    const savedChainId = localStorage.getItem('pinky_metamask_chainid');
    
    if (savedWallet && savedBalance) {
      this.walletAddress = savedWallet;
      this.tokenBalance = parseInt(savedBalance);
      this.chainId = savedChainId;
      this.chainName = this.CHAINS[savedChainId] || 'Unknown Chain';
      this.discountEligible = this.tokenBalance >= this.DISCOUNT_THRESHOLD;
      this.updateUI();
    }

    // Listen for Metamask events
    this.setupMetamaskListeners();
  }

  setupMetamaskListeners() {
    if (typeof window.ethereum !== 'undefined') {
      // Account change listener
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          this.handleAccountChange(accounts[0]);
        } else {
          this.disconnect();
        }
      });

      // Chain change listener
      window.ethereum.on('chainChanged', (chainId) => {
        this.handleChainChange(chainId);
      });
    }
  }

  async handleAccountChange(newAddress) {
    this.walletAddress = newAddress;
    await this.getChainInfo();
    await this.checkEthBalance();
    await this.checkTokenBalance();
    this.updateUI();
  }

  async handleChainChange(newChainId) {
    this.chainId = newChainId;
    this.chainName = this.CHAINS[newChainId] || `Chain ${newChainId}`;
    
    // Re-check balances on new chain
    await this.checkEthBalance();
    await this.checkTokenBalance();
    
    this.updateUI();
    this.showSuccess(`Switched to ${this.chainName}`);
  }

  detectMetamask() {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      return window.ethereum;
    }
    return null;
  }

  async connect() {
    try {
      this.provider = this.detectMetamask();
      
      if (!this.provider) {
        this.showError('Metamask not detected. Please install Metamask extension.');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      // Request account access
      const accounts = await this.provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      this.walletAddress = accounts[0];

      // Get chain info
      await this.getChainInfo();

      // Check ETH and token balances
      await this.checkEthBalance();
      await this.checkTokenBalance();

      // Save to localStorage
      localStorage.setItem('pinky_metamask_address', this.walletAddress);
      localStorage.setItem('pinky_erc20_balance', this.tokenBalance.toString());
      localStorage.setItem('pinky_eth_balance', this.ethBalance.toString());
      localStorage.setItem('pinky_metamask_chainid', this.chainId);

      // Update UI
      this.updateUI();

      // Notify feature-gating system
      if (this.discountEligible && window.FeatureGating) {
        window.FeatureGating.applyTokenDiscount();
      }

      this.showSuccess(`Connected to Metamask on ${this.chainName}! ${this.discountEligible ? '✅ 20% discount activated!' : ''}`);
    } catch (error) {
      console.error('Metamask connection error:', error);
      
      if (error.code === 4001) {
        // User rejected request
        this.showError('Connection rejected by user');
      } else {
        this.showError('Failed to connect Metamask: ' + error.message);
      }
    }
  }

  async getChainInfo() {
    try {
      this.chainId = await this.provider.request({ method: 'eth_chainId' });
      this.chainName = this.CHAINS[this.chainId] || `Chain ${this.chainId}`;
      
      console.log(`🔗 Connected to: ${this.chainName} (${this.chainId})`);
    } catch (error) {
      console.error('Chain info error:', error);
      this.chainId = '0x1';
      this.chainName = 'Unknown Chain';
    }
  }

  async checkEthBalance() {
    try {
      const balanceHex = await this.provider.request({
        method: 'eth_getBalance',
        params: [this.walletAddress, 'latest']
      });
      
      // Convert hex to decimal and then to ETH (divide by 10^18)
      const balanceWei = parseInt(balanceHex, 16);
      this.ethBalance = balanceWei / 1e18;
      
      console.log(`💰 ETH balance: ${this.ethBalance.toFixed(4)} ETH`);
      
      // Save to localStorage
      localStorage.setItem('pinky_eth_balance', this.ethBalance.toString());

    } catch (error) {
      console.error('ETH balance check error:', error);
      this.ethBalance = 0;
    }
  }

  async checkTokenBalance() {
    try {
      // Check if TOKEN_ADDRESS is configured (not placeholder)
      if (this.TOKEN_ADDRESS === 'PINKY_ERC20_ADDRESS_HERE' || !this.TOKEN_ADDRESS) {
        console.warn('PINKY ERC-20 token address not configured. Set TOKEN_ADDRESS in dashboard-metamask-connect.js');
        this.tokenBalance = 0;
        this.discountEligible = false;
        return;
      }

      // ERC-20 balanceOf function signature
      // function balanceOf(address) returns (uint256)
      const balanceOfSignature = '0x70a08231';
      const paddedAddress = this.walletAddress.slice(2).padStart(64, '0');
      const data = balanceOfSignature + paddedAddress;

      // Call ERC-20 balanceOf
      const balanceHex = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: this.TOKEN_ADDRESS,
          data: data
        }, 'latest']
      });

      // Convert hex to decimal (assuming 18 decimals)
      const balanceWei = parseInt(balanceHex, 16);
      this.tokenBalance = Math.floor(balanceWei / 1e18);
      this.discountEligible = this.tokenBalance >= this.DISCOUNT_THRESHOLD;
      
      console.log(`✅ ERC-20 Token balance: ${this.tokenBalance.toLocaleString()} PINKY (discount: ${this.discountEligible ? 'YES' : 'NO'})`);

      // Save updated balance to localStorage
      localStorage.setItem('pinky_erc20_balance', this.tokenBalance.toString());

    } catch (error) {
      console.error('Token balance check error:', error);
      this.tokenBalance = 0;
      this.discountEligible = false;
    }
  }

  async switchChain(chainId) {
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }]
      });
    } catch (error) {
      // Chain not added to Metamask, try to add it
      if (error.code === 4902) {
        this.showError(`Chain ${chainId} not added to Metamask. Please add it manually.`);
      } else {
        console.error('Switch chain error:', error);
        this.showError('Failed to switch chain: ' + error.message);
      }
    }
  }

  disconnect() {
    // Note: Metamask doesn't have a programmatic disconnect
    // We just clear local state
    this.provider = null;
    this.walletAddress = null;
    this.tokenBalance = 0;
    this.ethBalance = 0;
    this.chainId = null;
    this.chainName = '';
    this.discountEligible = false;

    // Clear localStorage
    localStorage.removeItem('pinky_metamask_address');
    localStorage.removeItem('pinky_erc20_balance');
    localStorage.removeItem('pinky_eth_balance');
    localStorage.removeItem('pinky_metamask_chainid');

    // Update UI
    this.updateUI();

    // Notify feature-gating system
    if (window.FeatureGating) {
      window.FeatureGating.removeTokenDiscount();
    }

    this.showSuccess('Metamask disconnected');
  }

  updateUI() {
    const connectBtn = document.getElementById('metamask-connect-btn');
    const disconnectBtn = document.getElementById('metamask-disconnect-btn');
    const walletStatus = document.getElementById('metamask-status');
    const chainInfo = document.getElementById('metamask-chain-info');
    const ethBalanceEl = document.getElementById('metamask-eth-balance');
    const tokenBalanceEl = document.getElementById('metamask-token-balance');
    const discountBadge = document.getElementById('metamask-discount-badge');

    if (this.walletAddress) {
      // Connected state
      if (connectBtn) connectBtn.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
      
      if (walletStatus) {
        const shortAddress = this.walletAddress.slice(0, 6) + '...' + this.walletAddress.slice(-4);
        walletStatus.textContent = `🟢 Connected: ${shortAddress}`;
        walletStatus.style.color = '#00d4ff';
      }

      if (chainInfo) {
        chainInfo.textContent = `Chain: ${this.chainName}`;
        chainInfo.style.display = 'block';
      }

      if (ethBalanceEl) {
        ethBalanceEl.textContent = `${this.ethBalance.toFixed(4)} ETH`;
        ethBalanceEl.style.display = 'block';
      }

      if (tokenBalanceEl) {
        tokenBalanceEl.textContent = `${this.tokenBalance.toLocaleString()} PINKY`;
        tokenBalanceEl.style.display = 'block';
      }

      if (discountBadge) {
        if (this.discountEligible) {
          discountBadge.innerHTML = '✅ 20% Discount Active';
          discountBadge.style.display = 'inline-block';
          discountBadge.className = 'discount-badge active';
        } else {
          const needed = this.DISCOUNT_THRESHOLD - this.tokenBalance;
          discountBadge.innerHTML = `⚠️ ${needed.toLocaleString()} more PINKY needed for 20% discount`;
          discountBadge.style.display = 'inline-block';
          discountBadge.className = 'discount-badge inactive';
        }
      }
    } else {
      // Disconnected state
      if (connectBtn) connectBtn.style.display = 'inline-block';
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      
      if (walletStatus) {
        walletStatus.textContent = '🔴 Not connected';
        walletStatus.style.color = '#999';
      }

      if (chainInfo) chainInfo.style.display = 'none';
      if (ethBalanceEl) ethBalanceEl.style.display = 'none';
      if (tokenBalanceEl) tokenBalanceEl.style.display = 'none';
      if (discountBadge) discountBadge.style.display = 'none';
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `wallet-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 8px;
      background: ${type === 'success' ? '#00d4ff' : '#ff4444'};
      color: #000;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Public API for other components
  isConnected() {
    return !!this.walletAddress;
  }

  getBalance() {
    return this.tokenBalance;
  }

  isDiscountEligible() {
    return this.discountEligible;
  }

  getDiscountPercentage() {
    return this.discountEligible ? 20 : 0;
  }

  getChainId() {
    return this.chainId;
  }

  getChainName() {
    return this.chainName;
  }

  async refreshBalance() {
    if (this.walletAddress) {
      await this.checkEthBalance();
      await this.checkTokenBalance();
      this.updateUI();
      this.showSuccess('Balances refreshed');
    }
  }
}

// Initialize on page load
let metamaskConnect;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    metamaskConnect = new DashboardMetamaskConnect();
    window.DashboardMetamaskConnect = metamaskConnect; // Expose globally
  });
} else {
  metamaskConnect = new DashboardMetamaskConnect();
  window.DashboardMetamaskConnect = metamaskConnect;
}

// Expose class for manual instantiation
window.DashboardMetamaskConnectClass = DashboardMetamaskConnect;
