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
    const container = document.getElementById('settings-content');
    if (!container) return;

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

class SocialMediaBotPro {
  constructor(settingsManager) {
    this.settings = settingsManager;
    this.scheduledPosts = [];
    this.postTemplates = {
      twitter: { charLimit: 280, hashtags: 3, mentions: 5 },
      instagram: { charLimit: 2200, hashtags: 30, images: 1 },
      tiktok: { charLimit: 2200, hashtags: 15, videos: 1 },
      linkedin: { charLimit: 3000, hashtags: 5, images: 1 }
    };
  }

  generatePostForPlatform(platform, topic, style) {
    const templates = {
      twitter: 'Tweet about: ' + topic + ' (' + style + ' tone)',
      instagram: 'Instagram post: ' + topic + ' with hashtags and engagement hook',
      tiktok: 'TikTok script: ' + topic + ' (trending, viral)',
      linkedin: 'LinkedIn article: ' + topic + ' (professional, B2B)'
    };
    return templates[platform] || 'Post about: ' + topic;
  }

  schedulePost(platform, content, scheduledTime) {
    const post = {
      id: Date.now(),
      platform: platform,
      content: content,
      scheduledTime: scheduledTime,
      status: 'scheduled',
      created: new Date().toISOString()
    };
    this.scheduledPosts.push(post);
    return post;
  }

  publishPost(platform, content) {
    // Would integrate with actual platform API
    console.log('[SocialBot] Publishing to', platform, ':', content);
    return { success: true, postId: 'post_' + Date.now(), url: 'https://' + platform + '.com/post/' + Date.now() };
  }

  getAnalytics(platform) {
    return {
      totalPosts: Math.floor(Math.random() * 100),
      engagement: Math.floor(Math.random() * 50) + '%',
      reach: Math.floor(Math.random() * 10000),
      followers: Math.floor(Math.random() * 50000)
    };
  }

  renderSocialUI() {
    const container = document.getElementById('social-content');
    if (!container) return;

    let html = '<div class="social-pro-interface">';
    
    // Multi-platform post composer
    html += '<div class="post-composer">';
    html += '<h3>✨ AI Post Composer</h3>';
    html += '<textarea id="social-topic" placeholder="What do you want to post about?" rows="3" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px;"></textarea>';
    html += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">';
    html += '<select id="social-platform"><option value="">Select Platform(s)</option><option value="twitter">𝕏 Twitter</option><option value="instagram">📸 Instagram</option><option value="tiktok">🎵 TikTok</option><option value="linkedin">💼 LinkedIn</option></select>';
    html += '<select id="social-style"><option value="professional">Professional</option><option value="casual">Casual</option><option value="funny">Funny</option><option value="viral">Viral/Trending</option></select>';
    html += '</div>';
    html += '<div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">';
    html += '<button class="action-btn" onclick="window.socialBot.generatePost()">Generate Post</button>';
    html += '<button class="action-btn" onclick="window.socialBot.schedulePost()">Schedule Post</button>';
    html += '<button class="action-btn" onclick="window.socialBot.publishNow()">Publish Now</button>';
    html += '</div>';
    html += '</div>';

    // Scheduled posts queue
    html += '<div class="scheduled-queue">';
    html += '<h3>📅 Scheduled Posts (' + this.scheduledPosts.length + ')</h3>';
    html += '<div id="scheduled-list" style="max-height:400px; overflow-y:auto;">';
    
    if (this.scheduledPosts.length === 0) {
      html += '<p style="color:#999;">No scheduled posts. Create one above!</p>';
    } else {
      this.scheduledPosts.forEach(post => {
        html += '<div style="background:#1a1a2e; padding:15px; margin-bottom:10px; border-radius:8px; border-left:3px solid #00d4ff;">';
        html += '<div style="font-weight:bold; margin-bottom:5px;">' + post.platform.toUpperCase() + ' • ' + new Date(post.scheduledTime).toLocaleString() + '</div>';
        html += '<div style="color:#aaa; margin-bottom:10px; word-break:break-word;">' + post.content.substring(0, 100) + '...</div>';
        html += '<div style="display:flex; gap:10px;">';
        html += '<button onclick="window.socialBot.publishScheduled(' + post.id + ')" style="padding:5px 10px; background:#00d464; border:none; border-radius:4px; cursor:pointer;">Publish Now</button>';
        html += '<button onclick="window.socialBot.cancelScheduled(' + post.id + ')" style="padding:5px 10px; background:#ff6464; border:none; border-radius:4px; cursor:pointer;">Cancel</button>';
        html += '</div>';
        html += '</div>';
      });
    }
    
    html += '</div></div>';

    // Analytics
    html += '<div class="social-analytics">';
    html += '<h3>📊 Platform Analytics</h3>';
    html += '<div id="analytics-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">';
    html += '<div style="background:#1a1a2e; padding:15px; border-radius:8px; border-top:2px solid #00d4ff;"><div style="font-size:0.9em; color:#999;">Posts This Month</div><div style="font-size:2em; color:#00d4ff; font-weight:bold;" id="analytics-posts">0</div></div>';
    html += '<div style="background:#1a1a2e; padding:15px; border-radius:8px; border-top:2px solid #a8e6cf;"><div style="font-size:0.9em; color:#999;">Total Engagement</div><div style="font-size:2em; color:#a8e6cf; font-weight:bold;" id="analytics-engagement">0%</div></div>';
    html += '<div style="background:#1a1a2e; padding:15px; border-radius:8px; border-top:2px solid #ffd97d;"><div style="font-size:0.9em; color:#999;">Total Reach</div><div style="font-size:2em; color:#ffd97d; font-weight:bold;" id="analytics-reach">0</div></div>';
    html += '<div style="background:#1a1a2e; padding:15px; border-radius:8px; border-top:2px solid #ff9f9f;"><div style="font-size:0.9em; color:#999;">Followers</div><div style="font-size:2em; color:#ff9f9f; font-weight:bold;" id="analytics-followers">0</div></div>';
    html += '</div></div>';

    html += '</div>';
    container.innerHTML = html;
  }

  generatePost() {
    const topic = document.getElementById('social-topic')?.value || 'exciting update';
    const platform = document.getElementById('social-platform')?.value || 'twitter';
    const style = document.getElementById('social-style')?.value || 'professional';
    
    const post = this.generatePostForPlatform(platform, topic, style);
    alert('Generated ' + platform + ' post:\n\n' + post);
  }

  schedulePost() {
    const topic = document.getElementById('social-topic')?.value || 'post';
    alert('Schedule post: ' + topic + '\nWould show date/time picker');
  }

  publishNow() {
    const topic = document.getElementById('social-topic')?.value || 'update';
    alert('Publishing: ' + topic);
  }

  publishScheduled(postId) {
    const idx = this.scheduledPosts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      this.scheduledPosts[idx].status = 'published';
      this.renderSocialUI();
    }
  }

  cancelScheduled(postId) {
    this.scheduledPosts = this.scheduledPosts.filter(p => p.id !== postId);
    this.renderSocialUI();
  }
}

// Initialize globally
window.settingsManager = new SettingsManager();
window.socialBot = new SocialMediaBotPro(window.settingsManager);

console.log('[BotUpgrades] Loaded - Settings Manager + SocialMediaBotPro');
