/**
 * Tier Management Integration for Settings Page
 * Adds tier display and demo toggle to settings
 */

// Wait for DOM and featureGating to be ready
function initTierManagement() {
    // Wait for settings page to render
    const checkSettingsReady = setInterval(() => {
        const tierBadge = document.getElementById('current-tier-badge');
        if (tierBadge && window.featureGating) {
            clearInterval(checkSettingsReady);
            setupTierDisplay();
        }
    }, 100);
}

function setupTierDisplay() {
    if (!window.featureGating) {
        console.error('[Tier Management] featureGating not available');
        return;
    }
    
    const tierBadge = document.getElementById('current-tier-badge');
    const tierDescription = document.getElementById('tier-description');
    const toggleBtn = document.getElementById('toggle-tier-btn');
    const demoToggle = document.getElementById('demo-tier-toggle');
    
    // Update display based on current tier
    function updateTierDisplay() {
        const tier = window.featureGating.getTier();
        
        if (!tierBadge || !tierDescription || !toggleBtn) return;
        
        if (tier === 'pro') {
            tierBadge.textContent = '✨ Pro Tier';
            tierBadge.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            tierBadge.style.color = 'white';
            tierDescription.textContent = "You're on the Pro tier with full access to all 9 bots, Analytics, and Settings.";
            toggleBtn.textContent = 'View Pro Benefits';
            toggleBtn.onclick = () => window.featureGating.showUpgradePrompt('Pro Features');
        } else {
            tierBadge.textContent = 'Free Tier';
            tierBadge.style.background = 'rgba(255, 255, 255, 0.1)';
            tierBadge.style.color = '#b0b0b0';
            tierDescription.textContent = "You're on the Free tier with Dashboard, Chat, and TasksBot.";
            toggleBtn.textContent = '✨ Upgrade to Pro';
            toggleBtn.onclick = () => window.featureGating.showUpgradePrompt('All Premium Features');
        }
    }
    
    // Demo toggle button handler
    if (demoToggle) {
        demoToggle.onclick = () => {
            const currentTier = window.featureGating.getTier();
            const newTier = currentTier === 'free' ? 'pro' : 'free';
            
            if (confirm(`Switch to ${newTier.toUpperCase()} tier?\n\n(This is for demo purposes only)`)) {
                window.featureGating.setTier(newTier);
                updateTierDisplay();
                
                // Show success message
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
                    z-index: 10000;
                    font-weight: 600;
                `;
                toast.textContent = `Switched to ${newTier.toUpperCase()} tier! Reload to see changes.`;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => {
                        toast.remove();
                        location.reload();
                    }, 300);
                }, 1500);
            }
        };
    }
    
    // Initial display update
    updateTierDisplay();
    
    console.log('[Tier Management] Initialized in settings');
}

// Initialize when settings page is shown
document.addEventListener('DOMContentLoaded', () => {
    // Listen for view changes to detect when settings is opened
    const observer = new MutationObserver(() => {
        if (document.getElementById('current-tier-badge')) {
            setupTierDisplay();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

// Also try to init immediately if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initTierManagement, 500);
}
