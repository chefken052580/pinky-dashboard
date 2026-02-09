/**
 * CryptoBot Controller - Manages crypto dashboard view and wallet integrations
 */

class CryptoBot {
  constructor() {
    this.activeTab = 'wallets';
    this.init();
  }

  async init() {
    console.log('🪙 CryptoBot initializing...');
    
    // Load wallet widgets
    this.loadWalletWidgets();
    
    // Start stats refresh loop
    setInterval(() => this.updateStats(), 5000);
    
    // Initial stats update
    setTimeout(() => this.updateStats(), 1000);
  }

  async loadWalletWidgets() {
    try {
      // Load Phantom widget
      const phantomResponse = await fetch('wallet-connect-widget.html');
      const phantomHTML = await phantomResponse.text();
      const phantomContainer = document.getElementById('phantom-widget-container');
      if (phantomContainer) {
        phantomContainer.innerHTML = phantomHTML;
      }

      // Load Metamask widget
      const metamaskResponse = await fetch('metamask-widget.html');
      const metamaskHTML = await metamaskResponse.text();
      const metamaskContainer = document.getElementById('metamask-widget-container');
      if (metamaskContainer) {
        metamaskContainer.innerHTML = metamaskHTML;
      }

      console.log('✅ Wallet widgets loaded');
    } catch (error) {
      console.error('Failed to load wallet widgets:', error);
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.crypto-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-crypto-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.crypto-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    document.getElementById(`crypto-${tabName}-tab`).style.display = 'block';

    this.activeTab = tabName;
  }

  updateStats() {
    const phantomWallet = window.DashboardWalletConnect;
    const metamaskWallet = window.DashboardMetamaskConnect;
    
    let connectedCount = 0;
    let totalBalance = 0;
    let chains = [];
    let discountEligible = false;

    // Check Phantom
    if (phantomWallet && phantomWallet.isConnected()) {
      connectedCount++;
      totalBalance += phantomWallet.getBalance() || 0;
      chains.push('Solana');
      
      // Update connection status
      const phantomStatus = document.getElementById('phantom-connection-status');
      if (phantomStatus) {
        const shortAddr = phantomWallet.walletAddress.slice(0, 4) + '...' + phantomWallet.walletAddress.slice(-4);
        phantomStatus.innerHTML = `🟢 Connected: ${shortAddr}`;
        phantomStatus.style.color = '#00d4ff';
      }
    } else {
      const phantomStatus = document.getElementById('phantom-connection-status');
      if (phantomStatus) {
        phantomStatus.innerHTML = '🔴 Not connected';
        phantomStatus.style.color = '#999';
      }
    }

    // Check Metamask
    if (metamaskWallet && metamaskWallet.isConnected()) {
      connectedCount++;
      totalBalance += metamaskWallet.getBalance() || 0;
      const chainName = metamaskWallet.getChainName() || 'Ethereum';
      if (!chains.includes(chainName)) {
        chains.push(chainName);
      }
      
      // Update connection status
      const metamaskStatus = document.getElementById('metamask-connection-status');
      if (metamaskStatus) {
        const shortAddr = metamaskWallet.walletAddress.slice(0, 4) + '...' + metamaskWallet.walletAddress.slice(-4);
        metamaskStatus.innerHTML = `🟢 Connected: ${shortAddr}`;
        metamaskStatus.style.color = '#00d4ff';
      }
    } else {
      const metamaskStatus = document.getElementById('metamask-connection-status');
      if (metamaskStatus) {
        metamaskStatus.innerHTML = '🔴 Not connected';
        metamaskStatus.style.color = '#999';
      }
    }

    // Check discount eligibility
    discountEligible = totalBalance >= 10000;

    // Update stat cards
    const walletsStat = document.getElementById('crypto-stat-wallets');
    if (walletsStat) {
      walletsStat.textContent = `${connectedCount} / 2`;
    }

    const balanceStat = document.getElementById('crypto-stat-balance');
    if (balanceStat) {
      balanceStat.textContent = totalBalance.toLocaleString();
    }

    const discountStat = document.getElementById('crypto-stat-discount');
    if (discountStat) {
      if (discountEligible) {
        discountStat.textContent = '✅ Active';
        discountStat.style.color = '#00ff88';
      } else {
        discountStat.textContent = '❌ Inactive';
        discountStat.style.color = '#ff4444';
      }
    }

    const chainsStat = document.getElementById('crypto-stat-chains');
    if (chainsStat) {
      chainsStat.textContent = chains.length > 0 ? chains.join(' • ') : 'None';
    }
  }

  async refreshAll() {
    console.log('🔄 Refreshing all wallet balances...');
    
    const promises = [];
    
    if (window.DashboardWalletConnect && window.DashboardWalletConnect.isConnected()) {
      promises.push(window.DashboardWalletConnect.refreshBalance());
    }
    
    if (window.DashboardMetamaskConnect && window.DashboardMetamaskConnect.isConnected()) {
      promises.push(window.DashboardMetamaskConnect.refreshBalance());
    }
    
    await Promise.all(promises);
    
    this.updateStats();
    
    // Show success toast
    this.showToast('✅ All balances refreshed', 'success');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `crypto-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 15px 25px;
      background: ${type === 'success' ? '#00ff88' : '#00d4ff'};
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
}

// Initialize CryptoBot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CryptoBot = new CryptoBot();
  });
} else {
  window.CryptoBot = new CryptoBot();
}
