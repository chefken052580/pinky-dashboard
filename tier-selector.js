/**
 * Tier Selector UI Component
 * Displays Bronze/Silver/Gold tier cards with pricing and Stripe checkout
 * Integrates with stripe-checkout.js for payment processing
 * Integrates with tier-management-api.js for backend
 */

class TierSelector {
  constructor(containerId = 'tier-selector-container') {
    this.container = document.getElementById(containerId);
    this.currentTier = null;
    this.currentCompanyId = null;
    this.stripePublicKey = 'pk_test_51234567890'; // Mock key - replace with real public key
    this.init();
  }

  init() {
    this.loadCurrentTier();
    this.renderTierCards();
    this.attachEventListeners();
  }

  // Load current tier for active company
  async loadCurrentTier() {
    try {
      this.currentCompanyId = localStorage.getItem('pinky_active_company') || 'default';
      const response = await fetch(`/api/tiers?companyId=${this.currentCompanyId}`);
      const data = await response.json();
      
      if (data.success && data.tiers.length > 0) {
        this.currentTier = data.tiers[0];
      }
    } catch (error) {
      console.error('Error loading tier:', error);
    }
  }

  // Render tier comparison cards
  renderTierCards() {
    if (!this.container) return;

    const html = `
      <div class="tier-selector-wrapper">
        <div class="tier-selector-header">
          <h2>Support Tiers & SLA Plans</h2>
          <p>Choose your support level with guaranteed response times</p>
        </div>

        <div class="tier-cards-grid">
          <!-- BRONZE TIER -->
          <div class="tier-card tier-bronze ${this.currentTier?.tier === 'bronze' ? 'active' : ''}">
            <div class="tier-badge">BRONZE</div>
            <div class="tier-price">
              <span class="amount">$49</span>
              <span class="period">/month</span>
            </div>
            
            <div class="tier-response-time">
              <div class="response-icon">📧</div>
              <div class="response-text">
                <div class="response-time">24h Response</div>
                <div class="channels">Email only</div>
              </div>
            </div>

            <div class="tier-features">
              <h3>Features</h3>
              <ul>
                <li>✓ Basic email support</li>
                <li>✓ 24-hour response time SLA</li>
                <li>✓ Up to 3 team members</li>
                <li>✓ 1 company profile</li>
                <li>✓ Community forum access</li>
              </ul>
            </div>

            <button class="tier-button bronze-button" data-tier="bronze">
              ${this.currentTier?.tier === 'bronze' ? '✓ Current Plan' : 'Select Bronze'}
            </button>
          </div>

          <!-- SILVER TIER -->
          <div class="tier-card tier-silver ${this.currentTier?.tier === 'silver' ? 'active' : ''} featured">
            <div class="tier-badge featured-badge">SILVER - POPULAR</div>
            <div class="tier-price">
              <span class="amount">$149</span>
              <span class="period">/month</span>
            </div>
            
            <div class="tier-response-time">
              <div class="response-icon">💬</div>
              <div class="response-text">
                <div class="response-time">8h Response</div>
                <div class="channels">Email + Chat</div>
              </div>
            </div>

            <div class="tier-features">
              <h3>Features</h3>
              <ul>
                <li>✓ Email + Chat support</li>
                <li>✓ 8-hour response time SLA</li>
                <li>✓ Up to 10 team members</li>
                <li>✓ 5 company profiles</li>
                <li>✓ Dedicated account manager</li>
                <li>✓ Monthly performance reviews</li>
              </ul>
            </div>

            <button class="tier-button silver-button" data-tier="silver">
              ${this.currentTier?.tier === 'silver' ? '✓ Current Plan' : 'Select Silver'}
            </button>
          </div>

          <!-- GOLD TIER -->
          <div class="tier-card tier-gold ${this.currentTier?.tier === 'gold' ? 'active' : ''}">
            <div class="tier-badge">GOLD - ENTERPRISE</div>
            <div class="tier-price">
              <span class="amount">$499</span>
              <span class="period">/month</span>
            </div>
            
            <div class="tier-response-time">
              <div class="response-icon">☎️</div>
              <div class="response-text">
                <div class="response-time">1h Response</div>
                <div class="channels">Email + Chat + Phone</div>
              </div>
            </div>

            <div class="tier-features">
              <h3>Features</h3>
              <ul>
                <li>✓ 24/7 Email + Chat + Phone support</li>
                <li>✓ 1-hour response time SLA</li>
                <li>✓ Up to 50 team members</li>
                <li>✓ Unlimited company profiles</li>
                <li>✓ Dedicated account manager</li>
                <li>✓ Custom integrations</li>
                <li>✓ Quarterly business reviews</li>
              </ul>
            </div>

            <button class="tier-button gold-button" data-tier="gold">
              ${this.currentTier?.tier === 'gold' ? '✓ Current Plan' : 'Select Gold'}
            </button>
          </div>
        </div>

        <!-- SLA INFO SECTION -->
        <div class="sla-info-section">
          <h3>SLA & Support Details</h3>
          <table class="sla-comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Bronze</th>
                <th>Silver</th>
                <th>Gold</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Response Time</td>
                <td>24 hours</td>
                <td>8 hours</td>
                <td>1 hour</td>
              </tr>
              <tr>
                <td>Support Channels</td>
                <td>Email</td>
                <td>Email, Chat</td>
                <td>Email, Chat, Phone</td>
              </tr>
              <tr>
                <td>Availability</td>
                <td>Business hours</td>
                <td>Business hours</td>
                <td>24/7</td>
              </tr>
              <tr>
                <td>Team Members</td>
                <td>Up to 3</td>
                <td>Up to 10</td>
                <td>Up to 50</td>
              </tr>
              <tr>
                <td>Companies</td>
                <td>1</td>
                <td>5</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Account Manager</td>
                <td>—</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Uptime SLA</td>
                <td>99.5%</td>
                <td>99.9%</td>
                <td>99.99%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- CURRENT TIER STATUS -->
        ${this.currentTier ? this.renderCurrentTierStatus() : ''}
      </div>
    `;

    this.container.innerHTML = html;
  }

