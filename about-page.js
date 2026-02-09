/**
 * ABOUT PAGE
 * Shows PinkyBot version, system info, credits, and links
 */

class AboutPage {
    constructor() {
        this.version = '1.0.0';
        this.releaseDate = '2026-02-06';
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        console.log('[AboutPage] Initialized');
        this.initialized = true;
    }

    /**
     * Render the about page HTML
     */
    async render() {
        const container = document.getElementById('about-view');
        if (!container) {
            console.warn('[AboutPage] Container #about-view not found');
            return;
        }

        // Fetch system info
        let systemInfo = {
            uptime: 'Loading...',
            model: 'Loading...',
            status: 'Loading...'
        };

        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                const data = await response.json();
                systemInfo = {
                    uptime: this.formatUptime(data.uptime),
                    model: data.model || 'Unknown',
                    status: data.status || 'Unknown',
                    gateway: data.mode || 'Unknown'
                };
            }
        } catch (error) {
            console.warn('[AboutPage] Could not fetch system info:', error);
        }

        const html = `
            <div class="about-container">
                <div class="about-header">
                    <div class="about-logo">🐭</div>
                    <h1>PinkyBot.io</h1>
                    <p class="about-tagline">Your Autonomous AI Assistant</p>
                </div>

                <div class="about-grid">
                    <!-- Version & Release Info -->
                    <div class="about-card">
                        <h2>📦 Product Info</h2>
                        <div class="about-info">
                            <div class="info-row">
                                <span class="info-label">Version:</span>
                                <span class="info-value">${this.version}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Release Date:</span>
                                <span class="info-value">${this.releaseDate}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Platform:</span>
                                <span class="info-value">PinkyBot.io</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">License:</span>
                                <span class="info-value">Proprietary</span>
                            </div>
                        </div>
                    </div>

                    <!-- System Status -->
                    <div class="about-card">
                        <h2>⚡ System Status</h2>
                        <div class="about-info">
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="info-value status-${systemInfo.status.toLowerCase()}">${systemInfo.status}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Uptime:</span>
                                <span class="info-value">${systemInfo.uptime}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">AI Model:</span>
                                <span class="info-value">${systemInfo.model}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Gateway:</span>
                                <span class="info-value">${systemInfo.gateway}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Features -->
                    <div class="about-card">
                        <h2>✨ Key Features</h2>
                        <ul class="features-list">
                            <li>🤖 7-Bot AI Army (specialized tasks)</li>
                            <li>💾 Real-time task management</li>
                            <li>📊 Analytics & metrics dashboard</li>
                            <li>🌙 Dark/Light theme support</li>
                            <li>📱 Mobile-responsive design</li>
                            <li>💬 Chat with Pinky AI</li>
                            <li>📤 Export & backup system</li>
                            <li>⚙️ Persistent settings</li>
                        </ul>
                    </div>

                    <!-- Bot Army -->
                    <div class="about-card">
                        <h2>🤖 Bot Army</h2>
                        <ul class="bots-list">
                            <li><span class="bot-icon">💬</span> <strong>Chat</strong> - Talk to Pinky</li>
                            <li><span class="bot-icon">🎯</span> <strong>TasksBot</strong> - Project manager</li>
                            <li><span class="bot-icon">📁</span> <strong>FileSystemBot</strong> - File operations</li>
                            <li><span class="bot-icon">📝</span> <strong>DocsBot</strong> - Documentation</li>
                            <li><span class="bot-icon">🔍</span> <strong>ResearchBot</strong> - Research & analysis</li>
                            <li><span class="bot-icon">💻</span> <strong>CodeBot</strong> - Code & development</li>
                            <li><span class="bot-icon">📱</span> <strong>SocialBot</strong> - Social media posts</li>
                        </ul>
                    </div>

                    <!-- Creator & Credits -->
                    <div class="about-card">
                        <h2>👨‍💻 Creator</h2>
                        <div class="about-info">
                            <div class="info-row">
                                <span class="info-label">Created by:</span>
                                <span class="info-value">Ken (Lord_Cracker)</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Powered by:</span>
                                <span class="info-value">PinkyBot AI Engine</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Assistant:</span>
                                <span class="info-value">Pinky 🐭 (AI Sidekick)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tech Stack -->
                    <div class="about-card">
                        <h2>🛠️ Tech Stack</h2>
                        <ul class="features-list">
                            <li><strong>Backend:</strong> Node.js 18+ (Express.js)</li>
                            <li><strong>Frontend:</strong> Vanilla JavaScript (ES6+)</li>
                            <li><strong>UI:</strong> Custom CSS, Chart.js, Grid/Flexbox</li>
                            <li><strong>Storage:</strong> JSON file-based (memory/)</li>
                            <li><strong>Process:</strong> PM2 process manager</li>
                            <li><strong>Git:</strong> Version control & pre-commit hooks</li>
                        </ul>
                    </div>

                    <!-- Architecture -->
                    <div class="about-card">
                        <h2>🏗️ Architecture</h2>
                        <div class="arch-diagram">
                            <div class="arch-layer"><span class="arch-box">📱 Dashboard UI</span></div>
                            <div class="arch-arrow">⬇️</div>
                            <div class="arch-layer"><span class="arch-box">🔌 REST API</span> <span class="arch-box">⚡ Express Server</span></div>
                            <div class="arch-arrow">⬇️</div>
                            <div class="arch-layer"><span class="arch-box">🧠 AI Engine</span> <span class="arch-box">🤖 Bot Army</span></div>
                            <div class="arch-arrow">⬇️</div>
                            <div class="arch-layer"><span class="arch-box">💾 JSON Storage</span> <span class="arch-box">📂 Filesystem</span></div>
                        </div>
                    </div>

                    <!-- API Endpoints -->
                    <div class="about-card">
                        <h2>🔌 API Endpoints</h2>
                        <ul class="endpoints-list">
                            <li><code>GET /api/tasks</code> - List all tasks</li>
                            <li><code>POST /api/tasks</code> - Update task status</li>
                            <li><code>GET /api/usage</code> - Token usage stats</li>
                            <li><code>GET /api/activity</code> - Activity log</li>
                            <li><code>GET /api/health</code> - System health check</li>
                            <li><code>GET /api/code/*</code> - Code stats & commits</li>
                            <li><code>GET /api/docs/*</code> - Documentation</li>
                            <li><code>GET /api/research/*</code> - Research data</li>
                        </ul>
                    </div>

                    <!-- Links & Resources -->
                    <div class="about-card">
                        <h2>🔗 Resources</h2>
                        <div class="links-list">
                            <a href="https://pinkybot.io" target="_blank" class="about-link">📌 Official Website</a>
                            <a href="https://github.com/chefken052580/pinky-dashboard" target="_blank" class="about-link">💾 GitHub Repository</a>
                            <a href="https://docs.pinkybot.io" target="_blank" class="about-link">📚 Documentation</a>
                            <a href="https://discord.gg/pinkybot" target="_blank" class="about-link">💬 Discord Community</a>
                        </div>
                    </div>
                </div>

                <div class="about-footer">
                    <p>PinkyBot.io © 2026 - All rights reserved</p>
                    <p>Built with ❤️ by Ken and Pinky AI</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Format uptime seconds to human-readable format
     */
    formatUptime(seconds) {
        if (!seconds) return 'N/A';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    destroy() {
        this.initialized = false;
    }
}

// Create global instance
let aboutPageInstance = null;

// Initialize and render when view is switched
window.addEventListener('view-switched', (e) => {
    if (e.detail?.view === 'about') {
        if (!aboutPageInstance) {
            aboutPageInstance = new AboutPage();
            aboutPageInstance.init();
        }
        aboutPageInstance.render();
    }
});

// Also expose class
window.AboutPage = AboutPage;
