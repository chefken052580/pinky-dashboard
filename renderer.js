// Pinky Bot Dashboard - Renderer
console.log('[Dashboard] Initializing...');

// Utility: Format date/time in EST timezone
function formatDateEST(timestamp) {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function formatTimeEST(timestamp) {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

// State
let currentView = 'dashboard';
let currentMonitorView = 'heartbeat';
let activityData = {
    heartbeats: [],
    thinking: [],
    usage: { tokens: 0, exec: 0, files: 0, responses: [] }
};
let notificationCounts = {
    chat: 0,
    tasks: 0,
    filesystem: 0,
    docs: 0,
    research: 0,
    code: 0,
    social: 0,
    business: 0
};

// Notification Badge Manager
function updateBadgeCount(botName, count) {
    notificationCounts[botName] = Math.max(0, count);
    const badge = document.querySelector(`.${botName}-badge`);
    if (badge) {
        badge.textContent = count;
        if (count > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function clearBotBadge(botName) {
    updateBadgeCount(botName, 0);
}

function incrementBadgeCount(botName, amount = 1) {
    updateBadgeCount(botName, notificationCounts[botName] + amount);
}

function getTotalNotificationCount() {
    return Object.values(notificationCounts).reduce((a, b) => a + b, 0);
}

// Global function for inline onclick handlers
window.switchToView = function(viewName) {
    console.log('[Nav] Switching to view:', viewName);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Show target view
    const targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        // Initialize TasksBot when switching to its view
        if (viewId === "tasks-view" && window.tasksBotEnhanced && !window.tasksBotEnhanced.isInitialized) {
            window.tasksBotEnhanced.init();
        }
        targetView.classList.add('active');
        currentView = viewName + '-view';
    }
    
    // Update active button state
    document.querySelectorAll('.bot-button, .view-button').forEach(b => b.classList.remove('active'));
    const clickedButton = document.querySelector(`[data-bot="${viewName}"], [data-view="${viewName}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Clear badge when viewing that bot
    if (notificationCounts.hasOwnProperty(viewName)) {
        clearBotBadge(viewName);
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
    // DISABLED - use GlobalRefresh // // DISABLED - use GlobalRefresh // setInterval(loadActivityData, 30000); // Refresh every 5s
    // DISABLED - use GlobalRefresh // // DISABLED - use GlobalRefresh // setInterval(updateStats, 60000); // Update stats every 10s
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
        // Initialize TasksBot when switching to its view
        if (viewId === "tasks-view" && window.tasksBotEnhanced && !window.tasksBotEnhanced.isInitialized) {
            window.tasksBotEnhanced.init();
        }
        
        // Initialize Settings page when switching to its view
        if (viewId === "social-media-view" && window.initSocialBotUI) {
            window.initSocialBotUI();
        }
        if (viewId === "settings-view" && window.initSettingsPage) {
            window.initSettingsPage();
        }
        
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
        <span class="activity-time">${formatTimeEST(new Date())}</span>
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
    // Fetch activity data from API
    fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/activity')
        .then(r => r.json())
        .then(data => {
            // Extract heartbeats from API response {heartbeats: [...]}
            const heartbeatsArray = data.heartbeats || [];
            activityData = {
                heartbeats: heartbeatsArray,
                heartbeatCount: heartbeatsArray.length
            };
            updateMonitorStats();
            renderMonitorChart(currentMonitorView);
            renderHeaderStats();
            console.log('[Monitor] Loaded activity data from /api/activity: ' + heartbeatsArray.length + ' heartbeats');
        })
        .catch(err => {
            console.error('[Monitor] Failed to load activity data:', err);
        });
}

function updateMonitorStats() {
    // Update last heartbeat
    const lastHB = activityData.heartbeats[activityData.heartbeats.length - 1];
    if (lastHB) {
        const lastHBEl = document.getElementById('last-heartbeat');
        if (lastHBEl) {
            lastHBEl.textContent = formatTimeEST(lastHB.timestamp);
        }
    }
    
    // Update total wakeups
    const wakeupsEl = document.getElementById('total-wakeups');
    if (wakeupsEl) {
        wakeupsEl.textContent = activityData.heartbeats.length;
    }
    
    // Update usage stats
    const tokensEl = document.getElementById('tokens-used'); if (tokensEl) tokensEl.textContent = activityData.usage.tokens.toLocaleString();
    const execEl = document.getElementById('exec-calls'); if (execEl) execEl.textContent = activityData.usage.exec;
    const fileEl = document.getElementById('file-ops'); if (fileEl) fileEl.textContent = activityData.usage.files;
    
    if (activityData.usage.responses.length > 0) {
        const avg = activityData.usage.responses.reduce((a,b) => a+b, 0) / activityData.usage.responses.length;
        const avgEl = document.getElementById('avg-response'); if (avgEl) avgEl.textContent = Math.round(avg) + 'ms';
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
            <span class="activity-time">${formatDateEST(hb.timestamp)}</span>
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
            <span class="activity-time">${formatDateEST(think.timestamp)}</span>
            <span class="activity-bot">Thinking</span>
            <span class="activity-message">${think.task}</span>
        `;
        logEl.appendChild(entry);
    });
    
    // Update stats
    const thinkEl = document.getElementById('think-sessions'); if (thinkEl) thinkEl.textContent = activityData.thinking.length;
    
    // Find peak hour
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
        hourCounts[a] > hourCounts[b] ? a : b, '0');
    const peakEl = document.getElementById('peak-hour'); if (peakEl) peakEl.textContent = peakHour + ':00';
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
            <span class="activity-time">${formatTimeEST(hb.timestamp)}</span>
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

// FileSystemBot - AI File Assistant
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
            <span class="activity-time">${formatTimeEST(new Date())}</span>
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
                <span class="activity-time">${formatTimeEST(new Date())}</span>
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
    toggleApprovals,
    showApprovals: loadApprovals,
    respondApproval,
    clearCacheAndReload: function() { localStorage.clear(); location.reload(true); },
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

// ===== CONSOLIDATED STATS (One System) =====
function renderHeaderStats() {
    const container = document.getElementById('heartbeat-status-container');
    if (!container) return;
    
    // Fetch APIs in parallel, then render
    Promise.all([
        apiFetch('/api/usage', {}, container),
        apiFetch('/api/tasks/stats', {}, container),
        apiFetch('/api/tasks'),
        apiFetch('/api/activity')
    ]).then(([usage, statsResponse, tasks, activity]) => {
        // Handle null responses from failed API calls
        usage = usage || {};
        statsResponse = statsResponse || {};
        tasks = tasks || [];
        activity = activity || {};
        const tokensUsed = usage.totalTokens || 0;
        const apiCost = (usage.totalCost || (usage.costInput || 0) + (usage.costOutput || 0) + (usage.costCacheRead || 0) + (usage.costCacheWrite || 0)) || 0;
        const messages = usage.messages || 0;
        
        // Get stats from /api/tasks/stats
        const stats = statsResponse.stats || {};
        const allCompleted = stats.completed || 0;
        const completionRate = stats.completionRate || '0%';
        const pending = stats.pending || 0;
        
        // Get heartbeat count from /api/activity
        const heartbeatsArray = activity.heartbeats || [];
        const heartbeatCount = heartbeatsArray.length;
        // Also fetch baseline from state file (non-blocking)
        fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/heartbeat/state')
          .then(r => r.json())
          .then(stateData => {
            const baseline = stateData.heartbeatCount || 0;
            const realCount = Math.max(heartbeatsArray.length, baseline);
            const wakeupEl = document.getElementById("total-wakeups");
            if (wakeupEl) wakeupEl.textContent = realCount;
            const hbEl = container.querySelector('.stat-value');
            if (hbEl) hbEl.textContent = realCount;
          }).catch(() => {});
        
        // Calculate tasks completed today (for header only)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tasksToday = Array.isArray(tasks) ? tasks.filter(t => {
            if (t.status !== 'completed') return false;
            const updated = new Date(t.updated || t.assigned);
            const taskDate = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate());
            return taskDate.getTime() === today.getTime();
        }).length : 0;
        
        // Render header stats
        let html = '<div class="heartbeat-status">';
        html += '<h3>💓 Heartbeat Status</h3>';
        html += '<div class="heartbeat-grid">';
        html += '<div class="heartbeat-stat"><span class="stat-label">Heartbeats</span><span class="stat-value">' + heartbeatCount + '</span></div>';
        html += '<div class="heartbeat-stat"><span class="stat-label">Tasks Today</span><span class="stat-value">' + tasksToday + '</span></div>';
        html += '<div class="heartbeat-stat"><span class="stat-label">Pending</span><span class="stat-value">' + pending + '</span></div>';
        html += '<div class="heartbeat-stat"><span class="stat-label">Tokens Used</span><span class="stat-value">' + (tokensUsed / 1000000).toFixed(1) + 'M</span></div>';
        html += '</div></div>';
        container.innerHTML = html;
        
        // Update bottom stat cards with data from /api/tasks/stats and /api/usage
        const tasksCompletedEl = document.getElementById("tasks-completed");
        if (tasksCompletedEl) tasksCompletedEl.textContent = allCompleted;
        const apiCostEl = document.getElementById("api-cost");
        if (apiCostEl) apiCostEl.textContent = "$" + apiCost.toFixed(2);
        const messagesEl = document.getElementById("total-messages");
        if (messagesEl) messagesEl.textContent = messages.toLocaleString();
        const successRateEl = document.getElementById("success-rate");
        if (successRateEl) successRateEl.textContent = completionRate;
        
        // Update heartbeat wakeups display
        const wakeupEl = document.getElementById("total-wakeups");
        if (wakeupEl) wakeupEl.textContent = heartbeatCount;
        
        console.log('[HeaderStats] Updated: ' + heartbeatCount + ' heartbeats, ' + allCompleted + ' tasks, $' + apiCost.toFixed(2) + ' cost, ' + messages + ' messages, ' + completionRate + ' success rate');
    });
}
document.addEventListener('DOMContentLoaded', function() {
    
    renderHeaderStats(); // Run immediately
    // DISABLED - use GlobalRefresh // // DISABLED - use GlobalRefresh // setInterval(renderHeaderStats, 30000); // Then refresh every 30s
    // Wire up GlobalRefresh subscriptions
    if (window.GlobalRefresh) {
        window.GlobalRefresh.on("tasks", function() { renderHeaderStats(); });
        window.GlobalRefresh.on("stats", function() { renderHeaderStats(); });
        window.GlobalRefresh.on("usage", function() { renderHeaderStats(); });
        window.GlobalRefresh.on("activity", function() { loadActivityData(); });
        console.log("[Renderer] Subscribed to GlobalRefresh");
    }
});

