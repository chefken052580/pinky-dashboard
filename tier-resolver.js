/**
 * Tier Resolver - Unified subscription and license tier management
 * Checks both Stripe subscriptions and license keys to determine effective tier
 */

class TierResolver {
  constructor() {
    this.apiBase = window.location.origin;
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
    this.init();
  }

  async init() {
    console.log('[Tier Resolver] Initializing tier resolution...');
    
    // Initial tier resolution
    await this.resolveTier();
    
    // Periodic tier checks
    setInterval(() => this.resolveTier(), this.checkInterval);
  }

  /**
   * Resolve effective tier from all sources
   * Priority: License > Stripe Subscription > Free
   */
  async resolveTier() {
    try {
      const results = await Promise.all([
        this.checkLicenseTier(),
        this.checkStripeTier()
      ]);

      const [licenseTier, stripeTier] = results;

      // Determine effective tier (highest tier wins)
      const effectiveTier = this.selectHighestTier(licenseTier, stripeTier);

      // Update current tier
      this.setEffectiveTier(effectiveTier);

      console.log('[Tier Resolver] Resolution complete:', {
        license: licenseTier,
        stripe: stripeTier,
        effective: effectiveTier
      });

      return effectiveTier;

    } catch (error) {
      console.error('[Tier Resolver] Resolution error:', error);
      // On error, maintain current tier or default to free
      const currentTier = localStorage.getItem('pinky_tier') || 'free';
      return currentTier;
    }
  }

  /**
   * Check license key tier
   */
  async checkLicenseTier() {
    const licenseKey = localStorage.getItem('pinky_license_key');
    const instanceId = localStorage.getItem('pinky_instance_id');

    if (!licenseKey || !instanceId) {
      return { tier: 'free', source: 'license', active: false };
    }

    try {
      const response = await fetch(
        `${this.apiBase}/api/license/status?licenseKey=${encodeURIComponent(licenseKey)}&instanceId=${instanceId}`
      );

      const data = await response.json();

      if (data.status === 'active') {
        return {
          tier: data.tier || 'free',
          source: 'license',
          active: true,
          expiresAt: data.expiresAt,
          daysRemaining: data.daysRemaining
        };
      }

      // License inactive or expired
      return {
        tier: 'free',
        source: 'license',
        active: false,
        error: data.error
      };

    } catch (error) {
      console.error('[Tier Resolver] License check error:', error);
      return {
        tier: 'free',
        source: 'license',
        active: false,
        error: error.message
      };
    }
  }

  /**
   * Check Stripe subscription tier
   */
  async checkStripeTier() {
    const customerId = localStorage.getItem('stripe_customer_id');

    if (!customerId) {
      return { tier: 'free', source: 'stripe', active: false };
    }

    try {
      const response = await fetch(
        `${this.apiBase}/api/stripe/subscription-status?customerId=${customerId}`
      );

      const data = await response.json();

      if (data.active && data.tier) {
        return {
          tier: data.tier,
          source: 'stripe',
          active: true,
          subscriptionId: data.subscriptionId,
          currentPeriodEnd: data.currentPeriodEnd,
          status: data.status,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd
        };
      }

      return {
        tier: 'free',
        source: 'stripe',
        active: false,
        status: data.status || 'inactive'
      };

    } catch (error) {
      console.error('[Tier Resolver] Stripe check error:', error);
      return {
        tier: 'free',
        source: 'stripe',
        active: false,
        error: error.message
      };
    }
  }

  /**
   * Select highest tier from multiple sources
   * Priority: enterprise > pro > free
   */
  selectHighestTier(licenseTier, stripeTier) {
    const tierPriority = {
      'enterprise': 3,
      'pro': 2,
      'free': 1
    };

    const licenseActive = licenseTier.active && licenseTier.tier !== 'free';
    const stripeActive = stripeTier.active && stripeTier.tier !== 'free';

    // If both active, choose highest tier
    if (licenseActive && stripeActive) {
      const licensePriority = tierPriority[licenseTier.tier] || 1;
      const stripePriority = tierPriority[stripeTier.tier] || 1;
      
      if (licensePriority >= stripePriority) {
        return {
          tier: licenseTier.tier,
          source: 'license',
          ...licenseTier
        };
      } else {
        return {
          tier: stripeTier.tier,
          source: 'stripe',
          ...stripeTier
        };
      }
    }

    // If only license active
    if (licenseActive) {
      return {
        tier: licenseTier.tier,
        source: 'license',
        ...licenseTier
      };
    }

    // If only Stripe active
    if (stripeActive) {
      return {
        tier: stripeTier.tier,
        source: 'stripe',
        ...stripeTier
      };
    }

    // Neither active, default to free
    return {
      tier: 'free',
      source: 'default',
      active: false
    };
  }

  /**
   * Set effective tier and update feature gating
   */
  setEffectiveTier(tierData) {
    const { tier, source } = tierData;

    // Store tier and source
    localStorage.setItem('pinky_tier', tier);
    localStorage.setItem('pinky_tier_source', source);

    // Store tier data for reference
    localStorage.setItem('pinky_tier_data', JSON.stringify(tierData));

    // Notify feature gating system
    if (window.featureGating) {
      window.featureGating.setTier(tier);
    }

    // Fire custom event for other components
    window.dispatchEvent(new CustomEvent('tierChanged', {
      detail: tierData
    }));

    console.log(`[Tier Resolver] Effective tier set to: ${tier} (source: ${source})`);
    
    // Show warnings if needed
    this.checkAndShowWarnings(tierData);
  }
  
