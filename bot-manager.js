/**
 * Bot Manager v2 — Full Command Center
 * Live data from: /api/bots, /api/tasks, /api/bots/learning, /api/heartbeat/state,
 * /api/pinky/status, /api/escalation/status, /api/escalation/costs
 */
(function() {
  'use strict';
  var API = (typeof API_BASE !== 'undefined' ? API_BASE : '') || '';
  var selectedBot = null;
  var botData = {};
  var sysData = {};
  var refreshTimer = null;
  var currentTab = 'fleet';

    // Fallback metadata — API data from registry takes priority
  var BOT_META_FALLBACK = {
    DocsBot:'\ud83d\udcdd',ResearchBot:'\ud83d\udd0d',CodeBot:'\ud83d\udcbb',SocialBot:'\ud83d\udcf1',
    BusinessBot:'\ud83d\udcbc',FileSystemBot:'\ud83d\udcc1',TasksBot:'\ud83d\udccb',CryptoBot:'\ud83e\ude99',DiaryBot:'\ud83d\udcd2'
  };

    // Connections now loaded from API (bot.feeds, bot.fedBy, bot.shares)

  // ============================================
  // INIT
  // ============================================
  window.initBotManager = async function() {
    var container = document.getElementById('bot-manager-container');
    if (!container) return;
    container.innerHTML = '<div class="bot-manager">' + renderNav() +
      '<div id="bm-content" style="flex:1;overflow-y:auto;"></div></div>';
    await loadAll();
    showSection('fleet');
    startRefresh();
  };

  function startRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(async function() {
      await loadAll();
      showSection(currentTab);
    }, 20000);
  }

  // ============================================
  // DATA
  // ============================================
  async function loadAll() {
    var r = await Promise.all([
      sf(API+'/api/bots'), sf(API+'/api/tasks'), sf(API+'/api/bots/learning'),
      sf(API+'/api/heartbeat/state'), sf(API+'/api/pinky/status'),
      sf(API+'/api/escalation/status'), sf(API+'/api/escalation/costs'),
      sf(API+'/api/bots/debug/active')
    ]);
    var bots = Array.isArray(r[0]) ? r[0] : (r[0].bots||[]);
    var tasks = Array.isArray(r[1]) ? r[1] : (r[1].tasks||[]);
    var learning = r[2]||{};
    sysData = { heartbeat: r[3]||{}, pinky: r[4]||{}, escalation: r[5]||{}, costs: r[6]||{}, debug: Array.isArray(r[7])?r[7]:[] };

    bots.forEach(function(bot) {
      var name = bot.name||bot.id;
      var fallbackIcon = BOT_META_FALLBACK[name] || '\ud83e\udd16';
      var perf = learning[name]||{level:'beginner',tasksCompleted:0,tasksFailed:0,consecutiveSuccesses:0,totalTokensUsed:0,avgTokensPerTask:0,commonErrors:[]};
      var bt = tasks.filter(function(t) {
        var a=(t.assignee||t.bot||'').toLowerCase(), n2=(t.name||'').toLowerCase();
        return a.includes(name.toLowerCase()) || n2.includes(name.toLowerCase().replace('bot',''));
      });
      var colors = {'DocsBot':'#60a5fa','ResearchBot':'#f59e0b','CodeBot':'#8b5cf6','SocialBot':'#ec4899','BusinessBot':'#10b981','FileSystemBot':'#6366f1','TasksBot':'#06b6d4','CryptoBot':'#f97316','DiaryBot':'#a855f7'};
      botData[name] = {
        id:bot.id, name:name, icon:bot.icon||fallbackIcon, role:bot.role||'Bot', desc:bot.desc||bot.system||'',
        color:colors[name]||'#888', schedule:bot.schedule||'Unknown', capabilities:bot.capabilities||[],
        model:bot.model||'disabled', system:bot.system||'', feeds:bot.feeds||[], fedBy:bot.fedBy||[], shares:bot.shares||'',
        botConfig:bot.config||{},
        status: bt.some(function(t){return t.status==='running';}) ? 'working' : (bot.status||'active'),
        performance: perf,
        tasks: { pending:bt.filter(function(t){return t.status==='pending';}), running:bt.filter(function(t){return t.status==='running';}), completed:bt.filter(function(t){return t.status==='completed';}), all:bt },
        debugSessions: sysData.debug.filter(function(d){return (d.botName||'').toLowerCase()===name.toLowerCase();})
      };
    });
  }
  async function sf(u){try{var r=await fetch(u);if(!r.ok)return {};return await r.json();}catch(e){return {};}}

  // ============================================
  // NAV
  // ============================================
  function renderNav() {
    return '<div style="display:flex;gap:4px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.15);flex-wrap:wrap;">' +
      navBtn('fleet','\ud83c\udf10 Fleet Overview') + navBtn('bots','\ud83e\udd16 Bot Grid') +
      navBtn('backend','\u2699\ufe0f Backend Controls') + navBtn('network','\ud83d\udd78\ufe0f Bot Network') +
      navBtn('costs','\ud83d\udcb0 Cost Center') + navBtn('addbot','\u2795 Add Bot') + navBtn('marketplace','\ud83d\udee0\ufe0f Modules') +
      '<div style="flex:1;"></div>' +
      '<button onclick="refreshBotManager()" style="padding:6px 14px;border:1px solid rgba(139,92,246,0.3);border-radius:8px;background:rgba(139,92,246,0.1);color:#eee;cursor:pointer;font-size:0.8em;">\ud83d\udd04 Refresh</button>' +
    '</div>';
  }
  function navBtn(id,label) {
    return '<button id="bm-nav-'+id+'" onclick="bmNav(\''+id+'\')" style="padding:8px 16px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;background:rgba(255,255,255,0.03);color:var(--text-muted,#888);cursor:pointer;font-size:0.82em;transition:all 0.2s;">'+label+'</button>';
  }
  window.bmNav = function(section) { currentTab = section; showSection(section); };

  function showSection(section) {
    var el = document.getElementById('bm-content');
    if (!el) return;
    // Highlight active nav
    document.querySelectorAll('[id^="bm-nav-"]').forEach(function(b) {
      b.style.background = 'rgba(255,255,255,0.03)'; b.style.color = 'var(--text-muted,#888)';
      b.style.borderColor = 'rgba(255,255,255,0.08)';
    });
    var active = document.getElementById('bm-nav-'+section);
    if (active) { active.style.background = 'rgba(139,92,246,0.2)'; active.style.color = '#8b5cf6'; active.style.borderColor = '#8b5cf6'; }

    if (section === 'fleet') el.innerHTML = renderFleet();
    else if (section === 'bots') el.innerHTML = renderBotsGrid();
    else if (section === 'backend') el.innerHTML = renderBackend();
    else if (section === 'network') el.innerHTML = renderNetwork();
    else if (section === 'costs') el.innerHTML = renderCosts();
    else if (section === 'addbot') el.innerHTML = renderAddBot();
    else if (section === 'marketplace') el.innerHTML = renderMarketplace();
  }

  // ============================================
  // FLEET OVERVIEW
  // ============================================
  function renderFleet() {
    var total=Object.keys(botData).length, active=0, working=0, tR=0, tP=0, tC=0;
    Object.values(botData).forEach(function(b) {
      if(b.status==='active'||b.status==='working') active++;
      if(b.status==='working') working++;
      tR+=(b.tasks.running||[]).length; tP+=(b.tasks.pending||[]).length; tC+=(b.tasks.completed||[]).length;
    });
    var hb = sysData.heartbeat||{};
    var pinky = sysData.pinky||{};
    var esc = sysData.escalation||{};

    var html = '<div style="padding:20px 24px;">';

    // System Status Banner
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px;">';
    html += statusCard('\ud83d\udc9a Pinky', pinky.running && !pinky.stopped_by_user ? 'RUNNING' : 'STOPPED', pinky.running && !pinky.stopped_by_user ? '#10b981' : '#ef4444');
    html += statusCard('\ud83d\udc93 Heartbeat', '#' + (hb.heartbeatCount||0) + ' beats', '#8b5cf6');
    html += statusCard('\ud83e\udd16 Fleet', active + '/' + total + ' active', '#06b6d4');
    html += statusCard('\ud83d\udee0\ufe0f Working', working + ' bots now', working > 0 ? '#f59e0b' : '#6b7280');
    html += statusCard('\ud83d\udcca Tasks', tR+' running, '+tP+' queued', '#60a5fa');
    html += statusCard('\u2705 Completed', tC + ' total', '#10b981');
    html += '</div>';

    // Heartbeat Intelligence
    html += sec('Heartbeat Intelligence');
    html += '<div style="padding:12px 16px;background:rgba(0,0,0,0.2);border-radius:10px;font-size:0.85em;color:var(--text-secondary,#ccc);line-height:1.6;">';
    html += '<div style="margin-bottom:8px;"><strong style="color:var(--text-primary,#eee);">Current Focus:</strong> ' + (hb.currentFocus||'None').substring(0,200) + '</div>';
    if (hb.sessionStats) {
      html += '<div style="display:flex;gap:20px;flex-wrap:wrap;">';
      html += miniStat('Checked', hb.sessionStats.tasksChecked||0);
      html += miniStat('Completed', hb.sessionStats.completedTasks||0);
      html += miniStat('Blocked', hb.sessionStats.blockedTasks||0);
      html += miniStat('Pending', hb.sessionStats.pendingTasks||0);
      html += '</div>';
    }
    html += '</div>';

    // Escalation Pipeline Summary
    var tiers = esc.pinkyTiers||[];
    if (tiers.length) {
      html += sec('Escalation Pipeline');
      html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:rgba(0,0,0,0.2);border-radius:10px;">';
      tiers.forEach(function(t,i) {
        if (i>0) html += '<span style="color:var(--text-muted,#888);">\u2192</span>';
        html += '<div style="padding:8px 14px;border-radius:8px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);font-size:0.8em;">' +
          '<div style="font-weight:600;color:var(--text-primary,#eee);">'+t.name.split('(')[0].trim()+'</div>' +
          '<div style="font-size:0.85em;color:var(--text-muted,#888);">'+t.cost+' | '+t.shots+'</div></div>';
      });
      html += '<span style="color:var(--text-muted,#888);">\u2192</span>' +
        '<div style="padding:8px 14px;border-radius:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);font-size:0.8em;">' +
        '<div style="font-weight:600;color:#ef4444;">\ud83e\udde0 Brain</div><div style="font-size:0.85em;color:var(--text-muted,#888);">Human escalation</div></div>';
      html += '</div>';
    }

    // Active Debug Sessions
    if (sysData.debug.length) {
      html += sec('Active Debug Sessions (' + sysData.debug.length + ')');
      sysData.debug.forEach(function(d) {
        html += '<div class="bot-task-item pending"><span class="bot-task-item-name">' + (d.issue||d.taskId||'Unknown') + '</span>' +
          '<span class="bot-task-item-status pending">Attempt '+(d.attempts||[]).length+'/10</span></div>';
      });
    }

    html += '</div>';
    return html;
  }

  function statusCard(label, value, color) {
    return '<div style="padding:14px 16px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">' +
      '<div style="font-size:0.75em;color:var(--text-muted,#888);margin-bottom:6px;">'+label+'</div>' +
      '<div style="font-size:1.1em;font-weight:700;color:'+color+';">'+value+'</div></div>';
  }
  function miniStat(l,v) { return '<div><span style="color:var(--text-muted,#888);">'+l+':</span> <strong>'+v+'</strong></div>'; }

  // ============================================
  // BOT GRID
  // ============================================
  function renderBotsGrid() {
    var html = '<div style="padding:20px 24px;">';
    // Quick stats bar
    html += '<div class="fleet-overview" style="border:none;padding:0 0 16px;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.05);">';
    var total=Object.keys(botData).length, working=0, idle=0;
    Object.values(botData).forEach(function(b){ if(b.status==='working') working++; else idle++; });
    html += fs(total,'Total') + fs(working,'Working') + fs(idle,'Idle');
    html += '</div>';

    html += '<div class="bot-grid">';
    Object.keys(botData).sort(function(a,b){
      var o={working:0,active:1,idle:2}; return (o[botData[a].status]||2)-(o[botData[b].status]||2);
    }).forEach(function(name) { html += renderCard(botData[name]); });
    html += '</div></div>';

    // Detail panel + backdrop
    html += '<div class="bot-detail-backdrop" id="bot-detail-backdrop" onclick="closeBotDetail()"></div>';
    html += '<div class="bot-detail-panel" id="bot-detail-panel"></div>';
    return html;
  }

  function renderCard(bot) {
    var p=bot.performance||{}, lv=p.level||'beginner';
    var r=(bot.tasks.running||[]).length, pe=(bot.tasks.pending||[]).length, c=(bot.tasks.completed||[]).length;
    var tot=(p.tasksCompleted||0)+(p.tasksFailed||0), rate=tot>0?Math.round((p.tasksCompleted/tot)*100):100;
    var sc=bot.status==='working'?'working':(bot.status==='active'?'active':'idle');
    return '<div class="bot-card'+(selectedBot===bot.name?' selected':'')+'" onclick="openBotDetail(\''+bot.name+'\')">' +
      '<div class="bot-card-pulse '+sc+'"></div>' +
      '<div class="bot-card-header"><span class="bot-card-icon">'+bot.icon+'</span>' +
      '<div class="bot-card-info"><div class="bot-card-name">'+bot.name+'</div><div class="bot-card-role">'+bot.role+'</div></div>' +
      '<span class="bot-card-level '+lv+'">'+lv+'</span></div>' +
      '<div class="bot-card-stats">'+cardSt(r,'Running')+cardSt(pe,'Pending')+cardSt(c,'Done')+'</div>' +
      '<div class="bot-card-footer"><span>'+bot.schedule+'</span><span>'+rate+'%</span></div>' +
      '<div class="bot-card-task-bar"><div class="bot-card-task-bar-fill" style="width:'+rate+'%"></div></div></div>';
  }
  function cardSt(v,l){return '<div class="bot-card-stat"><span class="bot-card-stat-val">'+v+'</span><span class="bot-card-stat-label">'+l+'</span></div>';}

  // ============================================
  // BOT DETAIL (slide-in)
  // ============================================
  window.openBotDetail = function(name) {
    selectedBot = name; renderDetail(name);
    var p=document.getElementById('bot-detail-panel'),b=document.getElementById('bot-detail-backdrop');
    if(p)p.classList.add('open'); if(b)b.classList.add('open');
  };
  window.closeBotDetail = function() {
    selectedBot = null;
    var p=document.getElementById('bot-detail-panel'),b=document.getElementById('bot-detail-backdrop');
    if(p)p.classList.remove('open'); if(b)b.classList.remove('open');
  };

  function renderDetail(name) {
    var bot=botData[name]; if(!bot)return;
    var panel=document.getElementById('bot-detail-panel'); if(!panel)return;
    var p=bot.performance||{}, lv=p.level||'beginner';

    panel.innerHTML =
      '<div class="bot-detail-header"><div class="bot-detail-title"><span class="bot-detail-title-icon">'+bot.icon+'</span>' +
      '<div class="bot-detail-title-text"><h3>'+bot.name+'</h3><span>'+bot.role+' \u2014 <span class="bot-card-level '+lv+'">'+lv+'</span></span></div></div>' +
      '<button class="bot-detail-close" onclick="closeBotDetail()">\u2715</button></div>' +
      '<div class="bot-detail-tabs">' +
        dtab('overview','Overview',true)+dtab('tasks','Tasks')+dtab('connections','Connections')+dtab('capabilities','Skills')+dtab('config','Config') +
      '</div>' +
      '<div class="bot-detail-body" id="bot-detail-body">'+renderDetailOverview(bot)+'</div>' +
      '<div class="bot-detail-actions">' +
        '<button class="bot-action-btn primary" onclick="assignTaskToBot(\''+name+'\')">\u2795 Task</button>' +
        '<button class="bot-action-btn" onclick="triggerBot(\''+name+'\')">\u26a1 Trigger</button>' +
        '<button class="bot-action-btn" onclick="viewBotLogs(\''+name+'\')">\ud83d\udcdc Logs</button>' +
        '<button class="bot-action-btn danger" onclick="resetBot(\''+name+'\')">\ud83d\udd04 Reset</button>' +
        '<button class="bot-action-btn danger" onclick="deleteBot(\''+name+'\',\''+bot.id+'\')">\ud83d\uddd1 Delete</button></div>';
  }
  function dtab(id,label,active){return '<div class="bot-detail-tab'+(active?' active':'')+'" onclick="switchBotTab(this,\''+id+'\')">'+label+'</div>';}

  window.switchBotTab = function(el,tab) {
    el.parentElement.querySelectorAll('.bot-detail-tab').forEach(function(t){t.classList.remove('active');});
    el.classList.add('active');
    var body=document.getElementById('bot-detail-body'); if(!body||!selectedBot) return;
    var bot=botData[selectedBot]; if(!bot) return;
    if(tab==='overview') body.innerHTML=renderDetailOverview(bot);
    else if(tab==='tasks') body.innerHTML=renderDetailTasks(bot);
    else if(tab==='connections') body.innerHTML=renderDetailConnections(bot);
    else if(tab==='capabilities') body.innerHTML=renderDetailCapabilities(bot);
    else if(tab==='config') body.innerHTML=renderDetailConfig(bot);
  };

  function renderDetailOverview(bot) {
    var p=bot.performance||{}, lv=p.level||'beginner';
    var nl=lv==='beginner'?'intermediate':(lv==='intermediate'?'advanced':(lv==='advanced'?'expert':'max'));
    var need=lv==='beginner'?3:(lv==='intermediate'?5:(lv==='advanced'?10:0));
    var prog=need>0?Math.min(100,Math.round(((p.consecutiveSuccesses||0)/need)*100)):100;
    var tot=(p.tasksCompleted||0)+(p.tasksFailed||0), rate=tot>0?Math.round((p.tasksCompleted/tot)*100)+'%':'100%';

    var h='<div class="bot-detail-section"><div class="bot-detail-section-title">About</div>' +
      '<div style="font-size:0.88em;color:var(--text-secondary,#ccc);line-height:1.6;">'+bot.desc+'</div></div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">Performance</div>' +
      mr('Tasks Completed',p.tasksCompleted||0)+mr('Tasks Failed',p.tasksFailed||0) +
      mr('Streak',(p.consecutiveSuccesses||0)+'/'+need)+mr('Success Rate',rate) +
      mr('Tokens Used',(p.totalTokensUsed||0).toLocaleString())+mr('Avg Tokens/Task',p.avgTokensPerTask||0) +
      mr('Status','<span style="color:'+(bot.status==='working'?'#f59e0b':'#10b981')+';">\u25cf</span> '+bot.status)+'</div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">Level \u2192 '+nl+'</div>' +
      '<div style="width:100%;height:8px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden;margin-top:8px;">' +
      '<div style="width:'+prog+'%;height:100%;background:linear-gradient(90deg,'+bot.color+',#06b6d4);border-radius:4px;transition:width 0.5s;"></div></div>' +
      '<div style="font-size:0.7em;color:var(--text-muted,#888);margin-top:4px;text-align:right;">'+prog+'%</div></div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">Active Tasks ('+((bot.tasks.running||[]).length+(bot.tasks.pending||[]).length)+')</div>';
    (bot.tasks.running||[]).forEach(function(t){h+=ti(t,'running');});
    (bot.tasks.pending||[]).forEach(function(t){h+=ti(t,'pending');});
    if(!(bot.tasks.running||[]).length&&!(bot.tasks.pending||[]).length) h+=em('Idle \u2014 no active tasks');
    h+='</div>';

    if(p.commonErrors&&p.commonErrors.length) {
      h+='<div class="bot-detail-section"><div class="bot-detail-section-title">Common Errors</div>';
      p.commonErrors.forEach(function(e){h+='<div style="padding:6px 10px;margin-bottom:4px;border-radius:6px;background:rgba(239,68,68,0.08);font-size:0.8em;color:#fca5a5;">'+e+'</div>';});
      h+='</div>';
    }
    return h;
  }

  function renderDetailTasks(bot) {
    var h='';
    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udd28 Running ('+(bot.tasks.running||[]).length+')</div>';
    (bot.tasks.running||[]).forEach(function(t){h+=ti(t,'running');}); if(!(bot.tasks.running||[]).length) h+=em('None');
    h+='</div><div class="bot-detail-section"><div class="bot-detail-section-title">\u23f3 Pending ('+(bot.tasks.pending||[]).length+')</div>';
    (bot.tasks.pending||[]).forEach(function(t){h+=ti(t,'pending');}); if(!(bot.tasks.pending||[]).length) h+=em('None');
    h+='</div><div class="bot-detail-section"><div class="bot-detail-section-title">\u2705 Completed ('+(bot.tasks.completed||[]).length+')</div>';
    (bot.tasks.completed||[]).slice(-15).reverse().forEach(function(t){h+=ti(t,'completed');}); if(!(bot.tasks.completed||[]).length) h+=em('None yet');
    h+='</div>'; return h;
  }

  function renderDetailConnections(bot) {
    var c={feeds:bot.feeds||[],fedBy:bot.fedBy||[],shares:bot.shares||'None'};
    var h='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udce1 Data Shared</div>' +
      '<div style="font-size:0.85em;color:var(--text-secondary,#ccc);padding:10px 12px;background:rgba(255,255,255,0.02);border-radius:8px;">'+c.shares+'</div></div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\u27a1\ufe0f Sends To</div><div style="display:flex;flex-wrap:wrap;gap:6px;">';
    if(c.feeds.length) c.feeds.forEach(function(b){var m=BOT_META[b]||{icon:'\ud83e\udd16'};
      h+='<span class="bot-xref" onclick="openBotDetail(\''+b+'\')">'+m.icon+' '+b+'</span>';
    }); else h+='<span style="font-size:0.85em;color:var(--text-muted);">Terminal node</span>';
    h+='</div></div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\u2b05\ufe0f Receives From</div><div style="display:flex;flex-wrap:wrap;gap:6px;">';
    if(c.fedBy.length) c.fedBy.forEach(function(b){var m=BOT_META[b]||{icon:'\ud83e\udd16'};
      h+='<span class="bot-xref" onclick="openBotDetail(\''+b+'\')">'+m.icon+' '+b+'</span>';
    }); else h+='<span style="font-size:0.85em;color:var(--text-muted);">Source node</span>';
    h+='</div></div>';

    // Network diagram
    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udd78\ufe0f Data Flow</div>' +
      '<div style="font-family:monospace;font-size:0.75em;color:var(--text-secondary,#ccc);padding:12px;background:rgba(0,0,0,0.2);border-radius:8px;line-height:2;word-break:break-all;">';
    c.fedBy.forEach(function(b){h+=(BOT_META[b]||{}).icon+' '+b+' \u2500\u2500\u2192 ';});
    h+='<strong style="color:'+bot.color+';font-size:1.1em;">['+bot.icon+' '+bot.name+']</strong>';
    c.feeds.forEach(function(b){h+=' \u2500\u2500\u2192 '+(BOT_META[b]||{}).icon+' '+b;});
    h+='</div></div>'; return h;
  }

  function renderDetailCapabilities(bot) {
    var caps = bot.capabilities||[];
    var h='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83c\udfaf Skills & Capabilities</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    caps.forEach(function(cap) {
      h+='<div style="padding:8px 14px;border-radius:8px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.15);font-size:0.82em;color:#a78bfa;">'+cap+'</div>';
    });
    h+='</div></div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\u23f0 Schedule</div>' +
      '<div style="font-size:0.88em;color:var(--text-secondary,#ccc);padding:10px 12px;background:rgba(255,255,255,0.02);border-radius:8px;">'+bot.schedule+'</div></div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udcca Token Usage</div>' +
      mr('Total Tokens',(bot.performance.totalTokensUsed||0).toLocaleString()) +
      mr('Avg Per Task',bot.performance.avgTokensPerTask||0) +
      mr('Last Updated',bot.performance.lastUpdated||'Never') + '</div>';
    return h;
  }

  function renderDetailConfig(bot) {
    var h='<div class="bot-detail-section"><div class="bot-detail-section-title">\u2699\ufe0f Configuration</div>' +
      mr('Bot ID',bot.id||bot.name.toLowerCase())+mr('Model',bot.model||'disabled')+mr('Status',bot.status)+mr('Level',(bot.performance||{}).level||'beginner') +
      mr('Color','<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:'+bot.color+';vertical-align:middle;"></span> '+bot.color)+'</div>';

    h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83c\udf9b\ufe0f Controls</div><div style="display:flex;flex-direction:column;gap:6px;">';
    ['Auto-assign tasks','24/7 Operation','Cross-reference bots','Create tasks autonomously','Log to DiaryBot'].forEach(function(label){
      h+='<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;font-size:0.82em;color:var(--text-secondary,#ccc);">' +
        '<span>'+label+'</span><input type="checkbox" checked style="accent-color:#8b5cf6;"></label>';
    });
    h+='</div></div>';

    if(bot.debugSessions&&bot.debugSessions.length) {
      h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udc1b Debug Sessions</div>';
      bot.debugSessions.forEach(function(d){
        h+='<div class="bot-task-item pending"><span class="bot-task-item-name">'+(d.issue||'Unknown')+'</span>' +
          '<span class="bot-task-item-status pending">Attempt '+(d.attempts||[]).length+'/10</span></div>';
      });
      h+='</div>';
    } else h+='<div class="bot-detail-section"><div class="bot-detail-section-title">\ud83d\udc1b Debug</div>'+em('No active sessions')+'</div>';
    return h;
  }

  // ============================================
  // BACKEND CONTROLS
  // ============================================
  function renderBackend() {
    var hb=sysData.heartbeat||{}, pinky=sysData.pinky||{};
    var isRunning = pinky.running && !pinky.stopped_by_user;

    var h='<div style="padding:20px 24px;">';
    h+=sec('Pinky Control');
    h+='<div style="display:flex;gap:12px;margin-bottom:20px;">';
    h+='<button onclick="controlPinky(\'start\')" style="flex:1;padding:14px;border-radius:10px;border:1px solid '+(isRunning?'rgba(107,114,128,0.3)':'rgba(16,185,129,0.4)')+';background:'+(isRunning?'rgba(107,114,128,0.1)':'rgba(16,185,129,0.15)')+';color:'+(isRunning?'#9ca3af':'#34d399')+';font-size:0.9em;font-weight:600;cursor:pointer;">'+(isRunning?'\u2705 Running':'\u25b6\ufe0f Start Pinky')+'</button>';
    h+='<button onclick="controlPinky(\'stop\')" style="flex:1;padding:14px;border-radius:10px;border:1px solid '+(isRunning?'rgba(239,68,68,0.4)':'rgba(107,114,128,0.3)')+';background:'+(isRunning?'rgba(239,68,68,0.15)':'rgba(107,114,128,0.1)')+';color:'+(isRunning?'#f87171':'#9ca3af')+';font-size:0.9em;font-weight:600;cursor:pointer;">\u23f9 Stop Pinky</button>';
    h+='</div>';

    h+=sec('Heartbeat Control');
    h+='<div style="display:flex;gap:12px;margin-bottom:20px;">';
    h+='<button onclick="controlHeartbeat(\'trigger\')" style="flex:1;padding:12px;border-radius:10px;border:1px solid rgba(139,92,246,0.3);background:rgba(139,92,246,0.1);color:#a78bfa;cursor:pointer;font-size:0.85em;">\u26a1 Trigger Heartbeat Now</button>';
    h+='<button onclick="controlHeartbeat(\'pause\')" style="flex:1;padding:12px;border-radius:10px;border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.1);color:#fbbf24;cursor:pointer;font-size:0.85em;">\u23f8 Pause</button>';
    h+='<button onclick="controlHeartbeat(\'restart\')" style="flex:1;padding:12px;border-radius:10px;border:1px solid rgba(16,185,129,0.3);background:rgba(16,185,129,0.1);color:#34d399;cursor:pointer;font-size:0.85em;">\ud83d\udd04 Restart</button>';
    h+='</div>';

    h+=sec('Heartbeat State');
    h+=mr('Last Run',hb.lastRun||'Never')+mr('Beat Count',hb.heartbeatCount||0);
    if(hb.projectStatus) {
      h+=mr('Pending',hb.projectStatus.pendingTasks||0)+mr('In Progress',hb.projectStatus.inProgress||0);
      h+=mr('Blocked (Brain)',hb.projectStatus.blockedAwaitingBrain||0)+mr('Completed Today',hb.projectStatus.completedToday||0);
      h+=mr('Total Completed',hb.projectStatus.completedTotal||0);
    }

    if(hb.blockedTasks&&hb.blockedTasks.length) {
      h+=sec('Blocked Tasks (Awaiting Brain)');
      hb.blockedTasks.forEach(function(t) {
        h+='<div class="bot-task-item" style="border-left-color:#ef4444;"><span class="bot-task-item-name">'+(t.name||t.id||'Unknown')+'</span>' +
          '<span class="bot-task-item-status" style="background:rgba(239,68,68,0.15);color:#f87171;">BLOCKED</span></div>';
      });
    }

    h+=sec('Escalation Model Config');
    var tiers = (sysData.escalation||{}).pinkyTiers||[];
    tiers.forEach(function(t) {
      h+=mr(t.name.split('(')[0].trim(), t.cost + ' | ' + t.shots);
    });
    h+=mr('\ud83e\udde0 Brain','After '+((sysData.escalation||{}).maxPinkyAttempts||10)+' attempts');

    h+='</div>'; return h;
  }

  // ============================================
  // NETWORK VIEW
  // ============================================
  function renderNetwork() {
    var h='<div style="padding:20px 24px;">';
    h+=sec('Bot Interconnection Map');
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">';

    Object.keys(CONNECTIONS).forEach(function(name) {
      var c=CONNECTIONS[name], meta=BOT_META[name]||{icon:'\ud83e\udd16',color:'#888'};
      h+='<div style="padding:14px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);cursor:pointer;" onclick="bmNav(\'bots\');setTimeout(function(){openBotDetail(\''+name+'\')},100);">';
      h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">';
      h+='<span style="font-size:1.5em;">'+meta.icon+'</span>';
      h+='<div><div style="font-weight:600;color:'+meta.color+';">'+name+'</div>';
      h+='<div style="font-size:0.75em;color:var(--text-muted,#888);">'+c.shares+'</div></div></div>';

      h+='<div style="font-size:0.78em;color:var(--text-secondary,#ccc);">';
      if(c.fedBy.length) h+='<div style="margin-bottom:4px;">\u2b05 From: '+c.fedBy.map(function(b){return (BOT_META[b]||{}).icon+' '+b;}).join(', ')+'</div>';
      if(c.feeds.length) h+='<div>\u27a1 To: '+c.feeds.map(function(b){return (BOT_META[b]||{}).icon+' '+b;}).join(', ')+'</div>';
      if(!c.fedBy.length&&!c.feeds.length) h+='<div>Standalone</div>';
      h+='</div></div>';
    });
    h+='</div></div>'; return h;
  }

  // ============================================
  // COST CENTER
  // ============================================
  function renderCosts() {
    var costs=sysData.costs||{};
    var h='<div style="padding:20px 24px;">';
    h+=sec('Escalation Cost Report');
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">';
    h+=statusCard('Total Tasks Routed',costs.totalTasks||0,'#8b5cf6');
    h+=statusCard('Escalations',costs.escalations||0,'#f59e0b');
    h+=statusCard('Self-Debug Saves',costs.selfDebugSaves||0,'#10b981');
    h+=statusCard('CodeBot Handoffs',costs.handoffToCodeBot||0,'#06b6d4');
    h+='</div>';

    h+=sec('Cost Comparison');
    h+='<div style="display:flex;gap:20px;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.2);border-radius:10px;">';
    h+='<div style="text-align:center;"><div style="font-size:0.75em;color:var(--text-muted,#888);margin-bottom:4px;">OLD (Sonnet Always)</div><div style="font-size:1.5em;font-weight:700;color:#ef4444;text-decoration:line-through;">'+(costs.oldCost||'$0.00')+'</div></div>';
    h+='<div style="font-size:1.5em;color:var(--text-muted,#888);">\u2192</div>';
    h+='<div style="text-align:center;"><div style="font-size:0.75em;color:var(--text-muted,#888);margin-bottom:4px;">TIERED (Smart Routing)</div><div style="font-size:1.5em;font-weight:700;color:#10b981;">'+(costs.actualCost||'$0.00')+'</div></div>';
    h+='</div>';
    h+='<div style="text-align:center;margin-top:12px;font-size:1.2em;font-weight:700;color:#10b981;">'+(costs.savings||'N/A')+' saved</div>';

    h+=sec('Cost by Model');
    var byModel = costs.byModel||{};
    h+=mr('Haiku ($0.80/M)',byModel.haiku||0)+mr('Sonnet ($3/M)',byModel.sonnet||0)+mr('Sonnet+Think ($3/M)',byModel.sonnetThink||0);

    h+='</div>'; return h;
  }

  // ============================================
  // ACTIONS
  // ============================================
  window.controlPinky = async function(action) {
    if(action==='start') { await sf(API+'/api/heartbeat/restart'); alert('Pinky started!'); }
    else if(action==='stop') { await fetch(API+'/api/heartbeat/pause',{method:'POST'}); alert('Pinky paused.'); }
    await loadAll(); showSection(currentTab);
  };
  window.controlHeartbeat = async function(action) {
    if(action==='trigger') { await fetch(API+'/api/execute/heartbeat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}); alert('Heartbeat triggered!'); }
    else if(action==='pause') { await fetch(API+'/api/heartbeat/pause',{method:'POST'}); alert('Paused.'); }
    else if(action==='restart') { await fetch(API+'/api/heartbeat/restart',{method:'POST'}); alert('Restarted.'); }
    await loadAll(); showSection(currentTab);
  };
  window.assignTaskToBot = async function(name) {
    var task=prompt('Task for '+name+':'); if(!task) return;
    await fetch(API+'/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:task,priority:'P2',assignee:name,status:'pending'})});
    await loadAll(); if(selectedBot) renderDetail(selectedBot);
  };
  window.triggerBot = async function(name) {
    await fetch(API+'/api/bot/'+name.toLowerCase().replace('bot','')+'/task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'run'})});
    alert(name+' triggered!'); await loadAll();
  };
  window.viewBotLogs = async function(name) {
    var r=await sf(API+'/api/bots/feedback/'+name);
    var fb=Array.isArray(r)?r:(r.feedback||[]);
    alert(name+' Logs:\n\n'+(fb.length?fb.slice(-5).map(function(f){return (f.timestamp||'')+': '+(f.message||f.action||'');}).join('\n'):'No logs'));
  };
  window.resetBot = function(name) { if(confirm('Reset '+name+'?')) alert('Reset queued.'); };
  window.deleteBot = async function(name,id) {
    if(!confirm('DELETE '+name+'? This removes it from the registry.')) return;
    var res=await fetch(API+'/api/bots/'+id,{method:'DELETE'});
    var data=await res.json();
    if(data.success){alert(name+' deleted. '+data.remaining+' bots remaining.');closeBotDetail();await loadAll();showSection('bots');}
    else alert('Error: '+(data.error||'unknown'));
  };
  window.refreshBotManager = async function() { await loadAll(); showSection(currentTab); };

  // ============================================
  // ADD BOT
  // ============================================
  function renderAddBot() {
    var h='<div style="padding:20px 24px;">';
    h+=sec('Register New Bot');
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">';
    h+=formField('bot-id','Bot ID','e.g. mybot');
    h+=formField('bot-name','Bot Name','e.g. MyBot');
    h+=formField('bot-icon','Icon (emoji)','e.g. \ud83e\udd16');
    h+=formField('bot-role','Role','e.g. Data Analyst');
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:20px;">';
    h+=formField('bot-system','System Prompt','Describe what this bot does...');
    h+=formField('bot-caps','Capabilities (comma separated)','e.g. analysis, reporting, charting');
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">';
    h+='<div><label style="font-size:0.75em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Model</label>' +
      '<select id="bot-model" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#eee;font-size:0.85em;">' +
      '<option value="haiku">Haiku (Cheap)</option><option value="sonnet">Sonnet (Smart)</option>' +
      '<option value="opus">Opus (Heavy)</option><option value="grok">Grok</option></select></div>';
    h+='<div><label style="font-size:0.75em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Schedule</label>' +
      '<select id="bot-schedule" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#eee;font-size:0.85em;">' +
      '<option value="on_task">On Task</option><option value="heartbeat">Every Heartbeat</option>' +
      '<option value="hourly">Hourly</option><option value="daily">Daily</option>' +
      '<option value="scheduled">Scheduled</option><option value="realtime">Real-time</option>' +
      '<option value="passive">Passive</option></select></div>';
    h+='<div><label style="font-size:0.75em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Status</label>' +
      '<select id="bot-status" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#eee;font-size:0.85em;">' +
      '<option value="active">Active</option><option value="idle">Idle</option><option value="disabled">Disabled</option></select></div>';
    h+='</div>';
    
    h+=sec('Cross-References');
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">';
    h+=formField('bot-feeds','Feeds To (comma separated)','e.g. DiaryBot, BusinessBot');
    h+=formField('bot-fedby','Fed By (comma separated)','e.g. ResearchBot, CodeBot');
    h+='</div>';
    h+=formField('bot-shares','Data Shared','e.g. Analysis results, reports');

    h+='<div style="display:flex;gap:12px;margin-top:20px;">';
    h+='<button onclick="registerNewBot()" style="flex:1;padding:14px;border-radius:10px;border:1px solid rgba(139,92,246,0.4);background:rgba(139,92,246,0.2);color:#a78bfa;font-size:0.95em;font-weight:600;cursor:pointer;">\ud83e\udd16 Register Bot</button>';
    h+='<button onclick="importBotJSON()" style="flex:1;padding:14px;border-radius:10px;border:1px solid rgba(6,182,212,0.4);background:rgba(6,182,212,0.15);color:#22d3ee;font-size:0.95em;font-weight:600;cursor:pointer;">\ud83d\udce5 Import JSON</button>';
    h+='</div>';

    h+=sec('Import Bot Module');
    h+='<div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:10px;font-size:0.85em;color:var(--text-secondary,#ccc);line-height:1.6;">';
    h+='<p>Drop a bot module JSON file or paste a config to instantly add a new bot to your fleet.</p>';
    h+='<p>Bot modules work across all platforms — the registry is shared via the API.</p>';
    h+='<textarea id="bot-json-import" rows="6" placeholder=\'{"id":"mybot","name":"MyBot","icon":"\ud83e\udd16","role":"...",\"model\":\"haiku\",...}\' style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.2);color:#eee;font-family:monospace;font-size:0.85em;resize:vertical;"></textarea>';
    h+='<button onclick="importFromJSON()" style="margin-top:8px;padding:10px 20px;border-radius:8px;border:1px solid rgba(16,185,129,0.4);background:rgba(16,185,129,0.15);color:#34d399;cursor:pointer;font-size:0.85em;">\u2705 Import from JSON</button>';
    h+='</div>';

    // Export all bots
    h+=sec('Export Fleet');
    h+='<button onclick="exportFleet()" style="padding:10px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--text-secondary,#ccc);cursor:pointer;font-size:0.85em;">\ud83d\udce4 Export All Bots as JSON</button>';

    h+='</div>';
    return h;
  }

  function formField(id,label,placeholder) {
    return '<div><label style="font-size:0.75em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">'+label+'</label>' +
      '<input id="'+id+'" placeholder="'+placeholder+'" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#eee;font-size:0.85em;box-sizing:border-box;"></div>';
  }

  window.registerNewBot = async function() {
    var id=gv('bot-id'), name=gv('bot-name'), icon=gv('bot-icon')||'\ud83e\udd16';
    if(!id||!name) { alert('ID and Name required'); return; }
    var bot = {
      id:id, name:name, icon:icon, status:gv('bot-status')||'active',
      role:gv('bot-role')||name, model:gv('bot-model')||'haiku',
      system:gv('bot-system')||'You are '+name+'. '+gv('bot-role'),
      capabilities:(gv('bot-caps')||'').split(',').map(function(s){return s.trim();}).filter(Boolean),
      feeds:(gv('bot-feeds')||'').split(',').map(function(s){return s.trim();}).filter(Boolean),
      fedBy:(gv('bot-fedby')||'').split(',').map(function(s){return s.trim();}).filter(Boolean),
      shares:gv('bot-shares')||'', schedule:gv('bot-schedule')||'on_task',
      config:{autoAssign:true,'24x7':true,crossRef:true,createTasks:true,logToDiary:true}
    };
    var res = await fetch(API+'/api/bots/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bot)});
    var data = await res.json();
    if(data.success) { alert(name+' registered! Total: '+data.total+' bots'); await loadAll(); showSection('bots'); }
    else alert('Error: '+(data.error||'unknown'));
  };
  function gv(id){var e=document.getElementById(id);return e?e.value.trim():'';}

  window.importFromJSON = async function() {
    var ta=document.getElementById('bot-json-import');
    if(!ta||!ta.value.trim()) { alert('Paste bot JSON first'); return; }
    try {
      var bot=JSON.parse(ta.value.trim());
      if(!bot.id||!bot.name) { alert('JSON must have id and name'); return; }
      var res=await fetch(API+'/api/bots/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bot)});
      var data=await res.json();
      if(data.success) { alert(bot.name+' imported!'); ta.value=''; await loadAll(); showSection('bots'); }
      else alert('Error: '+(data.error||'unknown'));
    } catch(e) { alert('Invalid JSON: '+e.message); }
  };

  window.importBotJSON = function() {
    var input=document.createElement('input');input.type='file';input.accept='.json';
    input.onchange=async function(e){
      var file=e.target.files[0]; if(!file) return;
      var text=await file.text();
      try {
        var bot=JSON.parse(text);
        if(!bot.id||!bot.name) { alert('JSON must have id and name'); return; }
        var res=await fetch(API+'/api/bots/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bot)});
        var data=await res.json();
        if(data.success) { alert(bot.name+' imported from file!'); await loadAll(); showSection('bots'); }
        else alert('Error: '+(data.error||'unknown'));
      } catch(err) { alert('Invalid JSON file: '+err.message); }
    };
    input.click();
  };

  window.exportFleet = function() {
    var data=Object.values(botData).map(function(b){return {id:b.id,name:b.name,icon:b.icon,status:b.status,role:b.role,model:b.model,system:b.system,capabilities:b.capabilities,feeds:b.feeds,fedBy:b.fedBy,shares:b.shares,schedule:b.schedule,config:b.botConfig};});
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pinky-bot-fleet.json';a.click();
  };

  // ============================================
  // MARKETPLACE / MODULES
  // ============================================
  function renderMarketplace() {
    var h='<div style="padding:20px 24px;">';
    h+=sec('Bot Module Marketplace');
    h+='<div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:10px;margin-bottom:20px;">';
    h+='<div style="font-size:0.9em;color:var(--text-secondary,#ccc);line-height:1.6;">Browse and install community bot modules. Each module adds new capabilities to your fleet. Modules work across all platforms via the universal bot registry API.</div></div>';

    h+='<div style="display:flex;gap:12px;margin-bottom:20px;">';
    h+='<input id="mp-search" placeholder="Search modules..." style="flex:1;padding:10px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#eee;font-size:0.85em;" onkeyup="searchMarketplace()">';
    h+='<button onclick="loadMarketplace()" style="padding:10px 16px;border-radius:8px;border:1px solid rgba(139,92,246,0.3);background:rgba(139,92,246,0.1);color:#a78bfa;cursor:pointer;font-size:0.85em;">\ud83d\udd04 Refresh</button>';
    h+='</div>';

    h+='<div id="mp-listings" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">';
    h+=mpCard('SEOBot','\ud83d\udd17','SEO analysis, keyword research, meta tag generation, sitemap audits','seo','haiku',['SEO audit','Keyword research','Meta generation']);
    h+=mpCard('EmailBot','\u2709\ufe0f','Draft, schedule, and manage email campaigns with AI-powered content','email','haiku',['Email drafting','Campaign scheduling','A/B testing']);
    h+=mpCard('AnalyticsBot','\ud83d\udcc8','Data analysis, visualization, trend detection, anomaly alerts','analytics','sonnet',['Data analysis','Visualization','Trend detection']);
    h+=mpCard('SecurityBot','\ud83d\udd12','Security scanning, vulnerability detection, compliance checks','security','sonnet',['Vuln scanning','Compliance','Incident response']);
    h+=mpCard('TranslateBot','\ud83c\udf0d','Multi-language translation, localization, content adaptation','translate','haiku',['Translation','Localization','Content adaptation']);
    h+=mpCard('DesignBot','\ud83c\udfa8','UI/UX suggestions, design system management, accessibility audits','design','sonnet',['UI suggestions','Design systems','Accessibility']);
    h+='</div>';

    h+=sec('Installed Plugins');
    h+='<div id="mp-installed">Loading...</div>';
    h+='</div>';
    setTimeout(loadInstalledPlugins, 100);
    return h;
  }

  function mpCard(name,icon,desc,id,model,caps) {
    return '<div style="padding:16px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);transition:all 0.2s;" onmouseover="this.style.borderColor=\'rgba(139,92,246,0.3)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.06)\'">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
      '<span style="font-size:1.5em;">'+icon+'</span><div style="flex:1;">' +
      '<div style="font-weight:600;color:var(--text-primary,#eee);">'+name+'</div>' +
      '<div style="font-size:0.7em;color:var(--text-muted,#888);">Model: '+model+'</div></div></div>' +
      '<div style="font-size:0.82em;color:var(--text-secondary,#ccc);margin-bottom:10px;line-height:1.4;">'+desc+'</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">'+caps.map(function(c){return '<span style="font-size:0.7em;padding:2px 8px;border-radius:4px;background:rgba(139,92,246,0.08);color:#a78bfa;">'+c+'</span>';}).join('')+'</div>' +
      '<button onclick="installModule(\''+id+'\',\''+name+'\',\''+icon+'\',\''+model+'\',\''+desc.replace(/'/g,"")+'\',\''+caps.join(",")+'\' )" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(16,185,129,0.3);background:rgba(16,185,129,0.1);color:#34d399;cursor:pointer;font-size:0.82em;">\u2795 Install</button></div>';
  }

  window.installModule = async function(id,name,icon,model,desc,capsStr) {
    var caps=capsStr.split(',');
    var bot={id:id,name:name,icon:icon,status:'active',role:desc.substring(0,50),model:model,
      system:'You are '+name+'. '+desc,capabilities:caps,feeds:['DiaryBot'],fedBy:[],
      shares:name+' outputs',schedule:'on_task',config:{autoAssign:true,'24x7':true,crossRef:true,createTasks:true,logToDiary:true}};
    var res=await fetch(API+'/api/bots/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bot)});
    var data=await res.json();
    if(data.success){alert(name+' installed!');await loadAll();showSection('bots');}
    else alert('Error: '+(data.error||'unknown'));
  };

  async function loadInstalledPlugins() {
    var el=document.getElementById('mp-installed');if(!el)return;
    try {
      var res=await sf(API+'/api/plugins');
      var plugins=Array.isArray(res)?res:(res.plugins||[]);
      if(!plugins.length){el.innerHTML=em('No plugins installed');return;}
      var h='';
      plugins.forEach(function(p){h+=mr(p.name||p.id,p.status||'installed');});
      el.innerHTML=h;
    } catch(e){el.innerHTML=em('Could not load plugins');}
  }

  window.searchMarketplace = function() {
    var q=(document.getElementById('mp-search')||{}).value||'';
    var cards=document.querySelectorAll('#mp-listings > div');
    cards.forEach(function(c){c.style.display=c.textContent.toLowerCase().includes(q.toLowerCase())?'':'none';});
  };
  window.loadMarketplace = function() { showSection('marketplace'); };

  
  // ============================================
  // HELPERS
  // ============================================
  function sec(t){return '<div style="font-size:0.8em;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted,#888);margin:20px 0 10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.05);">'+t+'</div>';}
  function mr(l,v){return '<div class="bot-metric-row"><span class="bot-metric-label">'+l+'</span><span class="bot-metric-value">'+v+'</span></div>';}
  function ti(t,s){var n=(t.name||'Unnamed').substring(0,55),a=t.updated?ta(t.updated):'';return '<div class="bot-task-item '+s+'"><span class="bot-task-item-name">'+n+'</span><span class="bot-task-item-status '+s+'">'+s+'</span>'+(a?'<span style="font-size:0.7em;color:var(--text-muted,#888);">'+a+'</span>':'')+'</div>';}
  function em(m){return '<div style="text-align:center;color:var(--text-muted,#888);padding:12px;font-size:0.82em;">'+m+'</div>';}
  function fs(v,l){return '<div class="fleet-stat"><span class="fleet-stat-value">'+v+'</span><span class="fleet-stat-label">'+l+'</span></div>';}
  function ta(d){var s=Math.floor((Date.now()-new Date(d).getTime())/1000);if(s<60)return 'now';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d';}
})();
