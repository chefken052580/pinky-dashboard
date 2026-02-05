// Pinky Bot Dashboard - Renderer
console.log('[Dashboard] Initializing...');

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
        addActivity(bot, `âœ… Completed: ${action}`);
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
        todayEl.textContent = `ðŸ“Š ${current + 1} Tasks Today`;
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
    currentMonitorView = view;
    
    // Update buttons
    document.querySelectorAll('.monitor-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`monitor-${view}`)?.classList.add('active');
    
    // Update content
    document.querySelectorAll('.monitor-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${view}-content`)?.classList.add('active');
    
    // Render appropriate chart
    renderMonitorChart(view);
}

function loadActivityData() {
    // Try multiple paths for cross-platform compatibility
    const paths = [
        '../pinky-activity.json',
        'pinky-activity.json',
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
                activityData = data;
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
    // Update last heartbeat
    const lastHB = activityData.heartbeats[activityData.heartbeats.length - 1];
    if (lastHB) {
        const lastHBEl = document.getElementById('last-heartbeat');
        if (lastHBEl) {
            lastHBEl.textContent = new Date(lastHB.timestamp).toLocaleTimeString();
        }
    }
    
    // Update total wakeups
    const wakeupsEl = document.getElementById('total-wakeups');
    if (wakeupsEl) {
        wakeupsEl.textContent = activityData.heartbeats.length;
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
            <span class="activity-bot">${(hb.activity || '').startsWith('Dashboard Chat:') ? 'Chat' : 'Heartbeat'}</span>
            <span class="activity-message">${hb.activity || 'Check'}${hb.lagMs !== undefined ? ' - ' + hb.lagMs + 'ms lag' : ''}</span>
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
                ${hb.tokens || 0} tokens, ${hb.exec || 0} exec, ${hb.lagMs || 0}ms
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
            <span class="activity-message">âš¡ ${action} started...</span>
        `;
        botFeed.insertBefore(entry, botFeed.firstChild);
    }
    
    // Simulated action - replace with actual bot integration
    setTimeout(() => {
        addActivity(bot, `âœ… Completed: ${action}`);
        if (botFeed) {
            const successEntry = document.createElement('div');
            successEntry.className = 'activity-item';
            successEntry.innerHTML = `
                <span class="activity-time">${new Date().toLocaleTimeString()}</span>
                <span class="activity-bot">${bot}</span>
                <span class="activity-message">âœ… ${action} completed!</span>
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

// Export for console access
window.dashboard = {
    quickAction,
    addActivity,
    FileSystemBot,
    switchView,
    switchMonitorView,
    downloadLogs,
    loadActivityData,
    botAction
};

console.log('[Dashboard] Ready! Use window.dashboard to access functions.');
