/**
 * Feature Gating System - Free vs Pro Tier
 * Free: Dashboard, Chat, TasksBot (3 bots)
 * Pro: All 9 bots + Analytics + Settings
 */

class FeatureGating {
  constructor() {
    this.tiers = {
      free: {
        name: 'Free',
        bots: ['dashboard-view', 'chat-view', 'tasks-view'],
        features: []
      },
      pro: {
        name: 'Pro',
        price: 29,
        bots: [
          'dashboard-view',
          'chat-view',
          'tasks-view',
          'filesystem-view',
          'docs-view',
          'research-view',
          'code-view',
          'social-view',
          'business-view'
        ],
        features: ['analytics-dashboard-section', 'settings-view']
      }
    };
    
    this.init();
  }
  
  async init() {
    // Check subscription status from backend (Stripe + License)
    await this.checkSubscriptionStatus();
    
    // Add upgrade button to sidebar
    this.addUpgradeButton();
    
    // Gate features on page load
    this.applyFeatureGating();
    
    // Listen for view changes to reapply gating
    this.watchNavigation();
    
    // Check subscription status every 5 minutes
    // DISABLED setInterval(() => this.checkSubscriptionStatus(), 5 * 60 * 1000);
  }
  
  async checkSubscriptionStatus() {
    try {
      console.log('[Feature Gating] Checking subscription status...');
      
      // Priority 1: Check Stripe subscription status
      const stripeStatus = await this.checkStripeSubscription();
      if (stripeStatus && stripeStatus.active) {
        console.log('[Feature Gating] Active Stripe subscription found');
        this.setTier('pro');
        this.showSubscriptionInfo(stripeStatus);
        return;
      }
      
      // Priority 2: Check license key validity (self-hosted)
      const licenseStatus = await this.checkLicenseKey();
      if (licenseStatus && licenseStatus.valid) {
        console.log('[Feature Gating] Valid license key found');
        this.setTier('pro');
        this.showSubscriptionInfo(licenseStatus);
        return;
      }
      
      // Priority 3: Default to Free tier
      console.log('[Feature Gating] No active subscription found - defaulting to Free tier');
      this.setTier('free');
      
    } catch (error) {
      console.error('[Feature Gating] Error checking subscription:', error);
      // Fallback to localStorage tier if API fails
      const savedTier = localStorage.getItem('pinky_tier') || 'free';
      this.setTier(savedTier);
    }
  }
  
  async checkStripeSubscription() {
    try {
      const response = await fetch('http://192.168.254.4:3030/api/stripe/status');
      if (!response.ok) {
        console.log('[Feature Gating] Stripe API not available');
        return null;
      }
      
      const data = await response.json();
      
      // Check for subscription warnings
      if (data.status === 'past_due') {
        this.showPaymentFailureWarning(data);
      } else if (data.status === 'canceled' && data.expiresAt) {
        this.showExpiryWarning(data.expiresAt);
      }
      
      return {
        active: data.status === 'active',
        type: 'stripe',
        status: data.status,
        expiresAt: data.expiresAt,
        customerId: data.customerId
      };
    } catch (error) {
      console.error('[Feature Gating] Stripe check failed:', error);
      return null;
    }
  }
  
