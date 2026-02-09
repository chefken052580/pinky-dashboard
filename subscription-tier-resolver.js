/**
 * Subscription Tier Resolver
 * Wires subscription status and license validation to feature gating system
 * 
 * Tier Resolution Priority:
 * 1. License key (self-hosted deployments)
 * 2. Stripe subscription (cloud/SaaS)
 * 3. Default to Free tier
 */

class SubscriptionTierResolver {
  constructor() {
    this.apiBaseUrl = window.location.origin; // http://192.168.254.4:3030
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.lastCheckTime = 0;
    this.tierCache = null;
    this.warningShown = false;
    
    console.log('[Tier Resolver] Initialized');
  }
  
  /**
   * Initialize tier resolution on dashboard load
   */
  async init() {
    console.log('[Tier Resolver] Starting tier resolution...');
    
    // Resolve tier from backend
    const tierData = await this.resolveTier();
    
    // Update feature gating system
    if (window.featureGating && tierData) {
      window.featureGating.setTier(tierData.tier);
      
      // Show warnings if needed
      this.showTierWarnings(tierData);
      
      // Store tier data for status checks
      this.tierCache = tierData;
      localStorage.setItem('pinky_tier_data', JSON.stringify(tierData));
      
      console.log(`[Tier Resolver] Tier set to: ${tierData.tier}`);
    }
    
    // Set up periodic checks
    this.startPeriodicChecks();
    
    return tierData;
  }
  
  /**
   * Resolve tier from backend sources
   * Priority: License key > Stripe subscription > Free tier
   */
  async resolveTier() {
    // 1. Check for license key (self-hosted)
    const licenseKey = localStorage.getItem('pinky_license_key');
    if (licenseKey) {
      const licenseData = await this.validateLicense(licenseKey);
      if (licenseData && licenseData.valid) {
        console.log('[Tier Resolver] Resolved via license key:', licenseData.tier);
        return {
          source: 'license',
          tier: licenseData.tier,
          valid: true,
          expiresAt: licenseData.license.expiresAt,
          daysRemaining: licenseData.license.daysRemaining,
          licenseId: licenseData.license.id
        };
      } else {
        console.warn('[Tier Resolver] Invalid license key:', licenseData?.error);
        // Clear invalid license
        localStorage.removeItem('pinky_license_key');
      }
    }
    
    // 2. Check Stripe subscription (cloud/SaaS)
    const customerId = localStorage.getItem('pinky_customer_id');
    if (customerId) {
      const subscriptionData = await this.checkSubscriptionStatus(customerId);
      if (subscriptionData && subscriptionData.active) {
        console.log('[Tier Resolver] Resolved via Stripe subscription:', subscriptionData.tier);
        
        // Calculate days until renewal
        const now = Date.now() / 1000;
        const daysRemaining = Math.ceil((subscriptionData.currentPeriodEnd - now) / 86400);
        
        return {
          source: 'stripe',
          tier: subscriptionData.tier,
          active: true,
          subscriptionId: subscriptionData.subscriptionId,
          status: subscriptionData.status,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          daysRemaining: daysRemaining
        };
      }
    }
    
    // 3. Default to Free tier
    console.log('[Tier Resolver] No active subscription or license found, defaulting to Free tier');
    return {
      source: 'default',
      tier: 'free',
      active: false
    };
  }
  
