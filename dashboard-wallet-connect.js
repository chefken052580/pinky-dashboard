/**
 * Dashboard Wallet Connect - Solana wallet integration for PINKY token verification
 * Integrates with feature-gating.js and tier-management.js
 */

class DashboardWalletConnect {
  constructor() {
    this.wallet = null;
    this.walletAddress = null;
    this.tokenBalance = 0;
    this.discountEligible = false;
    this.TOKEN_MINT = 'PINKY_TOKEN_MINT_ADDRESS_HERE'; // TODO: Replace with actual $PINKY mint address
    this.DISCOUNT_THRESHOLD = 10000; // 10K tokens required for 20% discount
    
    this.init();
  }

  async init() {
    // Check if user already connected wallet (localStorage persistence)
    const savedWallet = localStorage.getItem('pinky_wallet_address');
    const savedBalance = localStorage.getItem('pinky_token_balance');
    
    if (savedWallet && savedBalance) {
      this.walletAddress = savedWallet;
      this.tokenBalance = parseInt(savedBalance);
      this.discountEligible = this.tokenBalance >= this.DISCOUNT_THRESHOLD;
      this.updateUI();
    }

    // Listen for wallet changes (user switches wallet)
    this.setupWalletListeners();
  }

  setupWalletListeners() {
    // Phantom wallet change listener
    if (window.solana) {
      window.solana.on('accountChanged', (publicKey) => {
        if (publicKey) {
          this.handleWalletChange(publicKey.toString());
        } else {
          this.disconnect();
        }
      });
    }

    // Solflare wallet change listener
    if (window.solflare) {
      window.solflare.on('accountChanged', (publicKey) => {
        if (publicKey) {
          this.handleWalletChange(publicKey.toString());
        } else {
          this.disconnect();
        }
      });
    }
  }

  async handleWalletChange(newAddress) {
    this.walletAddress = newAddress;
    await this.checkTokenBalance();
    this.updateUI();
  }

  async detectWallet() {
    // Check for Phantom
    if (window.solana && window.solana.isPhantom) {
      return { name: 'Phantom', provider: window.solana };
    }

    // Check for Solflare
    if (window.solflare && window.solflare.isSolflare) {
      return { name: 'Solflare', provider: window.solflare };
    }

    return null;
  }

  async connect() {
    try {
      const wallet = await this.detectWallet();
      
      if (!wallet) {
        this.showError('No Solana wallet detected. Please install Phantom or Solflare.');
        return;
      }

      this.wallet = wallet.provider;
      
      // Connect to wallet
      const response = await this.wallet.connect();
      this.walletAddress = response.publicKey.toString();

      // Check token balance
      await this.checkTokenBalance();

      // Save to localStorage
      localStorage.setItem('pinky_wallet_address', this.walletAddress);
      localStorage.setItem('pinky_token_balance', this.tokenBalance.toString());
      localStorage.setItem('pinky_wallet_name', wallet.name);

      // Update UI
      this.updateUI();

      // Notify feature-gating system
      if (this.discountEligible && window.FeatureGating) {
        window.FeatureGating.applyTokenDiscount();
      }

      this.showSuccess(`Connected to ${wallet.name}! ${this.discountEligible ? '✅ 20% discount activated!' : ''}`);
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.showError('Failed to connect wallet: ' + error.message);
    }
  }

  async checkTokenBalance() {
    try {
      // TODO: Replace with actual Solana RPC call to check token balance
      // For now, using mock data for testing
      
      // Mock implementation (replace with real RPC query)
      const mockBalance = this.getMockBalance();
      this.tokenBalance = mockBalance;
      this.discountEligible = this.tokenBalance >= this.DISCOUNT_THRESHOLD;

      // Real implementation would look like:
      /*
      const connection = new window.solanaWeb3.Connection(
        window.solanaWeb3.clusterApiUrl('mainnet-beta')
      );
      
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new window.solanaWeb3.PublicKey(this.walletAddress),
        { mint: new window.solanaWeb3.PublicKey(this.TOKEN_MINT) }
      );

      if (tokenAccounts.value.length > 0) {
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        this.tokenBalance = Math.floor(balance);
        this.discountEligible = this.tokenBalance >= this.DISCOUNT_THRESHOLD;
      } else {
        this.tokenBalance = 0;
        this.discountEligible = false;
      }
      */

    } catch (error) {
      console.error('Token balance check error:', error);
      this.tokenBalance = 0;
      this.discountEligible = false;
    }
  }

  getMockBalance() {
    // Mock balance for testing (remove when real RPC is integrated)
    const hash = this.walletAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 2 === 0 ? 15000 : 5000; // Alternate between eligible and ineligible
  }

  disconnect() {
    if (this.wallet && this.wallet.disconnect) {
      this.wallet.disconnect();
    }

    this.wallet = null;
    this.walletAddress = null;
    this.tokenBalance = 0;
    this.discountEligible = false;

    // Clear localStorage
    localStorage.removeItem('pinky_wallet_address');
    localStorage.removeItem('pinky_token_balance');
    localStorage.removeItem('pinky_wallet_name');

    // Update UI
    this.updateUI();

    // Notify feature-gating system
    if (window.FeatureGating) {
      window.FeatureGating.removeTokenDiscount();
    }

    this.showSuccess('Wallet disconnected');
  }

  updateUI() {
    const connectBtn = document.getElementById('wallet-connect-btn');
    const disconnectBtn = document.getElementById('wallet-disconnect-btn');
    const walletStatus = document.getElementById('wallet-status');
    const tokenBalanceEl = document.getElementById('token-balance');
    const discountBadge = document.getElementById('discount-badge');

    if (this.walletAddress) {
      // Connected state
      if (connectBtn) connectBtn.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
      
      if (walletStatus) {
        const shortAddress = this.walletAddress.slice(0, 4) + '...' + this.walletAddress.slice(-4);
        walletStatus.textContent = `🟢 Connected: ${shortAddress}`;
        walletStatus.style.color = '#00d4ff';
      }

      if (tokenBalanceEl) {
        tokenBalanceEl.textContent = `${this.tokenBalance.toLocaleString()} $PINKY`;
        tokenBalanceEl.style.display = 'block';
      }

      if (discountBadge) {
        if (this.discountEligible) {
          discountBadge.innerHTML = '✅ 20% Discount Active';
          discountBadge.style.display = 'inline-block';
          discountBadge.className = 'discount-badge active';
        } else {
          const needed = this.DISCOUNT_THRESHOLD - this.tokenBalance;
          discountBadge.innerHTML = `⚠️ ${needed.toLocaleString()} more $PINKY needed for 20% discount`;
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

      if (tokenBalanceEl) {
        tokenBalanceEl.style.display = 'none';
      }

      if (discountBadge) {
        discountBadge.style.display = 'none';
      }
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
    document.body.appendChild(toast);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.classList.add('fade-out');
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

  async refreshBalance() {
    if (this.walletAddress) {
      await this.checkTokenBalance();
      this.updateUI();
    }
  }
}

// Initialize on page load
let walletConnect;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    walletConnect = new DashboardWalletConnect();
    window.DashboardWalletConnect = walletConnect; // Expose globally
  });
} else {
  walletConnect = new DashboardWalletConnect();
  window.DashboardWalletConnect = walletConnect;
}

// Expose class for manual instantiation
window.DashboardWalletConnectClass = DashboardWalletConnect;
