/**
 * PinkyBot Automated User Onboarding Wizard
 * Guides new users through initial setup in 5 steps
 */

class OnboardingWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.userData = {
      name: '',
      companyName: '',
      tier: 'free',
      platform: null, // twitter, linkedin, or wordpress
      firstPost: '',
      completed: false
    };
  }

  /**
   * Initialize onboarding wizard
   * Shows modal on first visit or if onboarding incomplete
   */
  init() {
    // Check if onboarding already completed
    const completed = localStorage.getItem('pinky_onboarding_completed');
    if (completed === 'true') {
      console.log('Onboarding already completed');
      return;
    }

    // Check if user wants to skip (dismissed before)
    const dismissed = localStorage.getItem('pinky_onboarding_dismissed');
    if (dismissed === 'true') {
      this.showSkipReminder();
      return;
    }

    // Show onboarding wizard
    this.showStep(1);
  }

  /**
   * Show specific onboarding step
   */
  showStep(step) {
    this.currentStep = step;
    
    // Remove any existing modals
    const existing = document.getElementById('onboarding-modal');
    if (existing) existing.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'onboarding-modal';
    
    let content = '';
    switch(step) {
      case 1:
        content = this.renderWelcomeStep();
        break;
      case 2:
        content = this.renderCompanySetupStep();
        break;
      case 3:
        content = this.renderPlatformConnectionStep();
        break;
      case 4:
        content = this.renderFirstPostStep();
        break;
      case 5:
        content = this.renderCompletionStep();
        break;
    }

    modal.innerHTML = content;
    document.body.appendChild(modal);

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Step 1: Welcome & Introduction
   */
  renderWelcomeStep() {
    return `
      <div class="onboarding-overlay"></div>
      <div class="onboarding-content">
        <div class="onboarding-header">
          <h2>👋 Welcome to PinkyBot!</h2>
          <button class="onboarding-close" onclick="onboardingWizard.dismiss()">✕</button>
        </div>
        <div class="onboarding-body">
          <div class="onboarding-step-indicator">
            <span class="step active">1</span>
            <span class="step">2</span>
            <span class="step">3</span>
            <span class="step">4</span>
            <span class="step">5</span>
          </div>
          
          <div class="onboarding-content-area">
            <div class="onboarding-icon">🚀</div>
            <h3>Let's get you started in 5 quick steps</h3>
            <p>We'll help you:</p>
            <ul class="onboarding-checklist">
              <li>✓ Set up your company profile</li>
              <li>✓ Connect your social media accounts</li>
              <li>✓ Create your first post</li>
              <li>✓ Learn key features</li>
            </ul>
            <p class="onboarding-time">⏱️ Takes about 3 minutes</p>
            
            <div class="onboarding-name-input">
              <label for="onboarding-user-name">What should we call you?</label>
              <input type="text" id="onboarding-user-name" placeholder="Your name" 
                     value="${this.userData.name}" />
            </div>
          </div>
        </div>
        <div class="onboarding-footer">
          <button class="onboarding-skip" onclick="onboardingWizard.dismiss()">Skip for now</button>
          <button class="onboarding-next" onclick="onboardingWizard.next()">Get Started →</button>
        </div>
      </div>
    `;
  }

  /**
   * Step 2: Company Setup
   */
  renderCompanySetupStep() {
    return `
      <div class="onboarding-overlay"></div>
      <div class="onboarding-content">
        <div class="onboarding-header">
          <h2>🏢 Set Up Your Company</h2>
          <button class="onboarding-close" onclick="onboardingWizard.dismiss()">✕</button>
        </div>
        <div class="onboarding-body">
          <div class="onboarding-step-indicator">
            <span class="step complete">✓</span>
            <span class="step active">2</span>
            <span class="step">3</span>
            <span class="step">4</span>
            <span class="step">5</span>
          </div>
          
          <div class="onboarding-content-area">
            <div class="onboarding-icon">🏢</div>
            <h3>Tell us about your business</h3>
            <p>This helps us personalize your experience</p>
            
            <div class="onboarding-form">
              <label for="onboarding-company-name">Company Name</label>
              <input type="text" id="onboarding-company-name" 
                     placeholder="e.g., Acme Corp" 
                     value="${this.userData.companyName}" />
              
              <label for="onboarding-tier">What's your goal?</label>
              <select id="onboarding-tier">
                <option value="free" ${this.userData.tier === 'free' ? 'selected' : ''}>
                  🆓 Just exploring (Free tier)
                </option>
                <option value="pro" ${this.userData.tier === 'pro' ? 'selected' : ''}>
                  💼 Growing my business (Pro tier - $29/mo)
                </option>
                <option value="enterprise" ${this.userData.tier === 'enterprise' ? 'selected' : ''}>
                  🚀 Enterprise solution (Enterprise tier)
                </option>
              </select>
              
              <div class="onboarding-tier-benefits">
                <p class="tier-desc">
                  <strong>Free Tier:</strong> 10 posts/month, 1 platform, basic analytics
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="onboarding-footer">
          <button class="onboarding-back" onclick="onboardingWizard.back()">← Back</button>
          <button class="onboarding-next" onclick="onboardingWizard.next()">Continue →</button>
        </div>
      </div>
    `;
  }

  /**
   * Step 3: Platform Connection
   */
  renderPlatformConnectionStep() {
    return `
      <div class="onboarding-overlay"></div>
      <div class="onboarding-content">
        <div class="onboarding-header">
          <h2>🔗 Connect Your Platform</h2>
          <button class="onboarding-close" onclick="onboardingWizard.dismiss()">✕</button>
        </div>
        <div class="onboarding-body">
          <div class="onboarding-step-indicator">
            <span class="step complete">✓</span>
            <span class="step complete">✓</span>
            <span class="step active">3</span>
            <span class="step">4</span>
            <span class="step">5</span>
          </div>
          
          <div class="onboarding-content-area">
            <div class="onboarding-icon">🔗</div>
            <h3>Choose your platform</h3>
            <p>Connect at least one platform to get started</p>
            
            <div class="onboarding-platform-grid">
              <div class="platform-card" data-platform="twitter" 
                   onclick="onboardingWizard.selectPlatform('twitter')">
                <div class="platform-icon">𝕏</div>
                <h4>Twitter / X</h4>
                <p>Post tweets, threads, and engage with followers</p>
                <button class="platform-connect-btn">Connect</button>
              </div>
              
              <div class="platform-card" data-platform="linkedin" 
                   onclick="onboardingWizard.selectPlatform('linkedin')">
                <div class="platform-icon">💼</div>
                <h4>LinkedIn</h4>
                <p>Share professional content and build your network</p>
                <button class="platform-connect-btn">Connect</button>
              </div>
              
              <div class="platform-card" data-platform="wordpress" 
                   onclick="onboardingWizard.selectPlatform('wordpress')">
                <div class="platform-icon">📝</div>
                <h4>WordPress</h4>
                <p>Publish SEO-optimized blog posts</p>
                <button class="platform-connect-btn">Connect</button>
              </div>
            </div>
            
            <p class="onboarding-note">
              💡 You can connect more platforms later in Settings
            </p>
          </div>
        </div>
        <div class="onboarding-footer">
          <button class="onboarding-back" onclick="onboardingWizard.back()">← Back</button>
          <button class="onboarding-next" onclick="onboardingWizard.skipPlatform()">Skip for now →</button>
        </div>
      </div>
    `;
  }

  /**
   * Step 4: Create First Post
   */
  renderFirstPostStep() {
    return `
      <div class="onboarding-overlay"></div>
      <div class="onboarding-content">
        <div class="onboarding-header">
          <h2>✍️ Create Your First Post</h2>
          <button class="onboarding-close" onclick="onboardingWizard.dismiss()">✕</button>
        </div>
        <div class="onboarding-body">
          <div class="onboarding-step-indicator">
            <span class="step complete">✓</span>
            <span class="step complete">✓</span>
            <span class="step complete">✓</span>
            <span class="step active">4</span>
            <span class="step">5</span>
          </div>
          
          <div class="onboarding-content-area">
            <div class="onboarding-icon">✍️</div>
            <h3>Let's create your first post!</h3>
            <p>Don't worry, you can save it as a draft</p>
            
            <div class="onboarding-form">
              <label for="onboarding-first-post">What's on your mind?</label>
              <textarea id="onboarding-first-post" 
                        placeholder="Share an update, announcement, or thought..."
                        rows="5">${this.userData.firstPost}</textarea>
              <div class="char-count">
                <span id="char-count">0</span> / 280 characters
              </div>
              
              <div class="onboarding-post-options">
                <label class="checkbox-label">
                  <input type="checkbox" id="save-as-draft" checked />
                  Save as draft (don't publish yet)
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="onboarding-footer">
          <button class="onboarding-back" onclick="onboardingWizard.back()">← Back</button>
          <button class="onboarding-next" onclick="onboardingWizard.createPost()">Save Post →</button>
        </div>
      </div>
    `;
  }

  /**
   * Step 5: Completion & Feature Tour
   */
  renderCompletionStep() {
    return `
      <div class="onboarding-overlay"></div>
      <div class="onboarding-content">
        <div class="onboarding-header">
          <h2>🎉 You're All Set!</h2>
          <button class="onboarding-close" onclick="onboardingWizard.complete()">✕</button>
        </div>
        <div class="onboarding-body">
          <div class="onboarding-step-indicator">
            <span class="step complete">✓</span>
            <span class="step complete">✓</span>
            <span class="step complete">✓</span>
            <span class="step complete">✓</span>
            <span class="step active">5</span>
          </div>
          
          <div class="onboarding-content-area">
            <div class="onboarding-icon celebration">🎉</div>
            <h3>Welcome aboard, ${this.userData.name}!</h3>
            <p>Here's what you can do next:</p>
            
            <div class="onboarding-next-steps">
              <div class="next-step-card">
                <div class="next-step-icon">📅</div>
                <h4>Schedule Posts</h4>
                <p>Plan your content calendar and auto-publish</p>
              </div>
              
              <div class="next-step-card">
                <div class="next-step-icon">📊</div>
                <h4>View Analytics</h4>
                <p>Track engagement, followers, and reach</p>
              </div>
              
              <div class="next-step-card">
                <div class="next-step-icon">🤖</div>
                <h4>Use AI Assistant</h4>
                <p>Get content ideas and writing help</p>
              </div>
            </div>
            
            <div class="onboarding-resources">
              <h4>📚 Helpful Resources</h4>
              <ul>
                <li><a href="/docs" target="_blank">Documentation</a></li>
                <li><a href="/docs/quickstart" target="_blank">Quick Start Guide</a></li>
                <li><a href="https://discord.gg/pinkybot" target="_blank">Join Discord Community</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="onboarding-footer">
          <button class="onboarding-complete" onclick="onboardingWizard.complete()">
            Start Using PinkyBot →
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Event Listeners
   */
  attachEventListeners() {
    // Update char count for post textarea
    const textarea = document.getElementById('onboarding-first-post');
    if (textarea) {
      textarea.addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('char-count').textContent = count;
      });
    }

    // Update tier benefits when tier changes
    const tierSelect = document.getElementById('onboarding-tier');
    if (tierSelect) {
      tierSelect.addEventListener('change', (e) => {
        const benefits = {
          free: 'Free Tier: 10 posts/month, 1 platform, basic analytics',
          pro: 'Pro Tier: Unlimited posts, all platforms, advanced analytics, priority support',
          enterprise: 'Enterprise Tier: Multi-company management, team collaboration, custom integrations'
        };
        document.querySelector('.tier-desc').innerHTML = 
          `<strong>${e.target.selectedOptions[0].text}:</strong> ${benefits[e.target.value]}`;
      });
    }
  }

  /**
   * Navigation Methods
   */
  next() {
    // Save current step data
    this.saveStepData();
    
    // Validate before proceeding
    if (!this.validateStep(this.currentStep)) {
      return;
    }

    // Move to next step
    if (this.currentStep < this.totalSteps) {
      this.showStep(this.currentStep + 1);
    }
  }

  back() {
    if (this.currentStep > 1) {
      this.showStep(this.currentStep - 1);
    }
  }

  /**
   * Save data from current step
   */
  saveStepData() {
    switch(this.currentStep) {
      case 1:
        this.userData.name = document.getElementById('onboarding-user-name')?.value || '';
        break;
      case 2:
        this.userData.companyName = document.getElementById('onboarding-company-name')?.value || '';
        this.userData.tier = document.getElementById('onboarding-tier')?.value || 'free';
        break;
      case 4:
        this.userData.firstPost = document.getElementById('onboarding-first-post')?.value || '';
        break;
    }
  }

  /**
   * Validate step before proceeding
   */
  validateStep(step) {
    switch(step) {
      case 1:
        if (!this.userData.name.trim()) {
          alert('Please enter your name');
          return false;
        }
        break;
      case 2:
        if (!this.userData.companyName.trim()) {
          alert('Please enter your company name');
          return false;
        }
        break;
    }
    return true;
  }

  /**
   * Platform Selection
   */
  selectPlatform(platform) {
    this.userData.platform = platform;
    
    // Highlight selected platform
    document.querySelectorAll('.platform-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-platform="${platform}"]`).classList.add('selected');
    
    // Enable next button
    setTimeout(() => {
      this.next();
    }, 500);
  }

  skipPlatform() {
    this.userData.platform = null;
    this.next();
  }

  /**
   * Create first post
   */
  async createPost() {
    this.saveStepData();
    
    if (!this.userData.firstPost.trim()) {
      // Allow skipping
      this.next();
      return;
    }

    // Save post as draft
    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: this.userData.firstPost,
          status: 'draft',
          companyId: localStorage.getItem('pinky_active_company') || 'default'
        })
      });

      if (response.ok) {
        console.log('First post created successfully');
      }
    } catch (error) {
      console.error('Error creating first post:', error);
    }

    this.next();
  }

  /**
   * Complete onboarding
   */
  async complete() {
    this.userData.completed = true;
    
    // Save onboarding data
    localStorage.setItem('pinky_onboarding_completed', 'true');
    localStorage.setItem('pinky_user_name', this.userData.name);
    localStorage.setItem('pinky_onboarding_data', JSON.stringify(this.userData));
    
    // Track completion
    try {
      await fetch('/api/analytics/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.userData)
      });
    } catch (error) {
      console.error('Error tracking onboarding:', error);
    }

    // Close modal
    document.getElementById('onboarding-modal')?.remove();
    
    // Show success message
    alert(`Welcome to PinkyBot, ${this.userData.name}! 🎉`);
  }

  /**
   * Dismiss/Skip onboarding
   */
  dismiss() {
    if (confirm('Are you sure you want to skip onboarding? You can restart it anytime from Settings.')) {
      localStorage.setItem('pinky_onboarding_dismissed', 'true');
      document.getElementById('onboarding-modal')?.remove();
    }
  }

  /**
   * Show reminder for dismissed onboarding
   */
  showSkipReminder() {
    // Show small banner at top of page
    const banner = document.createElement('div');
    banner.className = 'onboarding-reminder-banner';
    banner.innerHTML = `
      <span>👋 Want a quick tour? <a href="#" onclick="onboardingWizard.restart()">Start onboarding</a></span>
      <button onclick="this.parentElement.remove()">✕</button>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  /**
   * Restart onboarding
   */
  restart() {
    localStorage.removeItem('pinky_onboarding_dismissed');
    localStorage.removeItem('pinky_onboarding_completed');
    this.currentStep = 1;
    this.showStep(1);
  }
}

// Global instance
window.onboardingWizard = new OnboardingWizard();

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.onboardingWizard.init();
  });
} else {
  window.onboardingWizard.init();
}
