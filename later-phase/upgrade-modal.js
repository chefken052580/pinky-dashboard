/**
 * upgrade-modal.js
 * Upgrade prompt modal for locked features
 * Shows feature descriptions, pricing, and Upgrade Now button
 */

class UpgradeModal {
  constructor() {
    this.modal = null;
    this.currentFeature = null;
    this.init();
  }

  init() {
    // Create modal element on first instantiation
    if (!document.getElementById('upgrade-modal')) {
      this.createModal();
    }
    this.modal = document.getElementById('upgrade-modal');
    this.attachEventListeners();
  }

  createModal() {
    const modalHTML = `
      <div id="upgrade-modal" class="upgrade-modal" style="display: none;">
        <div class="upgrade-modal-overlay" onclick="upgradeModal.close()"></div>
        <div class="upgrade-modal-content">
          <button class="upgrade-modal-close" onclick="upgradeModal.close()">✕</button>
          
          <div class="upgrade-modal-header">
            <span class="upgrade-icon">🔒</span>
            <h2 id="upgrade-feature-name">Feature Locked</h2>
          </div>

          <div class="upgrade-modal-body">
            <p id="upgrade-feature-description" class="feature-description"></p>
            
            <div class="tier-required">
              <span class="label">Requires:</span>
              <span id="upgrade-tier-badge" class="tier-badge">Pro</span>
            </div>

            <div class="pricing-display">
              <div class="price-box">
                <div class="price-label">Monthly Subscription</div>
                <div class="price-amount" id="upgrade-price-display">$29/mo</div>
                <div id="pinky-discount-badge" class="pinky-discount-badge" style="display: none;">
                  <span class="discount-icon">💰</span>
                  <span class="discount-text">20% OFF with $PINKY tokens</span>
                  <div class="discounted-price">$23.20/mo</div>
                </div>
              </div>

              <div class="feature-list">
                <h3>Pro Tier Includes:</h3>
                <ul id="upgrade-features-list">
                  <li>✓ All 9 AI bots unlocked</li>
                  <li>✓ Unlimited tasks & companies</li>
                  <li>✓ WordPress SEO integration</li>
                  <li>✓ Social media scheduling</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
            </div>

            <div class="upgrade-actions">
              <button class="btn-upgrade-now" onclick="upgradeModal.upgrade()">
                <span class="btn-icon">⚡</span>
                <span>Upgrade to Pro</span>
              </button>
              <button class="btn-view-pricing" onclick="upgradeModal.viewPricing()">
                View Full Pricing
              </button>
              <button class="btn-try-license" onclick="upgradeModal.tryLicense()">
                Have a License Key?
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  attachEventListeners() {
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'block') {
        this.close();
      }
    });
  }

  show(featureInfo) {
    this.currentFeature = featureInfo;
    this.updateContent(featureInfo);
    this.checkPinkyDiscount();
    this.modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }

  updateContent(featureInfo) {
    // Update feature name
    document.getElementById('upgrade-feature-name').textContent = 
      featureInfo.name || 'Feature Locked';

    // Update description
    document.getElementById('upgrade-feature-description').textContent = 
      featureInfo.description || 'This feature requires a Pro or Enterprise subscription.';

    // Update tier badge
    const tierBadge = document.getElementById('upgrade-tier-badge');
    tierBadge.textContent = featureInfo.tierRequired || 'Pro';
    tierBadge.className = `tier-badge tier-${(featureInfo.tierRequired || 'pro').toLowerCase()}`;

    // Update feature list if custom features provided
    if (featureInfo.features && featureInfo.features.length > 0) {
      const featuresList = document.getElementById('upgrade-features-list');
      featuresList.innerHTML = featureInfo.features.map(f => `<li>✓ ${f}</li>`).join('');
    }
  }

  checkPinkyDiscount() {
    // Check if user has connected wallet with sufficient PINKY tokens
    const walletConnected = localStorage.getItem('pinky_wallet_connected') === 'true';
    const tokenBalance = parseInt(localStorage.getItem('pinky_token_balance') || '0');
    const discountBadge = document.getElementById('pinky-discount-badge');
    const priceDisplay = document.getElementById('upgrade-price-display');

    if (walletConnected && tokenBalance >= 10000) {
      discountBadge.style.display = 'block';
      priceDisplay.innerHTML = '<span class="original-price">$29/mo</span>';
    } else {
      discountBadge.style.display = 'none';
      priceDisplay.innerHTML = '$29/mo';
    }
  }

  close() {
    this.modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scroll
    this.currentFeature = null;
  }

  upgrade() {
    // Redirect to Stripe checkout with feature context
    const walletConnected = localStorage.getItem('pinky_wallet_connected') === 'true';
    const tokenBalance = parseInt(localStorage.getItem('pinky_token_balance') || '0');
    const hasDiscount = walletConnected && tokenBalance >= 10000;

    // Build checkout URL
    let checkoutUrl = '/api/stripe/checkout';
    const params = new URLSearchParams({
      tier: 'pro',
      tokenDiscount: hasDiscount ? 'true' : 'false'
    });

    if (this.currentFeature && this.currentFeature.name) {
      params.append('source', `upgrade-modal-${this.currentFeature.name.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Open Stripe checkout
    window.location.href = `${checkoutUrl}?${params.toString()}`;
  }

  viewPricing() {
    // Navigate to pricing section on landing page or Settings
    window.location.href = '/landing-page/index.html#pricing';
  }

  tryLicense() {
    this.close();
    // Navigate to Settings page license section
    window.location.hash = 'settings';
    setTimeout(() => {
      // Scroll to license key section
      const licenseSection = document.querySelector('.license-key-section');
      if (licenseSection) {
        licenseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }
}

// Feature definitions for common locked features
const LOCKED_FEATURES = {
  'analytics': {
    name: 'Advanced Analytics',
    description: 'Unlock detailed usage statistics, token tracking, bot performance metrics, and activity logs to monitor your AI productivity.',
    tierRequired: 'Pro',
    features: [
      'Token usage breakdown by model',
      'Bot activity tracking',
      'Performance analytics',
      'Export data to CSV/JSON',
      'Historical trend charts'
    ]
  },
  'wordpress': {
    name: 'WordPress Integration',
    description: 'Automatically generate SEO-optimized blog posts and publish directly to your WordPress site with one click.',
    tierRequired: 'Pro',
    features: [
      'SEO page builder',
      'Auto-publish to WordPress',
      'Keyword optimization',
      'Meta tags & Open Graph',
      'Multi-site support'
    ]
  },
  'social-scheduling': {
    name: 'Social Media Scheduling',
    description: 'Schedule posts across 8 platforms, manage multiple companies, and automate your social media strategy.',
    tierRequired: 'Pro',
    features: [
      '8 platform support',
      'Multi-company management',
      'Post calendar & scheduling',
      'Platform-specific optimization',
      'Analytics per platform'
    ]
  },
  'filesystem': {
    name: 'FileSystemBot',
    description: 'Automate file operations, monitor workspace changes, and organize your codebase with AI assistance.',
    tierRequired: 'Pro'
  },
  'docs': {
    name: 'DocsBot',
    description: 'Search and analyze documentation, generate summaries, and extract insights from your knowledge base.',
    tierRequired: 'Pro'
  },
  'research': {
    name: 'ResearchBot',
    description: 'Perform web searches, save research notes, and compile findings with AI-powered research assistance.',
    tierRequired: 'Pro'
  },
  'code': {
    name: 'CodeBot',
    description: 'Analyze code, track commits, detect syntax errors, and get AI-powered code assistance.',
    tierRequired: 'Pro'
  },
  'social': {
    name: 'SocialBot',
    description: 'Manage social media, schedule posts, track engagement, and automate content distribution.',
    tierRequired: 'Pro'
  },
  'business': {
    name: 'BusinessBot',
    description: 'Track business metrics, manage clients, monitor revenue, and analyze business performance.',
    tierRequired: 'Pro'
  },
  'export': {
    name: 'Data Export',
    description: 'Export task history, activity logs, token usage, and memory files for backup and analysis.',
    tierRequired: 'Pro'
  }
};

// Global instance
const upgradeModal = new UpgradeModal();

// Helper function to show upgrade modal for a specific feature
function showUpgradePrompt(featureName) {
  const featureInfo = LOCKED_FEATURES[featureName] || {
    name: 'Pro Feature',
    description: 'This feature requires a Pro or Enterprise subscription to unlock.',
    tierRequired: 'Pro'
  };
  upgradeModal.show(featureInfo);
}
