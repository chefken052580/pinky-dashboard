/**
 * CodeBot UI - Recent commits, code stats, syntax errors
 * PinkyBot.io - Dashboard Component
 */

(function() {
    const API_BASE = 'http://192.168.254.4:3030/api/codebot';
    
    /**
     * Load and display recent commits
     */
    async function loadRecentCommits() {
        try {
            const response = await fetch(`${API_BASE}/commits?limit=15`);
            const data = await response.json();
            
            if (data.success && data.commits) {
                const container = document.getElementById('code-commits-list');
                if (!container) return;
                
                if (data.commits.length === 0) {
                    container.innerHTML = '<div class="activity-item">No commits yet</div>';
                    return;
                }
                
                container.innerHTML = data.commits.map(commit => `
                    <div class="activity-item">
                        <span class="commit-hash" style="color:#00d4ff;font-family:monospace;margin-right:10px;">${commit.hash}</span>
                        <span class="commit-author" style="color:rgba(255,255,255,0.6);margin-right:10px;">${commit.author}</span>
                        <span class="commit-time" style="color:rgba(255,255,255,0.4);margin-right:10px;">${commit.time}</span>
                        <span class="commit-message" style="color:white;">${commit.message}</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('[CodeBot] Failed to load commits:', error);
        }
    }
    
    /**
     * Load and display code statistics
     */
    async function loadCodeStats() {
        try {
            const response = await fetch(`${API_BASE}/stats`);
            const data = await response.json();
            
            if (data.success && data.stats) {
                const stats = data.stats;
                
                // Update stat cards
                document.getElementById('code-commits-count').textContent = stats.totalCommits || 0;
                document.getElementById('code-lines-added').textContent = `+${stats.linesAdded || 0}`;
                document.getElementById('code-lines-removed').textContent = `-${stats.linesRemoved || 0}`;
                document.getElementById('code-files-count').textContent = stats.filesChanged || 0;
                
                // Update file type breakdown
                const filesByType = stats.filesByType || {};
                document.getElementById('code-js-files').textContent = filesByType.javascript || 0;
                document.getElementById('code-html-files').textContent = filesByType.html || 0;
                document.getElementById('code-css-files').textContent = filesByType.css || 0;
            }
        } catch (error) {
            console.error('[CodeBot] Failed to load stats:', error);
        }
    }
    
    /**
     * Load and display syntax errors
     */
    async function loadSyntaxErrors() {
        try {
            const response = await fetch(`${API_BASE}/syntax-errors`);
            const data = await response.json();
            
            if (data.success) {
                const container = document.getElementById('code-syntax-errors');
                if (!container) return;
                
                if (!data.errors || data.errors.length === 0) {
                    container.innerHTML = '<div class="activity-item" style="color:#0f0;">✅ No syntax errors detected</div>';
                } else {
                    container.innerHTML = data.errors.slice(0, 10).map(error => `
                        <div class="activity-item" style="color:#ff6b6b;font-family:monospace;font-size:12px;">
                            ${error}
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('[CodeBot] Failed to load syntax errors:', error);
        }
    }
    
    /**
     * Load and display contributors
     */
    async function loadContributors() {
        try {
            const response = await fetch(`${API_BASE}/contributors`);
            const data = await response.json();
            
            if (data.success && data.contributors) {
                const container = document.getElementById('code-contributors');
                if (!container) return;
                
                container.innerHTML = data.contributors.slice(0, 5).map(contributor => `
                    <div class="activity-item">
                        <span style="color:#00d4ff;font-weight:600;">${contributor.name}</span>
                        <span style="color:rgba(255,255,255,0.5);margin-left:10px;">${contributor.commits} commits</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('[CodeBot] Failed to load contributors:', error);
        }
    }
    
    /**
     * Initialize CodeBot UI
     */
    function initCodeBotUI() {
        // Load all data when CodeBot view becomes active
        const codeBotButton = document.querySelector('.bot-button[data-bot="code"]');
        if (codeBotButton) {
            codeBotButton.addEventListener('click', () => {
                setTimeout(() => {
                    loadRecentCommits();
                    loadCodeStats();
                    loadSyntaxErrors();
                    loadContributors();
                }, 100);
            });
        }
        
        // Auto-load if CodeBot view is already visible
        const codeView = document.getElementById('code-view');
        if (codeView && !codeView.classList.contains('hidden')) {
            loadRecentCommits();
            loadCodeStats();
            loadSyntaxErrors();
            loadContributors();
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCodeBotUI);
    } else {
        initCodeBotUI();
    }
    
    // Export for manual refresh
    window.CodeBotUI = {
        refresh() {
            loadRecentCommits();
            loadCodeStats();
            loadSyntaxErrors();
            loadContributors();
        }
    };
})();
