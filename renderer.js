// v3.0 - Clean rewrite, no template literals
// Pinky Bot Dashboard - Renderer
console.log('[Dashboard] Initializing...');

// Configuration
var CONFIG = {
    mode: 'real',
    backendUrl: 'https://pinky-api.crackerbot.io',
    fallbackToSimulated: true
};

console.log('[Dashboard] Mode:', CONFIG.mode);

// State
var currentView = 'dashboard';
var currentMonitorView = 'heartbeat';
var activityData = {
    heartbeats: [],
    thinking: [],
    usage: { tokens: 0, exec: 0, files: 0, responses: [] }
};

// Global function for inline onclick handlers
window.switchToView = function(viewName) {
    console.log('[Nav] Switching to view:', viewName);
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    var targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName + '-view';
    }
    document.querySelectorAll('.bot-button, .view-button').forEach(function(b) { b.classList.remove('active'); });
    var clickedButton = document.querySelector('[data-bot="' + viewName + '"], [data-view="' + viewName + '"]');
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    if (typeof addActivity === 'function') {
        addActivity('Navigation', 'Switched to ' + viewName + ' view');
    }
};

// Initialize
window.addEventListener('DOMContentLoaded', function() {
    console.log('[Dashboard] DOM loaded');
    initBotButtons();
    initViewButtons();
    initMonitorButtons();
    switchMonitorView('heartbeat');
    loadActivityData();
    setInterval(loadActivityData, 5000);
    setInterval(updateStats, 10000);
});

function initBotButtons() {
    document.querySelectorAll('.bot-button').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var bot = btn.dataset.bot;
            switchView(bot + '-view');
            document.querySelectorAll('.bot-button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            addActivity('Navigation', 'Switched to ' + bot + ' view');
        });
    });
    console.log('[Init] Bot buttons initialized:', document.querySelectorAll('.bot-button').length);
}

function initViewButtons() {
    document.querySelectorAll('.view-button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var view = btn.dataset.view;
            switchView(view + '-view');
        });
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    var targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewId;
    }
}

function quickAction(bot, action) {
    console.log('[Quick Action] ' + bot + ' - ' + action);
    addActivity(bot, 'Quick action: ' + action);
    
    // Log to activity system
    fetch('https://pinky-api.crackerbot.io/api/activity/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            activity: 'Quick action: ' + bot + ' - ' + action,
            lagMs: 0,
            tokens: 0,
            exec: 1
        })
    }).catch(function() {
        console.log('[QuickAction] API not available, using local only');
    });
    
    setTimeout(function() {
        addActivity(bot, 'Completed: ' + action);
        updateTaskCount();
    }, 2000);
}

function addActivity(bot, message) {
    var feed = document.getElementById('activity-feed');
    if (!feed) return;
    var item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = '<span class="activity-time">' + new Date().toLocaleTimeString() + '</span>' +
        '<span class="activity-bot">' + bot + '</span>' +
        '<span class="activity-message">' + message + '</span>';
    feed.insertBefore(item, feed.firstChild);
    while (feed.children.length > 50) {
        feed.removeChild(feed.lastChild);
    }
}

function updateTaskCount() {
    var countEl = document.getElementById('tasks-completed');
    if (countEl) {
        var current = parseInt(countEl.textContent) || 0;
        countEl.textContent = current + 1;
    }
}

function updateStats() {
    var costEl = document.getElementById('cost-saved');
    if (costEl) {
        var current = parseFloat(costEl.textContent.replace('$', '')) || 0;
        costEl.textContent = '$' + (current + 0.25).toFixed(2);
    }
    var speedEl = document.getElementById('speed-gain');
    if (speedEl) {
        var tasksEl = document.getElementById('tasks-completed');
        var tasks = tasksEl ? (parseInt(tasksEl.textContent) || 0) : 0;
        speedEl.textContent = Math.max(1, Math.floor(tasks / 10)) + 'x';
    }
}

