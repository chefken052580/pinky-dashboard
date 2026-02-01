// Pinky Bot Dashboard - Renderer
console.log('[Dashboard] Initializing...');

// Configuration
const CONFIG = {
    // Backend API mode: 'real' or 'simulated'
    mode: 'real', // ACTIVATED! Backend is running!
    
    // Backend API URL (only used in 'real' mode)
    backendUrl: 'http://localhost:3030',
    
    // Fallback to simulated if backend unavailable
    fallbackToSimulated: true
};

console.log('[Dashboard] Mode:', CONFIG.mode);

// State
let currentView = 'dashboard';
let currentMonitorView = 'heartbeat';
let activityData = {
    heartbeats: [],
    thinking: [],
    usage: { tokens: 0, exec: 0, files: 0, responses: [] }
};

// Global function for inline onclick handlers
window.switchToView = function(viewName) {
    console.log('[Nav] Switching to view:', viewName);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Show target view
    const targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName + '-view';
    }
    
    // Update active button state
    document.querySelectorAll('.bot-button, .view-button').forEach(b => b.classList.remove('active'));
    const clickedButton = document.querySelector(`[data-bot="${viewName}"], [data-view="${viewName}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Log activity
    if (typeof addActivity === 'function') {
        addActivity('Navigation', `Switched to ${viewName} view`);
    }
};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    console.log('[Dashboard] DOM loaded');
    initBotButtons();
    initViewButtons();
    initMonitorButtons();
    
    // Initialize monitor view (show heartbeat by default)
    console.log('[Dashboard] Initializing monitor view...');
    switchMonitorView('heartbeat');
    
    loadActivityData();
    setInterval(loadActivityData, 5000); // Refresh every 5s
    setInterval(updateStats, 10000); // Update stats every 10s
});

// Bot Navigation
function initBotButtons() {
    document.querySelectorAll('.bot-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const bot = btn.dataset.bot;
            console.log('[Nav] Switching to bot:', bot);
            
            // Switch to bot view
            switchView(bot + '-view');
            
            // Update active state
            document.querySelectorAll('.bot-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Log activity
            addActivity('Navigation', `Switched to ${bot} view`);
        });
    });
    
    console.log('[Init] Bot buttons initialized:', document.querySelectorAll('.bot-button').length);
}

// View Navigation
function initViewButtons() {
    document.querySelectorAll('.view-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view + '-view');
        });
    });
}

function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Show selected view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewId;
    }
}

// Quick Actions
function quickAction(bot, action) {
    console.log(`[Quick Action] ${bot} - ${action}`);
    addActivity(bot, `Quick action: ${action}`);
    
    // Simulated action - replace with actual bot calls
    setTimeout(() => {
        addActivity(bot, `✅ Completed: ${action}`);
        updateTaskCount();
    }, 2000);
}

// Activity Feed
function addActivity(bot, message) {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;
    
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <span class="activity-time">${new Date().toLocaleTimeString()}</span>
        <span class="activity-bot">${bot}</span>
        <span class="activity-message">${message}</span>
    `;
    
    feed.insertBefore(item, feed.firstChild);
    
    // Keep only last 50 items
    while (feed.children.length > 50) {
        feed.removeChild(feed.lastChild);
    }
}

// Stats Updates
function updateTaskCount() {
    const countEl = document.getElementById('tasks-completed');
    if (countEl) {
        const current = parseInt(countEl.textContent) || 0;
        countEl.textContent = current + 1;
    }
    
    const todayEl = document.getElementById('tasks-today');
    if (todayEl) {
        const current = parseInt(todayEl.textContent.match(/\d+/)?.[0]) || 0;
        todayEl.textContent = `📊 ${current + 1} Tasks Today`;
    }
}

function updateStats() {
    // Simulated stats - replace with actual data
    const costEl = document.getElementById('cost-saved');
    if (costEl) {
        const current = parseFloat(costEl.textContent.replace('$', '')) || 0;
        costEl.textContent = '$' + (current + 0.25).toFixed(2);
    }
    
    const speedEl = document.getElementById('speed-gain');
    if (speedEl) {
        const tasks = parseInt(document.getElementById('tasks-completed')?.textContent) || 0;
        speedEl.textContent = Math.max(1, Math.floor(tasks / 10)) + 'x';
    }
}

