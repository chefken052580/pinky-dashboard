/**
 * Bot Manager — Command Center for Pinky's Bot Army
 * Full CRUD, live stats, task tracking, cross-referencing, scheduling
 */
(function() {
  'use strict';
  var API = (typeof API_BASE !== 'undefined' ? API_BASE : '') || '';
  var selectedBot = null;
  var botData = {};
  var refreshTimer = null;

  var BOT_META = {
    DocsBot:       { icon: '\ud83d\udcdd', role: 'Documentation Writer', desc: 'Generates READMEs, guides, API docs, changelogs. Cross-refs CodeBot for accuracy.', color: '#60a5fa', schedule: 'On task + daily doc audit' },
    ResearchBot:   { icon: '\ud83d\udd0d', role: 'Intelligence Gatherer', desc: 'Web research, market analysis, competitive intel, trend reports. Feeds BusinessBot.', color: '#f59e0b', schedule: 'Standing orders + overnight missions' },
    CodeBot:       { icon: '\ud83d\udcbb', role: 'Code Engineer', desc: 'Writes, debugs, refactors code. Runs escalation pipeline. Cross-refs DocsBot.', color: '#8b5cf6', schedule: 'On task + code review cycles' },
    SocialBot:     { icon: '\ud83d\udcf1', role: 'Social Media Manager', desc: 'Creates and schedules posts across 8 platforms. Uses ResearchBot intel.', color: '#ec4899', schedule: '3x daily posts + engagement' },
    BusinessBot:   { icon: '\ud83d\udcbc', role: 'Business Operations', desc: 'Invoicing, client management, analytics, financial reports.', color: '#10b981', schedule: 'Daily reports + on demand' },
    FileSystemBot: { icon: '\ud83d\udcc1', role: 'File Operations', desc: 'Organizes workspace, manages backups, cleans temp files, monitors disk.', color: '#6366f1', schedule: 'Hourly cleanup + on demand' },
    TasksBot:      { icon: '\ud83d\udccb', role: 'Task Manager', desc: 'Manages task queue, tracks completion, handles verification flow.', color: '#06b6d4', schedule: '24/7 - every heartbeat' },
    CryptoBot:     { icon: '\ud83e\ude99', role: 'Wallet & DeFi Manager', desc: 'Solana wallet integration, DEX screening, token tracking, alerts.', color: '#f97316', schedule: 'Real-time monitoring' },
    DiaryBot:      { icon: '\ud83d\udcd2', role: 'Personal Scribe', desc: 'Logs all activity, stores knowledge, tracks escalation costs, memory map.', color: '#a855f7', schedule: '24/7 - passive logging' }
  };

  window.initBotManager = async function() {
    var container = document.getElementById('settings-content');
    if (!container) return;
    container.innerHTML = renderManagerShell();
    await loadAllBotData();
    renderFleetOverview();
    renderBotGrid();
    startAutoRefresh();
  };

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(async function() {
      await loadAllBotData();
      renderFleetOverview();
      renderBotGrid();
      if (selectedBot) renderBotDetail(selectedBot);
    }, 15000);
  }

  async function loadAllBotData() {
    try {
      var results = await Promise.all([
        safeFetch(API + '/api/bots'),
        safeFetch(API + '/api/tasks'),
        safeFetch(API + '/api/bots/debug/active'),
        safeFetch(API + '/api/bots/learning')
      ]);
      var bots = Array.isArray(results[0]) ? results[0] : (results[0].bots || []);
      var tasks = Array.isArray(results[1]) ? results[1] : (results[1].tasks || []);
      var debug = Array.isArray(results[2]) ? results[2] : [];
      var learning = results[3] || {};

      bots.forEach(function(bot) {
        var name = bot.name || bot.id;
        var meta = BOT_META[name] || { icon: '\ud83e\udd16', role: 'Bot', desc: '', color: '#888', schedule: 'Unknown' };
        var perf = learning[name] || { level: 'beginner', tasksCompleted: 0, tasksFailed: 0, consecutiveSuccesses: 0 };
        var botTasks = tasks.filter(function(t) {
          var assignee = (t.assignee || t.bot || '').toLowerCase();
          var taskName = (t.name || '').toLowerCase();
          return assignee.includes(name.toLowerCase()) || taskName.includes(name.toLowerCase().replace('bot',''));
        });
        var debugSessions = debug.filter(function(d) {
          return (d.botName || '').toLowerCase() === name.toLowerCase();
        });
        botData[name] = {
          id: bot.id, name: name, icon: meta.icon, role: meta.role, desc: meta.desc,
          color: meta.color, schedule: meta.schedule, status: bot.status || 'active',
          performance: perf,
          tasks: {
            pending: botTasks.filter(function(t) { return t.status === 'pending'; }),
            running: botTasks.filter(function(t) { return t.status === 'running'; }),
            completed: botTasks.filter(function(t) { return t.status === 'completed'; }),
            all: botTasks
          },
          debugSessions: debugSessions
        };
        if (botTasks.some(function(t) { return t.status === 'running'; })) botData[name].status = 'working';
      });
    } catch (err) { console.error('[BotManager] Load error:', err); }
  }

  async function safeFetch(url) {
    try { var res = await fetch(url); if (!res.ok) return {}; return await res.json(); }
    catch(e) { return {}; }
  }

  function renderManagerShell() {
    return '<div class="bot-manager">' +
      '<div class="bot-manager-header">' +
        '<div><div class="bot-manager-title">\ud83e\udd16 Bot Army Command Center</div>' +
        '<div class="bot-manager-subtitle">Manage, monitor, and control all autonomous bots</div></div>' +
        '<div class="bot-manager-controls">' +
          '<div class="view-toggle"><button class="active" onclick="setBotView(\'grid\')">Grid</button>' +
          '<button onclick="setBotView(\'list\')">List</button></div>' +
          '<button onclick="refreshBotManager()">\ud83d\udd04 Refresh</button>' +
          '<button onclick="assignNewTask()">\u2795 New Task</button>' +
        '</div></div>' +
      '<div class="fleet-overview" id="fleet-overview"></div>' +
      '<div class="bot-grid" id="bot-grid"></div>' +
      '<div class="bot-detail-backdrop" id="bot-detail-backdrop" onclick="closeBotDetail()"></div>' +
      '<div class="bot-detail-panel" id="bot-detail-panel"></div></div>';
  }

  function renderFleetOverview() {
    var el = document.getElementById('fleet-overview');
    if (!el) return;
    var total = Object.keys(botData).length;
    var active = 0, working = 0, tRunning = 0, tPending = 0, tCompleted = 0, tAll = 0;
    Object.values(botData).forEach(function(b) {
      if (b.status === 'active' || b.status === 'working') active++;
      if (b.status === 'working') working++;
      tRunning += (b.tasks.running || []).length;
      tPending += (b.tasks.pending || []).length;
      tCompleted += (b.tasks.completed || []).length;
      tAll += (b.tasks.all || []).length;
    });
    el.innerHTML = fs(total,'Total Bots') + fs(active,'Active') + fs(working,'Working Now') +
      fs(tRunning,'Running') + fs(tPending,'Queued') + fs(tCompleted,'Completed') + fs(tAll,'Total Tasks');
  }
  function fs(v,l) {
    return '<div class="fleet-stat"><span class="fleet-stat-value">' + v + '</span><span class="fleet-stat-label">' + l + '</span></div>';
  }

  function renderBotGrid() {
    var el = document.getElementById('bot-grid');
    if (!el) return;
    var html = '';
    var names = Object.keys(botData).sort(function(a,b) {
      var o = {working:0, debugging:1, active:2, idle:3};
      return (o[botData[a].status]||3) - (o[botData[b].status]||3);
    });
    names.forEach(function(name) { html += renderBotCard(botData[name]); });
    el.innerHTML = html;
  }

  function renderBotCard(bot) {
    var perf = bot.performance || {};
    var level = perf.level || 'beginner';
    var completed = (bot.tasks.completed || []).length;
    var pending = (bot.tasks.pending || []).length;
    var running = (bot.tasks.running || []).length;
    var total = (perf.tasksCompleted || 0) + (perf.tasksFailed || 0);
    var rate = total > 0 ? Math.round((perf.tasksCompleted / total) * 100) : 100;
    var sc = bot.status === 'working' ? 'working' : (bot.status === 'active' ? 'active' : 'idle');
    return '<div class="bot-card' + (selectedBot === bot.name ? ' selected' : '') + '" onclick="openBotDetail(\'' + bot.name + '\')">' +
      '<div class="bot-card-pulse ' + sc + '"></div>' +
      '<div class="bot-card-header">' +
        '<span class="bot-card-icon">' + bot.icon + '</span>' +
        '<div class="bot-card-info"><div class="bot-card-name">' + bot.name + '</div>' +
        '<div class="bot-card-role">' + bot.role + '</div></div>' +
        '<span class="bot-card-level ' + level + '">' + level + '</span></div>' +
      '<div class="bot-card-stats">' +
        cardStat(running, 'Running') + cardStat(pending, 'Pending') + cardStat(completed, 'Done') +
      '</div>' +
      '<div class="bot-card-footer"><span>' + bot.schedule + '</span><span>' + rate + '% success</span></div>' +
      '<div class="bot-card-task-bar"><div class="bot-card-task-bar-fill" style="width:' + rate + '%"></div></div></div>';
  }
  function cardStat(v,l) {
    return '<div class="bot-card-stat"><span class="bot-card-stat-val">' + v + '</span><span class="bot-card-stat-label">' + l + '</span></div>';
  }

  window.openBotDetail = function(botName) {
    selectedBot = botName;
    renderBotDetail(botName);
    var p = document.getElementById('bot-detail-panel');
    var b = document.getElementById('bot-detail-backdrop');
    if (p) p.classList.add('open');
    if (b) b.classList.add('open');
    renderBotGrid();
  };
  window.closeBotDetail = function() {
    selectedBot = null;
    var p = document.getElementById('bot-detail-panel');
    var b = document.getElementById('bot-detail-backdrop');
    if (p) p.classList.remove('open');
    if (b) b.classList.remove('open');
    renderBotGrid();
  };

  function renderBotDetail(botName) {
    var bot = botData[botName];
    if (!bot) return;
    var panel = document.getElementById('bot-detail-panel');
    if (!panel) return;
    var perf = bot.performance || {};
    var level = perf.level || 'beginner';

    panel.innerHTML =
      '<div class="bot-detail-header">' +
        '<div class="bot-detail-title"><span class="bot-detail-title-icon">' + bot.icon + '</span>' +
        '<div class="bot-detail-title-text"><h3>' + bot.name + '</h3>' +
        '<span>' + bot.role + ' \u2014 <span class="bot-card-level ' + level + '">' + level + '</span></span></div></div>' +
        '<button class="bot-detail-close" onclick="closeBotDetail()">\u2715</button></div>' +
      '<div class="bot-detail-tabs">' +
        '<div class="bot-detail-tab active" onclick="switchBotTab(this,\'overview\')">Overview</div>' +
        '<div class="bot-detail-tab" onclick="switchBotTab(this,\'tasks\')">Tasks</div>' +
        '<div class="bot-detail-tab" onclick="switchBotTab(this,\'connections\')">Connections</div>' +
        '<div class="bot-detail-tab" onclick="switchBotTab(this,\'config\')">Config</div></div>' +
      '<div class="bot-detail-body" id="bot-detail-body">' + renderOverviewTab(bot) + '</div>' +
      '<div class="bot-detail-actions">' +
        '<button class="bot-action-btn primary" onclick="assignTaskToBot(\'' + botName + '\')">\u2795 Assign Task</button>' +
        '<button class="bot-action-btn" onclick="viewBotLogs(\'' + botName + '\')">\ud83d\udcdc Logs</button>' +
        '<button class="bot-action-btn" onclick="trainBot(\'' + botName + '\')">\ud83c\udf93 Train</button>' +
        '<button class="bot-action-btn danger" onclick="resetBot(\'' + botName + '\')">\ud83d\udd04 Reset</button></div>';
  }

  function renderOverviewTab(bot) {
    var perf = bot.performance || {};
    var level = perf.level || 'beginner';
    var nextLevel = level === 'beginner' ? 'intermediate' : (level === 'intermediate' ? 'advanced' : (level === 'advanced' ? 'expert' : 'max'));
    var needed = level === 'beginner' ? 3 : (level === 'intermediate' ? 5 : (level === 'advanced' ? 10 : 0));
    var progress = needed > 0 ? Math.min(100, Math.round(((perf.consecutiveSuccesses || 0) / needed) * 100)) : 100;
    var total = (perf.tasksCompleted || 0) + (perf.tasksFailed || 0);
    var rate = total > 0 ? Math.round((perf.tasksCompleted / total) * 100) + '%' : '100%';

    var html = '<div class="bot-detail-section"><div class="bot-detail-section-title">About</div>' +
      '<div style="font-size:0.9em;color:var(--text-secondary,#ccc);line-height:1.5;">' + bot.desc + '</div></div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">Performance</div>' +
      mr('Tasks Completed', perf.tasksCompleted || 0) + mr('Tasks Failed', perf.tasksFailed || 0) +
      mr('Consecutive Wins', (perf.consecutiveSuccesses || 0) + '/' + needed) +
      mr('Success Rate', rate) + mr('Status', bot.status.charAt(0).toUpperCase() + bot.status.slice(1)) + '</div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">Level Progress \u2192 ' + nextLevel + '</div>' +
      '<div style="width:100%;height:8px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden;margin-top:8px;">' +
      '<div style="width:' + progress + '%;height:100%;background:linear-gradient(90deg,' + bot.color + ',#06b6d4);border-radius:4px;transition:width 0.5s;"></div></div>' +
      '<div style="font-size:0.75em;color:var(--text-muted,#888);margin-top:4px;text-align:right;">' + progress + '% to ' + nextLevel + '</div></div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">Active Tasks (' +
      ((bot.tasks.running||[]).length + (bot.tasks.pending||[]).length) + ')</div>';
    (bot.tasks.running||[]).forEach(function(t) { html += taskItem(t,'running'); });
    (bot.tasks.pending||[]).forEach(function(t) { html += taskItem(t,'pending'); });
    if (!(bot.tasks.running||[]).length && !(bot.tasks.pending||[]).length)
      html += '<div style="text-align:center;color:var(--text-muted,#888);padding:16px;font-size:0.85em;">No active tasks \u2014 idle</div>';
    html += '</div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">Schedule</div>' +
      '<div style="font-size:0.85em;color:var(--text-secondary,#ccc);padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;">\u23f0 ' + bot.schedule + '</div></div>';
    return html;
  }

  window.switchBotTab = function(tabEl, tabName) {
    var tabs = tabEl.parentElement.querySelectorAll('.bot-detail-tab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    tabEl.classList.add('active');
    var body = document.getElementById('bot-detail-body');
    if (!body || !selectedBot) return;
    var bot = botData[selectedBot];
    if (!bot) return;
    if (tabName === 'overview') body.innerHTML = renderOverviewTab(bot);
    else if (tabName === 'tasks') body.innerHTML = renderTasksTab(bot);
    else if (tabName === 'connections') body.innerHTML = renderConnectionsTab(bot);
    else if (tabName === 'config') body.innerHTML = renderConfigTab(bot);
  };

  function renderTasksTab(bot) {
    var html = '<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udd28 Running (' + (bot.tasks.running||[]).length + ')</div>';
    (bot.tasks.running||[]).forEach(function(t) { html += taskItem(t,'running'); });
    if (!(bot.tasks.running||[]).length) html += empty('No running tasks');
    html += '</div>';
    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">\u23f3 Pending (' + (bot.tasks.pending||[]).length + ')</div>';
    (bot.tasks.pending||[]).forEach(function(t) { html += taskItem(t,'pending'); });
    if (!(bot.tasks.pending||[]).length) html += empty('No pending tasks');
    html += '</div>';
    var recent = (bot.tasks.completed||[]).slice(-10).reverse();
    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">\u2705 Recently Completed (' + (bot.tasks.completed||[]).length + ' total)</div>';
    recent.forEach(function(t) { html += taskItem(t,'completed'); });
    if (!recent.length) html += empty('No completed tasks yet');
    html += '</div>';
    return html;
  }

  function renderConnectionsTab(bot) {
    var conns = {
      DocsBot:       { feeds: ['CodeBot'], fedBy: ['CodeBot','ResearchBot'], shares: 'Documentation & API specs' },
      ResearchBot:   { feeds: ['BusinessBot','SocialBot','DiaryBot'], fedBy: [], shares: 'Market intel, trends, reports' },
      CodeBot:       { feeds: ['DocsBot','TasksBot'], fedBy: ['DocsBot','DiaryBot'], shares: 'Code, commits, debug solutions' },
      SocialBot:     { feeds: ['DiaryBot'], fedBy: ['ResearchBot','BusinessBot'], shares: 'Posts, engagement data' },
      BusinessBot:   { feeds: ['SocialBot'], fedBy: ['ResearchBot','CryptoBot'], shares: 'Revenue, analytics, forecasts' },
      FileSystemBot: { feeds: ['DiaryBot'], fedBy: ['CodeBot'], shares: 'File changes, backups, cleanup logs' },
      TasksBot:      { feeds: ['DiaryBot'], fedBy: ['CodeBot'], shares: 'Task queue, completion data' },
      CryptoBot:     { feeds: ['BusinessBot','SocialBot'], fedBy: ['ResearchBot'], shares: 'Wallet data, token prices, DEX alerts' },
      DiaryBot:      { feeds: [], fedBy: ['TasksBot','CodeBot','SocialBot','FileSystemBot','ResearchBot'], shares: 'Activity logs, knowledge base, escalation data' }
    };
    var c = conns[bot.name] || { feeds:[], fedBy:[], shares:'None' };
    var html = '<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udce1 Data Shared</div>' +
      '<div style="font-size:0.85em;color:var(--text-secondary,#ccc);padding:10px 12px;background:rgba(255,255,255,0.02);border-radius:8px;">' + c.shares + '</div></div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">\u27a1\ufe0f Sends Data To</div><div style="display:flex;flex-wrap:wrap;gap:6px;">';
    if (c.feeds.length) c.feeds.forEach(function(b) {
      var m = BOT_META[b] || {icon:'\ud83e\udd16'};
      html += '<span class="bot-xref" onclick="openBotDetail(\'' + b + '\')">' + m.icon + ' ' + b + '</span>';
    }); else html += '<span style="font-size:0.85em;color:var(--text-muted);">Terminal node</span>';
    html += '</div></div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">\u2b05\ufe0f Receives Data From</div><div style="display:flex;flex-wrap:wrap;gap:6px;">';
    if (c.fedBy.length) c.fedBy.forEach(function(b) {
      var m = BOT_META[b] || {icon:'\ud83e\udd16'};
      html += '<span class="bot-xref" onclick="openBotDetail(\'' + b + '\')">' + m.icon + ' ' + b + '</span>';
    }); else html += '<span style="font-size:0.85em;color:var(--text-muted);">Source node - generates original data</span>';
    html += '</div></div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udd78\ufe0f Bot Network</div>' +
      '<div style="font-family:monospace;font-size:0.75em;color:var(--text-secondary,#ccc);padding:12px;background:rgba(0,0,0,0.2);border-radius:8px;line-height:1.8;">';
    c.fedBy.forEach(function(b) { html += (BOT_META[b]||{}).icon + ' ' + b + ' \u2500\u2500\u2192 '; });
    html += '<strong style="color:' + bot.color + ';">[' + bot.icon + ' ' + bot.name + ']</strong>';
    c.feeds.forEach(function(b) { html += ' \u2500\u2500\u2192 ' + (BOT_META[b]||{}).icon + ' ' + b; });
    html += '</div></div>';
    return html;
  }

  function renderConfigTab(bot) {
    var perf = bot.performance || {};
    var html = '<div class="bot-detail-section"><div class="bot-detail-section-title">\u2699\ufe0f Configuration</div>' +
      mr('Bot ID', bot.id || bot.name.toLowerCase()) + mr('Status', bot.status) +
      mr('Level', perf.level || 'beginner') + mr('Schedule', bot.schedule) +
      mr('Color', '<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:' + bot.color + ';vertical-align:middle;"></span> ' + bot.color) + '</div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83c\udf9b\ufe0f Controls</div><div style="display:flex;flex-direction:column;gap:8px;">';
    ['Auto-assign tasks','24/7 Operation','Cross-reference other bots','Create tasks autonomously'].forEach(function(label) {
      html += '<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;font-size:0.85em;color:var(--text-secondary,#ccc);">' +
        '<span>' + label + '</span><input type="checkbox" checked style="accent-color:#8b5cf6;"></label>';
    });
    html += '</div></div>';

    html += '<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udcca Debug Sessions</div>';
    if (bot.debugSessions && bot.debugSessions.length) {
      bot.debugSessions.forEach(function(d) {
        html += '<div class="bot-task-item pending"><span class="bot-task-item-name">' + (d.issue||'Unknown') + '</span>' +
          '<span class="bot-task-item-status pending">Attempt ' + (d.attempts||[]).length + '/10</span></div>';
      });
    } else html += empty('No active debug sessions');
    html += '</div>';
    return html;
  }

  window.assignTaskToBot = async function(botName) {
    var taskName = prompt('Task name for ' + botName + ':');
    if (!taskName) return;
    var priority = prompt('Priority (P1/P2/P3):', 'P2') || 'P2';
    try {
      await fetch(API + '/api/tasks', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: taskName, priority: priority, assignee: botName, status: 'pending' }) });
      await loadAllBotData(); renderBotGrid();
      if (selectedBot === botName) renderBotDetail(botName);
    } catch(e) { alert('Failed: ' + e.message); }
  };
  window.assignNewTask = function() {
    var names = Object.keys(botData);
    var choice = prompt('Assign to which bot?\n' + names.map(function(n,i) { return (i+1)+'. '+n; }).join('\n'));
    if (!choice) return;
    var idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < names.length) assignTaskToBot(names[idx]);
  };
  window.viewBotLogs = async function(botName) {
    try {
      var res = await safeFetch(API + '/api/bots/feedback/' + botName);
      var fb = Array.isArray(res) ? res : (res.feedback || []);
      alert(botName + ' Logs:\n\n' + (fb.length ? fb.slice(-5).map(function(f){return f.timestamp+': '+f.message;}).join('\n') : 'No logs'));
    } catch(e) { alert('Could not load logs'); }
  };
  window.trainBot = function(botName) { alert('Training ' + botName + '... Feature coming in Phase 2!'); };
  window.resetBot = function(botName) { if (confirm('Reset ' + botName + '?')) alert('Reset queued.'); };
  window.refreshBotManager = async function() {
    await loadAllBotData(); renderFleetOverview(); renderBotGrid();
    if (selectedBot) renderBotDetail(selectedBot);
  };
  window.setBotView = function(view) {
    document.querySelectorAll('.view-toggle button').forEach(function(b){b.classList.remove('active');});
    event.target.classList.add('active');
    var g = document.getElementById('bot-grid');
    if (g) g.style.gridTemplateColumns = view==='list' ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))';
  };

  function mr(l,v) { return '<div class="bot-metric-row"><span class="bot-metric-label">'+l+'</span><span class="bot-metric-value">'+v+'</span></div>'; }
  function taskItem(t,s) {
    var n = (t.name||'Unnamed').substring(0,60);
    var a = t.updated ? timeAgo(t.updated) : '';
    return '<div class="bot-task-item '+s+'"><span class="bot-task-item-name">'+n+'</span>' +
      '<span class="bot-task-item-status '+s+'">'+s+'</span>' +
      (a ? '<span style="font-size:0.7em;color:var(--text-muted,#888);">'+a+'</span>' : '') + '</div>';
  }
  function empty(m) { return '<div style="text-align:center;color:var(--text-muted,#888);padding:12px;font-size:0.85em;">'+m+'</div>'; }
  function timeAgo(d) {
    var s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s/60)+'m ago';
    if (s < 86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago';
  }
})();
