/**
 * Coming Soon Placeholder Helper
 * Provides a consistent Coming Soon experience across all unbuilt views
 * PinkyBot.io - Dashboard Component
 */

const ComingSoonHelper = {
    /**
     * Render a styled Coming Soon placeholder
     * @param {string} viewName - The name of the view/bot (e.g., "BusinessBot", "Analytics")
     * @param {string} description - Brief description of what will be available
     * @param {string} icon - Emoji icon for the placeholder (default: 🚧)
     * @returns {HTMLElement} The rendered Coming Soon element
     */
    render(viewName, description, icon = '🚧') {
        const container = document.createElement('div');
        container.className = 'coming-soon-container';
        container.innerHTML = `
            <div class="coming-soon-placeholder">
                <div class="coming-soon-icon">${icon}</div>
                <h3 class="coming-soon-title">Coming Soon</h3>
                <p class="coming-soon-description">${description}</p>
                <p class="coming-soon-pinky-message">
                    🐭 Pinky is working on it! Check back soon for world domination features.
                </p>
            </div>
        `;
        return container;
    },

    /**
     * Render Coming Soon directly into a container element
     * @param {string|HTMLElement} containerSelector - CSS selector or element reference
     * @param {string} viewName - The name of the view/bot
     * @param {string} description - Brief description of what will be available
     * @param {string} icon - Emoji icon for the placeholder (default: 🚧)
     */
    renderInto(containerSelector, viewName, description, icon = '🚧') {
        const container = typeof containerSelector === 'string' 
            ? document.querySelector(containerSelector) 
            : containerSelector;
        
        if (!container) {
            console.error(`[ComingSoonHelper] Container not found: ${containerSelector}`);
            return;
        }

        const placeholder = this.render(viewName, description, icon);
        container.appendChild(placeholder);
    },

    /**
     * Check if a view needs Coming Soon placeholder
     * @param {string} viewId - The ID of the view div (e.g., "business-view")
     * @returns {boolean} True if view exists but is empty/needs placeholder
     */
    needsPlaceholder(viewId) {
        const view = document.getElementById(viewId);
        if (!view) return false; // View doesn't exist

        // Check if view has minimal content (just heading and description)
        const contentElements = view.querySelectorAll('*:not(h2):not(p):not(br)');
        return contentElements.length < 3;
    },

    /**
     * Auto-populate Coming Soon placeholders for empty views
     * Call this after DOM is loaded to automatically add placeholders
     */
    autoPopulate() {
        const viewConfigs = [
            {
                id: 'business-view',
                name: 'BusinessBot',
                description: 'Business analytics, market insights, and financial planning tools.',
                icon: '💼'
            },
            // Add more view configs here as needed
        ];

        viewConfigs.forEach(config => {
            if (this.needsPlaceholder(config.id)) {
                this.renderInto(`#${config.id}`, config.name, config.description, config.icon);
            }
        });
    }
};

// Inline styles for Coming Soon placeholder (consistent with existing theme)
if (!document.getElementById('coming-soon-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'coming-soon-styles';
    styleSheet.textContent = `
        .coming-soon-container {
            width: 100%;
            padding: 20px;
        }

        .coming-soon-placeholder {
            text-align: center;
            padding: 40px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            border: 2px dashed rgba(0, 212, 255, 0.3);
            max-width: 800px;
            margin: 0 auto;
        }

        .coming-soon-icon {
            font-size: 64px;
            margin-bottom: 20px;
            animation: pulse 2s ease-in-out infinite;
        }

        .coming-soon-title {
            color: #00d4ff;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 600;
        }

        .coming-soon-description {
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
            max-width: 600px;
            margin: 0 auto 20px;
            line-height: 1.6;
        }

        .coming-soon-pinky-message {
            color: rgba(0, 212, 255, 0.5);
            font-size: 14px;
            margin-top: 20px;
            font-style: italic;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .coming-soon-placeholder {
                padding: 30px 20px;
            }

            .coming-soon-icon {
                font-size: 48px;
            }

            .coming-soon-title {
                font-size: 24px;
            }

            .coming-soon-description {
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ComingSoonHelper = ComingSoonHelper;
}
