/**
 * Stripe Payment Integration - Pro Tier Checkout
 * Handles Stripe Checkout sessions and subscription management
 */

class StripeCheckout {
  constructor() {
    this.stripePublicKey = this.getPublicKey();
    this.stripe = null;
    this.apiBase = window.location.origin;
    this.priceId = this.getPriceId();
    this.init();
  }

  init() {
    // Load Stripe.js if not already loaded
    if (!window.Stripe && !document.querySelector('script[src*="stripe.com"]')) {
      this.loadStripeJS();
    } else if (window.Stripe) {
      this.initializeStripe();
    }

    // Listen for upgrade button clicks
    this.attachUpgradeListeners();

    // Check subscription status on load
    this.checkSubscriptionStatus();
  }

  getPublicKey() {
    // In production, this should come from environment or server config
    // For now, check localStorage or default to test key
    return localStorage.getItem('stripe_public_key') || 
           'pk_test_51QkYourTestKeyHere'; // Replace with actual test key
  }

  getPriceId() {
    // Stripe Price ID for Pro tier subscription
    // This should be set in admin settings or environment
    return localStorage.getItem('stripe_price_id') || 
           'price_1QkYourPriceIDHere'; // Replace with actual price ID
  }

  loadStripeJS() {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      console.log('[Stripe] Stripe.js loaded');
      this.initializeStripe();
    };
    script.onerror = () => {
      console.error('[Stripe] Failed to load Stripe.js');
      this.showError('Failed to load payment system. Please refresh the page.');
    };
    document.head.appendChild(script);
  }

  initializeStripe() {
    if (!this.stripePublicKey || this.stripePublicKey.startsWith('pk_test_51QkYour')) {
      console.warn('[Stripe] No valid public key configured. Stripe integration disabled.');
      return;
    }

    try {
      this.stripe = Stripe(this.stripePublicKey);
      console.log('[Stripe] Initialized successfully');
    } catch (error) {
      console.error('[Stripe] Initialization error:', error);
      this.showError('Payment system initialization failed.');
    }
  }

  attachUpgradeListeners() {
    // Listen for clicks on upgrade buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.upgrade-to-pro-btn, [data-action="upgrade-to-pro"]')) {
        e.preventDefault();
        this.showCheckoutModal();
      }
    });

    // Listen for manage subscription clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.manage-subscription-btn, [data-action="manage-subscription"]')) {
        e.preventDefault();
        this.openCustomerPortal();
      }
    });
  }

  async showCheckoutModal() {
    // Check for PINKY token discount (20% off for 10,000+ tokens)
    const hasPinkyDiscount = await this.checkPinkyTokenBalance();
    const basePrice = 29;
    const discountedPrice = 23.20; // 20% off
    const finalPrice = hasPinkyDiscount ? discountedPrice : basePrice;
    const savings = hasPinkyDiscount ? (basePrice - discountedPrice).toFixed(2) : 0;

    // Show modal with checkout options
    const modal = document.createElement('div');
    modal.className = 'stripe-checkout-modal';
    modal.innerHTML = `
      <div class="stripe-modal-overlay"></div>
      <div class="stripe-modal-content">
        <button class="stripe-modal-close">✕</button>
        <div class="stripe-modal-header">
          <h2>🚀 Upgrade to Pro</h2>
          <p>Unlock all features and bots</p>
          ${hasPinkyDiscount ? '<div class="pinky-discount-badge">🎉 PINKY Token Holder Discount Active!</div>' : ''}
        </div>
        <div class="stripe-modal-body">
          <div class="stripe-pricing-card">
            ${hasPinkyDiscount ? '<div class="original-price">$29</div>' : ''}
            <div class="stripe-price">
              <span class="stripe-currency">$</span>
              <span class="stripe-amount">${finalPrice}</span>
              <span class="stripe-period">/month</span>
            </div>
            ${hasPinkyDiscount ? `<div class="discount-note">💰 You save $${savings}/month with PINKY tokens!</div>` : ''}
            <ul class="stripe-features">
              <li>✅ 9 AI-powered bots (vs 3 in Free)</li>
              <li>✅ Advanced Analytics Dashboard</li>
              <li>✅ Custom Settings & Preferences</li>
              <li>✅ Priority Support</li>
              <li>✅ FileSystem, Docs, Research Bots</li>
              <li>✅ Code, Social, Business Bots</li>
            </ul>
            <button class="stripe-checkout-btn" id="stripe-checkout-btn">
              <span class="btn-text">Start Pro Subscription</span>
              <span class="btn-loader" style="display: none;">⏳ Processing...</span>
            </button>
            <p class="stripe-secure-note">
              🔒 Secure payment powered by Stripe
            </p>
          </div>
          <div class="stripe-benefits">
            <h3>What You Get:</h3>
            <div class="benefit-grid">
              <div class="benefit-item">
                <div class="benefit-icon">🤖</div>
                <div class="benefit-text">6 Additional Bots</div>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">📊</div>
                <div class="benefit-text">Analytics Dashboard</div>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">⚙️</div>
                <div class="benefit-text">Advanced Settings</div>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">🛡️</div>
                <div class="benefit-text">Priority Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal handlers
    modal.querySelector('.stripe-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    modal.querySelector('.stripe-modal-overlay').addEventListener('click', () => {
      modal.remove();
    });

    // Checkout button handler
    modal.querySelector('#stripe-checkout-btn').addEventListener('click', () => {
      this.initiateCheckout();
    });

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape' && modal.parentElement) {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  async initiateCheckout() {
    if (!this.stripe) {
      this.showError('Stripe is not initialized. Please configure your Stripe public key.');
      return;
    }

    const btn = document.getElementById('stripe-checkout-btn');
    if (!btn) return;

    // Show loading state
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline';

    try {
      // Check PINKY token discount
      const hasPinkyDiscount = await this.checkPinkyTokenBalance();
      const solanaAddress = localStorage.getItem('solana_wallet_address') || null;

      // Create checkout session via backend API
      const response = await fetch(`${this.apiBase}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: this.priceId,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/dashboard?checkout=cancel`,
          customerEmail: localStorage.getItem('pinky_user_email') || undefined,
          hasPinkyDiscount: hasPinkyDiscount,
          metadata: {
            userId: localStorage.getItem('pinky_user_id') || 'unknown',
            userName: localStorage.getItem('pinky_user_name') || 'Unknown',
            solanaAddress: solanaAddress,
            pinkyTokenHolder: hasPinkyDiscount ? 'yes' : 'no'
          }
        })
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect to Stripe Checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.sessionId
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (error) {
      console.error('[Stripe] Checkout error:', error);
      this.showError('Failed to initiate checkout: ' + error.message);
      
      // Reset button state
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loader').style.display = 'none';
    }
  }

  async openCustomerPortal() {
    try {
      const response = await fetch(`${this.apiBase}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
          customerId: localStorage.getItem('stripe_customer_id')
        })
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect to Stripe Customer Portal
      window.location.href = session.url;

    } catch (error) {
      console.error('[Stripe] Portal error:', error);
      this.showError('Failed to open subscription management: ' + error.message);
    }
  }

  async checkSubscriptionStatus() {
    // Check if user just completed checkout
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');

    if (checkoutStatus === 'success') {
      // Remove query param
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message
      setTimeout(() => {
        this.showSuccess('🎉 Welcome to Pro! Your subscription is now active.');
      }, 500);

      // Fire event for tier resolver
      window.dispatchEvent(new Event('stripeCheckoutSuccess'));

      // Verify subscription status from backend
      await this.verifySubscription();
    } else if (checkoutStatus === 'cancel') {
      // Remove query param
      window.history.replaceState({}, document.title, window.location.pathname);
      
      this.showInfo('Checkout cancelled. Your subscription was not created.');
    }

    // Periodically check subscription status
    this.pollSubscriptionStatus();
  }

  async verifySubscription() {
    try {
      const response = await fetch(`${this.apiBase}/api/stripe/subscription-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.active && data.tier === 'pro') {
        // Update local tier
        localStorage.setItem('pinky_tier', 'pro');
        localStorage.setItem('stripe_customer_id', data.customerId);
        localStorage.setItem('stripe_subscription_id', data.subscriptionId);

        // Notify feature gating system
        if (window.featureGating) {
          window.featureGating.setTier('pro');
        }

        console.log('[Stripe] Subscription verified as Pro');
      }

    } catch (error) {
      console.error('[Stripe] Subscription verification error:', error);
    }
  }

  pollSubscriptionStatus() {
    // Check subscription status every 5 minutes
    // DISABLED setInterval(() => {
      this.verifySubscription();
    }, 5 * 60 * 1000);
  }

  async checkPinkyTokenBalance() {
    // Check if user has 10,000+ PINKY tokens for discount
    try {
      const solanaAddress = localStorage.getItem('solana_wallet_address');
      const pinkyBalance = localStorage.getItem('pinky_token_balance');

      if (!solanaAddress || !pinkyBalance) {
        return false; // No wallet connected
      }

      const balance = parseFloat(pinkyBalance);
      return balance >= 10000; // 10K tokens = 20% discount

    } catch (error) {
      console.error('[Stripe] Error checking PINKY token balance:', error);
      return false;
    }
  }

  showError(message) {
    if (window.dashboard && window.dashboard.showToast) {
      window.dashboard.showToast(message, 'error');
    } else {
      alert('Error: ' + message);
    }
  }

  showSuccess(message) {
    if (window.dashboard && window.dashboard.showToast) {
      window.dashboard.showToast(message, 'success');
    } else {
      alert(message);
    }
  }

  showInfo(message) {
    if (window.dashboard && window.dashboard.showToast) {
      window.dashboard.showToast(message, 'info');
    } else {
      alert(message);
    }
  }

  // Admin: Configure Stripe keys (call from settings page)
  static configure(publicKey, priceId) {
    localStorage.setItem('stripe_public_key', publicKey);
    localStorage.setItem('stripe_price_id', priceId);
    console.log('[Stripe] Configuration updated');
    
    // Reinitialize
    if (window.stripeCheckout) {
      window.stripeCheckout = new StripeCheckout();
    }
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.stripeCheckout = new StripeCheckout();
  console.log('[Stripe] Checkout system initialized');
});