function initMonitorButtons() {
    var heartbeatBtn = document.getElementById('monitor-heartbeat');
    var thinkingBtn = document.getElementById('monitor-thinking');
    var peakBtn = document.getElementById('monitor-peak');
    if (heartbeatBtn) heartbeatBtn.addEventListener('click', function() { switchMonitorView('heartbeat'); });
    if (thinkingBtn) thinkingBtn.addEventListener('click', function() { switchMonitorView('thinking'); });
    if (peakBtn) peakBtn.addEventListener('click', function() { switchMonitorView('peak'); });
}

function switchMonitorView(view) {
    currentMonitorView = view;
    document.querySelectorAll('.monitor-btn').forEach(function(btn) { btn.classList.remove('active'); });
    var monBtn = document.getElementById('monitor-' + view);
    if (monBtn) monBtn.classList.add('active');
    document.querySelectorAll('.monitor-content').forEach(function(c) { c.classList.remove('active'); });
    var targetContent = document.getElementById(view + '-content');
    if (targetContent) targetContent.classList.add('active');
    if (activityData && activityData.heartbeats && activityData.heartbeats.length > 0) {
        updateMonitorStats();
    } else {
        loadActivityData();
    }
    renderMonitorChart(view);
}

window.dashboard = window.dashboard || {};
window.dashboard.switchMonitor = switchMonitorView;
window.dashboard.botAction = botAction;
window.dashboard.downloadLogs = downloadLogs;

function loadActivityData() {
    var paths = [
        'https://pinky-api.crackerbot.io/api/activity',
        'http://localhost:3030/api/activity',
        'pinky-activity.json',
        './pinky-activity.json'
    ];
    tryLoadFromPath(0);
    function tryLoadFromPath(index) {
        if (index >= paths.length) {
            console.log('[Activity] All paths failed, using cached data');
            return;
        }
        var url = paths[index];
        if (!url.startsWith('http')) {
            url = url + '?t=' + Date.now();
        }
        fetch(url)
            .then(function(r) {
                if (!r.ok) throw new Error('Not found: ' + paths[index]);
                return r.json();
            })
            .then(function(data) {
                console.log('[Activity] Loaded from:', paths[index]);
                activityData = data;
                updateMonitorStats();
                renderMonitorChart(currentMonitorView);
            })
            .catch(function(err) {
                console.log('[Activity] Path failed:', paths[index], err.message);
                tryLoadFromPath(index + 1);
            });
    }
}

function updateMonitorStats() {
    var lastHB = activityData.heartbeats[activityData.heartbeats.length - 1];
    if (lastHB) {
        var lastHBEl = document.getElementById('last-heartbeat');
        if (lastHBEl) lastHBEl.textContent = new Date(lastHB.timestamp).toLocaleTimeString();
    }
    var wakeupsEl = document.getElementById('total-wakeups');
    if (wakeupsEl) wakeupsEl.textContent = activityData.heartbeats.length;
    
    // Update main stats grid
    var tasksEl = document.getElementById('tasks-completed');
    if (tasksEl) tasksEl.textContent = activityData.heartbeats.length;
    
    var costEl = document.getElementById('cost-saved');
    if (costEl) costEl.textContent = '$' + Math.round(activityData.usage.tokens / 1000) + 'k';
    
    var speedEl = document.getElementById('speed-gain');
    if (speedEl) speedEl.textContent = (activityData.heartbeats.length / 10).toFixed(1) + 'x';
    
    var successEl = document.getElementById('success-rate');
    if (successEl) successEl.textContent = '100%';
    
    // Also update the main Recent Activity feed
    updateRecentActivityFeed();
    
    var tokensEl = document.getElementById('tokens-used');
    if (tokensEl) tokensEl.textContent = activityData.usage.tokens.toLocaleString();
    var execEl = document.getElementById('exec-calls');
    if (execEl) execEl.textContent = activityData.usage.exec;
    var filesEl = document.getElementById('file-ops');
    if (filesEl) filesEl.textContent = activityData.usage.files;
    if (activityData.usage.responses.length > 0) {
        var avg = activityData.usage.responses.reduce(function(a, b) { return a + b; }, 0) / activityData.usage.responses.length;
        var avgEl = document.getElementById('avg-response');
        if (avgEl) avgEl.textContent = Math.round(avg) + 'ms';
    }
}