// Pinky Activity Monitor
function initMonitorButtons() {
    const heartbeatBtn = document.getElementById('monitor-heartbeat');
    const thinkingBtn = document.getElementById('monitor-thinking');
    const peakBtn = document.getElementById('monitor-peak');
    
    if (heartbeatBtn) {
        heartbeatBtn.addEventListener('click', () => switchMonitorView('heartbeat'));
    }
    if (thinkingBtn) {
        thinkingBtn.addEventListener('click', () => switchMonitorView('thinking'));
    }
    if (peakBtn) {
        peakBtn.addEventListener('click', () => switchMonitorView('peak'));
    }
}

function switchMonitorView(view) {
    console.log('[Monitor] Switching to:', view);
    currentMonitorView = view;
    
    // Update buttons
    document.querySelectorAll('.monitor-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`monitor-${view}`)?.classList.add('active');
    
    // Update content
    document.querySelectorAll('.monitor-content').forEach(c => {
        c.classList.remove('active');
        console.log('[Monitor] Hiding content:', c.id);
    });
    const targetContent = document.getElementById(`${view}-content`);
    if (targetContent) {
        targetContent.classList.add('active');
        console.log('[Monitor] Showing content:', targetContent.id);
    }
    
    // Force update stats when switching views
    if (activityData && activityData.heartbeats && activityData.heartbeats.length > 0) {
        console.log('[Monitor] Force updating stats with', activityData.heartbeats.length, 'heartbeats');
        updateMonitorStats();
    } else {
        console.warn('[Monitor] No activity data available yet!');
        // Force reload data
        loadActivityData();
    }
    
    // Render appropriate chart
    renderMonitorChart(view);
}

// Expose globally for onclick handlers
window.dashboard = window.dashboard || {};
window.dashboard.switchMonitor = switchMonitorView;
window.dashboard.botAction = botAction;
window.dashboard.downloadLogs = downloadLogs;

function loadActivityData() {
    // Try multiple paths for cross-platform compatibility
    const paths = [
        'pinky-activity.json',
        './pinky-activity.json',
        '../pinky-activity.json',
        '/mnt/d/pinky-activity.json',
        'D:/pinky-activity.json'
    ];
    
    // Try each path until one works
    tryLoadFromPath(0);
    
    function tryLoadFromPath(index) {
        if (index >= paths.length) {
            console.log('[Monitor] Could not load activity data from any path');
            return;
        }
        
        fetch(paths[index] + '?t=' + Date.now())
            .then(r => {
                if (!r.ok) throw new Error('Not found');
                return r.json();
            })
            .then(data => {
                console.log('[Monitor] Data loaded successfully!', data);
                activityData = data;
                console.log('[Monitor] activityData updated, heartbeats:', activityData.heartbeats.length);
                updateMonitorStats();
                renderMonitorChart(currentMonitorView);
                console.log('[Monitor] Loaded activity data from:', paths[index]);
            })
            .catch(err => {
                // Try next path
                tryLoadFromPath(index + 1);
            });
    }
}

function updateMonitorStats() {
    console.log('[Monitor] updateMonitorStats called, heartbeats:', activityData.heartbeats.length);
    
    // Update last heartbeat
    const lastHB = activityData.heartbeats[activityData.heartbeats.length - 1];
    if (lastHB) {
        const lastHBEl = document.getElementById('last-heartbeat');
        if (lastHBEl) {
            const timeStr = new Date(lastHB.timestamp).toLocaleTimeString();
            lastHBEl.textContent = timeStr;
            console.log('[Monitor] Updated last heartbeat:', timeStr);
        } else {
            console.warn('[Monitor] Element last-heartbeat not found!');
        }
    }
    
    // Update total wakeups
    const wakeupsEl = document.getElementById('total-wakeups');
    if (wakeupsEl) {
        wakeupsEl.textContent = activityData.heartbeats.length;
        console.log('[Monitor] Updated total wakeups:', activityData.heartbeats.length);
    } else {
        console.warn('[Monitor] Element total-wakeups not found!');
    }
    
    // Update usage stats
    document.getElementById('tokens-used')?.textContent = activityData.usage.tokens.toLocaleString();
    document.getElementById('exec-calls')?.textContent = activityData.usage.exec;
    document.getElementById('file-ops')?.textContent = activityData.usage.files;
    
    if (activityData.usage.responses.length > 0) {
        const avg = activityData.usage.responses.reduce((a,b) => a+b, 0) / activityData.usage.responses.length;
        document.getElementById('avg-response')?.textContent = Math.round(avg) + 'ms';
    }
}

function renderMonitorChart(view) {
    if (view === 'heartbeat') {
        renderHeartbeatLog();
    } else if (view === 'thinking') {
        renderThinkingLog();
    } else if (view === 'peak') {
        renderPeakLog();
    }
}

function renderHeartbeatLog() {
    const logEl = document.getElementById('heartbeat-log');
    if (!logEl) return;
    
    logEl.innerHTML = '';
    activityData.heartbeats.slice(-20).reverse().forEach(hb => {
        const entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = `
            <span class="activity-time">${new Date(hb.timestamp).toLocaleString()}</span>
            <span class="activity-bot">Heartbeat</span>
            <span class="activity-message">${hb.activity || 'Check'} - ${hb.lagMs}ms lag</span>
        `;
        logEl.appendChild(entry);
    });
}

function renderThinkingLog() {
    const logEl = document.getElementById('thinking-log');
    if (!logEl) return;
    
    logEl.innerHTML = '';
    
    if (activityData.thinking.length === 0) {
        logEl.innerHTML = '<div class="activity-item"><span class="activity-message">No thinking sessions yet...</span></div>';
        return;
    }
    
    // Group by hour
    const hourCounts = {};
    activityData.thinking.forEach(t => {
        const hour = new Date(t.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // Show recent thinking sessions
    activityData.thinking.slice(-10).reverse().forEach(think => {
        const entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = `
            <span class="activity-time">${new Date(think.timestamp).toLocaleString()}</span>
            <span class="activity-bot">Thinking</span>
            <span class="activity-message">${think.task}</span>
        `;
        logEl.appendChild(entry);
    });
    
    // Update stats
    document.getElementById('think-sessions')?.textContent = activityData.thinking.length;
    
    // Find peak hour
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
        hourCounts[a] > hourCounts[b] ? a : b, '0');
    document.getElementById('peak-hour')?.textContent = peakHour + ':00';
}

function renderPeakLog() {
    const logEl = document.getElementById('peak-log');
    if (!logEl) return;
    
    logEl.innerHTML = '';
    
    // Show resource usage over time
    activityData.heartbeats.slice(-10).reverse().forEach(hb => {
        const entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = `
            <span class="activity-time">${new Date(hb.timestamp).toLocaleTimeString()}</span>
            <span class="activity-bot">Resources</span>
            <span class="activity-message">
                ${hb.tokens || 0} tokens, ${hb.exec || 0} exec, ${hb.lagMs}ms
            </span>
        `;
        logEl.appendChild(entry);
    });
}

function downloadLogs() {
    const blob = new Blob([JSON.stringify(activityData, null, 2)], 
        { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pinky-activity-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

// FileSystemBot - Pinky's personal slave
const FileSystemBot = {
    async organize(path) {
        console.log('[FileSystemBot] Organizing:', path);
        addActivity('FileSystemBot', `Organizing: ${path}`);
        // TODO: Implement file organization logic
        return { success: true, filesOrganized: 0 };
    },
    
    async cleanup(path) {
        console.log('[FileSystemBot] Cleanup:', path);
        addActivity('FileSystemBot', `Cleaning up: ${path}`);
        // TODO: Implement cleanup logic
        return { success: true, filesRemoved: 0 };
    },
    
    async search(query) {
        console.log('[FileSystemBot] Searching for:', query);
        addActivity('FileSystemBot', `Searching: ${query}`);
        // TODO: Implement search logic
        return { success: true, results: [] };
    },
    
    async backup(path) {
        console.log('[FileSystemBot] Backing up:', path);
        addActivity('FileSystemBot', `Backing up: ${path}`);
        // TODO: Implement backup logic
        return { success: true, backupPath: '' };
    }
};

// Bot Actions
function botAction(bot, action) {
    console.log(`[Bot Action] ${bot} - ${action}`);
    addActivity(bot, `Executing: ${action}`);
    
    // Add to bot-specific feed
    const botFeed = document.getElementById(`${bot}-activity`);
    if (botFeed) {
        const entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = `
            <span class="activity-time">${new Date().toLocaleTimeString()}</span>
            <span class="activity-bot">${bot}</span>
            <span class="activity-message">⚡ ${action} started...</span>
        `;
        botFeed.insertBefore(entry, botFeed.firstChild);
    }
    
    // Simulated action - replace with actual bot integration
    setTimeout(() => {
        addActivity(bot, `✅ Completed: ${action}`);
        if (botFeed) {
            const successEntry = document.createElement('div');
            successEntry.className = 'activity-item';
            successEntry.innerHTML = `
                <span class="activity-time">${new Date().toLocaleTimeString()}</span>
                <span class="activity-bot">${bot}</span>
                <span class="activity-message">✅ ${action} completed!</span>
            `;
            botFeed.insertBefore(successEntry, botFeed.firstChild);
        }
        updateTaskCount();
        updateBotStats(bot);
    }, 2000);
}

function updateBotStats(bot) {
    // Update bot-specific stats
    if (bot === 'docs') {
        incrementStat('docs-generated');
        incrementStat('docs-words', 500);
    } else if (bot === 'research') {
        incrementStat('research-reports');
        incrementStat('research-sources', 5);
    } else if (bot === 'code') {
        incrementStat('code-files');
        incrementStat('code-lines', 150);
    } else if (bot === 'social') {
        incrementStat('social-posts');
    } else if (bot === 'business') {
        incrementStat('business-opportunities');
    }
}

function incrementStat(statId, amount = 1) {
    const el = document.getElementById(statId);
    if (el) {
        const current = parseInt(el.textContent) || 0;
        el.textContent = current + amount;
    }
}

// Mobile sidebar toggle
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('menuToggle');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    toggle.classList.toggle('active');
};

// Close sidebar when clicking a nav item on mobile
window.closeSidebarOnMobile = function() {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const toggle = document.getElementById('menuToggle');
        
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        toggle.classList.remove('active');
    }
};

// Update switchToView to close sidebar on mobile
const originalSwitchToView = window.switchToView;
window.switchToView = function(viewName) {
    originalSwitchToView(viewName);
    closeSidebarOnMobile();
};

// Export for console access
window.dashboard = {
    quickAction,
    addActivity,
    FileSystemBot,
    switchView,
    switchMonitorView,
    downloadLogs,
    loadActivityData,
    botAction,
    toggleSidebar
};

console.log('[Dashboard] Ready! Use window.dashboard to access functions.');

// Bot Interaction Functions

// Template definitions
const botTemplates = {
    docs: {
        'daily-log': 'Generate a comprehensive daily log for today including all completed tasks, conversations, and decisions made.',
        'memory-update': 'Review today\'s activities and update MEMORY.md with significant learnings, decisions, and context worth preserving.',
        'project-docs': 'Document the current project including purpose, architecture, tech stack, setup instructions, and usage examples.',
        'readme': 'Create a professional README.md file for this project with installation, usage, features, and contribution guidelines.',
        'api-docs': 'Generate API documentation including all endpoints, request/response formats, authentication, and examples.',
        'changelog': 'Create a changelog documenting recent changes, new features, bug fixes, and breaking changes.'
    },
    research: {
        'market-analysis': 'Conduct comprehensive market analysis for [topic] including market size, trends, competitors, and opportunities.',
        'competitor-research': 'Research and analyze competitors for [product/service] including strengths, weaknesses, pricing, and market position.',
        'trend-report': 'Identify and analyze current trends in [industry] including emerging technologies, consumer behavior, and future predictions.',
        'web-search': 'Search the web for information about [topic] and compile relevant findings with sources.'
    },
    code: {
        'generate-function': 'Generate a [language] function that [description] with proper error handling, documentation, and tests.',
        'refactor-code': 'Refactor the following code to improve readability, performance, and maintainability: [paste code]',
        'debug-issue': 'Debug this code issue: [describe problem] Code: [paste code]',
        'write-tests': 'Write comprehensive unit tests for the following code: [paste code]'
    },
    social: {
        'twitter-thread': 'Create an engaging Twitter thread about [topic] with 5-7 tweets, hooks, and call-to-action.',
        'linkedin-post': 'Write a professional LinkedIn post about [topic] that provides value and encourages engagement.',
        'instagram-caption': 'Create an Instagram caption for [topic] with relevant hashtags and emoji.',
        'content-calendar': 'Generate a 7-day social media content calendar for [brand/topic] with post ideas and timing.'
    },
    business: {
        'opportunity-analysis': 'Analyze this business opportunity: [describe] including risks, potential ROI, and recommended actions.',
        'swot-analysis': 'Conduct a SWOT analysis for [business/product] identifying strengths, weaknesses, opportunities, and threats.',
        'business-plan': 'Create a business plan outline for [idea] including executive summary, market analysis, financial projections.',
        'pitch-deck': 'Generate an outline for a pitch deck for [business idea] including problem, solution, market, and ask.'
    },
    filesystem: {
        'organize': 'Organize files in [directory] by type, date, or [criteria]',
        'cleanup': 'Find and remove duplicate files, temporary files, and unused files in [directory]',
        'backup': 'Create backup of [directory] with timestamp',
        'search': 'Find all files matching [pattern] in [directory]'
    }
};

// Load template into input field
window.dashboard.loadTemplate = function(bot, template) {
    if (!template) return;
    
    const inputEl = document.getElementById(`${bot}-input`);
    if (inputEl && botTemplates[bot] && botTemplates[bot][template]) {
        inputEl.value = botTemplates[bot][template];
        inputEl.focus();
    }
};

// Submit bot task
window.dashboard.submitBotTask = async function(bot) {
    const inputEl = document.getElementById(`${bot}-input`);
    const outputEl = document.getElementById(`${bot}-output`);
    const submitBtn = event?.target;
    
    if (!inputEl || !outputEl) return;
    
    const task = inputEl.value.trim();
    if (!task) {
        alert('Please enter a task or select a template!');
        return;
    }
    
    // Disable button and show loading
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Processing...';
    }
    
    outputEl.innerHTML = '<div class="output-loading">🤖 Bot is working on your request...<br>This may take a moment...</div>';
    
    // Log activity
    addActivity(bot, `Task started: ${task.substring(0, 50)}...`);
    
    try {
        let result;
        
        if (CONFIG.mode === 'real') {
            // REAL bot processing via backend API!
            console.log('[Bot] Using REAL backend API at', CONFIG.backendUrl);
            
            try {
                const response = await fetch(`${CONFIG.backendUrl}/api/bot/${bot}/task`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ task })
                });
                
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Task failed');
                }
                
                // Display REAL result from OpenClaw!
                result = data.output || 'Task completed (no output)';
                
            } catch (apiError) {
                console.error('[Bot] Backend API error:', apiError);
                
                if (CONFIG.fallbackToSimulated) {
                    console.warn('[Bot] Falling back to simulated mode...');
                    result = await simulateBotTask(bot, task);
                    result = '⚠️ SIMULATED (Backend unavailable)\n\n' + result;
                } else {
                    throw apiError;
                }
            }
            
        } else {
            // Simulated mode
            console.log('[Bot] Using SIMULATED mode');
            result = await simulateBotTask(bot, task);
            result = '🎭 SIMULATED MODE\n\n' + result;
        }
        
        // Display result
        outputEl.innerHTML = `<pre>${result}</pre>`;
        
        // Update stats
        updateBotStats(bot);
        addActivity(bot, '✅ Task completed successfully!');
        
        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Generate';
        }
        
    } catch (error) {
        console.error('[Bot] Task error:', error);
        outputEl.innerHTML = `<div style="color:#dc3545;padding:20px;">
            ❌ Error: ${error.message}<br><br>
            Please try again or contact support.
        </div>`;
        
        addActivity(bot, '❌ Task failed: ' + error.message);
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Generate';
        }
    }
};

