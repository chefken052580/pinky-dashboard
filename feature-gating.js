/**
 * PinkyBot Feature Gating System
 * Free vs Pro tier enforcement with upgrade prompts
 */

class FeatureGating {
    constructor() {
        this.tier = 'free'; // Default to free tier
        this.init();
    }

    init() {
        // Load tier from localStorage
        this.tier = localStorage.getItem('pinkybot_tier') || 'free';
        
        // Apply gating on load
        this.applyGating();
        
        // Add upgrade button to sidebar
        this.addUpgradeButton();
        
        console.log(`[Feature Gating] Tier: ${this.tier}`);
    }

    getTier() {
        return this.tier;
    }

    setTier(tier) {
        if (tier !== 'free' && tier !== 'pro') {
            console.error('[Feature Gating] Invalid tier:', tier);
            return false;
        }
        
        this.tier = tier;
        localStorage.setItem('pinkybot_tier', tier);
        this.applyGating();
        
        console.log(`[Feature Gating] Tier updated to: ${tier}`);
        return true;
    }

    isFeatureAllowed(featureName) {
        const freeFeatures = ['dashboard', 'chat', 'tasksbot'];
        
        if (this.tier === 'pro') {
            return true; // Pro tier gets everything
        }
        
        // Free tier - check against allowlist
        return freeFeatures.includes(featureName.toLowerCase());
    }

    applyGating() {
        // Hide/show sidebar buttons based on tier
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Free tier: Dashboard, Chat, TasksBot (3 bots)
        // Pro tier: All 9 bots + Analytics + Settings
        
        const lockedFeatures = {
            'free': [
                'filesystem-nav',  // FileSystemBot
                'docs-nav',        // DocsBot
                'research-nav',    // ResearchBot
                'code-nav',        // CodeBot
                'social-nav',      // SocialBot
                'business-nav',    // BusinessBot
                'analytics-view',  // Analytics section
                'settings-nav'     // Settings page
            ]
        };

        const locked = this.tier === 'free' ? lockedFeatures.free : [];

        locked.forEach(navId => {
            const navButton = document.getElementById(navId);
            if (navButton) {
                // Add locked styling
                navButton.classList.add('locked-feature');
                navButton.style.opacity = '0.5';
                navButton.style.position = 'relative';
                
                // Add lock icon
                if (!navButton.querySelector('.lock-icon')) {
                    const lockIcon = document.createElement('span');
                    lockIcon.className = 'lock-icon';
                    lockIcon.innerHTML = '🔒';
                    lockIcon.style.cssText = 'position: absolute; top: 5px; right: 5px; font-size: 12px;';
                    navButton.appendChild(lockIcon);
                }
                
                // Override click handler to show upgrade prompt
                navButton.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showUpgradePrompt(navButton.textContent.trim());
                };
            }
        });

        // Update upgrade button visibility
        this.updateUpgradeButton();
    }

    addUpgradeButton() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Check if button already exists
        if (document.getElementById('upgrade-btn')) return;

        // Create upgrade button
        const upgradeBtn = document.createElement('button');
        upgradeBtn.id = 'upgrade-btn';
        upgradeBtn.className = 'nav-btn upgrade-btn';
        upgradeBtn.innerHTML = `
            <span class="btn-icon">✨</span>
            <span class="btn-text">Upgrade to Pro</span>
        `;
        upgradeBtn.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            margin-top: 10px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        `;
        
        upgradeBtn.onclick = () => this.showUpgradePrompt('Premium Features');
        
        // Add to sidebar at bottom
        sidebar.appendChild(upgradeBtn);
    }

    updateUpgradeButton() {
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (!upgradeBtn) return;

        if (this.tier === 'pro') {
            upgradeBtn.style.display = 'none';
        } else {
            upgradeBtn.style.display = 'block';
        }
    }

    showUpgradePrompt(featureName) {
        // Remove existing overlay if present
        const existingOverlay = document.getElementById('upgrade-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create upgrade overlay
        const overlay = document.createElement('div');
        overlay.id = 'upgrade-overlay';
        overlay.className = 'upgrade-overlay';
        overlay.innerHTML = `
            <div class="upgrade-modal">
                <div class="upgrade-header">
                    <h2>✨ Unlock ${featureName}</h2>
                    <button class="close-btn" onclick="document.getElementById('upgrade-overlay').remove()">✕</button>
                </div>
                
                <div class="upgrade-content">
                    <div class="feature-locked-icon">🔒</div>
                    <p class="upgrade-message">This feature is part of <strong>PinkyBot Pro</strong></p>
                    
                    <div class="tier-comparison">
                        <div class="tier-card free-tier">
                            <h3>Free Tier</h3>
                            <div class="tier-price">$0/month</div>
                            <ul class="tier-features">
                                <li>✅ Dashboard (Mission Control)</li>
                                <li>✅ Chat Interface</li>
                                <li>✅ TasksBot</li>
                                <li>❌ 6 Advanced Bots</li>
                                <li>❌ Analytics Dashboard</li>
                                <li>❌ Settings & Customization</li>
                            </ul>
                        </div>
                        
                        <div class="tier-card pro-tier">
                            <div class="recommended-badge">RECOMMENDED</div>
                            <h3>Pro Tier</h3>
                            <div class="tier-price">
                                <span class="price">$29/month</span>
                                <span class="token-discount">20% off with PINKY tokens</span>
                            </div>
                            <ul class="tier-features">
                                <li>✅ Everything in Free</li>
                                <li>✅ FileSystemBot (LLM-powered)</li>
                                <li>✅ DocsBot + ResearchBot + CodeBot</li>
                                <li>✅ SocialBot (8 platforms)</li>
                                <li>✅ BusinessBot + WordPress Integration</li>
                                <li>✅ Advanced Analytics</li>
                                <li>✅ Full Settings Control</li>
                                <li>✅ Priority Support</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="upgrade-actions">
                        <button class="btn btn-secondary" onclick="document.getElementById('upgrade-overlay').remove()">
                            Maybe Later
                        </button>
                        <button class="btn btn-primary" onclick="window.featureGating.mockUpgrade()">
                            Upgrade to Pro - $29/mo
                        </button>
                    </div>
                    
                    <p class="upgrade-note">
                        💡 <strong>Demo Mode:</strong> In production, this would connect to payment processing.
                        For testing, use the "Unlock Pro" button in Settings.
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Animate in
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.querySelector('.upgrade-modal').style.transform = 'scale(1)';
        }, 10);
    }

    mockUpgrade() {
        // Demo function - simulates upgrade
        if (confirm('Demo: Upgrade to Pro tier?\n\n(In production, this would process payment)')) {
            this.setTier('pro');
            
            // Remove overlay
            const overlay = document.getElementById('upgrade-overlay');
            if (overlay) overlay.remove();
            
            // Show success message
            this.showSuccessMessage();
            
            // Reload to apply new tier
            setTimeout(() => location.reload(), 1500);
        }
    }

    showSuccessMessage() {
        const toast = document.createElement('div');
        toast.className = 'upgrade-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">🎉</span>
                <span class="toast-message">Welcome to Pro! Unlocking all features...</span>
            </div>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 1200);
    }
}

// Global instance
window.featureGating = new FeatureGating();

// Expose unlock function for Settings page
window.unlockProTier = () => {
    window.featureGating.setTier('pro');
    location.reload();
};

window.lockToFreeTier = () => {
    window.featureGating.setTier('free');
    location.reload();
};