function renderMonitorChart(view) {
    if (view === 'heartbeat') renderHeartbeatLog();
    else if (view === 'thinking') renderThinkingLog();
    else if (view === 'peak') renderPeakLog();
}

function updateRecentActivityFeed() {
    var feed = document.getElementById('activity-feed');
    if (!feed) return;
    feed.innerHTML = '';
    
    // Show recent heartbeats in the main activity feed
    if (activityData.heartbeats.length === 0) {
        feed.innerHTML = '<div class="activity-item"><span class="activity-message">No activity yet...</span></div>';
        return;
    }
    
    activityData.heartbeats.slice(-10).reverse().forEach(function(hb) {
        var entry = document.createElement('div');
        entry.className = 'activity-item';
        var timeStr = new Date(hb.timestamp).toLocaleTimeString();
        entry.innerHTML = '<span class="activity-time">' + timeStr + '</span>' +
            '<span class="activity-bot">Heartbeat</span>' +
            '<span class="activity-message">' + (hb.activity || 'Activity check') + '</span>';
        feed.appendChild(entry);
    });
}

function renderHeartbeatLog() {
    var logEl = document.getElementById('heartbeat-log');
    if (!logEl) return;
    logEl.innerHTML = '';
    activityData.heartbeats.slice(-20).reverse().forEach(function(hb) {
        var entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = '<span class="activity-time">' + new Date(hb.timestamp).toLocaleString() + '</span>' +
            '<span class="activity-bot">Heartbeat</span>' +
            '<span class="activity-message">' + (hb.activity || 'Check') + ' - ' + hb.lagMs + 'ms lag</span>';
        logEl.appendChild(entry);
    });
}

function renderThinkingLog() {
    var logEl = document.getElementById('thinking-log');
    if (!logEl) return;
    logEl.innerHTML = '';
    if (activityData.thinking.length === 0) {
        logEl.innerHTML = '<div class="activity-item"><span class="activity-message">No thinking sessions yet...</span></div>';
        return;
    }
    activityData.thinking.slice(-10).reverse().forEach(function(think) {
        var entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = '<span class="activity-time">' + new Date(think.timestamp).toLocaleString() + '</span>' +
            '<span class="activity-bot">Thinking</span>' +
            '<span class="activity-message">' + think.task + '</span>';
        logEl.appendChild(entry);
    });
    var thinkEl = document.getElementById('think-sessions');
    if (thinkEl) thinkEl.textContent = activityData.thinking.length;
}

function renderPeakLog() {
    var logEl = document.getElementById('peak-log');
    if (!logEl) return;
    logEl.innerHTML = '';
    activityData.heartbeats.slice(-10).reverse().forEach(function(hb) {
        var entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = '<span class="activity-time">' + new Date(hb.timestamp).toLocaleTimeString() + '</span>' +
            '<span class="activity-bot">Resources</span>' +
            '<span class="activity-message">' + (hb.tokens || 0) + ' tokens, ' + (hb.exec || 0) + ' exec, ' + hb.lagMs + 'ms</span>';
        logEl.appendChild(entry);
    });
}