  /**
   * Check tier data and show warnings/notices
   */
  checkAndShowWarnings(tierData) {
    // Payment failure warning (Stripe past_due status)
    if (tierData.source === 'stripe' && tierData.status === 'past_due') {
      this.showWarningBanner(
        '❌ Payment Failed: Your payment method was declined. Update your billing info to continue Pro access.',
        'error',
        'Update Payment'
      );
    }
    
    // Subscription cancelled warning
    if (tierData.source === 'stripe' && tierData.cancelAtPeriodEnd && tierData.currentPeriodEnd) {
      const endDate = new Date(tierData.currentPeriodEnd * 1000).toLocaleDateString();
      this.showWarningBanner(
        `⚠️ Subscription Cancelled: Your Pro access will end on ${endDate}. Reactivate to continue.`,
        'warning',
        'Reactivate'
      );
    }
    
    // Expiring soon warning (< 7 days)
    if (tierData.source === 'stripe' && tierData.currentPeriodEnd) {
      const daysRemaining = Math.ceil((tierData.currentPeriodEnd * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysRemaining > 0 && daysRemaining <= 7 && !tierData.cancelAtPeriodEnd) {
        this.showWarningBanner(
          `⏰ Subscription Renewing: Your Pro subscription renews in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
          'info'
        );
      }
    }
    
    // License expiring soon (< 30 days)
    if (tierData.source === 'license' && tierData.expiresAt) {
      const daysRemaining = Math.ceil((tierData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysRemaining > 0 && daysRemaining <= 30) {
        this.showWarningBanner(
          `⚠️ License Expiring: Your license expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Contact support to renew.`,
          'warning'
        );
      }
    }
  }
  
  /**
   * Show warning banner at top of dashboard
   */
  showWarningBanner(message, type = 'warning', actionText = null) {
    // Check if banner already exists
    const existingBanner = document.getElementById('tier-warning-banner');
    if (existingBanner) return; // Don't duplicate banners
    
    const banner = document.createElement('div');
    banner.id = 'tier-warning-banner';
    
    const bgColors = {
      error: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      warning: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      padding: 12px 20px;
      background: ${bgColors[type] || bgColors.warning};
      color: white;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      font-size: 14px;
    `;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    banner.appendChild(messageSpan);
    
    if (actionText) {
      const actionBtn = document.createElement('button');
      actionBtn.textContent = actionText;
      actionBtn.style.cssText = `
        background: rgba(255,255,255,0.95);
        color: #333;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
        transition: transform 0.2s;
      `;
      actionBtn.onmouseover = () => actionBtn.style.transform = 'scale(1.05)';
      actionBtn.onmouseout = () => actionBtn.style.transform = 'scale(1)';
      actionBtn.onclick = () => {
        // Open Stripe billing portal
        const customerId = localStorage.getItem('stripe_customer_id');
        if (customerId) {
          window.location.href = `${this.apiBase}/api/stripe/create-portal-session?customerId=${customerId}`;
        }
      };
      banner.appendChild(actionBtn);
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0 8px;
      margin-left: 10px;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
    closeBtn.onclick = () => {
      banner.remove();
      document.body.style.paddingTop = '0';
    };
    banner.appendChild(closeBtn);
    
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.style.paddingTop = '50px';
  }

  /**
   * Get current effective tier
   */
  getCurrentTier() {
    return localStorage.getItem('pinky_tier') || 'free';
  }

  /**
   * Get tier data
   */
  getTierData() {
    try {
      const data = localStorage.getItem('pinky_tier_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Force immediate tier resolution (useful after activation/purchase)
   */
  async refresh() {
    console.log('[Tier Resolver] Manual refresh triggered');
    return await this.resolveTier();
  }

  /**
   * Get tier information for display
   */
  getTierInfo() {
    const tier = this.getCurrentTier();
    const tierData = this.getTierData();
    const source = localStorage.getItem('pinky_tier_source') || 'default';

    let expiryInfo = null;
    if (tierData) {
      if (tierData.expiresAt) {
        const daysRemaining = tierData.daysRemaining || 
          Math.ceil((tierData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
        expiryInfo = {
          expiresAt: tierData.expiresAt,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          expired: daysRemaining <= 0
        };
      } else if (tierData.currentPeriodEnd) {
        const daysRemaining = Math.ceil((tierData.currentPeriodEnd * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
        expiryInfo = {
          expiresAt: tierData.currentPeriodEnd * 1000,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          expired: daysRemaining <= 0
        };
      }
    }

    return {
      tier,
      source,
      displayName: tier.charAt(0).toUpperCase() + tier.slice(1),
      ...expiryInfo
    };
  }

  /**
   * Check if user has Pro access (any tier above Free)
   */
  isPro() {
    const tier = this.getCurrentTier();
    return tier !== 'free';
  }

  /**
   * Show tier status UI
   */
  showTierStatus() {
    const info = this.getTierInfo();
    let message = `Current Tier: ${info.displayName}\nSource: ${info.source}`;

    if (info.daysRemaining !== undefined && info.daysRemaining !== null) {
      if (info.expired) {
        message += '\n❌ EXPIRED';
      } else if (info.daysRemaining <= 30) {
        message += `\n⚠️ Expires in ${info.daysRemaining} day${info.daysRemaining !== 1 ? 's' : ''}`;
      } else {
        message += `\n✅ ${info.daysRemaining} days remaining`;
      }
    } else if (info.tier !== 'free') {
      message += '\n✅ Active (no expiration)';
    }

    alert(message);
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.tierResolver = new TierResolver();
  console.log('[Tier Resolver] System initialized');
});

// Listen for tier-affecting events
window.addEventListener('licenseActivated', () => {
  if (window.tierResolver) {
    window.tierResolver.refresh();
  }
});

window.addEventListener('stripeCheckoutSuccess', () => {
  if (window.tierResolver) {
    window.tierResolver.refresh();
  }
});
