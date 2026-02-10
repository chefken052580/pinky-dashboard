/**
 * SOCIALBOT COMMAND CENTER
 * The economic powerhouse for content creation & brand management
 * PinkyBot.io
 */
(function() {
  'use strict';

  var API = (typeof API_BASE !== 'undefined' ? API_BASE : '') ||
            (window.location.hostname === 'localhost' ? '' : 'https://pinky-api.crackerbot.io');

  var state = {
    companies: [],
    posts: [],
    scheduled: [],
    selectedCompany: null,
    activeTab: 'dashboard',
    platforms: [
      { id:'twitter', icon:'\ud835\udd4f', name:'Twitter/X', charLimit: 280, color:'#1da1f2' },
      { id:'instagram', icon:'\ud83d\udcf8', name:'Instagram', charLimit: 2200, color:'#e1306c' },
      { id:'tiktok', icon:'\ud83c\udfb5', name:'TikTok', charLimit: 2200, color:'#010101' },
      { id:'linkedin', icon:'\ud83d\udcbc', name:'LinkedIn', charLimit: 3000, color:'#0077b5' },
      { id:'bluesky', icon:'\ud83e\udd4b', name:'Bluesky', charLimit: 300, color:'#0085ff' },
      { id:'mastodon', icon:'\ud83d\udc18', name:'Mastodon', charLimit: 500, color:'#6364ff' },
      { id:'discord', icon:'\ud83d\udcac', name:'Discord', charLimit: 2000, color:'#5865f2' },
      { id:'telegram', icon:'\u2708\ufe0f', name:'Telegram', charLimit: 4096, color:'#26a5e4' }
    ],
    selectedPlatforms: ['twitter', 'linkedin'],
    analytics: { posts: 0, engagement: 0, reach: 0, clicks: 0, followers: 0 }
  };

  // ══════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════
  window.initSocialBotUI = function() {
    var container = document.getElementById('social-media-view');
    if (!container) return;
    loadCompanies();
    loadPosts();
    renderCommandCenter(container);
  };

  function loadCompanies() {
    fetch(API + '/api/companies')
      .then(function(r) { return r.ok ? r.json() : { companies: [] }; })
      .then(function(d) { state.companies = d.companies || d || []; })
      .catch(function() { state.companies = []; });
  }

  function loadPosts() {
    fetch(API + '/api/posts')
      .then(function(r) { return r.ok ? r.json() : { posts: [] }; })
      .then(function(d) { state.posts = d.posts || d || []; })
      .catch(function() { state.posts = []; });
  }

  // ══════════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════════
  function renderCommandCenter(container) {
    var postCount = state.posts.length;
    var companyCount = state.companies.length;
    var scheduledCount = state.scheduled.length;
    var apiKeys = getStoredAPIs();
    var connectedCount = Object.keys(apiKeys).filter(function(k) { return apiKeys[k].connected; }).length;

    container.innerHTML = '' +
      '<div class="social-command-center">' +
        // Hero Stats
        '<div class="social-hero">' +
          heroStat('\ud83c\udfe2', companyCount, 'Companies') +
          heroStat('\ud83d\udcdd', postCount, 'Posts Created') +
          heroStat('\ud83d\udcc5', scheduledCount, 'Scheduled') +
          heroStat('\ud83d\udd17', connectedCount + '/8', 'Platforms') +
          heroStat('\ud83d\udcc8', state.analytics.engagement + '%', 'Engagement') +
        '</div>' +

        // Tab Navigation
        '<div class="social-tabs" id="social-cmd-tabs">' +
          tab('dashboard', '\ud83c\udfaf Dashboard', true) +
          tab('create', '\u270d\ufe0f Create Post') +
          tab('scheduled', '\ud83d\udcc5 Scheduled') +
          tab('campaigns', '\ud83d\ude80 Campaigns') +
          tab('analytics', '\ud83d\udcca Analytics') +
          tab('companies', '\ud83c\udfe2 Companies') +
          tab('settings', '\u2699\ufe0f Connections') +
        '</div>' +

        // Tab Content
        '<div id="social-cmd-content"></div>' +
      '</div>';

    // Attach tab handlers
    container.querySelectorAll('.social-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.activeTab = this.dataset.tab;
        container.querySelectorAll('.social-tab').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        renderTabContent();
      });
    });

    renderTabContent();
  }

  function heroStat(emoji, value, label) {
    return '<div class="social-hero-stat"><span class="stat-emoji">' + emoji + '</span><div class="stat-num">' + value + '</div><div class="stat-label">' + label + '</div></div>';
  }

  function tab(id, label, active) {
    return '<button class="social-tab' + (active ? ' active' : '') + '" data-tab="' + id + '">' + label + '</button>';
  }

  // ══════════════════════════════════════════
  //  TAB CONTENT ROUTER
  // ══════════════════════════════════════════
  function renderTabContent() {
    var c = document.getElementById('social-cmd-content');
    if (!c) return;
    switch (state.activeTab) {
      case 'dashboard': renderDashboard(c); break;
      case 'create': renderCreatePost(c); break;
      case 'scheduled': renderScheduled(c); break;
      case 'campaigns': renderCampaigns(c); break;
      case 'analytics': renderAnalytics(c); break;
      case 'companies': renderCompanies(c); break;
      case 'settings': renderConnections(c); break;
    }
  }

  // ══════════════════════════════════════════
  //  DASHBOARD TAB
  // ══════════════════════════════════════════
  function renderDashboard(c) {
    var recentPosts = state.posts.slice(-5).reverse();
    var html = '' +
      '<div class="social-section-header"><h3>\ud83d\udcca Quick Overview</h3></div>' +

      '<div class="analytics-grid">' +
        // Platform Performance
        '<div class="analytics-card"><h4>\ud83d\udd17 Platform Reach</h4>' +
          analyticsBar('Twitter/X', 72, '2.4K') +
          analyticsBar('LinkedIn', 58, '1.8K') +
          analyticsBar('Instagram', 45, '1.2K') +
          analyticsBar('Bluesky', 23, '450') +
          analyticsBar('Discord', 15, '280') +
        '</div>' +

        // Content Mix
        '<div class="analytics-card"><h4>\ud83c\udfaf Content Performance</h4>' +
          analyticsBar('Original Posts', 85, '85%') +
          analyticsBar('Reposts/Shares', 62, '62%') +
          analyticsBar('Threads', 48, '48%') +
          analyticsBar('Media Posts', 91, '91%') +
          analyticsBar('Polls', 35, '35%') +
        '</div>' +

        // Engagement
        '<div class="analytics-card"><h4>\u2764\ufe0f Engagement Metrics</h4>' +
          analyticsBar('Likes', 78, '4.2K') +
          analyticsBar('Comments', 42, '890') +
          analyticsBar('Shares', 55, '1.1K') +
          analyticsBar('Clicks', 67, '2.8K') +
          analyticsBar('Saves', 31, '520') +
        '</div>' +
      '</div>' +

      '<div class="social-section-header"><h3>\ud83d\udcdd Recent Posts</h3><button class="header-action" onclick="SocialCmd.switchTo(\'create\')">+ New Post</button></div>';

    if (recentPosts.length > 0) {
      html += '<table class="history-table"><thead><tr><th>Platform</th><th>Content</th><th>Date</th><th>Status</th></tr></thead><tbody>';
      recentPosts.forEach(function(p) {
        var status = p.status || 'published';
        html += '<tr><td>' + (p.platform || 'Multi') + '</td><td>' + truncate(p.content || p.text || '', 60) + '</td><td>' + formatDate(p.createdAt || p.date) + '</td><td><span class="post-status-badge ' + status + '">' + status + '</span></td></tr>';
      });
      html += '</tbody></table>';
    } else {
      html += emptyState('\ud83d\udcdd', 'No posts yet', 'Create your first post to start building your social presence');
    }

    c.innerHTML = html;
  }

  // ══════════════════════════════════════════
  //  CREATE POST TAB
  // ══════════════════════════════════════════
  function renderCreatePost(c) {
    var html = '' +
      '<div class="content-creator">' +
        '<div class="creator-editor">' +
          '<div class="social-section-header"><h3>\u270d\ufe0f Compose Post</h3></div>' +

          // Company selector
          '<div style="margin-bottom:14px;">' +
            '<label style="font-size:0.82em;color:rgba(255,255,255,0.4);display:block;margin-bottom:6px;">Posting as:</label>' +
            '<select id="social-post-company" style="width:100%;padding:8px 12px;background:rgba(0,0,0,0.2);border:1px solid rgba(120,80,255,0.15);border-radius:8px;color:#e0e0f0;font-size:0.9em;">' +
              '<option value="">Select Company...</option>' +
              state.companies.map(function(co) { return '<option value="' + co.id + '">' + (co.name || co.companyName) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +

          // Platform toggles
          '<div class="platform-selector" id="platform-selector">' +
            state.platforms.map(function(p) {
              var isActive = state.selectedPlatforms.indexOf(p.id) > -1;
              return '<div class="platform-toggle' + (isActive ? ' active' : '') + '" data-platform="' + p.id + '" onclick="SocialCmd.togglePlatform(\'' + p.id + '\')">' + p.icon + ' ' + p.name + '</div>';
            }).join('') +
          '</div>' +

          // Text editor
          '<textarea id="social-post-text" placeholder="What\'s on your mind? Type your message or let AI generate content..." oninput="SocialCmd.updatePreview()"></textarea>' +

          // Toolbar
          '<div class="creator-toolbar">' +
            '<button class="ai-generate-btn" onclick="SocialCmd.aiGenerate()">\ud83e\udde0 AI Generate</button>' +
            '<button class="schedule-btn" onclick="SocialCmd.schedulePost()">\ud83d\udcc5 Schedule</button>' +
            '<button class="post-now-btn" onclick="SocialCmd.postNow()">\ud83d\ude80 Post Now</button>' +
            '<button class="creator-toolbar button" style="background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);border-color:rgba(255,255,255,0.1)!important" onclick="SocialCmd.addMedia()">\ud83d\uddbc\ufe0f Media</button>' +
            '<button class="creator-toolbar button" style="background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);border-color:rgba(255,255,255,0.1)!important" onclick="SocialCmd.addHashtags()"># Hashtags</button>' +
          '</div>' +
        '</div>' +

        // Live Preview
        '<div class="creator-preview">' +
          '<div class="preview-title">\ud83d\udc41\ufe0f Live Preview</div>' +
          '<div id="social-preview-area">' +
            renderPreviewCards('') +
          '</div>' +
        '</div>' +
      '</div>';

    c.innerHTML = html;
  }

  function renderPreviewCards(text) {
    if (!text) text = 'Your post preview will appear here...';
    var html = '';
    state.selectedPlatforms.forEach(function(pid) {
      var p = state.platforms.find(function(x) { return x.id === pid; });
      if (!p) return;
      var len = text.length;
      var countClass = len > p.charLimit ? 'over' : (len > p.charLimit * 0.8 ? 'warning' : '');
      html += '<div class="preview-card">' +
        '<div class="preview-card-header">' +
          '<div class="preview-avatar">' + p.icon + '</div>' +
          '<div><div class="preview-card-name">' + p.name + '</div><div class="preview-card-handle">@yourhandle</div></div>' +
        '</div>' +
        '<div class="preview-card-body">' + escHtml(truncate(text, p.charLimit)) + '</div>' +
        '<div class="preview-char-count ' + countClass + '">' + len + ' / ' + p.charLimit + '</div>' +
      '</div>';
    });
    return html || '<div class="social-empty-state"><p>Select platforms to see previews</p></div>';
  }

  // ══════════════════════════════════════════
  //  SCHEDULED TAB
  // ══════════════════════════════════════════
  function renderScheduled(c) {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var firstDay = new Date(year, month, 1).getDay();
    var today = now.getDate();
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    var html = '<div class="social-section-header"><h3>\ud83d\udcc5 ' + monthNames[month] + ' ' + year + '</h3><button class="header-action" onclick="SocialCmd.switchTo(\'create\')">+ Schedule Post</button></div>';

    html += '<div class="schedule-grid">';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(d) {
      html += '<div class="schedule-day-header">' + d + '</div>';
    });

    // Empty cells before first day
    for (var i = 0; i < firstDay; i++) {
      html += '<div class="schedule-day other-month"></div>';
    }

    // Days of month
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = d === today;
      var hasPosts = state.scheduled.some(function(s) { return new Date(s.date).getDate() === d; });
      html += '<div class="schedule-day' + (isToday ? ' today' : '') + (hasPosts ? ' has-posts' : '') + '">' + d + '</div>';
    }
    html += '</div>';

    // Upcoming scheduled posts
    html += '<div class="social-section-header"><h3>\u23f0 Upcoming Posts</h3></div>';
    if (state.scheduled.length > 0) {
      html += '<div class="scheduled-list">';
      state.scheduled.forEach(function(s) {
        html += '<div class="scheduled-item"><span class="scheduled-time">' + formatTime(s.date) + '</span><span class="scheduled-platforms">' + (s.platforms || []).map(function(pid) { var p = state.platforms.find(function(x) { return x.id === pid; }); return p ? p.icon : ''; }).join(' ') + '</span><span class="scheduled-content">' + truncate(s.content || '', 50) + '</span></div>';
      });
      html += '</div>';
    } else {
      html += emptyState('\ud83d\udcc5', 'No scheduled posts', 'Schedule your first post to fill up this calendar');
    }

    c.innerHTML = html;
  }

  // ══════════════════════════════════════════
  //  CAMPAIGNS TAB
  // ══════════════════════════════════════════
  function renderCampaigns(c) {
    var campaigns = [
      { name: 'Product Launch', status: 'draft', progress: 0, posts: 0, total: 12, startDate: 'Not set', platforms: ['twitter', 'linkedin', 'instagram'] },
    ];

    var html = '<div class="social-section-header"><h3>\ud83d\ude80 Marketing Campaigns</h3><button class="header-action" onclick="SocialCmd.newCampaign()">+ New Campaign</button></div>';

    html += '<div class="campaign-grid">';
    campaigns.forEach(function(camp) {
      var pct = camp.total > 0 ? Math.round(camp.posts / camp.total * 100) : 0;
      html += '<div class="campaign-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
          '<strong style="color:var(--text-primary,#e0e0f0);font-size:1.05em;">' + camp.name + '</strong>' +
          '<span class="campaign-status ' + camp.status + '">' + camp.status + '</span>' +
        '</div>' +
        '<div class="campaign-progress"><div class="campaign-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:0.82em;color:rgba(255,255,255,0.4);">' +
          '<span>' + camp.posts + '/' + camp.total + ' posts</span>' +
          '<span>Starts: ' + camp.startDate + '</span>' +
        '</div>' +
        '<div style="margin-top:12px;display:flex;gap:6px;">' +
          camp.platforms.map(function(pid) { var p = state.platforms.find(function(x) { return x.id === pid; }); return p ? '<span class="platform-chip connected">' + p.icon + '</span>' : ''; }).join('') +
        '</div>' +
      '</div>';
    });

    // Add campaign card
    html += '<div class="company-card add-company-card" onclick="SocialCmd.newCampaign()"><div class="add-icon">+</div><span>Create Campaign</span></div>';
    html += '</div>';

    c.innerHTML = html;
  }

  // ══════════════════════════════════════════
  //  ANALYTICS TAB
  // ══════════════════════════════════════════
  function renderAnalytics(c) {
    var html = '<div class="social-section-header"><h3>\ud83d\udcca Performance Analytics</h3></div>';

    html += '<div class="analytics-grid">' +
      // Audience Growth
      '<div class="analytics-card"><h4>\ud83d\udcc8 Audience Growth</h4>' +
        analyticsBar('Twitter/X', 82, '+340') +
        analyticsBar('LinkedIn', 65, '+280') +
        analyticsBar('Instagram', 48, '+190') +
        analyticsBar('Bluesky', 35, '+120') +
        analyticsBar('Discord', 28, '+85') +
      '</div>' +

      // Best Posting Times
      '<div class="analytics-card"><h4>\u23f0 Best Posting Times</h4>' +
        analyticsBar('9:00 AM', 92, 'Peak') +
        analyticsBar('12:30 PM', 78, 'High') +
        analyticsBar('5:00 PM', 85, 'Peak') +
        analyticsBar('8:00 PM', 65, 'Good') +
        analyticsBar('11:00 PM', 40, 'Low') +
      '</div>' +

      // Content Type Performance
      '<div class="analytics-card"><h4>\ud83c\udfaf Content Types</h4>' +
        analyticsBar('Images', 95, '95%') +
        analyticsBar('Videos', 88, '88%') +
        analyticsBar('Text Only', 52, '52%') +
        analyticsBar('Polls', 71, '71%') +
        analyticsBar('Threads', 67, '67%') +
      '</div>' +

      // Top Hashtags
      '<div class="analytics-card"><h4># Top Hashtags</h4>' +
        analyticsBar('#AI', 90, '2.1K') +
        analyticsBar('#Startup', 72, '1.4K') +
        analyticsBar('#BuildInPublic', 68, '1.2K') +
        analyticsBar('#SaaS', 55, '890') +
        analyticsBar('#Automation', 42, '650') +
      '</div>' +
    '</div>';

    c.innerHTML = html;
  }

  // ══════════════════════════════════════════
  //  COMPANIES TAB
  // ══════════════════════════════════════════
  function renderCompanies(c) {
    var html = '<div class="social-section-header"><h3>\ud83c\udfe2 Your Companies</h3><button class="header-action" onclick="SocialCmd.addCompany()">+ Add Company</button></div>';

    html += '<div class="company-grid">';

    if (state.companies.length > 0) {
      state.companies.forEach(function(co) {
        var name = co.name || co.companyName || 'Unnamed';
        var plats = co.platforms || co.socialPlatforms || [];
        html += '<div class="company-card' + (state.selectedCompany === co.id ? ' selected' : '') + '" onclick="SocialCmd.selectCompany(\'' + co.id + '\')">' +
          '<div class="company-card-header">' +
            '<div class="company-card-name">' + escHtml(name) + '</div>' +
            '<div class="company-card-actions">' +
              '<button onclick="event.stopPropagation();SocialCmd.editCompany(\'' + co.id + '\')" title="Edit">\u270f\ufe0f</button>' +
              '<button onclick="event.stopPropagation();SocialCmd.deleteCompany(\'' + co.id + '\')" title="Delete">\ud83d\uddd1\ufe0f</button>' +
            '</div>' +
          '</div>' +
          '<div class="company-platforms">' +
            (Array.isArray(plats) ? plats.map(function(pid) {
              var p = state.platforms.find(function(x) { return x.id === pid; });
              return p ? '<span class="platform-chip connected">' + p.icon + ' ' + p.name + '</span>' : '';
            }).join('') : '') +
          '</div>' +
          '<div class="company-card-meta"><span>Created: ' + formatDate(co.createdAt || co.created) + '</span></div>' +
        '</div>';
      });
    }

    html += '<div class="company-card add-company-card" onclick="SocialCmd.addCompany()"><div class="add-icon">+</div><span>Add Company</span></div>';
    html += '</div>';

    c.innerHTML = html;
  }

  // ══════════════════════════════════════════
  //  CONNECTIONS/SETTINGS TAB
  // ══════════════════════════════════════════
  function renderConnections(c) {
    var stored = getStoredAPIs();

    var html = '<div class="social-section-header"><h3>\ud83d\udd11 Platform Connections</h3></div>' +
      '<p style="color:rgba(255,255,255,0.4);margin-bottom:20px;font-size:0.9em;">Connect your social accounts to enable automated posting and analytics tracking.</p>';

    html += '<div class="social-api-grid">';
    state.platforms.forEach(function(p) {
      var pData = stored[p.id] || {};
      var connected = pData.connected || false;
      var fields = getAPIFields(p.id);

      html += '<div class="social-api-card ' + (connected ? 'connected' : '') + '">' +
        '<div class="social-api-card-header">' +
          '<span class="social-api-icon">' + p.icon + '</span>' +
          '<strong>' + p.name + '</strong>' +
          '<span class="social-api-status">' + (connected ? '\u2705 Connected' : '\u26aa Not connected') + '</span>' +
        '</div>';
      fields.forEach(function(f) {
        var val = pData[f.k] || '';
        html += '<input type="password" class="social-api-input" data-platform="' + p.id + '" data-field="' + f.k + '" placeholder="' + f.l + '" value="' + val + '" />';
      });
      html += '<button class="social-api-test-btn" onclick="SocialCmd.testConnection(\'' + p.id + '\')">Test Connection</button>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div style="margin-top:20px;text-align:right;"><button class="social-api-save-btn" onclick="SocialCmd.saveConnections()">\ud83d\udcbe Save All Connections</button></div>';

    c.innerHTML = html;
  }

  function getAPIFields(platformId) {
    var fieldMap = {
      twitter: [{k:'key',l:'API Key'},{k:'secret',l:'API Secret'}],
      instagram: [{k:'token',l:'Business Account Token'}],
      tiktok: [{k:'token',l:'Creator Token'}],
      linkedin: [{k:'token',l:'Access Token'}],
      bluesky: [{k:'key',l:'API Key'},{k:'handle',l:'Handle (e.g. @user.bsky.social)'}],
      mastodon: [{k:'token',l:'Access Token'},{k:'instance',l:'Instance URL'}],
      discord: [{k:'webhook',l:'Webhook URL'}],
      telegram: [{k:'token',l:'Bot Token'},{k:'chatId',l:'Chat ID'}]
    };
    return fieldMap[platformId] || [{k:'token',l:'API Token'}];
  }

  function getStoredAPIs() {
    try { return JSON.parse(localStorage.getItem('pinky-social-apis') || '{}'); } catch(e) { return {}; }
  }

  // ══════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════
  function analyticsBar(label, pct, value) {
    return '<div class="analytics-bar"><span class="analytics-bar-label">' + label + '</span><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:' + pct + '%"></div></div><span class="analytics-bar-value">' + value + '</span></div>';
  }

  function emptyState(icon, title, desc) {
    return '<div class="social-empty-state"><div class="empty-icon">' + icon + '</div><h4>' + title + '</h4><p>' + desc + '</p></div>';
  }

  function truncate(str, len) { return str.length > len ? str.substring(0, len) + '...' : str; }
  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function formatDate(d) {
    if (!d) return '-';
    try { var dt = new Date(d); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch(e) { return d; }
  }

  function formatTime(d) {
    if (!d) return '-';
    try { var dt = new Date(d); return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } catch(e) { return d; }
  }

  // ══════════════════════════════════════════
  //  PUBLIC API (window.SocialCmd)
  // ══════════════════════════════════════════
  window.SocialCmd = {
    switchTo: function(tab) {
      state.activeTab = tab;
      var container = document.getElementById('social-media-view');
      if (container) {
        container.querySelectorAll('.social-tab').forEach(function(b) {
          b.classList.toggle('active', b.dataset.tab === tab);
        });
      }
      renderTabContent();
    },

    togglePlatform: function(pid) {
      var idx = state.selectedPlatforms.indexOf(pid);
      if (idx > -1) state.selectedPlatforms.splice(idx, 1);
      else state.selectedPlatforms.push(pid);
      // Update toggle buttons
      document.querySelectorAll('.platform-toggle').forEach(function(el) {
        el.classList.toggle('active', state.selectedPlatforms.indexOf(el.dataset.platform) > -1);
      });
      this.updatePreview();
    },

    updatePreview: function() {
      var textarea = document.getElementById('social-post-text');
      var area = document.getElementById('social-preview-area');
      if (textarea && area) area.innerHTML = renderPreviewCards(textarea.value);
    },

    aiGenerate: function() {
      var textarea = document.getElementById('social-post-text');
      if (!textarea) return;
      var topic = textarea.value || prompt('What should the post be about?');
      if (!topic) return;
      textarea.value = 'Generating with AI...';
      textarea.disabled = true;

      fetch(API + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Write a short, engaging social media post about: ' + topic + '. Keep it under 280 characters. Be witty and professional. Just return the post text, nothing else.',
          context: 'socialbot-content-creator'
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        textarea.value = d.response || d.message || d.text || 'Could not generate. Try again!';
        textarea.disabled = false;
        window.SocialCmd.updatePreview();
      })
      .catch(function(e) {
        textarea.value = topic;
        textarea.disabled = false;
        alert('AI generation failed: ' + e.message);
      });
    },

    postNow: function() {
      var text = document.getElementById('social-post-text');
      var company = document.getElementById('social-post-company');
      if (!text || !text.value.trim()) { alert('Write something first!'); return; }

      var postData = {
        content: text.value,
        platforms: state.selectedPlatforms,
        companyId: company ? company.value : null,
        publishNow: true
      };

      fetch(API + '/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success || d.id) {
          alert('\ud83d\ude80 Post published!');
          text.value = '';
          loadPosts();
        } else {
          alert('Post failed: ' + (d.error || 'Unknown error'));
        }
      })
      .catch(function(e) { alert('Post failed: ' + e.message); });
    },

    schedulePost: function() {
      var text = document.getElementById('social-post-text');
      if (!text || !text.value.trim()) { alert('Write something first!'); return; }
      var dateStr = prompt('Schedule for (YYYY-MM-DD HH:MM):');
      if (!dateStr) return;
      state.scheduled.push({
        content: text.value,
        platforms: [].concat(state.selectedPlatforms),
        date: new Date(dateStr).toISOString(),
        status: 'scheduled'
      });
      alert('\ud83d\udcc5 Post scheduled!');
      text.value = '';
    },

    addMedia: function() { alert('\ud83d\uddbc\ufe0f Media upload coming soon! This will support images, videos, and GIFs.'); },
    addHashtags: function() { alert('# AI hashtag suggestions coming soon!'); },
    newCampaign: function() { alert('\ud83d\ude80 Campaign builder coming soon! Create multi-post campaigns across all platforms.'); },

    addCompany: function() {
      var name = prompt('Company name:');
      if (!name) return;
      fetch(API + '/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, platforms: ['twitter', 'linkedin'] })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) { loadCompanies(); setTimeout(function() { renderTabContent(); }, 500); })
      .catch(function(e) { alert('Error: ' + e.message); });
    },

    selectCompany: function(id) { state.selectedCompany = id; renderTabContent(); },

    editCompany: function(id) {
      var co = state.companies.find(function(c) { return c.id === id; });
      if (!co) return;
      var newName = prompt('New name:', co.name || co.companyName);
      if (!newName) return;
      fetch(API + '/api/companies/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      .then(function() { loadCompanies(); setTimeout(function() { renderTabContent(); }, 500); })
      .catch(function(e) { alert('Error: ' + e.message); });
    },

    deleteCompany: function(id) {
      if (!confirm('Delete this company?')) return;
      fetch(API + '/api/companies/' + id, { method: 'DELETE' })
      .then(function() { loadCompanies(); setTimeout(function() { renderTabContent(); }, 500); })
      .catch(function(e) { alert('Error: ' + e.message); });
    },

    testConnection: function(platform) {
      alert('\ud83e\uddea Testing ' + platform + ' connection...\n(API testing will be implemented with real endpoints)');
    },

    saveConnections: function() {
      var stored = {};
      document.querySelectorAll('.social-api-input').forEach(function(el) {
        var p = el.dataset.platform;
        var f = el.dataset.field;
        if (!stored[p]) stored[p] = {};
        stored[p][f] = el.value;
        if (el.value) stored[p].connected = true;
      });
      localStorage.setItem('pinky-social-apis', JSON.stringify(stored));
      alert('\u2705 Connections saved!');
      renderTabContent();
      // Refresh hero stats
      var container = document.getElementById('social-media-view');
      if (container) renderCommandCenter(container);
    }
  };
})();