function downloadLogs() {
    var blob = new Blob([JSON.stringify(activityData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pinky-activity-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

var FileSystemBot = {
    organize: function(path) { addActivity('FileSystemBot', 'Organizing: ' + path); },
    cleanup: function(path) { addActivity('FileSystemBot', 'Cleaning up: ' + path); },
    search: function(query) { addActivity('FileSystemBot', 'Searching: ' + query); },
    backup: function(path) { addActivity('FileSystemBot', 'Backing up: ' + path); }
};

function botAction(bot, action) {
    console.log('[Bot Action] ' + bot + ' - ' + action);
    addActivity(bot, 'Executing: ' + action);
    var botFeed = document.getElementById(bot + '-activity');
    if (botFeed) {
        var entry = document.createElement('div');
        entry.className = 'activity-item';
        entry.innerHTML = '<span class="activity-time">' + new Date().toLocaleTimeString() + '</span>' +
            '<span class="activity-bot">' + bot + '</span>' +
            '<span class="activity-message">' + action + ' started...</span>';
        botFeed.insertBefore(entry, botFeed.firstChild);
    }
    setTimeout(function() {
        addActivity(bot, 'Completed: ' + action);
        if (botFeed) {
            var successEntry = document.createElement('div');
            successEntry.className = 'activity-item';
            successEntry.innerHTML = '<span class="activity-time">' + new Date().toLocaleTimeString() + '</span>' +
                '<span class="activity-bot">' + bot + '</span>' +
                '<span class="activity-message">Completed: ' + action + '</span>';
            botFeed.insertBefore(successEntry, botFeed.firstChild);
        }
        updateTaskCount();
        updateBotStats(bot);
    }, 2000);
}

function updateBotStats(bot) {
    if (bot === 'docs') { incrementStat('docs-generated'); incrementStat('docs-words', 500); }
    else if (bot === 'research') { incrementStat('research-reports'); incrementStat('research-sources', 5); }
    else if (bot === 'code') { incrementStat('code-files'); incrementStat('code-lines', 150); }
    else if (bot === 'social') { incrementStat('social-posts'); }
    else if (bot === 'business') { incrementStat('business-opportunities'); }
}

function incrementStat(statId, amount) {
    if (!amount) amount = 1;
    var el = document.getElementById(statId);
    if (el) {
        var current = parseInt(el.textContent) || 0;
        el.textContent = current + amount;
    }
}

// Make key functions globally available
window.quickAction = quickAction;

window.toggleSidebar = function() {
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var toggle = document.getElementById('menuToggle');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
    if (toggle) toggle.classList.toggle('active');
};

window.closeSidebarOnMobile = function() {
    if (window.innerWidth <= 768) {
        var sidebar = document.querySelector('.sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        var toggle = document.getElementById('menuToggle');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (toggle) toggle.classList.remove('active');
    }
};

var originalSwitchToView = window.switchToView;
window.switchToView = function(viewName) {
    originalSwitchToView(viewName);
    closeSidebarOnMobile();
};

window.dashboard = {
    quickAction: quickAction,
    addActivity: addActivity,
    FileSystemBot: FileSystemBot,
    switchView: switchView,
    switchMonitorView: switchMonitorView,
    downloadLogs: downloadLogs,
    loadActivityData: loadActivityData,
    botAction: botAction,
    toggleSidebar: window.toggleSidebar
};

console.log('[Dashboard] Ready!');

var botTemplates = {
    docs: {
        'daily-log': 'Generate a comprehensive daily log for today.',
        'memory-update': 'Review activities and update MEMORY.md.',
        'project-docs': 'Document the current project.',
        'readme': 'Create a professional README.md.',
        'api-docs': 'Generate API documentation.',
        'changelog': 'Create a changelog.'
    },
    research: {
        'market-analysis': 'Conduct market analysis for [topic].',
        'competitor-research': 'Research competitors for [product/service].',
        'trend-report': 'Identify trends in [industry].',
        'web-search': 'Search the web for [topic].'
    },
    code: {
        'generate-function': 'Generate a [language] function that [description].',
        'refactor-code': 'Refactor the following code: [paste code]',
        'debug-issue': 'Debug this issue: [describe problem]',
        'write-tests': 'Write unit tests for: [paste code]'
    },
    social: {
        'twitter-thread': 'Create a Twitter thread about [topic].',
        'linkedin-post': 'Write a LinkedIn post about [topic].',
        'instagram-caption': 'Create an Instagram caption for [topic].',
        'content-calendar': 'Generate a 7-day content calendar for [topic].'
    },
    business: {
        'opportunity-analysis': 'Analyze this opportunity: [describe].',
        'swot-analysis': 'Conduct a SWOT analysis for [business].',
        'business-plan': 'Create a business plan for [idea].',
        'pitch-deck': 'Generate a pitch deck outline for [idea].'
    },
    filesystem: {
        'organize': 'Organize files in [directory].',
        'cleanup': 'Find and remove duplicates in [directory].',
        'backup': 'Create backup of [directory].',
        'search': 'Find files matching [pattern] in [directory].'
    }
};

window.dashboard.loadTemplate = function(bot, template) {
    if (!template) return;
    var inputEl = document.getElementById(bot + '-input');
    if (inputEl && botTemplates[bot] && botTemplates[bot][template]) {
        inputEl.value = botTemplates[bot][template];
        inputEl.focus();
    }
};

window.dashboard.submitBotTask = function(bot) {
    var inputEl = document.getElementById(bot + '-input');
    var outputEl = document.getElementById(bot + '-output');
    if (!inputEl || !outputEl) return;
    var task = inputEl.value.trim();
    if (!task) { alert('Please enter a task or select a template!'); return; }
    outputEl.innerHTML = '<div class="output-loading">Bot is working on your request...</div>';
    addActivity(bot, 'Task started: ' + task.substring(0, 50) + '...');
    if (CONFIG.mode === 'real') {
        fetch(CONFIG.backendUrl + '/api/bot/' + bot + '/task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: task })
        })
        .then(function(response) {
            if (!response.ok) throw new Error('API failed: ' + response.status);
            return response.json();
        })
        .then(function(data) {
            if (!data.success) throw new Error(data.error || 'Task failed');
            outputEl.innerHTML = '<pre>' + (data.output || 'Task completed') + '</pre>';
            updateBotStats(bot);
            addActivity(bot, 'Task completed!');
        })
        .catch(function(error) {
            console.error('[Bot] Error:', error);
            if (CONFIG.fallbackToSimulated) {
                outputEl.innerHTML = '<pre>SIMULATED (Backend unavailable)\n\nSample output for: ' + task + '</pre>';
            } else {
                outputEl.innerHTML = '<div style="color:#dc3545;padding:20px;">Error: ' + error.message + '</div>';
            }
        });
    } else {
        setTimeout(function() {
            outputEl.innerHTML = '<pre>SIMULATED\n\nSample output for: ' + task + '</pre>';
            updateBotStats(bot);
        }, 2000);
    }
};

window.dashboard.copyOutput = function(bot) {
    var outputEl = document.getElementById(bot + '-output');
    if (!outputEl) return;
    var text = outputEl.innerText;
    if (!text || text.includes('will appear here')) { alert('No output to copy!'); return; }
    navigator.clipboard.writeText(text).then(function() { alert('Copied!'); }).catch(function() { alert('Copy failed.'); });
};

window.dashboard.downloadOutput = function(bot) {
    var outputEl = document.getElementById(bot + '-output');
    if (!outputEl) return;
    var text = outputEl.innerText;
    if (!text || text.includes('will appear here')) { alert('No output to download!'); return; }
    var blob = new Blob([text], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = bot + '-output-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
};

window.dashboard.clearOutput = function(bot) {
    var outputEl = document.getElementById(bot + '-output');
    if (!outputEl) return;
    outputEl.innerHTML = '<div class="output-placeholder">Your generated output will appear here...</div>';
};

window.dashboard.clearCacheAndReload = function() {
    if (!confirm('Clear all cached data and reload?')) return;
    try { localStorage.clear(); } catch(e) {}
    try { sessionStorage.clear(); } catch(e) {}
    window.location.href = window.location.href.split('?')[0] + '?cacheBust=' + Date.now();
};