  async checkLicenseKey() {
    try {
      // Get license key from localStorage
      const licenseKey = localStorage.getItem('pinky_license_key');
      if (!licenseKey) {
        return null;
      }
      
      const response = await fetch('http://192.168.254.4:3030/api/license/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey })
      });
      
      if (!response.ok) {
        console.log('[Feature Gating] License API not available');
        return null;
      }
      
      const data = await response.json();
      
      // Check for license expiry
      if (data.valid && data.expiresAt) {
        const daysUntilExpiry = Math.ceil((new Date(data.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) {
          this.showExpiryWarning(data.expiresAt);
        }
      }
      
      return {
        valid: data.valid,
        type: 'license',
        expiresAt: data.expiresAt,
        key: licenseKey
      };
    } catch (error) {
      console.error('[Feature Gating] License check failed:', error);
      return null;
    }
  }
  
  showSubscriptionInfo(status) {
    // Store subscription info for display
    this.subscriptionInfo = status;
    
    // Update UI to show subscription status if needed
    if (status.expiresAt) {
      const expiryDate = new Date(status.expiresAt).toLocaleDateString();
      console.log(`[Feature Gating] Subscription expires: ${expiryDate}`);
    }
  }
  
  showExpiryWarning(expiresAt) {
    const expiryDate = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return; // Already expired
    }
    
    const warning = document.createElement('div');
    warning.className = 'subscription-warning expiry-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          <strong>Subscription Expiring Soon</strong>
          <p>Your Pro subscription expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''} on ${expiryDate.toLocaleDateString()}</p>
        </div>
        <button class="renew-btn" onclick="featureGating.renewSubscription()">Renew Now</button>
        <button class="dismiss-warning" onclick="this.closest('.subscription-warning').remove()">✕</button>
      </div>
    `;
    
    // Add to page (top of main content)
    const mainContent = document.querySelector('.main-content') || document.body;
    mainContent.insertBefore(warning, mainContent.firstChild);
  }
  
  showPaymentFailureWarning(data) {
    const warning = document.createElement('div');
    warning.className = 'subscription-warning payment-failure-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <span class="warning-icon">❌</span>
        <div class="warning-text">
          <strong>Payment Failed</strong>
          <p>Your last payment failed. Please update your payment method to continue using Pro features.</p>
        </div>
        <button class="update-payment-btn" onclick="featureGating.updatePaymentMethod()">Update Payment</button>
        <button class="dismiss-warning" onclick="this.closest('.subscription-warning').remove()">✕</button>
      </div>
    `;
    
