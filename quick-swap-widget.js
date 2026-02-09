/**
 * Quick Swap Widget - One-click swap from DEX screener
 * Integrates Jupiter (Solana) and Uniswap (Ethereum)
 */

class QuickSwapWidget {
  constructor() {
    this.isOpen = false;
    this.selectedToken = null;
  }

  open(tokenData) {
    this.selectedToken = tokenData;
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('quick-swap-modal');
    if (modal) modal.remove();
  }

  render() {
    // Remove existing modal
    const existing = document.getElementById('quick-swap-modal');
    if (existing) existing.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'quick-swap-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      border-radius: 16px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      color: white;
    `;

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
        <h2 style="margin:0; color:#a78bfa;">⚡ Quick Swap</h2>
        <button onclick="window.quickSwapWidget.close()" style="background:none; border:none; color:white; font-size:24px; cursor:pointer;">×</button>
      </div>

      <div style="background:#0f172a; border-radius:12px; padding:20px; margin-bottom:20px;">
        <div style="color:#94a3b8; font-size:14px; margin-bottom:10px;">You're buying</div>
        <div style="display:flex; align-items:center; gap:15px;">
          <div style="font-size:32px; font-weight:bold; color:#a78bfa;">${this.selectedToken.name || 'TOKEN'}</div>
          <div style="background:#334155; padding:5px 12px; border-radius:6px; font-size:12px;">
            ${this.selectedToken.chain || 'Solana'}
          </div>
        </div>
        <div style="color:#64748b; font-size:12px; margin-top:5px; font-family:monospace;">
          ${this.selectedToken.address ? this.selectedToken.address.slice(0,10) + '...' + this.selectedToken.address.slice(-8) : '0x...'}
        </div>
        <div style="margin-top:15px; display:flex; justify-content:space-between;">
          <div>
            <div style="color:#94a3b8; font-size:12px;">Price</div>
            <div style="font-size:18px; font-weight:bold;">${this.selectedToken.price || '$0.00'}</div>
          </div>
          <div>
            <div style="color:#94a3b8; font-size:12px;">24h Change</div>
            <div style="font-size:18px; font-weight:bold; color:${parseFloat(this.selectedToken.change) >= 0 ? '#10b981' : '#ef4444'}">
              ${this.selectedToken.change || '0%'}
            </div>
          </div>
        </div>
      </div>

      <div style="background:#0f172a; border-radius:12px; padding:20px; margin-bottom:20px;">
        <label style="color:#94a3b8; font-size:14px; display:block; margin-bottom:10px;">Amount to spend</label>
        <div style="display:flex; gap:10px;">
          <input type="number" id="swap-amount" placeholder="0.00" value="1.0" 
            style="flex:1; padding:12px; background:#334155; border:none; color:white; border-radius:8px; font-size:16px;">
          <select id="swap-currency" style="padding:12px; background:#334155; border:none; color:white; border-radius:8px;">
            <option>SOL</option>
            <option>USDC</option>
            <option>USDT</option>
          </select>
        </div>
        <div style="color:#94a3b8; font-size:12px; margin-top:10px;">
          You'll receive: <span style="color:white; font-weight:bold;">~${this.calculateReceiveAmount()} ${this.selectedToken.symbol || 'TOKEN'}</span>
        </div>
      </div>

      <div style="background:rgba(239,68,68,0.1); border-left:4px solid #ef4444; padding:12px; border-radius:8px; margin-bottom:20px;">
        <div style="font-size:12px; color:#fca5a5;">
          ⚠️ <strong>High Risk:</strong> New token with low liquidity. Only invest what you can afford to lose.
        </div>
      </div>

      <div style="display:flex; gap:10px;">
        <button onclick="window.quickSwapWidget.executeSwap()" 
          style="flex:1; padding:15px; background:linear-gradient(135deg, #10b981 0%, #059669 100%); border:none; color:white; border-radius:10px; font-size:16px; font-weight:bold; cursor:pointer;">
          🚀 Execute Swap
        </button>
        <button onclick="window.quickSwapWidget.close()" 
          style="flex:1; padding:15px; background:#334155; border:none; color:white; border-radius:10px; font-size:16px; font-weight:bold; cursor:pointer;">
          Cancel
        </button>
      </div>

      <div style="text-align:center; margin-top:15px; color:#64748b; font-size:12px;">
        Powered by ${this.selectedToken.chain === 'Ethereum' ? 'Uniswap' : 'Jupiter'}
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });
  }

  calculateReceiveAmount() {
    const amount = parseFloat(document.getElementById('swap-amount')?.value || 1);
    const price = parseFloat(this.selectedToken.price?.replace(/[$,]/g, '') || 0.0001);
    const solPrice = 145; // Mock SOL price
    
    const usdAmount = amount * solPrice;
    const tokens = usdAmount / price;
    
    return tokens.toLocaleString(undefined, {maximumFractionDigits: 2});
  }

  async executeSwap() {
    const amount = document.getElementById('swap-amount')?.value;
    const currency = document.getElementById('swap-currency')?.value;

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Check wallet connection
    if (!window.solana && !window.ethereum) {
      alert('Please connect your wallet first (Phantom for Solana or MetaMask for Ethereum)');
      return;
    }

    try {
      // Mock swap execution
      const confirmed = confirm(
        `Execute swap?\n\n` +
        `You're spending: ${amount} ${currency}\n` +
        `You'll receive: ~${this.calculateReceiveAmount()} ${this.selectedToken.symbol || this.selectedToken.name}\n\n` +
        `This will use ${this.selectedToken.chain === 'Ethereum' ? 'Uniswap' : 'Jupiter'} for best price routing.`
      );

      if (!confirmed) return;

      alert('🚀 Swap initiated!\n\nIn production, this would:\n1. Connect to ' + 
        (this.selectedToken.chain === 'Ethereum' ? 'Uniswap' : 'Jupiter') + 
        '\n2. Get best route and quote\n3. Execute transaction\n4. Show confirmation');
      
      this.close();
    } catch (err) {
      console.error('Swap error:', err);
      alert('Swap failed: ' + err.message);
    }
  }
}

// Initialize global instance
window.quickSwapWidget = new QuickSwapWidget();

// Helper function to add swap button to any token list
function addQuickSwapButton(tokenElement, tokenData) {
  const btn = document.createElement('button');
  btn.textContent = '⚡ Quick Swap';
  btn.style.cssText = `
    padding: 8px 16px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 13px;
  `;
  btn.onclick = (e) => {
    e.stopPropagation();
    window.quickSwapWidget.open(tokenData);
  };
  return btn;
}

console.log('[Quick Swap Widget] Loaded');
