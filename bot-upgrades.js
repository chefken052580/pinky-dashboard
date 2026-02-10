/**
 * BOT UPGRADES - Enhanced Dashboard
 * 
 * Features:
 * - Real Settings interface (API keys, notifications, appearance)
 * - Social Media Bot with multi-platform support
 * - Creative enhancements for all 7 bots
 */

// ===========================
// SETTINGS MANAGER
// ===========================

class SettingsManager {
  constructor() {
    this.settings = {
      bots: {
        docs: { enabled: true, priority: 'high' },
        research: { enabled: true, priority: 'high' },
        code: { enabled: true, priority: 'critical' },
        social: { enabled: true, priority: 'medium' },
        business: { enabled: true, priority: 'high' },
        filesystem: { enabled: true, priority: 'low' },
        tasks: { enabled: true, priority: 'high' }
      },
      apis: {
        twitter: { key: '', secret: '', enabled: false },
        instagram: { token: '', enabled: false },
        tiktok: { token: '', enabled: false },
        linkedin: { token: '', enabled: false },
        bluesky: { token: '', handle: '', enabled: false },
        mastodon: { token: '', instance: '', enabled: false },
        discord: { webhook: '', enabled: false },
        telegram: { token: '', chatId: '', enabled: false }
      },
      notifications: {
        desktop: true,
        email: false,
        taskComplete: true,
        errors: true,
        schedule: 'realtime'
      },
      appearance: {
        theme: 'dark',
        accentColor: '#00d4ff',
        fontSize: '16px'
      }
    };
    this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem('pinky-settings');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (e) {
      console.log('[Settings] Using defaults');
    }
  }

  saveSettings() {
    localStorage.setItem('pinky-settings', JSON.stringify(this.settings));
    return true;
  }

  getApiKey(platform) {
    return this.settings.apis[platform] || null;
  }

  setApiKey(platform, data) {
    this.settings.apis[platform] = data;
    this.saveSettings();
    return true;
  }

  isBotEnabled(botName) {
    return this.settings.bots[botName]?.enabled || false;
  }