// Simulate bot task (replace with real API integration)
async function simulateBotTask(bot, task) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate sample output based on bot type
    const outputs = {
        docs: `# Documentation Generated

## Task: ${task}

### Overview
This is a sample documentation output. In a real implementation, this would:
- Connect to your actual bot system
- Process the request using OpenClaw sessions
- Return real generated documentation

### Next Steps
1. Integrate with OpenClaw sessions API
2. Connect to actual bot command handlers
3. Store and retrieve results from your system

Generated at: ${new Date().toLocaleString()}`,

        research: `# Research Results

## Query: ${task}

### Findings
1. **Key Insight #1**: Sample finding based on your query
2. **Key Insight #2**: Market trends and data points
3. **Key Insight #3**: Competitor analysis

### Sources
- Source 1 (example.com)
- Source 2 (research.com)
- Source 3 (industry-report.com)

### Recommendations
Based on the research, consider these action items...

Compiled at: ${new Date().toLocaleString()}`,

        code: `// Code Generated

/* 
 * Task: ${task}
 * Generated: ${new Date().toLocaleString()}
 */

function generatedFunction(param1, param2) {
    // TODO: Replace with actual code generation
    // This is a sample output showing what the bot would generate
    
    try {
        // Implementation logic here
        return {
            success: true,
            data: param1 + param2
        };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Export for use
module.exports = { generatedFunction };`,

        social: `📱 Social Media Content

Task: ${task}

🔥 POST DRAFT:

[Your engaging social media post would appear here]

Key elements:
✅ Attention-grabbing hook
✅ Value proposition
✅ Call to action
✅ Relevant hashtags

#hashtag1 #hashtag2 #hashtag3

---
Ready to post! Review and customize as needed.
Generated: ${new Date().toLocaleString()}`,

        business: `📊 Business Analysis

## ${task}

### Executive Summary
Sample business analysis output. Real implementation would provide:

### Key Metrics
- Market Size: $XXX million
- Growth Rate: XX%
- Target Audience: [Segments]

### Opportunities
1. Opportunity #1
2. Opportunity #2
3. Opportunity #3

### Risk Assessment
- Risk Level: Medium
- Mitigation Strategies: [Listed here]

### Recommendations
Based on analysis, recommend...

Prepared: ${new Date().toLocaleString()}`,

        filesystem: `📁 FileSystem Operation Result

Task: ${task}

Operation: Simulated
Status: ✅ Success

In real implementation, this would:
- Execute actual file operations
- Return detailed results
- Show files affected

Sample output for demonstration purposes.
Executed at: ${new Date().toLocaleString()}`
    };
    
    return outputs[bot] || `✅ Task completed: ${task}\n\nResult would appear here in full implementation.`;
}