// ===== APPROVAL NOTIFICATION SYSTEM =====
let approvalsOpen = false;

function toggleApprovals() {
    const dropdown = document.getElementById('approval-dropdown');
    approvalsOpen = !approvalsOpen;
    dropdown.classList.toggle('hidden', !approvalsOpen);
    if (approvalsOpen) loadApprovals();
}

function loadApprovals() {
    fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/approvals')
        .then(r => r.json())
        .then(data => {
            const badge = document.getElementById('approval-badge');
            const list = document.getElementById('approval-list');
            const count = data.pending.length;
            
            // Update badge
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
            
            // Update list
            if (count === 0) {
                list.innerHTML = '<p class="no-approvals">No pending approvals</p>';
                return;
            }
            
            list.innerHTML = data.pending.map(req => `
                <div class="approval-item" data-id="${req.id}">
                    <h4>📋 ${req.title || "Approval #" + req.id.slice(-6)}</h4>
                    <div class="file">📁 ${req.file || "No file specified"}</div>
                    <div class="description">${req.description || "No description provided"}</div>
                    <textarea placeholder="Add instructions for Pinky (optional)..." id="instructions-${req.id}"></textarea>
                    <div class="approval-buttons">
                        <button class="btn-approve" onclick="respondApproval('${req.id}', true)">✅ Approve</button>
                        <button class="btn-deny" onclick="respondApproval('${req.id}', false)">❌ Deny</button>
                    </div>
                    <div class="approval-time">Requested: ${formatDateEST(req.createdAt)}</div>
                </div>
            `).join('');
        })
        .catch(e => console.error('[Approvals] Load failed:', e));
}

function respondApproval(id, approved) {
    const instructions = document.getElementById('instructions-' + id)?.value || '';
    fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/approvals/' + id + '/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, instructions })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            loadApprovals();
            alert(approved ? '✅ Approved! Pinky can proceed.' : '❌ Denied.');
        }
    })
    .catch(e => console.error('[Approvals] Respond failed:', e));
}

// Check for approvals every 30 seconds
// DISABLED setInterval(() => {
//     fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/approvals')
//         .then(r => r.json())
//         .then(data => {
//             const badge = document.getElementById('approval-badge');
//             if (badge) {
//                 badge.textContent = data.pending.length;
//                 badge.classList.toggle('hidden', data.pending.length === 0);
//             }
//         })
//         .catch(() => {});
// }, 30000);

// Initial check on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadApprovals, 1000);
});