  /**
   * Validate license key via backend API
   */
  async validateLicense(licenseKey) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });
      
      if (!response.ok) {
        throw new Error(`License validation failed: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[Tier Resolver] License validation error:', error);
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Check Stripe subscription status via backend API
   */
  async checkSubscriptionStatus(customerId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/stripe/subscription-status?customerId=${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Subscription check failed: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[Tier Resolver] Subscription check error:', error);
      return { active: false, tier: 'free' };
    }
  }
  
  /**
   * Show warnings based on tier status
   */
  showTierWarnings(tierData) {
    if (this.warningShown) return; // Only show once per session
    
    // Warning: Subscription expiring soon
    if (tierData.source === 'stripe' && tierData.daysRemaining <= 7) {
      this.showWarningBanner(
        `⚠️ Your Pro subscription expires in ${tierData.daysRemaining} day(s)`,
        'warning',
        () => this.openBillingPortal()
      );
      this.warningShown = true;
    }
    
    // Warning: Subscription cancelled, ends at period
    if (tierData.source === 'stripe' && tierData.cancelAtPeriodEnd) {
      this.showWarningBanner(
        `⚠️ Your Pro subscription is cancelled and will end on ${new Date(tierData.currentPeriodEnd * 1000).toLocaleDateString()}`,
        'warning',
        () => this.openBillingPortal()
      );
      this.warningShown = true;
    }
    
    // Warning: License expiring soon
    if (tierData.source === 'license' && tierData.daysRemaining <= 30) {
      this.showWarningBanner(
        `⚠️ Your license expires in ${tierData.daysRemaining} day(s). Contact support to renew.`,
        'warning'
      );
      this.warningShown = true;
    }
    
    // Error: Payment failed
    if (tierData.source === 'stripe' && tierData.status === 'past_due') {
      this.showWarningBanner(
        `❌ Payment failed. Update your payment method to continue Pro access.`,
        'error',
        () => this.openBillingPortal()
      );
      this.warningShown = true;
    }
  }
  
  /**
   * Display warning banner at top of dashboard
   */
  showWarningBanner(message, type = 'warning', actionCallback = null) {
    const banner = document.createElement('div');
    banner.id = 'tier-warning-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      padding: 15px 20px;
      background: ${type === 'error' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'};
      color: ${type === 'error' ? 'white' : '#333'};
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
    `;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    banner.appendChild(messageSpan);
    
    if (actionCallback) {
      const actionBtn = document.createElement('button');
      actionBtn.textContent = 'Manage Billing';
      actionBtn.style.cssText = `
        background: rgba(255,255,255,0.9);
        color: #333;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      `;
      actionBtn.onmouseover = () => actionBtn.style.transform = 'scale(1.05)';
      actionBtn.onmouseout = () => actionBtn.style.transform = 'scale(1)';
      actionBtn.onclick = actionCallback;
      banner.appendChild(actionBtn);
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: ${type === 'error' ? 'white' : '#333'};
      font-size: 20px;
      cursor: pointer;
      padding: 0 10px;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '0.7';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '1';
    closeBtn.onclick = () => banner.remove();
    banner.appendChild(closeBtn);
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Push content down
    document.body.style.paddingTop = '60px';
  }
  
  /**
   * Open Stripe billing portal
   */
  async openBillingPortal() {
    const customerId = localStorage.getItem('pinky_customer_id');
    if (!customerId) {
      alert('No customer ID found. Please contact support.');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href
        })
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
      
    } catch (error) {
      console.error('[Tier Resolver] Portal error:', error);
      alert('Failed to open billing portal. Please try again or contact support.');
    }
  }
  
  /**
   * Start periodic tier checks (every 5 minutes)
   */
  startPeriodicChecks() {
    // DISABLED setInterval(async () => {
    // console.log('[Tier Resolver] Performing periodic tier check...');
    // const tierData = await this.resolveTier();
    //       // If tier changed, update feature gating
    // if (tierData && this.tierCache && tierData.tier !== this.tierCache.tier) {
    // console.warn(`[Tier Resolver] Tier changed from ${this.tierCache.tier} to ${tierData.tier}`);
    // if (window.featureGating) {
    // window.featureGating.setTier(tierData.tier);
    // }
    // this.tierCache = tierData;
    // localStorage.setItem('pinky_tier_data', JSON.stringify(tierData));
    //         // Show notification
    // this.showTierChangeNotification(tierData);
    // }
    //       // Check for new warnings
    // this.warningShown = false; // Reset to allow new warnings
    // this.showTierWarnings(tierData);
    //     // }, this.checkInterval);
    
    console.log(`[Tier Resolver] Periodic checks started (every ${this.checkInterval / 60000} minutes)`);
  }
  
  /**
   * Show notification when tier changes
   */
  showTierChangeNotification(tierData) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
      font-weight: 600;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 8px;">
        ${tierData.tier === 'pro' ? '✨ Welcome to Pro!' : '📢 Tier Update'}
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        Your tier has been updated to: <strong>${tierData.tier.toUpperCase()}</strong>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
  
  /**
   * Manual refresh trigger (for settings page button)
   */
  async refresh() {
    console.log('[Tier Resolver] Manual refresh triggered');
    this.warningShown = false; // Reset warnings
    return await this.init();
  }
}

// Auto-initialize when DOM is ready
let subscriptionTierResolver;

function initSubscriptionTierResolver() {
  subscriptionTierResolver = new SubscriptionTierResolver();
  
  // Wait for feature gating to be ready
  const checkReady = setInterval(() => {
    if (window.featureGating) {
      clearInterval(checkReady);
      subscriptionTierResolver.init();
    }
  }, 100);
  
  // Timeout after 5 seconds
  setTimeout(() => {
    clearInterval(checkReady);
    if (!subscriptionTierResolver.tierCache) {
      console.warn('[Tier Resolver] Timeout waiting for featureGating, initializing anyway');
      subscriptionTierResolver.init();
    }
  }, 5000);
}

// Initialize on DOM ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initSubscriptionTierResolver, 500);
} else {
  document.addEventListener('DOMContentLoaded', initSubscriptionTierResolver);
}

// Make globally accessible
window.subscriptionTierResolver = subscriptionTierResolver;