  renderSettingsUI() {
    // DISABLED: settings-page.js now handles this
    return;

    let html = '<div class="settings-tabs">';
    
    // API Keys Section
    html += '<div class="settings-section">';
    html += '<h3>🔑 API Keys & Integrations</h3>';
    html += '<div class="api-grid">';
    
    const platforms = [
      { id: 'twitter', icon: '𝕏', name: 'Twitter/X', fields: ['key', 'secret'] },
      { id: 'instagram', icon: '📸', name: 'Instagram/Meta', fields: ['token'] },
      { id: 'tiktok', icon: '🎵', name: 'TikTok', fields: ['token'] },
      { id: 'linkedin', icon: '💼', name: 'LinkedIn', fields: ['token'] },
      { id: 'bluesky', icon: '🌊', name: 'Bluesky', fields: ['token', 'handle'] },
      { id: 'mastodon', icon: '🐘', name: 'Mastodon', fields: ['token', 'instance'] },
      { id: 'discord', icon: '💬', name: 'Discord', fields: ['webhook'] },
      { id: 'telegram', icon: '✈️', name: 'Telegram', fields: ['token', 'chatId'] }
    ];

    platforms.forEach(platform => {
      const api = this.settings.apis[platform.id];
      html += '<div class="api-card" data-platform="' + platform.id + '">';
      html += '<div class="api-header">';
      html += '<span class="api-icon">' + platform.icon + '</span>';
      html += '<h4>' + platform.name + '</h4>';
      html += '<label class="toggle">';
      html += '<input type="checkbox" ' + (api.enabled ? 'checked' : '') + ' onchange="window.settingsManager.toggleAPI(\'' + platform.id + '\')">';
      html += '<span class="toggle-slider"></span>';
      html += '</label>';
      html += '</div>';
      html += '<div class="api-inputs">';
      
      platform.fields.forEach(field => {
        const value = api[field] || '';
        html += '<input type="text" placeholder="' + field + '" class="api-input" data-field="' + field + '" value="' + value + '" onchange="window.settingsManager.updateAPI(\'' + platform.id + '\', \'' + field + '\', this.value)">';
      });
      
      html += '</div>';
      html += '<button class="api-test-btn" onclick="window.settingsManager.testAPI(\'' + platform.id + '\')">Test Connection</button>';
      html += '</div>';
    });
    
    html += '</div></div>';

    // Bot Configuration
    html += '<div class="settings-section">';
    html += '<h3>🤖 Bot Configuration</h3>';
    html += '<div class="bot-config-grid">';
    
    Object.entries(this.settings.bots).forEach(([botName, config]) => {
      const icons = { docs: '📝', research: '🔍', code: '💻', social: '📱', business: '💼', filesystem: '📁', tasks: '🎯' };
      html += '<div class="bot-config-card">';
      html += '<div class="bot-config-header">';
      html += '<span>' + icons[botName] + ' ' + botName.charAt(0).toUpperCase() + botName.slice(1) + '</span>';
      html += '<label class="toggle">';
      html += '<input type="checkbox" ' + (config.enabled ? 'checked' : '') + ' onchange="window.settingsManager.toggleBot(\'' + botName + '\')">';
      html += '<span class="toggle-slider"></span>';
      html += '</label>';
      html += '</div>';
      html += '<select class="priority-select" onchange="window.settingsManager.setPriority(\'' + botName + '\', this.value)">';
      html += '<option value="low" ' + (config.priority === 'low' ? 'selected' : '') + '>Low</option>';
      html += '<option value="medium" ' + (config.priority === 'medium' ? 'selected' : '') + '>Medium</option>';
      html += '<option value="high" ' + (config.priority === 'high' ? 'selected' : '') + '>High</option>';
      html += '<option value="critical" ' + (config.priority === 'critical' ? 'selected' : '') + '>Critical</option>';
      html += '</select>';
      html += '</div>';
    });
    
    html += '</div></div>';

    // Notifications
    html += '<div class="settings-section">';
    html += '<h3>🔔 Notifications</h3>';
    html += '<div class="notification-settings">';
    html += '<label class="setting-toggle">Desktop Notifications<input type="checkbox" ' + (this.settings.notifications.desktop ? 'checked' : '') + ' onchange="window.settingsManager.setSetting(\'notifications.desktop\', this.checked)"><span class="toggle-slider"></span></label>';
    html += '<label class="setting-toggle">Email Alerts<input type="checkbox" ' + (this.settings.notifications.email ? 'checked' : '') + ' onchange="window.settingsManager.setSetting(\'notifications.email\', this.checked)"><span class="toggle-slider"></span></label>';
    html += '<label class="setting-toggle">Task Complete<input type="checkbox" ' + (this.settings.notifications.taskComplete ? 'checked' : '') + ' onchange="window.settingsManager.setSetting(\'notifications.taskComplete\', this.checked)"><span class="toggle-slider"></span></label>';
    html += '<label class="setting-toggle">Error Alerts<input type="checkbox" ' + (this.settings.notifications.errors ? 'checked' : '') + ' onchange="window.settingsManager.setSetting(\'notifications.errors\', this.checked)"><span class="toggle-slider"></span></label>';
    html += '</div></div>';

    // Appearance
    html += '<div class="settings-section">';
    html += '<h3>🎨 Appearance</h3>';
    html += '<div class="appearance-settings">';
    html += '<label>Theme: <select onchange="window.settingsManager.setSetting(\'appearance.theme\', this.value)"><option value="dark" selected>Dark (Default)</option><option value="light">Light</option><option value="auto">Auto</option></select></label>';
    html += '<label>Accent Color: <input type="color" value="' + this.settings.appearance.accentColor + '" onchange="window.settingsManager.setSetting(\'appearance.accentColor\', this.value)"></label>';
    html += '</div></div>';

    html += '</div>';
    container.innerHTML = html;
  }