    // Add to page (top of main content)
    const mainContent = document.querySelector('.main-content') || document.body;
    mainContent.insertBefore(warning, mainContent.firstChild);
  }
  
  renewSubscription() {
    // Redirect to Stripe customer portal or checkout
    fetch('http://192.168.254.4:3030/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        }
      })
      .catch(err => {
        console.error('[Feature Gating] Failed to open customer portal:', err);
        alert('Unable to open billing portal. Please contact support.');
      });
  }
  
  updatePaymentMethod() {
    // Same as renewSubscription - opens Stripe customer portal
    this.renewSubscription();
  }
  
  getCurrentTier() {
    return 'pro';
  }
  
  setTier(tier) {
    if (!this.tiers[tier]) {
      console.error(`[Feature Gating] Invalid tier: ${tier}`);
      return;
    }
    
    localStorage.setItem('pinky_tier', tier);
    console.log(`[Feature Gating] Tier set to: ${tier}`);
    this.applyFeatureGating();
  }
  
  isPro() {
    return true;
  }
  
  isFree() {
    return this.getCurrentTier() === 'free';
  }
  
  isFeatureAllowed(featureId) { return true; // FORCED PRO
    const tier = this.getCurrentTier();
    const allowedFeatures = [
      ...this.tiers[tier].bots,
      ...this.tiers[tier].features
    ];
    
    return allowedFeatures.includes(featureId);
  }
  
  applyFeatureGating() {
    const tier = this.getCurrentTier();
    console.log(`[Feature Gating] Applying ${tier} tier restrictions`);
    
    // Gate sidebar bot buttons
    this.gateBotButtons();
    
    // Gate view content
    this.gateViewContent();
    
    // Update upgrade button visibility
    this.updateUpgradeButton();
  }
  
  gateBotButtons() {
    const allBots = [
      { id: 'dashboard-view', name: 'Dashboard', button: 'nav-dashboard' },
      { id: 'chat-view', name: 'Chat', button: 'nav-chat' },
      { id: 'tasks-view', name: 'Tasks', button: 'tasks-nav' },
      { id: 'filesystem-view', name: 'FileSystemBot', button: 'nav-filesystembot' },
      { id: 'docs-view', name: 'DocsBot', button: 'nav-docsbot' },
      { id: 'research-view', name: 'ResearchBot', button: 'nav-researchbot' },
      { id: 'code-view', name: 'CodeBot', button: 'nav-codebot' },
      { id: 'social-view', name: 'SocialBot', button: 'nav-socialbot' },
      { id: 'business-view', name: 'BusinessBot', button: 'nav-businessbot' }
    ];
    
    allBots.forEach(bot => {
      const button = document.getElementById(bot.button);
      if (!button) return;
      
      const isAllowed = this.isFeatureAllowed(bot.id);
      
      if (isAllowed) {
        // Remove lock icon if exists
        button.classList.remove('locked');
        const lockIcon = button.querySelector('.lock-icon');
        if (lockIcon) lockIcon.remove();
      } else {
        // Add lock icon
        button.classList.add('locked');
        if (!button.querySelector('.lock-icon')) {
          const lockIcon = document.createElement('span');
          lockIcon.className = 'lock-icon';
          lockIcon.textContent = '🔒';
          lockIcon.style.marginLeft = '8px';
          lockIcon.style.fontSize = '14px';
          button.appendChild(lockIcon);
        }
        
        // Override click to show upgrade prompt
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showUpgradePrompt(bot.name);
        };
      }
    });
  }
  
  gateViewContent() {
    const allViews = [
      'dashboard-view',
      'chat-view',
      'tasks-view',
      'filesystem-view',
      'docs-view',
      'research-view',
      'code-view',
      'social-view',
      'business-view'
    ];
    
    allViews.forEach(viewId => {
      const view = document.getElementById(viewId);
      if (!view) return;
      
      const isAllowed = this.isFeatureAllowed(viewId);
      
      if (!isAllowed) {
        // Add locked overlay if not already present
        if (!view.querySelector('.locked-overlay')) {
          const overlay = this.createLockedOverlay(viewId);
          view.style.position = 'relative';
          view.insertBefore(overlay, view.firstChild);
        }
      } else {
        // Remove locked overlay if present
        const overlay = view.querySelector('.locked-overlay');
        if (overlay) overlay.remove();
      }
    });
    
    // Gate analytics section
    const analyticsSection = document.getElementById('analytics-dashboard-section');
    if (analyticsSection) {
      const isAllowed = this.isFeatureAllowed('analytics-dashboard-section');
      
      if (!isAllowed && !analyticsSection.querySelector('.locked-overlay')) {
        const overlay = this.createLockedOverlay('Analytics');
        analyticsSection.style.position = 'relative';
        analyticsSection.insertBefore(overlay, analyticsSection.firstChild);
      } else if (isAllowed) {
        const overlay = analyticsSection.querySelector('.locked-overlay');
        if (overlay) overlay.remove();
      }
    }
    
    // Gate settings view
    const settingsView = document.getElementById('settings-view');
    if (settingsView) {
      const isAllowed = this.isFeatureAllowed('settings-view');
      
      if (!isAllowed && !settingsView.querySelector('.locked-overlay')) {
        const overlay = this.createLockedOverlay('Settings');
        settingsView.style.position = 'relative';
        settingsView.insertBefore(overlay, settingsView.firstChild);
      } else if (isAllowed) {
        const overlay = settingsView.querySelector('.locked-overlay');
        if (overlay) overlay.remove();
      }
    }
  }
  
  createLockedOverlay(featureName) {
    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';
    overlay.innerHTML = `
      <div class="locked-content">
        <div class="lock-icon-large">🔒</div>
        <h3>Upgrade to Pro</h3>
        <p>${featureName} is available in PinkyBot Pro</p>
        <div class="pro-features">
          <div class="feature-item">✅ All 9 Bots Unlocked</div>
          <div class="feature-item">✅ Advanced Analytics</div>
          <div class="feature-item">✅ Unlimited Tasks</div>
          <div class="feature-item">✅ Priority Support</div>
        </div>
        <div class="pricing">
          <span class="price">$29</span>/month
        </div>
        <button class="upgrade-now-btn" onclick="featureGating.showUpgradePrompt('${featureName}')">
          Upgrade Now
        </button>
      </div>
    `;
    
    return overlay;
  }
  
  addUpgradeButton() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Remove existing upgrade button if present
    const existing = document.getElementById('upgrade-to-pro-btn');
    if (existing) existing.remove();
    
    // Add upgrade button (only show if free tier)
    if (this.isFree()) {
      const upgradeBtn = document.createElement('button');
      upgradeBtn.id = 'upgrade-to-pro-btn';
      upgradeBtn.className = 'upgrade-btn';
      upgradeBtn.innerHTML = `
        <span class="upgrade-icon">⭐</span>
        <span>Upgrade to Pro</span>
      `;
      upgradeBtn.onclick = () => this.showUpgradePrompt('Dashboard');
      
      // Insert before "Views" header
      const viewsHeader = Array.from(sidebar.querySelectorAll('.sidebar-section-header'))
        .find(h => h.textContent.includes('Views'));
      
      if (viewsHeader) {
        sidebar.insertBefore(upgradeBtn, viewsHeader);
      } else {
        sidebar.appendChild(upgradeBtn);
      }
    }
  }
  
  updateUpgradeButton() {
    const upgradeBtn = document.getElementById('upgrade-to-pro-btn');
    
    if (this.isFree()) {
      if (!upgradeBtn) {
        this.addUpgradeButton();
      }
    } else {
      if (upgradeBtn) {
        upgradeBtn.remove();
      }
    }
  }
  
  showUpgradePrompt(featureName) { return; // DISABLED - all Pro
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
      <div class="upgrade-modal-content">
        <button class="close-modal" onclick="this.closest('.upgrade-modal').remove()">✕</button>
        <div class="modal-header">
          <div class="lock-icon-large">🔒</div>
          <h2>Unlock ${featureName}</h2>
          <p>Upgrade to PinkyBot Pro for full access</p>
        </div>
        
        <div class="tier-comparison">
          <div class="tier-card free-tier">
            <h3>Free</h3>
            <div class="tier-price">$0<span>/month</span></div>
            <ul class="tier-features">
              <li>✅ Dashboard</li>
              <li>✅ Chat</li>
              <li>✅ TasksBot</li>
              <li>❌ 6 Additional Bots</li>
              <li>❌ Analytics</li>
              <li>❌ Settings</li>
            </ul>
            <button class="tier-btn" disabled>Current Plan</button>
          </div>
          
          <div class="tier-card pro-tier">
            <div class="popular-badge">Most Popular</div>
            <h3>Pro</h3>
            <div class="tier-price">$29<span>/month</span></div>
            <ul class="tier-features">
              <li>✅ All 9 Bots</li>
              <li>✅ FileSystemBot</li>
              <li>✅ DocsBot</li>
              <li>✅ ResearchBot</li>
              <li>✅ CodeBot</li>
              <li>✅ SocialBot</li>
              <li>✅ BusinessBot</li>
              <li>✅ Advanced Analytics</li>
              <li>✅ Full Settings Access</li>
              <li>✅ Unlimited Tasks</li>
              <li>✅ Priority Support</li>
            </ul>
            <button class="tier-btn pro-btn" onclick="featureGating.upgradeToPro()">
              Upgrade to Pro
            </button>
          </div>
        </div>
        
        <div class="modal-footer">
          <p>🔗 Hold 10,000+ $PINKY tokens? <a href="#" onclick="featureGating.showTokenDiscount(); return false;">Get 20% off!</a></p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  upgradeToPro() {
    // For now, just unlock locally (payment integration Phase 3.2)
    console.log('[Feature Gating] Upgrading to Pro (demo mode)');
    
    if (confirm('Demo Mode: This will unlock Pro features locally.\n\nIn production, this will redirect to payment checkout.\n\nContinue?')) {
      this.setTier('pro');
      
      // Close modal
      const modal = document.querySelector('.upgrade-modal');
      if (modal) modal.remove();
      
      // Show success message
      this.showSuccessMessage('Upgraded to Pro! 🎉');
      
      // Refresh page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }
  
  showTokenDiscount() {
    alert('🪙 Solana $PINKY Token Holders:\n\n' +
          'Hold 10,000+ $PINKY tokens in your wallet to unlock 20% off Pro!\n\n' +
          'Price: $29/mo → $23.20/mo\n\n' +
          'Connect your Solana wallet on the pricing page to verify your balance.\n\n' +
          '(Feature coming in Phase 3.1-4)');
  }
  
  showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2ed573 0%, #1dd1a1 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(46, 213, 115, 0.4);
      z-index: 999999;
      animation: slideInRight 0.4s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 2000);
  }
  
  watchNavigation() {
    // Re-apply gating when views change
    const observer = new MutationObserver(() => {
      this.applyFeatureGating();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Admin functions for testing
  resetToFree() {
    this.setTier('free');
    window.location.reload();
  }
  
  debugInfo() {
    console.log('[Feature Gating Debug]');
    console.log('Current Tier:', this.getCurrentTier());
    console.log('Is Pro:', this.isPro());
    console.log('Is Free:', this.isFree());
    console.log('Allowed Features:', [
      ...this.tiers[this.getCurrentTier()].bots,
      ...this.tiers[this.getCurrentTier()].features
    ]);
  }
}

// Auto-initialize
let featureGating;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    featureGating = new FeatureGating();
    window.featureGating = featureGating; // Expose globally
  });
} else {
  featureGating = new FeatureGating();
  window.featureGating = featureGating;
}