  // Render current tier status and SLA info
  renderCurrentTierStatus() {
    const tier = this.currentTier;
    const tierNames = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };
    const daysActive = Math.floor((Date.now() - new Date(tier.activatedAt)) / (1000 * 60 * 60 * 24));

    return `
      <div class="current-tier-status">
        <h3>Current Plan Status</h3>
        <div class="status-cards">
          <div class="status-card">
            <div class="status-label">Active Tier</div>
            <div class="status-value">${tierNames[tier.tier]}</div>
          </div>
          <div class="status-card">
            <div class="status-label">Active Since</div>
            <div class="status-value">${daysActive} days</div>
          </div>
          <div class="status-card">
            <div class="status-label">Support Contacts</div>
            <div class="status-value">${tier.supportContactsUsed || 0}</div>
          </div>
          <div class="status-card">
            <div class="status-label">Response Time</div>
            <div class="status-value">${tier.responseTime}h SLA</div>
          </div>
        </div>
      </div>
    `;
  }

  // Attach event listeners to tier buttons
  attachEventListeners() {
    const buttons = this.container.querySelectorAll('.tier-button');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tier = e.target.dataset.tier;
        if (this.currentTier?.tier !== tier) {
          this.selectTier(tier);
        }
      });
    });
  }

  // Handle tier selection and Stripe checkout
  async selectTier(tier) {
    const tierPrices = {
      bronze: 4900, // cents
      silver: 14900,
      gold: 49900
    };

    const tierNames = {
      bronze: 'PinkyBot Bronze',
      silver: 'PinkyBot Silver',
      gold: 'PinkyBot Gold'
    };

    // Disable button during processing
    const button = this.container.querySelector(`[data-tier="${tier}"]`);
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '⏳ Processing...';

    try {
      // Check for PINKY token discount
      let discount = 0;
      if (typeof checkPinkyTokenBalance === 'function') {
        const hasDiscount = await checkPinkyTokenBalance();
        if (hasDiscount) {
          discount = Math.floor(tierPrices[tier] * 0.2); // 20% off
        }
      }

      const finalPrice = tierPrices[tier] - discount;

      // Create Stripe checkout session via backend
      const checkoutResponse = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          price: finalPrice,
          companyId: this.currentCompanyId,
          discount
        })
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to initiate checkout');
      }

      const { sessionId } = await checkoutResponse.json();

      // Redirect to Stripe Checkout
      if (window.Stripe) {
        const stripe = Stripe(this.stripePublicKey);
        await stripe.redirectToCheckout({ sessionId });
      } else {
        window.location.href = `/checkout?sessionId=${sessionId}`;
      }
    } catch (error) {
      console.error('Error selecting tier:', error);
      button.disabled = false;
      button.textContent = originalText;
      alert(`Error: ${error.message}`);
    }
  }

  // Load tier statistics
  async loadTierStats() {
    if (!this.currentCompanyId) return;

    try {
      const response = await fetch(`/api/tiers/stats/${this.currentCompanyId}`);
      const data = await response.json();

      if (data.success) {
        return data.stats;
      }
    } catch (error) {
      console.error('Error loading tier stats:', error);
    }
  }

  // Log support contact for SLA tracking
  async logSupportContact(channel, issue, priority = 'medium') {
    if (!this.currentCompanyId) return;

    try {
      const response = await fetch(`/api/tiers/support-contact/${this.currentCompanyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          issue,
          priority
        })
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error logging support contact:', error);
      return false;
    }
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tier-selector-container')) {
      window.tierSelector = new TierSelector('tier-selector-container');
    }
  });
} else {
  if (document.getElementById('tier-selector-container')) {
    window.tierSelector = new TierSelector('tier-selector-container');
  }
}