  toggleAPI(platform) {
    this.settings.apis[platform].enabled = !this.settings.apis[platform].enabled;
    this.saveSettings();
  }

  updateAPI(platform, field, value) {
    this.settings.apis[platform][field] = value;
    this.saveSettings();
  }

  testAPI(platform) {
    const api = this.settings.apis[platform];
    console.log('[Settings] Testing', platform, 'connection...');
    alert('Testing ' + platform + ' connection... (would verify API key)');
  }

  toggleBot(botName) {
    this.settings.bots[botName].enabled = !this.settings.bots[botName].enabled;
    this.saveSettings();
  }

  setPriority(botName, priority) {
    this.settings.bots[botName].priority = priority;
    this.saveSettings();
  }

  setSetting(path, value) {
    const parts = path.split('.');
    let obj = this.settings;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    this.saveSettings();
  }
}

// ===========================
// SOCIAL MEDIA BOT UPGRADES
// ===========================

// ===========================
// SOCIAL MEDIA BOT PRO - ENHANCED
// ===========================
class SocialMediaBotPro {
  constructor(settingsManager) {
    this.settings = settingsManager;
    this.companies = [];
    this.allPosts = [];
    this.currentTab = 'companies';
    this.selectedCompanies = [];
    this.postTemplates = {
      twitter: { charLimit: 280, hashtags: 3 },
      instagram: { charLimit: 2200, hashtags: 30 },
      tiktok: { charLimit: 2200, hashtags: 15 },
      linkedin: { charLimit: 3000, hashtags: 5 },
      bluesky: { charLimit: 300, hashtags: 5 },
      mastodon: { charLimit: 500, hashtags: 5 },
      discord: { charLimit: 4000 },
      telegram: { charLimit: 4096 }
    };
    this.loadCompanies();
    this.loadPosts();
  }