// Copy output to clipboard
window.dashboard.copyOutput = function(bot) {
    const outputEl = document.getElementById(`${bot}-output`);
    if (!outputEl) return;
    
    const text = outputEl.innerText;
    if (!text || text.includes('will appear here')) {
        alert('No output to copy!');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Output copied to clipboard!');
        addActivity(bot, 'Output copied to clipboard');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('❌ Failed to copy. Please select and copy manually.');
    });
};

// Download output as file
window.dashboard.downloadOutput = function(bot) {
    const outputEl = document.getElementById(`${bot}-output`);
    if (!outputEl) return;
    
    const text = outputEl.innerText;
    if (!text || text.includes('will appear here')) {
        alert('No output to download!');
        return;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bot}-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    addActivity(bot, 'Output downloaded');
};

// Clear output
window.dashboard.clearOutput = function(bot) {
    const outputEl = document.getElementById(`${bot}-output`);
    if (!outputEl) return;
    
    outputEl.innerHTML = '<div class="output-placeholder">Your generated output will appear here...</div>';
    addActivity(bot, 'Output cleared');
};


// Clear Cache and Reload
window.dashboard.clearCacheAndReload = async function() {
    console.log('[Cache] Clearing all caches and reloading...');
    
    try {
        // Show confirmation
        if (!confirm('🔄 Clear all cached data and reload?\n\nThis will:\n• Clear localStorage\n• Clear sessionStorage\n• Clear browser cache\n• Force reload the page')) {
            return;
        }
        
        // Clear localStorage
        try {
            localStorage.clear();
            console.log('[Cache] localStorage cleared');
        } catch (e) {
            console.warn('[Cache] Could not clear localStorage:', e);
        }
        
        // Clear sessionStorage
        try {
            sessionStorage.clear();
            console.log('[Cache] sessionStorage cleared');
        } catch (e) {
            console.warn('[Cache] Could not clear sessionStorage:', e);
        }
        
        // Clear Service Worker caches if available
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('[Cache] Service Worker caches cleared:', cacheNames.length);
            } catch (e) {
                console.warn('[Cache] Could not clear Service Worker caches:', e);
            }
        }
        
        // Unregister service workers if any
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(
                    registrations.map(registration => registration.unregister())
                );
                console.log('[Cache] Service Workers unregistered:', registrations.length);
            } catch (e) {
                console.warn('[Cache] Could not unregister Service Workers:', e);
            }
        }
        
        console.log('[Cache] All caches cleared! Reloading...');
        
        // Force hard reload (bypass cache)
        // Use location.reload(true) for older browsers, or cache-busting URL for modern ones
        window.location.href = window.location.href.split('?')[0] + '?cacheBust=' + Date.now();
        
    } catch (error) {
        console.error('[Cache] Error clearing cache:', error);
        alert('❌ Error clearing cache: ' + error.message + '\n\nTry manually clearing browser cache in settings.');
    }
};

// Also add cache-busting to all fetch calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
    let url = args[0];
    if (typeof url === 'string' && url.includes('pinky-activity.json')) {
        // Add timestamp to prevent caching
        url = url.split('?')[0] + '?t=' + Date.now();
        args[0] = url;
        console.log('[Fetch] Cache-busted URL:', url);
    }
    return originalFetch.apply(this, args);
};

