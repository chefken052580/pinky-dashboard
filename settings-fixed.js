/**
 * SETTINGS MANAGER - FIXED VERSION
 * Robust error handling, no blue screens
 */

class SettingsManagerFixed {
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
        twitter: { key: '', secret: '', enabled: false, connected: false },
        instagram: { token: '', enabled: false, connected: false },
        tiktok: { token: '', enabled: false, connected: false },
        linkedin: { token: '', enabled: false, connected: false },
        bluesky: { token: '', handle: '', enabled: false, connected: false },
        mastodon: { token: '', instance: '', enabled: false, connected: false },
        discord: { webhook: '', enabled: false, connected: false },
        telegram: { token: '', chatId: '', enabled: false, connected: false }
      },
      notifications: {
        desktop: true,
        email: false,
        taskComplete: true,
        errors: true
      },
      appearance: {
        theme: 'dark',
        accentColor: '#00d4ff'
      }
    };
    this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem('pinky-settings-v2');
      if (stored && typeof stored === 'string') {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          this.settings = Object.assign(this.settings, parsed);
        }
      }
    } catch (e) {
      console.warn('[Settings] Using defaults (storage unavailable or corrupted)');
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('pinky-settings-v2', JSON.stringify(this.settings));
      return true;
    } catch (e) {
      console.warn('[Settings] Could not save to storage');
      return false;
    }
  }

  updateAPI(platform, field, value) {
    if (this.settings.apis[platform]) {
      this.settings.apis[platform][field] = value;
      this.saveSettings();
    }
  }

  toggleAPI(platform) {
    if (this.settings.apis[platform]) {
      this.settings.apis[platform].enabled = !this.settings.apis[platform].enabled;
      this.saveSettings();
    }
  }

  testAPI(platform) {
    const api = this.settings.apis[platform];
    if (!api) return;
    
    console.log('[Settings] Testing ' + platform + '...');
    // Mark as connected for UI
    api.connected = true;
    this.saveSettings();
    alert('✓ ' + platform + ' connection test passed (mock)');
  }

  renderUI() {
    const container = document.getElementById('settings-content');
    if (!container) {
      console.warn('[Settings] Container not found');
      return;
    }

    try {
      let html = '<div class="settings-container">';
      
      // API Keys Section
      html += '<div class="settings-panel">';
      html += '<h3>🔑 Social Media APIs</h3>';
      html += '<div class="api-grid">';
      
      const platforms = [
        { id: 'twitter', icon: '𝕏', name: 'Twitter/X', fields: [{ k: 'key', label: 'API Key' }, { k: 'secret', label: 'API Secret' }] },
        { id: 'instagram', icon: '📸', name: 'Instagram/Meta', fields: [{ k: 'token', label: 'Business Account Token' }] },
        { id: 'tiktok', icon: '🎵', name: 'TikTok', fields: [{ k: 'token', label: 'Creator Token' }] },
        { id: 'linkedin', icon: '💼', name: 'LinkedIn', fields: [{ k: 'token', label: 'Access Token' }] },
        { id: 'bluesky', icon: '🌊', name: 'Bluesky', fields: [{ k: 'token', label: 'API Key' }, { k: 'handle', label: 'Handle' }] },
        { id: 'mastodon', icon: '🐘', name: 'Mastodon', fields: [{ k: 'token', label: 'Access Token' }, { k: 'instance', label: 'Instance URL' }] },
        { id: 'discord', icon: '💬', name: 'Discord', fields: [{ k: 'webhook', label: 'Webhook URL' }] },
        { id: 'telegram', icon: '✈️', name: 'Telegram', fields: [{ k: 'token', label: 'Bot Token' }, { k: 'chatId', label: 'Chat ID' }] }
      ];

      platforms.forEach(platform => {
        const api = this.settings.apis[platform.id] || {};
        const isConnected = api.connected ? ' connected' : '';
        
        html += '<div class="api-card' + isConnected + '">';
        html += '<div class="api-header">';
        html += '<span class="api-icon">' + platform.icon + '</span>';
        html += '<h4>' + platform.name + '</h4>';
        if (api.connected) html += '<span class="connected-badge">✓ Connected</span>';
        html += '</div>';
        
        platform.fields.forEach(field => {
          const val = api[field.k] || '';
          html += '<input type="text" placeholder="' + field.label + '" value="' + val + '" onchange="window.settingsManagerFixed.updateAPI(\'' + platform.id + '\', \'' + field.k + '\', this.value)" class="api-input">';
        });
        
        html += '<button class="test-btn" onclick="window.settingsManagerFixed.testAPI(\'' + platform.id + '\')">Test Connection</button>';
        html += '</div>';
      });
      
      html += '</div></div>';

      // Bot Config
      html += '<div class="settings-panel">';
      html += '<h3>🤖 Bot Configuration</h3>';
      
      Object.entries(this.settings.bots).forEach(([botName, config]) => {
        const icons = { docs: '📝', research: '🔍', code: '💻', social: '📱', business: '💼', filesystem: '📁', tasks: '🎯' };
        html += '<div class="bot-setting">';
        html += '<span>' + icons[botName] + ' ' + botName + '</span>';
        html += '<select onchange="window.settingsManagerFixed.setBotPriority(\'' + botName + '\', this.value)">';
        ['low', 'medium', 'high', 'critical'].forEach(p => {
          html += '<option value="' + p + '" ' + (config.priority === p ? 'selected' : '') + '>' + p + '</option>';
        });
        html += '</select>';
        html += '</div>';
      });
      
      html += '</div>';

      html += '</div>';
      container.innerHTML = html;
    } catch (e) {
      console.error('[Settings] Render error:', e);
      container.innerHTML = '<div style="color:red;padding:20px;"><strong>⚠️ Settings Error:</strong> ' + e.message + '</div>';
    }
  }

  setBotPriority(botName, priority) {
    if (this.settings.bots[botName]) {
      this.settings.bots[botName].priority = priority;
      this.saveSettings();
    }
  }
}

// Safe initialization
try {
  window.settingsManagerFixed = new SettingsManagerFixed();
  console.log('[Settings] Manager initialized successfully');
} catch (e) {
  console.error('[Settings] Initialization failed:', e);
  window.settingsManagerFixed = { renderUI: function() {
    const c = document.getElementById('settings-content');
    if (c) c.innerHTML = '<p style="color:red;">Settings unavailable</p>';
  }};
}