  loadCompanies() {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => {
        this.companies = data.companies || [];
        console.log('[SocialBot] Loaded', this.companies.length, 'companies');
      })
      .catch(err => console.error('[SocialBot] Company load error:', err));
  }

  loadPosts() {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => {
        this.allPosts = data.posts || [];
        console.log('[SocialBot] Loaded', this.allPosts.length, 'posts');
      })
      .catch(err => console.error('[SocialBot] Posts load error:', err));
  }

  getPlatformIcon(platform) {
    const icons = {
      twitter: '𝕏', instagram: '📸', tiktok: '🎵', linkedin: '💼',
      bluesky: '🌊', mastodon: '🐘', discord: '💬', telegram: '✈️'
    };
    return icons[platform] || '📱';
  }

  getCompanyColor(index) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    return colors[index % colors.length];
  }

  renderSocialUI() {
    const container = document.getElementById('social-content');
    if (!container) return;

    let html = '<div class="social-pro-interface" style="padding:20px;">';
    
    // Company Selector at top
    html += '<div style="margin-bottom:20px; padding:15px; background:var(--bg-card); border-radius:8px; border-left:3px solid #00d4ff;">';
    html += '<label style="display:block; margin-bottom:10px; font-weight:bold;">📦 Select Companies:</label>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:10px;">';
    
    this.companies.forEach((company, idx) => {
      const isSelected = this.selectedCompanies.includes(company.id);
      html += '<button style="' +
        'padding:8px 15px; ' +
        'background:' + (isSelected ? this.getCompanyColor(idx) : '#333') + '; ' +
        'color:white; ' +
        'border:2px solid ' + (isSelected ? this.getCompanyColor(idx) : '#555') + '; ' +
        'border-radius:20px; ' +
        'cursor:pointer; ' +
        'font-weight:' + (isSelected ? 'bold' : 'normal') + '; ' +
        'opacity:' + (isSelected ? '1' : '0.7') + '; ' +
        'transition:all 0.2s;" ' +
        'onclick="window.socialBot.toggleCompany(\'' + company.id + '\')">' +
        company.name +
      '</button>';
    });
    
    html += '</div>';
    html += '</div>';

    // Tabs
    html += '<div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:2px solid #333; flex-wrap:wrap;">';
    const tabs = [
      { id: 'companies', label: '🏢 Companies', icon: '📊' },
      { id: 'create', label: '✍️ Create Post', icon: '✏️' },
      { id: 'scheduled', label: '📅 Scheduled', icon: '⏰' },
      { id: 'history', label: '📜 History', icon: '📈' }
    ];
    
    tabs.forEach(tab => {
      const isActive = this.currentTab === tab.id;
      html += '<button style="' +
        'padding:10px 15px; ' +
        'background:none; ' +
        'color:' + (isActive ? '#00d4ff' : '#999') + '; ' +
        'border:none; ' +
        'border-bottom:3px solid ' + (isActive ? '#00d4ff' : 'transparent') + '; ' +
        'cursor:pointer; ' +
        'font-weight:' + (isActive ? 'bold' : 'normal') + '; ' +
        'transition:all 0.2s;" ' +
        'onclick="window.socialBot.switchTab(\'' + tab.id + '\')">' +
        tab.label +
      '</button>';
    });
    html += '</div>';

    // Tab Content
    if (this.currentTab === 'companies') {
      html += this.renderCompaniesTab();
    } else if (this.currentTab === 'create') {
      html += this.renderCreatePostTab();
    } else if (this.currentTab === 'scheduled') {
      html += this.renderScheduledTab();
    } else if (this.currentTab === 'history') {
      html += this.renderHistoryTab();
    }

    html += '</div>';
    container.innerHTML = html;
  }

  renderCompaniesTab() {
    let html = '<div class="companies-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:15px;">';
    
    if (this.companies.length === 0) {
      html += '<p style="color:#999; grid-column:1/-1;">No companies configured. Add companies in CompanyManager.</p>';
    } else {
      this.companies.forEach((company, idx) => {
        const platforms = company.platforms ? Object.keys(company.platforms) : [];
        html += '<div style="background:var(--bg-card); padding:15px; border-radius:8px; border-top:3px solid ' + this.getCompanyColor(idx) + ';">';
        html += '<h4 style="margin-top:0; color:' + this.getCompanyColor(idx) + ';">' + company.name + '</h4>';
        html += '<div style="font-size:0.9em; color:#999; margin-bottom:10px;">Platforms: ' + platforms.length + '</div>';
        html += '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:15px;">';
        
        platforms.forEach(p => {
          html += '<span style="background:#333; padding:4px 10px; border-radius:12px; font-size:0.85em;">' + this.getPlatformIcon(p) + ' ' + p + '</span>';
        });
        
        html += '</div>';
        html += '<button style="width:100%; padding:8px; background:#00d4ff; color:#000; border:none; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="window.socialBot.editCompany(\'' + company.id + '\')">';
        html += 'Edit Accounts';
        html += '</button>';
        html += '</div>';
      });
    }
    
    html += '</div>';
    return html;
  }

  renderCreatePostTab() {
    let html = '<div style="max-width:800px;">';
    html += '<div style="background:var(--bg-card); padding:15px; border-radius:8px; margin-bottom:15px;">';
    html += '<label style="display:block; margin-bottom:10px; font-weight:bold;">📝 Post Content:</label>';
    html += '<textarea id="social-content-text" placeholder="Write your post content here..." style="width:100%; height:150px; padding:10px; border-radius:4px; background:#0a0a0a; color:#fff; border:1px solid #333; font-family:monospace;" />';
    html += '</div>';

    html += '<div style="background:var(--bg-card); padding:15px; border-radius:8px; margin-bottom:15px;">';
    html += '<label style="display:block; margin-bottom:10px; font-weight:bold;">🎯 Platform Filter:</label>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
    
    const allPlatforms = ['twitter', 'instagram', 'tiktok', 'linkedin', 'bluesky', 'mastodon', 'discord', 'telegram'];
    allPlatforms.forEach(p => {
      // Only show platforms that selected companies support
      const isAvailable = this.selectedCompanies.length === 0 || 
        this.selectedCompanies.some(cId => {
          const company = this.companies.find(c => c.id === cId);
          return company && company.platforms && company.platforms[p];
        });
      
      if (!isAvailable) return;
      
      html += '<label style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:' + (isAvailable ? '#333' : '#222') + '; border-radius:4px; cursor:pointer;">';
      html += '<input type="checkbox" value="' + p + '" class="social-platform-check" style="cursor:pointer;" />';
      html += this.getPlatformIcon(p) + ' ' + p.charAt(0).toUpperCase() + p.slice(1);
      html += '</label>';
    });
    
    html += '</div>';
    html += '</div>';

    html += '<div style="background:var(--bg-card); padding:15px; border-radius:8px; margin-bottom:15px;">';
    html += '<label style="display:block; margin-bottom:10px; font-weight:bold;">⏰ Schedule:</label>';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
    html += '<div>';
    html += '<label style="display:block; font-size:0.9em; color:#999; margin-bottom:5px;">Date</label>';
    html += '<input type="date" id="social-schedule-date" style="width:100%; padding:8px; border-radius:4px; background:#0a0a0a; color:#fff; border:1px solid #333;" />';
    html += '</div>';
    html += '<div>';
    html += '<label style="display:block; font-size:0.9em; color:#999; margin-bottom:5px;">Time (optional)</label>';
    html += '<input type="time" id="social-schedule-time" style="width:100%; padding:8px; border-radius:4px; background:#0a0a0a; color:#fff; border:1px solid #333;" />';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
    html += '<button style="padding:12px; background:#00d464; color:#000; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:1em;" onclick="window.socialBot.scheduleNewPost()">📅 Schedule Post</button>';
    html += '<button style="padding:12px; background:#a8e6cf; color:#000; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:1em;" onclick="window.socialBot.publishImmediately()">🚀 Publish Now</button>';
    html += '</div>';
    html += '</div>';
    
    return html;
  }

  renderScheduledTab() {
    const scheduled = this.allPosts.filter(p => p.status === 'scheduled');
    
    let html = '<div style="display:grid; gap:15px;">';
    
    if (scheduled.length === 0) {
      html += '<p style="color:#999;">No scheduled posts. Create one in the Create Post tab.</p>';
    } else {
      scheduled.forEach(post => {
        html += '<div style="background:var(--bg-card); padding:15px; border-radius:8px; border-left:3px solid #ffd97d;">';
        html += '<div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">';
        html += '<div>';
        html += '<div style="font-weight:bold; margin-bottom:5px;">📅 ' + new Date(post.scheduledTime).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) + '</div>';
        html += '<div style="display:flex; gap:5px; flex-wrap:wrap;">';
        
        post.companies.forEach(companyId => {
          const company = this.companies.find(c => c.id === companyId);
          if (company) {
            html += '<span style="background:#333; padding:3px 8px; border-radius:12px; font-size:0.85em;">' + company.name + '</span>';
          }
        });
        
        html += '</div>';
        html += '<div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:8px;">';
        
        post.platforms.forEach(platform => {
          html += '<span style="background:#00d4ff; color:#000; padding:3px 8px; border-radius:12px; font-size:0.85em;">' + this.getPlatformIcon(platform) + '</span>';
        });
        
        html += '</div>';
        html += '</div>';
        html += '<button style="padding:6px 12px; background:#ff6464; border:none; border-radius:4px; cursor:pointer; color:white;" onclick="window.socialBot.cancelPost(\'' + post.id + '\')">✕ Cancel</button>';
        html += '</div>';
        html += '<div style="color:#aaa; word-break:break-word; max-height:100px; overflow:hidden;">' + post.content.substring(0, 200) + '...</div>';
        html += '</div>';
      });
    }
    
    html += '</div>';
    return html;
  }

  renderHistoryTab() {
    const history = this.allPosts.filter(p => p.status === 'posted' || p.status === 'failed');
    
    let html = '<div style="display:grid; gap:15px;">';
    
    if (history.length === 0) {
      html += '<p style="color:#999;">No post history yet. Posts will appear here after they are published.</p>';
    } else {
      history.forEach(post => {
        const bgColor = post.status === 'posted' ? '#1a3a1a' : '#3a1a1a';
        const borderColor = post.status === 'posted' ? '#00d464' : '#ff6464';
        
        html += '<div style="background:' + bgColor + '; padding:15px; border-radius:8px; border-left:3px solid ' + borderColor + ';">';
        html += '<div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">';
        html += '<div>';
        html += '<div style="font-weight:bold; margin-bottom:5px;">' + (post.status === 'posted' ? '✓ Posted' : '✗ Failed') + ' • ' + new Date(post.updatedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) + '</div>';
        html += '<div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px;">';
        
        post.companies.forEach(companyId => {
          const company = this.companies.find(c => c.id === companyId);
          if (company) {
            html += '<span style="background:#333; padding:3px 8px; border-radius:12px; font-size:0.85em;">' + company.name + '</span>';
          }
        });
        
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div style="color:#aaa; font-size:0.9em; max-height:80px; overflow:hidden;">' + post.content.substring(0, 150) + '...</div>';
        html += '</div>';
      });
    }
    
    html += '</div>';
    return html;
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    this.renderSocialUI();
  }

  toggleCompany(companyId) {
    const idx = this.selectedCompanies.indexOf(companyId);
    if (idx === -1) {
      this.selectedCompanies.push(companyId);
    } else {
      this.selectedCompanies.splice(idx, 1);
    }
    this.renderSocialUI();
  }

  async scheduleNewPost() {
    const content = document.getElementById('social-content-text')?.value;
    const dateStr = document.getElementById('social-schedule-date')?.value;
    const timeStr = document.getElementById('social-schedule-time')?.value;
    
    if (!content) {
      alert('Please enter post content');
      return;
    }
    
    if (!dateStr) {
      alert('Please select a date');
      return;
    }
    
    if (this.selectedCompanies.length === 0) {
      alert('Please select at least one company');
      return;
    }

    const platforms = Array.from(document.querySelectorAll('.social-platform-check:checked')).map(c => c.value);
    if (platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    const time = timeStr || '09:00';
    const scheduledTime = new Date(dateStr + 'T' + time).toISOString();

    try {
      const response = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          companies: this.selectedCompanies,
          platforms,
          scheduledTime
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Post scheduled successfully!');
        this.loadPosts();
        this.renderSocialUI();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      console.error('[SocialBot] Schedule error:', err);
      alert('Failed to schedule post: ' + err.message);
    }
  }

  async publishImmediately() {
    const content = document.getElementById('social-content-text')?.value;
    
    if (!content) {
      alert('Please enter post content');
      return;
    }
    
    if (this.selectedCompanies.length === 0) {
      alert('Please select at least one company');
      return;
    }

    const platforms = Array.from(document.querySelectorAll('.social-platform-check:checked')).map(c => c.value);
    if (platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    try {
      const response = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          companies: this.selectedCompanies,
          platforms,
          scheduledTime: null  // null = post now
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Post published immediately!');
        document.getElementById('social-content-text').value = '';
        this.loadPosts();
        this.renderSocialUI();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      console.error('[SocialBot] Publish error:', err);
      alert('Failed to publish post: ' + err.message);
    }
  }

  async cancelPost(postId) {
    if (!confirm('Cancel this post?')) return;

    try {
      const response = await fetch('/api/posts/' + postId, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        alert('Post cancelled');
        this.loadPosts();
        this.renderSocialUI();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      console.error('[SocialBot] Cancel error:', err);
      alert('Failed to cancel post: ' + err.message);
    }
  }

  editCompany(companyId) {
    alert('Edit company: ' + companyId + ' (switching to Settings tab would allow API key management)');
  }
}

// Initialize globally
window.settingsManager = new SettingsManager();
window.socialBot = new SocialMediaBotPro(window.settingsManager);

console.log('[BotUpgrades] Loaded - Settings Manager + SocialMediaBotPro');
